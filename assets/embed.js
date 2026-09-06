import {
  bootEmbedRoot
} from "./chunk-ENDKVHZN.js";
import "./chunk-F7T5I4X3.js";
import "./chunk-RPGBVRDM.js";

// src/embed-main.ts
var rootEl = document.getElementById("root");
if (!rootEl) {
  console.error("[embed] missing #root");
} else {
  void bootEmbedRoot(rootEl).catch(async (e) => {
    console.error("[embed] boot failed", e);
    if (rootEl.dataset?.relaySsr === "1" && rootEl.childElementCount > 0) {
      const { renderHookErrorUI: renderHookErrorUI2 } = await import("./relay-runtime-web-VMCHPOBP.js");
      renderHookErrorUI2(rootEl, e, { keepContent: true, title: "Hydration error" });
      return;
    }
    const { renderHookErrorUI } = await import("./relay-runtime-web-VMCHPOBP.js");
    renderHookErrorUI(rootEl, e, { keepContent: false, title: "Embed error" });
  });
}
//# sourceMappingURL=embed.js.map
