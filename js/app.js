// Pantallas y navegación de Date's with Muu.
import * as db from './db.js';
import { Book3D } from './book3d.js';
import { renderCollection } from './collection-view.js';
import { coverDefaults, miniBookHTML } from './cover.js';
import { MUU_BREEDS, muuBreedHead, muuSittingSVG } from './cow.js';
import { renderCoverEditor } from './cover-editor.js';
import { cropPhoto, openCamera } from './capture.js';
import {
  closeEditor, deleteImagesOf, ensureScans, forgetScan, initDelulu, newBlankPage, openEditor, pageThumbHTML, refreshVaquitaStickers,
} from './delulu.js';
import { openRegisterDialog } from './date-dialog.js';
import { currentCostume, dateForPage, earnedCostumes, longDate, setCostume } from './dates.js';
import { seedDemoBook } from './demo.js';
import { openExportDialog } from './export-dialog.js';
import { bindHome, homeHTML } from './home.js';
import { THEMES, loadTheme, saveTheme } from './themes.js';
import { COSTUME_VIEWBOX, muuFigure, vaquitaById } from './vaquitas.js';
import { confirmDialog, esc, icon, modal, toast } from './ui.js';

const app = document.getElementById('app');
const pageCount = (n) => (n === 1 ? '1 página' : `${n} páginas`);
let cleanup = null;
let routeToken = 0;
let justCreated = null;

async function route() {
  const token = ++routeToken;
  // Espera a que se guarde lo que se estaba editando antes de abrir otra pantalla.
  const leaving = cleanup;
  cleanup = null;
  await leaving?.();
  if (token !== routeToken) return;
  const cover = location.hash.match(/^#\/libro\/([^/]+)\/portada$/);
  const pages = location.hash.match(/^#\/libro\/([^/]+)\/paginas\/([^/]+)$/);
  const reading = location.hash.match(/^#\/libro\/([^/]+)(?:\/hoja\/(\d+))?$/);
  let nextCleanup;
  if (location.hash === '#/vaquitas') await renderCollection(app, () => token === routeToken);
  else if (cover) nextCleanup = await openCoverRoute(cover[1], token);
  else if (pages) nextCleanup = await openPagesRoute(pages[1], pages[2], token);
  else if (reading) nextCleanup = await renderBook(reading[1], token, reading[2]);
  else nextCleanup = await renderShelf(token);
  if (token === routeToken) cleanup = nextCleanup ?? null;
  else nextCleanup?.();
}

async function loadBook(id, token) {
  const book = await db.getBook(id);
  if (token !== routeToken) return null;
  if (!book) {
    location.hash = '#/';
    return null;
  }
  await ensureScans(book);
  return token === routeToken ? book : null;
}

async function openCoverRoute(id, token) {
  const book = await loadBook(id, token);
  if (!book) return undefined;
  const drop = justCreated === id;
  justCreated = null;
  return renderCoverEditor(app, book, { drop, fresh: drop });
}

// Abre el editor de páginas. `where` es el número de página, o "nueva" para agregar una en blanco.
async function openPagesRoute(id, where, token) {
  const book = await loadBook(id, token);
  if (!book) return undefined;
  const creating = where === 'nueva' || !book.pages.length;
  if (creating) {
    book.pages.push(newBlankPage());
    await db.saveBook(book);
  }
  const index = creating ? book.pages.length - 1 : Math.min(Math.max(0, +where || 0), book.pages.length - 1);
  // Sin esto, recargar en /paginas/nueva agregaba otra página en blanco cada vez.
  if (where === 'nueva') history.replaceState(null, '', `#/libro/${book.id}/paginas/${index}`);
  const scansBefore = new Set(book.pages.map((p) => p.scan).filter(Boolean));
  app.innerHTML = '';
  await refreshVaquitaStickers();
  if (token !== routeToken) return undefined;
  openEditor(book, index, {
    tab: creating ? 'plantillas' : undefined,
    onBack: () => { location.hash = `#/libro/${book.id}`; },
    onCover: () => { location.hash = `#/libro/${book.id}/portada`; },
    onDate: async (page) => {
      const existing = await dateForPage(page.id);
      if (existing) toast(`Esta página ya es la cita “${existing.title}”, del ${longDate(existing.date)}`);
      else await openRegisterDialog({ book, page });
    },
  });
  return async () => {
    await closeEditor();
    // Las fotos de páginas borradas se eliminan aquí, cuando ya no se puede deshacer.
    const scansNow = new Set(book.pages.map((p) => p.scan).filter(Boolean));
    const removed = [...scansBefore].filter((s) => !scansNow.has(s));
    if (removed.includes(book.cover.photoId) && !book.cover.photoOwn) {
      book.cover.photoId = null; // la portada usaba una foto que ya no existe
      await db.saveBook(book);
    }
    await Promise.all(removed.map(async (s) => {
      forgetScan(s);
      await db.deletePage(s);
    }));
  };
}

// Carga las imágenes de portada que estén dentro de un elemento.
function loadCoverPhotos(root) {
  root.querySelectorAll('img[data-id]').forEach(async (img) => {
    const url = await db.getPageUrl(img.dataset.id);
    if (url) img.src = url;
  });
}

// ---------- Estante ----------
async function renderShelf(token) {
  const books = await db.listBooks();
  if (token !== routeToken) return;
  const head = await homeHTML(books);
  if (token !== routeToken) return;
  app.innerHTML = `
    <section class="view shelf">
      ${head}
      <div class="shelf-grid">
        ${books.map((b, i) => `
          <a class="shelf-item" href="#/libro/${b.id}" style="--i:${i}">
            ${miniBookHTML(b)}
            <span class="shelf-meta"><strong>${esc(b.title)}</strong><span>${pageCount(b.pages.length)}</span></span>
          </a>`).join('')}
        <button class="shelf-new" data-new>
          <span class="shelf-new-box">${icon('plus')}</span>
          <span class="shelf-meta"><strong>Nueva libreta</strong><span>Elige su cuero y sus charms</span></span>
        </button>
      </div>
    </section>`;
  loadCoverPhotos(app);
  app.querySelector('[data-theme]').onclick = themeDialog;
  // Una libreta nueva empieza en el editor, donde cae del cielo: personalizarla es el primer paso.
  const createBook = async (title) => {
    const book = {
      id: db.newId(), title, cover: coverDefaults(), aspect: 0.72, pages: [], createdAt: Date.now(),
    };
    await db.saveBook(book);
    justCreated = book.id;
    location.hash = `#/libro/${book.id}/portada`;
  };
  app.querySelector('[data-new]').onclick = () => createBook('Mi libreta');
  await bindHome(app.querySelector('.shelf'), books, { createBook, refresh: route });
}

async function themeDialog() {
  const current = (await db.getMeta('muuBreed')) ?? MUU_BREEDS[0].id;
  let breed = current;
  let costume = await currentCostume();
  const earned = await earnedCostumes();
  const costumeTile = (id) => `
      <button type="button" class="breed-tile" data-costume="${id ?? ''}" aria-pressed="${(id ?? null) === costume}" title="${id ? esc(vaquitaById(id).name) : 'Sin disfraz'}">
        <svg class="breed-cow" viewBox="${COSTUME_VIEWBOX}" aria-hidden="true" data-costume-figure="${id ?? ''}">${muuFigure(breed, id)}</svg>
        <span>${id ? esc(vaquitaById(id).name) : 'Sin disfraz'}</span>
      </button>`;
  // Actualiza a Muu en el inicio, sin esperar a que se cierre el diálogo.
  const repaint = () => {
    app.querySelectorAll('.advice-cow').forEach((svg) => { svg.innerHTML = muuBreedHead(breed); });
    app.querySelectorAll('.muu-cow').forEach((svg) => { svg.innerHTML = muuFigure(breed, costume); });
    app.querySelector('.muu')?.classList.toggle('has-costume', !!costume);
  };
  return modal(`
    <div class="manage-head">
      <h2>Color de Muu</h2>
      <button class="icon-btn dark" data-close aria-label="Cerrar">${icon('close')}</button>
    </div>
    <div class="breed-grid">${MUU_BREEDS.map((b) => `
      <button type="button" class="breed-tile" data-breed="${b.id}" aria-pressed="${b.id === current}">
        ${muuSittingSVG(b.id, 'breed-cow')}
        <span>${esc(b.name)}</span>
      </button>`).join('')}</div>
    <p class="breed-note">El ícono de la app siempre es Muu rosa.</p>
    <h2 class="theme-title">Disfraz de Muu</h2>
    ${earned.length
    ? `<div class="breed-grid costume-grid">${[null, ...earned].map(costumeTile).join('')}</div>`
    : '<p class="breed-note">Cada vaquita que ganen trae un disfraz para Muu. Registren una cita para estrenar el primero.</p>'}
    <h2 class="theme-title">Fondo de la app</h2>
    <div class="theme-grid">${THEMES.map((t) => `
      <button type="button" class="theme-tile" data-theme-id="${t.id}">
        <span class="theme-chip" style="background:linear-gradient(165deg,${t.bg1},${t.bg2})"><i style="background:${t.accent}"></i></span>
        <span>${esc(t.name)}</span>
      </button>`).join('')}</div>`, (d, close) => {
    d.querySelector('[data-close]').onclick = () => close();
    d.querySelector('.breed-grid').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-breed]');
      if (!b) return;
      await db.setMeta('muuBreed', b.dataset.breed);
      d.querySelectorAll('[data-breed]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      breed = b.dataset.breed;
      d.querySelectorAll('[data-costume-figure]').forEach((svg) => { svg.innerHTML = muuFigure(breed, svg.dataset.costumeFigure || null); });
      repaint();
    });
    d.querySelector('.costume-grid')?.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-costume]');
      if (!b) return;
      costume = b.dataset.costume || null;
      await setCostume(costume);
      d.querySelectorAll('[data-costume]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      repaint();
    });
    d.querySelector('.theme-grid').addEventListener('click', (e) => {
      const b = e.target.closest('[data-theme-id]');
      if (b) saveTheme(b.dataset.themeId);
    });
  });
}

// ---------- Cuaderno ----------
async function renderBook(id, token, startPage) {
  const book = await loadBook(id, token);
  if (!book) return;
  app.innerHTML = `
    <section class="view book-view">
      <header class="bar">
        <a class="icon-btn" href="#/" aria-label="Volver a tus cuadernos">${icon('back')}</a>
        <div class="title-wrap">
          <input class="title-input" value="${esc(book.title)}" maxlength="60" aria-label="Nombre del cuaderno">
          <div class="sub" data-count></div>
        </div>
        <div class="bar-end">
          <a class="icon-btn" href="#/libro/${book.id}/portada" aria-label="Personalizar la libreta" title="Personalizar la libreta">${icon('brush')}</a>
          <button class="icon-btn" data-act="manage" aria-label="Administrar páginas" title="Administrar páginas">${icon('grid')}</button>
          <button class="icon-btn" data-act="delete" aria-label="Eliminar cuaderno" title="Eliminar cuaderno">${icon('trash')}</button>
        </div>
      </header>
      <div class="b-stage"></div>
      <div class="empty-note" hidden>
        <p>Este cuaderno aún no tiene páginas.</p>
        <button class="btn primary" data-act="add">Agregar la primera</button>
      </div>
      <footer class="controls">
        <div class="scrub">
          <input type="range" min="0" value="0" step="1" aria-label="Ir a una página">
          <output aria-live="polite"></output>
        </div>
        <div class="tools">
          <button class="tool" data-act="zoom-out" aria-label="Alejar" title="Alejar">${icon('minus')}</button>
          <button class="tool" data-act="zoom-in" aria-label="Acercar" title="Acercar">${icon('plus')}</button>
          <button class="tool" data-act="fan" aria-label="Ver en abanico" aria-pressed="false" title="Ver en abanico">${icon('fan')}</button>
          <button class="tool" data-act="export" aria-label="Exportar" title="Exportar">${icon('share')}</button>
          <button class="tool" data-act="edit-pages" aria-label="Decorar páginas" title="Decorar páginas">${icon('edit')}</button>
          <button class="btn primary add-btn" data-act="add">${icon('camera')}<span>Agregar páginas</span></button>
        </div>
      </footer>
    </section>`;

  const view = app.querySelector('.book-view');
  const slider = view.querySelector('input[type=range]');
  const output = view.querySelector('output');
  const widget = new Book3D(view.querySelector('.b-stage'), {
    onChange({ leaf, leaves, label }) {
      slider.max = leaves;
      slider.value = leaf;
      output.textContent = label;
    },
  });

  const refresh = () => {
    view.querySelector('[data-count]').textContent = pageCount(book.pages.length);
    view.querySelector('.empty-note').hidden = book.pages.length > 0;
    widget.setBook(book);
  };
  refresh();
  // Al llegar desde un recuerdo, la libreta se abre en esa página.
  if (startPage !== undefined && book.pages[+startPage]) widget.goTo(widget.leafForPage(+startPage));

  slider.addEventListener('input', () => widget.goTo(+slider.value));

  const titleInput = view.querySelector('.title-input');
  titleInput.addEventListener('change', async () => {
    book.title = titleInput.value.trim() || book.title;
    titleInput.value = book.title;
    await db.saveBook(book);
    refresh();
  });
  titleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') titleInput.blur(); });

  const addFiles = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    const firstNew = book.pages.length;
    let saved = 0;
    for (let i = 0; i < list.length; i++) {
      let result;
      try {
        result = await cropPhoto(list[i], i, list.length);
      } catch {
        toast('No se pudo abrir una de las fotos.');
        continue;
      }
      if (result === 'cancel') break;
      if (result === 'skip') continue;
      const page = await db.addScanPage(result.blob, result.w, result.h);
      if (!book.pages.length) book.aspect = Math.min(1.5, Math.max(0.55, result.w / result.h));
      book.pages.push(page);
      await db.saveBook(book);
      saved++;
    }
    if (saved) {
      await ensureScans(book);
      refresh();
      widget.goTo(widget.leafForPage(firstNew));
      toast(saved === 1 ? 'Página agregada' : `${saved} páginas agregadas`);
    }
  };

  const pick = (capture) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) input.capture = 'environment';
    else input.multiple = true;
    input.onchange = () => addFiles(input.files);
    input.click();
  };

  const addFlow = async () => {
    const choice = await modal(`
      <h2>Agregar páginas</h2>
      <div class="add-options">
        <button class="add-option" data-c="camera">${icon('camera')}<span><strong>Tomar fotos</strong><small>Fotografía las páginas de tu cuaderno, una tras otra.</small></span></button>
        <button class="add-option" data-c="files">${icon('image')}<span><strong>Elegir de tus archivos</strong><small>Puedes seleccionar varias fotos a la vez.</small></span></button>
        <button class="add-option" data-c="blank">${icon('edit')}<span><strong>Página en blanco o plantilla</strong><small>Diario, agenda, viajes y más, para escribir y decorar.</small></span></button>
      </div>
      <div class="dialog-actions"><button class="btn ghost" data-c="">Cancelar</button></div>`, (d, close) => {
      d.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => close(b.dataset.c); });
    });
    if (choice === 'files') pick(false);
    if (choice === 'blank') location.hash = `#/libro/${book.id}/paginas/nueva`;
    if (choice === 'camera') {
      // Sin HTTPS no hay cámara en vivo: se usa la cámara del sistema.
      const shots = navigator.mediaDevices?.getUserMedia && isSecureContext ? await openCamera() : null;
      if (shots === null) pick(true);
      else if (shots.length) addFiles(shots.map((b) => new File([b], 'foto.jpg', { type: 'image/jpeg' })));
    }
  };

  const actions = {
    add: addFlow,
    'zoom-in': () => widget.zoomBy(1.15),
    'zoom-out': () => widget.zoomBy(0.87),
    export: () => openExportDialog(book, Math.max(1, +slider.value * 2 - 1)),
    fan(btn) {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', on);
      widget.setFan(on);
    },
    manage: () => managePages(book, refresh),
    'edit-pages': () => {
      const n = book.pages.length;
      const index = Math.min(Math.max(0, +slider.value * 2 - 1), n - 1);
      location.hash = `#/libro/${book.id}/paginas/${n ? index : 'nueva'}`;
    },
    async delete() {
      const ok = await confirmDialog(`¿Eliminar "${book.title}"?`, 'Se borrarán sus páginas de este dispositivo. No se puede deshacer.', 'Eliminar');
      if (ok) {
        const others = (await db.listBooks()).filter((b) => b.id !== book.id);
        deleteImagesOf(book, others);
        await db.deleteBook(book);
        location.hash = '#/';
      }
    },
  };
  const onClick = (e) => {
    const b = e.target.closest('[data-act]');
    if (b) actions[b.dataset.act]?.(b);
  };
  view.addEventListener('click', onClick);

  const onDragOver = (e) => { e.preventDefault(); view.classList.add('dropping'); };
  const onDragLeave = (e) => { if (!e.relatedTarget) view.classList.remove('dropping'); };
  const onDrop = (e) => {
    e.preventDefault();
    view.classList.remove('dropping');
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };
  addEventListener('dragover', onDragOver);
  addEventListener('dragleave', onDragLeave);
  addEventListener('drop', onDrop);

  return () => {
    widget.destroy();
    removeEventListener('dragover', onDragOver);
    removeEventListener('dragleave', onDragLeave);
    removeEventListener('drop', onDrop);
  };
}

// ---------- Administrar páginas ----------
function managePages(book, onChange) {
  return modal(`
    <div class="manage-head">
      <h2>Páginas</h2>
      <button class="icon-btn dark" data-close aria-label="Cerrar">${icon('close')}</button>
    </div>
    <div class="manage-grid"></div>`, (d, close) => {
    const grid = d.querySelector('.manage-grid');
    d.querySelector('[data-close]').onclick = () => close();

    const paint = async () => {
      if (!book.pages.length) {
        grid.innerHTML = '<p class="manage-empty">Aún no hay páginas.</p>';
        return;
      }
      grid.innerHTML = book.pages.map((p, i) => `
        <figure class="manage-item">
          <button class="manage-thumb" data-view="${i}" aria-label="Ver página ${i + 1}" style="aspect-ratio:${book.aspect || 0.72}">
            <span class="manage-mini">${pageThumbHTML(p, book, 140)}</span>
            ${p.scan && book.cover.photoId === p.scan ? '<span class="cover-badge">Portada</span>' : ''}
          </button>
          <figcaption>
            <span>${i + 1}</span>
            <span class="mini-actions">
              <button data-move="${i}:-1" aria-label="Mover página ${i + 1} antes" ${i === 0 ? 'disabled' : ''}>${icon('left')}</button>
              <button data-move="${i}:1" aria-label="Mover página ${i + 1} después" ${i === book.pages.length - 1 ? 'disabled' : ''}>${icon('right')}</button>
              <button data-edit="${i}" aria-label="Decorar página ${i + 1}">${icon('edit')}</button>
              <button data-cover="${i}" aria-label="Usar página ${i + 1} como portada" aria-pressed="${!!p.scan && book.cover.photoId === p.scan}" ${p.scan ? '' : 'disabled'}>${icon('star')}</button>
              <button data-del="${i}" aria-label="Eliminar página ${i + 1}">${icon('trash')}</button>
            </span>
          </figcaption>
        </figure>`).join('');
    };

    const commit = async () => {
      await db.saveBook(book);
      onChange();
      await paint();
    };

    grid.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.edit !== undefined) {
        close();
        location.hash = `#/libro/${book.id}/paginas/${b.dataset.edit}`;
      } else if (b.dataset.view !== undefined) {
        const i = +b.dataset.view, page = book.pages[i];
        // Lo decorado se ve mejor en su editor; una foto sola se amplía.
        if (page.scan && !page.elements.length) openLightbox(await db.getPageUrl(page.scan));
        else {
          close();
          location.hash = `#/libro/${book.id}/paginas/${i}`;
        }
      } else if (b.dataset.move) {
        const [i, dir] = b.dataset.move.split(':').map(Number);
        const [p] = book.pages.splice(i, 1);
        book.pages.splice(i + dir, 0, p);
        await commit();
      } else if (b.dataset.cover !== undefined) {
        const id = book.pages[+b.dataset.cover].scan, c = book.cover;
        if (c.photoId && c.photoOwn) await db.deletePage(c.photoId);
        const removing = c.photoId === id;
        Object.assign(c, removing
          ? { photoId: null, photoOwn: false }
          : { photoId: id, photoOwn: false, photoBlend: 'normal', photoOp: 1 });
        await commit();
      } else if (b.dataset.del !== undefined) {
        const i = +b.dataset.del;
        const ok = await confirmDialog(`¿Eliminar la página ${i + 1}?`, 'No se puede deshacer.', 'Eliminar');
        if (!ok) return;
        const [p] = book.pages.splice(i, 1);
        // Una foto puede estar en varias páginas duplicadas: solo se borra con la última.
        if (p.scan && !book.pages.some((q) => q.scan === p.scan)) {
          if (book.cover.photoId === p.scan) book.cover.photoId = null;
          forgetScan(p.scan);
          await db.deletePage(p.scan);
        }
        await commit();
      }
    });
    paint();
  }, 'dialog-wide');
}

function openLightbox(url) {
  return modal(`<img src="${url}" alt="Página ampliada"><button class="icon-btn lightbox-close" aria-label="Cerrar">${icon('close')}</button>`,
    (d, close) => {
      d.querySelector('button').onclick = () => close();
      d.querySelector('img').onclick = () => close();
    }, 'lightbox');
}

// ---------- Inicio ----------
async function start() {
  try {
    if (!(await db.getMeta('seeded'))) {
      await seedDemoBook();
      await db.setMeta('seeded', true);
    }
    await Promise.all([loadTheme(), initDelulu()]);
    navigator.storage?.persist?.();
  } catch (err) {
    console.error(err);
    app.innerHTML = '<p class="fatal">No se pudo abrir el almacenamiento de este navegador. Si estás en una ventana privada, abre la app en una normal.</p>';
    return;
  }
  // El paso entre pantallas es continuo: el libro y el panel se transforman en vez de saltar.
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  addEventListener('hashchange', () => {
    if (!document.startViewTransition || calm.matches || document.hidden) { route(); return; }
    // La animación nunca puede impedir el cambio: si no arranca a tiempo, la pantalla cambia sin ella.
    let started = false;
    const go = () => {
      if (started) return undefined;
      started = true;
      return route();
    };
    const transition = document.startViewTransition(go);
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
    setTimeout(() => {
      if (started) return;
      transition.skipTransition();
      go();
    }, 400);
  });
  await route();
  if ('serviceWorker' in navigator && isSecureContext) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

start();
