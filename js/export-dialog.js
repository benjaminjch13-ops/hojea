// Opciones de exportación de Delulu Journal V2: PDF, imágenes o página web, con o sin la libreta.
import { exportTools as X, prepareExport } from './delulu.js';
import { buildPdf } from './pdf.js';
import { esc, modal, toast } from './ui.js';

const chips = (name, options, value) => `<div class="chips" role="group" data-field="${name}">${options.map(([v, label]) =>
  `<button type="button" class="chip" data-v="${v}" aria-pressed="${v === value}">${esc(label)}</button>`).join('')}</div>`;

const FORMAT_HINTS = {
  pdf: 'Un solo archivo con toda la libreta, listo para abrir en cualquier equipo o imprimir.',
  png: 'Una imagen por hoja. Varias imágenes llegan juntas en un .zip.',
  html: 'Una página web hojeable, que funciona sola sin necesidad de Hojea.',
};

function saveFile(file) {
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file] }).catch(() => {});
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

const jobName = (j) => (j.k === 'cover' ? 'Portada' : j.k === 'back' ? 'Contraportada' : j.k === 'page' ? `Página ${j.i + 1}`
  : `Páginas ${(j.l ?? j.r) + 1}${j.l != null && j.r != null ? `–${j.r + 1}` : ''}`);

export async function openExportDialog(book, currentPage = 1) {
  const a = await prepareExport(book);
  const n = book.pages.length;
  const o = { fmt: 'pdf', layout: n > 1 ? 'spread' : 'single', cover: true, range: 'all', from: 1, to: n, q: 'normal' };
  let job = null;

  return modal(`
    <div class="manage-head">
      <h2>Exportar "${esc(book.title)}"</h2>
      <button class="icon-btn dark" data-close aria-label="Cerrar">✕</button>
    </div>
    <div class="export-body">
      <div class="export-form">
        <div class="field"><span class="field-label">Formato</span>${chips('fmt', [['pdf', 'PDF'], ['png', 'Imágenes PNG'], ['html', 'Página web']], o.fmt)}
          <p class="hint" data-hint>${FORMAT_HINTS.pdf}</p></div>
        <div class="field"><span class="field-label">Diseño</span>${chips('layout', [['spread', 'Libro abierto'], ['single', 'Una página por hoja']], o.layout)}</div>
        <div class="field"><span class="field-label">Páginas</span>${chips('range', [['all', `Todas (${n})`], ['cur', `Solo la ${Math.min(currentPage, Math.max(n, 1))}`], ['custom', 'Rango']], o.range)}
          <div class="export-range" data-custom hidden>
            <label>Desde <input type="number" data-from min="1" max="${n}" value="1"></label>
            <label>hasta <input type="number" data-to min="1" max="${n}" value="${n}"></label>
          </div></div>
        <label class="export-check"><input type="checkbox" data-cover checked> Incluir el diseño de la libreta (portada y contraportada)</label>
        <div class="field"><span class="field-label">Calidad</span>${chips('q', [['normal', 'Normal'], ['alta', 'Alta, para imprimir']], o.q)}</div>
      </div>
      <div class="export-preview"><canvas data-preview></canvas><p class="hint" data-summary></p></div>
    </div>
    <div class="export-progress" data-progress hidden><div><i></i></div><span class="hint" data-msg></span></div>
    <div class="dialog-actions">
      <button class="btn ghost" data-close>Cancelar</button>
      <button class="btn primary export-go" data-go>Exportar</button>
    </div>`, (d, close) => {
    const q = (s) => d.querySelector(s);
    const preview = q('[data-preview]');
    let previewId = 0;

    const jobs = () => {
      const list = X.jobsFor(a, o);
      return n ? list : list.filter((j) => j.k === 'cover' || j.k === 'back');
    };
    const sync = () => {
      const cur = Math.min(currentPage, Math.max(n, 1));
      if (o.range === 'all') { o.from = 1; o.to = n; }
      else if (o.range === 'cur') { o.from = cur; o.to = cur; }
      else {
        o.from = Math.min(n, Math.max(1, +q('[data-from]').value || 1));
        o.to = Math.min(n, Math.max(o.from, +q('[data-to]').value || n));
      }
      o.cover = q('[data-cover]').checked;
      q('[data-custom]').hidden = o.range !== 'custom';
      q('[data-hint]').textContent = FORMAT_HINTS[o.fmt];
      const list = jobs();
      const kind = o.fmt === 'pdf' ? 'PDF' : o.fmt === 'html' ? 'página web' : list.length > 1 ? 'ZIP con imágenes' : 'imagen PNG';
      q('[data-summary]').textContent = `${list.length} ${list.length === 1 ? 'hoja' : 'hojas'} · ${kind}`;
      q('[data-go]').disabled = !list.length;
      if (!list.length) return;
      const id = ++previewId;
      // La vista previa muestra una hoja interior si la hay: ahí se aprecia el diseño elegido.
      const sample = list.find((j) => j.k === 'spread' || j.k === 'page') ?? list[0];
      X.renderJob(a, sample, 1).then((c) => {
        if (id !== previewId) return;
        preview.width = c.width;
        preview.height = c.height;
        preview.getContext('2d').drawImage(c, 0, 0);
      }).catch(() => {});
    };

    const progress = (ratio, msg) => {
      q('[data-progress]').hidden = false;
      q('[data-progress] i').style.width = `${Math.round(ratio * 100)}%`;
      q('[data-msg]').textContent = msg;
    };

    async function run() {
      job = { cancel: false };
      q('[data-go]').disabled = true;
      d.querySelectorAll('.chip, .export-form input').forEach((x) => { x.disabled = true; });
      const base = X.slug(book.title);
      try {
        await X.ensureFonts();
        const list = jobs(), scale = o.q === 'alta' ? 3 : 2, out = [];
        for (let i = 0; i < list.length; i++) {
          if (job.cancel) return;
          progress(i / list.length, `Dibujando hoja ${i + 1} de ${list.length}…`);
          const c = await X.renderJob(a, list[i], scale);
          const bytes = await X.toBytes(c, o.fmt === 'png' ? 'image/png' : 'image/jpeg', o.fmt === 'html' ? 0.85 : 0.92);
          out.push({ bytes, data: bytes, w: c.width, h: c.height, name: `${String(i + 1).padStart(2, '0')}-${X.slug(jobName(list[i]))}.png` });
          c.width = c.height = 0;
          await new Promise((r) => setTimeout(r, 0));
        }
        progress(1, 'Armando el archivo…');
        let file;
        if (o.fmt === 'pdf') {
          file = new File([buildPdf(out)], `${base}.pdf`, { type: 'application/pdf' });
        } else if (o.fmt === 'html') {
          const b64 = (u) => { let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); };
          const pages = out.map((x, i) => ({ src: `data:image/jpeg;base64,${b64(x.bytes)}`, label: jobName(list[i]) }));
          file = new File([X.flipbookHTML(book.title, pages)], `${base}.html`, { type: 'text/html' });
        } else if (out.length === 1) {
          file = new File([out[0].bytes], `${base}.png`, { type: 'image/png' });
        } else {
          file = new File([X.buildZip(out)], `${base}-imagenes.zip`, { type: 'application/zip' });
        }
        saveFile(file);
        toast(`Listo: ${(file.size / 1048576).toFixed(1)} MB`);
        close();
      } catch (err) {
        console.error(err);
        toast('No se pudo exportar. Prueba con menos páginas o calidad normal.');
        job = null;
        q('[data-go]').disabled = false;
        q('[data-progress]').hidden = true;
        d.querySelectorAll('.chip, .export-form input').forEach((x) => { x.disabled = false; });
      }
    }

    d.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) { close(); return; }
      if (e.target.closest('[data-go]')) { run(); return; }
      const chip = e.target.closest('[data-v]');
      if (chip && !job) {
        const group = chip.parentElement;
        o[group.dataset.field] = chip.dataset.v;
        group.querySelectorAll('[data-v]').forEach((b) => b.setAttribute('aria-pressed', b === chip));
        sync();
      }
    });
    d.addEventListener('input', (e) => { if (e.target.matches('[data-from], [data-to], [data-cover]')) sync(); });
    // Cerrar el diálogo a mitad de camino cancela el trabajo.
    d.addEventListener('close', () => { if (job) job.cancel = true; });
    X.ensureFonts().then(sync);
    sync();
  }, 'dialog-wide');
}
