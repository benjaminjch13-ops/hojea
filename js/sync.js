// Conecta la sincronización con el navegador: cuenta de Supabase, base de datos local y avisos a la pantalla.
import {
  getBook, getMeta, getMetaByPrefix, getPageBlob, listBooks, onLocalChange, putBookRaw, putMetaRaw, putPageBlob, removeBookRaw, removeMetaRaw, hasPageBlob, newId,
} from './db.js';
import { addSyncedImage, getSyncedImage, forgetScan } from './delulu.js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './sync-config.js';
import { createSync } from './sync-core.js';

const DATE_PREFIX = 'cita:';
const SHARED_META = ['togetherSince'];
const BUCKET = 'fotos';
const DEBOUNCE_MS = 2500;

export const syncConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

let client = null;
let couple = null;
let engine = null;
let channel = null;
let timer = null;
let running = false;
let again = false;
let status = 'off';
let lastSync = null;
let lastError = null;

const setStatus = (next) => {
  status = next;
  dispatchEvent(new CustomEvent('muu:sync-status', { detail: next }));
};
export const syncInfo = () => ({ status, lastSync, lastError, couple });

// ---------- Cliente ----------
function loadScript() {
  if (window.supabase) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = 'js/supabase-client.js';
    tag.onload = resolve;
    tag.onerror = () => reject(new Error('No se pudo cargar Supabase'));
    document.head.append(tag);
  });
}

async function getClient() {
  if (!client) {
    await loadScript();
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return client;
}

// ---------- Datos locales, tal como los ve el motor ----------
const dataUrlToBlob = async (url) => (await fetch(url)).blob();
const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});
const isImage = (id) => id.startsWith('img_');

const store = {
  loadState: () => getMeta('sync:state'),
  saveState: (state) => putMetaRaw('sync:state', state),
  async listDocs() {
    const books = (await listBooks()).map((b) => ['book', b.id]);
    const dates = Object.keys(await getMetaByPrefix(DATE_PREFIX)).map((id) => ['date', id]);
    const metas = [];
    for (const key of SHARED_META) if ((await getMeta(key)) != null) metas.push(['meta', key]);
    return [...books, ...dates, ...metas];
  },
  async getDoc(kind, id) {
    if (kind === 'book') return (await getBook(id)) ?? null;
    if (kind === 'date') return (await getMeta(DATE_PREFIX + id)) ?? null;
    const value = await getMeta(id);
    return value == null ? null : { value };
  },
  async putDoc(kind, id, data) {
    if (kind === 'book') return putBookRaw(data);
    if (kind === 'date') return putMetaRaw(DATE_PREFIX + id, data);
    return putMetaRaw(id, data.value);
  },
  async removeDoc(kind, id) {
    if (kind === 'book') return removeBookRaw(id);
    if (kind === 'date') return removeMetaRaw(DATE_PREFIX + id);
    return removeMetaRaw(id);
  },
  hasAsset: async (id) => (isImage(id) ? !!getSyncedImage(id) : hasPageBlob(id)),
  async readAsset(id) {
    if (!isImage(id)) return getPageBlob(id);
    const url = getSyncedImage(id);
    return url ? dataUrlToBlob(url) : null;
  },
  async writeAsset(id, blob) {
    if (isImage(id)) return addSyncedImage(id, await blobToDataUrl(blob));
    await putPageBlob(id, blob);
    return forgetScan(id);
  },
};

const assetPath = (id) => `${couple}/${id}`;
const rowFrom = (r) => ({ kind: r.kind, id: r.id, data: r.data, version: r.version, deleted: r.deleted, seq: r.seq });
const raise = (error) => { if (error) throw error; };

const backend = {
  async pull(after) {
    const rows = [];
    for (let page = 0; ; page += 1) {
      const { data, error } = await client.from('items').select('kind,id,data,version,deleted,seq')
        .gt('seq', after).order('seq').range(page * 200, page * 200 + 199);
      raise(error);
      rows.push(...data.map(rowFrom));
      if (data.length < 200) return rows;
    }
  },
  async fetchOne(kind, id) {
    const { data, error } = await client.from('items').select('kind,id,data,version,deleted,seq').eq('kind', kind).eq('id', id).maybeSingle();
    raise(error);
    return data ? rowFrom(data) : null;
  },
  async push({ kind, id, data, base, deleted }) {
    const { data: result, error } = await client.rpc('push_item', { p_kind: kind, p_id: id, p_data: data, p_base: base, p_deleted: deleted });
    raise(error);
    return result;
  },
  async upload(id, blob) {
    const { error } = await client.storage.from(BUCKET).upload(assetPath(id), blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
    raise(error);
  },
  async download(id) {
    const { data, error } = await client.storage.from(BUCKET).download(assetPath(id));
    raise(error);
    return data;
  },
};

// ---------- Ciclo ----------
// Una libreta abierta en cualquier pantalla no se reemplaza hasta salir de ella.
const isBusy = (id) => location.hash.includes(id);

async function runSync() {
  if (!engine || !couple || !client) return;
  if (running) { again = true; return; }
  running = true;
  try {
    // Sin sesión no se sube nada, pero lo editado queda anotado para cuando vuelvan a entrar.
    const { data } = await client.auth.getSession();
    if (!data.session) { setStatus('off'); return; }
    setStatus('syncing');
    await engine.syncOnce();
    lastSync = Date.now();
    lastError = null;
    setStatus('synced');
  } catch (error) {
    console.warn('Sincronización pendiente:', error);
    lastError = error.message ?? String(error);
    setStatus(navigator.onLine === false ? 'offline' : 'error');
  } finally {
    running = false;
    if (again) { again = false; schedule(500); }
  }
}
export const syncNow = () => runSync();

function schedule(delay = DEBOUNCE_MS) {
  clearTimeout(timer);
  timer = setTimeout(runSync, delay);
}

function subscribe() {
  channel?.unsubscribe();
  channel = client.channel('cambios').on('postgres_changes', {
    event: '*', schema: 'public', table: 'items', filter: `couple_id=eq.${couple}`,
  }, () => schedule(400)).subscribe();
}

async function startEngine(coupleId) {
  await getClient();
  couple = coupleId;
  engine = createSync({
    store, backend, isBusy, newId, onApplied: () => dispatchEvent(new CustomEvent('muu:synced')),
  });
  await engine.connect(coupleId);
  subscribe();
  await runSync();
}

// Cambios hechos en este dispositivo.
onLocalChange(async ({ kind, id }) => {
  if (!engine) return;
  await engine.markDirty(kind, id);
  schedule();
});

// ---------- Cuenta y pareja ----------
const messageFor = (error) => {
  const text = error?.message ?? '';
  if (/Invalid login/i.test(text)) return 'El correo o la contraseña no coinciden.';
  if (/already registered/i.test(text)) return 'Ese correo ya tiene cuenta. Entra con tu contraseña.';
  if (/at least|Password should/i.test(text)) return 'La contraseña necesita al menos 6 caracteres.';
  if (/codigo_invalido/.test(text)) return 'Ese código no existe. Revísalo y vuelve a intentar.';
  if (/pareja_completa/.test(text)) return 'Esa pareja ya tiene a sus dos personas.';
  if (/ya_tiene_pareja/.test(text)) return 'Esta cuenta ya está unida a una pareja.';
  if (/Failed to fetch|NetworkError/i.test(text)) return 'No hay conexión. Vuelve a intentar cuando tengas internet.';
  return 'No se pudo completar. Vuelve a intentar.';
};
export const syncError = messageFor;

export async function currentAccount() {
  const c = await getClient();
  const { data } = await c.auth.getSession();
  const user = data.session?.user ?? null;
  if (!user) return { user: null, membership: null };
  const { data: mine, error } = await c.from('members').select('couple_id').eq('user_id', user.id).maybeSingle();
  raise(error);
  if (!mine) return { user, membership: null };
  const { data: info, error: infoError } = await c.from('couples').select('invite_code').eq('id', mine.couple_id).single();
  raise(infoError);
  const { count } = await c.from('members').select('user_id', { count: 'exact', head: true });
  return { user, membership: { couple_id: mine.couple_id, invite_code: info.invite_code, member_count: count ?? 1 } };
}

export async function signIn(email, password) {
  const c = await getClient();
  const { error } = await c.auth.signInWithPassword({ email, password });
  raise(error);
  await resume();
}

export async function signUp(email, password) {
  const c = await getClient();
  const { data, error } = await c.auth.signUp({ email, password });
  raise(error);
  return { needsConfirmation: !data.session };
}

export async function signOut() {
  const c = await getClient();
  channel?.unsubscribe();
  channel = null;
  // El motor sigue anotando lo que se edite, para subirlo al volver a entrar.
  await c.auth.signOut();
  setStatus('off');
}

export async function createCouple() {
  const c = await getClient();
  const { data, error } = await c.rpc('create_couple');
  raise(error);
  await startEngine(data[0].couple_id);
  return data[0];
}

export async function joinCouple(code) {
  const c = await getClient();
  const { data, error } = await c.rpc('join_couple', { code });
  raise(error);
  await startEngine(data[0].couple_id);
  return data[0];
}

async function resume() {
  const { membership } = await currentAccount();
  if (membership) await startEngine(membership.couple_id);
  else setStatus('off');
}

// Arranca al abrir la app. Sin conexión o sin cuenta, la app funciona igual que siempre.
export async function initSync() {
  addEventListener('online', () => schedule(200));
  addEventListener('hashchange', () => schedule(800));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(300); });
  if (!syncConfigured()) return;
  try {
    // Quien ya se conectó antes sincroniza sin pedir nada a la red, y lo editado sin internet queda anotado.
    const known = (await getMeta('sync:state'))?.couple;
    if (known) await startEngine(known);
    else await resume();
  } catch (error) {
    console.warn('Sin sincronizar por ahora:', error);
    setStatus(navigator.onLine === false ? 'offline' : 'error');
  }
}
