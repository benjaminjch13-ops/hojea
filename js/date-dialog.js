// Registrar una cita y ver caer la vaquita que ganó.
import { getBook, getMeta, listBooks, saveBook, setMeta } from './db.js';
import { chooseVaquita, longDate, saveDate, todayISO } from './dates.js';
import { newDatePage } from './delulu.js';
import { esc, icon, modal } from './ui.js';
import { VAQ_VIEWBOX, vaquitaById, vaquitaCard, vaquitaCow } from './vaquitas.js';

function formHTML({ title, place, books, lastBook, page }) {
  return `
    <div class="manage-head">
      <h2>${page ? 'Esta página fue una cita' : 'Registrar una cita'}</h2>
      <button class="icon-btn dark" type="button" data-close aria-label="Cerrar">${icon('close')}</button>
    </div>
    <form class="date-form">
      <label class="field"><span class="field-label">¿Qué hicieron?</span>
        <input class="text-field" name="title" maxlength="80" required value="${esc(title)}" placeholder="Picnic en el parque"></label>
      <label class="field"><span class="field-label">¿Cuándo fue?</span>
        <input class="text-field" name="date" type="date" required value="${todayISO()}" max="${todayISO()}"></label>
      <label class="field"><span class="field-label">¿Dónde? (opcional)</span>
        <input class="text-field" name="place" maxlength="80" value="${esc(place)}" placeholder="Antigua Guatemala"></label>
      ${page ? '' : `<label class="field"><span class="field-label">Libreta</span>
        <select class="text-field" name="book">
          ${books.map((b) => `<option value="${b.id}"${b.id === lastBook ? ' selected' : ''}>${esc(b.title)}</option>`).join('')}
          <option value=""${books.length && lastBook !== '' ? '' : ' selected'}>Sin libreta</option>
        </select></label>
      <p class="date-hint">Si eligen una libreta, se agrega una página con el título, la fecha y su vaquita.</p>`}
      <div class="dialog-actions">
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button class="btn primary">Registrar cita</button>
      </div>
    </form>`;
}

const TAPS_TO_OPEN = 3;
const OPEN_STEPS = [0, 0.16, 0.38, 1];

// El establo con las puertas cerradas; detrás se asoma la silueta de la vaquita que ganaron.
const barnSVG = (id) => `
  <svg class="barn" viewBox="0 0 200 190" aria-hidden="true">
    <ellipse cx="100" cy="182" rx="98" ry="8" fill="#C9D9B8"/>
    <rect x="24" y="68" width="152" height="114" fill="#EFA8B7"/>
    <path d="M100 4L194 68v12H6V68z" fill="#79645D"/>
    <path d="M100 18L176 70H24z" fill="#F6CAD2"/>
    <circle cx="100" cy="50" r="13" fill="#FFF8EF" stroke="#79645D" stroke-width="3"/>
    <path d="M100 58c-10-6-9-14-4-14 2 0 4 2 4 4 0-2 2-4 4-4 5 0 6 8-4 14z" fill="#EFA8B7"/>
    <rect x="58" y="92" width="84" height="90" fill="#3A2C27"/>
    <svg x="62" y="98" width="76" height="84" viewBox="${VAQ_VIEWBOX}"><g class="barn-shadow">${vaquitaCow(id)}</g></svg>
    <g class="barn-door barn-door-l"><rect x="58" y="92" width="42" height="90" fill="#FFF8EF" stroke="#79645D" stroke-width="3"/><path d="M58 92l42 90M100 92l-42 90" stroke="#EFA8B7" stroke-width="4"/></g>
    <g class="barn-door barn-door-r"><rect x="100" y="92" width="42" height="90" fill="#FFF8EF" stroke="#79645D" stroke-width="3"/><path d="M100 92l42 90M142 92l-42 90" stroke="#EFA8B7" stroke-width="4"/></g>
  </svg>`;

function resultHTML(record, v, pageIndex) {
  const hearts = Array.from({ length: 10 }, (_, i) => `<i style="--dx:${(i - 4.5) * 26}px;--d:${500 + i * 35}ms">♥</i>`).join('');
  return `<div class="reveal-result">
      <div class="reveal-stage">
        ${v ? vaquitaCard(v.id, { className: 'reveal-card' }) : '<div class="reveal-none">♥</div>'}
        <em class="reveal-pop">¡Muu!</em>
        <div class="reveal-hearts" aria-hidden="true">${hearts}</div>
      </div>
      <h2>${v ? `¡Llegó ${esc(v.name)}!` : '¡Cita registrada!'}</h2>
      <p>${v ? `${esc(v.theme)}, por “${esc(record.title)}”.` : 'Por ahora ya ganaron todas las vaquitas disponibles. Las metas de citas todavía pueden traer sorpresas.'}</p>
      <div class="dialog-actions">
        ${pageIndex != null ? '<button class="btn ghost" data-go="page">Abrir su página</button>' : ''}
        <button class="btn ghost" data-go="collection">Ver la colección</button>
        <button class="btn primary" data-go="stay">Seguir</button>
      </div>
    </div>`;
}

// Chispas que salen de donde tocaron.
function burst(screen, x, y) {
  const box = screen.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const bit = document.createElement('i');
    bit.className = 'barn-bit';
    bit.textContent = i % 2 ? '♥' : '✦';
    bit.style.left = `${x - box.left}px`;
    bit.style.top = `${y - box.top}px`;
    bit.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
    bit.style.setProperty('--dy', `${-30 - Math.random() * 90}px`);
    screen.append(bit);
    setTimeout(() => bit.remove(), 800);
  }
}

// Primero el establo: unos cuantos toques abren las puertas y sale la vaquita que ganaron.
export function showReveal(record, { pageIndex } = {}) {
  const v = record.cow ? vaquitaById(record.cow) : null;
  const first = v ? `
    <button type="button" class="barn-tap">
      <span class="barn-title">¡Oh! ¡Alguien nuevo viene al establo!</span>
      ${barnSVG(v.id)}
      <span class="barn-hint" aria-live="polite">Toca la pantalla para abrir</span>
      <span class="barn-dots" aria-hidden="true">${'<b></b>'.repeat(TAPS_TO_OPEN)}</span>
    </button>` : resultHTML(record, v, pageIndex);
  return modal(`<div class="reveal-screen">${first}</div>`, (d, close) => {
    const screen = d.querySelector('.reveal-screen');
    let taps = 0;
    d.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]')?.dataset.go;
      if (go) { close(go); return; }
      const tap = e.target.closest('.barn-tap');
      if (!tap || taps >= TAPS_TO_OPEN) return;
      taps += 1;
      navigator.vibrate?.(25);
      const barn = tap.querySelector('.barn');
      barn.style.setProperty('--open', OPEN_STEPS[taps]);
      barn.classList.remove('shaking');
      void barn.getBoundingClientRect();
      barn.classList.add('shaking');
      tap.querySelectorAll('.barn-dots b').forEach((dot, i) => dot.classList.toggle('on', i < taps));
      burst(screen, e.clientX || screen.clientWidth / 2, e.clientY || screen.clientHeight / 2);
      const left = TAPS_TO_OPEN - taps;
      tap.querySelector('.barn-hint').textContent = left ? `¡Otra vez! ${left === 1 ? 'Falta 1' : `Faltan ${left}`}` : '¡Ya viene!';
      if (!left) {
        setTimeout(() => {
          if (!d.open) return;
          screen.innerHTML = resultHTML(record, v, pageIndex);
          screen.querySelector('[data-go="stay"]')?.focus();
        }, 750);
      }
    });
  }, 'dialog-reveal').then((go) => {
    if (go === 'collection') location.hash = '#/vaquitas';
    if (go === 'page') location.hash = `#/libro/${record.bookId}/paginas/${pageIndex}`;
    return go;
  });
}

// `page` y `book` vienen del editor: la cita se enlaza a esa página en vez de crear una nueva.
export async function openRegisterDialog({ title = '', place = '', ideaSrc, book = null, page = null } = {}) {
  const books = page ? [] : await listBooks();
  const stored = await getMeta('lastDateBook');
  const lastBook = books.some((b) => b.id === stored) ? stored : (stored === '' ? '' : books[0]?.id ?? '');
  const values = await modal(formHTML({ title, place, books, lastBook, page }), (d, close) => {
    d.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => close(); });
    d.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      close(Object.fromEntries(new FormData(e.target)));
    });
  });
  if (!values) return null;

  const clean = { title: values.title.trim(), date: values.date, place: values.place.trim() };
  if (!clean.title) return null;
  const cow = await chooseVaquita({ ...clean, ideaSrc });
  let bookId = book?.id ?? null;
  let pageId = page?.id ?? null;
  let pageIndex;
  if (!page && values.book) {
    const target = await getBook(values.book);
    if (target) {
      const created = newDatePage(target, clean.title, longDate(clean.date), clean.place, cow);
      target.pages.push(created);
      await saveBook(target);
      bookId = target.id;
      pageId = created.id;
      pageIndex = target.pages.length - 1;
    }
  }
  if (!page) await setMeta('lastDateBook', values.book ?? '');
  const record = await saveDate({ ...clean, bookId, pageId, cow });
  await showReveal(record, { pageIndex });
  return record;
}
