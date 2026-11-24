/**
 * Self-contained ISO/IEC 18004 QR Code SVG generator (Byte mode, EC Level M, Versions 1-10).
 * Zero external dependencies.
 */

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(ecCount) {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Uint8Array(data.length + ecCount);
  res.set(data, 0);
  for (let i = 0; i < data.length; i++) {
    const factor = res[i];
    if (factor === 0) continue;
    for (let j = 0; j < gen.length; j++) {
      res[i + j] ^= gfMul(gen[j], factor);
    }
  }
  return res.slice(data.length);
}

// Version 1..10 tables for EC Level M: [totalDataBytes, ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data, alignCoords, remBits]
const VERSION_TABLE_M = [
  null,
  [16, 10, 1, 16, 0, 0, [], 0],
  [28, 16, 1, 28, 0, 0, [6, 18], 7],
  [44, 26, 1, 44, 0, 0, [6, 22], 7],
  [64, 18, 2, 32, 0, 0, [6, 26], 7],
  [86, 24, 2, 43, 0, 0, [6, 30], 7],
  [108, 16, 4, 27, 0, 0, [6, 34], 7],
  [124, 18, 4, 31, 0, 0, [6, 22, 38], 0],
  [154, 22, 2, 38, 2, 39, [6, 24, 42], 0],
  [182, 22, 3, 36, 2, 37, [6, 26, 46], 0],
  [216, 26, 4, 43, 1, 44, [6, 28, 50], 3]
];

function bchFormatInfo(mask) {
  // EC Level M = 00
  const data = mask & 7;
  let d = data << 10;
  for (let i = 4; i >= 0; i--) {
    if (d & (1 << (i + 10))) d ^= 0x537 << i;
  }
  return ((data << 10) | d) ^ 0x5412;
}

function bchVersionInfo(ver) {
  let d = ver << 12;
  for (let i = 5; i >= 0; i--) {
    if (d & (1 << (i + 12))) d ^= 0x1f25 << i;
  }
  return (ver << 12) | d;
}

function encodeBytes(text) {
  const bytes = new TextEncoder().encode(text);
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const cap = VERSION_TABLE_M[v][0];
    const headerBytes = v <= 9 ? 2 : 3; // 4-bit mode + 8/16-bit count -> fits with terminator inside cap
    if (bytes.length + headerBytes <= cap) {
      version = v;
      break;
    }
  }
  if (!version) {
    throw new Error('URL too long for QR versions 1-10');
  }

  const [totalData, ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data] = VERSION_TABLE_M[version];
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };

  // Mode: Byte (0100)
  pushBits(0b0100, 4);
  // Character count
  pushBits(bytes.length, version <= 9 ? 8 : 16);
  // Payload bytes
  for (const b of bytes) pushBits(b, 8);
  // Terminator up to 4 bits
  const maxBits = totalData * 8;
  const term = Math.min(4, maxBits - bits.length);
  pushBits(0, term);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad codewords 0xEC, 0x11
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padIdx % 2 === 0 ? 0xec : 0x11, 8);
    padIdx++;
  }

  const codewords = new Uint8Array(totalData);
  for (let i = 0; i < totalData; i++) {
    let val = 0;
    for (let b = 0; b < 8; b++) val = (val << 1) | bits[i * 8 + b];
    codewords[i] = val;
  }

  // Split into blocks and compute RS error correction
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let i = 0; i < g1Blocks; i++) {
    const slice = codewords.slice(offset, offset + g1Data);
    offset += g1Data;
    dataBlocks.push(slice);
    ecBlocks.push(rsRemainder(slice, ecPerBlock));
  }
  for (let i = 0; i < g2Blocks; i++) {
    const slice = codewords.slice(offset, offset + g2Data);
    offset += g2Data;
    dataBlocks.push(slice);
    ecBlocks.push(rsRemainder(slice, ecPerBlock));
  }

  const interleaved = [];
  const maxDataLen = Math.max(g1Data, g2Data);
  for (let i = 0; i < maxDataLen; i++) {
    for (const blk of dataBlocks) {
      if (i < blk.length) interleaved.push(blk[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const blk of ecBlocks) {
      interleaved.push(blk[i]);
    }
  }

  return { version, bytes: interleaved };
}

function createMatrix(version) {
  const size = version * 4 + 17;
  const grid = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
  const isFunc = Array.from({ length: size }, () => new Uint8Array(size));

  const setFunc = (r, c, val) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      grid[r][c] = val;
      isFunc[r][c] = 1;
    }
  };

  const placeFinder = (top, left) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = top + dr;
        const c = left + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inBorder = dr === -1 || dr === 7 || dc === -1 || dc === 7;
        const onOuter = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunc(r, c, !inBorder && (onOuter || inCore) ? 1 : 0);
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const bit = i % 2 === 0 ? 1 : 0;
    setFunc(6, i, bit);
    setFunc(i, 6, bit);
  }

  // Dark module
  setFunc(size - 8, 8, 1);

  // Alignment patterns (skip only the 3 finder corners, not timing patterns)
  const align = VERSION_TABLE_M[version][6];
  for (const r0 of align) {
    for (const c0 of align) {
      if ((r0 <= 8 && c0 <= 8) || (r0 <= 8 && c0 >= size - 8) || (r0 >= size - 8 && c0 <= 8)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFunc(r0 + dr, c0 + dc, dist !== 1 ? 1 : 0);
        }
      }
    }
  }

  // Reserve format info cells
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      if (!isFunc[8][i]) setFunc(8, i, 0);
      if (!isFunc[i][8]) setFunc(i, 8, 0);
    }
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunc[8][size - 1 - i]) setFunc(8, size - 1 - i, 0);
    if (i < 7 && !isFunc[size - 1 - i][8]) setFunc(size - 1 - i, 8, 0);
  }

  // Version info (>= 7)
  if (version >= 7) {
    const vbits = bchVersionInfo(version);
    for (let i = 0; i < 18; i++) {
      const bit = (vbits >>> i) & 1;
      const a = Math.floor(i / 3);
      const b = i % 3;
      setFunc(size - 11 + b, a, bit);
      setFunc(a, size - 11 + b, bit);
    }
  }

  return { size, grid, isFunc };
}

function placeDataBits(size, grid, isFunc, codewords) {
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  let dir = -1;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < size; step++) {
      const r = dir === -1 ? size - 1 - step : step;
      for (let lr = 0; lr < 2; lr++) {
        const c = right - lr;
        if (isFunc[r][c]) continue;
        let bit = 0;
        if (bitIdx < totalBits) {
          bit = (codewords[bitIdx >> 3] >>> (7 - (bitIdx & 7))) & 1;
          bitIdx++;
        }
        grid[r][c] = bit;
      }
    }
    dir = -dir;
  }
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
];

function applyFormatInfo(size, grid, mask) {
  const fmt = bchFormatInfo(mask);
  // Copy 1: top-left (MSB bit 14 at [8][0] -> LSB bit 0 at [0][8])
  for (let i = 0; i <= 5; i++) grid[8][i] = (fmt >>> (14 - i)) & 1;
  grid[8][7] = (fmt >>> 8) & 1;
  grid[8][8] = (fmt >>> 7) & 1;
  grid[7][8] = (fmt >>> 6) & 1;
  for (let i = 0; i <= 5; i++) grid[5 - i][8] = (fmt >>> (5 - i)) & 1;

  // Copy 2: bottom-left (bits 14..8) and top-right (bits 7..0)
  for (let i = 0; i < 7; i++) grid[size - 1 - i][8] = (fmt >>> (14 - i)) & 1;
  for (let i = 0; i < 8; i++) grid[8][size - 8 + i] = (fmt >>> (7 - i)) & 1;
}

function penaltyScore(size, grid) {
  let score = 0;

  // N1: 5+ consecutive same color in row/col
  for (let r = 0; r < size; r++) {
    let runColor = grid[r][0], runLen = 1;
    for (let c = 1; c < size; c++) {
      if (grid[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) score += 3 + (runLen - 5);
        runColor = grid[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5);
  }
  for (let c = 0; c < size; c++) {
    let runColor = grid[0][c], runLen = 1;
    for (let r = 1; r < size; r++) {
      if (grid[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) score += 3 + (runLen - 5);
        runColor = grid[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5);
  }

  // N2: 2x2 blocks
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = grid[r][c];
      if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  // N3: finder-like patterns 1011101 + 4 zeros
  const checkLine = (arr) => {
    for (let i = 0; i <= arr.length - 11; i++) {
      const a =
        arr[i] === 1 && arr[i + 1] === 0 && arr[i + 2] === 1 && arr[i + 3] === 1 &&
        arr[i + 4] === 1 && arr[i + 5] === 0 && arr[i + 6] === 1 &&
        arr[i + 7] === 0 && arr[i + 8] === 0 && arr[i + 9] === 0 && arr[i + 10] === 0;
      const b =
        arr[i] === 0 && arr[i + 1] === 0 && arr[i + 2] === 0 && arr[i + 3] === 0 &&
        arr[i + 4] === 1 && arr[i + 5] === 0 && arr[i + 6] === 1 &&
        arr[i + 7] === 1 && arr[i + 8] === 1 && arr[i + 9] === 0 && arr[i + 10] === 1;
      if (a || b) score += 40;
    }
  };
  for (let r = 0; r < size; r++) checkLine(grid[r]);
  const col = new Int8Array(size);
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size; r++) col[r] = grid[r][c];
    checkLine(col);
  }

  // N4: dark ratio
  let dark = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (grid[r][c] === 1) dark++;
  }
  const pct = (dark * 100) / (size * size);
  const prev5 = Math.floor(Math.abs(pct - 50) / 5);
  score += prev5 * 10;

  return score;
}

export function generateQrMatrix(text) {
  const { version, bytes } = encodeBytes(text);
  const { size, grid: baseGrid, isFunc } = createMatrix(version);
  placeDataBits(size, baseGrid, isFunc, bytes);

  let bestMask = 0;
  let bestScore = Infinity;
  let bestGrid = null;

  for (let m = 0; m < 8; m++) {
    const candidate = baseGrid.map((row) => new Int8Array(row));
    const fn = MASKS[m];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!isFunc[r][c] && fn(r, c)) {
          candidate[r][c] ^= 1;
        }
      }
    }
    applyFormatInfo(size, candidate, m);
    const sc = penaltyScore(size, candidate);
    if (sc < bestScore) {
      bestScore = sc;
      bestMask = m;
      bestGrid = candidate;
    }
  }

  return { size, version, mask: bestMask, grid: bestGrid };
}

export function createQrSvg(text, { label = 'QR code for site link', sizePx = 180 } = {}) {
  const { size, grid } = generateQrMatrix(text);
  const quiet = 4;
  const total = size + quiet * 2;
  const paths = [];

  for (let r = 0; r < size; r++) {
    let start = -1;
    for (let c = 0; c <= size; c++) {
      const on = c < size && grid[r][c] === 1;
      if (on && start === -1) {
        start = c;
      } else if (!on && start !== -1) {
        const x = start + quiet;
        const y = r + quiet;
        const w = c - start;
        paths.push(`M${x} ${y}h${w}v1h-${w}z`);
        start = -1;
      }
    }
  }

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${total} ${total}`);
  svg.setAttribute('width', String(sizePx));
  svg.setAttribute('height', String(sizePx));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  svg.setAttribute('shape-rendering', 'crispEdges');

  const bg = document.createElementNS(ns, 'rect');
  bg.setAttribute('width', String(total));
  bg.setAttribute('height', String(total));
  bg.setAttribute('fill', '#f3f3f0');
  svg.appendChild(bg);

  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', paths.join(''));
  path.setAttribute('fill', '#0a0a0a');
  svg.appendChild(path);

  return svg;
}
