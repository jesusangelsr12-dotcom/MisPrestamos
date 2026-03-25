import { createCanvas } from "canvas";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#2C6CFF";
  ctx.fillRect(0, 0, size, size);

  // White "C" letter centered
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const fontSize = Math.round(size * 0.5);
  ctx.font = `bold ${fontSize}px "DM Sans", Arial, sans-serif`;
  ctx.fillText("C", size / 2, size / 2 + size * 0.02);

  return canvas.toBuffer("image/png");
}

const sizes = [192, 512];

for (const size of sizes) {
  const buffer = generateIcon(size);
  const path = join(publicDir, `icon-${size}x${size}.png`);
  writeFileSync(path, buffer);
  console.log(`✓ Generated ${path} (${buffer.length} bytes)`);
}
