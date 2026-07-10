// One-off (but committed) icon generator for Repaso's PWA icon set.
// Renders an inline SVG ("R" on a terracotta rounded square) through sharp
// to produce the three PNGs the manifest points at. Re-run this after any
// icon design tweak: `node scripts/make-icons.mjs`.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const TERRACOTTA = "#C4552D";
const CREAM = "#FFF4E8";
const SIZE = 512;

// Standard icon: rounded square, generous corner radius, glyph sized/placed
// per the brief (x=50%, y≈68% baseline, ~340px cap size).
function standardSvg() {
  return `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="hl" cx="28%" cy="22%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="100" ry="100" fill="${TERRACOTTA}"/>
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="100" ry="100" fill="url(#hl)"/>
  <text x="50%" y="68%" text-anchor="middle" dominant-baseline="alphabetic"
        font-family="Georgia, 'Times New Roman', serif" font-weight="700"
        font-size="340" fill="${CREAM}">R</text>
</svg>`;
}

// Maskable icon: full-bleed square (OS applies its own mask shape), glyph
// shrunk to ~260px and kept well inside the 80% safe zone so it survives
// circle/squircle/rounded-square cropping on any platform.
function maskableSvg() {
  return `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="hl" cx="28%" cy="22%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="${TERRACOTTA}"/>
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="url(#hl)"/>
  <text x="50%" y="68%" text-anchor="middle" dominant-baseline="alphabetic"
        font-family="Georgia, 'Times New Roman', serif" font-weight="700"
        font-size="260" fill="${CREAM}">R</text>
</svg>`;
}

const outDir = path.join(process.cwd(), "public", "icons");

async function render(svg, size, filename) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, filename));
  console.log(`wrote ${filename} (${size}x${size})`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const standard = standardSvg();
  await render(standard, 192, "icon-192.png");
  await render(standard, 512, "icon-512.png");
  await render(maskableSvg(), 512, "maskable-512.png");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
