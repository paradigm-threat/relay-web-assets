import {
  bootEmbedRoot
} from "./chunk-BP2S2JK3.js";
import "./chunk-QJE3LQET.js";
import "./chunk-RPGBVRDM.js";

// src/embed-main.ts
var rootEl = document.getElementById("root");
if (!rootEl) {
  console.error("[embed] missing #root");
} else {
  void bootEmbedRoot(rootEl).catch(async (e) => {
    console.error("[embed] boot failed", e);
    if (rootEl.dataset?.relaySsr === "1" && rootEl.childElementCount > 0) {
      const { renderHookErrorUI: renderHookErrorUI2 } = await import("./relay-runtime-web-D2J4FQF6.js");
      renderHookErrorUI2(rootEl, e, { keepContent: true, title: "Hydration error" });
      return;
    }
    const { renderHookErrorUI } = await import("./relay-runtime-web-D2J4FQF6.js");
    renderHookErrorUI(rootEl, e, { keepContent: false, title: "Embed error" });
  });
}
//# sourceMappingURL=embed.js.map
