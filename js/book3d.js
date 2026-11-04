// Libro 3D con CSS. Todo se deriva de un solo número: `pos`, cuántas hojas se han pasado.
import { backFaceHTML, bandFill, bandHTML, charmsHTML, coverFaceHTML, leatherLayers } from './cover.js';
import { getPageUrl } from './db.js';
import { pageSurfaceHTML } from './delulu.js';
import { esc } from './ui.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const REST_RX = 7;
const IMAGE_WINDOW = 4;
const DESIGN_WIDTH = 560;
const BEND_STRIPS = 6;     // tiras en que se divide la hoja que se dobla
const MAX_BENDING = 2;     // hojas dobladas a la vez: el resto gira plano para no pesar
const SPRING = 42;         // firmeza del paso de hoja

export class Book3D {
  // preview: modo del editor de portada. El arrastre solo gira la libreta y un toque la abre o cierra.
  constructor(stage, { onChange, preview = false } = {}) {
    this.stage = stage;
    this.onChange = onChange;
    this.preview = preview;
    this.root = document.createElement('div');
    this.root.className = 'b-book';
    // Un contenedor aparte lleva la flotación en reposo, porque el libro mueve su propia transformación.
    this.float = document.createElement('div');
    this.float.className = 'b-float';
    this.float.append(this.root);
    stage.append(this.float);

    this.pos = 0; this.target = 0; this.posV = 0;
    this.peek = 0; this.peekT = 0;
    this.bendDir = 1; this.bendSpeed = 0;
    this.fan = 0; this.fanMode = false;
    this.restRy = preview ? -26 : -10;
    this.rx = REST_RX; this.ry = this.restRy; this.rxT = REST_RX; this.ryT = this.restRy;
    this.zoom = 1; this.zoomT = 1;
    this.vel = 0;
    this.drag = null;
    this.raf = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Entrada: la libreta llega girando un poco, no aparece de golpe.
    if (!this.reduced) {
      this.zoom = 0.86;
      this.rx = REST_RX + 10;
      this.ry = this.restRy - 24;
    }

    this.handlers = {
      pointerdown: (e) => this.onDown(e),
      pointermove: (e) => this.onMove(e),
      pointerup: (e) => this.onUp(e),
      pointercancel: (e) => this.onUp(e),
      pointerleave: () => {
        this.peekT = 0;
        if (!this.drag && !preview) this.setOrbit(REST_RX, this.pos === 0 ? this.restRy : 0);
        else this.wake();
      },
      wheel: (e) => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.06 : 0.94); },
    };
    for (const [k, fn] of Object.entries(this.handlers)) {
      stage.addEventListener(k, fn, k === 'wheel' ? { passive: false } : undefined);
    }
    this.onKey = (e) => {
      if (preview || e.target.matches?.('input, textarea, select') || document.querySelector('dialog[open], .fullscreen')) return;
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
    clearTimeout(this.dropTimer);
    this.ground?.remove();
    this.float.remove();
  }

  // Lados en orden: portada, páginas, (lado en blanco si hace falta), contraportada.
  setBook(book) {
    this.book = book;
    const sides = [{ type: 'cover' }, ...book.pages.map((page, i) => ({ type: 'page', page, num: i + 1 }))];
    // Sin páginas se muestran hojas en blanco: una libreta vacía también se puede abrir.
    if (!book.pages.length) sides.push({ type: 'blank' }, { type: 'blank' });
    else if (sides.length % 2 === 0) sides.push({ type: 'blank' });
    sides.push({ type: 'back' });
    this.sides = sides;
    this.n = sides.length / 2;

    this.root.innerHTML = `
      <div class="book-floor"></div>
      <div class="edge edge-r"></div><div class="edge edge-l"></div>
      <div class="edge-b edge-br"></div><div class="edge-b edge-bl"></div>
      <div class="spine3d"></div><div class="book-ribbon"></div><div class="page-cast"></div><div class="strap"></div>`;
    this.cast = this.root.querySelector('.page-cast');
    this.floor = this.root.querySelector('.book-floor');
    this.edges = {
      r: this.root.querySelector('.edge-r'), l: this.root.querySelector('.edge-l'),
      br: this.root.querySelector('.edge-br'), bl: this.root.querySelector('.edge-bl'),
    };
    this.spine = this.root.querySelector('.spine3d');
    this.strap = this.root.querySelector('.strap');
    this.ribbon = this.root.querySelector('.book-ribbon');

    this.leaves = [];
    for (let i = 0; i < this.n; i++) {
      const el = document.createElement('div');
      el.className = 'b-leaf';
      this.root.append(el);
      this.leaves.push({ el, last: '' });
      this.paintLeaf(i);
    }
    this.paintLeather();
    this.pos = clamp(this.pos, 0, this.n);
    this.target = clamp(Math.round(this.target), 0, this.n);
    this.lastInt = null;
    this.layout();
    this.wake();
    this.emit();
  }

  paintLeaf(i) {
    const leaf = this.leaves[i];
    leaf.el.innerHTML = this.faceHtml(this.sides[i * 2], 'front', i === this.n - 1)
      + this.faceHtml(this.sides[i * 2 + 1], 'back', i === 0);
    leaf.shades = leaf.el.querySelectorAll('.shade');
    leaf.imgs = leaf.el.querySelectorAll('img[data-id]');
    leaf.pages = leaf.el.querySelectorAll('.pg-fit');
    leaf.last = '';
    leaf.bend = null;
    leaf.el.classList.remove('bending');
  }

  // bound: la hoja va pegada a la tapa, así que se ve el cuero alrededor del papel.
  faceHtml(side, cls, bound) {
    const b = this.book, c = b.cover;
    if (side.type === 'cover' || side.type === 'back') {
      const html = side.type === 'cover' ? coverFaceHTML(b) : backFaceHTML(b);
      return `<div class="face ${cls} lea" style="background-color:${c.color}">${html}<div class="shade"></div></div>`;
    }
    // El contenido de la hoja se dibuja solo cuando está cerca (ver loadImages).
    const inner = side.type === 'page' ? `<div class="pg-fit" data-page="${side.num - 1}" aria-label="Página ${side.num}"></div>` : '';
    const sheet = `<div class="b-sheet">${inner}<div class="gutter"></div><div class="shade"></div></div>`;
    return bound
      ? `<div class="face ${cls} lea-inside" style="background-color:${c.color}">${leatherLayers(c)}${sheet}</div>`
      : `<div class="face ${cls}">${sheet}</div>`;
  }

  // Todo lo que muestra el cuero, sin tocar las páginas del medio.
  paintLeather() {
    const b = this.book, c = b.cover, e = c.elastic;
    this.strap.innerHTML = bandHTML(c) + charmsHTML(c);
    const firstLine = c.title.show ? b.title : '';
    this.spine.style.backgroundColor = c.color;
    this.spine.innerHTML = `${leatherLayers(c)}${firstLine ? `<span class="spine-title" style="font-family:${c.title.font.replace(/"/g, "'")}">${esc(firstLine)}</span>` : ''}`;
    const horizontal = e.orient === 'horizontal';
    const u = (n) => `calc(var(--u) * ${n})`;
    const strip = (el, css) => { el.innerHTML = `<i class="edge-band" style="${css};background:${bandFill(e, horizontal)}"></i>`; };
    const across = `left:0;right:0;top:calc(${e.pos * 100}% - ${u(e.width)} / 2);height:${u(e.width)}`;
    const along = `top:0;bottom:0;left:calc(${e.pos * 100}% - ${u(e.width)} / 2);width:${u(e.width)}`;
    if (horizontal) { strip(this.edges.r, across); this.edges.br.innerHTML = ''; }
    else { strip(this.edges.br, along); this.edges.r.innerHTML = ''; }
    this.ribbon.style.display = c.ribbon === 'none' ? 'none' : '';
    this.ribbon.style.background = c.ribbon && c.ribbon !== 'none' ? c.ribbon : '#b5646d';
  }

  // Actualiza la portada al instante mientras se edita.
  refreshCover() {
    this.paintLeaf(0);
    if (this.n > 1) this.paintLeaf(this.n - 1);
    this.paintLeather();
    this.loadImages(Math.round(this.pos));
    this.render(true);
  }

  layout() {
    if (!this.book) return;
    const { width, height } = this.stage.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = this.book.aspect || 0.72;
    let h = height * 0.84;
    let w = h * aspect;
    // El tamaño base debe caber abierta (dos páginas); cerrada se agranda para aprovechar el espacio.
    const maxW = width * 0.46;
    if (w > maxW) { w = maxW; h = w / aspect; }
    this.w = w; this.h = h;
    this.closedFit = Math.max(1, Math.min((width * (this.preview ? 0.66 : 0.74)) / w, (height * 0.84) / h));
    this.u = w / DESIGN_WIDTH;
    // Grosor de libreta real: crece con las páginas, con un mínimo y un máximo.
    this.thick = (clamp(26 + this.n * 3.2, 30, 62) * this.u) / this.n;
    this.root.style.setProperty('--w', `${w}px`);
    this.root.style.setProperty('--h', `${h}px`);
    this.root.style.setProperty('--u', `${this.u}px`);
    this.root.style.setProperty('--pg-s', String((w * 0.976) / DESIGN_WIDTH));
    this.render(true);
  }

  // ---- Navegación ----
  goTo(leaf, instant = false) {
    this.target = clamp(leaf, 0, this.n);
    if (instant) { this.pos = this.target; this.posV = 0; }
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

  // La libreta nueva cae del cielo, rebota y levanta polvo al tocar el suelo.
  dropIn(delay = 0) {
    if (this.reduced) return;
    const height = this.stage.getBoundingClientRect().height;
    const start0 = -(height / 2 + (this.h || height) * 1.1);
    this.dropState = {
      y: start0, y0: start0,
      v: 0, g: Math.max(1500, height * 3.4), tilt: 1, squash: 0, hits: 0, waiting: delay > 0,
    };
    this.zoom = this.zoomT;
    this.rx = this.rxT; this.ry = this.ryT;
    if (!this.ground) {
      this.ground = document.createElement('div');
      this.ground.className = 'drop-ground';
      this.stage.append(this.ground);
    }
    this.ground.style.setProperty('--w', `${this.w * 1.25}px`);
    this.ground.style.top = `calc(50% + ${this.h / 2 - 8}px)`;
    this.ground.style.opacity = '0';
    this.render(true);
    const start = () => { if (this.dropState) { this.dropState.waiting = false; this.wake(); } };
    if (delay > 0) this.dropTimer = setTimeout(start, delay); else this.wake();
  }

  stepDrop(dt) {
    const d = this.dropState;
    if (!d || d.waiting) return;
    d.v += d.g * dt;
    d.y += d.v * dt;
    d.tilt = clamp(d.y / d.y0, 0, 1);
    if (d.y >= 0) {
      d.y = 0;
      if (d.v > 170) {
        if (!d.hits) this.impact();
        d.squash = clamp(d.v / 1100, 0.15, 1);
        d.hits++;
        this.swingKick = (d.hits % 2 ? 1 : -1) * Math.min(26, d.v / 45);
        d.v *= -0.3;
      } else {
        this.dropState = null;
        this.ground.remove();
        this.ground = null;
        this.floor.style.opacity = '';
        return;
      }
    }
    d.squash *= Math.exp(-dt * 13);
    if (this.ground) {
      const near = 1 - clamp(-d.y / -d.y0, 0, 1);
      this.ground.style.opacity = (near * near * 0.9).toFixed(3);
      this.ground.style.setProperty('--s', (0.35 + near * 0.65).toFixed(3));
    }
  }

  impact() {
    this.stage.classList.remove('shake');
    void this.stage.offsetWidth;
    this.stage.classList.add('shake');
    setTimeout(() => this.stage.classList.remove('shake'), 460);
    const burst = document.createElement('div');
    burst.className = 'dust-burst';
    burst.style.top = `calc(50% + ${this.h / 2 - 6}px)`;
    const pieces = [];
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1, far = this.w * (0.35 + Math.random() * 0.55);
      pieces.push(`<i style="--dx:${(side * far).toFixed(0)}px;--dy:${(-14 - Math.random() * 46).toFixed(0)}px;--s:${(0.6 + Math.random() * 1.1).toFixed(2)};--d:${(Math.random() * 90).toFixed(0)}ms"></i>`);
    }
    for (let i = 0; i < 6; i++) {
      const dx = (Math.random() - 0.5) * this.w * 1.5;
      pieces.push(`<b style="--dx:${dx.toFixed(0)}px;--dy:${(-50 - Math.random() * 80).toFixed(0)}px;--d:${(40 + Math.random() * 120).toFixed(0)}ms">${i % 2 ? '♥' : '✦'}</b>`);
    }
    pieces.push('<em class="muu-pop">¡Muu!</em>');
    burst.innerHTML = pieces.join('');
    this.stage.append(burst);
    setTimeout(() => burst.remove(), 1100);
  }

  // ---- Hoja que se dobla: durante el giro se reemplaza por tiras encadenadas ----
  ensureBend(leaf) {
    if (leaf.bend) return;
    const faces = [['front', leaf.el.querySelector(':scope > .face.front')], ['back', leaf.el.querySelector(':scope > .face.back')]];
    const strips = [];
    let parent = leaf.el;
    for (let k = 0; k < BEND_STRIPS; k++) {
      const strip = document.createElement('div');
      strip.className = k ? 'bend-strip' : 'bend-strip first';
      const shades = [];
      for (const [side, face] of faces) {
        const clip = document.createElement('div');
        clip.className = `bend-clip ${side}`;
        const clone = face.cloneNode(true);
        clone.classList.add('bend-face');
        clone.querySelectorAll('.shade').forEach((s) => s.remove());
        // Cada tira muestra su trozo de la cara: la de atrás está espejada respecto al lomo.
        const offset = side === 'front' ? k : BEND_STRIPS - 1 - k;
        clone.style.left = `calc(var(--w) * ${-offset} / ${BEND_STRIPS})`;
        const shade = document.createElement('div');
        shade.className = 'bend-shade';
        // La sombra va sobre el papel, no sobre el margen transparente de la hoja.
        clone.querySelector('.b-sheet').append(shade);
        clip.append(clone);
        strip.append(clip);
        shades.push(shade);
      }
      parent.append(strip);
      parent = strip;
      strips.push({ el: strip, shades });
    }
    leaf.el.classList.add('bending');
    leaf.bend = strips;
  }

  applyBend(leaf, p) {
    const total = this.bendDir * Math.sin(p * Math.PI) * (16 + this.bendSpeed);
    const parts = (BEND_STRIPS * (BEND_STRIPS - 1)) / 2;
    let angle = -p * 180;
    leaf.bend.forEach((strip, k) => {
      const a = (total * k) / parts;
      angle += a;
      strip.el.style.transform = `rotateY(${a.toFixed(2)}deg)`;
      // La luz depende de cuánto mira cada tira hacia afuera: así se lee la curva.
      const light = (0.02 + Math.abs(Math.sin((angle * Math.PI) / 180)) * 0.25).toFixed(3);
      strip.shades.forEach((s) => { s.style.opacity = light; });
    });
  }

  dropBend(leaf) {
    leaf.bend[0].el.remove();
    leaf.bend = null;
    leaf.el.classList.remove('bending');
  }

  setFan(on) {
    this.fanMode = on;
    if (on && (this.target === 0 || this.target === this.n)) this.target = Math.round(this.n / 2);
    this.loadImages(Math.round(this.target)); // en abanico se ven todas las hojas
    this.wake();
  }

  // ---- Punteros ----
  onDown(e) {
    if (e.button || this.drag) return; // un segundo dedo no interrumpe el gesto en curso
    const onBook = !this.preview && e.target.closest?.('.b-leaf');
    this.drag = {
      id: e.pointerId, mode: onBook ? 'flip' : 'orbit',
      x: e.clientX, y: e.clientY, startPos: this.pos, rx: this.rxT, ry: this.ryT,
      lastX: e.clientX, lastT: e.timeStamp, moved: false,
    };
    this.vel = 0;
    this.posV = 0;
    this.peekT = 0;
    this.stage.setPointerCapture(e.pointerId);
    this.stage.classList.add('dragging');
  }

  onMove(e) {
    const d = this.drag;
    if (!d) {
      // Inclinación suave siguiendo el mouse.
      if (e.pointerType === 'mouse' && !this.reduced && !this.preview) {
        const r = this.stage.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        this.setOrbit(REST_RX - ny * 7, nx * 12 + (this.pos < 0.5 ? this.restRy : 0));
        // La hoja se asoma cuando el mouse se acerca a su borde: invita a pasarla.
        const shift = (-this.w / 2) * (1 - Math.min(this.pos, 1)) + (this.w / 2) * (1 - Math.min(this.n - this.pos, 1));
        const x = e.clientX - (r.left + r.width / 2) - shift;
        const zone = this.w * 0.2;
        const atRight = this.target < this.n && Math.abs(x - this.w) < zone;
        const atLeft = this.target > 0 && Math.abs(x + this.w) < zone;
        this.peekT = atRight ? 0.05 : atLeft ? -0.05 : 0;
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
      const limit = this.preview ? 200 : 60;
      this.ryT = clamp(d.ry + dx * 0.4, -limit, limit);
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
        this.posV = clamp(this.vel, -5, 5); // la hoja sigue con la inercia del gesto
      } else if (this.pos < 0.5) this.next();
      else if (this.pos > this.n - 0.5) this.prev();
      else {
        const r = this.stage.getBoundingClientRect();
        if (e.clientX > r.left + r.width / 2) this.next(); else this.prev();
      }
    } else if (!this.preview) {
      this.setOrbit(REST_RX, this.target === 0 ? this.restRy : 0);
    } else if (!d.moved && e.target.closest?.('.b-leaf, .strap')) {
      this.goTo(this.target ? 0 : 1);
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

    const prevPos = this.pos;
    if (!this.drag || this.drag.mode !== 'flip') {
      if (this.reduced) this.pos += (this.target - this.pos) * ease(7.5);
      else {
        // Resorte: la hoja arranca suave y aterriza sin frenazo.
        this.posV += (SPRING * (this.target - this.pos) - 2 * Math.sqrt(SPRING) * this.posV) * dt;
        this.pos = clamp(this.pos + this.posV * dt, 0, this.n);
      }
    }
    const speed = dt ? (this.pos - prevPos) / dt : 0;
    if (Math.abs(speed) > 0.04) this.bendDir = Math.sign(speed);
    this.bendSpeed = lerp(this.bendSpeed, Math.min(28, Math.abs(speed) * 13), ease(9));
    this.peek += (this.peekT - this.peek) * ease(11);
    this.stepDrop(dt);
    const dragging = this.drag?.mode === 'flip' && this.drag.moved;
    if (dragging) this.vel *= Math.exp(-dt * 7); // con el dedo quieto, el impulso se apaga
    const fanT = this.reduced ? 0
      : this.fanMode ? 1
      : dragging ? clamp((Math.abs(this.vel) - 2.5) * 0.35, 0, 1)
      : Math.abs(this.target - this.pos) > 1.2 ? 0.6 : 0;
    this.fan += (fanT - this.fan) * ease(6);
    const prevRy = this.ry;
    this.rx += (this.rxT - this.rx) * ease(8);
    this.ry += (this.ryT - this.ry) * ease(8);
    this.zoom += (this.zoomT - this.zoom) * ease(10);
    // El charm cuelga: se balancea cuando la libreta gira.
    this.swingKick = (this.swingKick ?? 0) * Math.exp(-dt * 3.2);
    const wiggle = this.swingKick * Math.cos(now / 95);
    this.swing = lerp(this.swing ?? 0, clamp((this.ry - prevRy) * 2.4 + wiggle, -30, 30), ease(this.swingKick ? 14 : 5));

    const settled = !this.drag && !(this.dropState && !this.dropState.waiting)
      && Math.abs(this.target - this.pos) < 0.0015
      && Math.abs(this.posV) < 0.01
      && Math.abs(this.peekT - this.peek) < 0.001
      && this.bendSpeed < 0.05
      && Math.abs(this.swingKick) < 0.2
      && Math.abs(fanT - this.fan) < 0.002
      && Math.abs(this.rxT - this.rx) < 0.02
      && Math.abs(this.ryT - this.ry) < 0.02
      && Math.abs(this.zoomT - this.zoom) < 0.001
      && Math.abs(this.swing) < 0.05;
    if (settled) {
      this.pos = this.target; this.posV = 0; this.fan = fanT; this.swing = 0;
      this.peek = this.peekT; this.bendSpeed = 0; this.swingKick = 0;
      this.rx = this.rxT; this.ry = this.ryT; this.zoom = this.zoomT;
    }
    this.render();
    if (!settled) this.wake();
  }

  render(force = false) {
    if (!this.leaves || !this.w) return;
    const { n, pos, thick: t, w } = this;
    const shown = pos + this.peek; // la posición con la hoja asomada
    const span = this.fanMode ? Math.max(2, Math.min(n - 1, 9)) : 1.6;
    const width = 1 + this.fan * span;
    const shift = (-w / 2) * (1 - Math.min(pos, 1)) + (w / 2) * (1 - Math.min(n - pos, 1));
    const d = this.dropState;
    const fall = d ? `translate3d(0,${d.y.toFixed(1)}px,0) rotateZ(${(-16 * d.tilt).toFixed(2)}deg) ` : '';
    const tumble = d ? 62 * d.tilt : 0;
    const spin = d ? 38 * d.tilt : 0;
    const squash = d ? ` scale(${(1 + d.squash * 0.05).toFixed(4)},${(1 - d.squash * 0.08).toFixed(4)})` : '';
    this.root.style.transform =
      `${fall}scale(${(this.zoom * lerp(this.closedFit, 1, clamp(Math.min(pos, n - pos), 0, 1))).toFixed(4)})${squash} rotateX(${(this.rx + tumble).toFixed(2)}deg) rotateY(${(this.ry + spin).toFixed(2)}deg) translateX(${shift.toFixed(2)}px)`;
    this.root.classList.toggle('falling', !!d);

    const turning = !this.reduced && this.fan < 0.35
      && (this.drag?.mode === 'flip' || Math.abs(this.target - pos) > 0.002 || Math.abs(this.posV) > 0.01);
    let bending = 0, castP = null;
    for (let i = 0; i < n; i++) {
      const leaf = this.leaves[i];
      const p = clamp((shown - i - 0.5) / width + 0.5, 0, 1);
      if (castP === null && p > 0.002 && p < 0.998) castP = p;
      // Las tapas son rígidas; solo el papel se dobla.
      const paper = i > 0 && i < n - 1;
      if (turning && paper && p > 0.006 && p < 0.994 && bending < MAX_BENDING) {
        bending++;
        this.ensureBend(leaf);
        this.applyBend(leaf, p);
      } else if (leaf.bend) this.dropBend(leaf);
      const z = lerp((n - i) * t, (i + 1) * t, p);
      const tf = `translateZ(${z.toFixed(2)}px) rotateY(${(-p * 180).toFixed(2)}deg)`;
      if (force || tf !== leaf.last) {
        leaf.el.style.transform = tf;
        leaf.last = tf;
        const shade = (Math.sin(p * Math.PI) * 0.34).toFixed(3);
        leaf.shades.forEach((s) => { s.style.opacity = shade; });
      }
    }

    // La hoja en el aire proyecta sombra sobre la página de abajo.
    const castOn = castP !== null && this.fan < 0.5;
    this.cast.style.opacity = castOn ? (Math.sin(castP * Math.PI) * 0.75).toFixed(3) : '0';
    if (castOn) {
      const onRight = castP < 0.5;
      const z = (onRight ? (n - pos) : pos) * t + 0.4;
      const reach = Math.abs(Math.cos(castP * Math.PI));
      this.cast.style.transform = `translateZ(${z.toFixed(2)}px) scaleX(${(onRight ? 1 : -1) * (0.25 + reach * 0.85)})`;
    }

    // En abanico las hojas ya no forman un bloque, así que el canto desaparece.
    const solid = 1 - this.fan;
    // Cada bloque de hojas solo tiene canto cuando su tapa ya está apoyada.
    const zR = pos > n - 1 ? 0 : (n - pos) * t * solid;
    const zL = pos < 1 ? 0 : pos * t * solid;
    const flat = (el, thickness, transform) => {
      el.style.setProperty('--t', `${Math.max(0, thickness).toFixed(2)}px`);
      el.style.transform = transform;
    };
    flat(this.edges.r, zR, `translateZ(${zR.toFixed(2)}px) rotateY(90deg)`);
    flat(this.edges.l, zL, 'rotateY(-90deg)');
    flat(this.edges.br, zR, 'rotateX(90deg)');
    flat(this.edges.bl, zL, 'rotateX(90deg)');
    flat(this.spine, n * t, 'rotateY(-90deg)');

    // El elástico se suelta al abrir: se desliza fuera de la tapa y desaparece.
    const release = clamp(pos * 3.2, 0, 1);
    const closedZ = n * t + 0.5;
    this.strap.style.opacity = (1 - release).toFixed(3);
    this.strap.style.visibility = release >= 1 ? 'hidden' : 'visible';
    this.strap.style.transform = `translateZ(${closedZ.toFixed(2)}px) translateX(${(release * w * 0.22).toFixed(2)}px)`;
    this.strap.style.setProperty('--swing', `${(this.swing ?? 0).toFixed(2)}deg`);
    this.strap.style.setProperty('--release', release.toFixed(3));
    this.root.style.setProperty('--strap-edge', (1 - release).toFixed(3));

    // La cinta acompaña a las hojas: al llegar a la contraportada, cuelga de ese lado.
    this.ribbon.style.transform = `translateX(${(-w * 0.32 * clamp(pos - (n - 1), 0, 1)).toFixed(2)}px)`;

    const left = -w * Math.min(pos, 1), right = w * Math.min(n - pos, 1);
    this.floor.style.left = `${left}px`;
    this.floor.style.width = `${Math.max(w, right - left)}px`;
    if (d) this.floor.style.opacity = String(1 - d.tilt);

    const int = Math.round(pos);
    if (int !== this.lastInt) {
      this.lastInt = int;
      this.loadImages(int);
      this.emit();
    }
  }

  // Solo se dibujan las hojas cercanas, para que los cuadernos largos no consuman tanta memoria.
  loadImages(center) {
    const range = this.fanMode ? this.n : IMAGE_WINDOW;
    this.leaves.forEach((leaf, i) => {
      const near = Math.abs(i - center) <= range || i === 0;
      leaf.pages.forEach((box) => {
        if (!near) { box.innerHTML = ''; return; }
        if (!box.firstChild) box.innerHTML = pageSurfaceHTML(this.book.pages[+box.dataset.page], this.book);
      });
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
