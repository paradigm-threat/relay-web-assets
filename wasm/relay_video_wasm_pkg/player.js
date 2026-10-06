/**
 * @clevertree/relay-video-web — native-first escalate host for Relay video.
 * Demux via relay-video-wasm → WebCodecs → canvas + WebAudio.
 */

import init, {
  DemuxSession,
  container_hint_from_url,
} from './relay_video_wasm.js';

let wasmReady = null;

export function ensureWasm(wasmUrl) {
  if (!wasmReady) {
    wasmReady = init(wasmUrl ? { module_or_path: wasmUrl } : undefined);
  }
  return wasmReady;
}

export function containerHint(url) {
  try {
    return container_hint_from_url(url || '');
  } catch (_) {
    return 'unknown';
  }
}

/** True when progressive HTML5 is likely to work without WASM demux. */
export function nativeLikelySupports(url, videoEl) {
  const hint = containerHint(url);
  if (hint === 'matroska') return false;
  const v = videoEl || (typeof document !== 'undefined' ? document.createElement('video') : null);
  if (!v || !v.canPlayType) return hint === 'mp4' || hint === 'webm';
  if (hint === 'mp4') {
    const r = v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    return r === 'probably' || r === 'maybe';
  }
  if (hint === 'webm') {
    const r = v.canPlayType('video/webm; codecs="vp8, vorbis"');
    return r === 'probably' || r === 'maybe';
  }
  return false;
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Map Matroska CodecID + private to WebCodecs VideoDecoderConfig. */
export function videoDecoderConfig(track) {
  if (!track) return null;
  const id = String(track.codec_id || '');
  const desc = track.codec_private_b64 ? b64ToBytes(track.codec_private_b64) : undefined;
  let codec = null;
  if (id.includes('AVC') || id.includes('avc')) {
    // Prefer avcC description; codec string baseline when unknown
    codec = 'avc1.42E01E';
    if (desc && desc.length > 3) {
      // avcC: profile at [1]
      const profile = desc[1];
      const compat = desc[2];
      const level = desc[3];
      codec =
        'avc1.' +
        [profile, compat, level]
          .map((x) => x.toString(16).padStart(2, '0').toUpperCase())
          .join('');
    }
  } else if (id.includes('HEVC') || id.includes('HVC') || id.includes('hvc')) {
    codec = 'hvc1.1.6.L93.B0';
  } else if (id.includes('VP9')) {
    codec = 'vp09.00.10.08';
  } else if (id.includes('VP8')) {
    codec = 'vp8';
  } else {
    return null;
  }
  const cfg = {
    codec,
    codedWidth: track.width || 640,
    codedHeight: track.height || 360,
    // Do not force prefer-hardware: Linux Chrome often reports supported then fails decode.
  };
  if (desc && desc.byteLength) cfg.description = desc;
  return cfg;
}

export function audioDecoderConfig(track) {
  if (!track) return null;
  const id = String(track.codec_id || '');
  if (id.includes('AAC') || id.includes('MP4A')) {
    return {
      codec: 'mp4a.40.2',
      sampleRate: Math.round(track.sample_rate || 48000),
      numberOfChannels: track.channels || 2,
      description: track.codec_private_b64 ? b64ToBytes(track.codec_private_b64) : undefined,
    };
  }
  if (id.includes('OPUS')) {
    return {
      codec: 'opus',
      sampleRate: Math.round(track.sample_rate || 48000),
      numberOfChannels: track.channels || 2,
    };
  }
  return null;
}

/**
 * Probe WebCodecs support for tracks in meta JSON.
 * @returns {{ ok: boolean, reason?: string, video?: object, audio?: object }}
 */
export async function probeWebCodecsSupport(meta) {
  if (typeof VideoDecoder === 'undefined') {
    return { ok: false, reason: 'WebCodecs VideoDecoder missing' };
  }
  const tracks = (meta && meta.tracks) || [];
  const vTrack = tracks.find((t) => t.kind === 'video');
  const aTrack = tracks.find((t) => t.kind === 'audio');
  const vCfg = videoDecoderConfig(vTrack);
  if (!vCfg) return { ok: false, reason: 'unsupported video codec id' };
  try {
    const vs = await VideoDecoder.isConfigSupported(vCfg);
    if (!vs || !vs.supported) {
      return { ok: false, reason: 'VideoDecoder rejects ' + vCfg.codec, video: vCfg };
    }
  } catch (e) {
    return { ok: false, reason: String(e && e.message ? e.message : e), video: vCfg };
  }
  let aCfg = null;
  if (aTrack && typeof AudioDecoder !== 'undefined') {
    aCfg = audioDecoderConfig(aTrack);
    if (aCfg) {
      try {
        const as_ = await AudioDecoder.isConfigSupported(aCfg);
        if (!as_ || !as_.supported) aCfg = null;
      } catch (_) {
        aCfg = null;
      }
    }
  }
  return { ok: true, video: vCfg, audio: aCfg };
}

/**
 * Mount WASM demux + WebCodecs player into container.
 * @returns {{ destroy, play, pause, seek, getCurrentTime, getDuration, engine: 'wasm' }}
 */
/** v1 demux loads an assembled buffer; refuse multi‑GB masters until Range open lands. */
const MAX_IN_MEMORY_DEMUX_BYTES = 96 * 1024 * 1024;

export async function createWasmPlayer(container, src, options = {}) {
  const opts = options || {};
  await ensureWasm(opts.wasmUrl);
  try {
    const head = await fetch(src, { method: 'HEAD' });
    if (head.ok) {
      const len = Number(head.headers.get('content-length') || 0);
      if (len > MAX_IN_MEMORY_DEMUX_BYTES) {
        const err = new Error('source too large for in-memory demux; use compatibility MP4');
        err.code = 'SOURCE_TOO_LARGE';
        throw err;
      }
    }
  } catch (e) {
    if (e && e.code === 'SOURCE_TOO_LARGE') throw e;
  }
  // Prefer Range so mirrors that only answer 206 still work; fall back to full GET.
  let res = await fetch(src, { headers: { Range: 'bytes=0-' } });
  if (res.status === 416 || (res.status >= 400 && res.status !== 206)) {
    res = await fetch(src);
  }
  if (!res.ok && res.status !== 206) throw new Error('fetch failed ' + res.status);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_IN_MEMORY_DEMUX_BYTES) {
    const err = new Error('source too large for in-memory demux; use compatibility MP4');
    err.code = 'SOURCE_TOO_LARGE';
    throw err;
  }
  const session = new DemuxSession(buf);
  const meta = JSON.parse(session.meta_json());
  const probe = await probeWebCodecsSupport(meta);
  if (!probe.ok) {
    session.free && session.free();
    const err = new Error(probe.reason || 'WebCodecs unsupported');
    err.code = 'WEBCODECS_UNSUPPORTED';
    err.probe = probe;
    throw err;
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'relay-video-player relay-video-player-canvas';
  canvas.width = probe.video.codedWidth || 640;
  canvas.height = probe.video.codedHeight || 360;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'contain';
  canvas.style.background = '#000';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let audioCtx = null;
  let playing = false;
  let destroyed = false;
  let currentTimeUs = 0;
  const durationUs = meta.duration_ns ? meta.duration_ns / 1000 : 0;
  let underrunFrames = 0;
  const onError = typeof opts.onError === 'function' ? opts.onError : null;
  const onTimeUpdate = typeof opts.onTimeUpdate === 'function' ? opts.onTimeUpdate : null;
  const onPlay = typeof opts.onPlay === 'function' ? opts.onPlay : null;
  const onPause = typeof opts.onPause === 'function' ? opts.onPause : null;
  const onEnded = typeof opts.onEnded === 'function' ? opts.onEnded : null;
  const onUnderrun = typeof opts.onUnderrun === 'function' ? opts.onUnderrun : null;

  const videoDec = new VideoDecoder({
    output: (frame) => {
      try {
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
        currentTimeUs = frame.timestamp;
        if (onTimeUpdate) onTimeUpdate(currentTimeUs / 1e6, durationUs / 1e6);
      } finally {
        frame.close();
      }
    },
    error: (e) => {
      if (onError) onError(e);
    },
  });
  videoDec.configure(probe.video);

  let audioDec = null;
  if (probe.audio) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioDec = new AudioDecoder({
      output: (audioData) => {
        try {
          if (!audioCtx) return;
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
          const when = audioCtx.currentTime + 0.05;
          srcNode.start(when);
        } finally {
          audioData.close();
        }
      },
      error: () => {},
    });
    try {
      audioDec.configure(probe.audio);
    } catch (_) {
      audioDec = null;
    }
  }

  async function pump() {
    while (playing && !destroyed) {
      let raw;
      try {
        raw = session.next_packet_json();
      } catch (e) {
        if (onError) onError(e);
        playing = false;
        break;
      }
      if (raw == null) {
        playing = false;
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
        try {
          videoDec.decode(
            new EncodedVideoChunk({
              type: pkt.keyframe ? 'key' : 'delta',
              timestamp: pkt.timestamp_us,
              duration: pkt.duration_us || undefined,
              data,
            }),
          );
          underrunFrames = 0;
        } catch (e) {
          underrunFrames += 1;
          if (underrunFrames > 30 && onUnderrun) {
            onUnderrun(e);
            playing = false;
            break;
          }
        }
      } else if (pkt.kind === 'audio' && audioDec && audioDec.state !== 'closed') {
        try {
          audioDec.decode(
            new EncodedAudioChunk({
              type: pkt.keyframe ? 'key' : 'delta',
              timestamp: pkt.timestamp_us,
              duration: pkt.duration_us || undefined,
              data,
            }),
          );
        } catch (_) {}
      }
      // Yield to renderer
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const api = {
    engine: 'wasm',
    meta,
    canvas,
    async play() {
      if (destroyed) return;
      playing = true;
      if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
      if (onPlay) onPlay();
      pump();
    },
    pause() {
      playing = false;
      if (onPause) onPause();
    },
    seek(seconds) {
      const us = Math.max(0, Math.floor(seconds * 1e6));
      try {
        // wasm-bindgen u64 expects BigInt in modern bindings
        session.seek_us(typeof BigInt === 'function' ? BigInt(us) : us);
        currentTimeUs = us;
      } catch (e) {
        if (onError) onError(e);
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

  if (opts.autoPlay) api.play();
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
