import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFilter, detectCorners, outputSize, squareToQuad, warp } from '../js/imaging.js';
import { buildPdf } from '../js/pdf.js';

function image(w, h, paint) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = paint(x, y);
      data.set([r, g, b, 255], (y * w + x) * 4);
    }
  }
  return { data, width: w, height: h };
}

const insideQuad = (x, y, q) => q.every(([ax, ay], i) => {
  const [bx, by] = q[(i + 1) % 4];
  return (bx - ax) * (y - ay) - (by - ay) * (x - ax) >= 0;
});

test('la homografía lleva las esquinas del cuadrado a las del cuadrilátero', () => {
  const q = [[10, 20], [200, 35], [180, 240], [25, 210]];
  const m = squareToQuad(q);
  const map = (u, v) => {
    const d = m.g * u + m.h * v + 1;
    return [(m.a * u + m.b * v + m.c) / d, (m.d * u + m.e * v + m.f) / d];
  };
  [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([u, v], i) => {
    const [x, y] = map(u, v);
    assert.ok(Math.abs(x - q[i][0]) < 1e-6 && Math.abs(y - q[i][1]) < 1e-6);
  });
});

test('warp endereza una página inclinada y conserva sus colores', () => {
  const q = [[60, 40], [240, 70], [220, 280], [40, 250]];
  const src = image(300, 320, (x, y) => (insideQuad(x, y, q) ? [240, 240, 230] : [30, 30, 40]));
  const { w, h } = outputSize(q);
  const out = warp(src, q, w, h);
  let bright = 0;
  for (let i = 0; i < out.data.length; i += 4) if (out.data[i] > 200) bright++;
  assert.ok(bright / (w * h) > 0.97, `solo ${bright / (w * h)} de la salida es página`);
});

test('outputSize respeta el tamaño máximo y la proporción', () => {
  const { w, h } = outputSize([[0, 0], [4000, 0], [4000, 2000], [0, 2000]], 1800);
  assert.equal(w, 1800);
  assert.equal(h, 900);
});

test('detectCorners encuentra una página clara sobre mesa oscura', () => {
  const q = [[40, 30], [170, 45], [160, 190], [30, 175]];
  const src = image(200, 220, (x, y) => {
    if (!insideQuad(x, y, q)) return [45, 35, 30];
    // Dibujo oscuro en la página: no debe confundir la detección.
    return x > 80 && x < 120 && y > 90 && y < 130 ? [30, 30, 30] : [235, 230, 215];
  });
  const found = detectCorners(src).map(([x, y]) => [x * 199, y * 219]);
  found.forEach(([x, y], i) => {
    assert.ok(Math.hypot(x - q[i][0], y - q[i][1]) < 6, `esquina ${i}: ${x},${y}`);
  });
});

test('detectCorners devuelve null en una imagen sin página', () => {
  assert.equal(detectCorners(image(100, 100, () => [128, 128, 128])), null);
});

test('el filtro bn deja la imagen en grises y aclara el papel', () => {
  const img = image(20, 20, (x) => (x < 3 ? [20, 30, 60] : [210, 200, 170]));
  applyFilter(img, 'bn');
  const paper = (10 * 20 + 10) * 4;
  assert.equal(img.data[paper], img.data[paper + 1]);
  assert.ok(img.data[paper] > 240);
});

test('buildPdf genera una estructura válida con referencias correctas', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]);
  const pdf = buildPdf([{ bytes: jpeg, w: 900, h: 1200 }, { bytes: jpeg, w: 1200, h: 900 }]);
  const text = Buffer.from(pdf).toString('latin1');
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.ok(text.includes('/Count 2'));
  assert.ok(text.includes('/MediaBox [0 0 631.5 842]'));
  assert.ok(text.includes('/MediaBox [0 0 842 631.5]'));
  const startxref = Number(text.match(/startxref\n(\d+)/)[1]);
  assert.equal(text.slice(startxref, startxref + 4), 'xref');
  const entries = text.slice(startxref).match(/(\d{10}) 00000 n/g).map((e) => Number(e.slice(0, 10)));
  entries.forEach((offset, i) => {
    assert.ok(text.slice(offset).startsWith(`${i + 1} 0 obj`), `el objeto ${i + 1} no está en ${offset}`);
  });
});
