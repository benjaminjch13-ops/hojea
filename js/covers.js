// Portadas originales generadas como SVG.
export const PALETTES = [
  { id: 'verde', bg: '#17945a', a: '#ffd23f', b: '#e4572e' },
  { id: 'granate', bg: '#b92d48', a: '#f7c8a6', b: '#2f2a7a' },
  { id: 'noche', bg: '#1e2a78', a: '#ffb5a7', b: '#7ad1c4' },
  { id: 'mostaza', bg: '#f2b632', a: '#d6336c', b: '#1b4965' },
  { id: 'laguna', bg: '#0f766e', a: '#fde68a', b: '#fb7185' },
  { id: 'lino', bg: '#efe8da', a: '#3b3a8f', b: '#e4572e' },
  { id: 'carbon', bg: '#2b2b33', a: '#f2b632', b: '#e8e4da' },
];

export const PATTERNS = [
  { id: 'formas', name: 'Formas' },
  { id: 'flores', name: 'Flores' },
  { id: 'ondas', name: 'Ondas' },
  { id: 'puntos', name: 'Puntos' },
  { id: 'rayas', name: 'Rayas' },
  { id: 'liso', name: 'Liso' },
];

function flower(x, y, r, petal, center) {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const t = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return `<circle cx="${(x + Math.cos(t) * r).toFixed(1)}" cy="${(y + Math.sin(t) * r).toFixed(1)}" r="${(r * 0.72).toFixed(1)}" fill="${petal}"/>`;
  }).join('');
  return `${petals}<circle cx="${x}" cy="${y}" r="${(r * 0.55).toFixed(1)}" fill="${center}"/>`;
}

const ART = {
  liso: () => '',
  formas: ({ a, b }) => `
    <path d="M40 60 L120 30 L140 110 Z" fill="${a}"/>
    <circle cx="225" cy="85" r="42" fill="${b}"/>
    <rect x="30" y="285" width="78" height="78" rx="10" fill="${b}" transform="rotate(-14 69 324)"/>
    <path d="M190 300 q45 -60 85 -10 q-20 75 -85 10 Z" fill="${a}"/>
    <path d="M150 350 l28 -44 l26 46 Z" fill="#fff" opacity=".85"/>
    <circle cx="70" cy="165" r="10" fill="#fff" opacity=".85"/>`,
  flores: ({ a, b }) => `
    <path d="M60 400 C90 300 40 240 90 150 M230 400 C210 320 260 250 225 130" stroke="${a}" stroke-width="5" fill="none" opacity=".7"/>
    ${flower(88, 88, 28, a, b)}${flower(225, 70, 22, b, a)}
    ${flower(54, 322, 22, b, a)}${flower(245, 320, 30, a, b)}
    ${flower(150, 366, 16, '#fff', b)}${flower(160, 34, 13, '#fff', a)}`,
  ondas: ({ a, b }) => Array.from({ length: 9 }, (_, i) => {
    const y = 20 + i * 48;
    return `<path d="M-10 ${y} q40 -34 80 0 t80 0 t80 0 t80 0" stroke="${i % 2 ? a : b}" stroke-width="11" fill="none" stroke-linecap="round"/>`;
  }).join(''),
  puntos: ({ a, b }) => Array.from({ length: 56 }, (_, i) => {
    const x = 22 + (i % 7) * 43 + (Math.floor(i / 7) % 2) * 21;
    const y = 24 + Math.floor(i / 7) * 52;
    return `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 11 : 6}" fill="${i % 2 ? a : b}"/>`;
  }).join(''),
  rayas: ({ a, b }) => Array.from({ length: 12 }, (_, i) =>
    `<rect x="${-120 + i * 56}" y="-80" width="24" height="600" fill="${i % 2 ? a : b}" transform="rotate(24 150 200)"/>`).join(''),
};

export function coverImage(paletteId, patternId) {
  const p = PALETTES.find((x) => x.id === paletteId) ?? PALETTES[0];
  const art = (ART[patternId] ?? ART.liso)(p);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice"><rect width="300" height="400" fill="${p.bg}"/>${art}</svg>`;
  // Comillas simples: este valor se inserta dentro de atributos style="...".
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;
}

export const coverColor = (paletteId) => (PALETTES.find((x) => x.id === paletteId) ?? PALETTES[0]).bg;
