// Utilidades de interfaz compartidas.
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const PATHS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6"/>',
  fan: '<path d="M12 20L5 8M12 20l-2.5-14M12 20l2.5-14M12 20l7-12"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  rotate: '<path d="M20 11a8 8 0 10-2.3 6.3M20 5v6h-6"/>',
  left: '<path d="M14 6l-6 6 6 6"/>',
  right: '<path d="M10 6l6 6-6 6"/>',
  star: '<path d="M12 4l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
};

export const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;

// Abre un <dialog>; `mount` recibe el elemento y `close(valor)` para responder.
export function modal(html, mount, className = '') {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = className;
    d.innerHTML = html;
    document.body.append(d);
    let value;
    const close = (v) => { value = v; d.close(); };
    d.addEventListener('close', () => { d.remove(); resolve(value); });
    d.addEventListener('click', (e) => { if (e.target === d) close(); });
    mount?.(d, close);
    d.showModal();
  });
}

export const confirmDialog = (title, body, action) => modal(`
  <h2>${esc(title)}</h2>
  <p>${esc(body)}</p>
  <div class="dialog-actions">
    <button class="btn ghost" data-no>Cancelar</button>
    <button class="btn danger" data-yes>${esc(action)}</button>
  </div>`, (d, close) => {
  d.querySelector('[data-no]').onclick = () => close(false);
  d.querySelector('[data-yes]').onclick = () => close(true);
});

let toastTimer;
export function toast(text) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}
