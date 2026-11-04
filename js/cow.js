// Muu: la vaquita peluda de la app, y sus stickers. Todo son dibujos propios en SVG (lienzo de 100×100).
import { shade } from './cover.js';

const BODY_FUR = '#b8703a';

// Contorno de pelo: un óvalo con mechones redondeados alrededor.
function shaggy(cx, cy, rx, ry, tufts = 16, bump = 0.14) {
  let d = '';
  for (let i = 0; i < tufts; i++) {
    const a0 = (i / tufts) * Math.PI * 2, a1 = ((i + 1) / tufts) * Math.PI * 2, mid = (a0 + a1) / 2;
    const p = (a, k = 1) => `${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`;
    if (!i) d += `M${p(a0)}`;
    d += `Q${p(mid, 1 + bump * 2)} ${p(a1)}`;
  }
  return `${d}Z`;
}

const strand = (x, top, end, w, fill) =>
  `<path d="M${x - w} ${top}C${x - w - 2} ${(top + end) / 2} ${x - w * 0.4} ${end - 6} ${x} ${end}C${x + w * 0.4} ${end - 6} ${x + w + 2} ${(top + end) / 2} ${x + w} ${top}Z" fill="${fill}"/>`;

const WHITE_EDGE = 'stroke="#fff" stroke-width="5" stroke-linejoin="round" paint-order="stroke"';

// La cara de Muu: cuernos curvos, orejas caídas y flequillo sobre los ojos.
export function fluffyHead(fur = BODY_FUR, { edge = false } = {}) {
  const dark = shade(fur, -0.24), light = shade(fur, 0.2), lighter = shade(fur, 0.36);
  const line = edge ? WHITE_EDGE : '';
  const bangs = [
    [24, 30, 45, 6, dark], [76, 30, 45, 6, dark],
    [32, 22, 50, 7, fur], [68, 22, 50, 7, fur],
    [41, 19, 53, 7, light], [59, 19, 53, 7, light],
    [50, 18, 61, 7.5, lighter],
  ];
  return `
    <g class="cow-horns">
      <path ${line} d="M28 31C16 31 6 22 7 7c6 10 14 14 25 15z" fill="#f4e8cf"/>
      <path ${line} d="M72 31C84 31 94 22 93 7c-6 10-14 14-25 15z" fill="#f4e8cf"/>
    </g>
    <g class="cow-ear cow-ear-l"><path ${line} d="M26 42C14 37 5 41 1 50c9 8 19 7 27 0z" fill="${dark}"/><path d="M23 45c-6-2-11-1-15 4 6 3 11 3 16-1z" fill="#eeb7a4"/></g>
    <g class="cow-ear cow-ear-r"><path ${line} d="M74 42C86 37 95 41 99 50c-9 8-19 7-27 0z" fill="${dark}"/><path d="M77 45c6-2 11-1 15 4-6 3-11 3-16-1z" fill="#eeb7a4"/></g>
    <path ${line} d="${shaggy(50, 51, 28, 32)}" fill="${fur}"/>
    <ellipse cx="33" cy="64" rx="5" ry="3.4" fill="#f09a86" opacity=".55"/>
    <ellipse cx="67" cy="64" rx="5" ry="3.4" fill="#f09a86" opacity=".55"/>
    <g class="cow-eyes">
      <g class="cow-eye"><circle cx="37" cy="56" r="3.8" fill="#2c1b14"/><circle cx="38.3" cy="54.7" r="1.2" fill="#fff"/></g>
      <g class="cow-eye"><circle cx="63" cy="56" r="3.8" fill="#2c1b14"/><circle cx="64.3" cy="54.7" r="1.2" fill="#fff"/></g>
    </g>
    <ellipse cx="50" cy="74" rx="19" ry="13.5" fill="#f4cdb9"/>
    <ellipse cx="50" cy="70" rx="15" ry="7" fill="#f9dccb" opacity=".8"/>
    <ellipse cx="43" cy="72" rx="2.4" ry="3" fill="#8c5a4b"/>
    <ellipse cx="57" cy="72" rx="2.4" ry="3" fill="#8c5a4b"/>
    <path d="M43 80q7 5 14 0" fill="none" stroke="#8c5a4b" stroke-width="2" stroke-linecap="round"/>
    <path d="${shaggy(50, 21, 19, 8, 9, 0.24)}" fill="${light}"/>
    ${bangs.map(([x, top, end, w, fill]) => strand(x, top, end, w, fill)).join('')}`;
}

export const muuMascotHTML = () => `
  <button type="button" class="muu" data-muu aria-label="Saluda a Muu">
    <span class="muu-say" aria-live="polite"></span>
    <svg class="muu-cow" viewBox="-2 0 104 92" aria-hidden="true">${fluffyHead()}</svg>
  </button>`;

export const MUU_PHRASES = ['¡Muu!', 'Te amuuu', '¡Muuy buena cita!', 'Muuchos besos', '¿Y mi galleta?', 'Muuuu ♥', 'Peinen mi flequillo', '¡Otra libreta!'];

const say = (text, size = 22) => `<text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Caveat Brush, cursive" font-size="${size}" fill="#3c2315">${text}</text>`;

// Stickers para el editor de páginas. `W` es el borde blanco que usan los demás stickers.
export function cowStickers(W) {
  const phrase = (id, n, text, col, vb, size) => {
    const [, , w, h] = vb.split(' ').map(Number);
    return { id, n, c: 'vaquitas frases romántico', col, vb, s: (c) => `<rect ${W} x="4" y="4" width="${w - 8}" height="${h - 8}" rx="${(h - 8) / 2}" fill="${c}"/>${say(text, size)}` };
  };
  return [
    { id: 'cow-peluda', n: 'Muu, vaquita peluda', c: 'vaquitas kawaii', col: BODY_FUR, s: (c) => fluffyHead(c, { edge: true }) },
    { id: 'cow-rubia', n: 'Vaquita rubia', c: 'vaquitas kawaii', col: '#dcb074', s: (c) => fluffyHead(c, { edge: true }) },
    { id: 'cow-negra', n: 'Vaquita negra', c: 'vaquitas kawaii', col: '#4d3a33', s: (c) => fluffyHead(c, { edge: true }) },
    { id: 'cow-entera', n: 'Muu de cuerpo entero', c: 'vaquitas kawaii', col: BODY_FUR, s: (c) => {
      const d = shade(c, -0.24);
      return `<path d="M88 50c8 2 9 12 6 20" fill="none" stroke="${d}" stroke-width="4" stroke-linecap="round"/><circle cx="94" cy="72" r="4" fill="${d}"/>
        <g fill="${d}"><rect x="38" y="70" width="9" height="24" rx="4"/><rect x="52" y="70" width="9" height="24" rx="4"/><rect x="68" y="70" width="9" height="24" rx="4"/><rect x="80" y="68" width="8" height="25" rx="4"/></g>
        <path ${W} d="${shaggy(62, 58, 29, 20, 18, 0.13)}" fill="${c}"/>
        <g transform="translate(-3 14) scale(.68)">${fluffyHead(c, { edge: true })}</g>`;
    } },
    { id: 'cow-clasica', n: 'Vaquita con manchas', c: 'vaquitas kawaii', col: '#fbf7ef', s: (c) => `
      <path ${W} d="M27 30C20 28 15 21 15 12c5 6 11 9 19 10zM73 30c7-2 12-9 12-18-5 6-11 9-19 10z" fill="#e8d9b8"/>
      <path ${W} d="M25 42C14 38 7 42 3 50c8 7 17 6 24 0zM75 42c11-4 18 0 22 8-8 7-17 6-24 0z" fill="${c}"/>
      <path ${W} d="M50 18c19 0 29 15 29 33 0 21-13 38-29 38S21 72 21 51c0-18 10-33 29-33z" fill="${c}"/>
      <path d="M31 25c8-5 17-2 18 8 1 11-11 18-20 13-6-4-5-16 2-21zM75 46c1 8-1 15-6 19-5-5-6-14 0-20 2-1 5-1 6 1z" fill="#2c211c"/>
      <circle cx="39" cy="54" r="3.8" fill="#2c1b14"/><circle cx="62" cy="54" r="3.8" fill="#2c1b14"/><circle cx="40.2" cy="52.8" r="1.2" fill="#fff"/><circle cx="63.2" cy="52.8" r="1.2" fill="#fff"/>
      <ellipse cx="50" cy="74" rx="18" ry="13" fill="#f6c6cf"/><ellipse cx="44" cy="72" rx="2.3" ry="3" fill="#a5606f"/><ellipse cx="56" cy="72" rx="2.3" ry="3" fill="#a5606f"/>
      <path d="M44 80q6 4 12 0" fill="none" stroke="#a5606f" stroke-width="2" stroke-linecap="round"/>` },
    { id: 'cow-cencerro', n: 'Cencerro', c: 'vaquitas', col: '#d9a441', s: (c) => `
      <path d="M30 8h40l-6 16H36z" fill="#b5462f"/><rect x="42" y="16" width="16" height="12" rx="3" fill="#8d8f93"/>
      <path ${W} d="M32 28h36l8 48c1 5-2 8-7 8H31c-5 0-8-3-7-8z" fill="${c}"/><path d="M38 34l-4 42" stroke="#fff" stroke-width="4" opacity=".45" stroke-linecap="round"/>
      <circle cx="50" cy="88" r="6" fill="#8d6a24"/>` },
    { id: 'cow-leche', n: 'Botella de leche', c: 'vaquitas', col: '#fffdf6', s: (c) => `
      <path ${W} d="M40 8h20v14c0 6 12 12 12 24v38c0 5-4 8-8 8H36c-4 0-8-3-8-8V46c0-12 12-18 12-24z" fill="${c}"/>
      <rect x="38" y="5" width="24" height="9" rx="3" fill="#d14f5e"/>
      <path d="M28 58c8-6 15 5 22 0s14-5 22 0v26c0 5-4 8-8 8H36c-4 0-8-3-8-8z" fill="#efe6d4"/>
      <path d="M41 62c5-3 8 1 7 5-1 3-7 4-9 1-1-2 0-5 2-6zM58 72c4-2 7 2 5 5s-7 3-8 0c0-2 1-4 3-5z" fill="#2c211c"/>` },
    phrase('cow-teamuuu', 'Te amuuu', 'Te amuuu', '#F6C6CF', '0 0 150 60', 28),
    phrase('cow-muu', '¡Muu!', '¡Muu!', '#F6E08A', '0 0 110 60', 30),
    phrase('cow-muuy', 'Muuy feliz', 'Muuy feliz', '#D8EBC8', '0 0 150 60', 28),
    phrase('cow-besos', 'Muuchos besos', 'Muuchos besos', '#fbf2e2', '0 0 190 60', 27),
    phrase('cow-cita', 'La mejor cita', 'La mejor cita', '#F2CDA0', '0 0 170 60', 27),
  ];
}
