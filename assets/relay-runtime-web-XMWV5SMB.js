import {
  __wbg_init,
  consume_render_requested,
  get_current_theme_name,
  get_injected_css,
  get_themes,
  invoke_handler,
  push_message_from_host,
  run_hook_with_host,
  set_client_live,
  set_theme_and_render
} from "./chunk-QZUDJNU4.js";
import "./chunk-RPGBVRDM.js";

// src/vendor/relay-runtime-web.js
var _styleId = "relay-ssr-theme";
function styleParentFor(container) {
  if (container && typeof container.getRootNode === "function") {
    const root = container.getRootNode();
    if (root && typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot) {
      return root;
    }
  }
  return typeof document !== "undefined" ? document.head : null;
}
function themeTargetFor(container) {
  if (container && typeof container.getRootNode === "function") {
    const root = container.getRootNode();
    if (root && typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot) {
      return container.closest?.('[data-relay-theme-scope="hook"]') || root.querySelector?.('[data-relay-theme-scope="hook"]') || container;
    }
  }
  return typeof document !== "undefined" ? document.documentElement : null;
}
function ensureStyleElement(id, parent) {
  if (typeof document === "undefined" || !parent) return null;
  let el = parent.querySelector ? parent.querySelector(`#${id}`) : null;
  if (!el && parent === document.head) {
    el = document.getElementById(id);
  }
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    if (parent === document.head) parent.appendChild(el);
    else parent.insertBefore(el, parent.firstChild);
  }
  return el;
}
function applyInjectedCss(container) {
  try {
    const css = typeof get_injected_css === "function" ? get_injected_css() : "";
    if (css && String(css).trim()) {
      const styleEl = ensureStyleElement(_styleId, styleParentFor(container));
      if (styleEl) styleEl.textContent = String(css);
    }
  } catch (_) {
  }
  syncHtmlThemeClass(themeTargetFor(container));
}
function syncHtmlThemeClass(target) {
  if (typeof document === "undefined") return;
  const root = target || document.documentElement;
  let tip = "";
  try {
    tip = String(root.getAttribute("data-pt-theme") || "").trim();
  } catch (_) {
    tip = "";
  }
  if (tip === "light" || tip === "dark") {
    try {
      root.setAttribute("class", tip);
    } catch (_) {
      try {
        root.classList.remove("light", "dark");
        root.classList.add(tip);
      } catch (_2) {
      }
    }
    return;
  }
  let name = "";
  try {
    if (typeof get_current_theme_name === "function") {
      name = String(get_current_theme_name() || "").trim();
    }
  } catch (_) {
    return;
  }
  if (name !== "light" && name !== "dark") return;
  root.classList.remove("light", "dark");
  root.classList.add(name);
}
function syncHtmlHydratedAttr(live) {
  if (typeof document === "undefined") return;
  try {
    const root = document.documentElement;
    if (!root || typeof root.setAttribute !== "function") return;
    root.setAttribute("data-pt-hydrated", live ? "1" : "0");
  } catch (_) {
  }
}
var unitlessStyleProperties = /* @__PURE__ */ new Set([
  "animationIterationCount",
  "columnCount",
  "fillOpacity",
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "gridColumn",
  "gridRow",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "scale",
  "strokeOpacity",
  "strokeWidth",
  "tabSize",
  "widows",
  "zIndex",
  "zoom"
]);
function normalizeStyleValue(property, value) {
  const stringValue = String(value).trim();
  if (stringValue === "" || property.startsWith("--") || unitlessStyleProperties.has(property) || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(stringValue) || Number(stringValue) === 0) {
    return stringValue;
  }
  return `${stringValue}px`;
}
var SVG_NS = "http://www.w3.org/2000/svg";
var SVG_TAGS = /* @__PURE__ */ new Set([
  "svg",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  "g",
  "defs",
  "use",
  "symbol",
  "text",
  "tspan",
  "clippath",
  "mask",
  "lineargradient",
  "radialgradient",
  "stop",
  "foreignobject",
  "image",
  "marker",
  "pattern",
  "title",
  "desc"
]);
var SVG_TAG_NAME = {
  clippath: "clipPath",
  lineargradient: "linearGradient",
  radialgradient: "radialGradient",
  foreignobject: "foreignObject"
};
function createVnodeDomElement(tag) {
  const lower = String(tag || "").toLowerCase();
  if (SVG_TAGS.has(lower)) {
    return document.createElementNS(SVG_NS, SVG_TAG_NAME[lower] || lower);
  }
  return document.createElement(tag);
}
function setVnodeDomAttribute(el, key, str) {
  if (key === "className") {
    if (el.namespaceURI === SVG_NS) el.setAttribute("class", str);
    else el.className = str;
    return;
  }
  if (key.startsWith("data") && key.length > 4) {
    const attr = "data-" + key.slice(4).replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
    el.setAttribute(attr, str);
    return;
  }
  el.setAttribute(key, str);
}
function applyVnodeDomProps(el, tag, props, invokeHandler, onAfterInvoke) {
  if (!props) return;
  const relayControlled = propBoolFromVnodeProps(props, "relayControlled");
  for (const [k, val] of Object.entries(props)) {
    if (val && typeof val === "object" && (val.type === "Handler" || val.type === "HandlerId") && typeof val.value === "number") {
      const eventType = k.startsWith("on") ? k.slice(2).toLowerCase() : k;
      if (tag === "a" && eventType === "click" && !relayControlled) {
        continue;
      }
      const handlerId = val.value;
      el.addEventListener(eventType, (e) => {
        if (tag === "a" && eventType === "click" && relayControlled) {
          if (!shouldInterceptRelayControlledAnchorClick(e, el)) return;
          e.preventDefault();
        }
        try {
          invokeHandler(handlerId);
        } catch (err) {
          console.error("[relay-runtime] Handler invocation failed:", err);
          throw err;
        }
        if (onAfterInvoke && consume_render_requested()) onAfterInvoke();
      });
      continue;
    }
    if (k === "style") {
      const styleObj = val && typeof val === "object" && val.type === "Style" ? val.value : val;
      if (styleObj && typeof styleObj === "object") {
        for (const [pk, pv] of Object.entries(styleObj)) {
          if (pv != null && typeof pv !== "object") {
            el.style[pk] = normalizeStyleValue(pk, pv);
          }
        }
      }
      continue;
    }
    if (val && typeof val === "object" && val.type === "Bool") {
      if (val.value) setVnodeDomAttribute(el, k, "");
      else if (k === "disabled" || k === "checked" || k === "selected" || k === "readOnly") {
        el[k === "readOnly" ? "readOnly" : k] = false;
      }
      continue;
    }
    if (typeof val === "boolean") {
      if (val) setVnodeDomAttribute(el, k, "");
      continue;
    }
    const str = val && typeof val === "object" && val.type === "String" && val.value !== void 0 ? val.value : typeof val === "string" ? val : val && typeof val === "object" && val.type === "Number" && val.value !== void 0 ? String(val.value) : typeof val === "number" ? String(val) : null;
    if (str != null) setVnodeDomAttribute(el, k, str);
  }
}
function appendVnodeDomChildren(el, props, children, invokeHandler, onAfterInvoke) {
  if (!children || !Array.isArray(children)) return;
  const parentStyle = props?.style?.value ?? props?.style ?? {};
  const isRow = parentStyle.flexDirection === "row" || !parentStyle.flexDirection && parentStyle.display === "flex";
  const spacing = isRow ? parentStyle.spaceX ?? parentStyle.gap : parentStyle.spaceY ?? parentStyle.gap;
  for (let i = 0; i < children.length; i++) {
    const child = vnodeToDom(children[i], invokeHandler, onAfterInvoke);
    if (child) {
      if (i > 0 && spacing != null && child.style) {
        const px = typeof spacing === "number" ? spacing + "px" : String(spacing);
        child.style[isRow ? "marginLeft" : "marginTop"] = px;
      }
      el.appendChild(child);
    }
  }
}
function installRelayHostFetch() {
  if (typeof globalThis === "undefined") return;
  if (typeof globalThis.__relay_host_fetch === "function") return;
  globalThis.__relay_host_fetch = (url, initJson) => {
    let method = "GET";
    let headers = null;
    let body = null;
    let responseType = "";
    try {
      if (initJson && String(initJson).length) {
        const o = JSON.parse(String(initJson));
        if (o && o.method) method = String(o.method).toUpperCase();
        if (o && o.headers && typeof o.headers === "object") headers = o.headers;
        if (o && typeof o.body === "string") body = o.body;
        if (o && typeof o.responseType === "string") responseType = o.responseType;
      }
    } catch {
    }
    let fetchUrl = String(url ?? "");
    if (fetchUrl && !/^https?:\/\//i.test(fetchUrl)) {
      const base = globalThis.__relay_fetch_base_url;
      if (typeof base === "string" && base.trim()) {
        try {
          const baseNorm = base.trim().replace(/\/+$/, "") + "/";
          fetchUrl = new URL(fetchUrl, baseNorm).href;
        } catch {
        }
      }
    }
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, fetchUrl, false);
      const wantBase64 = responseType === "base64" || responseType === "arraybuffer";
      if (wantBase64) xhr.responseType = "arraybuffer";
      const branch = globalThis.__relay_fetch_branch;
      if (typeof branch === "string" && branch.trim()) {
        xhr.setRequestHeader("X-Relay-Branch", branch.trim());
      }
      if (headers) {
        for (const [k, v] of Object.entries(headers)) {
          if (v == null) continue;
          xhr.setRequestHeader(String(k), String(v));
        }
      }
      if (body != null && method !== "GET" && method !== "HEAD") {
        if (!headers || headers["Content-Type"] == null && headers["content-type"] == null) {
          xhr.setRequestHeader("Content-Type", "application/json");
        }
        xhr.send(body);
      } else {
        xhr.send(null);
      }
      const ok = xhr.status >= 200 && xhr.status < 300;
      if (wantBase64) {
        const buf = xhr.response;
        let b64 = "";
        if (buf && buf.byteLength != null) {
          const bytes = new Uint8Array(buf);
          const chunk = 32768;
          let binary = "";
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
          }
          b64 = btoa(binary);
        }
        const ct = xhr.getResponseHeader("Content-Type") || "application/octet-stream";
        return JSON.stringify({
          ok,
          status: xhr.status,
          text: "",
          base64: b64,
          contentType: ct
        });
      }
      return JSON.stringify({
        ok,
        status: xhr.status,
        text: xhr.responseText != null ? String(xhr.responseText) : ""
      });
    } catch (e) {
      return JSON.stringify({
        ok: false,
        status: 0,
        text: "",
        error: String(e?.message ?? e)
      });
    }
  };
}
function setRelayFetchBaseUrl(baseUrl) {
  if (typeof globalThis === "undefined") return;
  const b = (baseUrl ?? "").trim().replace(/\/+$/, "");
  globalThis.__relay_fetch_base_url = b || void 0;
}
function setRelayFetchBranch(branch) {
  if (typeof globalThis === "undefined") return;
  const b = (branch ?? "").trim();
  globalThis.__relay_fetch_branch = b || void 0;
}
async function fetchThemeYamlForHost(baseDir, branch) {
  const paths = [
    "hooks/client/theme.yaml",
    "theme.yaml",
    "hooks/theme.yaml"
  ];
  const headers = {};
  if (branch) headers["X-Relay-Branch"] = branch;
  for (const p of paths) {
    try {
      const resp = await fetch(resolveHookUrl(baseDir, p) + "?t=" + Date.now(), { headers });
      if (resp.ok) {
        const text = await resp.text();
        if (text && text.trim()) return text;
      }
    } catch {
    }
  }
  return "";
}
function localImportSpecs(source) {
  const out = [];
  let rest = String(source ?? "");
  while (true) {
    const idx = rest.indexOf(" from ");
    if (idx === -1) break;
    const after = rest.slice(idx + 6).trimStart();
    let q = "";
    if (after.startsWith("'")) q = "'";
    else if (after.startsWith('"')) q = '"';
    else {
      rest = rest.slice(idx + 6);
      continue;
    }
    const body = after.slice(1);
    const end = body.indexOf(q);
    if (end === -1) break;
    const spec = body.slice(0, end);
    if (spec.startsWith("hooks/") || spec.startsWith("./") || spec.startsWith("../") || spec.endsWith(".jsx") || spec.endsWith(".js") || spec.endsWith(".yaml") || spec.endsWith(".yml")) {
      out.push(spec);
    }
    rest = body.slice(end + 1);
  }
  return out;
}
function resolveImportRel(importer, spec) {
  const s = String(spec ?? "");
  if (s.startsWith("hooks/") || !s.startsWith(".")) {
    return s.replace(/^\/+/, "");
  }
  const imp = String(importer ?? "").replace(/^\/+/, "");
  const slash = imp.lastIndexOf("/");
  const base = slash === -1 ? "" : imp.slice(0, slash);
  const joined = (base ? `${base}/` : "") + s;
  const parts = [];
  for (const c of joined.split("/")) {
    if (c === "..") parts.pop();
    else if (c && c !== ".") parts.push(c);
  }
  return parts.join("/");
}
function putModuleInMap(moduleMap, pathKey, text) {
  const k = String(pathKey ?? "").trim();
  if (!k || typeof text !== "string") return;
  if (!looksLikeHookSource(text)) return;
  const rel = k.replace(/^\/+/, "");
  moduleMap[rel] = text;
  moduleMap[`/${rel}`] = text;
  if (k !== rel && k !== `/${rel}`) moduleMap[k] = text;
}
function looksLikeHookSource(text) {
  const t = String(text ?? "").trimStart();
  if (!t) return false;
  const head = t.slice(0, 64).toLowerCase();
  if (head.startsWith("<!doctype") || head.startsWith("<html")) return false;
  return true;
}
function moduleMapHas(moduleMap, rel) {
  const r = String(rel ?? "").replace(/^\/+/, "");
  return Object.prototype.hasOwnProperty.call(moduleMap, r) || Object.prototype.hasOwnProperty.call(moduleMap, `/${r}`);
}
var IMPORT_CLOSURE_MAX_MODULES = 256;
async function preloadImportClosure(moduleMap, fetchSource, onLoaded) {
  const seen = /* @__PURE__ */ new Set();
  let frontier = Object.keys(moduleMap).filter((k) => !k.startsWith("/"));
  while (frontier.length) {
    if (moduleCount(moduleMap) >= IMPORT_CLOSURE_MAX_MODULES) {
      console.warn("[relay-runtime] import closure hit", IMPORT_CLOSURE_MAX_MODULES, "module cap");
      break;
    }
    const toFetch = [];
    const queued = /* @__PURE__ */ new Set();
    for (const path of frontier) {
      if (seen.has(path)) continue;
      seen.add(path);
      const src = moduleMap[path];
      if (typeof src !== "string") continue;
      for (const spec of localImportSpecs(src)) {
        const rel = resolveImportRel(path, spec);
        if (!rel || moduleMapHas(moduleMap, rel) || queued.has(rel)) continue;
        queued.add(rel);
        toFetch.push(rel);
      }
    }
    if (toFetch.length === 0) break;
    const nextFrontier = [];
    await Promise.all(
      toFetch.map(async (rel) => {
        if (moduleMapHas(moduleMap, rel)) return;
        if (moduleCount(moduleMap) >= IMPORT_CLOSURE_MAX_MODULES) return;
        let body = null;
        try {
          body = await fetchSource(rel);
        } catch (err) {
          console.warn("[relay-runtime] import closure fetch error:", rel, err);
          return;
        }
        if (typeof body !== "string" || !looksLikeHookSource(body)) return;
        putModuleInMap(moduleMap, rel, body);
        if (!moduleMapHas(moduleMap, rel)) return;
        nextFrontier.push(rel);
        if (typeof onLoaded === "function") onLoaded(rel);
      })
    );
    frontier = nextFrontier;
  }
  return moduleMap;
}
function moduleCount(moduleMap) {
  return Object.keys(moduleMap).filter((k) => !k.startsWith("/")).length;
}
function resolveMediaUrl(url) {
  const u = String(url ?? "").trim();
  if (!u) return u;
  if (/^https?:\/\//i.test(u) || /^blob:/i.test(u) || /^data:/i.test(u)) return u;
  const base = globalThis.__relay_fetch_base_url;
  if (typeof base === "string" && base.trim()) {
    try {
      return new URL(u, base.trim().replace(/\/+$/, "") + "/").href;
    } catch {
      return u;
    }
  }
  return u;
}
function propStringFromVnodeProps(props, key) {
  const val = props && props[key];
  if (val && typeof val === "object" && val.type === "String") return val.value;
  if (typeof val === "string") return val;
  return null;
}
function propBoolFromVnodePropsLoose(props, key) {
  const val = props && props[key];
  if (val && typeof val === "object" && val.type === "Bool") return !!val.value;
  if (typeof val === "boolean") return val;
  return null;
}
function propNumberFromVnodeProps(props, key) {
  const val = props && props[key];
  if (val && typeof val === "object" && val.type === "Number") return val.value;
  if (typeof val === "number") return val;
  return null;
}
function srtToVtt(srt) {
  let body = String(srt).replace(/\r/g, "").trim();
  if (body.startsWith("WEBVTT")) return body;
  body = body.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return "WEBVTT\n\n" + body;
}
function fetchTextSync(url) {
  if (typeof globalThis.__relay_host_fetch !== "function") return null;
  try {
    const raw = globalThis.__relay_host_fetch(url, "{}");
    const j = JSON.parse(raw);
    if (j && j.ok && typeof j.text === "string") return j.text;
  } catch {
  }
  return null;
}
function attachMediaHandler(el, eventName, props, key, invokeHandler, onAfterInvoke, payloadFn) {
  const val = props && props[key];
  if (!val || typeof val !== "object" || val.type !== "HandlerId" || typeof val.value !== "number") return;
  const handlerId = val.value;
  el.addEventListener(eventName, () => {
    try {
      if (payloadFn) {
        const payload = payloadFn();
        if (payload !== void 0) {
          push_message_from_host(
            JSON.stringify({ type: "relay-video", event: key, handlerId, ...payload })
          );
        }
      }
      invokeHandler(handlerId);
    } catch (err) {
      console.error("[relay-runtime] video handler failed:", err);
    }
    if (onAfterInvoke && consume_render_requested()) onAfterInvoke();
  });
}
function buildRelayAudioPlayer(props, invokeHandler, onAfterInvoke) {
  const audio = document.createElement("audio");
  audio.className = "relay-audio-player";
  audio.setAttribute("preload", "auto");
  audio.style.display = "none";
  const src = resolveMediaUrl(propStringFromVnodeProps(props, "src"));
  if (src) audio.src = src;
  const controls = propBoolFromVnodePropsLoose(props, "controls");
  if (controls === true) {
    audio.controls = true;
    audio.style.display = "block";
  }
  const playerId = propStringFromVnodeProps(props, "playerId") || `rap-${Math.random().toString(36).slice(2)}`;
  audio.dataset.relayPlayerId = playerId;
  attachMediaHandler(audio, "play", props, "onPlay", invokeHandler, onAfterInvoke);
  attachMediaHandler(audio, "pause", props, "onPause", invokeHandler, onAfterInvoke);
  attachMediaHandler(audio, "ended", props, "onEnded", invokeHandler, onAfterInvoke);
  attachMediaHandler(audio, "error", props, "onError", invokeHandler, onAfterInvoke);
  const playing = propBoolFromVnodePropsLoose(props, "playing");
  if (playing === true) {
    audio.play().catch(() => {
    });
  } else if (playing === false) {
    audio.pause();
  }
  const rate = propNumberFromVnodeProps(props, "playbackRate");
  if (rate != null && !Number.isNaN(rate)) audio.playbackRate = rate;
  const cmdSeq = propNumberFromVnodeProps(props, "commandSeq");
  const cmd = propNumberFromVnodeProps(props, "command");
  const cmdArg = propNumberFromVnodeProps(props, "commandArg");
  if (cmdSeq != null && String(cmdSeq) !== audio.dataset.relayCommandSeq) {
    audio.dataset.relayCommandSeq = String(cmdSeq);
    if (cmd === 1) audio.play().catch(() => {
    });
    else if (cmd === 2) audio.pause();
    else if (cmd === 3 && cmdArg != null) audio.currentTime = cmdArg;
    else if (cmd === 4) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
  const className = propStringFromVnodeProps(props, "className");
  if (className) audio.className = `${audio.className} ${className}`.trim();
  return audio;
}
function buildRelayVideoPlayer(props, invokeHandler, onAfterInvoke) {
  const shell = document.createElement("div");
  shell.className = "relay-video-player-shell";
  const video = document.createElement("video");
  video.className = "relay-video-player";
  video.setAttribute("playsinline", "");
  video.setAttribute("preload", "metadata");
  const src = resolveMediaUrl(propStringFromVnodeProps(props, "src"));
  if (src) video.src = src;
  const poster = propStringFromVnodeProps(props, "poster");
  if (poster) video.poster = resolveMediaUrl(poster);
  const controls = propBoolFromVnodePropsLoose(props, "controls");
  video.controls = controls !== false;
  const autoPlay = propBoolFromVnodePropsLoose(props, "autoPlay");
  if (autoPlay === true) video.autoplay = true;
  const muted = propBoolFromVnodePropsLoose(props, "muted");
  if (muted === true) video.muted = true;
  const loop = propBoolFromVnodePropsLoose(props, "loop");
  if (loop === true) video.loop = true;
  const vol = propNumberFromVnodeProps(props, "volume");
  if (vol != null && !Number.isNaN(vol)) video.volume = Math.min(1, Math.max(0, vol));
  const rate = propNumberFromVnodeProps(props, "playbackRate");
  if (rate != null && !Number.isNaN(rate)) video.playbackRate = rate;
  const playerId = propStringFromVnodeProps(props, "playerId") || `rvp-${Math.random().toString(36).slice(2)}`;
  video.dataset.relayPlayerId = playerId;
  const subtitlesJson = propStringFromVnodeProps(props, "subtitlesJson");
  if (subtitlesJson) {
    try {
      const tracks = JSON.parse(subtitlesJson);
      if (Array.isArray(tracks)) {
        tracks.forEach((t, i) => {
          if (!t || !t.src) return;
          const track = document.createElement("track");
          track.kind = "subtitles";
          const trackUrl = resolveMediaUrl(String(t.src));
          let srcForTrack = trackUrl;
          if (/\.srt$/i.test(trackUrl)) {
            const srt = fetchTextSync(trackUrl);
            if (srt) {
              srcForTrack = URL.createObjectURL(new Blob([srtToVtt(srt)], { type: "text/vtt" }));
            }
          }
          track.src = srcForTrack;
          if (t.label) track.label = String(t.label);
          if (t.lang) track.srclang = String(t.lang);
          if (t.default) track.default = true;
          video.appendChild(track);
        });
      }
    } catch (e) {
      console.warn("[relay-runtime] subtitlesJson parse failed", e);
    }
  }
  attachMediaHandler(video, "play", props, "onPlay", invokeHandler, onAfterInvoke);
  attachMediaHandler(video, "pause", props, "onPause", invokeHandler, onAfterInvoke);
  attachMediaHandler(video, "ended", props, "onEnded", invokeHandler, onAfterInvoke);
  attachMediaHandler(video, "error", props, "onError", invokeHandler, onAfterInvoke);
  attachMediaHandler(video, "loadedmetadata", props, "onLoadedMetadata", invokeHandler, onAfterInvoke);
  attachMediaHandler(video, "seeked", props, "onSeeked", invokeHandler, onAfterInvoke);
  let lastTimeEvent = 0;
  video.addEventListener("timeupdate", () => {
    const now = Date.now();
    if (now - lastTimeEvent < 250) return;
    lastTimeEvent = now;
    const val = props && props.onTimeUpdate;
    if (!val || val.type !== "HandlerId") return;
    try {
      push_message_from_host(
        JSON.stringify({
          type: "relay-video",
          event: "onTimeUpdate",
          handlerId: val.value,
          playerId,
          currentTime: video.currentTime,
          duration: video.duration
        })
      );
      invokeHandler(val.value);
    } catch (err) {
      console.error("[relay-runtime] onTimeUpdate failed", err);
    }
    if (onAfterInvoke && consume_render_requested()) onAfterInvoke();
  });
  const playing = propBoolFromVnodePropsLoose(props, "playing");
  if (playing === true) {
    video.play().catch(() => {
    });
  } else if (playing === false) {
    video.pause();
  }
  const ct = propNumberFromVnodeProps(props, "currentTime");
  if (ct != null && !Number.isNaN(ct) && Math.abs(video.currentTime - ct) > 0.25) {
    video.currentTime = ct;
  }
  const cmdSeq = propNumberFromVnodeProps(props, "commandSeq");
  const cmd = propNumberFromVnodeProps(props, "command");
  const cmdArg = propNumberFromVnodeProps(props, "commandArg");
  if (cmdSeq != null && String(cmdSeq) !== video.dataset.relayCommandSeq) {
    video.dataset.relayCommandSeq = String(cmdSeq);
    if (cmd === 1) video.play().catch(() => {
    });
    else if (cmd === 2) video.pause();
    else if (cmd === 3 && cmdArg != null) video.currentTime = cmdArg;
  }
  shell.appendChild(video);
  return shell;
}
function propBoolFromVnodeProps(props, key) {
  const val = props && props[key];
  return !!(val && typeof val === "object" && val.type === "Bool" && val.value === true);
}
function shouldInterceptRelayControlledAnchorClick(e, el) {
  if (e.defaultPrevented || e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const t = el.getAttribute("target");
  if (t && t !== "_self") return false;
  const href = el.getAttribute("href");
  if (!href) return true;
  if (/^(mailto:|tel:|#)/i.test(href)) return false;
  return true;
}
function attachHandlersFromProps(el, tag, props, invokeHandler, onAfterInvoke) {
  if (!props || !el || typeof el.addEventListener !== "function") return;
  const relayControlled = propBoolFromVnodeProps(props, "relayControlled");
  for (const [k, val] of Object.entries(props)) {
    if (val && typeof val === "object" && (val.type === "Handler" || val.type === "HandlerId") && typeof val.value === "number") {
      const eventType = k.startsWith("on") ? k.slice(2).toLowerCase() : k;
      if (tag === "a" && eventType === "click" && !relayControlled) {
        continue;
      }
      const handlerId = val.value;
      el.addEventListener(eventType, (e) => {
        if (tag === "a" && eventType === "click" && relayControlled) {
          if (!shouldInterceptRelayControlledAnchorClick(e, el)) return;
          e.preventDefault();
        }
        try {
          invokeHandler(handlerId);
        } catch (err) {
          console.error("[relay-runtime] Handler invocation failed:", err);
          throw err;
        }
        if (onAfterInvoke && consume_render_requested()) onAfterInvoke();
      });
    }
  }
}
function elementChildNodes(parent) {
  const out = [];
  if (!parent || !parent.childNodes) return out;
  for (const n of parent.childNodes) {
    if (n.nodeType === 1) out.push(n);
  }
  return out;
}
function expectedDomTag(tag) {
  if (tag === "relay-video-player" || tag === "relay-audio-player" || tag === "relay-hook-renderer") return "DIV";
  if (tag === "fragment") return null;
  return String(tag || "div").toUpperCase();
}
function hydrateVnode(v, container, invokeHandler = invoke_handler, onAfterInvoke = null) {
  if (!v || !container) return false;
  try {
    if (v.Empty !== void 0) return true;
    if (v.Text !== void 0) return true;
    if (v.Element) {
      const { tag, children } = v.Element;
      if (tag === "fragment") {
        return hydrateChildren(children || [], elementChildNodes(container), invokeHandler, onAfterInvoke, "/fragment");
      }
      const kids = elementChildNodes(container);
      if (kids.length === 1) {
        return hydrateElementNode(v, kids[0], invokeHandler, onAfterInvoke, `/${tag || "root"}`);
      }
      if (kids.length === 0 && (!children || children.length === 0)) return true;
      console.warn(
        `[relay-runtime] hydrate root child-count mismatch: vnode children vs dom=${kids.length}`
      );
      return false;
    }
    if (Array.isArray(v)) {
      return hydrateChildren(v, elementChildNodes(container), invokeHandler, onAfterInvoke, "/[]");
    }
    return false;
  } catch (e) {
    console.warn("[relay-runtime] hydrateVnode failed:", e);
    return false;
  }
}
function hydrateChildren(vnodes, domEls, invokeHandler, onAfterInvoke, path) {
  const basePath = path || "";
  const flat = [];
  for (const c of vnodes || []) {
    if (!c || c.Empty !== void 0 || c.Text !== void 0) continue;
    if (c.Element && c.Element.tag === "fragment") {
      for (const nested of c.Element.children || []) {
        if (nested && nested.Element) flat.push(nested);
      }
    } else if (c.Element) {
      flat.push(c);
    }
  }
  if (flat.length !== domEls.length) {
    if (flat.length === 0 && domEls.length === 0) return true;
    const vnodeTags = flat.map((v) => v.Element && v.Element.tag || "?").join(",");
    const domTags = domEls.map((el) => el.tagName || "?").join(",");
    console.warn(
      `[relay-runtime] hydrate child-count mismatch at ${basePath || "/"}: vnode=${flat.length}[${vnodeTags}] dom=${domEls.length}[${domTags}]`
    );
    return false;
  }
  for (let i = 0; i < flat.length; i++) {
    const tag = flat[i].Element && flat[i].Element.tag || i;
    if (!hydrateElementNode(flat[i], domEls[i], invokeHandler, onAfterInvoke, `${basePath}/${tag}[${i}]`)) {
      return false;
    }
  }
  return true;
}
function hydrateElementNode(v, el, invokeHandler, onAfterInvoke, path) {
  if (!v || !v.Element || !el) return false;
  const { tag, props, children } = v.Element;
  const here = path || tag || "?";
  if (tag === "fragment") {
    return hydrateChildren(children || [], elementChildNodes(el), invokeHandler, onAfterInvoke, here);
  }
  const expect = expectedDomTag(tag);
  if (expect && String(el.tagName || "").toUpperCase() !== expect) {
    if (!(expect === "DIV" && String(el.tagName || "").toUpperCase() === "DIV")) {
      console.warn(
        `[relay-runtime] hydrate tag mismatch at ${here}: vnode=${expect} dom=${el.tagName}`
      );
      return false;
    }
  }
  attachHandlersFromProps(el, tag, props || {}, invokeHandler, onAfterInvoke);
  return hydrateChildren(children || [], elementChildNodes(el), invokeHandler, onAfterInvoke, here);
}
function vnodeToDom(v, invokeHandler = invoke_handler, onAfterInvoke = null) {
  if (!v) return null;
  if (v.Empty !== void 0) return null;
  if (v.Text !== void 0) return document.createTextNode(v.Text);
  if (v.Element) {
    const { tag, props, children } = v.Element;
    if (tag === "relay-hook-renderer") {
      const host = props?.host?.value ?? props?.host ?? "";
      const hookPath = props?.hookPath?.value ?? props?.hookPath ?? "hooks/app.jsx";
      const baseUrl = props?.baseUrl?.value ?? props?.baseUrl ?? void 0;
      const container = document.createElement("div");
      container.className = "relay-hook-renderer";
      renderHook(container, { hookPath, host: host || void 0, baseUrl }).catch((e) => {
        renderHookErrorUI(container, e, {
          keepContent: container.dataset?.relaySsr === "1"
        });
      });
      return container;
    }
    if (tag === "relay-video-player") {
      return buildRelayVideoPlayer(props || {}, invokeHandler, onAfterInvoke);
    }
    if (tag === "relay-audio-player") {
      return buildRelayAudioPlayer(props || {}, invokeHandler, onAfterInvoke);
    }
    if (tag === "fragment") {
      const frag = document.createDocumentFragment();
      for (const c of children || []) {
        const child = vnodeToDom(c, invokeHandler, onAfterInvoke);
        if (child) frag.appendChild(child);
      }
      return frag;
    }
    const el = createVnodeDomElement(tag);
    applyVnodeDomProps(el, tag, props, invokeHandler, onAfterInvoke);
    appendVnodeDomChildren(el, props, children, invokeHandler, onAfterInvoke);
    return el;
  }
  if (v.type === "element") {
    const rawTag = v.tag === "fragment" ? "div" : v.tag;
    if (rawTag === "relay-video-player") {
      return buildRelayVideoPlayer(v.props || {}, invokeHandler, onAfterInvoke);
    }
    if (rawTag === "relay-audio-player") {
      return buildRelayAudioPlayer(v.props || {}, invokeHandler, onAfterInvoke);
    }
    const el = createVnodeDomElement(rawTag);
    applyVnodeDomProps(el, rawTag, v.props, invokeHandler, onAfterInvoke);
    appendVnodeDomChildren(el, v.props, v.children, invokeHandler, onAfterInvoke);
    return el;
  }
  if (Array.isArray(v)) {
    const frag = document.createDocumentFragment();
    for (const c of v) {
      const child = vnodeToDom(c, invokeHandler, onAfterInvoke);
      if (child) frag.appendChild(child);
    }
    return frag;
  }
  return null;
}
async function hookFetchError(resp, url) {
  const err = new Error(`Fetch entry ${url} failed: ${resp.status}`);
  err.status = resp.status;
  err.url = url;
  let text = "";
  try {
    text = await resp.text();
  } catch {
    return err;
  }
  let detail = null;
  try {
    detail = JSON.parse(text);
  } catch {
  }
  if (!detail || typeof detail !== "object") {
    if (text.trim()) err.message += `
${text.trim().slice(0, 500)}`;
    return err;
  }
  err.gateway = detail;
  const parts = [err.message];
  if (detail.repo || detail.branch) {
    parts.push(`repo: ${detail.repo ?? "?"}  branch: ${detail.branch ?? "?"}`);
  }
  const cs = detail.cleverScript;
  if (cs && typeof cs === "object" && cs.message) {
    const loc = [cs.file, cs.line, cs.column].filter((v) => v != null && v !== "").join(":");
    parts.push(`CleverScript ${cs.type || "error"}${loc ? ` at ${loc}` : ""}: ${cs.message}`);
    if (cs.source_line) {
      parts.push(`  ${cs.source_line}`);
      if (cs.column) parts.push(`  ${" ".repeat(Math.max(0, cs.column - 1))}^`);
    }
    if (Array.isArray(cs.call_stack) && cs.call_stack.length) {
      parts.push(`  call stack: ${cs.call_stack.join(" > ")}`);
    }
  } else if (typeof detail.technicalReport === "string" && detail.technicalReport) {
    parts.push(detail.technicalReport.slice(0, 1e3));
  }
  if (typeof detail.summaryForReaders === "string" && detail.summaryForReaders) {
    parts.push(detail.summaryForReaders);
  }
  err.message = parts.join("\n");
  return err;
}
function formatRuntimeErrorMessage(msg) {
  const s = String(msg ?? "");
  const start = s.indexOf("{");
  if (start === -1) return s;
  try {
    const parsed = JSON.parse(s.slice(start));
    if (!parsed || typeof parsed.message !== "string") return s;
    const loc = [parsed.file, parsed.line, parsed.column].filter((v) => v != null && v !== "").join(":");
    let out = (s.slice(0, start) + (loc ? `${loc}: ` : "") + parsed.message).trim();
    if (parsed.source_line) {
      out += `
  ${parsed.source_line}
  ${" ".repeat(Math.max(0, (parsed.column || 1) - 1))}^`;
    }
    return out;
  } catch {
    return s;
  }
}
var _currentBootStatus = { phase: "idle", message: "", detail: "", progress: "" };
function setBootStatus(container, { phase = "idle", message = "", detail = "", progress = "" } = {}) {
  _currentBootStatus = { phase, message, detail, progress };
  if (container && container.dataset) {
    container.dataset.relayBootPhase = phase;
    container.dataset.relayBootMessage = message;
    if (detail) container.dataset.relayBootDetail = detail;
    else delete container.dataset.relayBootDetail;
    if (progress) container.dataset.relayBootProgress = progress;
    else delete container.dataset.relayBootProgress;
  }
  try {
    if (container && typeof CustomEvent !== "undefined") {
      container.dispatchEvent(
        new CustomEvent("relay-boot-status", { detail: { ..._currentBootStatus }, bubbles: true })
      );
    }
  } catch (_) {
  }
}
function getBootStatus(container) {
  if (container && container.dataset && container.dataset.relayBootPhase) {
    return {
      phase: container.dataset.relayBootPhase,
      message: container.dataset.relayBootMessage || "",
      detail: container.dataset.relayBootDetail || "",
      progress: container.dataset.relayBootProgress || ""
    };
  }
  return { ..._currentBootStatus };
}
function injectHostManifestFields(hooksManifest, container) {
  if (!hooksManifest || typeof hooksManifest !== "object") return;
  const hasSsrMarkup = container && container.dataset && container.dataset.relaySsr === "1" && container.childElementCount > 0;
  let ssrArticle = false;
  try {
    ssrArticle = Boolean(hasSsrMarkup && container.querySelector("[data-pt-article]"));
  } catch (_) {
    ssrArticle = false;
  }
  hooksManifest.relayHostMode = hasSsrMarkup ? "ssr" : "csr";
  hooksManifest.relaySsrArticlePresent = ssrArticle;
  const boot = getBootStatus(container);
  hooksManifest.relayBootPhase = boot.phase;
  hooksManifest.relayBootMessage = boot.message;
  hooksManifest.relayBootDetail = boot.detail;
  hooksManifest.relayBootProgress = boot.progress;
}
function renderHookErrorUI(container, err, { keepContent = false, title = "Hook error" } = {}) {
  if (!container) return;
  const panel = document.createElement("div");
  panel.className = "relay-hook-error";
  panel.style.cssText = "font: 13px/1.5 ui-monospace, monospace; color: #ffb4b4; background: #2a0f0f;border: 1px solid #7f1d1d; border-radius: 6px; padding: 10px 12px; margin: 8px;white-space: pre-wrap; overflow-wrap: anywhere; text-align: left;";
  const head = document.createElement("div");
  head.style.cssText = "font-weight: bold; color: #fecaca; margin-bottom: 4px;";
  head.textContent = title;
  panel.appendChild(head);
  const msg = document.createElement("div");
  msg.textContent = formatRuntimeErrorMessage(err?.message ?? err ?? "Unknown error");
  panel.appendChild(msg);
  const meta = [];
  if (err?.status) meta.push(`HTTP ${err.status}`);
  const gw = err?.gateway;
  if (gw?.repo) meta.push(`repo ${gw.repo}`);
  if (gw?.branch) meta.push(`branch ${gw.branch}`);
  if (typeof location !== "undefined") meta.push(`page ${location.pathname}${location.search}`);
  meta.push(`at ${(/* @__PURE__ */ new Date()).toISOString()}`);
  if (meta.length) {
    const info = document.createElement("div");
    info.style.cssText = "margin-top: 6px; color: #f87171; opacity: 0.8; font-size: 12px;";
    info.textContent = meta.join(" \xB7 ");
    panel.appendChild(info);
  }
  const hint = document.createElement("div");
  hint.style.cssText = "margin-top: 6px; color: #fca5a5; opacity: 0.8; font-size: 12px;";
  hint.textContent = keepContent ? "Static server-rendered content is shown below; interactive features are unavailable." : "Details are also logged to the browser console.";
  panel.appendChild(hint);
  if (keepContent) {
    const existing = container.querySelector(":scope > .relay-hook-error");
    if (existing) existing.replaceWith(panel);
    else container.prepend(panel);
  } else {
    container.innerHTML = "";
    container.className = (container.className || "") + " error";
    container.appendChild(panel);
  }
}
async function renderHook(container, options = {}) {
  const {
    hookPath,
    host,
    baseUrl = getDefaultBaseUrl(),
    hydrate = false,
    mode = "auto",
    branch = "",
    initialPath = "",
    themeYaml = ""
  } = options;
  const wantHydrate = mode === "hydrate" ? true : mode === "csr" ? false : hydrate || container?.dataset?.relaySsr === "1";
  let moduleMap = {};
  let source = "";
  let effectivePath = hookPath || "hooks/app.jsx";
  let hooksManifest = { hooks: [{ path: effectivePath, name: "Default" }] };
  let hydratedOnce = false;
  let livePromoted = false;
  let themeYamlText = typeof themeYaml === "string" ? themeYaml : "";
  const branchNorm = typeof branch === "string" ? branch.trim() : "";
  const initialPathNorm = typeof initialPath === "string" ? initialPath.trim() : "";
  try {
    setBootStatus(container, { phase: "wasm", message: "Preparing runtime\u2026" });
    try {
      if (typeof set_client_live === "function") set_client_live(false);
    } catch (_) {
    }
    syncHtmlHydratedAttr(false);
    if (host) {
      setBootStatus(container, { phase: "manifest", message: "Discovering hooks\u2026" });
      const base = host.trim().replace(/\/+$/, "");
      const baseDir = `${base}/`;
      const cacheBust = "?t=" + Date.now();
      const branchHeaders = branchNorm ? { "X-Relay-Branch": branchNorm } : {};
      let hookHostSameOrigin = true;
      if (typeof location !== "undefined" && location.origin) {
        try {
          hookHostSameOrigin = new URL(baseDir).origin === location.origin;
        } catch {
          hookHostSameOrigin = true;
        }
      }
      const explicitHookPath = typeof hookPath === "string" && hookPath.trim().length > 0;
      let entryPath = effectivePath;
      try {
        if (!explicitHookPath && hookHostSameOrigin) {
          const optsResp = await fetch(baseDir, { method: "OPTIONS", headers: branchHeaders });
          if (optsResp.ok) {
            let p = optsResp.headers.get("x-hook-path") || optsResp.headers.get("x-relay-hook-path");
            if (!p && optsResp.headers.get("content-type")?.includes("application/json")) {
              const j = await optsResp.json();
              p = j?.hookPath ?? j?.hook_path ?? j?.path;
            }
            if (p) entryPath = p;
          }
        }
      } catch {
      }
      hooksManifest = { hooks: [] };
      const hooksUrl = resolveHookUrl(baseDir, "hooks.json") + cacheBust;
      const hooksResp = await fetch(hooksUrl, { headers: branchHeaders }).catch(() => null);
      if (hooksResp && hooksResp.ok) {
        try {
          hooksManifest = await hooksResp.json();
        } catch {
          hooksManifest = { hooks: [] };
        }
      }
      moduleMap = {};
      const keyFromPath = (p) => {
        const s = (p || "").trim();
        if (s.startsWith("/")) return s.slice(1);
        return s.replace(/^\.\//, "");
      };
      const putModule = (pathKey, text) => {
        putModuleInMap(moduleMap, pathKey, text);
      };
      const hookEntries = (hooksManifest.hooks || []).filter((h) => h && h.path);
      const hookTotal = hookEntries.length || 1;
      let hookDone = 0;
      setBootStatus(container, {
        phase: "modules",
        message: `Fetching hooks 0/${hookTotal}\u2026`,
        progress: `0/${hookTotal}`
      });
      await Promise.all(
        hookEntries.map(async (h) => {
          const u = resolveHookUrl(baseDir, h.path) + cacheBust;
          try {
            const resp = await fetch(u, { headers: branchHeaders });
            if (resp.ok) {
              putModule(h.path, await resp.text());
            } else {
              console.warn("[relay-runtime] remote hook fetch failed:", h.path, resp.status);
            }
          } catch (err) {
            console.warn("[relay-runtime] remote hook fetch error:", h.path, err);
          } finally {
            hookDone += 1;
            setBootStatus(container, {
              phase: "modules",
              message: `Fetching hooks ${hookDone}/${hookTotal}\u2026`,
              progress: `${hookDone}/${hookTotal}`
            });
          }
        })
      );
      effectivePath = keyFromPath(entryPath);
      if (!moduleMap[effectivePath]) {
        const srcUrl = resolveHookUrl(baseDir, entryPath) + cacheBust;
        const srcResp = await fetch(srcUrl, { headers: branchHeaders });
        if (!srcResp.ok) throw await hookFetchError(srcResp, srcUrl);
        source = await srcResp.text();
        putModule(entryPath, source);
      } else {
        source = moduleMap[effectivePath];
      }
      setBootStatus(container, {
        phase: "modules",
        message: "Resolving hook imports\u2026",
        progress: `${moduleCount(moduleMap)}`
      });
      await preloadImportClosure(
        moduleMap,
        async (rel) => {
          const resp = await fetch(resolveHookUrl(baseDir, rel) + cacheBust, { headers: branchHeaders });
          if (!resp.ok) {
            console.warn("[relay-runtime] import closure fetch failed:", rel, resp.status);
            return null;
          }
          return resp.text();
        },
        () => {
          setBootStatus(container, {
            phase: "modules",
            message: `Resolving hook imports\u2026`,
            progress: `${moduleCount(moduleMap)}`
          });
        }
      );
      if (!hooksManifest.hooks || hooksManifest.hooks.length === 0) {
        hooksManifest = { hooks: [{ path: effectivePath, name: "Default" }] };
      }
      const baseNorm = base.replace(/\/+$/, "");
      hooksManifest.relayClientBaseUrl = baseNorm;
      hooksManifest.relayDefaultMarkdownUrl = `${baseNorm}/README.md`;
      hooksManifest.relayPathSlash = "/";
      if (initialPathNorm) {
        hooksManifest.relayInitialPath = initialPathNorm.startsWith("/") ? initialPathNorm : `/${initialPathNorm}`;
      }
      if (branchNorm) {
        hooksManifest.relayBranch = branchNorm;
      }
      setRelayFetchBaseUrl(baseNorm);
      setRelayFetchBranch(branchNorm);
      setBootStatus(container, { phase: "theme", message: "Loading theme\u2026" });
      if (!themeYamlText) {
        themeYamlText = await fetchThemeYamlForHost(baseDir, branchNorm);
      }
      if (container && container.dataset) {
        container.dataset.relayClientBaseUrl = baseNorm;
        if (branchNorm) container.dataset.relayBranch = branchNorm;
        if (initialPathNorm) {
          container.dataset.relayInitialPath = hooksManifest.relayInitialPath || initialPathNorm;
        }
      }
    } else {
      const url = resolveUrl(baseUrl, effectivePath);
      const r = await fetch(url);
      if (!r.ok) throw await hookFetchError(r, url);
      source = await r.text();
      putModuleInMap(moduleMap, effectivePath, source);
      await preloadImportClosure(moduleMap, async (rel) => {
        const resp = await fetch(resolveUrl(baseUrl, rel));
        if (!resp.ok) {
          console.warn("[relay-runtime] import closure fetch failed:", rel, resp.status);
          return null;
        }
        return resp.text();
      });
      hooksManifest = { hooks: [{ path: effectivePath, name: "Default" }] };
      if (initialPathNorm) {
        hooksManifest.relayInitialPath = initialPathNorm.startsWith("/") ? initialPathNorm : `/${initialPathNorm}`;
      }
      if (branchNorm) {
        hooksManifest.relayBranch = branchNorm;
        setRelayFetchBranch(branchNorm);
      }
    }
    const doRender = () => {
      try {
        setBootStatus(container, { phase: "render", message: "Rendering UI\u2026" });
        injectHostManifestFields(hooksManifest, container);
        let vnodeJson;
        for (let pass = 0; pass < 16; pass++) {
          vnodeJson = run_hook_with_host(
            source,
            JSON.stringify(moduleMap),
            themeYamlText || "",
            JSON.stringify(hooksManifest),
            effectivePath
          );
          if (!consume_render_requested()) break;
        }
        applyInjectedCss(container);
        let vnode = JSON.parse(vnodeJson);
        const tryHydrate = wantHydrate && !hydratedOnce && container.dataset?.relaySsr === "1";
        if (tryHydrate) {
          const ok = hydrateVnode(vnode, container, invoke_handler, doRender);
          if (ok) {
            hydratedOnce = true;
            container.dataset.relayHydrated = "1";
            try {
              if (typeof set_client_live === "function") set_client_live(true);
            } catch (_) {
            }
            syncHtmlHydratedAttr(true);
            livePromoted = true;
            setBootStatus(container, { phase: "live", message: "Ready" });
            doRender();
            return;
          }
          console.warn("[relay-runtime] SSR hydrate mismatch; falling back to client render");
        }
        container.innerHTML = "";
        delete container.dataset.relaySsr;
        if (!livePromoted) {
          try {
            if (typeof set_client_live === "function") set_client_live(true);
          } catch (_) {
          }
          syncHtmlHydratedAttr(true);
          livePromoted = true;
          setBootStatus(container, { phase: "live", message: "Ready" });
          injectHostManifestFields(hooksManifest, container);
          for (let pass = 0; pass < 16; pass++) {
            vnodeJson = run_hook_with_host(
              source,
              JSON.stringify(moduleMap),
              themeYamlText || "",
              JSON.stringify(hooksManifest),
              effectivePath
            );
            if (!consume_render_requested()) break;
          }
          applyInjectedCss(container);
          vnode = JSON.parse(vnodeJson);
        }
        const el = vnodeToDom(vnode, invoke_handler, doRender);
        if (el) container.appendChild(el);
        if (livePromoted) {
          setBootStatus(container, { phase: "live", message: "Ready" });
        }
      } catch (e) {
        renderHookErrorUI(container, e, {
          title: "Render error",
          keepContent: container.dataset?.relaySsr === "1"
        });
        throw e;
      }
    };
    installEmbedActionDelegation(container, () => {
      doRender();
    });
    doRender();
  } catch (e) {
    const msg = formatRuntimeErrorMessage(e?.message ?? e ?? "Boot failed");
    setBootStatus(container, { phase: "error", message: "Boot failed", detail: msg });
    renderHookErrorUI(container, e, {
      title: "Boot error",
      keepContent: container?.dataset?.relaySsr === "1"
    });
    throw e;
  }
}
function getDefaultBaseUrl() {
  try {
    return new URL("../", import.meta.url).href;
  } catch {
    return ".";
  }
}
var DEFAULTS = {
  rootId: "root",
  hooksPath: "hooks.json",
  appPath: "hooks/app.jsx",
  get baseUrl() {
    return getDefaultBaseUrl();
  }
};
function resolveHookUrl(baseUrl, path) {
  const p = (path ?? "").trim();
  if (!p) return baseUrl || "";
  if (/^https?:\/\//i.test(p)) return p;
  if (!baseUrl || baseUrl === ".") {
    try {
      const base = typeof document !== "undefined" && document.baseURI ? document.baseURI : "http://localhost/";
      return new URL(p, base).href;
    } catch {
      return p;
    }
  }
  const dir = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  try {
    return new URL(p, dir).href;
  } catch {
    return p;
  }
}
function resolveUrl(baseUrl, path) {
  return resolveHookUrl(baseUrl, path);
}
async function bootstrap(options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const { rootId, hooksPath, appPath, baseUrl, wasmUrl } = opts;
  const root = document.getElementById(rootId);
  if (!root) {
    console.error("[relay-runtime] Root element not found:", rootId);
    return;
  }
  try {
    await __wbg_init(wasmUrl);
    installRelayHostFetch();
    if (typeof window !== "undefined") {
      window.addEventListener("message", (e) => {
        try {
          const d = e.data;
          if (d && typeof d === "object" && d.type === "relay-runtime") return;
          const payload = typeof d === "string" ? d : JSON.stringify(d ?? null);
          push_message_from_host(payload);
        } catch (_) {
        }
      });
    }
    const hooksUrl = resolveUrl(baseUrl, hooksPath);
    const appUrl = resolveUrl(baseUrl, appPath);
    const cacheBust = "?t=" + Date.now();
    const [hooksResp, appResp] = await Promise.all([
      fetch(hooksUrl + cacheBust),
      fetch(appUrl + cacheBust)
    ]);
    if (!hooksResp.ok) {
      console.warn("[relay-runtime] hooks fetch failed:", hooksResp.status, hooksUrl);
    }
    if (!appResp.ok) {
      console.warn("[relay-runtime] app fetch failed:", appResp.status, appUrl);
    }
    const manifest = hooksResp.ok ? await hooksResp.json() : { hooks: [] };
    const appSource = appResp.ok ? await appResp.text() : "";
    const moduleMap = {};
    const bootHooks = (manifest.hooks || []).filter((h) => h && h.path);
    await Promise.all(
      bootHooks.map(async (h) => {
        const url = resolveUrl(baseUrl, h.path) + cacheBust;
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            putModuleInMap(moduleMap, h.path, await resp.text());
          } else {
            console.warn("[relay-runtime] hook fetch failed:", resp.status, h.path, url);
          }
        } catch (err) {
          console.warn("[relay-runtime] hook fetch error:", h.path, err);
        }
      })
    );
    if (appSource) {
      putModuleInMap(moduleMap, appPath || "hooks/app.jsx", appSource);
    }
    await preloadImportClosure(moduleMap, async (rel) => {
      const url = resolveUrl(baseUrl, rel) + cacheBust;
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          console.warn("[relay-runtime] import closure fetch failed:", rel, resp.status, url);
          return null;
        }
        return resp.text();
      } catch (err) {
        console.warn("[relay-runtime] import closure fetch error:", rel, err);
        return null;
      }
    });
    const hookCount = (manifest.hooks || []).length;
    const loadedCount = Object.keys(moduleMap).length;
    if (hookCount === 0) {
      console.warn("[relay-runtime] hooks manifest has no hooks");
    } else if (loadedCount < hookCount) {
      console.warn("[relay-runtime] loaded", loadedCount, "of", hookCount, "hooks; baseUrl:", baseUrl);
    }
    if (hookCount === 0 || loadedCount === 0 || !appSource) {
      console.warn("[relay-runtime] bootstrap inputs:", {
        hookCount,
        loadedCount,
        appLen: appSource.length,
        modulePaths: Object.keys(moduleMap),
        baseUrl
      });
    }
    const doRender = () => {
      try {
        let vnodeJson;
        try {
          for (let pass = 0; pass < 16; pass++) {
            vnodeJson = run_hook_with_host(
              appSource,
              JSON.stringify(moduleMap),
              "",
              JSON.stringify(manifest),
              appPath || ""
            );
            if (!consume_render_requested()) break;
          }
        } catch (e) {
          console.error("[relay-runtime] run_hook_with_host failed:", e);
          throw e;
        }
        applyInjectedCss(root);
        root.innerHTML = "";
        const vnode = JSON.parse(vnodeJson);
        const el = vnodeToDom(vnode, invoke_handler, doRender);
        if (el) {
          root.appendChild(el);
        } else {
          const empty = document.createElement("p");
          empty.className = "relay-empty";
          empty.textContent = "Rendered (no content). Check that hooks manifest and theme are loaded.";
          root.appendChild(empty);
          if (typeof console !== "undefined" && console.debug) {
            console.debug("[relay-runtime] vnode was empty:", vnode);
          }
        }
      } catch (e) {
        console.error("[relay-runtime] doRender failed:", e);
        throw e;
      }
    };
    doRender();
    root.addEventListener("click", (e) => {
      const theme = e.target?.dataset?.theme;
      if (theme) {
        setCurrentTheme(theme);
      }
    });
  } catch (e) {
    root.textContent = "";
    root.className = "error";
    let msg = e?.message ?? e?.toString?.() ?? String(e);
    try {
      const parsed = JSON.parse(msg);
      if (parsed && typeof parsed.message === "string") {
        const loc = [parsed.file, parsed.line, parsed.column].filter(Boolean).join(":");
        msg = loc ? `${loc}: ${parsed.message}` : parsed.message;
        if (parsed.source_line) {
          msg += `
  ${parsed.source_line}
  ${" ".repeat((parsed.column || 1) - 1)}^`;
        }
      }
    } catch (_) {
    }
    root.textContent = `Init error: ${msg || "Unknown error"}`;
    root.style.whiteSpace = "pre-wrap";
    console.error("[relay-runtime] Init error:", e);
  }
}
function getThemes() {
  try {
    const json = get_themes();
    const arr = JSON.parse(json || "[]");
    return Array.isArray(arr) ? arr.map((t) => t && t.key ? t.key : String(t)) : [];
  } catch {
    return [];
  }
}
function setCurrentTheme(name) {
  const n = String(name || "").trim();
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (n === "light" || n === "dark") {
      root.classList.add(n);
    }
  }
  let css = "";
  try {
    css = typeof set_theme_and_render === "function" ? set_theme_and_render(n) : "";
  } catch (_) {
  }
  if (!css || !String(css).trim()) {
    try {
      css = typeof get_injected_css === "function" ? get_injected_css() : "";
    } catch (_) {
      css = "";
    }
  }
  if (css && String(css).trim()) {
    const styleEl = ensureStyleElement(_styleId);
    if (styleEl) styleEl.textContent = String(css);
  }
}
function installEmbedActionDelegation(root, onThemeChange) {
  if (!root || root.dataset.relayActionsBound === "1") return;
  root.dataset.relayActionsBound = "1";
  root.addEventListener("click", (e) => {
    const actionEl = e.target?.closest?.("[data-relay-action]");
    if (actionEl && !actionEl.disabled) {
      const action = actionEl.getAttribute("data-relay-action");
      if (action === "print" && typeof window !== "undefined" && typeof window.print === "function") {
        e.preventDefault();
        window.print();
        return;
      }
    }
    const themeEl = e.target?.closest?.("[data-theme]");
    if (themeEl && !themeEl.disabled) {
      const theme = themeEl.getAttribute("data-theme");
      if (theme) {
        setCurrentTheme(theme);
        if (typeof onThemeChange === "function") onThemeChange(theme);
      }
    }
  });
}
export {
  IMPORT_CLOSURE_MAX_MODULES,
  bootstrap,
  getBootStatus,
  getThemes,
  hydrateVnode,
  installRelayHostFetch,
  localImportSpecs,
  looksLikeHookSource,
  preloadImportClosure,
  propBoolFromVnodeProps,
  putModuleInMap,
  renderHook,
  renderHookErrorUI,
  resolveHookUrl,
  resolveImportRel,
  setBootStatus,
  setCurrentTheme,
  setRelayFetchBaseUrl,
  setRelayFetchBranch,
  shouldInterceptRelayControlledAnchorClick,
  vnodeToDom
};
//# sourceMappingURL=relay-runtime-web-XMWV5SMB.js.map
