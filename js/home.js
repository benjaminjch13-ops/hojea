// Tarjetas de la pantalla inicial: días juntos, un recuerdo al azar y los consejos de citas de Muu.
import { MUU_PHRASES, muuBreedSVG, muuMascotHTML } from './cow.js';
import { SOURCE_LABELS, pickIdea } from './date-ideas.js';
import { getMeta, setMeta } from './db.js';
import { ensureScans, pageThumbHTML } from './delulu.js';
import { askMuu } from './muu-advisor.js';
import { esc, icon, modal } from './ui.js';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function daysSince(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - start) / 86400000);
}

const longDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
};

// La página de un recuerdo debe tener algo que ver: una foto o elementos.
function allMemories(books) {
  return books.flatMap((book) => book.pages
    .map((page, index) => ({ book, page, index }))
    .filter(({ page }) => page.scan || page.elements?.length));
}

function togetherCard(since) {
  if (!since) {
    return `<div class="card-eyebrow">Juntos desde</div>
      <p class="card-text">Elige el día en que empezó su historia y aquí contaremos cada día.</p>
      <button class="btn primary" data-since>Poner la fecha</button>`;
  }
  const days = daysSince(since);
  return `<div class="card-eyebrow">Juntos desde hace</div>
    <div class="card-number">${days.toLocaleString('es')}</div>
    <div class="card-sub">${days === 1 ? 'día' : 'días'}, desde el ${esc(longDate(since))}</div>
    <button class="link-btn" data-since>Cambiar fecha</button>`;
}

function memoryCard(memory) {
  if (!memory) {
    return `<div class="card-eyebrow">Un recuerdo</div>
      <p class="card-text">Aquí aparecerá una de sus páginas cuando agreguen fotos o decoren una libreta.</p>`;
  }
  const { book, page, index } = memory;
  return `<div class="card-eyebrow">Un recuerdo</div>
    <a class="memory" href="#/libro/${book.id}/hoja/${index}" aria-label="Abrir ${esc(book.title)}, página ${index + 1}">
      <span class="memory-photo" style="aspect-ratio:${book.aspect || 0.72}">${pageThumbHTML(page, book, 96)}</span>
      <span class="memory-caption"><strong>${esc(book.title)}</strong><span>Página ${index + 1}</span></span>
    </a>
    <button class="link-btn" data-memory>Otro recuerdo</button>`;
}

function ideaCard(idea, breed) {
  return `${muuBreedSVG(breed, 'advice-cow')}
    <div class="advice-body">
      <div class="card-eyebrow">Muu les sugiere · ${esc(SOURCE_LABELS[idea.src])}</div>
      <p class="card-idea">${esc(idea.t)}</p>
      <p class="card-text">${esc(idea.tip)}</p>
      <div class="card-actions">
        <button class="btn primary" data-ask-muu>Pregúntale a Muu</button>
        <button class="link-btn" data-idea>Otra idea</button>
        <button class="link-btn" data-idea-book>Crear su libreta</button>
      </div>
    </div>`;
}

const chipGroup = (name, legend, options) => `
  <fieldset class="muu-filter" data-filter="${name}">
    <legend class="field-label">${legend}</legend>
    <div class="chip-row">${options.map(([value, label], i) => `
      <button type="button" class="chip" data-value="${value}" aria-pressed="${i === 0}">${label}</button>`).join('')}</div>
  </fieldset>`;

const REASONS = {
  'sin-ia': 'La IA de Muu todavía no está conectada, así que esta idea es de su lista y no pudo leer su antojo.',
  'sin-conexion': 'No hay conexión, así que esta idea es de la lista de Muu y no pudo leer su antojo.',
  error: 'La IA de Muu no respondió esta vez, así que esta idea es de su lista y no pudo leer su antojo.',
};

function answerHTML(answer, breed) {
  const fromList = answer.source === 'lista';
  return `<div class="muu-answer">
      ${muuBreedSVG(breed, 'advice-cow')}
      <div class="advice-body">
        <h3>${esc(answer.titulo)}</h3>
        ${answer.dice ? `<p>${esc(answer.dice)}</p>` : ''}
        ${answer.pasos.length ? `<ol>${answer.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>` : ''}
        <p class="muu-tip">${esc(answer.consejo)}</p>
      </div>
    </div>
    <p class="muu-note">${fromList ? esc(REASONS[answer.reason]) : 'Sugerida con IA: confirmen horarios, precios y que el lugar siga abierto antes de ir.'}</p>
    <div class="dialog-actions">
      <button type="button" class="btn ghost" data-book>Crear su libreta</button>
      <button type="button" class="btn primary" data-again>Otra idea</button>
    </div>`;
}

export async function homeHTML(books) {
  const pages = books.reduce((sum, b) => sum + b.pages.length, 0);
  const decorated = books.reduce((sum, b) => sum + b.pages.filter((p) => p.elements?.length).length, 0);
  const recent = [...books].sort((a, b) => (b.updated ?? b.createdAt) - (a.updated ?? a.createdAt))[0];
  const stats = [plural(books.length, 'libreta', 'libretas'), plural(pages, 'página', 'páginas')];
  if (decorated) stats.push(plural(decorated, 'decorada', 'decoradas'));
  const breed = await getMeta('muuBreed');

  return `
    <div class="home-deco" aria-hidden="true">${['♥', '✦', '♥', '✦', '♥', '✦', '♥'].map((g, i) => `<span class="deco-${i}">${g}</span>`).join('')}</div>
    <header class="shelf-head">
      <div>
        <p class="home-greeting">${greeting()}</p>
        <h1>Date's with Muu</h1>
        <p class="home-stats">${esc(stats.join(' · '))}</p>
      </div>
      <div class="home-head-end">
        ${muuMascotHTML(breed)}
        <button class="icon-btn" data-theme aria-label="Cambiar a Muu y el fondo" title="Cambiar a Muu y el fondo">${icon('palette')}</button>
      </div>
    </header>
    ${recent ? `<a class="home-continue" href="#/libro/${recent.id}">
      <span>Seguir con <strong>${esc(recent.title)}</strong></span>${icon('right')}
    </a>` : ''}
    <article class="home-muu" data-card="idea"></article>
    <div class="home-cards">
      <article class="home-card" data-card="together"></article>
      <article class="home-card" data-card="memory"></article>
    </div>
    <h2 class="shelf-title">Sus libretas</h2>`;
}

// Muu responde al tocarla: da un brinco, dice algo y suelta corazones.
let lastPhrase = '';
function sayMuu(button) {
  const options = MUU_PHRASES.filter((p) => p !== lastPhrase);
  lastPhrase = options[Math.floor(Math.random() * options.length)];
  button.querySelector('.muu-say').textContent = lastPhrase;
  button.classList.remove('hop', 'talking');
  void button.offsetWidth;
  button.classList.add('hop', 'talking');
  for (let i = 0; i < 5; i++) {
    const heart = document.createElement('i');
    heart.className = 'muu-heart';
    heart.textContent = '♥';
    heart.style.setProperty('--dx', `${(Math.random() - 0.5) * 90}px`);
    heart.style.setProperty('--d', `${i * 70}ms`);
    button.append(heart);
    setTimeout(() => heart.remove(), 1200);
  }
  clearTimeout(button.quietTimer);
  button.quietTimer = setTimeout(() => button.classList.remove('talking'), 2200);
}

// Da vida a las tarjetas. `createBook` crea una libreta con el título indicado.
export async function bindHome(root, books, { createBook }) {
  const slot = (name) => root.querySelector(`[data-card="${name}"]`);
  const memories = allMemories(books);
  let lastMemory = null;
  const seenIds = [];
  const seenTitles = [];
  const nextIdea = () => {
    const chosen = pickIdea({}, seenIds);
    seenIds.push(chosen.id);
    return chosen;
  };
  let idea = nextIdea();
  const breed = () => getMeta('muuBreed');

  const paintTogether = async () => { slot('together').innerHTML = togetherCard(await getMeta('togetherSince')); };
  const paintMemory = async () => {
    const pool = memories.length > 1 ? memories.filter((m) => m !== lastMemory) : memories;
    const memory = pool[Math.floor(Math.random() * pool.length)] ?? null;
    lastMemory = memory;
    if (memory) await ensureScans(memory.book);
    slot('memory').innerHTML = memoryCard(memory);
  };
  const paintIdea = async () => { slot('idea').innerHTML = ideaCard(idea, await breed()); };

  const openAdvisor = async () => {
    const cow = await breed();
    let current = null;
    const title = await modal(`
      <div class="manage-head">
        <h2>Pregúntale a Muu</h2>
        <button class="icon-btn dark" data-close aria-label="Cerrar">${icon('close')}</button>
      </div>
      <form class="muu-form">
        ${chipGroup('lugar', '¿Dónde?', [['', 'Donde sea'], ['casa', 'En casa'], ['ciudad', 'En la ciudad'], ['escapada', 'De escapada']])}
        ${chipGroup('costo', 'Presupuesto', [['', 'Cualquiera'], ['1', 'Gratis o barato'], ['2', 'Normal'], ['3', 'Para consentirse']])}
        <label class="field"><span class="field-label">¿Qué se les antoja? (opcional)</span>
          <textarea class="text-field muu-antojo" maxlength="300" rows="2" placeholder="Algo tranquilo con comida rica, este sábado…"></textarea></label>
        <div class="dialog-actions"><button class="btn primary">Pedir idea</button></div>
      </form>
      <div class="muu-result" aria-live="polite"></div>`, (d, close) => {
      const result = d.querySelector('.muu-result');
      const value = (name) => d.querySelector(`[data-filter="${name}"] [aria-pressed="true"]`).dataset.value || undefined;
      const ask = async () => {
        const submit = d.querySelector('.muu-form .btn.primary');
        submit.disabled = true;
        result.innerHTML = `<p class="muu-thinking">${muuBreedSVG(cow, 'advice-cow')}<span>Muu está rumiando una idea…</span></p>`;
        current = await askMuu({
          lugar: value('lugar'), costo: value('costo') && Number(value('costo')), antojo: d.querySelector('.muu-antojo').value,
        }, seenIds, seenTitles);
        if (current.id) seenIds.push(current.id);
        seenTitles.push(current.titulo);
        submit.disabled = false;
        if (!d.isConnected) return;
        result.innerHTML = answerHTML(current, cow);
        result.scrollIntoView({ block: 'start', behavior: 'smooth' });
      };
      d.querySelector('[data-close]').onclick = () => close();
      d.querySelector('.muu-form').addEventListener('submit', (e) => { e.preventDefault(); ask(); });
      d.addEventListener('click', (e) => {
        const chip = e.target.closest('.muu-filter .chip');
        if (chip) {
          chip.parentElement.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        } else if (e.target.closest('[data-again]')) ask();
        else if (e.target.closest('[data-book]')) close(current?.titulo);
      });
    }, 'dialog-muu');
    if (title) createBook(title);
  };

  const chooseDate = async () => {
    const current = (await getMeta('togetherSince')) ?? '';
    const today = new Date();
    const max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const value = await modal(`
      <h2>¿Desde cuándo están juntos?</h2>
      <form method="dialog" class="since-form">
        <label class="field"><span class="field-label">Fecha</span>
          <input type="date" class="text-field" value="${esc(current)}" max="${max}" required></label>
        <div class="dialog-actions">
          <button type="button" class="btn ghost" data-no>Cancelar</button>
          <button class="btn primary">Guardar</button>
        </div>
      </form>`, (d, close) => {
      d.querySelector('[data-no]').onclick = () => close();
      d.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        close(d.querySelector('input').value);
      });
    });
    if (value) {
      await setMeta('togetherSince', value);
      await paintTogether();
    }
  };

  root.addEventListener('click', (e) => {
    const t = e.target;
    const muu = t.closest('[data-muu]');
    if (muu) sayMuu(muu);
    else if (t.closest('[data-since]')) chooseDate();
    else if (t.closest('[data-memory]')) paintMemory();
    else if (t.closest('[data-ask-muu]')) openAdvisor();
    else if (t.closest('[data-idea-book]')) createBook(idea.t);
    else if (t.closest('[data-idea]')) {
      idea = nextIdea();
      paintIdea();
    }
  });

  await Promise.all([paintIdea(), paintTogether(), paintMemory()]);
}
