const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table & calculator
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

// Distance from point (px, py) to line segment (x1, y1) - (x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Distance from point (px, py) to ring centered at (cx, cy)
function distToRing(px, py, cx, cy, radius, thickness) {
  const d = Math.hypot(px - cx, py - cy);
  return Math.abs(d - radius) - thickness / 2;
}

/**
 * Renders the Barbero emblem: crossed barber scissors, gold pivot screw, and clean BARBERO typography
 * @param {number} width 
 * @param {number} height 
 * @param {boolean} isMaskable If true, keeps content inside 80% safe zone with full solid bleed
 */
function renderBarberoIcon(width, height, isMaskable = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  // Scale factor: maskable icons get slightly smaller to stay in safe zone
  const scale = (isMaskable ? 0.72 : 0.88) * (Math.min(width, height) / 2);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Normalized coordinates (-1 to 1) relative to center
      const nx = (x - cx) / scale;
      const ny = (y - cy) / scale;

      // Background gradient (Royal Blue #1E40AF to #2563EB to #3B82F6)
      const grad = y / height;
      let bgR = Math.round(30 + grad * 12);   // ~30 to 42
      let bgG = Math.round(64 + grad * 35);   // ~64 to 99
      let bgB = Math.round(175 + grad * 60);  // ~175 to 235
      let bgA = 255;

      // For standard icons, create a soft squircle container
      if (!isMaskable) {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        const squircleRadius = width * 0.48;
        // Superellipse corner check: (x/r)^5 + (y/r)^5 <= 1
        const cornerDist = Math.pow(dx / squircleRadius, 5) + Math.pow(dy / squircleRadius, 5);
        if (cornerDist > 1.0) {
          bgR = 0; bgG = 0; bgB = 0; bgA = 0;
        } else if (cornerDist > 0.96) {
          // Antialiasing edge
          const alphaFactor = 1 - (cornerDist - 0.96) / 0.04;
          bgA = Math.round(255 * alphaFactor);
        }
      }

      if (bgA === 0) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // --- DRAW EMBLEM (Barber Scissors) ---
      // Pivot is at (0, -0.05)
      const pivotX = 0;
      const pivotY = -0.05;

      // Distance to Blade 1 (Left loop to Right tip): line from (-0.28, 0.42) through pivot (0, -0.05) to (0.36, -0.68)
      const dBlade1 = distToSegment(nx, ny, -0.05, -0.05, 0.36, -0.68);
      // Distance to Blade 2 (Right loop to Left tip): line from (0.28, 0.42) through pivot (0, -0.05) to (-0.36, -0.68)
      const dBlade2 = distToSegment(nx, ny, 0.05, -0.05, -0.36, -0.68);

      // Distance to Handles (Pivot to Ring Centers)
      const dHandle1 = distToSegment(nx, ny, 0, -0.05, -0.24, 0.38);
      const dHandle2 = distToSegment(nx, ny, 0, -0.05, 0.24, 0.38);

      // Finger Rings
      const ringRadius = 0.17;
      const ringThick = 0.06;
      const dRing1 = distToRing(nx, ny, -0.28, 0.46, ringRadius, ringThick);
      const dRing2 = distToRing(nx, ny, 0.28, 0.46, ringRadius, ringThick);

      // Finger rest / Tang on right ring
      const dTang = distToSegment(nx, ny, 0.44, 0.46, 0.54, 0.56);

      // Pivot screw
      const dPivot = Math.hypot(nx - pivotX, ny - pivotY);

      // Combine scissors parts
      const minScissorsDist = Math.min(
        dBlade1 - 0.048,
        dBlade2 - 0.048,
        dHandle1 - 0.042,
        dHandle2 - 0.042,
        dRing1,
        dRing2,
        dTang - 0.03
      );

      // --- TEXT "BARBERO" AT BOTTOM (for large icons >= 180px) ---
      let isText = false;
      if (width >= 180 && ny >= 0.68 && ny <= 0.88 && Math.abs(nx) <= 0.85) {
        // Render stylized letter strokes for B A R B E R O
        // Letter spacing: 7 letters distributed from nx -0.72 to +0.72
        const letters = [-0.62, -0.42, -0.21, 0.0, 0.21, 0.42, 0.62];
        const textY1 = 0.70;
        const textY2 = 0.86;
        const textMidY = 0.78;
        const charW = 0.11;
        const strokeThick = 0.024;

        for (let i = 0; i < letters.length; i++) {
          const lX = letters[i];
          const cnx = nx - lX;

          if (Math.abs(cnx) <= charW + 0.03) {
            // 'B' (index 0 and 3)
            if (i === 0 || i === 3) {
              const spine = distToSegment(nx, ny, lX - charW/2, textY1, lX - charW/2, textY2);
              const topLoop = distToRing(nx, ny, lX - 0.01, textY1 + 0.04, 0.045, strokeThick);
              const botLoop = distToRing(nx, ny, lX - 0.01, textY2 - 0.04, 0.045, strokeThick);
              if (spine <= strokeThick/2 || (topLoop <= 0 && cnx >= -charW/2) || (botLoop <= 0 && cnx >= -charW/2)) {
                isText = true;
              }
            }
            // 'A' (index 1)
            else if (i === 1) {
              const leg1 = distToSegment(nx, ny, lX, textY1, lX - charW/2, textY2);
              const leg2 = distToSegment(nx, ny, lX, textY1, lX + charW/2, textY2);
              const cross = distToSegment(nx, ny, lX - charW/3, textMidY, lX + charW/3, textMidY);
              if (Math.min(leg1, leg2, cross) <= strokeThick/2) isText = true;
            }
            // 'R' (index 2 and 5)
            else if (i === 2 || i === 5) {
              const spine = distToSegment(nx, ny, lX - charW/2, textY1, lX - charW/2, textY2);
              const topLoop = distToRing(nx, ny, lX - 0.01, textY1 + 0.04, 0.045, strokeThick);
              const leg = distToSegment(nx, ny, lX - charW/4, textMidY, lX + charW/2, textY2);
              if (spine <= strokeThick/2 || (topLoop <= 0 && cnx >= -charW/2) || leg <= strokeThick/2) {
                isText = true;
              }
            }
            // 'E' (index 4)
            else if (i === 4) {
              const spine = distToSegment(nx, ny, lX - charW/2, textY1, lX - charW/2, textY2);
              const tBar = distToSegment(nx, ny, lX - charW/2, textY1, lX + charW/2, textY1);
              const mBar = distToSegment(nx, ny, lX - charW/2, textMidY, lX + charW/3, textMidY);
              const bBar = distToSegment(nx, ny, lX - charW/2, textY2, lX + charW/2, textY2);
              if (Math.min(spine, tBar, mBar, bBar) <= strokeThick/2) isText = true;
            }
            // 'O' (index 6)
            else if (i === 6) {
              const oRing = distToRing(nx, ny, lX, textMidY, 0.065, strokeThick);
              if (oRing <= 0) isText = true;
            }
          }
        }
      }

      // Determine final pixel color
      if (dPivot <= 0.055) {
        // Gold / Amber pivot screw (#F59E0B)
        if (dPivot <= 0.022) {
          // Inner screw slot dot
          rawData[pxOffset] = 180;
          rawData[pxOffset + 1] = 100;
          rawData[pxOffset + 2] = 20;
          rawData[pxOffset + 3] = bgA;
        } else {
          rawData[pxOffset] = 245;
          rawData[pxOffset + 1] = 175;
          rawData[pxOffset + 2] = 25;
          rawData[pxOffset + 3] = bgA;
        }
      } else if (minScissorsDist <= 0 || isText) {
        // Crisp White Scissors / Text (#FFFFFF)
        // Subtle antialiasing on edges
        const edge = Math.abs(minScissorsDist);
        const alpha = edge < 0.015 ? 1 - edge / 0.015 : 1;
        rawData[pxOffset] = Math.round(255 * alpha + bgR * (1 - alpha));
        rawData[pxOffset + 1] = Math.round(255 * alpha + bgG * (1 - alpha));
        rawData[pxOffset + 2] = Math.round(255 * alpha + bgB * (1 - alpha));
        rawData[pxOffset + 3] = bgA;
      } else {
        // Background
        rawData[pxOffset] = bgR;
        rawData[pxOffset + 1] = bgG;
        rawData[pxOffset + 2] = bgB;
        rawData[pxOffset + 3] = bgA;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Ensure mobile/public directory exists
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Icon generation list
const iconsToGenerate = [
  { name: 'icon-192.png', size: 192, isMaskable: false },
  { name: 'icon-512.png', size: 512, isMaskable: false },
  { name: 'icon-maskable-512.png', size: 512, isMaskable: true },
  { name: 'icon-180.png', size: 180, isMaskable: false },
  { name: 'apple-touch-icon.png', size: 180, isMaskable: false },
  { name: 'icon.png', size: 512, isMaskable: false },
  { name: 'adaptive-icon.png', size: 512, isMaskable: true },
  { name: 'favicon.png', size: 48, isMaskable: false },
  { name: 'logo.png', size: 512, isMaskable: false },
];

console.log('🎨 Generating authentic Barbero Scissors PNG icon suite...');
for (const icon of iconsToGenerate) {
  const iconBuffer = renderBarberoIcon(icon.size, icon.size, icon.isMaskable);
  const targetPath = path.join(publicDir, icon.name);
  fs.writeFileSync(targetPath, iconBuffer);
  console.log(` ✓ ${icon.name} (${icon.size}x${icon.size}${icon.isMaskable ? ' maskable' : ''}) -> ${iconBuffer.length} bytes`);
}

console.log('✅ Barbero icon suite generated successfully!');
