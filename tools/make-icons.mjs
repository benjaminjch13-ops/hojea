// Genera los íconos PNG de la app sin dependencias: un libro abierto sobre fondo índigo.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Int32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc = (buf) => {
  let c = -1;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
function chunk(type, data) {
  const head = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(Buffer.concat([head, data])));
  return Buffer.concat([len, head, data, sum]);
}

const BG_TOP = [77, 80, 184], BG_BOTTOM = [123, 127, 220];
const PAGE = [251, 248, 240], SHADE = [222, 216, 202], ACCENT = [255, 210, 63];

// Coordenadas normalizadas; el dibujo queda dentro de la zona segura de un ícono adaptable.
function color(x, y) {
  const dx = Math.abs(x - 0.5);
  const slope = 0.32 * dx;                 // las hojas suben hacia afuera
  const top = 0.36 - slope, bottom = 0.68 - slope;
  if (dx < 0.25 && y > top && y < bottom) {
    if (dx < 0.008) return SHADE;
    // Trazos dibujados en la página derecha.
    if (x > 0.5 && dx > 0.06 && dx < 0.19) {
      const ly = (y - top) / (bottom - top);
      if ((ly > 0.28 && ly < 0.36) || (ly > 0.48 && ly < 0.56) || (ly > 0.68 && ly < 0.76)) return SHADE;
    }
    // Sol amarillo en la página izquierda.
    if (Math.hypot(x - 0.37, y - 0.49) < 0.05) return ACCENT;
    return PAGE;
  }
  return BG_TOP.map((c, i) => Math.round(c + (BG_BOTTOM[i] - c) * y));
}

function png(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  const SS = 3; // suavizado de bordes
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = color((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size);
          for (let i = 0; i < 3; i++) sum[i] += c[i];
        }
      }
      for (let i = 0; i < 3; i++) raw[o++] = Math.round(sum[i] / (SS * SS));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8 bits
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const dir = new URL('../icons/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const size of [192, 512]) writeFileSync(new URL(`icon-${size}.png`, dir), png(size));
console.log('Íconos generados');
