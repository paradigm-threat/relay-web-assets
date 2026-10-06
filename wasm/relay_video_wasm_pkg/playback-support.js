/**
 * Pure helpers for @clevertree/relay-video-web (no WASM import — unit-testable).
 */

export const MAX_IN_MEMORY_DEMUX_BYTES = 96 * 1024 * 1024;

/** Stable error codes parks / UI can switch on. */
export const PlaybackErrorCode = Object.freeze({
  WASM_LOAD_FAILED: 'WASM_LOAD_FAILED',
  FETCH_FAILED: 'FETCH_FAILED',
  SOURCE_TOO_LARGE: 'SOURCE_TOO_LARGE',
  DEMUX_FAILED: 'DEMUX_FAILED',
  NO_VIDEO_TRACK: 'NO_VIDEO_TRACK',
  WEBCODECS_UNSUPPORTED: 'WEBCODECS_UNSUPPORTED',
  DECODE_FAILED: 'DECODE_FAILED',
  SEEK_FAILED: 'SEEK_FAILED',
  ENGINE_MISSING: 'ENGINE_MISSING',
  UNDERRUN: 'UNDERRUN',
  UNKNOWN: 'UNKNOWN',
});

const SPOKEN = Object.freeze({
  WASM_LOAD_FAILED:
    'This browser could not load the extended video engine. Switching to a compatibility stream.',
  FETCH_FAILED:
    'The video file could not be downloaded from this mirror. Trying another source.',
  SOURCE_TOO_LARGE:
    'Full-quality playback needs a streaming demuxer for this large file. Switching to 1080p for compatibility.',
  DEMUX_FAILED:
    'This file’s container could not be read. Switching to a compatibility stream.',
  NO_VIDEO_TRACK:
    'No playable video track was found in this file. Switching to a compatibility stream.',
  WEBCODECS_UNSUPPORTED:
    'Full quality needs hardware decode this browser does not provide. Switching to 1080p for compatibility.',
  DECODE_FAILED:
    'Video decode failed on this device. Switching to a compatibility stream.',
  SEEK_FAILED: 'Could not seek in this file. Continuing from the current position.',
  ENGINE_MISSING:
    'The extended video engine is missing from this site build. Switching to a compatibility stream.',
  UNDERRUN:
    'Playback could not keep up. Switching to a lower-bitrate compatibility stream.',
  UNKNOWN: 'Playback failed. Trying a compatibility stream.',
});

/**
 * @param {string} code
 * @param {string} [detail] technical detail for logs
 * @param {object} [extra]
 */
export function makePlaybackError(code, detail, extra) {
  const c = PlaybackErrorCode[code] ? code : PlaybackErrorCode.UNKNOWN;
  const userMessage = SPOKEN[c] || SPOKEN.UNKNOWN;
  const err = new Error(detail ? `${userMessage} (${detail})` : userMessage);
  err.code = c;
  err.userMessage = userMessage;
  if (extra && typeof extra === 'object') {
    Object.assign(err, extra);
  }
  return err;
}

/** Prefer err.userMessage; map known codes; never leak raw stack to UI. */
export function spokenMessageForError(err) {
  if (!err) return SPOKEN.UNKNOWN;
  if (err.userMessage && typeof err.userMessage === 'string') return err.userMessage;
  const code = err.code || '';
  if (SPOKEN[code]) return SPOKEN[code];
  const msg = String(err.message || err || '');
  if (/WebCodecs|isConfigSupported|VideoDecoder/i.test(msg)) return SPOKEN.WEBCODECS_UNSUPPORTED;
  if (/too large|SOURCE_TOO_LARGE/i.test(msg)) return SPOKEN.SOURCE_TOO_LARGE;
  if (/fetch|network|Failed to fetch|status 4|status 5/i.test(msg)) return SPOKEN.FETCH_FAILED;
  if (/demux|EBML|matroska/i.test(msg)) return SPOKEN.DEMUX_FAILED;
  if (/createWasmPlayer|ENGINE_MISSING|import/i.test(msg)) return SPOKEN.ENGINE_MISSING;
  return SPOKEN.UNKNOWN;
}

export function containerHintFromUrl(url) {
  const u = String(url || '')
    .split('?')[0]
    .toLowerCase();
  if (u.endsWith('.mkv') || u.endsWith('.mka') || u.endsWith('.mks')) return 'matroska';
  if (u.endsWith('.webm')) return 'webm';
  if (u.endsWith('.mp4') || u.endsWith('.m4v') || u.endsWith('.mov')) return 'mp4';
  return 'unknown';
}

export function nativeLikelySupports(url, videoEl) {
  const hint = containerHintFromUrl(url);
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

export function b64ToBytes(b64) {
  if (!b64) return new Uint8Array(0);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hevcCodecFromHvcC(desc) {
  // Minimal hvcC → hvc1.A.Lxx.BX string; fall back to a common Main@L4.1 profile.
  if (!desc || desc.length < 13) return 'hvc1.1.6.L93.B0';
  try {
    const generalProfileSpace = (desc[1] >> 6) & 3;
    const generalProfileIdc = desc[1] & 0x1f;
    const generalLevelIdc = desc[12];
    const tier = (desc[1] & 0x20) !== 0 ? 'H' : 'L';
    const space = ['', 'A', 'B', 'C'][generalProfileSpace] || '';
    const level = String(generalLevelIdc).padStart(2, '0');
    return `hvc1.${space}${generalProfileIdc}.6.${tier}${level}.B0`;
  } catch (_) {
    return 'hvc1.1.6.L93.B0';
  }
}

/** Map Matroska CodecID + private to WebCodecs VideoDecoderConfig. */
export function videoDecoderConfig(track) {
  if (!track) return null;
  const id = String(track.codec_id || '');
  const desc = track.codec_private_b64 ? b64ToBytes(track.codec_private_b64) : undefined;
  let codec = null;
  if (id.includes('AVC') || id.includes('avc')) {
    codec = 'avc1.42E01E';
    if (desc && desc.length > 3) {
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
    codec = hevcCodecFromHvcC(desc);
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
 * @returns {Promise<{ ok: boolean, reason?: string, code?: string, video?: object, audio?: object }>}
 */
export async function probeWebCodecsSupport(meta) {
  if (typeof VideoDecoder === 'undefined') {
    return {
      ok: false,
      code: PlaybackErrorCode.WEBCODECS_UNSUPPORTED,
      reason: 'WebCodecs VideoDecoder missing',
    };
  }
  const tracks = (meta && meta.tracks) || [];
  const vTrack = tracks.find((t) => t.kind === 'video');
  const aTrack = tracks.find((t) => t.kind === 'audio');
  if (!vTrack) {
    return { ok: false, code: PlaybackErrorCode.NO_VIDEO_TRACK, reason: 'no video track' };
  }
  const vCfg = videoDecoderConfig(vTrack);
  if (!vCfg) {
    return {
      ok: false,
      code: PlaybackErrorCode.WEBCODECS_UNSUPPORTED,
      reason: 'unsupported video codec id ' + (vTrack.codec_id || ''),
    };
  }
  try {
    const vs = await VideoDecoder.isConfigSupported(vCfg);
    if (!vs || !vs.supported) {
      return {
        ok: false,
        code: PlaybackErrorCode.WEBCODECS_UNSUPPORTED,
        reason: 'VideoDecoder rejects ' + vCfg.codec,
        video: vCfg,
      };
    }
  } catch (e) {
    return {
      ok: false,
      code: PlaybackErrorCode.WEBCODECS_UNSUPPORTED,
      reason: String(e && e.message ? e.message : e),
      video: vCfg,
    };
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

/** Format bytes for spoken status notes. */
export function formatBytesSpoken(n) {
  const x = Number(n) || 0;
  if (x < 1024) return x + ' B';
  if (x < 1024 * 1024) return (x / 1024).toFixed(1) + ' KB';
  if (x < 1024 * 1024 * 1024) return (x / (1024 * 1024)).toFixed(1) + ' MB';
  return (x / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

/** Content-Range total or Content-Length. */
export function parseTotalSizeFromHeaders(headers) {
  if (!headers || typeof headers.get !== 'function') return 0;
  const cr = String(headers.get('content-range') || headers.get('Content-Range') || '');
  const m = /\/(\d+)\s*$/.exec(cr);
  if (m) return Number(m[1]) || 0;
  return Number(headers.get('content-length') || headers.get('Content-Length') || 0) || 0;
}

/**
 * Resolve byte length without downloading the body.
 * Prefer Range bytes=0-0 — HEAD often hangs on Relay/IPFS gateways.
 */
export async function probeSourceByteLength(src, fetchImpl) {
  const fetchFn = fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (!fetchFn || !src) return 0;
  try {
    const r = await fetchFn(src, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      cache: 'no-store',
    });
    if (r && (r.ok || r.status === 206)) {
      const n = parseTotalSizeFromHeaders(r.headers);
      try {
        if (r.body && typeof r.body.cancel === 'function') r.body.cancel();
      } catch (_) {}
      if (n > 0) return n;
    }
  } catch (_) {}
  try {
    const head = await fetchFn(src, { method: 'HEAD', cache: 'no-store' });
    if (head && head.ok) {
      return Number(head.headers.get('content-length') || 0) || 0;
    }
  } catch (_) {}
  return 0;
}
