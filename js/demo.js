// Cuaderno de ejemplo con bocetos generados, para que la app no se vea vacía la primera vez.
import { addPage, newId, saveBook } from './db.js';

const W = 900, H = 1200;

function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function wobble(ctx, r, pts, closed = false) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const px = x + (r() - 0.5) * 4, py = y + (r() - 0.5) * 4;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  });
  if (closed) ctx.closePath();
  ctx.stroke();
}

function paper(ctx, r, tone) {
  ctx.fillStyle = tone;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(90,70,40,${r() * 0.05})`;
    ctx.fillRect(r() * W, r() * H, 2, 2);
  }
}

function wash(ctx, r, x, y, rad, color) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.ellipse(x + (r() - 0.5) * rad, y + (r() - 0.5) * rad, rad * (0.4 + r() * 0.6), rad * (0.3 + r() * 0.6), r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function notes(ctx, r, x, y, w, lines) {
  ctx.lineWidth = 2.2;
  for (let l = 0; l < lines; l++) {
    const pts = [];
    const len = w * (0.55 + r() * 0.45);
    for (let d = 0; d < len; d += 9) {
      pts.push([x + d, y + l * 34 + Math.sin(d * 0.55 + l) * (3 + r() * 6)]);
    }
    wobble(ctx, r, pts);
  }
}

const SCENES = [
  function botanica(ctx, r) {
    wash(ctx, r, 450, 520, 260, '#3f9a6a');
    ctx.lineWidth = 3.4;
    for (let s = 0; s < 3; s++) {
      const bx = 280 + s * 170, top = 240 + r() * 160;
      const stem = [];
      for (let y = 1020; y > top; y -= 34) stem.push([bx + Math.sin(y * 0.012 + s) * 34, y]);
      wobble(ctx, r, stem);
      stem.forEach(([x, y], i) => {
        if (i % 2 || i < 2) return;
        const dir = i % 4 ? 1 : -1, len = 70 + r() * 50;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + dir * len * 0.5, y - 62, x + dir * len, y - 26);
        ctx.quadraticCurveTo(x + dir * len * 0.5, y - 8, x, y);
        ctx.stroke();
      });
    }
    notes(ctx, r, 90, 1090, 340, 2);
  },
  function montanas(ctx, r) {
    wash(ctx, r, 620, 240, 150, '#e4872e');
    wash(ctx, r, 420, 700, 300, '#4a68c9');
    ctx.lineWidth = 3;
    for (let m = 0; m < 4; m++) {
      const base = 480 + m * 130;
      const pts = [];
      for (let x = 50; x <= 850; x += 34) pts.push([x, base - Math.abs(Math.sin(x * 0.009 + m * 1.7)) * (190 - m * 25) - r() * 26]);
      wobble(ctx, r, pts);
      ctx.lineWidth = 1.4;
      for (let h = 0; h < 34; h++) {
        const [x, y] = pts[Math.floor(r() * pts.length)];
        wobble(ctx, r, [[x, y + 8], [x - 16, y + 44 + r() * 20]]);
      }
      ctx.lineWidth = 3;
    }
    ctx.beginPath();
    ctx.arc(630, 230, 58, 0, Math.PI * 2);
    ctx.stroke();
    notes(ctx, r, 90, 1020, 700, 4);
  },
  function ciudad(ctx, r) {
    wash(ctx, r, 330, 450, 240, '#d6336c');
    wash(ctx, r, 640, 780, 200, '#f2b632');
    ctx.lineWidth = 3.2;
    let x = 90;
    while (x < 760) {
      const w = 90 + r() * 90, top = 240 + r() * 420;
      wobble(ctx, r, [[x, 960], [x, top], [x + w, top], [x + w, 960]]);
      ctx.lineWidth = 1.8;
      for (let wy = top + 34; wy < 900; wy += 62) {
        for (let wx = x + 16; wx < x + w - 24; wx += 36) {
          wobble(ctx, r, [[wx, wy], [wx + 18, wy], [wx + 18, wy + 28], [wx, wy + 28]], true);
        }
      }
      ctx.lineWidth = 3.2;
      x += w + 8;
    }
    wobble(ctx, r, [[50, 962], [850, 958]]);
    notes(ctx, r, 90, 1040, 620, 3);
  },
  function retratoGato(ctx, r) {
    wash(ctx, r, 450, 500, 270, '#e4572e');
    ctx.lineWidth = 3.8;
    const round = (cx, cy, rx, ry, a = 0, b = Math.PI * 2) => {
      const p = [];
      for (let t = a; t <= b; t += 0.13) p.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
      wobble(ctx, r, p);
    };
    round(450, 520, 225, 195);
    wobble(ctx, r, [[265, 410], [270, 215], [395, 335]]);
    wobble(ctx, r, [[635, 410], [630, 215], [505, 335]]);
    round(370, 480, 35, 44); round(530, 480, 35, 44);
    round(374, 486, 11, 28); round(534, 486, 11, 28);
    wobble(ctx, r, [[432, 570], [468, 570], [450, 594]], true);
    round(420, 596, 30, 26, 0.1, 2.5); round(480, 596, 30, 26, 0.6, 3);
    for (const dir of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        wobble(ctx, r, [[450 + dir * 95, 560 + i * 22], [450 + dir * 262, 526 + i * 40]]);
      }
    }
    notes(ctx, r, 170, 860, 570, 6);
  },
];

async function renderPage(i) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const r = rng(971 + i * 37);
  paper(ctx, r, ['#f7f1e3', '#f4ecd8', '#faf5e8', '#f2ead9'][i % 4]);
  ctx.strokeStyle = '#2b2a44';
  ctx.lineCap = ctx.lineJoin = 'round';
  SCENES[i % SCENES.length](ctx, r);
  const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
  return addPage(blob, W, H);
}

export async function seedDemoBook() {
  const pages = [];
  for (let i = 0; i < 8; i++) pages.push(await renderPage(i));
  await saveBook({
    id: newId(),
    title: 'Sketchbook',
    palette: 'noche',
    pattern: 'flores',
    aspect: W / H,
    pages,
    createdAt: Date.now(),
  });
}
