// Libro 3D con CSS. Todo se deriva de un solo número: `pos`, cuántas hojas se han pasado.
import { coverImage, coverColor } from './covers.js';
import { getPageUrl } from './db.js';
import { esc } from './ui.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const REST_RX = 7;
const IMAGE_WINDOW = 4;

export class Book3D {
  constructor(stage, { onChange } = {}) {
    this.stage = stage;
    this.onChange = onChange;
    this.root = document.createElement('div');
    this.root.className = 'book';
    stage.append(this.root);

    this.pos = 0; this.target = 0;
    this.fan = 0; this.fanMode = false;
    this.rx = REST_RX; this.ry = -10; this.rxT = REST_RX; this.ryT = -10;
    this.zoom = 1; this.zoomT = 1;
    this.vel = 0;
    this.drag = null;
    this.raf = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.handlers = {
      pointerdown: (e) => this.onDown(e),
      pointermove: (e) => this.onMove(e),
      pointerup: (e) => this.onUp(e),
      pointercancel: (e) => this.onUp(e),
      pointerleave: () => { if (!this.drag) this.setOrbit(REST_RX, this.pos === 0 ? -10 : 0); },
      wheel: (e) => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.06 : 0.94); },
    };
    for (const [k, fn] of Object.entries(this.handlers)) {
      stage.addEventListener(k, fn, k === 'wheel' ? { passive: false } : undefined);
    }
    this.onKey = (e) => {
      if (e.target.matches?.('input:not([type=range]), textarea') || document.querySelector('dialog[open], .fullscreen')) return;
      if (e.key === 'ArrowRight') this.next();
      else if (e.key === 'ArrowLeft') this.prev();
    };
    addEventListener('keydown', this.onKey);
    this.resizeObs = new ResizeObserver(() => this.layout());
    this.resizeObs.observe(stage);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = -1;
    this.resizeObs.disconnect();
    removeEventListener('keydown', this.onKey);
    for (const [k, fn] of Object.entries(this.handlers)) this.stage.removeEventListener(k, fn);
    this.root.remove();
  }

  // Lados en orden: portada, páginas, (lado en blanco si hace falta), contraportada.
  setBook(book) {
    this.book = book;
    const sides = [{ type: 'cover' }, ...book.pages.map((page, i) => ({ type: 'page', page, num: i + 1 }))];
    if (sides.length % 2 === 0) sides.push({ type: 'blank' });
    sides.push({ type: 'back' });
    this.sides = sides;
    this.n = sides.length / 2;
    this.thick = Math.min(0.9, 24 / this.n);

    const color = coverColor(book.palette);
    this.root.innerHTML = `
      <div class="book-floor"></div>
      <div class="edge edge-r"></div><div class="edge edge-l"></div>
      <div class="edge-b edge-br"></div><div class="edge-b edge-bl"></div>
      <div class="spine" style="background:${color}"></div>`;
    this.floor = this.root.querySelector('.book-floor');
    this.edges = {
      r: this.root.querySelector('.edge-r'), l: this.root.querySelector('.edge-l'),
      br: this.root.querySelector('.edge-br'), bl: this.root.querySelector('.edge-bl'),
    };
    this.spine = this.root.querySelector('.spine');

    this.leaves = [];
    for (let i = 0; i < this.n; i++) {
      const el = document.createElement('div');
      el.className = 'leaf';
      el.innerHTML = this.faceHtml(sides[i * 2], 'front') + this.faceHtml(sides[i * 2 + 1], 'back');
      this.root.append(el);
      this.leaves.push({ el, shades: el.querySelectorAll('.shade'), imgs: el.querySelectorAll('img[data-id]'), last: '' });
    }
    this.pos = clamp(this.pos, 0, this.n);
    this.target = clamp(Math.round(this.target), 0, this.n);
    this.lastInt = null;
    this.layout();
    this.wake();
    this.emit();
  }

  faceHtml(side, cls) {
    const shade = '<div class="shade"></div>';
    if (side.type === 'cover' || side.type === 'back') {
      const b = this.book;
      const cover = b.pages.find((p) => p.id === b.coverPageId);
      const bg = `background-image:${coverImage(b.palette, side.type === 'back' ? 'liso' : b.pattern)}`;
      const photo = side.type === 'cover' && cover ? `<img class="cover-photo" data-id="${cover.id}" alt="" draggable="false">` : '';
      const label = side.type === 'cover'
        ? `<div class="cover-label">${esc(b.title)}</div>`
        : '<div class="back-mark">Hojea</div>';
      return `<div class="face ${cls} cover-face" style="${bg}">${photo}${label}${shade}</div>`;
    }
    const inner = side.type === 'page'
      ? `<img data-id="${side.page.id}" alt="Página ${side.num}" draggable="false">`
      : '';
    return `<div class="face ${cls} paper">${inner}<div class="gutter"></div>${shade}</div>`;
  }

  layout() {
    if (!this.book) return;
    const { width, height } = this.stage.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = this.book.aspect || 0.72;
    let h = height * 0.84;
    let w = h * aspect;
    const maxW = width * 0.46;
    if (w > maxW) { w = maxW; h = w / aspect; }
    this.w = w; this.h = h;
    this.root.style.setProperty('--w', `${w}px`);
    this.root.style.setProperty('--h', `${h}px`);
    this.render(true);
  }

  // ---- Navegación ----
  goTo(leaf, instant = false) {
    this.target = clamp(leaf, 0, this.n);
    if (instant) this.pos = this.target;
    this.wake();
  }
  next() { this.goTo(Math.round(this.target) + 1); }
  prev() { this.goTo(Math.round(this.target) - 1); }
  zoomBy(f) { this.zoomT = clamp(this.zoomT * f, 0.65, 1.6); this.wake(); }
  setOrbit(rx, ry) { this.rxT = rx; this.ryT = ry; this.wake(); }

  // Hoja en la que hay que abrir el libro para ver una página.
  leafForPage(index) {
    const side = index + 1;
    return side % 2 ? (side + 1) / 2 : side / 2;
  }

  setFan(on) {
    this.fanMode = on;
    if (on && (this.target === 0 || this.target === this.n)) this.target = Math.round(this.n / 2);
    this.wake();
  }

  // ---- Punteros ----
  onDown(e) {
    if (e.button) return;
    const onBook = e.target.closest?.('.leaf');
    this.drag = {
      id: e.pointerId, mode: onBook ? 'flip' : 'orbit',
      x: e.clientX, y: e.clientY, startPos: this.pos, rx: this.rxT, ry: this.ryT,
      lastX: e.clientX, lastT: e.timeStamp, moved: false,
    };
    this.vel = 0;
    this.stage.setPointerCapture(e.pointerId);
    this.stage.classList.add('dragging');
  }

  onMove(e) {
    const d = this.drag;
    if (!d) {
      // Inclinación suave siguiendo el mouse.
      if (e.pointerType === 'mouse' && !this.reduced) {
        const r = this.stage.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        this.setOrbit(REST_RX - ny * 7, nx * 12 + (this.pos < 0.5 ? -10 : 0));
      }
      return;
    }
    if (e.pointerId !== d.id) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) > 6) d.moved = true;
    if (!d.moved) return;
    if (d.mode === 'flip') {
      const dt = Math.max(16, e.timeStamp - d.lastT);
      const inst = -(e.clientX - d.lastX) / (this.w * 1.15) / (dt / 1000);
      this.vel = lerp(this.vel, inst, 0.35);
      d.lastX = e.clientX; d.lastT = e.timeStamp;
      this.pos = this.target = clamp(d.startPos - dx / (this.w * 1.15), 0, this.n);
    } else {
      this.rxT = clamp(d.rx - dy * 0.3, -35, 45);
      this.ryT = clamp(d.ry + dx * 0.4, -60, 60);
    }
    this.wake();
  }

  onUp(e) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    this.stage.classList.remove('dragging');
    if (d.mode === 'flip') {
      if (d.moved) {
        // El impulso de un gesto rápido suma como máximo una hoja y media.
        const momentum = clamp(this.vel * 0.22, -1.5, 1.5);
        this.target = clamp(Math.round(this.pos + momentum), 0, this.n);
      } else if (this.pos < 0.5) this.next();
      else if (this.pos > this.n - 0.5) this.prev();
      else {
        const r = this.stage.getBoundingClientRect();
        if (e.clientX > r.left + r.width / 2) this.next(); else this.prev();
      }
    } else {
      this.setOrbit(REST_RX, this.target === 0 ? -10 : 0);
    }
    this.vel = 0;
    this.wake();
  }

  // ---- Animación ----
  wake() {
    if (this.raf || this.raf === -1) return;
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame((t) => this.tick(t));
  }

  tick(now) {
    if (this.raf === -1) return;
    this.raf = 0;
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    const ease = (rate) => 1 - Math.exp(-dt * (this.reduced ? 40 : rate));

    if (!this.drag || this.drag.mode !== 'flip') this.pos += (this.target - this.pos) * ease(7.5);
    const dragging = this.drag?.mode === 'flip' && this.drag.moved;
    const fanT = this.reduced ? 0
      : this.fanMode ? 1
      : dragging ? clamp(Math.abs(this.vel) * 0.45, 0, 1)
      : Math.abs(this.target - this.pos) > 1.2 ? 0.6 : 0;
    this.fan += (fanT - this.fan) * ease(6);
    this.rx += (this.rxT - this.rx) * ease(8);
    this.ry += (this.ryT - this.ry) * ease(8);
    this.zoom += (this.zoomT - this.zoom) * ease(10);

    const settled = !this.drag
      && Math.abs(this.target - this.pos) < 0.0015
      && Math.abs(fanT - this.fan) < 0.002
      && Math.abs(this.rxT - this.rx) < 0.02
      && Math.abs(this.ryT - this.ry) < 0.02
      && Math.abs(this.zoomT - this.zoom) < 0.001;
    if (settled) {
      this.pos = this.target; this.fan = fanT;
      this.rx = this.rxT; this.ry = this.ryT; this.zoom = this.zoomT;
    }
    this.render();
    if (!settled) this.wake();
  }

  render(force = false) {
    if (!this.leaves || !this.w) return;
    const { n, pos, thick: t, w } = this;
    const span = this.fanMode ? Math.max(2, Math.min(n - 1, 9)) : 1.6;
    const width = 1 + this.fan * span;
    const shift = (-w / 2) * (1 - Math.min(pos, 1)) + (w / 2) * (1 - Math.min(n - pos, 1));
    this.root.style.transform =
      `scale(${this.zoom.toFixed(4)}) rotateX(${this.rx.toFixed(2)}deg) rotateY(${this.ry.toFixed(2)}deg) translateX(${shift.toFixed(2)}px)`;

    for (let i = 0; i < n; i++) {
      const leaf = this.leaves[i];
      const p = clamp((pos - i - 0.5) / width + 0.5, 0, 1);
      const z = lerp((n - i) * t, (i + 1) * t, p);
      const tf = `translateZ(${z.toFixed(2)}px) rotateY(${(-p * 180).toFixed(2)}deg)`;
      if (force || tf !== leaf.last) {
        leaf.el.style.transform = tf;
        leaf.last = tf;
        const shade = (Math.sin(p * Math.PI) * 0.34).toFixed(3);
        leaf.shades.forEach((s) => { s.style.opacity = shade; });
      }
    }

    // En abanico las hojas ya no forman un bloque, así que el canto desaparece.
    const solid = 1 - this.fan;
    const zR = (n - pos) * t * solid, zL = pos * t * solid;
    const flat = (el, base) => { el.style.transform = base; };
    flat(this.edges.r, `translateZ(${zR.toFixed(2)}px) rotateY(90deg) scaleX(${zR.toFixed(2)})`);
    flat(this.edges.l, `rotateY(-90deg) scaleX(${zL.toFixed(2)})`);
    flat(this.edges.br, `rotateX(90deg) scaleY(${zR.toFixed(2)})`);
    flat(this.edges.bl, `rotateX(90deg) scaleY(${zL.toFixed(2)})`);
    flat(this.spine, `rotateY(-90deg) scaleX(${(n * t).toFixed(2)})`);
    const left = -w * Math.min(pos, 1), right = w * Math.min(n - pos, 1);
    this.floor.style.left = `${left}px`;
    this.floor.style.width = `${Math.max(w, right - left)}px`;

    const int = Math.round(pos);
    if (int !== this.lastInt) {
      this.lastInt = int;
      this.loadImages(int);
      this.emit();
    }
  }

  // Solo se cargan las fotos cercanas, para que los cuadernos largos no consuman tanta memoria.
  loadImages(center) {
    const range = this.fanMode ? this.n : IMAGE_WINDOW;
    this.leaves.forEach((leaf, i) => {
      const near = Math.abs(i - center) <= range || i === 0;
      leaf.imgs.forEach(async (img) => {
        if (!near) { img.removeAttribute('src'); return; }
        if (img.getAttribute('src')) return;
        const url = await getPageUrl(img.dataset.id);
        if (url) img.src = url;
      });
    });
  }

  emit() {
    if (!this.sides) return;
    const k = Math.round(this.target);
    const l = this.sides[k * 2 - 1], r = this.sides[k * 2];
    let label;
    const total = this.book.pages.length;
    if (k === 0) label = 'Portada';
    else if (k === this.n) label = 'Contraportada';
    else {
      const nums = [l, r].filter((s) => s?.type === 'page').map((s) => s.num);
      label = nums.length ? `${nums.length > 1 ? 'Páginas' : 'Página'} ${nums.join('–')} de ${total}` : 'Interior';
    }
    this.onChange?.({ leaf: k, leaves: this.n, label });
  }
}
