import {
  __wbg_init
} from "./chunk-7UVFHDKZ.js";

// src/services/renderRelayHook.ts
var RELAY_RUNTIME_WASM_WEB_PATH = "/wasm/relay_runtime_pkg/relay_runtime_bg.wasm";
function relayRuntimeWasmUrl() {
  try {
    const path = new URL(import.meta.url).pathname;
    const m = path.match(/\/assets\/c\/([0-9a-f]{40})\//i);
    if (m?.[1]) {
      return `/wasm/c/${m[1]}/relay_runtime_pkg/relay_runtime_bg.wasm`;
    }
  } catch {
  }
  return RELAY_RUNTIME_WASM_WEB_PATH;
}
var initRelayPromise = null;
async function ensureRelayRuntimeInit() {
  if (!initRelayPromise) {
    initRelayPromise = __wbg_init({ module_or_path: relayRuntimeWasmUrl() });
  }
  await initRelayPromise;
}
async function mountRelayHookIntoElement(el, opts) {
  await ensureRelayRuntimeInit();
  const { renderHook, installRelayHostFetch } = await import("./relay-runtime-web-5CW5I6JQ.js");
  installRelayHostFetch();
  const raw = opts.hookPath ?? "hooks/client/get.jsx";
  const hookPath = raw.startsWith("/") ? raw.slice(1) : raw;
  const hydrate = opts.hydrate === true || el.dataset?.relaySsr === "1";
  await renderHook(el, {
    host: opts.host,
    hookPath,
    hydrate,
    branch: opts.branch,
    initialPath: opts.initialPath,
    themeYaml: opts.themeYaml
  });
}
function readEmbedConfig() {
  const cfgEl = document.getElementById("relay-embed-config");
  const raw = cfgEl?.textContent?.trim();
  if (!raw) {
    throw new Error("[embed] missing #relay-embed-config");
  }
  return JSON.parse(raw);
}
async function hydrateEmbedRoot(rootEl) {
  const cfg = readEmbedConfig();
  const host = typeof window !== "undefined" ? window.location.origin : "";
  const hookPath = cfg.clientHookPath || "/hooks/client/get.jsx";
  await mountRelayHookIntoElement(rootEl, {
    host,
    hookPath,
    hydrate: true,
    branch: cfg.branch || "",
    initialPath: cfg.initialPath || ""
  });
}
async function bootEmbedRoot(rootEl) {
  const cfg = readEmbedConfig();
  const host = typeof window !== "undefined" ? window.location.origin : "";
  const hookPath = cfg.clientHookPath || "/hooks/client/get.jsx";
  const hydrate = rootEl.dataset?.relaySsr === "1";
  rootEl.dataset.relayEmbed = "1";
  await mountRelayHookIntoElement(rootEl, {
    host,
    hookPath,
    hydrate,
    branch: cfg.branch || "",
    initialPath: cfg.initialPath || ""
  });
}

export {
  mountRelayHookIntoElement,
  readEmbedConfig,
  hydrateEmbedRoot,
  bootEmbedRoot
};
//# sourceMappingURL=chunk-7MEDVNC3.js.map
