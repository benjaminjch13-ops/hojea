// Tarjetas de la pantalla inicial: días juntos, un recuerdo al azar e ideas para la próxima cita.
import { MUU_PHRASES, muuMascotHTML } from './cow.js';
import { getMeta, setMeta } from './db.js';
import { ensureScans, pageThumbHTML } from './delulu.js';
import { esc, icon, modal } from './ui.js';

const DATE_IDEAS = [
  'Visitar una granja y conocer vaquitas peludas',
  'Ver un documental de vacas escocesas con chocolate caliente',
  'Pintar vaquitas en una taza y estrenarla con leche y galletas',
  'Picnic al atardecer con su comida favorita',
  'Cocinar juntos una receta que nunca han probado',
  'Noche de películas con fuerte de cobijas',
  'Ir a ver las estrellas lejos de la ciudad',
  'Desayuno sorpresa en un lugar nuevo',
  'Pintar un retrato el uno del otro',
  'Caminata hasta un mirador para ver el amanecer',
  'Visitar un museo y elegir su obra favorita',
  'Tarde de juegos de mesa con apuesta de besos',
  'Recorrer un mercado y comprar algo para el otro',
  'Escribirse una carta y abrirla en un año',
  'Tour de cafeterías: probar tres en un día',
  'Noche de karaoke en casa',
  'Armar juntos una playlist de su historia',
  'Volver al lugar de su primera cita',
  'Hacer un rompecabezas con una copa de vino',
  'Clase de baile en la sala, con tutorial incluido',
  'Pasear sin rumbo y tomar una foto en cada esquina',
  'Hornear galletas y decorarlas con dibujos del otro',
  'Ir a una librería y regalarse un libro',
  'Sesión de fotos de ustedes en su lugar favorito',
  'Maratón de la serie que el otro ama',
  'Cena a la luz de las velas en casa',
  'Plantar algo juntos y cuidarlo',
];

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
    <a class="memory" href="#/libro/${book.id}/paginas/${index}" aria-label="Abrir ${esc(book.title)}, página ${index + 1}">
      <span class="memory-photo" style="aspect-ratio:${book.aspect || 0.72}">${pageThumbHTML(page, book, 96)}</span>
      <span class="memory-caption"><strong>${esc(book.title)}</strong><span>Página ${index + 1}</span></span>
    </a>
    <button class="link-btn" data-memory>Otro recuerdo</button>`;
}

function ideaCard(idea) {
  return `<div class="card-eyebrow">Idea para la próxima cita</div>
    <p class="card-idea">${esc(idea)}</p>
    <div class="card-actions">
      <button class="btn primary" data-idea-book>Crear su libreta</button>
      <button class="link-btn" data-idea>Otra idea</button>
    </div>`;
}

export async function homeHTML(books) {
  const pages = books.reduce((sum, b) => sum + b.pages.length, 0);
  const decorated = books.reduce((sum, b) => sum + b.pages.filter((p) => p.elements?.length).length, 0);
  const recent = [...books].sort((a, b) => (b.updated ?? b.createdAt) - (a.updated ?? a.createdAt))[0];
  const stats = [plural(books.length, 'libreta', 'libretas'), plural(pages, 'página', 'páginas')];
  if (decorated) stats.push(plural(decorated, 'decorada', 'decoradas'));

  return `
    <div class="home-deco" aria-hidden="true">${['♥', '✦', '♥', '✦', '♥', '✦', '♥'].map((g, i) => `<span class="deco-${i}">${g}</span>`).join('')}</div>
    <header class="shelf-head">
      <div>
        <p class="home-greeting">${greeting()}</p>
        <h1>Date's with Muu</h1>
        <p class="home-stats">${esc(stats.join(' · '))}</p>
      </div>
      <div class="home-head-end">
        ${muuMascotHTML()}
        <button class="icon-btn" data-theme aria-label="Cambiar el fondo" title="Cambiar el fondo">${icon('palette')}</button>
      </div>
    </header>
    ${recent ? `<a class="home-continue" href="#/libro/${recent.id}">
      <span>Seguir con <strong>${esc(recent.title)}</strong></span>${icon('right')}
    </a>` : ''}
    <div class="home-cards">
      <article class="home-card" data-card="together"></article>
      <article class="home-card" data-card="memory"></article>
      <article class="home-card" data-card="idea"></article>
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
  let idea = DATE_IDEAS[Math.floor(Math.random() * DATE_IDEAS.length)];

  const paintTogether = async () => { slot('together').innerHTML = togetherCard(await getMeta('togetherSince')); };
  const paintMemory = async () => {
    const pool = memories.length > 1 ? memories.filter((m) => m !== lastMemory) : memories;
    const memory = pool[Math.floor(Math.random() * pool.length)] ?? null;
    lastMemory = memory;
    if (memory) await ensureScans(memory.book);
    slot('memory').innerHTML = memoryCard(memory);
  };
  const paintIdea = () => { slot('idea').innerHTML = ideaCard(idea); };

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
    else if (t.closest('[data-idea-book]')) createBook(idea);
    else if (t.closest('[data-idea]')) {
      const others = DATE_IDEAS.filter((x) => x !== idea);
      idea = others[Math.floor(Math.random() * others.length)];
      paintIdea();
    }
  });

  paintIdea();
  await Promise.all([paintTogether(), paintMemory()]);
}
