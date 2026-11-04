// Portada de cuero: modelo, materiales y dibujo. Viene de Delulu Journal V2 y se dibuja
// con la unidad CSS --u (1/560 del ancho de la libreta), así sirve en cualquier tamaño.
import { CHARM_PHOTOS } from './charm-photos.js';
import { esc } from './ui.js';

const TORNASOL = '#e6e1ee';

// Colores de las libretas Delulu: [id, nombre, color].
export const BASE_LEATHERS = [['cafe', 'Café', '#6E4127'], ['rojizo', 'Café rojizo', '#8C3B2A'], ['azul', 'Azul', '#2F4A73'], ['blanco', 'Blanco', '#F2EEE6'], ['rosa', 'Rosa', '#E7A8B1'], ['tornasol', 'Tornasol', TORNASOL]];
export const BASE_ELASTICS = [['azul', 'Azul rey', '#2457C9'], ['negro', 'Negro', '#1f1b1a'], ['cafe', 'Café', '#5a3a28'], ['crema', 'Crema', '#efe3cc'], ['rosa', 'Rosa', '#EDB8B7'], ['amarillo', 'Amarillo', '#F2D36B'], ['verde', 'Verde Delulu', '#386660'], ['vino', 'Vino', '#7F3A3C']];

// Más tonos para elegir.
export const LEATHERS = [...BASE_LEATHERS.map(([, n, c]) => [n, c]), ['Coñac', '#8a5233'], ['Arena', '#c9a57d'], ['Salvia', '#7f9177'], ['Lavanda', '#8d81a6'], ['Burdeos', '#6e2b33'], ['Verde Delulu', '#386660'], ['Negro', '#262020']];
export const ELASTICS = [...BASE_ELASTICS.map(([, n, c]) => [n, c]), ['Lavanda', '#a596c4'], ['Oro', '#c9a24a']];
export const RIBBONS = ['#b5646d', '#d9a1a8', '#c9a24a', '#7f9474', '#7d9ab3', '#8e7bb5', '#3b2d26', '#f1e6d6'];
export const CHARM_SHAPES = [['croissant', 'Croissant'], ['heart', 'Corazón'], ['star', 'Estrella'], ['flower', 'Flor'], ['moon', 'Luna'], ['tree', 'Árbol'], ['letter', 'Inicial'], ['bead', 'Cuenta'], ['key', 'Llave'], ['leaf', 'Hoja'], ['shell', 'Concha']];
export const MATERIALS = [['oro', 'Oro'], ['plata', 'Plata'], ['bronce', 'Bronce'], ['esmalte', 'Esmalte'], ['perla', 'Perla']];
export const TEXTURES = [['natural', 'Natural'], ['liso', 'Liso'], ['granulado', 'Granulado'], ['saffiano', 'Saffiano']];
export const FINISHES = [['mate', 'Mate'], ['brillo', 'Brillante'], ['tornasol', 'Tornasol']];
export const PATTERN_NAMES = [['none', 'Ninguno'], ['rombos', 'Rombos'], ['puntos', 'Puntos'], ['rayas', 'Rayas'], ['floral', 'Floral'], ['cuadros', 'Cuadros']];
export const TITLE_FONTS = [['"Bodoni Moda", Georgia, serif', 'Bodoni'], ['"Young Serif", Georgia, serif', 'Young Serif'], ['"Playfair Display", Georgia, serif', 'Playfair'], ['"Cormorant Garamond", Georgia, serif', 'Cormorant'], ['"Dancing Script", cursive', 'Caligrafía'], ['"Amatic SC", cursive', 'Amatic'], ['Caveat, cursive', 'Caveat'], ['"Special Elite", monospace', 'Máquina']];
export const TEXT_EFFECTS = [['grabado', 'Grabado'], ['dorado', 'Oro'], ['plata', 'Plata'], ['impreso', 'Impreso']];
export const MAX_CHARMS = 6;

const PATTERNS = {
  none: 'none',
  rombos: 'repeating-linear-gradient(45deg,transparent 0 22px,rgba(255,255,255,.08) 22px 23px),repeating-linear-gradient(-45deg,transparent 0 22px,rgba(255,255,255,.08) 22px 23px)',
  puntos: 'radial-gradient(rgba(255,255,255,.13) 1.5px,transparent 2px) 0 0/16px 16px',
  rayas: 'repeating-linear-gradient(90deg,transparent 0 18px,rgba(0,0,0,.08) 18px 22px)',
  floral: 'radial-gradient(circle at 50% 50%,rgba(255,255,255,.12) 0 3px,transparent 4px) 0 0/40px 40px,radial-gradient(circle at 50% 50%,rgba(255,255,255,.08) 0 8px,transparent 9px) 20px 20px/40px 40px',
  cuadros: 'linear-gradient(rgba(0,0,0,.09) 2px,transparent 2px) 0 0/34px 34px,linear-gradient(90deg,rgba(0,0,0,.09) 2px,transparent 2px) 0 0/34px 34px',
};

let charmSeq = 0;
const newCharmId = () => `c${Date.now().toString(36)}${(charmSeq++).toString(36)}`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function shade(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const f = (v) => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
}

// ---------- Modelo ----------
export const newCharm = (shape, letter = 'A') => ({
  id: newCharmId(), shape, material: 'oro', color: '#c4878c', size: 1, letter: (letter[0] || 'A').toUpperCase(),
});

// La libreta real de Delulu: cuero liso con solapa, remaches, elástico fino y un charm.
export function coverDefaults() {
  return {
    model: 'delulu', color: '#6E4127', texture: 'liso', finish: 'mate', pattern: 'none',
    photoId: null, photoOwn: false, photoBlend: 'multiply', photoOp: 0.85, ribbon: '',
    elastic: { color: '#2457C9', style: 'cordon', orient: 'horizontal', width: 6, pos: 0.45 },
    charms: [{ ...newCharm('concha'), size: 1.15 }],
    title: { show: true, font: TITLE_FONTS[0][0], fx: 'grabado', y: 0.24, size: 1, italic: true, color: '#fbf2ea' },
    initials: { text: '', fx: 'dorado' },
  };
}

// Convierte los cuadernos creados antes de la unión, sin perder su color ni sus páginas.
const OLD_PALETTES = { verde: '#17945a', granate: '#b92d48', noche: '#1e2a78', mostaza: '#f2b632', laguna: '#0f766e', lino: '#efe8da', carbon: '#2b2b33' };
const OLD_PATTERNS = { flores: 'floral', puntos: 'puntos', rayas: 'rayas' };
const migratePage = (p) => (p.elements ? p : { ...p, scan: p.id, bg: { type: 'plain', color: '#fbf8f0' }, elements: [] });
export function migrateBook(book) {
  if (!book) return book;
  let result = book;
  if (book.pages?.some((p) => !p.elements)) result = { ...result, pages: book.pages.map(migratePage) };
  if (result.cover) return result;
  const { palette, pattern, coverPageId, ...rest } = result;
  const cover = coverDefaults();
  cover.color = OLD_PALETTES[palette] ?? cover.color;
  cover.pattern = OLD_PATTERNS[pattern] ?? 'none';
  if (coverPageId) Object.assign(cover, { photoId: coverPageId, photoBlend: 'normal', photoOp: 1 });
  return { ...rest, cover };
}

// Una libreta al azar.
export function surpriseCover(cover) {
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const shapes = Object.keys(CHARM_PHOTOS);
  const orient = pick(['horizontal', 'horizontal', 'vertical']);
  return {
    ...cover,
    color: pick(BASE_LEATHERS)[2],
    texture: pick(TEXTURES)[0],
    finish: 'mate',
    elastic: { ...cover.elastic, color: pick(BASE_ELASTICS)[2], orient, pos: orient === 'horizontal' ? 0.45 : 0.84 },
    charms: [{ ...newCharm(pick(shapes)), size: 1.15 }],
    title: { ...cover.title, fx: pick(['grabado', 'dorado', 'plata']) },
  };
}

// ---------- Texturas ----------
const TEX = {};
function makeTexture(kind) {
  if (TEX[kind]) return;
  const c = document.createElement('canvas');
  c.width = c.height = 220;
  const x = c.getContext('2d');
  const im = x.createImageData(220, 220);
  const amp = kind === 'granulado' ? 70 : kind === 'natural' ? 45 : 22;
  for (let i = 0; i < im.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * amp;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
    im.data[i + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  if (kind === 'granulado') {
    for (let i = 0; i < 900; i++) {
      const px = Math.random() * 220, py = Math.random() * 220, r = 1.5 + Math.random() * 3;
      const g = x.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
      g.addColorStop(0, 'rgba(255,255,255,.18)');
      g.addColorStop(1, 'rgba(0,0,0,.22)');
      x.fillStyle = g;
      x.beginPath();
      x.arc(px, py, r, 0, 7);
      x.fill();
    }
  }
  if (kind === 'natural') {
    for (let i = 0; i < 26; i++) {
      const px = Math.random() * 220, py = Math.random() * 220, r = 20 + Math.random() * 50;
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, Math.random() < 0.5 ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.10)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, 220, 220);
    }
    x.strokeStyle = 'rgba(0,0,0,.08)';
    for (let i = 0; i < 14; i++) {
      x.beginPath();
      let px = Math.random() * 220, py = Math.random() * 220;
      x.moveTo(px, py);
      for (let j = 0; j < 4; j++) { px += (Math.random() - 0.5) * 40; py += (Math.random() - 0.5) * 20; x.lineTo(px, py); }
      x.stroke();
    }
  }
  if (kind === 'saffiano') {
    x.strokeStyle = 'rgba(0,0,0,.18)';
    for (let i = -220; i < 440; i += 4) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 220, 220); x.stroke();
      x.beginPath(); x.moveTo(i + 220, 0); x.lineTo(i, 220); x.stroke();
    }
  }
  TEX[kind] = c.toDataURL('image/jpeg', 0.82);
  document.documentElement.style.setProperty(`--tx-${kind}`, `url(${TEX[kind]})`);
}

// ---------- Dibujo ----------
const isIridescent = (c) => c.color.toLowerCase() === TORNASOL || c.finish === 'tornasol';
const unit = (n) => `calc(var(--u) * ${+n.toFixed(2)})`;

// Capas de cuero que se comparten entre tapa, contratapa y lomo.
export function leatherLayers(c) {
  makeTexture(c.texture);
  return `<div class="lea-tex" style="background:var(--tx-${c.texture});opacity:${c.texture === 'liso' ? 0.5 : 0.85}"></div>
    <div class="lea-pat" style="background:${PATTERNS[c.pattern] ?? 'none'}"></div>`;
}
const finishLayers = (c) => {
  const iris = isIridescent(c);
  const shine = c.finish === 'brillo' || iris
    ? 'linear-gradient(115deg,rgba(255,255,255,.28),rgba(255,255,255,0) 35%,rgba(255,255,255,0) 60%,rgba(255,255,255,.12) 75%,rgba(255,255,255,0) 90%)'
    : 'linear-gradient(115deg,rgba(255,255,255,.08),transparent 40%)';
  return `${iris ? '<div class="lea-iris"></div>' : ''}<div class="lea-shine" style="background:${shine}"></div>`;
};

function textEffect(fx, color, leather) {
  const metal = (stops) => `color:transparent;background:linear-gradient(170deg,${stops});-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 1px 0 rgba(0,0,0,.35));`;
  if (fx === 'dorado') return metal('#fff3b8,#d4a843 45%,#8f6a1f 55%,#f1d27a');
  if (fx === 'plata') return metal('#fff,#c3c7cc 45%,#7d838a 55%,#eef0f2');
  if (fx === 'impreso') return `color:${color};`;
  // Sobre cuero oscuro, un grabado más oscuro no se lee: ahí el relieve se ilumina.
  if (luminance(leather) < 0.09) return `color:${shade(leather, 0.42)};text-shadow:0 -1px 0 rgba(0,0,0,.55),0 1px 0 rgba(255,255,255,.12);`;
  return `color:${shade(leather, -0.5)};text-shadow:0 1px 0 rgba(255,255,255,.26),0 -1px 1px rgba(0,0,0,.5);`;
}

// Color del relieve cuando el cuero es muy oscuro; null si sirve el grabado normal.
export const engraveColor = (leather) => (luminance(leather) < 0.09 ? shade(leather, 0.42) : null);

function luminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const f = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}

function titleHTML(book) {
  const c = book.cover, t = c.title;
  if (!t.show || !book.title) return '';
  const fs = Math.min(46, Math.max(26, 560 / Math.max(8, book.title.length))) * t.size;
  const font = t.font.replace(/"/g, "'");
  return `<div class="lea-title" style="top:${t.y * 100}%;font-family:${font};font-style:${t.italic ? 'italic' : 'normal'};font-size:${unit(fs)};${textEffect(t.fx, t.color, c.color)}">${esc(book.title)}</div>`;
}
function initialsHTML(c) {
  const txt = (c.initials.text || '').trim().toUpperCase().slice(0, 3);
  if (!txt) return '';
  return `<div class="lea-initials" style="font-size:${unit(22)};${textEffect(c.initials.fx, c.title.color, c.color)}">${esc(txt)}</div>`;
}

export function coverFaceHTML(book) {
  const c = book.cover;
  const photo = c.photoId
    ? `<img class="lea-photo" data-id="${esc(c.photoId)}" alt="" draggable="false" style="opacity:${c.photoOp};mix-blend-mode:${c.photoBlend}">`
    : '';
  const model = c.model === 'delulu'
    ? '<div class="lea-flapback"></div><div class="lea-flap"></div><i class="lea-rivet t"></i><i class="lea-rivet b"></i>'
    : '<div class="lea-spine"></div><div class="lea-stitch"></div>';
  return `${photo}${leatherLayers(c)}${model}${titleHTML(book)}${initialsHTML(c)}${finishLayers(c)}`;
}

export function backFaceHTML(book) {
  const c = book.cover, e = c.elastic, t = unit(e.width);
  const strip = e.orient === 'horizontal'
    ? `left:0;right:0;top:calc(${e.pos * 100}% - ${t} / 2);height:${t}`
    : `top:0;bottom:0;left:calc(${(1 - e.pos) * 100}% - ${t} / 2);width:${t}`;
  return `${leatherLayers(c)}<div class="lea-stitch back"></div>
    <div class="lea-band" style="${strip};background:${bandFill(e, e.orient === 'horizontal')}"></div>${finishLayers(c)}`;
}

export function bandFill(e, horizontal) {
  const c = e.color, deg = horizontal ? 180 : 90;
  if (e.style === 'plano') return `linear-gradient(${deg}deg,${shade(c, -0.25)},${c} 20%,${c} 80%,${shade(c, -0.25)})`;
  if (e.style === 'trenzado') return `repeating-linear-gradient(35deg,${shade(c, 0.15)} 0 3px,${shade(c, -0.25)} 3px 6px)`;
  return `linear-gradient(${deg}deg,${shade(c, -0.45)},${shade(c, 0.25)} 45%,${c} 60%,${shade(c, -0.45)})`;
}

export function bandHTML(c) {
  const e = c.elastic, t = unit(e.width), horizontal = e.orient === 'horizontal';
  const box = horizontal
    ? `left:${unit(-8)};right:${unit(-14)};top:calc(${e.pos * 100}% - ${t} / 2);height:${t}`
    : `top:${unit(-8)};bottom:${unit(-12)};left:calc(${e.pos * 100}% - ${t} / 2);width:${t}`;
  const seam = e.style === 'plano' ? `<i class="lea-seam ${horizontal ? 'h' : 'v'}"></i>` : '';
  return `<div class="lea-band outer" style="${box};background:${bandFill(e, horizontal)};border-radius:${t}">${seam}</div>`;
}

export function charmsHTML(c) {
  const e = c.elastic, offsets = [0, -22, 22, -42, 42, -62];
  return c.charms.map((ch, i) => {
    const s = 46 * (ch.size || 1), off = offsets[i % 6];
    const vertical = e.orient !== 'horizontal';
    const left = vertical ? `calc(${e.pos * 100}% + ${unit(off * 0.6 - s / 2)})` : `calc(50% + ${unit(off - s / 2)})`;
    const top = vertical ? `calc(42% + ${unit(i * 8 - s * 0.12)})` : `calc(${e.pos * 100}% + ${unit(-4 - s * 0.12)})`;
    return `<div class="lea-charm" style="left:${left};top:${top};width:${unit(s)};--tilt:${i % 2 ? 4 : -5}deg">${charmSVG(ch)}</div>`;
  }).join('');
}

function metalGradient(mat, col, id) {
  const g = {
    oro: ['#fbeaa0', '#d9b04a', '#9c7424'], plata: ['#ffffff', '#c9ccd1', '#7f858c'], bronce: ['#f0c08a', '#b47a43', '#6e431f'],
    perla: ['#ffffff', '#f6e9ea', '#d8c7c9'], esmalte: [shade(col, 0.35), col, shade(col, -0.3)],
  }[mat] ?? ['#fff', '#ccc', '#888'];
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset=".5" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/></linearGradient>`;
}

export function charmSVG(ch) {
  const photo = CHARM_PHOTOS[ch.shape];
  if (photo) {
    const k = Math.min(32 / photo.w, 40 / photo.h), iw = photo.w * k, ih = photo.h * k;
    return `<svg viewBox="0 0 40 60" aria-hidden="true"><g filter="drop-shadow(1px 2px 1.5px rgba(0,0,0,.45))"><circle cx="20" cy="6" r="4" fill="none" stroke="#c9ccd1" stroke-width="2"/><path d="M20 10v8" stroke="#c9ccd1" stroke-width="1.6" stroke-dasharray="2 1.2"/><image href="${photo.src}" x="${(40 - iw) / 2}" y="18" width="${iw}" height="${ih}"/></g></svg>`;
  }
  const id = `g${newCharmId()}`, f = `url(#${id})`;
  const edge = ch.material === 'esmalte' ? shade(ch.color, -0.4) : 'rgba(60,40,20,.5)';
  const metal = ch.material === 'esmalte' ? '#d9b04a' : ch.material === 'perla' ? '#d9c8a0' : null;
  const S = `fill="${f}" stroke="${edge}" stroke-width="1"`;
  const shapes = {
    heart: `<path ${S} d="M20 50C6 41 4 31 11 27c5-3 8 0 9 3 1-3 4-6 9-3 7 4 5 14-9 23z"/>`,
    star: `<path ${S} d="M20 22l4.5 9.5 10.5 1.2-7.8 7 2.2 10.4L20 45l-9.4 5.1 2.2-10.4-7.8-7 10.5-1.2z"/>`,
    flower: `${[0, 72, 144, 216, 288].map((a) => `<ellipse ${S} cx="20" cy="29" rx="5" ry="8" transform="rotate(${a} 20 37)"/>`).join('')}<circle cx="20" cy="37" r="4" fill="${metal || '#f6e4a0'}"/>`,
    moon: `<path ${S} d="M24 22a14 14 0 1 0 10 22 12 12 0 0 1-10-22z"/>`,
    tree: `<g ${S}><circle cx="20" cy="31" r="8"/><circle cx="12" cy="36" r="6"/><circle cx="28" cy="36" r="6"/><rect x="18" y="38" width="4" height="12"/></g>`,
    letter: `<circle ${S} cx="20" cy="37" r="13"/><circle cx="20" cy="37" r="10" fill="none" stroke="${edge}" stroke-width=".6"/><text x="20" y="42.5" text-anchor="middle" font-family="Young Serif, serif" font-size="15" fill="${ch.material === 'esmalte' ? '#fff' : '#5a4220'}">${esc((ch.letter || 'A').slice(0, 1).toUpperCase())}</text>`,
    bead: `<circle ${S} cx="20" cy="30" r="6"/><circle ${S} cx="20" cy="44" r="8"/>`,
    key: `<g ${S}><circle cx="20" cy="27" r="6"/><rect x="18.5" y="32" width="3" height="20"/><rect x="21" y="45" width="5" height="3"/><rect x="21" y="40" width="4" height="3"/></g><circle cx="20" cy="27" r="2.5" fill="#000" opacity=".35"/>`,
    leaf: `<path ${S} d="M20 22c10 8 10 22 0 30-10-8-10-22 0-30z"/><path d="M20 24v26" stroke="${edge}" stroke-width=".8"/>`,
    croissant: `<defs><linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7cf77"/><stop offset=".6" stop-color="#dc9a45"/><stop offset="1" stop-color="#b26f2c"/></linearGradient></defs><g fill="url(#${id}c)" stroke="#9a5a24" stroke-width=".8"><ellipse cx="7" cy="40" rx="3.6" ry="3" transform="rotate(-40 7 40)"/><ellipse cx="33" cy="40" rx="3.6" ry="3" transform="rotate(40 33 40)"/><ellipse cx="12.5" cy="36" rx="5" ry="5.6" transform="rotate(-28 12.5 36)"/><ellipse cx="27.5" cy="36" rx="5" ry="5.6" transform="rotate(28 27.5 36)"/><ellipse cx="20" cy="34" rx="6" ry="7"/></g><path d="M17 30q3 -2 6 0M15 36q5 -2 10 0" stroke="#fbe2a6" stroke-width="1" fill="none" opacity=".8"/>`,
    shell: `<path ${S} d="M20 22l14 18c-4 8-24 8-28 0z"/><path d="M20 22l-6 21M20 22v22M20 22l6 21" stroke="${edge}" stroke-width=".8"/>`,
  };
  const ring = metal || f;
  return `<svg viewBox="0 0 40 60" aria-hidden="true"><defs>${metalGradient(ch.material, ch.color, id)}</defs><g filter="drop-shadow(1px 2px 1.5px rgba(0,0,0,.45))"><circle cx="20" cy="6" r="4" fill="none" stroke="${ring}" stroke-width="2"/><path d="M20 10v12" stroke="${ring}" stroke-width="1.6" stroke-dasharray="2 1.2"/>${shapes[ch.shape] ?? ''}</g>${ch.material === 'esmalte' ? '<ellipse cx="15" cy="32" rx="3" ry="2" fill="#fff" opacity=".5"/>' : ''}</svg>`;
}

export const charmName = (shape) =>
  CHARM_PHOTOS[shape]?.n ?? CHARM_SHAPES.find(([id]) => id === shape)?.[1] ?? 'Charm';

// Libreta cerrada y plana, para el estante.
export function miniBookHTML(book) {
  return `<div class="cover-box"><div class="mini-book" style="aspect-ratio:${book.aspect || 0.72}">
    <i class="mini-edge r"></i><i class="mini-edge b"></i>
    <div class="lea" style="background-color:${book.cover.color}">${coverFaceHTML(book)}</div>
    ${bandHTML(book.cover)}${charmsHTML(book.cover)}
  </div></div>`;
}
