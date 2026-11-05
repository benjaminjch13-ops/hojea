// Carrusel de libretas: se desliza con el dedo, el mouse, las flechas o el teclado, y la del centro resalta.
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const DRAG_THRESHOLD = 6;

export function bindCarousel(root) {
  const track = root.querySelector('.shelf-grid');
  const items = [...track.children];
  const prev = root.querySelector('[data-carousel-prev]');
  const next = root.querySelector('[data-carousel-next]');
  const dots = [...root.querySelectorAll('[data-carousel-dot]')];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let frame = 0;

  const centerOf = (item) => item.offsetLeft + item.offsetWidth / 2;
  const goTo = (index, smooth = !calm) => {
    const item = items[clamp(index, 0, items.length - 1)];
    track.scrollTo({ left: centerOf(item) - track.clientWidth / 2, behavior: smooth ? 'smooth' : 'auto' });
  };

  // Cada libreta se achica y gira según qué tan lejos está del centro.
  const paint = () => {
    frame = 0;
    const middle = track.scrollLeft + track.clientWidth / 2;
    const step = (items[1]?.offsetLeft ?? 0) - items[0].offsetLeft || items[0].offsetWidth;
    let nearest = 0;
    let best = Infinity;
    items.forEach((item, i) => {
      const distance = (centerOf(item) - middle) / step;
      if (Math.abs(distance) < best) { best = Math.abs(distance); nearest = i; }
      item.style.setProperty('--s', clamp(distance, -1.5, 1.5).toFixed(3));
      item.style.setProperty('--d', Math.min(Math.abs(distance), 1.5).toFixed(3));
    });
    current = nearest;
    items.forEach((item, i) => item.classList.toggle('is-center', i === current));
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === items.length - 1;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };

  track.addEventListener('scroll', schedule, { passive: true });
  new ResizeObserver(() => paint()).observe(track);
  prev?.addEventListener('click', () => goTo(current - 1));
  next?.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  // Arrastrar con el mouse; en pantallas táctiles el navegador ya desliza solo.
  let drag = null;
  let dragged = false;
  track.addEventListener('pointerdown', (e) => {
    dragged = false;
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft };
  });
  track.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const moved = e.clientX - drag.x;
    if (!dragged && Math.abs(moved) < DRAG_THRESHOLD) return;
    if (!dragged) {
      dragged = true;
      track.classList.add('is-dragging');
      track.setPointerCapture?.(e.pointerId);
    }
    track.scrollLeft = drag.left - moved;
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    if (dragged) {
      track.classList.remove('is-dragging');
      paint();
      goTo(current);
    }
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('dragstart', (e) => e.preventDefault());

  // Tocar una libreta de los lados la trae al centro; solo la del centro se abre.
  track.addEventListener('click', (e) => {
    const item = e.target.closest('.shelf-grid > *');
    if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; return; }
    const index = items.indexOf(item);
    if (index >= 0 && index !== current) {
      e.preventDefault();
      e.stopPropagation();
      goTo(index);
    }
  }, true);

  track.addEventListener('focusin', (e) => {
    const index = items.indexOf(e.target.closest('.shelf-grid > *'));
    if (index >= 0 && index !== current) goTo(index);
  });
  track.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const target = current + (e.key === 'ArrowLeft' ? -1 : 1);
    items[clamp(target, 0, items.length - 1)].focus();
    goTo(target);
  });

  goTo(0, false);
  paint();
}
