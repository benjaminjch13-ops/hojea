// Fondo de la app: variantes de la paleta pastel. Solo afecta a la interfaz, nunca a las libretas.
import { getMeta, setMeta } from './db.js';

const MILK_CREAM = '#FFF8EF';
const MUU_PINK = '#EFA8B7';

export const THEMES = [
  { id: 'leche', name: 'Milk Cream', bg1: MILK_CREAM, bg2: '#F6CAD2' },
  { id: 'fresa', name: 'Strawberry Milk', bg1: '#F6CAD2', bg2: MILK_CREAM },
  { id: 'matcha', name: 'Matcha Milk', bg1: '#C9D9B8', bg2: MILK_CREAM },
  { id: 'mantequilla', name: 'Butter Yellow', bg1: '#F6E3A5', bg2: MILK_CREAM },
  { id: 'lavanda', name: 'Lavender', bg1: '#DCD2EE', bg2: MILK_CREAM },
].map((t) => ({ ...t, accent: MUU_PINK }));

function applyTheme(id) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  const st = document.documentElement.style;
  st.setProperty('--bg-1', t.bg1);
  st.setProperty('--bg-2', t.bg2);
  st.setProperty('--accent', t.accent);
  st.setProperty('--app-accent', t.accent);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.bg1);
  return t.id;
}

export const loadTheme = async () => applyTheme(await getMeta('theme'));
export const saveTheme = (id) => setMeta('theme', applyTheme(id));
