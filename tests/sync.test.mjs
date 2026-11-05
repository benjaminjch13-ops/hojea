import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assetsOf, createSync, docKey } from '../js/sync-core.js';

// Un servidor de mentira con las mismas reglas que supabase/schema.sql.
function fakeServer() {
  const rows = new Map();
  const assets = new Map();
  let seq = 0;
  return {
    rows, assets, offline: false,
    backendFor() {
      const server = this;
      const guard = () => { if (server.offline) throw new Error('sin internet'); };
      return {
        pull: async (after) => { guard(); return [...rows.values()].filter((r) => r.seq > after).sort((a, b) => a.seq - b.seq).map((r) => ({ ...r })); },
        fetchOne: async (kind, id) => { guard(); const r = rows.get(docKey(kind, id)); return r ? { ...r } : null; },
        push: async ({ kind, id, data, base, deleted }) => {
          guard();
          const key = docKey(kind, id);
          const current = rows.get(key);
          if (!current) { rows.set(key, { kind, id, data, version: 1, deleted, seq: ++seq }); return { ok: true, version: 1 }; }
          if (current.version !== base) return { conflict: true, version: current.version };
          const version = current.version + 1;
          rows.set(key, { kind, id, data, version, deleted, seq: ++seq });
          return { ok: true, version };
        },
        upload: async (id, blob) => { guard(); assets.set(id, blob); },
        download: async (id) => { guard(); if (!assets.has(id)) throw new Error('no está'); return assets.get(id); },
      };
    },
  };
}

// Un dispositivo: su almacenamiento local y su motor de sincronización.
function device(server, { busy = () => false } = {}) {
  const docs = new Map();
  const blobs = new Map();
  let state;
  let ids = 0;
  const store = {
    loadState: async () => state,
    saveState: async (s) => { state = structuredClone(s); },
    listDocs: async () => [...docs.keys()].map((k) => { const i = k.indexOf('/'); return [k.slice(0, i), k.slice(i + 1)]; }),
    getDoc: async (kind, id) => { const d = docs.get(docKey(kind, id)); return d ? structuredClone(d) : null; },
    putDoc: async (kind, id, data) => { docs.set(docKey(kind, id), structuredClone(data)); },
    removeDoc: async (kind, id) => { docs.delete(docKey(kind, id)); },
    hasAsset: async (id) => blobs.has(id),
    readAsset: async (id) => blobs.get(id) ?? null,
    writeAsset: async (id, blob) => { blobs.set(id, blob); },
  };
  const engine = createSync({ store, backend: server.backendFor(), isBusy: busy, newId: () => `copia-${++ids}` });
  return {
    engine, docs, blobs,
    async edit(kind, id, data) { docs.set(docKey(kind, id), data); await engine.markDirty(kind, id); },
    async remove(kind, id) { docs.delete(docKey(kind, id)); await engine.markDirty(kind, id); },
    doc: (kind, id) => docs.get(docKey(kind, id)),
    titles: () => [...docs.values()].map((d) => d.title).sort(),
  };
}
const book = (id, title, extra = {}) => ({ id, title, pages: [], cover: {}, ...extra });

async function pair(server, options) {
  const yo = device(server, options);
  const novia = device(server);
  await yo.engine.connect('c1');
  await novia.engine.connect('c1');
  return { yo, novia };
}

test('una libreta creada en un dispositivo llega al otro', async () => {
  const server = fakeServer();
  const { yo, novia } = await pair(server);
  await yo.edit('book', 'a', book('a', 'Citas 2026'));
  await yo.engine.syncOnce();
  assert.equal(await novia.engine.syncOnce(), true);
  assert.equal(novia.doc('book', 'a').title, 'Citas 2026');
});

test('al conectar por primera vez se suben las libretas de los dos, sin perder ninguna', async () => {
  const server = fakeServer();
  const yo = device(server);
  const novia = device(server);
  yo.docs.set('book/mia', book('mia', 'Mía'));
  novia.docs.set('book/suya', book('suya', 'Suya'));
  await yo.engine.connect('c1');
  await novia.engine.connect('c1');
  await yo.engine.syncOnce();
  await novia.engine.syncOnce();
  await yo.engine.syncOnce();
  assert.deepEqual(yo.titles(), ['Mía', 'Suya']);
  assert.deepEqual(novia.titles(), ['Mía', 'Suya']);
});

test('las ediciones van y vienen, sin rebotar para siempre', async () => {
  const server = fakeServer();
  const { yo, novia } = await pair(server);
  await yo.edit('book', 'a', book('a', 'Uno'));
  await yo.engine.syncOnce();
  await novia.engine.syncOnce();
  await novia.edit('book', 'a', book('a', 'Dos'));
  await novia.engine.syncOnce();
  await yo.engine.syncOnce();
  assert.equal(yo.doc('book', 'a').title, 'Dos');
  assert.equal(await yo.engine.syncOnce(), false, 'ya no hay nada nuevo');
  assert.equal(await novia.engine.syncOnce(), false);
  assert.equal(server.rows.get('book/a').version, 2);
});

test('si los dos editan a la vez se conservan ambas versiones', async () => {
  const server = fakeServer();
  const { yo, novia } = await pair(server);
  await yo.edit('book', 'a', book('a', 'Original'));
  await yo.engine.syncOnce();
  await novia.engine.syncOnce();
  await yo.edit('book', 'a', book('a', 'Lo mío'));
  await novia.edit('book', 'a', book('a', 'Lo suyo'));
  await yo.engine.syncOnce();
  await novia.engine.syncOnce();
  await yo.engine.syncOnce();
  assert.deepEqual(novia.titles(), ['Lo mío', 'Lo suyo (copia)']);
  assert.deepEqual(yo.titles(), ['Lo mío', 'Lo suyo (copia)']);
});

test('una libreta abierta no cambia hasta cerrarla, y lo editado no pisa al otro', async () => {
  const server = fakeServer();
  let open = true;
  const yo = device(server, { busy: (id) => open && id === 'a' });
  const novia = device(server);
  await yo.engine.connect('c1');
  await novia.engine.connect('c1');
  await novia.edit('book', 'a', book('a', 'Base'));
  await novia.engine.syncOnce();
  open = false;
  await yo.engine.syncOnce();
  open = true;
  await novia.edit('book', 'a', book('a', 'Cambio de ella'));
  await novia.engine.syncOnce();
  await yo.engine.syncOnce();
  assert.equal(yo.doc('book', 'a').title, 'Base', 'sigue igual mientras está abierta');
  await yo.edit('book', 'a', book('a', 'Mi edición'));
  await yo.engine.syncOnce();
  assert.equal(server.rows.get('book/a').data.title, 'Cambio de ella', 'no se subió sobre lo de ella');
  open = false;
  await yo.engine.syncOnce();
  await novia.engine.syncOnce();
  await yo.engine.syncOnce();
  assert.deepEqual(yo.titles(), ['Cambio de ella', 'Mi edición (copia)']);
  assert.deepEqual(novia.titles(), ['Cambio de ella', 'Mi edición (copia)']);
});

test('si llega un cambio mientras editas una libreta abierta, tu edición no se pierde', async () => {
  const server = fakeServer();
  let open = false;
  const yo = device(server, { busy: () => open });
  const novia = device(server);
  await yo.engine.connect('c1');
  await novia.engine.connect('c1');
  await novia.edit('book', 'a', book('a', 'Base'));
  await novia.engine.syncOnce();
  await yo.engine.syncOnce();
  open = true;
  await yo.edit('book', 'a', book('a', 'Editando'));
  await novia.edit('book', 'a', book('a', 'Lo de ella'));
  await novia.engine.syncOnce();
  await yo.engine.syncOnce();
  assert.equal(yo.doc('book', 'a').title, 'Editando', 'no cambia mientras está abierta');
  open = false;
  await yo.engine.syncOnce();
  assert.deepEqual(yo.titles(), ['Editando (copia)', 'Lo de ella']);
});

test('una libreta abierta sin editar se actualiza al cerrarla', async () => {
  const server = fakeServer();
  let open = false;
  const yo = device(server, { busy: () => open });
  const novia = device(server);
  await yo.engine.connect('c1');
  await novia.engine.connect('c1');
  await novia.edit('book', 'a', book('a', 'Uno'));
  await novia.engine.syncOnce();
  await yo.engine.syncOnce();
  open = true;
  await novia.edit('book', 'a', book('a', 'Dos'));
  await novia.engine.syncOnce();
  await yo.engine.syncOnce();
  assert.equal(yo.doc('book', 'a').title, 'Uno');
  open = false;
  await yo.engine.syncOnce();
  assert.equal(yo.doc('book', 'a').title, 'Dos');
});

test('borrar llega al otro; si el otro la seguía editando, se conserva', async () => {
  const server = fakeServer();
  const { yo, novia } = await pair(server);
  await yo.edit('book', 'a', book('a', 'Se va'));
  await yo.edit('book', 'b', book('b', 'Se queda'));
  await yo.engine.syncOnce();
  await novia.engine.syncOnce();
  await yo.remove('book', 'a');
  await yo.engine.syncOnce();
  await novia.engine.syncOnce();
  assert.equal(novia.doc('book', 'a'), undefined);
  await yo.remove('book', 'b');
  await novia.edit('book', 'b', book('b', 'Editada'));
  await yo.engine.syncOnce();
  await novia.engine.syncOnce();
  await yo.engine.syncOnce();
  assert.equal(novia.doc('book', 'b').title, 'Editada');
  assert.equal(yo.doc('book', 'b').title, 'Editada');
});

test('las citas también se comparten', async () => {
  const server = fakeServer();
  const { yo, novia } = await pair(server);
  await yo.edit('date', 'c1', { id: 'c1', title: 'Cine', cow: 'cine' });
  await yo.engine.syncOnce();
  await novia.engine.syncOnce();
  assert.equal(novia.doc('date', 'c1').cow, 'cine');
});

test('las fotos viajan con su libreta, y se reintentan si fallan', async () => {
  const server = fakeServer();
  const { yo, novia } = await pair(server);
  yo.blobs.set('foto1', 'BYTES');
  yo.blobs.set('img_abc', 'IMG');
  const withPhotos = book('a', 'Con fotos', { pages: [{ id: 'p1', scan: 'foto1', elements: [{ type: 'photo', src: 'img_abc' }] }] });
  await yo.edit('book', 'a', withPhotos);
  await yo.engine.syncOnce();
  assert.equal(server.assets.get('foto1'), 'BYTES');
  const saved = server.assets.get('foto1');
  server.assets.delete('foto1');
  await novia.engine.syncOnce();
  assert.equal(novia.blobs.has('foto1'), false);
  assert.equal(novia.doc('book', 'a').title, 'Con fotos', 'la libreta llega aunque falte la foto');
  server.assets.set('foto1', saved);
  await novia.engine.syncOnce();
  assert.equal(novia.blobs.get('foto1'), 'BYTES');
  assert.equal(novia.blobs.get('img_abc'), 'IMG');
});

test('sin internet todo queda pendiente y se sube al volver', async () => {
  const server = fakeServer();
  const { yo, novia } = await pair(server);
  await yo.edit('book', 'a', book('a', 'Sin señal'));
  server.offline = true;
  await assert.rejects(yo.engine.syncOnce());
  assert.ok(yo.engine.getState().dirty['book/a']);
  server.offline = false;
  await yo.engine.syncOnce();
  await novia.engine.syncOnce();
  assert.equal(novia.doc('book', 'a').title, 'Sin señal');
  assert.equal(yo.engine.getState().dirty['book/a'], undefined);
});

test('una edición hecha durante la subida no se da por sincronizada', async () => {
  const server = fakeServer();
  const yo = device(server);
  await yo.engine.connect('c1');
  await yo.edit('book', 'a', book('a', 'Uno'));
  const backendPush = server.backendFor().push;
  assert.ok(backendPush);
  const state = yo.engine.getState();
  const mark = state.dirty['book/a'];
  await yo.engine.markDirty('book', 'a');
  assert.notEqual(yo.engine.getState().dirty['book/a'], mark);
});

test('assetsOf encuentra fotos de página, de portada e imágenes', () => {
  const data = { cover: { photoId: 'portada' }, pages: [{ scan: 'hoja' }, { elements: [{ src: 'img_xyz' }] }] };
  assert.deepEqual(assetsOf('book', data).sort(), ['hoja', 'img_xyz', 'portada']);
  assert.deepEqual(assetsOf('date', data), []);
  assert.deepEqual(assetsOf('book', null), []);
});

test('la base de datos protege todo con reglas por pareja', () => {
  const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
  for (const table of ['couples', 'members', 'items']) assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  assert.ok(!/create policy[^;]+for (insert|update|delete)[^;]+public\.items/i.test(sql), 'nadie escribe directo en items');
  assert.match(sql, /pareja_completa/, 'una pareja no admite a una tercera');
  assert.match(sql, /public, false, 20971520|'fotos', false/, 'las fotos no son públicas');
  assert.match(sql, /revoke all on function/);
  assert.match(sql, /current_version <> p_base/, 'detecta ediciones simultáneas');
});

test('la configuración no lleva claves secretas', () => {
  const config = readFileSync(new URL('../js/sync-config.js', import.meta.url), 'utf8');
  const key = config.match(/SUPABASE_ANON_KEY = '([^']*)'/)?.[1] ?? '';
  if (key.startsWith('eyJ')) {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
    assert.equal(payload.role, 'anon', 'jamás la service_role');
  }
  assert.ok(!key.startsWith('sb_secret_'), 'jamás una clave secreta');
});
