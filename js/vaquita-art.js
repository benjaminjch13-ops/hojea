// Formas básicas para dibujar las escenas y los accesorios de las vaquitas.
export const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
export const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
export const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
export const line = (d, stroke, width = 2) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const dots = (list, fill, r = 1) => list.map(([x, y, size]) => circle(x, y, size ?? r, fill)).join('');
export const heart = (x, y, s, fill) => path(`M${x} ${y + s * 0.9}C${x - s * 1.5} ${y - s * 0.1} ${x - s * 0.7} ${y - s} ${x} ${y - s * 0.25}C${x + s * 0.7} ${y - s} ${x + s * 1.5} ${y - s * 0.1} ${x} ${y + s * 0.9}Z`, fill);
export const star = (x, y, r, fill) => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const k = i % 2 ? r * 0.45 : r;
    return `${(x + Math.cos(a) * k).toFixed(1)},${(y + Math.sin(a) * k).toFixed(1)}`;
  });
  return `<polygon points="${points.join(' ')}" fill="${fill}"/>`;
};
export const daisy = (x, y, r, petals = '#fff', center = '#F6C445') => {
  const leaves = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3;
    return circle((x + Math.cos(a) * r).toFixed(1), (y + Math.sin(a) * r).toFixed(1), r * 0.7, petals);
  }).join('');
  return leaves + circle(x, y, r * 0.65, center);
};
export const glasses = (frame, lens, width = 2.5) => `
  <circle cx="37" cy="56" r="9" fill="${lens}" stroke="${frame}" stroke-width="${width}"/>
  <circle cx="63" cy="56" r="9" fill="${lens}" stroke="${frame}" stroke-width="${width}"/>
  ${line('M46 56h8', frame, width)}`;
export const sunglasses = (frame = '#1f1a1c') => `
  ${path('M25 50h22c2 0 3 2 2 5-1 6-5 9-12 9s-12-4-13-10c0-2 0-4 1-4zM75 50H53c-2 0-3 2-2 5 1 6 5 9 12 9s12-4 13-10c0-2 0-4-1-4z', frame)}
  ${line('M47 53h6', frame, 2.5)}
  ${line('M29 54l6-1M57 54l6-1', '#ffffff', 1.5)}`;
