// Funciones puras de imagen: no tocan el DOM, así se pueden probar con Node.

// Homografía del cuadrado unidad al cuadrilátero q = [sup-izq, sup-der, inf-der, inf-izq].
export function squareToQuad(q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, sx = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1 || 1e-9;
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;
  return {
    a: x1 - x0 + g * x1, b: x3 - x0 + h * x3, c: x0,
    d: y1 - y0 + g * y1, e: y3 - y0 + h * y3, f: y0,
    g, h,
  };
}

// Tamaño natural de la página recortada, a partir de la longitud de sus lados.
export function outputSize(q, maxSide = 1800) {
  const dist = (p, r) => Math.hypot(p[0] - r[0], p[1] - r[1]);
  const w = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2;
  const h = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2;
  const s = Math.min(1, maxSide / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}

// Endereza el cuadrilátero q de src a un rectángulo w×h, con interpolación bilineal.
export function warp(src, q, w, h) {
  const { a, b, c, d, e, f, g, h: hh } = squareToQuad(q);
  const out = new Uint8ClampedArray(w * h * 4);
  const { data, width: sw, height: sh } = src;
  let o = 0;
  for (let y = 0; y < h; y++) {
    const v = (y + 0.5) / h;
    for (let x = 0; x < w; x++, o += 4) {
      const u = (x + 0.5) / w;
      const den = g * u + hh * v + 1;
      const sxf = Math.min(sw - 1.001, Math.max(0, (a * u + b * v + c) / den));
      const syf = Math.min(sh - 1.001, Math.max(0, (d * u + e * v + f) / den));
      const x0 = sxf | 0, y0 = syf | 0;
      const fx = sxf - x0, fy = syf - y0;
      const i = (y0 * sw + x0) * 4, j = i + 4, k = i + sw * 4, l = k + 4;
      for (let ch = 0; ch < 3; ch++) {
        const top = data[i + ch] * (1 - fx) + data[j + ch] * fx;
        const bot = data[k + ch] * (1 - fx) + data[l + ch] * fx;
        out[o + ch] = top * (1 - fy) + bot * fy;
      }
      out[o + 3] = 255;
    }
  }
  return { data: out, width: w, height: h };
}

function percentile(hist, total, frac) {
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= total * frac) return v;
  }
  return 255;
}

// 'realce' aclara el papel y da contraste; 'bn' es un escaneo en blanco y negro.
export function applyFilter(img, kind) {
  if (kind !== 'realce' && kind !== 'bn') return img;
  const d = img.data;
  const total = d.length / 4;
  if (kind === 'realce') {
    const luts = [0, 1, 2].map((ch) => {
      const hist = new Uint32Array(256);
      for (let i = ch; i < d.length; i += 4) hist[d[i]]++;
      const lo = percentile(hist, total, 0.01);
      const hi = Math.max(lo + 1, percentile(hist, total, 0.92));
      return Uint8ClampedArray.from({ length: 256 }, (_, v) => ((v - lo) / (hi - lo)) * 255);
    });
    for (let i = 0; i < d.length; i += 4) {
      d[i] = luts[0][d[i]];
      d[i + 1] = luts[1][d[i + 1]];
      d[i + 2] = luts[2][d[i + 2]];
    }
  } else {
    const hist = new Uint32Array(256);
    const gray = new Uint8ClampedArray(total);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      hist[gray[p]]++;
    }
    const lo = percentile(hist, total, 0.02);
    const hi = Math.max(lo + 1, percentile(hist, total, 0.85));
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const t = Math.min(1, Math.max(0, (gray[p] - lo) / (hi - lo)));
      d[i] = d[i + 1] = d[i + 2] = Math.pow(t, 1.2) * 255;
    }
  }
  return img;
}

// Busca la página: separa fondo y figura con Otsu y toma la mancha conectada más grande.
// Devuelve esquinas normalizadas (0–1), o null si no encuentra una página creíble.
export function detectCorners({ data, width: w, height: h }) {
  const n = w * h;
  const gray = new Uint8Array(n);
  const hist = new Uint32Array(256);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    hist[gray[p]]++;
  }
  let sumAll = 0;
  for (let v = 0; v < 256; v++) sumAll += v * hist[v];
  let sumB = 0, wB = 0, best = -1, thr = 128;
  for (let v = 0; v < 256; v++) {
    wB += hist[v];
    if (!wB || wB === n) continue;
    sumB += v * hist[v];
    const diff = sumB / wB - (sumAll - sumB) / (n - wB);
    const between = wB * (n - wB) * diff * diff;
    if (between > best) { best = between; thr = v; }
  }

  // El fondo es la clase que más aparece en el borde de la foto.
  let brightEdge = 0, edge = 0;
  const countEdge = (p) => { edge++; if (gray[p] > thr) brightEdge++; };
  for (let x = 0; x < w; x++) { countEdge(x); countEdge(n - 1 - x); }
  for (let y = 0; y < h; y++) { countEdge(y * w); countEdge(y * w + w - 1); }
  const fgIsBright = brightEdge < edge / 2;

  const seen = new Uint8Array(n);
  const stack = new Int32Array(n);
  let bestStart = -1, bestSize = 0;
  const fg = (p) => (gray[p] > thr) === fgIsBright;
  const flood = (start, onPixel) => {
    let top = 0;
    stack[top++] = start;
    seen[start] = 1;
    let size = 0;
    while (top) {
      const p = stack[--top];
      size++;
      onPixel?.(p);
      const x = p % w;
      const push = (q) => { if (!seen[q] && fg(q)) { seen[q] = 1; stack[top++] = q; } };
      if (x > 0) push(p - 1);
      if (x < w - 1) push(p + 1);
      if (p >= w) push(p - w);
      if (p < n - w) push(p + w);
    }
    return size;
  };
  for (let p = 0; p < n; p++) {
    if (seen[p] || !fg(p)) continue;
    const size = flood(p);
    if (size > bestSize) { bestSize = size; bestStart = p; }
  }
  if (bestStart < 0 || bestSize < n * 0.15 || bestSize > n * 0.97) return null;

  seen.fill(0);
  const ext = { tl: [Infinity], tr: [-Infinity], br: [-Infinity], bl: [-Infinity] };
  flood(bestStart, (p) => {
    const x = p % w, y = (p - x) / w;
    if (x + y < ext.tl[0]) ext.tl = [x + y, x, y];
    if (x - y > ext.tr[0]) ext.tr = [x - y, x, y];
    if (x + y > ext.br[0]) ext.br = [x + y, x, y];
    if (y - x > ext.bl[0]) ext.bl = [y - x, x, y];
  });
  const quad = [ext.tl, ext.tr, ext.br, ext.bl].map(([, x, y]) => [x / (w - 1), y / (h - 1)]);

  // Si el contorno no se parece a un cuadrilátero lleno, es mejor no adivinar.
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = quad[i], [bx, by] = quad[(i + 1) % 4];
    area += ax * by - bx * ay;
  }
  return Math.abs(area) / 2 < 0.12 ? null : quad;
}
