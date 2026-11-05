// Las formas de ver las libretas en el inicio. Todas muestran lo mismo: cambia solo la presentación.
import { miniBookHTML } from './cover.js';
import { esc, icon } from './ui.js';

export const SHELF_VIEWS = [
  ['carrusel', 'Carrusel'], ['todas', 'Todas'], ['torre', 'Torre'], ['estante', 'Estante'], ['abanico', 'Abanico'], ['lista', 'Lista'],
];
export const validView = (view) => (SHELF_VIEWS.some(([id]) => id === view) ? view : SHELF_VIEWS[0][0]);

const pageCount = (n) => (n === 1 ? '1 página' : `${n} páginas`);
const FALLBACK = '#6E4127';

export function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? '#3A2C27' : '#FFF8EF';
}

// Un número estable por libreta, para que cada una conserve su desorden natural entre visitas.
const seed = (id) => [...String(id)].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) % 9973, 7);

function spineVars(book) {
  const raw = book.cover?.color;
  const color = /^#[0-9a-f]{6}$/i.test(raw ?? '') ? raw : FALLBACK;
  const s = seed(book.id);
  const pages = book.pages?.length ?? 0;
  return `--spine:${color};--spine-ink:${inkOn(color)};--thick:${Math.min(38 + pages * 2, 74)}px;--off:${(s % 25) - 12}px;--tall:${(s % 34)}px;--band:${book.cover?.elastic?.color ?? 'transparent'}`;
}

const spine = (book) => `<span class="lomo"><span class="lomo-title">${esc(book.title)}</span><span class="lomo-count">${esc(pageCount(book.pages.length))}</span></span>`;
const meta = (book) => `<span class="shelf-meta"><strong>${esc(book.title)}</strong><span>${esc(pageCount(book.pages.length))}</span></span>`;
const newMeta = '<span class="shelf-meta"><strong>Nueva libreta</strong><span>Elige su cuero y sus charms</span></span>';

const edited = (book) => {
  const when = book.updated ?? book.createdAt;
  return when ? `Editada el ${new Date(when).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}` : '';
};

function itemInner(book, view) {
  if (view === 'torre' || view === 'estante') return spine(book);
  if (view === 'abanico') return miniBookHTML(book);
  if (view === 'lista') {
    return `${miniBookHTML(book)}<span class="shelf-meta"><strong>${esc(book.title)}</strong><span>${esc([pageCount(book.pages.length), edited(book)].filter(Boolean).join(' · '))}</span></span>${icon('right')}`;
  }
  return miniBookHTML(book) + meta(book);
}

function newInner(view) {
  if (view === 'torre' || view === 'estante') return `<span class="lomo lomo-new">${icon('plus')}<span class="lomo-title">Nueva libreta</span></span>`;
  if (view === 'abanico') return `<span class="shelf-new-box">${icon('plus')}</span>`;
  if (view === 'lista') return `<span class="shelf-new-box">${icon('plus')}</span>${newMeta}`;
  return `<span class="shelf-new-box">${icon('plus')}</span>${newMeta}`;
}

export function shelfHTML(books, requested) {
  const view = validView(requested);
  const total = books.length + 1;
  const middle = (total - 1) / 2;
  const fan = (i) => `--fan:${(i - middle).toFixed(1)};--gaps:${Math.max(total - 1, 1)};--z:${i};`;
  const items = books.map((b, i) => `
    <a class="shelf-item" href="#/libro/${b.id}" aria-label="${esc(b.title)}, ${esc(pageCount(b.pages.length))}" style="--i:${i};${fan(i)}${spineVars(b)}">${itemInner(b, view)}</a>`).join('');
  const add = `<button class="shelf-new" data-new aria-label="Nueva libreta" style="--i:${books.length};${fan(books.length)}">${newInner(view)}</button>`;
  const carousel = view === 'carrusel';
  return `
    <div class="view-picker" role="group" aria-label="Cómo ver las libretas">
      ${SHELF_VIEWS.map(([id, label]) => `<button type="button" class="chip" data-view="${id}" aria-pressed="${id === view}">${label}</button>`).join('')}
    </div>
    <div class="library view-${view}">
      ${carousel ? `<button type="button" class="icon-btn carousel-arrow prev" data-carousel-prev aria-label="Libreta anterior">${icon('left')}</button>` : ''}
      <div class="shelf-grid" role="group" aria-label="Sus libretas">${view === 'torre' ? add + items : items + add}</div>
      ${carousel ? `<button type="button" class="icon-btn carousel-arrow next" data-carousel-next aria-label="Libreta siguiente">${icon('right')}</button>
      <div class="carousel-dots">${[...books, null].map((b, i) => `<button type="button" data-carousel-dot aria-label="${b ? `Ir a ${esc(b.title)}` : 'Ir a nueva libreta'}, ${i + 1} de ${total}"></button>`).join('')}</div>` : ''}
    </div>`;
}
