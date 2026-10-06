/* tslint:disable */
/* eslint-disable */

/**
 * In-memory demux session (host supplies bytes via Range assembly or full fetch).
 */
export class DemuxSession {
    free(): void;
    [Symbol.dispose](): void;
    audio_track(): number | undefined;
    meta_json(): string;
    /**
     * Pull next packet as JSON string, or `null` at EOF.
     */
    next_packet_json(): any;
    constructor(data: Uint8Array);
    /**
     * Seek using Matroska timestamp ticks (same unit as Frame.timestamp).
     */
    seek_ticks(ticks: bigint): void;
    /**
     * Seek to media time in microseconds.
     */
    seek_us(us: bigint): void;
    video_track(): number | undefined;
}

export function container_hint_from_url(url: string): string;

export function start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_demuxsession_free: (a: number, b: number) => void;
    readonly container_hint_from_url: (a: number, b: number) => [number, number];
    readonly demuxsession_audio_track: (a: number) => number;
    readonly demuxsession_meta_json: (a: number) => [number, number, number, number];
    readonly demuxsession_next_packet_json: (a: number) => [number, number, number];
    readonly demuxsession_open: (a: number, b: number) => [number, number, number];
    readonly demuxsession_seek_ticks: (a: number, b: bigint) => [number, number];
    readonly demuxsession_seek_us: (a: number, b: bigint) => [number, number];
    readonly demuxsession_video_track: (a: number) => number;
    readonly start: () => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
