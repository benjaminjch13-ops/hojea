// Registrar una cita y ver caer la vaquita que ganó.
import { getBook, getMeta, listBooks, saveBook, setMeta } from './db.js';
import { chooseVaquita, longDate, saveDate, todayISO } from './dates.js';
import { newDatePage } from './delulu.js';
import { esc, icon, modal } from './ui.js';
import { vaquitaById, vaquitaCard } from './vaquitas.js';

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

// Muestra la vaquita que cae del cielo, con su "¡Muu!" y corazones.
export function showReveal(record, { pageIndex } = {}) {
  const v = record.cow ? vaquitaById(record.cow) : null;
  const hearts = Array.from({ length: 10 }, (_, i) => `<i style="--dx:${(i - 4.5) * 26}px;--d:${500 + i * 35}ms">♥</i>`).join('');
  return modal(`
    <div class="reveal-stage">
      ${v ? vaquitaCard(v.id, { className: 'reveal-card' }) : '<div class="reveal-none">♥</div>'}
      <em class="reveal-pop">¡Muu!</em>
      <div class="reveal-hearts" aria-hidden="true">${hearts}</div>
    </div>
    <h2>${v ? `¡Ganaron a ${esc(v.name)}!` : '¡Cita registrada!'}</h2>
    <p>${v ? `${esc(v.theme)}, por “${esc(record.title)}”.` : 'Por ahora ya ganaron todas las vaquitas disponibles. Las metas de citas todavía pueden traer sorpresas.'}</p>
    <div class="dialog-actions">
      ${pageIndex != null ? '<button class="btn ghost" data-go="page">Abrir su página</button>' : ''}
      <button class="btn ghost" data-go="collection">Ver la colección</button>
      <button class="btn primary" data-go="stay">Seguir</button>
    </div>`, (d, close) => {
    d.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]')?.dataset.go;
      if (go) close(go);
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
