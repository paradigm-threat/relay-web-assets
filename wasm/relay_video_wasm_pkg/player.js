/**
 * @clevertree/relay-video-web — native-first escalate host for Relay video.
 * Demux via relay-video-wasm → WebCodecs → canvas + WebAudio.
 */

import init, {
  DemuxSession,
  container_hint_from_url,
} from './relay_video_wasm.js';

import {
  MAX_IN_MEMORY_DEMUX_BYTES,
  PlaybackErrorCode,
  makePlaybackError,
  spokenMessageForError,
  containerHintFromUrl,
  nativeLikelySupports as nativeLikelySupportsPure,
  b64ToBytes,
  videoDecoderConfig,
  audioDecoderConfig,
  probeWebCodecsSupport,
  formatBytesSpoken,
} from './playback-support.js';

export {
  MAX_IN_MEMORY_DEMUX_BYTES,
  PlaybackErrorCode,
  makePlaybackError,
  spokenMessageForError,
  containerHintFromUrl,
  videoDecoderConfig,
  audioDecoderConfig,
  probeWebCodecsSupport,
  formatBytesSpoken,
};

let wasmReady = null;

export function ensureWasm(wasmUrl) {
  if (!wasmReady) {
    wasmReady = Promise.resolve()
      .then(() => init(wasmUrl ? { module_or_path: wasmUrl } : undefined))
      .catch((e) => {
        wasmReady = null;
        throw makePlaybackError(
          PlaybackErrorCode.WASM_LOAD_FAILED,
          e && e.message ? e.message : String(e),
        );
      });
  }
  return wasmReady;
}

export function containerHint(url) {
  try {
    return container_hint_from_url(url || '');
  } catch (_) {
    return containerHintFromUrl(url);
  }
}

/** True when progressive HTML5 is likely to work without WASM demux. */
export function nativeLikelySupports(url, videoEl) {
  return nativeLikelySupportsPure(url, videoEl);
}

const MAX_DECODE_QUEUE = 8;
const DECODE_FAIL_THRESHOLD = 12;

/**
 * Mount WASM demux + WebCodecs player into container.
 * @returns {Promise<{ destroy, play, pause, seek, getCurrentTime, getDuration, engine: 'wasm', lastError }>}
 */
export async function createWasmPlayer(container, src, options = {}) {
  const opts = options || {};
  const onError = typeof opts.onError === 'function' ? opts.onError : null;
  const onTimeUpdate = typeof opts.onTimeUpdate === 'function' ? opts.onTimeUpdate : null;
  const onPlay = typeof opts.onPlay === 'function' ? opts.onPlay : null;
  const onPause = typeof opts.onPause === 'function' ? opts.onPause : null;
  const onEnded = typeof opts.onEnded === 'function' ? opts.onEnded : null;
  const onUnderrun = typeof opts.onUnderrun === 'function' ? opts.onUnderrun : null;
  const onStatus = typeof opts.onStatus === 'function' ? opts.onStatus : null;

  function status(msg) {
    if (onStatus) onStatus(msg);
  }

  function fail(code, detail, extra) {
    const err = makePlaybackError(code, detail, extra);
    if (onError) onError(err);
    return err;
  }

  status('Loading extended video engine…');
  try {
    await ensureWasm(opts.wasmUrl);
  } catch (e) {
    throw e.code ? e : makePlaybackError(PlaybackErrorCode.WASM_LOAD_FAILED, String(e));
  }

  let contentLen = 0;
  try {
    const head = await fetch(src, { method: 'HEAD' });
    if (head.ok) {
      contentLen = Number(head.headers.get('content-length') || 0);
      if (contentLen > MAX_IN_MEMORY_DEMUX_BYTES) {
        throw makePlaybackError(
          PlaybackErrorCode.SOURCE_TOO_LARGE,
          formatBytesSpoken(contentLen),
        );
      }
    }
  } catch (e) {
    if (e && e.code === PlaybackErrorCode.SOURCE_TOO_LARGE) throw e;
    // HEAD often blocked on IPFS gateways — continue with GET.
  }

  status(
    contentLen
      ? 'Downloading ' + formatBytesSpoken(contentLen) + ' for demux…'
      : 'Downloading video for demux…',
  );

  let res;
  try {
    res = await fetch(src, { headers: { Range: 'bytes=0-' } });
    if (res.status === 416 || (res.status >= 400 && res.status !== 206)) {
      res = await fetch(src);
    }
  } catch (e) {
    throw makePlaybackError(
      PlaybackErrorCode.FETCH_FAILED,
      e && e.message ? e.message : 'network error',
    );
  }
  if (!res.ok && res.status !== 206) {
    throw makePlaybackError(PlaybackErrorCode.FETCH_FAILED, 'HTTP ' + res.status);
  }

  let buf;
  try {
    buf = new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    throw makePlaybackError(
      PlaybackErrorCode.FETCH_FAILED,
      e && e.message ? e.message : 'read failed',
    );
  }
  if (buf.byteLength > MAX_IN_MEMORY_DEMUX_BYTES) {
    throw makePlaybackError(
      PlaybackErrorCode.SOURCE_TOO_LARGE,
      formatBytesSpoken(buf.byteLength),
    );
  }
  if (buf.byteLength < 64) {
    throw makePlaybackError(PlaybackErrorCode.FETCH_FAILED, 'empty or stub response');
  }

  status('Opening container…');
  let session;
  let meta;
  try {
    session = new DemuxSession(buf);
    meta = JSON.parse(session.meta_json());
  } catch (e) {
    throw makePlaybackError(
      PlaybackErrorCode.DEMUX_FAILED,
      e && e.message ? e.message : String(e),
    );
  }

  const probe = await probeWebCodecsSupport(meta);
  if (!probe.ok) {
    try {
      if (session.free) session.free();
    } catch (_) {}
    throw makePlaybackError(
      probe.code || PlaybackErrorCode.WEBCODECS_UNSUPPORTED,
      probe.reason,
      { probe },
    );
  }

  status('Starting decoder (' + (probe.video.codec || 'video') + ')…');

  const canvas = document.createElement('canvas');
  canvas.className = 'relay-video-player relay-video-player-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Video playback');
  canvas.width = probe.video.codedWidth || 640;
  canvas.height = probe.video.codedHeight || 360;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'contain';
  canvas.style.background = '#000';
  container.appendChild(canvas);
  const ctx2d = canvas.getContext('2d');

  let audioCtx = null;
  let playing = false;
  let destroyed = false;
  let pumpRunning = false;
  let currentTimeUs = 0;
  const durationUs = meta.duration_ns ? meta.duration_ns / 1000 : 0;
  let decodeFails = 0;
  let needKeyframe = true;
  let lastError = null;
  let playEpoch = 0;

  const videoDec = new VideoDecoder({
    output: (frame) => {
      try {
        if (destroyed) {
          frame.close();
          return;
        }
        ctx2d.drawImage(frame, 0, 0, canvas.width, canvas.height);
        currentTimeUs = frame.timestamp;
        if (onTimeUpdate) onTimeUpdate(currentTimeUs / 1e6, durationUs / 1e6);
      } finally {
        frame.close();
      }
    },
    error: (e) => {
      lastError = makePlaybackError(
        PlaybackErrorCode.DECODE_FAILED,
        e && e.message ? e.message : String(e),
      );
      playing = false;
      fail(PlaybackErrorCode.DECODE_FAILED, lastError.message);
    },
  });
  try {
    videoDec.configure(probe.video);
  } catch (e) {
    try {
      canvas.remove();
    } catch (_) {}
    try {
      if (session.free) session.free();
    } catch (_) {}
    throw makePlaybackError(
      PlaybackErrorCode.WEBCODECS_UNSUPPORTED,
      e && e.message ? e.message : 'configure failed',
      { video: probe.video },
    );
  }

  let audioDec = null;
  let audioStartMediaUs = null;
  let audioStartCtxTime = null;
  if (probe.audio) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioDec = new AudioDecoder({
        output: (audioData) => {
          try {
            if (!audioCtx || destroyed) return;
            const ch = audioData.numberOfChannels;
            const frames = audioData.numberOfFrames;
            const rate = audioData.sampleRate;
            const buffer = audioCtx.createBuffer(ch, frames, rate);
            for (let c = 0; c < ch; c++) {
              const plane = new Float32Array(frames);
              audioData.copyTo(plane, { planeIndex: c });
              buffer.copyToChannel(plane, c);
            }
            const srcNode = audioCtx.createBufferSource();
            srcNode.buffer = buffer;
            srcNode.connect(audioCtx.destination);
            const ts = audioData.timestamp;
            if (audioStartMediaUs == null) {
              audioStartMediaUs = ts;
              audioStartCtxTime = audioCtx.currentTime + 0.04;
            }
            const when =
              audioStartCtxTime + Math.max(0, (ts - audioStartMediaUs) / 1e6);
            srcNode.start(Math.max(when, audioCtx.currentTime));
          } finally {
            audioData.close();
          }
        },
        error: () => {
          // Audio is best-effort; keep video.
          try {
            if (audioDec) audioDec.close();
          } catch (_) {}
          audioDec = null;
        },
      });
      audioDec.configure(probe.audio);
    } catch (_) {
      audioDec = null;
    }
  }

  async function waitForDecodeBudget() {
    while (
      !destroyed &&
      playing &&
      videoDec.state === 'configured' &&
      videoDec.decodeQueueSize >= MAX_DECODE_QUEUE
    ) {
      await new Promise((r) => setTimeout(r, 4));
    }
  }

  async function pump(epoch) {
    if (pumpRunning) return;
    pumpRunning = true;
    try {
      while (playing && !destroyed && epoch === playEpoch) {
        let raw;
        try {
          raw = session.next_packet_json();
        } catch (e) {
          lastError = makePlaybackError(
            PlaybackErrorCode.DEMUX_FAILED,
            e && e.message ? e.message : String(e),
          );
          playing = false;
          fail(PlaybackErrorCode.DEMUX_FAILED, lastError.message);
          break;
        }
        if (raw == null) {
          playing = false;
          try {
            await videoDec.flush();
          } catch (_) {}
          if (onEnded) onEnded();
          break;
        }
        let pkt;
        try {
          pkt = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(String(raw));
        } catch (_) {
          continue;
        }
        const data = b64ToBytes(pkt.data_b64);
        if (pkt.kind === 'video' && videoDec.state !== 'closed') {
          if (needKeyframe && !pkt.keyframe) {
            continue;
          }
          if (needKeyframe && pkt.keyframe) needKeyframe = false;
          await waitForDecodeBudget();
          if (!playing || destroyed || epoch !== playEpoch) break;
          try {
            videoDec.decode(
              new EncodedVideoChunk({
                type: pkt.keyframe ? 'key' : 'delta',
                timestamp: pkt.timestamp_us,
                duration: pkt.duration_us || undefined,
                data,
              }),
            );
            decodeFails = 0;
          } catch (e) {
            decodeFails += 1;
            if (decodeFails >= DECODE_FAIL_THRESHOLD) {
              lastError = makePlaybackError(
                PlaybackErrorCode.UNDERRUN,
                e && e.message ? e.message : 'decode queue',
              );
              playing = false;
              if (onUnderrun) onUnderrun(lastError);
              else fail(PlaybackErrorCode.UNDERRUN, lastError.message);
              break;
            }
          }
        } else if (pkt.kind === 'audio' && audioDec && audioDec.state !== 'closed') {
          try {
            audioDec.decode(
              new EncodedAudioChunk({
                type: 'key',
                timestamp: pkt.timestamp_us,
                duration: pkt.duration_us || undefined,
                data,
              }),
            );
          } catch (_) {}
        }
        // Pace ~realtime for short clips; yield every packet.
        await new Promise((r) => setTimeout(r, 0));
      }
    } finally {
      pumpRunning = false;
    }
  }

  const api = {
    engine: 'wasm',
    meta,
    canvas,
    get lastError() {
      return lastError;
    },
    async play() {
      if (destroyed) return;
      playing = true;
      playEpoch += 1;
      const epoch = playEpoch;
      if (audioCtx && audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch (_) {}
      }
      audioStartMediaUs = null;
      audioStartCtxTime = null;
      status('');
      if (onPlay) onPlay();
      pump(epoch);
    },
    pause() {
      playing = false;
      if (onPause) onPause();
    },
    seek(seconds) {
      const us = Math.max(0, Math.floor(Number(seconds) * 1e6));
      try {
        session.seek_us(typeof BigInt === 'function' ? BigInt(us) : us);
        currentTimeUs = us;
        needKeyframe = true;
        audioStartMediaUs = null;
        audioStartCtxTime = null;
        try {
          videoDec.reset();
          videoDec.configure(probe.video);
        } catch (_) {}
      } catch (e) {
        lastError = makePlaybackError(
          PlaybackErrorCode.SEEK_FAILED,
          e && e.message ? e.message : String(e),
        );
        if (onError) onError(lastError);
      }
    },
    getCurrentTime() {
      return currentTimeUs / 1e6;
    },
    getDuration() {
      return durationUs / 1e6;
    },
    destroy() {
      destroyed = true;
      playing = false;
      playEpoch += 1;
      try {
        videoDec.close();
      } catch (_) {}
      try {
        if (audioDec) audioDec.close();
      } catch (_) {}
      try {
        if (audioCtx) audioCtx.close();
      } catch (_) {}
      try {
        if (session.free) session.free();
      } catch (_) {}
      try {
        canvas.remove();
      } catch (_) {}
    },
  };

  if (opts.autoPlay) await api.play();
  return api;
}

/**
 * High-level: try native <video>, else WASM escalate.
 */
export async function attachRelayVideo(shell, src, props = {}) {
  const url = src || '';
  const nativeOk = nativeLikelySupports(url);
  if (nativeOk) {
    const video = document.createElement('video');
    video.className = 'relay-video-player';
    video.setAttribute('playsinline', '');
    video.preload = 'metadata';
    video.src = url;
    video.controls = props.controls !== false;
    if (props.autoPlay) video.autoplay = true;
    if (props.muted) video.muted = true;
    shell.appendChild(video);
    return {
      engine: 'native',
      el: video,
      play: () => video.play(),
      pause: () => video.pause(),
      seek: (t) => {
        video.currentTime = t;
      },
      getCurrentTime: () => video.currentTime,
      getDuration: () => video.duration || 0,
      destroy: () => video.remove(),
    };
  }
  return createWasmPlayer(shell, url, props);
}
