// Pantallas y navegación de Hojea.
import * as db from './db.js';
import { Book3D } from './book3d.js';
import { coverDefaults, miniBookHTML } from './cover.js';
import { renderCoverEditor } from './cover-editor.js';
import { cropPhoto, openCamera } from './capture.js';
import { seedDemoBook } from './demo.js';
import { buildPdf } from './pdf.js';
import { THEMES, loadTheme, saveTheme } from './themes.js';
import { confirmDialog, esc, icon, modal, toast } from './ui.js';

const app = document.getElementById('app');
const pageCount = (n) => (n === 1 ? '1 página' : `${n} páginas`);
let cleanup = null;
let routeToken = 0;

async function route() {
  const token = ++routeToken;
  cleanup?.();
  cleanup = null;
  const editing = location.hash.match(/^#\/libro\/([^/]+)\/portada$/);
  const reading = location.hash.match(/^#\/libro\/([^/]+)$/);
  let nextCleanup;
  if (editing) nextCleanup = await openEditor(editing[1], token);
  else if (reading) nextCleanup = await renderBook(reading[1], token);
  else nextCleanup = await renderShelf(token);
  if (token === routeToken) cleanup = nextCleanup ?? null;
  else nextCleanup?.();
}

async function openEditor(id, token) {
  const book = await db.getBook(id);
  if (token !== routeToken) return undefined;
  if (!book) {
    location.hash = '#/';
    return undefined;
  }
  return renderCoverEditor(app, book);
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
  app.innerHTML = `
    <section class="view shelf">
      <header class="shelf-head">
        <div>
          <h1>Hojea</h1>
          <p>Tus cuadernos de papel, en libretas hechas a tu gusto.</p>
        </div>
        <button class="icon-btn" data-theme aria-label="Cambiar el fondo" title="Cambiar el fondo">${icon('palette')}</button>
      </header>
      <div class="shelf-grid">
        ${books.map((b) => `
          <a class="shelf-item" href="#/libro/${b.id}">
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
  // Una libreta nueva empieza en el editor: personalizarla es el primer paso.
  app.querySelector('[data-new]').onclick = async () => {
    const book = {
      id: db.newId(), title: 'Mi libreta', cover: coverDefaults(), aspect: 0.72, pages: [], createdAt: Date.now(),
    };
    await db.saveBook(book);
    location.hash = `#/libro/${book.id}/portada`;
  };
}

function themeDialog() {
  return modal(`
    <div class="manage-head">
      <h2>Fondo de la app</h2>
      <button class="icon-btn dark" data-close aria-label="Cerrar">${icon('close')}</button>
    </div>
    <div class="theme-grid">${THEMES.map((t) => `
      <button type="button" class="theme-tile" data-theme-id="${t.id}">
        <span class="theme-chip" style="background:linear-gradient(165deg,${t.bg1},${t.bg2})"><i style="background:${t.accent}"></i></span>
        <span>${esc(t.name)}</span>
      </button>`).join('')}</div>`, (d, close) => {
    d.querySelector('[data-close]').onclick = () => close();
    d.querySelector('.theme-grid').addEventListener('click', (e) => {
      const b = e.target.closest('[data-theme-id]');
      if (b) saveTheme(b.dataset.themeId);
    });
  });
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
          <a class="icon-btn" href="#/libro/${book.id}/portada" aria-label="Personalizar la libreta" title="Personalizar la libreta">${icon('brush')}</a>
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
            ${book.cover.photoId === p.id ? '<span class="cover-badge">Portada</span>' : ''}
          </button>
          <figcaption>
            <span>${i + 1}</span>
            <span class="mini-actions">
              <button data-move="${i}:-1" aria-label="Mover página ${i + 1} antes" ${i === 0 ? 'disabled' : ''}>${icon('left')}</button>
              <button data-move="${i}:1" aria-label="Mover página ${i + 1} después" ${i === book.pages.length - 1 ? 'disabled' : ''}>${icon('right')}</button>
              <button data-cover="${i}" aria-label="Usar página ${i + 1} como portada" aria-pressed="${book.cover.photoId === p.id}">${icon('star')}</button>
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
        const id = book.pages[+b.dataset.cover].id, c = book.cover;
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
        if (book.cover.photoId === p.id) book.cover.photoId = null;
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
    await loadTheme();
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
