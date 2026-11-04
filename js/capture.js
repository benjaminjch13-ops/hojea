// Cámara en vivo y pantalla de recorte.
import { detectCorners, warp, applyFilter, outputSize } from './imaging.js';
import { icon, esc } from './ui.js';

const MAX_SOURCE = 2400;
const CSS_FILTERS = {
  original: 'none',
  realce: 'contrast(1.15) brightness(1.08) saturate(1.1)',
  bn: 'grayscale(1) contrast(1.3) brightness(1.08)',
};

async function loadToCanvas(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const s = Math.min(1, MAX_SOURCE / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function guessCorners(canvas) {
  const s = 220 / Math.max(canvas.width, canvas.height);
  const small = document.createElement('canvas');
  small.width = Math.max(2, Math.round(canvas.width * s));
  small.height = Math.max(2, Math.round(canvas.height * s));
  const ctx = small.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, small.width, small.height);
  const found = detectCorners(ctx.getImageData(0, 0, small.width, small.height));
  const q = found ?? [[0.06, 0.06], [0.94, 0.06], [0.94, 0.94], [0.06, 0.94]];
  return q.map(([x, y]) => [x * canvas.width, y * canvas.height]);
}

function renderResult(source, corners, filter) {
  const { w, h } = outputSize(corners);
  const src = source.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, source.width, source.height);
  const result = applyFilter(warp(src, corners, w, h), filter);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').putImageData(new ImageData(result.data, w, h), 0, 0);
  return new Promise((resolve) => c.toBlob((blob) => resolve({ blob, w, h }), 'image/jpeg', 0.88));
}

// Devuelve {blob,w,h}, 'skip' si se omite la foto o 'cancel' si se abandona todo.
export async function cropPhoto(file, index, total) {
  let source = await loadToCanvas(file);
  let corners = guessCorners(source);
  let filter = 'realce';

  const root = document.createElement('div');
  root.className = 'fullscreen crop';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Recortar foto');
  root.innerHTML = `
    <header class="bar">
      <button class="icon-btn" data-act="cancel" aria-label="Cancelar">${icon('close')}</button>
      <div class="title-wrap"><div class="crop-title">Ajusta las esquinas</div>
      <div class="sub">Foto ${index + 1} de ${total}</div></div>
      <button class="icon-btn" data-act="rotate" aria-label="Rotar">${icon('rotate')}</button>
    </header>
    <div class="crop-stage"><canvas class="crop-img"></canvas><canvas class="crop-ui"></canvas></div>
    <footer class="crop-foot">
      <div class="chips" role="group" aria-label="Filtro">
        ${[['original', 'Original'], ['realce', 'Realce'], ['bn', 'Blanco y negro']].map(([id, name]) =>
          `<button class="chip" data-filter="${id}" aria-pressed="${id === filter}">${esc(name)}</button>`).join('')}
      </div>
      <div class="crop-actions">
        ${total > 1 ? '<button class="btn ghost" data-act="skip">Omitir</button>' : ''}
        <button class="btn primary" data-act="ok">Guardar página</button>
      </div>
    </footer>`;
  document.body.append(root);

  const stage = root.querySelector('.crop-stage');
  const imgC = root.querySelector('.crop-img');
  const uiC = root.querySelector('.crop-ui');
  const ui = uiC.getContext('2d');
  let view = { s: 1, x: 0, y: 0, dpr: 1 };
  let active = -1;

  const toScreen = ([x, y]) => [view.x + x * view.s, view.y + y * view.s];

  function layout() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    const pad = 26;
    const s = Math.min((r.width - pad * 2) / source.width, (r.height - pad * 2) / source.height);
    view = { s, x: (r.width - source.width * s) / 2, y: (r.height - source.height * s) / 2, dpr };
    for (const c of [imgC, uiC]) {
      c.width = r.width * dpr; c.height = r.height * dpr;
      c.style.width = `${r.width}px`; c.style.height = `${r.height}px`;
    }
    const ctx = imgC.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, view.x, view.y, source.width * s, source.height * s);
    imgC.style.filter = CSS_FILTERS[filter];
    draw();
  }

  function draw() {
    const { dpr } = view;
    ui.setTransform(dpr, 0, 0, dpr, 0, 0);
    ui.clearRect(0, 0, uiC.width, uiC.height);
    const pts = corners.map(toScreen);

    // Oscurece lo que queda fuera del recorte.
    ui.beginPath();
    ui.rect(0, 0, uiC.width / dpr, uiC.height / dpr);
    pts.forEach(([x, y], i) => (i ? ui.lineTo(x, y) : ui.moveTo(x, y)));
    ui.closePath();
    ui.fillStyle = 'rgba(14,14,40,.58)';
    ui.fill('evenodd');

    ui.beginPath();
    pts.forEach(([x, y], i) => (i ? ui.lineTo(x, y) : ui.moveTo(x, y)));
    ui.closePath();
    ui.strokeStyle = '#ffd23f';
    ui.lineWidth = 2;
    ui.stroke();

    pts.forEach(([x, y], i) => {
      ui.beginPath();
      ui.arc(x, y, i === active ? 13 : 11, 0, Math.PI * 2);
      ui.fillStyle = i === active ? '#ffd23f' : 'rgba(255,255,255,.95)';
      ui.fill();
      ui.strokeStyle = '#2a2b78';
      ui.lineWidth = 2;
      ui.stroke();
    });

    // Lupa para colocar la esquina con precisión, incluso bajo el dedo.
    if (active >= 0) {
      const [px] = pts[active];
      const r = 56, zoom = 2.5;
      const lx = px < stage.clientWidth / 2 ? stage.clientWidth - r - 14 : r + 14;
      const ly = r + 14;
      ui.save();
      ui.beginPath();
      ui.arc(lx, ly, r, 0, Math.PI * 2);
      ui.clip();
      const [sx, sy] = corners[active];
      const span = (r * 2) / (view.s * zoom);
      ui.fillStyle = '#16163a';
      ui.fillRect(lx - r, ly - r, r * 2, r * 2);
      ui.drawImage(source, sx - span / 2, sy - span / 2, span, span, lx - r, ly - r, r * 2, r * 2);
      ui.restore();
      ui.beginPath();
      ui.arc(lx, ly, r, 0, Math.PI * 2);
      ui.moveTo(lx - 10, ly); ui.lineTo(lx + 10, ly);
      ui.moveTo(lx, ly - 10); ui.lineTo(lx, ly + 10);
      ui.strokeStyle = '#ffd23f';
      ui.lineWidth = 2;
      ui.stroke();
    }
  }

  uiC.addEventListener('pointerdown', (e) => {
    const r = uiC.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = -1, bestD = 44;
    corners.map(toScreen).forEach(([x, y], i) => {
      const d = Math.hypot(x - mx, y - my);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0) return;
    active = best;
    uiC.setPointerCapture(e.pointerId);
    draw();
  });
  uiC.addEventListener('pointermove', (e) => {
    if (active < 0) return;
    const r = uiC.getBoundingClientRect();
    corners[active] = [
      Math.min(source.width, Math.max(0, (e.clientX - r.left - view.x) / view.s)),
      Math.min(source.height, Math.max(0, (e.clientY - r.top - view.y) / view.s)),
    ];
    draw();
  });
  const release = () => { active = -1; draw(); };
  uiC.addEventListener('pointerup', release);
  uiC.addEventListener('pointercancel', release);

  const ro = new ResizeObserver(layout);
  ro.observe(stage);

  return new Promise((resolve) => {
    const finish = (v) => { ro.disconnect(); root.remove(); resolve(v); };
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.filter) {
        filter = b.dataset.filter;
        root.querySelectorAll('[data-filter]').forEach((c) => c.setAttribute('aria-pressed', c === b));
        imgC.style.filter = CSS_FILTERS[filter];
        return;
      }
      if (b.dataset.act === 'rotate') {
        const r = document.createElement('canvas');
        r.width = source.height; r.height = source.width;
        const ctx = r.getContext('2d');
        ctx.translate(r.width, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(source, 0, 0);
        const h = source.height;
        // Las esquinas giran con la foto y se reordenan para seguir empezando arriba a la izquierda.
        const turned = corners.map(([x, y]) => [h - y, x]);
        corners = [turned[3], turned[0], turned[1], turned[2]];
        source = r;
        layout();
      } else if (b.dataset.act === 'cancel') finish('cancel');
      else if (b.dataset.act === 'skip') finish('skip');
      else if (b.dataset.act === 'ok') {
        b.disabled = true;
        b.textContent = 'Guardando…';
        // Cede un cuadro para que se vea el estado antes del trabajo pesado.
        await new Promise((r) => setTimeout(r, 30));
        finish(await renderResult(source, corners, filter));
      }
    });
  });
}

// Visor de cámara: permite tomar varias fotos seguidas. Devuelve la lista de Blobs o null si falla.
export async function openCamera() {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 2560 }, height: { ideal: 1920 } },
      audio: false,
    });
  } catch {
    return null;
  }
  const shots = [];
  const root = document.createElement('div');
  root.className = 'fullscreen camera';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Cámara');
  root.innerHTML = `
    <video playsinline muted autoplay></video>
    <div class="cam-guide"></div>
    <button class="icon-btn cam-close" aria-label="Cerrar cámara">${icon('close')}</button>
    <div class="cam-bar">
      <span class="cam-count" aria-live="polite">Encuadra la página</span>
      <button class="shutter" aria-label="Tomar foto"></button>
      <button class="btn primary cam-done" disabled>Listo</button>
    </div>`;
  document.body.append(root);
  const video = root.querySelector('video');
  video.srcObject = stream;

  return new Promise((resolve) => {
    const finish = (v) => {
      stream.getTracks().forEach((t) => t.stop());
      root.remove();
      resolve(v);
    };
    root.querySelector('.cam-close').onclick = () => finish([]);
    root.querySelector('.cam-done').onclick = () => finish(shots);
    root.querySelector('.shutter').onclick = () => {
      if (!video.videoWidth) return;
      const c = document.createElement('canvas');
      c.width = video.videoWidth; c.height = video.videoHeight;
      c.getContext('2d').drawImage(video, 0, 0);
      c.toBlob((blob) => {
        shots.push(blob);
        root.querySelector('.cam-count').textContent = `${shots.length} ${shots.length === 1 ? 'foto' : 'fotos'}`;
        root.querySelector('.cam-done').disabled = false;
        root.classList.remove('flash');
        void root.offsetWidth;
        root.classList.add('flash');
      }, 'image/jpeg', 0.95);
    };
  });
}
