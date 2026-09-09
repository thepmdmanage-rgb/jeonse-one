/* gen-icons.js — 의존성 0 아이콘 생성 (Node 내장 zlib만). 브랜드 블루 풀블리드 + 흰 집 글리프.
   출력: assets/icons/icon-{512,192,180,32}.png (RGBA PNG). 재실행 안전. */
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(OUT, { recursive: true });

const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const t = Buffer.from(type, 'ascii'); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0); return Buffer.concat([len, t, data, crc]); }

function png(N) {
  const bg = [37, 110, 244], wh = [255, 255, 255];               // #256EF4 KRDS 블루 / 흰색
  const raw = Buffer.alloc((N * 4 + 1) * N);
  const set = (x, y, c) => { const o = y * (N * 4 + 1) + 1 + x * 4; raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = 255; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const fx = x / N, fy = y / N; let col = bg;
    // 지붕(삼각형): y 0.30~0.50, x는 꼭짓점(0.5)에서 좌우 0.24/0.76 로 벌어짐
    if (fy >= 0.30 && fy <= 0.50) { const t = (fy - 0.30) / 0.20; const lx = 0.5 + (0.24 - 0.5) * t, rx = 0.5 + (0.76 - 0.5) * t; if (fx >= lx && fx <= rx) col = wh; }
    // 몸통(사각형)
    if (fy >= 0.50 && fy <= 0.72 && fx >= 0.34 && fx <= 0.66) col = wh;
    // 문(배경색)
    if (fy >= 0.58 && fy <= 0.72 && fx >= 0.465 && fx <= 0.535) col = bg;
    set(x, y, col);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
[512, 192, 180, 32].forEach(s => fs.writeFileSync(path.join(OUT, 'icon-' + s + '.png'), png(s)));
console.log('icons written:', fs.readdirSync(OUT).join(', '));
