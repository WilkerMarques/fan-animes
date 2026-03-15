/**
 * Aplica máscara circular aos ícones PWA (logo192.png e logo512.png).
 * Uso: node scripts/circle-pwa-icons.js
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const publicDir = path.join(__dirname, "../public");
const src = path.join(publicDir, "logo512.png");

if (!fs.existsSync(src)) {
  console.error("Arquivo public/logo512.png não encontrado.");
  process.exit(1);
}

async function circleMask(size) {
  const r = size / 2;
  const svg = `
    <svg width="${size}" height="${size}">
      <circle cx="${r}" cy="${r}" r="${r}" fill="white"/>
    </svg>
  `;
  const mask = await sharp(Buffer.from(svg))
    .resize(size, size)
    .ensureAlpha()
    .extractChannel("alpha")
    .raw()
    .toBuffer({ resolveWithObject: true });
  return mask.data;
}

async function run() {
  const inputBuffer = await sharp(src).toBuffer();
  for (const size of [192, 512]) {
    const maskAlpha = await circleMask(size);
    const outPath = path.join(publicDir, `logo${size}.png`);
    const tempPath = path.join(publicDir, `logo${size}-tmp.png`);
    await sharp(inputBuffer)
      .resize(size, size)
      .ensureAlpha()
      .joinChannel(maskAlpha, { raw: { width: size, height: size, channels: 1 } })
      .toFile(tempPath);
    try {
      fs.unlinkSync(outPath);
    } catch (_) {}
    fs.renameSync(tempPath, outPath);
    console.log(`Gerado: public/logo${size}.png (circular)`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
