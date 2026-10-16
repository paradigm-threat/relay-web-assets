import {
  __wbg_init,
  consume_render_requested,
  get_client_live_phase,
  get_current_theme_name,
  get_injected_css,
  get_themes,
  invoke_handler,
  push_message_from_host,
  run_hook_with_host,
  set_client_live,
  set_client_live_phase,
  set_theme_and_render
} from "./chunk-66JIB6FZ.js";
import "./chunk-RPGBVRDM.js";

// src/vendor/relay-gallery.js
var BACKOFF_MS = [250, 500, 1e3, 2e3, 4e3, 4e3];
var DEFAULT_MAX_ATTEMPTS = 6;
function str(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function cacheBustSrc(url, attempt) {
  const raw = str(url);
  if (!raw) return raw;
  try {
    const hashIdx = raw.indexOf("#");
    const hash = hashIdx >= 0 ? raw.slice(hashIdx) : "";
    const noHash = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
    const qIdx = noHash.indexOf("?");
    const path = qIdx >= 0 ? noHash.slice(0, qIdx) : noHash;
    const qs = qIdx >= 0 ? noHash.slice(qIdx + 1) : "";
    const parts = qs ? qs.split("&").filter((p) => p && p.indexOf("_rg=") !== 0) : [];
    parts.push("_rg=" + String(attempt));
    return path + "?" + parts.join("&") + hash;
  } catch (_) {
    return raw + (raw.indexOf("?") >= 0 ? "&" : "?") + "_rg=" + String(attempt);
  }
}
function backoffDelay(attemptIndex) {
  if (attemptIndex < 0) return BACKOFF_MS[0];
  if (attemptIndex >= BACKOFF_MS.length) return BACKOFF_MS[BACKOFF_MS.length - 1];
  return BACKOFF_MS[attemptIndex];
}
function attachSoftRetryImage(img, src, opts) {
  const maxAttempts = opts && typeof opts.maxAttempts === "number" && opts.maxAttempts > 0 ? opts.maxAttempts : DEFAULT_MAX_ATTEMPTS;
  const onState = opts && typeof opts.onState === "function" ? opts.onState : null;
  let baseSrc = str(src);
  let attempt = 0;
  let timer = null;
  let cancelled = false;
  function setState(state) {
    try {
      img.setAttribute("data-relay-img-state", state);
    } catch (_) {
    }
    if (onState) {
      try {
        onState(state);
      } catch (_) {
      }
    }
  }
  function clearTimer() {
    if (timer != null) {
      try {
        clearTimeout(timer);
      } catch (_) {
      }
      timer = null;
    }
  }
  function applySrc(next, bustAttempt) {
    const url = bustAttempt > 0 ? cacheBustSrc(next, bustAttempt) : next;
    try {
      img.src = url;
    } catch (_) {
    }
  }
  function onLoad() {
    if (cancelled) return;
    clearTimer();
    attempt = 0;
    setState("ok");
  }
  function onError() {
    if (cancelled) return;
    if (!baseSrc) {
      setState("failed");
      return;
    }
    if (attempt >= maxAttempts) {
      setState("failed");
      return;
    }
    setState("retrying");
    const delay = backoffDelay(attempt);
    attempt += 1;
    clearTimer();
    timer = setTimeout(() => {
      if (cancelled) return;
      applySrc(baseSrc, attempt);
    }, delay);
  }
  img.addEventListener("load", onLoad);
  img.addEventListener("error", onError);
  setState(baseSrc ? "loading" : "failed");
  if (baseSrc) applySrc(baseSrc, 0);
  return {
    cancel() {
      cancelled = true;
      clearTimer();
      try {
        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
      } catch (_) {
      }
    },
    reload(nextSrc) {
      baseSrc = str(nextSrc);
      attempt = 0;
      clearTimer();
      cancelled = false;
      setState(baseSrc ? "loading" : "failed");
      if (baseSrc) applySrc(baseSrc, 0);
    }
  };
}
function createGalleryStore() {
  let s = {
    images: [],
    override: null,
    index: -1,
    open: false,
    rev: 0,
    listeners: []
  };
  function emit() {
    s.rev += 1;
    const list = s.listeners.slice();
    for (let i = 0; i < list.length; i++) {
      try {
        list[i](s.rev);
      } catch (_) {
      }
    }
  }
  function images() {
    return s.override || s.images;
  }
  function strSrc(v) {
    return typeof v === "string" ? v : "";
  }
  function normalizeImg(img) {
    const src = strSrc(img && img.src);
    if (!src) return null;
    return {
      src,
      alt: img && typeof img.alt === "string" ? img.alt : "",
      highResSrc: img && typeof img.highResSrc === "string" ? img.highResSrc : "",
      children: img && img.children != null ? img.children : null
    };
  }
  function safeImgDomId(srcRaw) {
    const src = strSrc(srcRaw);
    let id = "img-";
    for (let i = 0; i < src.length; i++) {
      const c = src.charAt(i);
      if (/[a-zA-Z0-9]/.test(c)) id += c;
      else id += "-";
    }
    return id || "img-unknown";
  }
  function galleryImgHash(srcRaw) {
    return "img=" + strSrc(srcRaw);
  }
  function readHashImgSrc(hash) {
    const h = str(hash);
    const body = h.charAt(0) === "#" ? h.slice(1) : h;
    if (body.indexOf("img=") !== 0) return "";
    try {
      return decodeURIComponent(body.slice(4));
    } catch (_) {
      return body.slice(4);
    }
  }
  function galleryDisplaySrc(img) {
    if (!img) return "";
    const hi = typeof img.highResSrc === "string" ? img.highResSrc : "";
    if (hi) return hi;
    return strSrc(img.src);
  }
  return {
    galleryRev: () => s.rev,
    gallerySubscribe(fn) {
      s.listeners = s.listeners.concat([fn]);
      return () => {
        s.listeners = s.listeners.filter((f) => f !== fn);
      };
    },
    galleryImages: () => images().slice(),
    galleryIndex: () => s.index,
    galleryIsOpen: () => s.open === true,
    registerGalleryImage(img) {
      const n = normalizeImg(img);
      if (!n) return;
      if (s.images.some((i) => i.src === n.src)) return;
      s.images = s.images.concat([n]);
      emit();
    },
    syncGalleryImageMeta(img) {
      const n = normalizeImg(img);
      if (!n) return;
      s.images = s.images.map((i) => i.src === n.src ? n : i);
    },
    unregisterGalleryImage(srcRaw) {
      const src = strSrc(srcRaw);
      if (!src) return;
      const next = s.images.filter((i) => i.src !== src);
      if (next.length === s.images.length) return;
      s.images = next;
      emit();
    },
    openGalleryAt(srcRaw) {
      const src = strSrc(srcRaw);
      const list = images();
      let idx = -1;
      for (let i = 0; i < list.length; i++) {
        if (list[i].src === src) {
          idx = i;
          break;
        }
      }
      if (idx < 0) {
        s.override = [{ src, alt: "", highResSrc: "", children: null }];
        s.index = 0;
        s.open = true;
        emit();
        return;
      }
      s.override = null;
      s.index = idx;
      s.open = true;
      emit();
    },
    openGallery(items, startIndex) {
      let list = [];
      if (items && typeof items.length === "number") {
        for (let i = 0; i < items.length; i++) {
          const n = normalizeImg(items[i]);
          if (n) list = list.concat([n]);
        }
      }
      if (!list.length) return;
      let idx = typeof startIndex === "number" ? startIndex : 0;
      if (idx < 0) idx = 0;
      if (idx >= list.length) idx = list.length - 1;
      s.override = list;
      s.index = idx;
      s.open = true;
      emit();
    },
    closeGallery() {
      if (!s.open && !s.override) return;
      s.open = false;
      s.override = null;
      try {
        const loc = document.location;
        if (loc && typeof loc.hash === "string" && loc.hash.indexOf("#img=") === 0) {
          loc.hash = "";
        }
      } catch (_) {
      }
      emit();
    },
    galleryGoNext() {
      const list = images();
      if (list.length <= 1) return;
      s.index = (s.index + 1) % list.length;
      emit();
    },
    galleryGoPrev() {
      const list = images();
      if (list.length <= 1) return;
      s.index = (s.index - 1 + list.length) % list.length;
      emit();
    },
    setGalleryHash(srcRaw) {
      const src = strSrc(srcRaw);
      if (!src) return;
      try {
        const loc = document.location;
        if (!loc) return;
        const hashBody = galleryImgHash(src);
        if (loc.hash === "#" + hashBody) return;
        loc.hash = hashBody;
      } catch (_) {
      }
    },
    readHashImgSrc() {
      try {
        const loc = document.location;
        if (!loc || typeof loc.hash !== "string") return "";
        return readHashImgSrc(loc.hash);
      } catch (_) {
        return "";
      }
    },
    galleryDisplaySrc,
    safeImgDomId,
    galleryImgHash
  };
}
var GALLERY_CSS = `
:root {
  --relay-gallery-bg: rgba(0,0,0,0.92);
  --relay-gallery-fg: #f5f5f5;
  --relay-gallery-z: 200;
}
.relay-pop-image {
  display: block;
  margin: 1rem 0;
}
.relay-pop-image-control {
  cursor: pointer;
  position: relative;
  outline: none;
}
.relay-pop-image-inner {
  position: relative;
  overflow: hidden;
  background: rgba(127,127,127,0.12);
}
.relay-pop-image-img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}
.relay-pop-image-img[data-relay-img-state="loading"],
.relay-pop-image-img[data-relay-img-state="retrying"],
.relay-pop-image-img[data-relay-img-state="failed"] {
  min-height: 8rem;
  background: linear-gradient(90deg, rgba(127,127,127,0.08), rgba(127,127,127,0.18), rgba(127,127,127,0.08));
  background-size: 200% 100%;
}
.relay-pop-image-hover {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
  background: rgba(0,0,0,0.25);
  pointer-events: none;
}
.relay-pop-image-control:hover .relay-pop-image-hover,
.relay-pop-image-control:focus .relay-pop-image-hover {
  opacity: 1;
}
.relay-pop-image-max {
  color: #fff;
  font-size: 1.5rem;
}
.relay-pop-image-caption {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.85;
}
.relay-gallery {
  position: fixed;
  inset: 0;
  z-index: var(--relay-gallery-z);
  display: flex;
  flex-direction: column;
  background: var(--relay-gallery-bg);
  color: var(--relay-gallery-fg);
}
.relay-gallery[hidden] { display: none !important; }
.relay-gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  gap: 1rem;
}
.relay-gallery-count {
  font-size: 0.85rem;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.relay-gallery-close,
.relay-gallery-nav {
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  font-size: 1.75rem;
  line-height: 1;
  padding: 0.5rem 0.75rem;
}
.relay-gallery-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 0;
  padding: 0 3rem;
}
.relay-gallery-img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
}
.relay-gallery-img[data-relay-img-state="loading"],
.relay-gallery-img[data-relay-img-state="retrying"],
.relay-gallery-img[data-relay-img-state="failed"] {
  min-width: 12rem;
  min-height: 12rem;
  background: rgba(255,255,255,0.06);
}
.relay-gallery-prev { position: absolute; left: 0.25rem; top: 50%; transform: translateY(-50%); }
.relay-gallery-next { position: absolute; right: 0.25rem; top: 50%; transform: translateY(-50%); }
.relay-gallery-caption {
  text-align: center;
  padding: 0.75rem 1rem 1.25rem;
  font-size: 0.95rem;
}
`;
function ensureGalleryCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById("relay-gallery-css")) return;
  const style = document.createElement("style");
  style.id = "relay-gallery-css";
  style.textContent = GALLERY_CSS;
  document.head.appendChild(style);
}
function propFromEl(el, key, fallback) {
  const attr = key === "className" ? "class" : key;
  const camel = key;
  const dataKey = "data-" + key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
  let v = el.getAttribute(attr);
  if (v == null || v === "") v = el.getAttribute(dataKey);
  if (v == null || v === "") {
    try {
      if (el.dataset && el.dataset[camel]) v = el.dataset[camel];
    } catch (_) {
    }
  }
  if (v == null || v === "") return fallback;
  return v;
}
function captionFor(img) {
  if (!img) return "";
  if (typeof img.children === "string" && img.children) return img.children;
  if (typeof img.alt === "string" && img.alt) return img.alt;
  const src = str(img.src);
  if (!src) return "";
  const parts = src.split("/");
  let base = parts.length ? parts[parts.length - 1] : "";
  const q = base.indexOf("?");
  if (q >= 0) base = base.slice(0, q);
  const dot = base.lastIndexOf(".");
  if (dot > 0) base = base.slice(0, dot);
  return base.split("_").join(" ");
}
function readPortraitSibling(src) {
  try {
    const map = globalThis.__RELAY_PORTRAIT_SIBLINGS__;
    if (!map || typeof map !== "object") return "";
    const raw = str(src);
    const q = raw.indexOf("?");
    const path = q >= 0 ? raw.slice(0, q) : raw;
    const dot = path.lastIndexOf(".");
    if (dot <= 0) return "";
    const portrait = path.slice(0, dot) + "-portrait" + path.slice(dot);
    const rel = portrait.replace(/^\//, "");
    if (map[rel] || map[portrait] || map["/" + rel]) {
      return portrait;
    }
  } catch (_) {
  }
  return "";
}
function buildPopImageElement(props) {
  ensureGalleryCss();
  const gallery = ensureGalleryApi();
  const src = str(props.src || props["data-src"] || "");
  const alt = str(props.alt || props["data-alt"] || "");
  const className = str(props.className || props.class || "");
  const highResSrc = str(props.highResSrc || props["data-high-res-src"] || "");
  const aspectRatio = str(props.aspectRatio || props["data-aspect-ratio"] || "3 / 2");
  const retryRaw = props.retry != null ? props.retry : props["data-retry"];
  const maxAttempts = retryRaw != null && !Number.isNaN(Number(retryRaw)) ? Number(retryRaw) : DEFAULT_MAX_ATTEMPTS;
  let caption = "";
  if (typeof props.children === "string") caption = props.children;
  else if (Array.isArray(props.children) && props.children.length === 1) {
    const c = props.children[0];
    if (typeof c === "string") caption = c;
    else if (c && c.Text) caption = String(c.Text);
    else if (c && c.text) caption = String(c.text);
  }
  const root = document.createElement("aside");
  root.className = "relay-pop-image pt-popimage" + (className ? " " + className : "");
  root.setAttribute("data-relay-popimage", "true");
  root.setAttribute("data-pt-popimage", "true");
  root.setAttribute("aria-label", alt || "Figure");
  const control = document.createElement("div");
  control.className = "relay-pop-image-control";
  control.id = gallery.safeImgDomId(src);
  control.setAttribute("role", "button");
  control.tabIndex = 0;
  const inner = document.createElement("div");
  inner.className = "relay-pop-image-inner pt-popimage-inner";
  inner.style.aspectRatio = aspectRatio;
  const img = document.createElement("img");
  img.className = "relay-pop-image-img pt-popimage-img";
  img.alt = alt;
  img.loading = "lazy";
  img.width = 360;
  img.height = 240;
  img.style.width = "100%";
  img.style.height = "auto";
  img.style.aspectRatio = aspectRatio;
  const portraitSrc = readPortraitSibling(src);
  if (portraitSrc) {
    const picture = document.createElement("picture");
    const source = document.createElement("source");
    source.media = "(max-width: 768px)";
    source.srcset = portraitSrc;
    picture.appendChild(source);
    picture.appendChild(img);
    inner.appendChild(picture);
  } else {
    inner.appendChild(img);
  }
  const hover = document.createElement("div");
  hover.className = "relay-pop-image-hover pt-popimage-hover";
  hover.setAttribute("aria-hidden", "true");
  const max = document.createElement("span");
  max.className = "relay-pop-image-max pt-popimage-max";
  max.textContent = "\u2922";
  hover.appendChild(max);
  inner.appendChild(hover);
  control.appendChild(inner);
  if (caption) {
    const cap = document.createElement("div");
    cap.className = "relay-pop-image-caption pt-popimage-caption";
    cap.textContent = caption;
    control.appendChild(cap);
  }
  root.appendChild(control);
  const loader = attachSoftRetryImage(img, src, { maxAttempts });
  if (src) {
    gallery.registerGalleryImage({
      src,
      alt,
      highResSrc,
      children: caption || null
    });
  }
  const open = () => {
    if (!src) return;
    gallery.openGalleryAt(src);
  };
  control.addEventListener("click", open);
  control.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
  try {
    const hashSrc = gallery.readHashImgSrc();
    if (hashSrc && hashSrc === src) {
      gallery.openGalleryAt(src);
      try {
        control.scrollIntoView({ behavior: "auto", block: "center" });
      } catch (_) {
      }
    }
  } catch (_) {
  }
  root._relaySoftRetry = loader;
  return root;
}
function buildGalleryOverlayElement() {
  ensureGalleryCss();
  const gallery = ensureGalleryApi();
  const root = document.createElement("div");
  root.className = "relay-gallery pt-gallery";
  root.setAttribute("data-relay-gallery", "true");
  root.setAttribute("data-pt-gallery", "true");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Image gallery");
  root.hidden = true;
  const header = document.createElement("div");
  header.className = "relay-gallery-header pt-gallery-header";
  const count = document.createElement("div");
  count.className = "relay-gallery-count pt-gallery-count";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "relay-gallery-close pt-gallery-close";
  closeBtn.setAttribute("aria-label", "Close gallery");
  closeBtn.textContent = "\u2715";
  header.appendChild(count);
  header.appendChild(closeBtn);
  const stage = document.createElement("div");
  stage.className = "relay-gallery-stage pt-gallery-stage";
  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "relay-gallery-nav relay-gallery-prev pt-gallery-nav pt-gallery-prev";
  prevBtn.setAttribute("aria-label", "Previous image");
  prevBtn.textContent = "\u2039";
  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "relay-gallery-nav relay-gallery-next pt-gallery-nav pt-gallery-next";
  nextBtn.setAttribute("aria-label", "Next image");
  nextBtn.textContent = "\u203A";
  const img = document.createElement("img");
  img.className = "relay-gallery-img pt-gallery-img";
  img.alt = "";
  stage.appendChild(prevBtn);
  stage.appendChild(img);
  stage.appendChild(nextBtn);
  const captionEl = document.createElement("div");
  captionEl.className = "relay-gallery-caption pt-gallery-caption";
  root.appendChild(header);
  root.appendChild(stage);
  root.appendChild(captionEl);
  let loader = null;
  let bodyOverflowPrev = "";
  let keyHandler = null;
  function teardownChrome() {
    if (keyHandler) {
      try {
        document.removeEventListener("keydown", keyHandler);
      } catch (_) {
      }
      keyHandler = null;
    }
    try {
      if (document.body) document.body.style.overflow = bodyOverflowPrev;
    } catch (_) {
    }
  }
  function render() {
    const open = gallery.galleryIsOpen();
    const images = gallery.galleryImages();
    const index = gallery.galleryIndex();
    const current = open && index >= 0 && index < images.length ? images[index] : null;
    if (!open || !current) {
      root.hidden = true;
      teardownChrome();
      if (loader) {
        loader.cancel();
        loader = null;
      }
      return;
    }
    root.hidden = false;
    const displaySrc = gallery.galleryDisplaySrc(current);
    count.textContent = index + 1 + " / " + images.length + " \u2014 " + current.src;
    const multi = images.length > 1;
    prevBtn.hidden = !multi;
    nextBtn.hidden = !multi;
    img.alt = current.alt || "";
    const cap = captionFor(current);
    captionEl.textContent = cap;
    captionEl.hidden = !cap;
    gallery.setGalleryHash(current.src);
    if (loader) loader.reload(displaySrc);
    else loader = attachSoftRetryImage(img, displaySrc, {});
    if (!keyHandler) {
      keyHandler = (e) => {
        if (e.key === "Escape") gallery.closeGallery();
        if (e.key === "ArrowRight") gallery.galleryGoNext();
        if (e.key === "ArrowLeft") gallery.galleryGoPrev();
      };
      document.addEventListener("keydown", keyHandler);
      try {
        bodyOverflowPrev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      } catch (_) {
      }
    }
  }
  closeBtn.addEventListener("click", () => gallery.closeGallery());
  prevBtn.addEventListener("click", () => gallery.galleryGoPrev());
  nextBtn.addEventListener("click", () => gallery.galleryGoNext());
  root.addEventListener("click", (e) => {
    if (e.target === root) gallery.closeGallery();
  });
  gallery.gallerySubscribe(render);
  render();
  return root;
}
function propsFromVnode(props) {
  const out = {};
  if (!props) return out;
  for (const [k, v] of Object.entries(props)) {
    if (v && typeof v === "object" && "value" in v) out[k] = v.value;
    else out[k] = v;
  }
  return out;
}
function buildRelayPopImage(props) {
  return buildPopImageElement(propsFromVnode(props));
}
function buildRelayImageGallery(props) {
  void props;
  return buildGalleryOverlayElement();
}
var _galleryApi = null;
function ensureGalleryApi() {
  if (_galleryApi) return _galleryApi;
  if (typeof globalThis !== "undefined" && globalThis.__relayGallery) {
    _galleryApi = globalThis.__relayGallery;
    return _galleryApi;
  }
  _galleryApi = createGalleryStore();
  if (typeof globalThis !== "undefined") {
    globalThis.__relayGallery = _galleryApi;
    globalThis.__relayAttachSoftRetryImage = attachSoftRetryImage;
    globalThis.__relayGalleryCall = function(op, arg) {
      const g = _galleryApi;
      if (!g) return;
      if (op === "openAt") g.openGalleryAt(arg);
      else if (op === "close") g.closeGallery();
      else if (op === "next") g.galleryGoNext();
      else if (op === "prev") g.galleryGoPrev();
      else if (op === "register") g.registerGalleryImage({ src: arg });
      else if (op === "unregister") g.unregisterGalleryImage(arg);
      else if (op === "setHash") g.setGalleryHash(arg);
    };
  }
  return _galleryApi;
}
function installRelayGalleryCustomElements() {
  ensureGalleryApi();
  ensureGalleryCss();
  if (typeof customElements === "undefined") return;
  if (!customElements.get("relay-pop-image")) {
    customElements.define(
      "relay-pop-image",
      class extends HTMLElement {
        connectedCallback() {
          if (this._relayBuilt) return;
          this._relayBuilt = true;
          const props = {
            src: propFromEl(this, "src", ""),
            alt: propFromEl(this, "alt", ""),
            className: propFromEl(this, "class", "") || propFromEl(this, "className", ""),
            highResSrc: propFromEl(this, "highResSrc", "") || propFromEl(this, "high-res-src", ""),
            aspectRatio: propFromEl(this, "aspectRatio", "") || propFromEl(this, "aspect-ratio", "3 / 2"),
            retry: propFromEl(this, "retry", ""),
            children: this.textContent || ""
          };
          const built = buildPopImageElement(props);
          this.replaceChildren(built);
        }
      }
    );
  }
  if (!customElements.get("relay-image-gallery")) {
    customElements.define(
      "relay-image-gallery",
      class extends HTMLElement {
        connectedCallback() {
          try {
            this.removeAttribute("class");
            this.style.display = "contents";
          } catch (_) {
          }
          if (this._relayBuilt) return;
          this._relayBuilt = true;
          const built = buildGalleryOverlayElement();
          this.replaceChildren(built);
        }
      }
    );
  }
}
function installRelayGalleryHost() {
  ensureGalleryApi();
  installRelayGalleryCustomElements();
  try {
    if (typeof globalThis.__relayRegisterParkNative === "function") {
      globalThis.__relayRegisterParkNative(
        "relay-pop-image",
        (props) => buildRelayPopImage(props)
      );
      globalThis.__relayRegisterParkNative(
        "relay-image-gallery",
        (props) => buildRelayImageGallery(props)
      );
    }
  } catch (_) {
  }
}

// src/vendor/relay-runtime-web.js
try {
  installRelayGalleryHost();
} catch (_) {
}
var _styleId = "relay-ssr-theme";
function yieldToMain() {
  return new Promise((resolve) => {
    try {
      if (typeof scheduler !== "undefined" && typeof scheduler.yield === "function") {
        scheduler.yield().then(resolve, () => setTimeout(resolve, 0));
        return;
      }
    } catch (_) {
    }
    try {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => setTimeout(resolve, 0));
        return;
      }
    } catch (_) {
    }
    setTimeout(resolve, 0);
  });
}
async function yieldForInteractive(preferIdleMs = 120) {
  await yieldToMain();
  await new Promise((resolve) => {
    try {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
        return;
      }
    } catch (_) {
    }
    setTimeout(resolve, 0);
  });
  await yieldToMain();
  await new Promise((resolve) => {
    try {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(() => resolve(), { timeout: Math.max(0, preferIdleMs | 0) });
        return;
      }
    } catch (_) {
    }
    setTimeout(resolve, 0);
  });
}
function documentFor(container) {
  if (container && container.ownerDocument) return container.ownerDocument;
  return typeof document !== "undefined" ? document : null;
}
function styleParentFor(container) {
  if (container && typeof container.getRootNode === "function") {
    const root = container.getRootNode();
    if (root && typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot) {
      return root;
    }
  }
  const doc = documentFor(container);
  return doc ? doc.head : null;
}
function themeTargetFor(container) {
  if (container && typeof container.getRootNode === "function") {
    const root = container.getRootNode();
    if (root && typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot) {
      return container.closest?.('[data-relay-theme-scope="hook"]') || root.querySelector?.('[data-relay-theme-scope="hook"]') || container;
    }
  }
  const doc = documentFor(container);
  return doc ? doc.documentElement : null;
}
function ensureStyleElement(id, parent) {
  if (!parent) return null;
  const doc = parent.ownerDocument || (typeof document !== "undefined" ? document : null);
  if (!doc) return null;
  let el = parent.querySelector ? parent.querySelector(`style#${id}`) : null;
  if (!el && typeof doc.getElementById === "function") {
    const existing = doc.getElementById(id);
    if (existing && existing.tagName === "STYLE" && existing.ownerDocument === doc) {
      parent.appendChild(existing);
      el = existing;
    }
  }
  if (!el) {
    el = doc.createElement("style");
    el.id = id;
    parent.appendChild(el);
  } else if (el.parentNode !== parent) {
    parent.appendChild(el);
  }
  return el;
}
function applyInjectedCss(container) {
  try {
    const css = typeof get_injected_css === "function" ? get_injected_css() : "";
    const parent = styleParentFor(container);
    if (css && String(css).trim()) {
      const styleEl = ensureStyleElement(_styleId, parent);
      if (styleEl) styleEl.textContent = String(css);
    }
  } catch (_) {
  }
  syncHtmlThemeClass(themeTargetFor(container));
}
function applyHtmlThemeClass(root, name) {
  if (!root || name !== "light" && name !== "dark") return;
  try {
    root.setAttribute("class", name);
  } catch (_) {
    try {
      root.classList.remove("light", "dark");
      root.classList.add(name);
    } catch (_2) {
    }
  }
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
    applyHtmlThemeClass(root, tip);
    return;
  }
  let stored = "";
  try {
    if (typeof localStorage !== "undefined") {
      stored = String(localStorage.getItem("pt-theme") || "").trim();
    }
  } catch (_) {
    stored = "";
  }
  if (stored === "light" || stored === "dark") {
    try {
      root.setAttribute("data-pt-theme", stored);
    } catch (_) {
    }
    applyHtmlThemeClass(root, stored);
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
  applyHtmlThemeClass(root, name);
}
function syncHtmlHydratedAttr(live, container) {
  const doc = documentFor(container);
  if (!doc) return;
  try {
    const root = doc.documentElement;
    if (!root || typeof root.setAttribute !== "function") return;
    root.setAttribute("data-pt-hydrated", live ? "1" : "0");
    let phase = live ? 1 : 0;
    try {
      if (typeof get_client_live_phase === "function") {
        phase = Number(get_client_live_phase()) || phase;
      }
    } catch (_) {
    }
    root.setAttribute("data-pt-live-phase", String(phase));
  } catch (_) {
  }
}
function syncHtmlLivePhaseAttr(phase, container) {
  const doc = documentFor(container);
  if (!doc) return;
  try {
    const root = doc.documentElement;
    if (!root || typeof root.setAttribute !== "function") return;
    const p = Math.max(0, Math.min(4, Number(phase) || 0));
    root.setAttribute("data-pt-live-phase", String(p));
    root.setAttribute("data-pt-hydrated", p >= 1 ? "1" : "0");
  } catch (_) {
  }
}
function installRumBeacon(container, { hydrateOk = true } = {}) {
  try {
    const doc = documentFor(container) || document;
    const win = doc.defaultView || window;
    if (!win || typeof win.fetch !== "function") return;
    const sample = (() => {
      try {
        const m = /(?:^|[?&])rum_sample=([0-9.]+)/.exec(win.location.search || "");
        if (m) return Math.min(1, Math.max(0, parseFloat(m[1])));
      } catch (_) {
      }
      return 1;
    })();
    if (Math.random() > sample) return;
    if (win.__relayRumInstalled) return;
    win.__relayRumInstalled = true;
    const t0 = win.performance && performance.now ? performance.now() : Date.now();
    const payload = {
      path: win.location && win.location.pathname || "/",
      embed_oid: null,
      hydrate_ok: !!hydrateOk,
      ttfc_ms: null,
      lcp_ms: null,
      inp_ms: null,
      cls: null
    };
    try {
      const scripts = doc.querySelectorAll('script[src*="/assets/"]');
      for (const s of scripts) {
        const m = /\/assets\/c\/([0-9a-f]{7,40})\//i.exec(s.src || "");
        if (m) {
          payload.embed_oid = m[1];
          break;
        }
      }
    } catch (_) {
    }
    const send = () => {
      try {
        const body = JSON.stringify(payload);
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          const blob = new Blob([body], { type: "application/json" });
          if (navigator.sendBeacon("/api/rum", blob)) return;
        }
        win.fetch("/api/rum", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          keepalive: true
        }).catch(() => {
        });
      } catch (_) {
      }
    };
    let sent = false;
    const maybeSend = () => {
      if (sent) return;
      if (payload.ttfc_ms == null) return;
      sent = true;
      setTimeout(send, 2500);
    };
    const markTtfc = () => {
      if (payload.ttfc_ms != null) return;
      const now = win.performance && performance.now ? performance.now() : Date.now();
      payload.ttfc_ms = Math.round(now - t0);
      maybeSend();
    };
    try {
      const nav = doc.querySelector("nav a[href], a[href]");
      if (nav) {
        const r = nav.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          const x = Math.min(win.innerWidth - 2, Math.max(2, r.left + 4));
          const y = Math.min(win.innerHeight - 2, Math.max(2, r.top + 4));
          const hit = doc.elementFromPoint(x, y);
          if (hit && (hit === nav || nav.contains(hit))) markTtfc();
        }
      }
    } catch (_) {
    }
    try {
      doc.addEventListener(
        "pointerdown",
        (e) => {
          const a = e.target && e.target.closest && e.target.closest("a[href]");
          if (a) markTtfc();
        },
        { once: true, capture: true }
      );
    } catch (_) {
    }
    try {
      if (typeof PerformanceObserver === "function") {
        const po = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (e.entryType === "largest-contentful-paint") {
              payload.lcp_ms = Math.round(e.startTime);
            } else if (e.entryType === "event" && e.name === "event" && e.duration != null) {
              const d = e.duration;
              if (payload.inp_ms == null || d > payload.inp_ms) payload.inp_ms = Math.round(d);
            } else if (e.entryType === "layout-shift" && !e.hadRecentInput) {
              payload.cls = (payload.cls || 0) + (e.value || 0);
            }
          }
        });
        try {
          po.observe({ type: "largest-contentful-paint", buffered: true });
        } catch (_) {
        }
        try {
          po.observe({ type: "layout-shift", buffered: true });
        } catch (_) {
        }
        try {
          po.observe({ type: "event", buffered: true, durationThreshold: 16 });
        } catch (_) {
        }
      }
    } catch (_) {
    }
    setTimeout(() => {
      if (payload.ttfc_ms == null) markTtfc();
      maybeSend();
    }, 3e3);
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
function setVnodeDomAttribute(el, key, str2) {
  if (key === "className") {
    if (el.namespaceURI === SVG_NS) el.setAttribute("class", str2);
    else el.className = str2;
    return;
  }
  if (key.startsWith("data") && key.length > 4) {
    const attr = "data-" + key.slice(4).replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
    el.setAttribute(attr, str2);
    return;
  }
  el.setAttribute(key, str2);
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
    const str2 = val && typeof val === "object" && val.type === "String" && val.value !== void 0 ? val.value : typeof val === "string" ? val : val && typeof val === "object" && val.type === "Number" && val.value !== void 0 ? String(val.value) : typeof val === "number" ? String(val) : null;
    if (str2 != null) setVnodeDomAttribute(el, k, str2);
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
        const underNative = rel.indexOf("/native/") >= 0 || rel.indexOf("native/") === 0;
        const candidates = underNative ? platformModuleCandidates(rel, detectRelayHostPlatform()).filter((c) => {
          return c.indexOf(".web.") < 0 && c.indexOf(".host.") < 0;
        }) : [rel];
        for (let ci = 0; ci < candidates.length; ci = ci + 1) {
          const cand = candidates[ci];
          if (!cand || moduleMapHas(moduleMap, cand) || queued.has(cand)) continue;
          queued.add(cand);
          toFetch.push(cand);
        }
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
function relayWasmPrefix() {
  try {
    if (typeof globalThis !== "undefined" && globalThis.__RELAY_WASM_PREFIX__) {
      return String(globalThis.__RELAY_WASM_PREFIX__).replace(/\/?$/, "/");
    }
  } catch (_) {
  }
  try {
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].getAttribute("src") || "";
      const m = src.match(/\/(?:assets|wasm)\/c\/([a-f0-9]{40})\//i);
      if (m) return "/wasm/c/" + m[1] + "/";
    }
  } catch (_) {
  }
  return "/wasm/";
}
function relayVideoWebModuleUrl() {
  try {
    if (typeof globalThis !== "undefined" && globalThis.__RELAY_VIDEO_WEB_URL__) {
      return String(globalThis.__RELAY_VIDEO_WEB_URL__);
    }
  } catch (_) {
  }
  return relayWasmPrefix() + "relay_video_wasm_pkg/player.js";
}
function relayVideoWasmUrl() {
  try {
    if (typeof globalThis !== "undefined" && globalThis.__RELAY_VIDEO_WASM_URL__) {
      return String(globalThis.__RELAY_VIDEO_WASM_URL__);
    }
  } catch (_) {
  }
  return relayWasmPrefix() + "relay_video_wasm_pkg/relay_video_wasm_bg.wasm";
}
function urlLooksMatroska(url) {
  const u = String(url || "").split("?")[0].toLowerCase();
  return u.endsWith(".mkv") || u.endsWith(".mka") || u.endsWith(".mks");
}
function nativeCanPlayUrl(url) {
  if (urlLooksMatroska(url)) return false;
  try {
    const v = document.createElement("video");
    if (/\.webm$/i.test(String(url).split("?")[0])) {
      const r2 = v.canPlayType('video/webm; codecs="vp8, vorbis"');
      return r2 === "probably" || r2 === "maybe";
    }
    const r = v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    return r === "probably" || r === "maybe";
  } catch (_) {
    return !urlLooksMatroska(url);
  }
}
function fireRelayVideoHandler(props, eventName, playerId, extra, invokeHandler, onAfterInvoke) {
  const val = props && props[eventName];
  if (!val || val.type !== "HandlerId") return;
  try {
    push_message_from_host(
      JSON.stringify({
        type: "relay-video",
        event: eventName,
        handlerId: val.value,
        playerId,
        ...extra || {}
      })
    );
    invokeHandler(val.value);
  } catch (err) {
    console.error("[relay-runtime] video handler failed:", err);
  }
  if (onAfterInvoke && consume_render_requested()) onAfterInvoke();
}
function attachHtml5VideoPlayer(shell, props, invokeHandler, onAfterInvoke, src) {
  const video = document.createElement("video");
  video.className = "relay-video-player";
  video.setAttribute("playsinline", "");
  video.setAttribute("preload", "metadata");
  video.dataset.relayEngine = "native";
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
        tracks.forEach((t) => {
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
  attachMediaHandler(video, "loadedmetadata", props, "onLoadedMetadata", invokeHandler, onAfterInvoke);
  attachMediaHandler(video, "seeked", props, "onSeeked", invokeHandler, onAfterInvoke);
  let escalated = false;
  video.addEventListener("error", () => {
    if (escalated || !src) {
      fireRelayVideoHandler(props, "onError", playerId, {}, invokeHandler, onAfterInvoke);
      return;
    }
    escalated = true;
    try {
      video.remove();
    } catch (_) {
    }
    shell.innerHTML = "";
    mountWasmVideoPlayer(shell, props, invokeHandler, onAfterInvoke, src);
  });
  let lastTimeEvent = 0;
  video.addEventListener("timeupdate", () => {
    const now = Date.now();
    if (now - lastTimeEvent < 250) return;
    lastTimeEvent = now;
    fireRelayVideoHandler(
      props,
      "onTimeUpdate",
      playerId,
      { currentTime: video.currentTime, duration: video.duration },
      invokeHandler,
      onAfterInvoke
    );
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
  shell.__relayVideoApi = {
    engine: "native",
    play: () => video.play(),
    pause: () => video.pause(),
    seek: (t) => {
      video.currentTime = t;
    }
  };
  return shell;
}
function spokenVideoError(err) {
  if (err && typeof err.userMessage === "string" && err.userMessage) return err.userMessage;
  const code = err && err.code ? String(err.code) : "";
  if (code === "WEBCODECS_UNSUPPORTED" || code === "SOURCE_TOO_LARGE") {
    return "Full quality needs a capable browser \u2014 switching to a compatibility stream.";
  }
  if (code === "FETCH_FAILED") {
    return "The video file could not be downloaded. Trying another source.";
  }
  if (code === "WASM_LOAD_FAILED" || code === "ENGINE_MISSING") {
    return "This browser could not load the extended video engine.";
  }
  if (code === "DEMUX_FAILED") {
    return "This file\u2019s container could not be read.";
  }
  if (code === "DECODE_FAILED" || code === "UNDERRUN") {
    return "Video decode failed on this device.";
  }
  const msg = err && err.message ? String(err.message) : "";
  if (msg) return msg.split(" (")[0];
  return "Playback failed.";
}
function mountWasmVideoPlayer(shell, props, invokeHandler, onAfterInvoke, src) {
  const playerId = propStringFromVnodeProps(props, "playerId") || `rvp-${Math.random().toString(36).slice(2)}`;
  shell.dataset.relayEngine = "wasm";
  shell.dataset.relayPlayerId = playerId;
  const note = document.createElement("div");
  note.className = "relay-video-player-loading";
  note.setAttribute("role", "status");
  note.textContent = "Loading extended video engine\u2026";
  shell.appendChild(note);
  const modUrl = relayVideoWebModuleUrl();
  import(
    /* webpackIgnore: true */
    modUrl
  ).then((mod) => {
    const create = mod.createWasmPlayer || mod.default && mod.default.createWasmPlayer;
    if (!create) {
      const err = new Error("relay-video-web missing createWasmPlayer");
      err.code = "ENGINE_MISSING";
      err.userMessage = "The extended video engine is missing from this site build. Switching to a compatibility stream.";
      throw err;
    }
    return create(shell, src, {
      wasmUrl: relayVideoWasmUrl(),
      autoPlay: propBoolFromVnodePropsLoose(props, "autoPlay") === true || propBoolFromVnodePropsLoose(props, "playing") === true,
      onStatus: (msg) => {
        try {
          if (msg) note.textContent = msg;
          else if (note.parentNode) note.remove();
        } catch (_) {
        }
      },
      onPlay: () => fireRelayVideoHandler(props, "onPlay", playerId, {}, invokeHandler, onAfterInvoke),
      onPause: () => fireRelayVideoHandler(props, "onPause", playerId, {}, invokeHandler, onAfterInvoke),
      onEnded: () => fireRelayVideoHandler(props, "onEnded", playerId, {}, invokeHandler, onAfterInvoke),
      onError: (err) => {
        try {
          note.textContent = spokenVideoError(err);
          if (!note.parentNode) shell.appendChild(note);
        } catch (_) {
        }
        fireRelayVideoHandler(props, "onError", playerId, {}, invokeHandler, onAfterInvoke);
      },
      onUnderrun: (err) => {
        try {
          note.textContent = spokenVideoError(err);
          if (!note.parentNode) shell.appendChild(note);
        } catch (_) {
        }
        fireRelayVideoHandler(props, "onError", playerId, {}, invokeHandler, onAfterInvoke);
      },
      onTimeUpdate: (t, d) => fireRelayVideoHandler(
        props,
        "onTimeUpdate",
        playerId,
        { currentTime: t, duration: d },
        invokeHandler,
        onAfterInvoke
      )
    });
  }).then((api) => {
    try {
      if (note.parentNode) note.remove();
    } catch (_) {
    }
    shell.__relayVideoApi = api;
    fireRelayVideoHandler(props, "onLoadedMetadata", playerId, {}, invokeHandler, onAfterInvoke);
    const cmdSeq = propNumberFromVnodeProps(props, "commandSeq");
    const cmd = propNumberFromVnodeProps(props, "command");
    const cmdArg = propNumberFromVnodeProps(props, "commandArg");
    if (cmdSeq != null && String(cmdSeq) !== shell.dataset.relayCommandSeq) {
      shell.dataset.relayCommandSeq = String(cmdSeq);
      if (cmd === 1 && api.play) api.play();
      else if (cmd === 2 && api.pause) api.pause();
      else if (cmd === 3 && cmdArg != null && api.seek) api.seek(cmdArg);
    }
  }).catch((e) => {
    console.warn("[relay-runtime] WASM video escalate failed", e);
    try {
      note.textContent = spokenVideoError(e);
    } catch (_) {
    }
    fireRelayVideoHandler(props, "onError", playerId, {}, invokeHandler, onAfterInvoke);
  });
  return shell;
}
function buildRelayVideoPlayer(props, invokeHandler, onAfterInvoke) {
  const shell = document.createElement("div");
  shell.className = "relay-video-player-shell";
  const src = resolveMediaUrl(propStringFromVnodeProps(props, "src"));
  if (src && !nativeCanPlayUrl(src)) {
    return mountWasmVideoPlayer(shell, props, invokeHandler, onAfterInvoke, src);
  }
  return attachHtml5VideoPlayer(shell, props, invokeHandler, onAfterInvoke, src);
}
function propBoolFromVnodeProps(props, key) {
  const val = props && props[key];
  return !!(val && typeof val === "object" && val.type === "Bool" && val.value === true);
}
function shouldInterceptRelayControlledAnchorClick(e, el) {
  if (e.defaultPrevented || e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  try {
    const doc = el && el.ownerDocument ? el.ownerDocument : document;
    if (doc?.documentElement?.getAttribute?.("data-pt-hydrated") !== "1") return false;
  } catch (_) {
  }
  const t = el.getAttribute("target");
  if (t && t !== "_self") return false;
  const href = el.getAttribute("href");
  if (!href) return true;
  if (/^(mailto:|tel:|#)/i.test(href)) return false;
  if (/^(https?:|\/\/)/i.test(href)) return false;
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
  if (tag === "relay-video-player" || tag === "relay-audio-player" || tag === "relay-hook-renderer" || tag === "relay-pop-image" || tag === "relay-image-gallery") {
    return "DIV";
  }
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
        return hydrateElementNode(v, kids[0], invokeHandler, onAfterInvoke, `/${tag || "root"}`, true);
      }
      if (kids.length === 0 && (!children || children.length === 0)) return true;
      if (kids.length > 0 && children && children.length) {
        console.warn(
          `[relay-runtime] hydrate root child-count soft mismatch: vnode children vs dom=${kids.length} \u2014 best-effort`
        );
        return hydrateChildren(children, kids, invokeHandler, onAfterInvoke, `/${tag || "root"}`);
      }
      console.warn(
        `[relay-runtime] hydrate root child-count mismatch: vnode children vs dom=${kids.length} \u2014 keeping SSR`
      );
      return true;
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
  if (flat.length === 0 && domEls.length === 0) return true;
  if (flat.length !== domEls.length) {
    const vnodeTags = flat.map((v) => v.Element && v.Element.tag || "?").join(",");
    const domTags = domEls.map((el) => el.tagName || "?").join(",");
    console.warn(
      `[relay-runtime] hydrate child-count mismatch at ${basePath || "/"}: vnode=${flat.length}[${vnodeTags}] dom=${domEls.length}[${domTags}] \u2014 soft hydrate`
    );
  }
  const n = Math.min(flat.length, domEls.length);
  for (let i = 0; i < n; i++) {
    const expect = expectedDomTag(flat[i].Element && flat[i].Element.tag);
    const got = String(domEls[i].tagName || "").toUpperCase();
    if (expect && got && expect !== got && !(expect === "DIV" && got === "DIV")) {
      console.warn(
        `[relay-runtime] hydrate skip tag mismatch at ${basePath}/${expect}[${i}]: vnode=${expect} dom=${got}`
      );
      continue;
    }
    const tag = flat[i].Element && flat[i].Element.tag || i;
    hydrateElementNode(flat[i], domEls[i], invokeHandler, onAfterInvoke, `${basePath}/${tag}[${i}]`, true);
  }
  return true;
}
function hydrateElementNode(v, el, invokeHandler, onAfterInvoke, path, soft = false) {
  if (!v || !v.Element || !el) return soft;
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
      return soft;
    }
  }
  attachHandlersFromProps(el, tag, props || {}, invokeHandler, onAfterInvoke);
  return hydrateChildren(children || [], elementChildNodes(el), invokeHandler, onAfterInvoke, here);
}
function promoteSsrShellWithoutWipe(container, opts = {}) {
  if (!container) return;
  try {
    container.dataset.relayHydrated = "1";
  } catch (_) {
  }
  try {
    if (typeof set_client_live_phase === "function") {
      set_client_live_phase(1);
    } else if (typeof set_client_live === "function") {
      set_client_live(true);
    }
  } catch (_) {
  }
  syncHtmlLivePhaseAttr(1, container);
  try {
    const nodes = container.querySelectorAll ? container.querySelectorAll(".pt-client-only") : [];
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      try {
        if (el.disabled) el.disabled = false;
      } catch (_) {
      }
      try {
        if (el.getAttribute("aria-disabled") === "true") {
          el.setAttribute("aria-disabled", "false");
        }
      } catch (_) {
      }
    }
  } catch (_) {
  }
  installRumBeacon(container, { hydrateOk: opts.hydrateOk !== false });
}
var SSR_PLACEHOLDER_SELECTORS = "[data-pt-dirnav-ssr],[data-pt-changelog-ssr],[data-pt-flashback-ssr],[data-pt-autoindex-ssr],[data-pt-deferred-ssr]";
function cssEscapeIdent(s) {
  try {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(s);
  } catch (_) {
  }
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function replaceSsrPlaceholdersFromVnode(container, vnode, invokeHandler, onAfterInvoke) {
  if (!container || !vnode) return false;
  const searchRoot = vnodeToDom(vnode, invokeHandler, onAfterInvoke);
  if (!searchRoot || typeof searchRoot.querySelectorAll !== "function") return false;
  const targets = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (el) => {
    if (!el || seen.has(el)) return;
    seen.add(el);
    targets.push(el);
  };
  container.querySelectorAll(SSR_PLACEHOLDER_SELECTORS).forEach(add);
  ;
  ["Site directory", "Directory", "Change log", "Flashback now showing", "Auto index", "Deferred section"].forEach((label) => {
    container.querySelectorAll(`[aria-label="${cssEscapeIdent(label)}"]`).forEach(add);
  });
  if (!targets.length) return false;
  let replaced = 0;
  for (let i = 0; i < targets.length; i++) {
    const oldEl = targets[i];
    if (!oldEl.isConnected) continue;
    let next = null;
    const label = oldEl.getAttribute("aria-label");
    if (label) {
      next = searchRoot.querySelector(`[aria-label="${cssEscapeIdent(label)}"]`);
    }
    if (!next) {
      if (oldEl.classList?.contains("pt-dir-nav") || oldEl.hasAttribute("data-pt-dirnav-ssr")) {
        next = searchRoot.querySelector(".pt-dir-nav");
      } else if (oldEl.classList?.contains("pt-changelog") || oldEl.hasAttribute("data-pt-changelog-ssr")) {
        next = searchRoot.querySelector(".pt-changelog");
      } else if (oldEl.classList?.contains("pt-flashback-now") || oldEl.hasAttribute("data-pt-flashback-ssr")) {
        next = searchRoot.querySelector(".pt-flashback-now");
      } else if (oldEl.hasAttribute("data-pt-autoindex-ssr") || oldEl.hasAttribute("data-pt-dir-index") || oldEl.classList?.contains("pt-dir-index")) {
        next = searchRoot.querySelector('[data-pt-dir-index="1"]:not([data-pt-md-css])') || searchRoot.querySelector(".pt-dir-index[data-pt-dir-index]:not([hidden])") || searchRoot.querySelector('[aria-label="Auto index"]');
      } else if (oldEl.classList?.contains("pt-deferred-md") || oldEl.hasAttribute("data-pt-deferred-ssr")) {
        next = searchRoot.querySelector("section.pt-deferred-md") || searchRoot.querySelector("[data-pt-deferred],[data-pt-deferred-pending],[data-pt-deferred-ssr]");
      }
    }
    if (!next || !oldEl.parentNode) continue;
    if (container.contains(next)) continue;
    try {
      oldEl.parentNode.replaceChild(next, oldEl);
      replaced += 1;
    } catch (_) {
    }
  }
  return replaced > 0;
}
function computeVnodePatches(oldV, newV) {
  const acc = [];
  patchesAt(oldV, newV, [], acc);
  return acc;
}
function vnodeDeepEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
function patchesAt(oldV, newV, path, acc) {
  if (vnodeDeepEqual(oldV, newV)) return;
  const oEl = oldV && oldV.Element;
  const nEl = newV && newV.Element;
  if (oEl && nEl) {
    const sameTag = oEl.tag === nEl.tag && (oEl.key ?? null) === (nEl.key ?? null);
    const oKids = oEl.children || [];
    const nKids = nEl.children || [];
    if (sameTag && oKids.length === nKids.length) {
      if (!vnodeDeepEqual(oEl.props || {}, nEl.props || {})) {
        acc.push({ path: path.slice(), tree: newV });
        return;
      }
      for (let i = 0; i < oKids.length; i++) {
        patchesAt(oKids[i], nKids[i], path.concat(i), acc);
      }
      return;
    }
  }
  const oText = oldV && oldV.Text !== void 0;
  const nText = newV && newV.Text !== void 0;
  if (oText && nText && oldV.Text === newV.Text) return;
  acc.push({ path: path.slice(), tree: newV });
}
function vnodeProducesDom(v) {
  if (!v || v.Empty !== void 0) return false;
  return true;
}
function patchableChildNodes(parent) {
  const out = [];
  if (!parent || !parent.childNodes) return out;
  for (const n of parent.childNodes) {
    if (n.nodeType === 1 || n.nodeType === 3) out.push(n);
  }
  return out;
}
function childrenForPatchPath(v) {
  if (v && v.Element) return v.Element.children || [];
  if (Array.isArray(v)) return v;
  return [];
}
function applyVnodePatches(container, prevRoot, patches, invokeHandler, onAfterInvoke) {
  if (!container || !patches || !patches.length) return true;
  for (const p of patches) {
    const path = p.path || [];
    const tree = p.tree;
    if (path.length === 0) {
      return false;
    }
    let parentDom = container;
    let vnode = prevRoot;
    let targetNode = null;
    for (let d = 0; d < path.length; d++) {
      const idx = path[d];
      const kids = childrenForPatchPath(vnode);
      const domKids = patchableChildNodes(parentDom);
      let di = 0;
      let found = null;
      let foundV = null;
      for (let i = 0; i < kids.length; i++) {
        if (!vnodeProducesDom(kids[i])) continue;
        if (i === idx) {
          found = domKids[di];
          foundV = kids[i];
          break;
        }
        di += 1;
      }
      if (!found) return false;
      if (d === path.length - 1) {
        targetNode = found;
        break;
      }
      parentDom = found;
      vnode = foundV;
    }
    if (!targetNode || !parentDom) return false;
    const next = vnodeToDom(tree, invokeHandler, onAfterInvoke);
    if (!next) {
      parentDom.removeChild(targetNode);
      continue;
    }
    parentDom.replaceChild(next, targetNode);
  }
  return true;
}
var PARK_NATIVE_BUILDERS = /* @__PURE__ */ new Map();
function registerParkNative(tag, buildFn) {
  const t = String(tag || "").trim();
  if (!t || typeof buildFn !== "function") return;
  PARK_NATIVE_BUILDERS.set(t, buildFn);
}
function getParkNativeBuilder(tag) {
  return PARK_NATIVE_BUILDERS.get(String(tag || "").trim()) || null;
}
function listParkNativeTags() {
  return Array.from(PARK_NATIVE_BUILDERS.keys());
}
try {
  if (typeof globalThis !== "undefined") {
    globalThis.__relayRegisterParkNative = registerParkNative;
    globalThis.__relayGetParkNativeBuilder = getParkNativeBuilder;
  }
} catch (_) {
}
function platformModuleCandidates(pathKey, platform) {
  const raw = String(pathKey || "").replace(/^\/+/, "");
  if (!raw) return [];
  const plat = String(platform || detectRelayHostPlatform()).trim() || "web";
  const out = [];
  const m = raw.match(/^(.*)\.(jsx|js|yaml|yml)$/i);
  if (m) {
    const base = m[1];
    const ext = m[2];
    if (!/\.(web|android|ios|native)$/i.test(base)) {
      out.push(`${base}.${plat}.${ext}`);
    }
  }
  out.push(raw);
  return out;
}
function detectRelayHostPlatform() {
  try {
    if (typeof globalThis !== "undefined" && globalThis.__relayHostPlatform) {
      return String(globalThis.__relayHostPlatform);
    }
  } catch (_) {
  }
  return "web";
}
function parkNativeTagFromProps(props) {
  if (!props) return "";
  const a = propStringFromVnodeProps(props, "data-relay-park-native");
  if (a) return a;
  const b = propStringFromVnodeProps(props, "dataRelayParkNative");
  if (b) return b;
  return "";
}
function tryBuildParkNative(tag, props, invokeHandler, onAfterInvoke) {
  let builder = getParkNativeBuilder(tag);
  if (!builder) {
    const viaProp = parkNativeTagFromProps(props);
    if (viaProp) builder = getParkNativeBuilder(viaProp);
  }
  if (!builder) return null;
  try {
    return builder(props || {}, invokeHandler, onAfterInvoke);
  } catch (err) {
    console.error("[relay-runtime] park native build failed:", tag, err);
    return null;
  }
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
    if (tag === "relay-pop-image") {
      try {
        installRelayGalleryHost();
      } catch (_) {
      }
      return buildRelayPopImage(props || {});
    }
    if (tag === "relay-image-gallery") {
      try {
        installRelayGalleryHost();
      } catch (_) {
      }
      return buildRelayImageGallery(props || {});
    }
    const parkEl = tryBuildParkNative(tag, props || {}, invokeHandler, onAfterInvoke);
    if (parkEl) return parkEl;
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
    if (rawTag === "relay-pop-image") {
      try {
        installRelayGalleryHost();
      } catch (_) {
      }
      return buildRelayPopImage(v.props || {});
    }
    if (rawTag === "relay-image-gallery") {
      try {
        installRelayGalleryHost();
      } catch (_) {
      }
      return buildRelayImageGallery(v.props || {});
    }
    const parkEl2 = tryBuildParkNative(rawTag, v.props || {}, invokeHandler, onAfterInvoke);
    if (parkEl2) return parkEl2;
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
  let liveUpgradeScheduled = false;
  let prevVnode = null;
  let themeYamlText = typeof themeYaml === "string" ? themeYaml : "";
  const branchNorm = typeof branch === "string" ? branch.trim() : "";
  const initialPathNorm = typeof initialPath === "string" ? initialPath.trim() : "";
  function enableClientOnlyChrome(root) {
    try {
      const scope = root && root.querySelectorAll ? root : document;
      const nodes = scope.querySelectorAll(".pt-client-only");
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        try {
          if (el.disabled) el.disabled = false;
        } catch (_) {
        }
        try {
          if (el.getAttribute("aria-disabled") === "true") {
            el.setAttribute("aria-disabled", "false");
          }
        } catch (_) {
        }
        try {
          if (el.hasAttribute("title") && /after page loads/i.test(el.getAttribute("title") || "")) {
            el.removeAttribute("title");
          }
        } catch (_) {
        }
      }
    } catch (_) {
    }
  }
  let renderHookPass = () => {
  };
  function scheduleDeferredLiveUpgrade() {
    if (liveUpgradeScheduled) return;
    liveUpgradeScheduled = true;
    const phases = [2, 3, 4];
    let idx = 0;
    const runNext = () => {
      if (idx >= phases.length) return;
      const phase = phases[idx++];
      try {
        if (typeof get_client_live_phase === "function") {
          const cur = Number(get_client_live_phase()) || 0;
          if (cur >= phase) {
            syncHtmlLivePhaseAttr(cur, container);
            if (idx < phases.length) scheduleIdle(runNext, 80);
            return;
          }
        }
        if (typeof set_client_live_phase === "function") {
          set_client_live_phase(phase);
        } else if (typeof set_client_live === "function") {
          set_client_live(true);
        }
      } catch (_) {
      }
      syncHtmlLivePhaseAttr(phase, container);
      try {
        renderHookPass();
      } catch (e) {
        console.error("[relay-runtime] live phase", phase, "failed:", e);
      }
      if (idx < phases.length) {
        scheduleIdle(runNext, 120 + idx * 80);
      }
    };
    try {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scheduleIdle(runNext, 200));
        });
        return;
      }
    } catch (_) {
    }
    scheduleIdle(runNext, 200);
  }
  function scheduleIdle(fn, timeoutMs) {
    try {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(
          () => {
            try {
              fn();
            } catch (e) {
              console.error("[relay-runtime] idle task failed:", e);
            }
          },
          { timeout: timeoutMs || 2500 }
        );
        return;
      }
    } catch (_) {
    }
    setTimeout(fn, Math.min(timeoutMs || 120, 500));
  }
  try {
    setBootStatus(container, { phase: "wasm", message: "Preparing runtime\u2026" });
    try {
      if (typeof set_client_live === "function") set_client_live(false);
    } catch (_) {
    }
    syncHtmlHydratedAttr(false, container);
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
    renderHookPass = () => {
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
          const ok = hydrateVnode(vnode, container, invoke_handler, renderHookPass);
          hydratedOnce = true;
          prevVnode = vnode;
          livePromoted = true;
          promoteSsrShellWithoutWipe(container, { hydrateOk: !!ok });
          enableClientOnlyChrome(container);
          setBootStatus(container, { phase: "live", message: "Ready" });
          scheduleDeferredLiveUpgrade();
          return;
        }
        if (livePromoted && prevVnode && container.childNodes && container.childNodes.length > 0) {
          if (container.dataset?.relaySsr === "1") {
            try {
              replaceSsrPlaceholdersFromVnode(container, vnode, invoke_handler, renderHookPass);
            } catch (e) {
              console.warn("[relay-runtime] placeholder replace failed; keeping SSR", e);
            }
            prevVnode = vnode;
            setBootStatus(container, { phase: "live", message: "Ready" });
            return;
          }
          try {
            const patchList = computeVnodePatches(prevVnode, vnode);
            if (patchList.length === 0) {
              prevVnode = vnode;
              setBootStatus(container, { phase: "live", message: "Ready" });
              return;
            }
            if (applyVnodePatches(container, prevVnode, patchList, invoke_handler, renderHookPass)) {
              prevVnode = vnode;
              setBootStatus(container, { phase: "live", message: "Ready" });
              return;
            }
          } catch (e) {
            console.warn("[relay-runtime] applyPatches failed; full replace", e);
          }
        }
        if (container.dataset?.relaySsr === "1") {
          hydratedOnce = true;
          prevVnode = vnode;
          livePromoted = true;
          promoteSsrShellWithoutWipe(container, { hydrateOk: false });
          enableClientOnlyChrome(container);
          setBootStatus(container, { phase: "live", message: "Ready" });
          scheduleDeferredLiveUpgrade();
          return;
        }
        container.innerHTML = "";
        delete container.dataset.relaySsr;
        if (!livePromoted) {
          try {
            if (typeof set_client_live_phase === "function") {
              set_client_live_phase(1);
            } else if (typeof set_client_live === "function") {
              set_client_live(true);
            }
          } catch (_) {
          }
          syncHtmlLivePhaseAttr(1, container);
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
        const el = vnodeToDom(vnode, invoke_handler, renderHookPass);
        if (el) container.appendChild(el);
        prevVnode = vnode;
        if (livePromoted) {
          setBootStatus(container, { phase: "live", message: "Ready" });
          installRumBeacon(container, { hydrateOk: !!container.dataset?.relayHydrated });
          scheduleDeferredLiveUpgrade();
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
      renderHookPass();
    });
    setBootStatus(container, { phase: "render", message: "Preparing UI\u2026" });
    if (wantHydrate && container.dataset?.relaySsr === "1") {
      await yieldForInteractive(120);
    } else {
      await yieldToMain();
    }
    renderHookPass();
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
  applyVnodePatches,
  bootstrap,
  computeVnodePatches,
  documentFor,
  ensureStyleElement,
  getBootStatus,
  getParkNativeBuilder,
  getThemes,
  hydrateVnode,
  installRelayHostFetch,
  installRumBeacon,
  listParkNativeTags,
  localImportSpecs,
  looksLikeHookSource,
  platformModuleCandidates,
  preloadImportClosure,
  promoteSsrShellWithoutWipe,
  propBoolFromVnodeProps,
  putModuleInMap,
  registerParkNative,
  renderHook,
  renderHookErrorUI,
  replaceSsrPlaceholdersFromVnode,
  resolveHookUrl,
  resolveImportRel,
  setBootStatus,
  setCurrentTheme,
  setRelayFetchBaseUrl,
  setRelayFetchBranch,
  shouldInterceptRelayControlledAnchorClick,
  styleParentFor,
  syncHtmlHydratedAttr,
  syncHtmlLivePhaseAttr,
  themeTargetFor,
  vnodeToDom,
  yieldForInteractive
};
//# sourceMappingURL=relay-runtime-web-J7WOOEHI.js.map
