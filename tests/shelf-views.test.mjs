import test from 'node:test';
import assert from 'node:assert/strict';
import { coverDefaults } from '../js/cover.js';
import { SHELF_VIEWS, inkOn, shelfHTML, validView } from '../js/shelf-views.js';

// Las portadas pintan su textura en un canvas; aquí basta con uno de mentira.
const context = new Proxy({}, {
  get: (_, name) => (name === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {}),
  set: () => true,
});
globalThis.document = {
  createElement: () => ({ getContext: () => context, toDataURL: () => 'data:image/jpeg;base64,' }),
  documentElement: { style: { setProperty: () => {} } },
};

const book = (id, title, pages = 0, cover = coverDefaults()) => ({ id, title, aspect: 0.72, cover, pages: Array(pages).fill({}) });
const books = [book('a', 'Citas 2026', 1), book('b', '<Viajes>', 12)];

test('todas las vistas muestran todas las libretas y permiten crear otra', () => {
  for (const [view] of SHELF_VIEWS) {
    const html = shelfHTML(books, view);
    assert.ok(html.includes('href="#/libro/a"'), `${view}: primera libreta`);
    assert.ok(html.includes('href="#/libro/b"'), `${view}: segunda libreta`);
    assert.ok(html.includes('data-new'), `${view}: nueva libreta`);
    assert.ok(html.includes(`view-${view}`), `${view}: su clase`);
    assert.ok(html.includes('&lt;Viajes&gt;') && !html.includes('<Viajes>'), `${view}: escapa el título`);
    assert.ok(!/undefined|NaN/.test(html), `${view}: sin datos vacíos`);
  }
});

test('el selector marca la vista elegida', () => {
  const html = shelfHTML(books, 'torre');
  assert.match(html, /data-view="torre" aria-pressed="true"/);
  assert.match(html, /data-view="carrusel" aria-pressed="false"/);
});

test('una vista desconocida o sin guardar abre el carrusel', () => {
  assert.equal(validView(undefined), 'carrusel');
  assert.equal(validView('otra'), 'carrusel');
  assert.ok(shelfHTML(books).includes('view-carrusel'));
});

test('solo el carrusel lleva flechas y puntos', () => {
  assert.ok(shelfHTML(books, 'carrusel').includes('data-carousel-dot'));
  for (const view of ['todas', 'torre', 'estante', 'abanico', 'lista']) assert.ok(!shelfHTML(books, view).includes('data-carousel'), view);
});

test('funciona sin libretas y con colores que no son un hexadecimal', () => {
  for (const [view] of SHELF_VIEWS) assert.ok(shelfHTML([], view).includes('data-new'), view);
  const odd = book('c', 'Rara', 0, { ...coverDefaults(), color: 'rainbow' });
  assert.ok(shelfHTML([odd], 'estante').includes('--spine:#6E4127'));
});

test('el texto del lomo contrasta con su color', () => {
  assert.equal(inkOn('#1F1A1C'), '#FFF8EF');
  assert.equal(inkOn('#F5EFE4'), '#3A2C27');
});
