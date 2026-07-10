// One-off (but committed) icon generator for Repaso's PWA + browser icon set.
// Renders an inline SVG ("R" on a terracotta rounded square) through sharp
// to produce the PNGs the manifest and Next.js app-icon convention point at.
// Re-run this after any icon design tweak: `node scripts/make-icons.mjs`.
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

const iconsDir = path.join(process.cwd(), "public", "icons");
const appDir = path.join(process.cwd(), "src", "app");

async function render(svg, size, outPath) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`wrote ${path.relative(process.cwd(), outPath)} (${size}x${size})`);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });
  const standard = standardSvg();
  const maskable = maskableSvg();
  await render(standard, 192, path.join(iconsDir, "icon-192.png"));
  await render(standard, 512, path.join(iconsDir, "icon-512.png"));
  await render(maskable, 512, path.join(iconsDir, "maskable-512.png"));
  // Next.js app-icon file convention: src/app/icon.png -> favicon <link>,
  // src/app/apple-icon.png -> iOS home-screen icon.
  await render(standard, 512, path.join(appDir, "icon.png"));
  await render(maskable, 512, path.join(appDir, "apple-icon.png"));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
