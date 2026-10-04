const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for standard PNG chunks
function makeCRCTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = makeCRCTable();

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Creates a valid RGBA PNG buffer of width x height with Barbero Cobalt branding
 */
function generateBarberoPng(width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // Compression
  ihdrData.writeUInt8(0, 11); // Filter
  ihdrData.writeUInt8(0, 12); // No interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: height rows, each starting with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.46;
  const innerRadius = radius * 0.85;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background rounded shape: Royal Cobalt #2563EB (R: 37, G: 99, B: 235)
      // Letter "B" or scissors symbol in white
      let r = 37, g = 99, b = 235, a = 255;

      // Outer squircle / circle background
      const maxCornerDist = Math.max(Math.abs(dx), Math.abs(dy));
      if (maxCornerDist > width * 0.48) {
        // Transparent border outside squircle
        r = 0; g = 0; b = 0; a = 0;
      } else {
        // Draw white "B" or symbol in center
        const relX = (x - cx) / (width * 0.35); // -1 to 1
        const relY = (y - cy) / (height * 0.35); // -1 to 1

        let isGlyph = false;
        // Vertical spine of 'B'
        if (relX >= -0.55 && relX <= -0.25 && relY >= -0.65 && relY <= 0.65) {
          isGlyph = true;
        }
        // Top loop of 'B'
        const topLoopDist = Math.sqrt(Math.pow(relX - -0.15, 2) + Math.pow(relY - -0.32, 2));
        if (topLoopDist <= 0.38 && topLoopDist >= 0.14 && relX >= -0.25) {
          isGlyph = true;
        }
        // Top bar
        if (relY >= -0.65 && relY <= -0.45 && relX >= -0.3 && relX <= 0.0) {
          isGlyph = true;
        }
        // Mid bar
        if (relY >= -0.12 && relY <= 0.08 && relX >= -0.3 && relX <= 0.1) {
          isGlyph = true;
        }
        // Bottom loop of 'B'
        const botLoopDist = Math.sqrt(Math.pow(relX - -0.12, 2) + Math.pow(relY - 0.33, 2));
        if (botLoopDist <= 0.42 && botLoopDist >= 0.15 && relX >= -0.25) {
          isGlyph = true;
        }
        // Bottom bar
        if (relY >= 0.45 && relY <= 0.65 && relX >= -0.3 && relX <= 0.05) {
          isGlyph = true;
        }

        if (isGlyph) {
          r = 255; g = 255; b = 255; a = 255;
        } else {
          // Subtle gradient on cobalt background
          const grad = Math.min(1, Math.max(0, (y / height)));
          r = Math.round(37 - grad * 12);
          g = Math.round(99 - grad * 15);
          b = Math.round(235 - grad * 20);
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate all target icon files in mobile/public
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const iconsToGenerate = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-180.png', size: 180 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon.png', size: 512 },
  { name: 'adaptive-icon.png', size: 512 },
  { name: 'favicon.png', size: 48 },
  { name: 'logo.png', size: 512 },
];

console.log('🎨 Generating genuine PNG icons for Barbero PWA...');
for (const icon of iconsToGenerate) {
  const pngBuf = generateBarberoPng(icon.size, icon.size);
  const filePath = path.join(publicDir, icon.name);
  fs.writeFileSync(filePath, pngBuf);
  console.log(` ✓ ${icon.name} (${icon.size}x${icon.size} valid PNG) -> ${pngBuf.length} bytes`);
}

console.log('✅ All Barbero PNG icons generated successfully!');
