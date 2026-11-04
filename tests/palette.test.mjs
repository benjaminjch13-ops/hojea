import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { THEMES } from '../js/themes.js';
import { MUU_COLORS, MUU_PINK } from '../js/cow.js';
import { LEATHERS, coverDefaults } from '../js/cover.js';

const css = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`))?.[1];

const PALETTE = {
  'milk-cream': '#FFF8EF', 'strawberry-milk': '#F6CAD2', 'muu-pink': '#EFA8B7', 'butter-yellow': '#F6E3A5',
  'matcha-milk': '#C9D9B8', lavender: '#DCD2EE', cocoa: '#79645D', 'soft-white': '#FFFFFF',
};
const DERIVED = ['#54433D', '#6A5750']; // Cocoa más oscuro, solo para texto

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const inPalette = (hex) => Object.values(PALETTE).concat(DERIVED).some((c) => c.toLowerCase() === hex.toLowerCase());

test('los tokens de la app son exactamente los colores de la paleta', () => {
  for (const [name, hex] of Object.entries(PALETTE)) assert.equal(token(name)?.toUpperCase(), hex, name);
});

test('el texto se lee bien sobre todos los fondos de la paleta (AA, 4.5:1)', () => {
  const backgrounds = ['milk-cream', 'strawberry-milk', 'muu-pink', 'butter-yellow', 'matcha-milk', 'lavender', 'soft-white'];
  for (const bg of backgrounds) {
    assert.ok(contrast(token('cocoa-text'), PALETTE[bg]) >= 4.5, `texto principal sobre ${bg}`);
  }
  // El texto secundario va sobre fondos y tarjetas, no sobre botones Muu Pink.
  for (const bg of backgrounds.filter((b) => b !== 'muu-pink')) {
    assert.ok(contrast(token('cocoa-soft'), PALETTE[bg]) >= 4.5, `texto secundario sobre ${bg}`);
  }
  assert.ok(contrast('#FFFFFF', token('cocoa-text')) >= 4.5, 'avisos con letra blanca');
});

test('todos los temas salen de la paleta', () => {
  assert.ok(THEMES.length >= 1);
  for (const t of THEMES) {
    for (const hex of [t.bg1, t.bg2, t.accent]) assert.ok(inPalette(hex), `${t.name}: ${hex}`);
  }
});

test('Muu usa solo colores de la paleta', () => {
  assert.equal(MUU_PINK, PALETTE['muu-pink']);
  for (const [part, value] of Object.entries(MUU_COLORS)) {
    if (typeof value === 'string') assert.ok(inPalette(value), `${part}: ${value}`);
  }
});

test('la paleta no cambia las opciones de las libretas', () => {
  const cover = coverDefaults();
  assert.equal(cover.color, '#6E4127');
  assert.equal(cover.elastic.color, '#2457C9');
  assert.ok(LEATHERS.some(([, c]) => c === '#6E4127'));
  assert.ok(LEATHERS.every(([, c]) => !Object.values(PALETTE).slice(0, 7).includes(c)), 'ningún cuero se reemplazó por un color de la paleta');
  assert.match(css, /--paper: #fbf8f0;/);
});
