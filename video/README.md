# CroLovac videi (Remotion)

Izvori videa za TikTok / Instagram / Facebook.

- `npm ci`, zatim npr. `npx remotion render src/index.ts meme-vepar out/vepar.mp4`
  (u cloud sesiji: `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`)
- Kompozicije: `Kviz`, `meme-*` (srnjak, kolega, nekad, vjetar, vepar), `Premium`, `Reklama`, `Meta*`.
- Glazba je uvijek **chill** (`public/glazba_chill.wav`).
- QR je zasebno za svaku mrežu: `public/qr_tt.svg` je TikTok. Za FB/IG verziju privremeno ga zamijeni
  QR-om s `utm_source=facebook` / `instagram` (generira `node qr.cjs <mapa>` uz `qrcode-generator`).
