// Pantalla "Sus vaquitas": la colección completa y la lista de citas.
import { deleteDate, listDates, longDate } from './dates.js';
import { openRegisterDialog } from './date-dialog.js';
import { getBook } from './db.js';
import { confirmDialog, esc, icon, modal, toast } from './ui.js';
import { SERIES, TOTAL_VAQUITAS, VAQUITAS, seriesOf, vaquitaById, vaquitaCard } from './vaquitas.js';

const lockedHint = (v) => {
  if (v.meta) return `Llega con la cita ${v.meta}`;
  if (v.special === 'aniversario') return 'Una cita en su aniversario';
  if (v.special === 'chapina') return 'Una cita fuera de casa, con lugar';
  if (v.special === 'dorada') return 'Al completar todas las demás';
  if (v.places) return `Una cita en ${v.theme.split(', ').pop()}`;
  return 'Por descubrir';
};

// Dónde está ahora la página de la cita: se reordenan, y también se pueden borrar.
async function locatePage(record) {
  if (!record.bookId || !record.pageId) return null;
  const book = await getBook(record.bookId);
  const index = book?.pages.findIndex((p) => p.id === record.pageId) ?? -1;
  return index < 0 ? null : { book, index };
}

async function showDetail(record, onChange) {
  const v = record.cow ? vaquitaById(record.cow) : null;
  const where = await locatePage(record);
  const lostPage = record.pageId && !where;
  await modal(`
    <div class="manage-head">
      <h2>${esc(v ? v.name : record.title)}</h2>
      <button class="icon-btn dark" data-close aria-label="Cerrar">${icon('close')}</button>
    </div>
    ${v ? vaquitaCard(v.id, { className: 'detail-card' }) : ''}
    ${v ? `<p class="detail-theme">${esc(v.theme)}</p>` : ''}
    <p class="detail-date"><strong>${esc(record.title)}</strong><br>${esc(longDate(record.date))}${record.place ? ` · ${esc(record.place)}` : ''}</p>
    ${lostPage ? '<p class="date-hint">La página de esta cita ya no está en la libreta.</p>' : ''}
    <div class="dialog-actions">
      <button class="btn ghost" data-delete>Borrar esta cita</button>
      ${where ? `<a class="btn primary" href="#/libro/${where.book.id}/hoja/${where.index}" data-close>Abrir su página</a>` : ''}
    </div>`, (d, close) => {
    d.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => close()));
    d.querySelector('[data-delete]').onclick = async () => {
      const sure = await confirmDialog(
        '¿Borrar esta cita?',
        v ? `También se irá ${v.name}. Las páginas de sus libretas no se tocan.` : 'Las páginas de sus libretas no se tocan.',
        'Borrar',
      );
      if (!sure) return;
      await deleteDate(record.id);
      toast('Cita borrada');
      close();
      onChange();
    };
  }, 'dialog-detail');
}

export async function renderCollection(app, isCurrent) {
  const paint = async () => {
    const dates = await listDates();
    if (!isCurrent()) return;
    const owner = new Map(dates.filter((d) => d.cow).map((d) => [d.cow, d]));
    app.innerHTML = `
      <section class="view collection">
        <header class="collection-head">
          <a class="icon-btn" href="#/" aria-label="Volver al inicio">${icon('back')}</a>
          <div class="collection-title">
            <h1>Sus vaquitas</h1>
            <p>${owner.size} de ${TOTAL_VAQUITAS} · ${dates.length === 1 ? '1 cita' : `${dates.length} citas`}</p>
          </div>
          <button class="btn primary" data-register>Registrar cita</button>
        </header>
        ${SERIES.map(([key, label]) => {
          const list = VAQUITAS.filter((v) => seriesOf(v) === key);
          const won = list.filter((v) => owner.has(v.id)).length;
          return `<h2 class="series-title">${esc(label)} <span>${won} de ${list.length}</span></h2>
            <div class="vaq-grid">${list.map((v) => {
              const record = owner.get(v.id);
              return record
                ? `<button class="vaq-tile" data-date="${record.id}">${vaquitaCard(v.id)}<strong>${esc(v.name)}</strong><span>${esc(v.theme)}</span></button>`
                : `<div class="vaq-tile is-locked">${vaquitaCard(v.id, { locked: true })}<strong>???</strong><span>${esc(lockedHint(v))}</span></div>`;
            }).join('')}</div>`;
        }).join('')}
        <h2 class="shelf-title">Sus citas</h2>
        ${dates.length ? `<ul class="date-list">${dates.map((d) => `
          <li><button data-date="${d.id}">
            <span class="date-when">${esc(longDate(d.date))}</span>
            <strong>${esc(d.title)}</strong>
            ${d.place ? `<span class="date-place">${esc(d.place)}</span>` : ''}
          </button></li>`).join('')}</ul>`
        : '<p class="date-empty">Todavía no hay citas. Registren la primera y ganarán su primera vaquita.</p>'}
      </section>`;
    app.querySelector('[data-register]').onclick = async () => {
      if (await openRegisterDialog()) paint();
    };
    app.querySelector('.collection').addEventListener('click', (e) => {
      const id = e.target.closest('[data-date]')?.dataset.date;
      const record = id && dates.find((d) => d.id === id);
      if (record) showDetail(record, paint);
    });
  };
  await paint();
}
