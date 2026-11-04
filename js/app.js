// Pantallas y navegación de Hojea.
import * as db from './db.js';
import { Book3D } from './book3d.js';
import { PALETTES, PATTERNS, coverImage } from './covers.js';
import { cropPhoto, openCamera } from './capture.js';
import { seedDemoBook } from './demo.js';
import { buildPdf } from './pdf.js';
import { confirmDialog, esc, icon, modal, toast } from './ui.js';

const app = document.getElementById('app');
const pageCount = (n) => (n === 1 ? '1 página' : `${n} páginas`);
let cleanup = null;
let routeToken = 0;

async function route() {
  const token = ++routeToken;
  cleanup?.();
  cleanup = null;
  const m = location.hash.match(/^#\/libro\/(.+)$/);
  const nextCleanup = m ? await renderBook(m[1], token) : await renderShelf(token);
  if (token === routeToken) cleanup = nextCleanup ?? null;
  else nextCleanup?.();
}

// ---------- Estante ----------
function coverHtml(book, url) {
  const photo = url ? `<img class="cover-photo" src="${url}" alt="">` : '';
  return `<div class="mini-cover" style="background-image:${coverImage(book.palette, book.pattern)};aspect-ratio:${book.aspect || 0.72}">
    ${photo}<div class="cover-label">${esc(book.title)}</div></div>`;
}

async function renderShelf(token) {
  const books = await db.listBooks();
  if (token !== routeToken) return;
  const urls = await Promise.all(books.map((b) => (b.coverPageId ? db.getPageUrl(b.coverPageId) : '')));
  if (token !== routeToken) return;
  app.innerHTML = `
    <section class="view shelf">
      <header class="shelf-head">
        <h1>Hojea</h1>
        <p>Tus cuadernos de papel, en la pantalla.</p>
      </header>
      <div class="shelf-grid">
        ${books.map((b, i) => `
          <a class="shelf-item" href="#/libro/${b.id}">
            ${coverHtml(b, urls[i])}
            <span class="shelf-meta"><strong>${esc(b.title)}</strong><span>${pageCount(b.pages.length)}</span></span>
          </a>`).join('')}
        <button class="shelf-new" data-new>
          <span class="shelf-new-box">${icon('plus')}</span>
          <span class="shelf-meta"><strong>Nuevo cuaderno</strong><span>Empieza a digitalizar</span></span>
        </button>
      </div>
    </section>`;
  app.querySelector('[data-new]').onclick = async () => {
    const book = await newBookDialog();
    if (book) location.hash = `#/libro/${book.id}`;
  };
}

function newBookDialog() {
  const state = { palette: PALETTES[2].id, pattern: 'formas' };
  return modal(`
    <h2>Nuevo cuaderno</h2>
    <form method="dialog" class="new-book">
      <div class="new-preview"></div>
      <div class="new-fields">
        <label class="field">Nombre
          <input name="title" maxlength="60" placeholder="Mi cuaderno" autocomplete="off">
        </label>
        <div class="field">Color
          <div class="swatches">${PALETTES.map((p) =>
            `<button type="button" class="swatch" data-palette="${p.id}" style="background:${p.bg}" aria-label="Color ${p.id}"></button>`).join('')}</div>
        </div>
        <div class="field">Diseño
          <div class="chips">${PATTERNS.map((p) =>
            `<button type="button" class="chip" data-pattern="${p.id}">${p.name}</button>`).join('')}</div>
        </div>
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn ghost" data-no>Cancelar</button>
        <button class="btn primary" data-create>Crear</button>
      </div>
    </form>`, (d, close) => {
    const input = d.querySelector('input');
    const preview = () => {
      d.querySelector('.new-preview').innerHTML = coverHtml({
        ...state, title: input.value.trim() || 'Mi cuaderno', aspect: 0.72,
      });
      d.querySelectorAll('[data-palette]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.palette === state.palette));
      d.querySelectorAll('[data-pattern]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.pattern === state.pattern));
    };
    preview();
    input.addEventListener('input', preview);
    d.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b?.dataset.palette) { state.palette = b.dataset.palette; preview(); }
      if (b?.dataset.pattern) { state.pattern = b.dataset.pattern; preview(); }
    });
    d.querySelector('[data-no]').onclick = () => close();
    d.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const book = {
        id: db.newId(),
        title: input.value.trim() || 'Mi cuaderno',
        ...state,
        aspect: 0.72,
        pages: [],
        createdAt: Date.now(),
      };
      await db.saveBook(book);
      close(book);
    });
  }, 'dialog-wide');
}

// ---------- Cuaderno ----------
async function renderBook(id, token) {
  const book = await db.getBook(id);
  if (token !== routeToken) return;
  if (!book) {
    location.hash = '#/';
    return;
  }
  app.innerHTML = `
    <section class="view book-view">
      <header class="bar">
        <a class="icon-btn" href="#/" aria-label="Volver a tus cuadernos">${icon('back')}</a>
        <div class="title-wrap">
          <input class="title-input" value="${esc(book.title)}" maxlength="60" aria-label="Nombre del cuaderno">
          <div class="sub" data-count></div>
        </div>
        <div class="bar-end">
          <button class="icon-btn" data-act="manage" aria-label="Administrar páginas" title="Administrar páginas">${icon('grid')}</button>
          <button class="icon-btn" data-act="delete" aria-label="Eliminar cuaderno" title="Eliminar cuaderno">${icon('trash')}</button>
        </div>
      </header>
      <div class="stage"></div>
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
          <button class="tool" data-act="export" aria-label="Exportar a PDF" title="Exportar a PDF">${icon('share')}</button>
          <button class="btn primary add-btn" data-act="add">${icon('camera')}<span>Agregar páginas</span></button>
        </div>
      </footer>
    </section>`;

  const view = app.querySelector('.book-view');
  const slider = view.querySelector('input[type=range]');
  const output = view.querySelector('output');
  const widget = new Book3D(view.querySelector('.stage'), {
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
      const page = await db.addPage(result.blob, result.w, result.h);
      if (!book.pages.length) book.aspect = Math.min(1.5, Math.max(0.55, result.w / result.h));
      book.pages.push(page);
      await db.saveBook(book);
      saved++;
    }
    if (saved) {
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
      </div>
      <div class="dialog-actions"><button class="btn ghost" data-c="">Cancelar</button></div>`, (d, close) => {
      d.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => close(b.dataset.c); });
    });
    if (choice === 'files') pick(false);
    if (choice === 'camera') {
      // Sin HTTPS no hay cámara en vivo: se usa la cámara del sistema.
      const shots = navigator.mediaDevices?.getUserMedia && isSecureContext ? await openCamera() : null;
      if (shots === null) pick(true);
      else if (shots.length) addFiles(shots.map((b) => new File([b], 'foto.jpg', { type: 'image/jpeg' })));
    }
  };

  const exportPdf = async () => {
    if (!book.pages.length) { toast('Agrega páginas antes de exportar.'); return; }
    toast('Preparando el PDF…');
    const images = await Promise.all(book.pages.map(async (p) => ({
      bytes: new Uint8Array(await (await db.getPageBlob(p.id)).arrayBuffer()), w: p.w, h: p.h,
    })));
    const file = new File([buildPdf(images)], `${book.title.replace(/[\\/:*?"<>|]/g, '_')}.pdf`, { type: 'application/pdf' });
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: book.title }); } catch { /* cancelado */ }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    toast('PDF descargado');
  };

  const actions = {
    add: addFlow,
    'zoom-in': () => widget.zoomBy(1.15),
    'zoom-out': () => widget.zoomBy(0.87),
    export: exportPdf,
    fan(btn) {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', on);
      widget.setFan(on);
    },
    manage: () => managePages(book, refresh),
    async delete() {
      const ok = await confirmDialog(`¿Eliminar "${book.title}"?`, 'Se borrarán sus páginas de este dispositivo. No se puede deshacer.', 'Eliminar');
      if (ok) {
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
      const urls = await Promise.all(book.pages.map((p) => db.getPageUrl(p.id)));
      grid.innerHTML = book.pages.map((p, i) => `
        <figure class="manage-item">
          <button class="manage-thumb" data-view="${i}" aria-label="Ver página ${i + 1}">
            <img src="${urls[i]}" alt="" style="aspect-ratio:${p.w}/${p.h}">
            ${book.coverPageId === p.id ? '<span class="cover-badge">Portada</span>' : ''}
          </button>
          <figcaption>
            <span>${i + 1}</span>
            <span class="mini-actions">
              <button data-move="${i}:-1" aria-label="Mover página ${i + 1} antes" ${i === 0 ? 'disabled' : ''}>${icon('left')}</button>
              <button data-move="${i}:1" aria-label="Mover página ${i + 1} después" ${i === book.pages.length - 1 ? 'disabled' : ''}>${icon('right')}</button>
              <button data-cover="${i}" aria-label="Usar página ${i + 1} como portada" aria-pressed="${book.coverPageId === p.id}">${icon('star')}</button>
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
      if (b.dataset.view !== undefined) {
        const page = book.pages[+b.dataset.view];
        openLightbox(await db.getPageUrl(page.id));
      } else if (b.dataset.move) {
        const [i, dir] = b.dataset.move.split(':').map(Number);
        const [p] = book.pages.splice(i, 1);
        book.pages.splice(i + dir, 0, p);
        await commit();
      } else if (b.dataset.cover !== undefined) {
        const id = book.pages[+b.dataset.cover].id;
        book.coverPageId = book.coverPageId === id ? undefined : id;
        await commit();
      } else if (b.dataset.del !== undefined) {
        const i = +b.dataset.del;
        const ok = await confirmDialog(`¿Eliminar la página ${i + 1}?`, 'No se puede deshacer.', 'Eliminar');
        if (!ok) return;
        const [p] = book.pages.splice(i, 1);
        if (book.coverPageId === p.id) book.coverPageId = undefined;
        await db.deletePage(p.id);
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
    navigator.storage?.persist?.();
  } catch (err) {
    console.error(err);
    app.innerHTML = '<p class="fatal">No se pudo abrir el almacenamiento de este navegador. Si estás en una ventana privada, abre Hojea en una normal.</p>';
    return;
  }
  addEventListener('hashchange', route);
  await route();
  if ('serviceWorker' in navigator && isSecureContext) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

start();
