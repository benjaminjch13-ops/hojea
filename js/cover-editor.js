// Editor de portada: panel de personalización de Delulu sobre el libro 3D de Hojea.
import { Book3D } from './book3d.js';
import { CHARM_PHOTOS } from './charm-photos.js';
import {
  CHARM_SHAPES, COVER_MODELS, COW_PRESETS, ELASTICS, FINISHES, LEATHERS, MATERIALS, MAX_CHARMS, PATTERN_NAMES, RIBBONS,
  TEXT_EFFECTS, TEXTURES, TITLE_FONTS, charmName, charmSVG, hasNoElastic, newCharm, softClosureFor, softTitleFor, surpriseCover,
} from './cover.js';
import * as db from './db.js';
import { esc, icon, toast } from './ui.js';

const TABS = [['cuero', 'Cuero'], ['cierre', 'Cierre'], ['charms', 'Charms'], ['texto', 'Texto']];

const chips = (path, options, value) => `<div class="chips" role="group">${options.map(([v, label]) =>
  `<button type="button" class="chip" data-set="${path}" data-v="${esc(v)}" aria-pressed="${String(v) === String(value)}">${esc(label)}</button>`).join('')}</div>`;

const swatches = (path, options, value) => `<div class="swatches">${options.map(([label, color]) =>
  `<button type="button" class="swatch" data-set="${path}" data-v="${color}" style="background:${color}" aria-label="${esc(label)}" title="${esc(label)}" aria-pressed="${color.toLowerCase() === (value || '').toLowerCase()}"></button>`).join('')}
  <label class="swatch custom" title="Otro color"><span class="sr">Otro color</span><input type="color" data-input="${path}" value="${esc(value || '#888888')}"></label></div>`;

const field = (label, body) => `<div class="field"><span class="field-label">${esc(label)}</span>${body}</div>`;

const range = (label, path, min, max, value, scale = 1) => `<label class="field"><span class="field-label">${esc(label)}</span>
  <input type="range" min="${min}" max="${max}" value="${Math.round(value * scale)}" data-input="${path}" data-scale="${scale}"></label>`;

function panelCuero(c) {
  const photo = c.photoId
    ? `${chips('photoBlend', [['multiply', 'Teñida en el cuero'], ['normal', 'Impresa'], ['overlay', 'Sutil']], c.photoBlend)}
       ${range('Intensidad', 'photoOp', 20, 100, c.photoOp, 100)}
       <button type="button" class="btn ghost" data-act="remove-photo">Quitar imagen</button>`
    : '';
  const presets = `<div class="chips">${COW_PRESETS.map((p) => `<button type="button" class="chip cow-chip" data-preset="${p.id}">${esc(p.name)}</button>`).join('')}</div>`;
  return field('Libretas de vaquita', presets)
    + field('Modelo', chips('model', COVER_MODELS, c.model))
    + field('Color', swatches('color', LEATHERS, c.color))
    + field('Textura', chips('texture', TEXTURES, c.texture))
    + field('Acabado', chips('finish', FINISHES, c.finish))
    + field('Patrón', chips('pattern', PATTERN_NAMES, c.pattern))
    + field('Imagen de portada', `<label class="btn ghost file-btn">${icon('image')}<span>${c.photoId ? 'Cambiar imagen' : 'Usar una imagen'}</span>
        <input type="file" accept="image/*" data-file="photo" hidden></label>${photo}`);
}

function panelCierre(c) {
  const e = c.elastic, horizontal = e.orient === 'horizontal';
  const ribbon = `<div class="swatches">
      <button type="button" class="swatch none" data-set="ribbon" data-v="none" aria-label="Sin cinta" title="Sin cinta" aria-pressed="${c.ribbon === 'none'}"></button>
      ${RIBBONS.map((col) => `<button type="button" class="swatch" data-set="ribbon" data-v="${col}" style="background:${col}" aria-label="Cinta ${col}" aria-pressed="${c.ribbon === col || (!c.ribbon && col === RIBBONS[0])}"></button>`).join('')}
    </div>`;
  if (hasNoElastic(c.model)) {
    return field(c.model === 'cosida' ? 'Color del corazón del broche' : 'Color del moño', swatches('elastic.color', ELASTICS, e.color))
      + range('Posición', 'elastic.pos', 25, 80, e.pos, 100)
      + field('Cinta marcapáginas', ribbon);
  }
  return field('Color del elástico', swatches('elastic.color', ELASTICS, e.color))
    + field('Material', chips('elastic.style', [['cordon', 'Cordón redondo'], ['plano', 'Cinta plana'], ['trenzado', 'Trenzado']], e.style))
    + field('Orientación', chips('elastic.orient', [['horizontal', 'Horizontal'], ['vertical', 'Vertical']], e.orient))
    + range('Grosor', 'elastic.width', 4, 18, e.width)
    + range('Posición', 'elastic.pos', horizontal ? 25 : 55, horizontal ? 80 : 93, e.pos, 100)
    + field('Cinta marcapáginas', ribbon);
}

function panelCharms(c) {
  const preview = (ch) => `<span class="charm-thumb">${charmSVG(ch)}</span>`;
  const current = c.charms.map((ch, i) => {
    const isPhoto = !!CHARM_PHOTOS[ch.shape];
    return `<div class="charm-row">
      <div class="charm-head">${preview(ch)}<span class="charm-name">${esc(charmName(ch.shape))}</span>
        <button type="button" class="mini-btn" data-charm="up" data-i="${i}" aria-label="Mover ${esc(charmName(ch.shape))} antes" ${i ? '' : 'disabled'}>${icon('left')}</button>
        <button type="button" class="mini-btn" data-charm="down" data-i="${i}" aria-label="Mover ${esc(charmName(ch.shape))} después" ${i < c.charms.length - 1 ? '' : 'disabled'}>${icon('right')}</button>
        <button type="button" class="mini-btn" data-charm="remove" data-i="${i}" aria-label="Quitar ${esc(charmName(ch.shape))}">${icon('trash')}</button>
      </div>
      ${isPhoto ? '' : `<div class="chips">${MATERIALS.map(([v, l]) => `<button type="button" class="chip" data-charm="material" data-i="${i}" data-v="${v}" aria-pressed="${ch.material === v}">${l}</button>`).join('')}</div>`}
      <div class="charm-opts">
        <label class="grow"><span class="sr">Tamaño de ${esc(charmName(ch.shape))}</span><input type="range" min="60" max="160" value="${Math.round((ch.size || 1) * 100)}" data-charm-field="size" data-i="${i}"></label>
        ${!isPhoto && ch.material === 'esmalte' ? `<input type="color" value="${esc(ch.color)}" data-charm-field="color" data-i="${i}" aria-label="Color del esmalte">` : ''}
        ${ch.shape === 'letter' ? `<input type="text" class="letter-input" maxlength="1" value="${esc(ch.letter)}" data-charm-field="letter" data-i="${i}" aria-label="Inicial del charm">` : ''}
      </div></div>`;
  }).join('') || '<p class="hint">Sin charms. Agrega uno abajo.</p>';
  const tile = (shape, name) => `<button type="button" class="charm-tile" data-add-charm="${shape}" title="${esc(name)}" aria-label="Agregar ${esc(name)}">${preview({ shape, material: 'oro', color: '#c4878c', letter: 'A' })}</button>`;
  return field(`En tu libreta (máximo ${MAX_CHARMS})`, current)
    + field('Charms reales de Delulu', `<div class="charm-grid">${Object.entries(CHARM_PHOTOS).map(([id, p]) => tile(id, p.n)).join('')}</div>`)
    + field('Charms dibujados', `<div class="charm-grid">${CHARM_SHAPES.map(([id, n]) => tile(id, n)).join('')}</div>`);
}

function panelTexto(book) {
  const c = book.cover, t = c.title;
  const titleOptions = t.show
    ? field('Letra', chips('title.font', TITLE_FONTS, t.font))
      + field('Efecto', chips('title.fx', TEXT_EFFECTS, t.fx))
      + (t.fx === 'impreso' ? field('Color', `<input type="color" data-input="title.color" value="${esc(t.color)}" aria-label="Color del título">`) : '')
      + field('Estilo', chips('title.italic', [['true', 'Cursiva'], ['false', 'Recta']], String(t.italic)))
      + range('Tamaño', 'title.size', 60, 160, t.size, 100)
      + range('Altura', 'title.y', 5, 80, t.y, 100)
    : '';
  return field('Título en la portada', chips('title.show', [['true', 'Mostrar'], ['false', 'Ocultar']], String(t.show)))
    + titleOptions
    + `<label class="field"><span class="field-label">Iniciales (hasta 3)</span><input type="text" class="text-field" maxlength="3" value="${esc(c.initials.text)}" data-input="initials.text" placeholder="A.B"></label>`
    + (c.initials.text ? field('Efecto de las iniciales', chips('initials.fx', TEXT_EFFECTS, c.initials.fx)) : '');
}

// fresh: la libreta se acaba de crear. Si se sale con la flecha sin cambiar nada, se descarta.
export async function renderCoverEditor(app, book, { drop = false, fresh = false } = {}) {
  let tab = 'cuero';
  app.innerHTML = `
    <section class="view cover-edit">
      <header class="bar">
        <a class="icon-btn" href="${fresh ? '#/' : `#/libro/${book.id}`}" aria-label="${fresh ? 'Volver sin crear la libreta' : 'Volver al cuaderno'}">${icon('back')}</a>
        <div class="title-wrap"><input class="title-input" value="${esc(book.title)}" maxlength="60" aria-label="Nombre del cuaderno"><div class="sub">Personaliza tu libreta</div></div>
        <a class="btn primary" href="#/libro/${book.id}">Listo</a>
      </header>
      <div class="edit-body">
        <div class="edit-stage-wrap">
          <div class="b-stage"></div>
          <div class="edit-stage-tools">
            <button type="button" class="btn ghost-light" data-act="surprise">Sorpréndeme</button>
            <button type="button" class="btn ghost-light" data-act="toggle-open">Ver por dentro</button>
            <a class="btn ghost-light" href="#/libro/${book.id}/paginas/0">Decorar páginas</a>
          </div>
          <p class="edit-hint">Arrastra para ver el lomo y la contratapa</p>
        </div>
        <div class="edit-panel">
          <div class="tabs" role="tablist">${TABS.map(([id, label]) => `<button type="button" role="tab" class="tab" data-tab="${id}">${label}</button>`).join('')}</div>
          <div class="panel-body"></div>
        </div>
      </div>
    </section>`;

  const view = app.querySelector('.cover-edit');
  const body = view.querySelector('.panel-body');
  const openBtn = view.querySelector('[data-act=toggle-open]');
  const widget = new Book3D(view.querySelector('.b-stage'), {
    preview: true,
    onChange: ({ leaf }) => { openBtn.textContent = leaf ? 'Ver cerrada' : 'Ver por dentro'; },
  });
  widget.setBook(book);
  if (drop) widget.dropIn(220);

  let saveTimer;
  const saveNow = () => { clearTimeout(saveTimer); saveTimer = null; return db.saveBook(book); };
  const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); };

  const paintPanel = () => {
    const c = book.cover, scroll = body.scrollTop;
    view.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab));
    const panels = { cuero: () => panelCuero(c), cierre: () => panelCierre(c), charms: () => panelCharms(c), texto: () => panelTexto(book) };
    body.innerHTML = panels[tab]();
    body.scrollTop = scroll;
  };

  const setPath = (path, value) => {
    const keys = path.split('.');
    const last = keys.pop();
    keys.reduce((o, k) => o[k], book.cover)[last] = value;
    if (path === 'elastic.orient') book.cover.elastic.pos = value === 'horizontal' ? 0.45 : 0.84;
    if (path === 'model') {
      const elastic = softClosureFor(value, book.cover.elastic);
      // Una etiqueta o un moño necesitan su cinta atravesada, aunque el elástico fuera vertical.
      book.cover.elastic = hasNoElastic(value) && elastic.orient !== 'horizontal' ? { ...elastic, orient: 'horizontal', pos: 0.62 } : elastic;
      book.cover.title = softTitleFor(value, book.cover.title, book.cover.color);
    }
  };
  let touched = false;
  const changed = (repaint = true) => {
    touched = true;
    widget.refreshCover();
    if (repaint) paintPanel();
    saveSoon();
  };

  const coerce = (v) => (v === 'true' ? true : v === 'false' ? false : v);

  const onClick = (e) => {
    const t = e.target;
    const tabBtn = t.closest('[data-tab]');
    if (tabBtn) { tab = tabBtn.dataset.tab; body.scrollTop = 0; paintPanel(); return; }
    const setter = t.closest('[data-set]');
    if (setter) { setPath(setter.dataset.set, coerce(setter.dataset.v)); changed(); return; }

    const add = t.closest('[data-add-charm]');
    if (add) {
      if (book.cover.charms.length >= MAX_CHARMS) { toast(`Máximo ${MAX_CHARMS} charms por libreta`); return; }
      book.cover.charms.push(newCharm(add.dataset.addCharm, book.title));
      changed();
      return;
    }
    const charmBtn = t.closest('[data-charm]');
    if (charmBtn) {
      const i = +charmBtn.dataset.i, list = book.cover.charms, action = charmBtn.dataset.charm;
      if (action === 'remove') list.splice(i, 1);
      if (action === 'up') [list[i - 1], list[i]] = [list[i], list[i - 1]];
      if (action === 'down') [list[i + 1], list[i]] = [list[i], list[i + 1]];
      if (action === 'material') list[i].material = charmBtn.dataset.v;
      changed();
      return;
    }
    const preset = t.closest('[data-preset]');
    if (preset) {
      book.cover = COW_PRESETS.find((p) => p.id === preset.dataset.preset).apply(book.cover);
      changed();
      return;
    }
    const act = t.closest('[data-act]')?.dataset.act;
    if (act === 'surprise') {
      book.cover = surpriseCover(book.cover);
      changed();
    } else if (act === 'toggle-open') {
      widget.goTo(widget.target ? 0 : 1);
      widget.setOrbit(7, widget.target ? 0 : widget.restRy);
    } else if (act === 'remove-photo') {
      removeOwnPhoto(book);
      book.cover.photoId = null;
      changed();
    }
  };

  const onInput = (e) => {
    const t = e.target;
    if (t.dataset.input) {
      const scale = +t.dataset.scale || 1;
      const value = t.type === 'range' ? +t.value / scale : t.value;
      setPath(t.dataset.input, value);
      changed(false);
    } else if (t.dataset.charmField) {
      const ch = book.cover.charms[+t.dataset.i], key = t.dataset.charmField;
      ch[key] = key === 'size' ? +t.value / 100 : t.value;
      changed(false);
    } else if (t.classList.contains('title-input')) {
      book.title = t.value.trim() || book.title;
      changed(false);
    }
  };

  // Al soltar, el panel se redibuja para reflejar el valor (color elegido, iniciales, etc.).
  const onChange = async (e) => {
    const t = e.target;
    if (t.dataset.file === 'photo' && t.files[0]) {
      const stored = await storeCoverPhoto(t.files[0]);
      if (!stored) { toast('No se pudo abrir esa imagen.'); return; }
      removeOwnPhoto(book);
      Object.assign(book.cover, { photoId: stored.id, photoOwn: true });
      changed();
    } else if (t.type !== 'range' && t.type !== 'text' && (t.dataset.input || t.dataset.charmField)) {
      paintPanel();
    } else if (t.dataset.input === 'initials.text' || t.dataset.charmField === 'letter') {
      paintPanel();
    }
  };

  view.addEventListener('click', onClick);
  view.addEventListener('input', onInput);
  view.addEventListener('change', onChange);
  paintPanel();

  return async () => {
    widget.destroy();
    if (fresh && !touched && location.hash === '#/') await db.deleteBook(book);
    else if (saveTimer) await saveNow();
  };
}

// La imagen de portada se guarda aparte y no cuenta como página del cuaderno.
async function storeCoverPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const s = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.88));
    return await db.addPage(blob, c.width, c.height);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function removeOwnPhoto(book) {
  const c = book.cover;
  if (c.photoId && c.photoOwn) db.deletePage(c.photoId);
  c.photoOwn = false;
}
