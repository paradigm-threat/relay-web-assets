# Agent instructions

Pre-built embed + WASM CDN trees for Relay parked sites.

---

## Git and go-live

Catalog repo **`relay-web-assets`** · branch **`release`** · publish origin **`iad1`**.

| Step | Action |
|------|--------|
| 1 | Build with **`relay-client-web`**, publish with **`relay-gateway/scripts/publish-web-assets.sh`**. |
| 2 | Checkout **`release`** tip. |
| 3 | **`git push iad1 HEAD:release`** first — server waits for mesh; **push failure = publish failed**. |
| 4 | **`git push gitlab HEAD:release`** after iad1 succeeds. |

**Canon:** [`relay-gateway/docs/RELAY_WEB_ASSETS.md`](../relay-gateway/docs/RELAY_WEB_ASSETS.md) — no npm React on `release` (`embed-no-react` profile).

*Last updated: 2026-08-23*
