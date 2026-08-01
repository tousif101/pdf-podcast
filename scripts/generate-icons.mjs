import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function encodePng(size, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function roundedRectCoverage(x, y, cx, cy, halfW, halfH, radius) {
  const dx = Math.max(Math.abs(x - cx) - (halfW - radius), 0);
  const dy = Math.max(Math.abs(y - cy) - (halfH - radius), 0);
  const dist = Math.hypot(dx, dy);
  // 1px antialiased edge
  return Math.min(Math.max(radius - dist + 0.5, 0), 1);
}

function makeIcon(size) {
  const bg = [23, 21, 15];
  const plate = [34, 30, 23];
  const bar = [232, 72, 31];
  const rgba = Buffer.alloc(size * size * 4);

  const plateHalf = size * 0.42;
  const plateRadius = size * 0.14;
  const center = size / 2;

  const barCount = 5;
  const barWidth = size * 0.085;
  const gap = size * 0.055;
  const relHeights = [0.26, 0.44, 0.62, 0.44, 0.26];
  const totalWidth = barCount * barWidth + (barCount - 1) * gap;
  const firstBarX = (size - totalWidth) / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let [r, g, b] = bg;

      const plateCov = roundedRectCoverage(
        x, y, center, center, plateHalf, plateHalf, plateRadius,
      );
      if (plateCov > 0) {
        r = r + (plate[0] - r) * plateCov;
        g = g + (plate[1] - g) * plateCov;
        b = b + (plate[2] - b) * plateCov;
      }

      for (let i = 0; i < barCount; i++) {
        const barCx = firstBarX + i * (barWidth + gap) + barWidth / 2;
        const halfH = (size * relHeights[i]) / 2;
        const cov = roundedRectCoverage(
          x, y, barCx, center, barWidth / 2, halfH, barWidth / 2,
        );
        if (cov > 0) {
          r = r + (bar[0] - r) * cov;
          g = g + (bar[1] - g) * cov;
          b = b + (bar[2] - b) * cov;
        }
      }

      const offset = (y * size + x) * 4;
      rgba[offset] = Math.round(r);
      rgba[offset + 1] = Math.round(g);
      rgba[offset + 2] = Math.round(b);
      rgba[offset + 3] = 255;
    }
  }
  return encodePng(size, rgba);
}

const outDir = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  "public",
  "icons",
);
mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const file = join(outDir, `icon-${size}.png`);
  writeFileSync(file, makeIcon(size));
  console.log(`wrote ${file}`);
}
