// Fondo de la app. Los tonos vienen de los temas de Delulu Journal V2, en su versión oscura.
import { getMeta, setMeta } from './db.js';

export const THEMES = [
  { id: 'hojea', name: 'Hojea', bg1: '#4d50b8', bg2: '#7b7fdc', accent: '#ffd23f' },
  { id: 'delulu', name: 'Delulu', bg1: '#2F5852', bg2: '#386660', accent: '#EDB8B7' },
  { id: 'cafe', name: 'Noche de café', bg1: '#15100e', bg2: '#1d1714', accent: '#d39a6a' },
  { id: 'madera', name: 'Madera', bg1: '#221a16', bg2: '#2b221d', accent: '#d99ca2' },
  { id: 'rosa', name: 'Rosa empolvado', bg1: '#271d20', bg2: '#2f2326', accent: '#e3a3ad' },
  { id: 'salvia', name: 'Salvia', bg1: '#1c201b', bg2: '#232822', accent: '#a3b896' },
  { id: 'lavanda', name: 'Lavanda', bg1: '#1f1c27', bg2: '#26232f', accent: '#b6a8d8' },
  { id: 'cielo', name: 'Cielo', bg1: '#191e24', bg2: '#1f252c', accent: '#9db8cf' },
  { id: 'halloween', name: 'Halloween', bg1: '#1A1422', bg2: '#241C2E', accent: '#F08A3E' },
];

export function applyTheme(id) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  const st = document.documentElement.style;
  st.setProperty('--bg-1', t.bg1);
  st.setProperty('--bg-2', t.bg2);
  st.setProperty('--accent', t.accent);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.bg1);
  return t.id;
}

export const loadTheme = async () => applyTheme(await getMeta('theme'));
export const saveTheme = (id) => setMeta('theme', applyTheme(id));
