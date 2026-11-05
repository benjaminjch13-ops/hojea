// La lógica de sincronización, sin navegador ni red: `store` guarda lo local y `backend` habla con el servidor.
// Cada documento lleva la versión del servidor; quien edita sobre una versión vieja no pisa al otro.

export const docKey = (kind, id) => `${kind}/${id}`;
const parseKey = (key) => { const i = key.indexOf('/'); return [key.slice(0, i), key.slice(i + 1)]; };
const OVERLAP = 20; // Vuelve a mirar unos cambios atrás: dos guardados casi simultáneos pueden llegar desordenados.

export const emptyState = (couple = null) => ({ couple, cursor: 0, versions: {}, dirty: {}, stale: {}, uploaded: {}, pendingAssets: {} });

// Fotos e imágenes que una libreta necesita para verse completa.
export function assetsOf(kind, data) {
  if (kind !== 'book' || !data) return [];
  const found = new Set();
  for (const page of data.pages ?? []) if (page.scan) found.add(page.scan);
  if (data.cover?.photoId) found.add(data.cover.photoId);
  for (const id of JSON.stringify(data).match(/img_[a-z0-9]+/g) ?? []) found.add(id);
  return [...found];
}

export function createSync({ store, backend, isBusy = () => false, newId, onApplied = () => {} }) {
  let state = emptyState();
  let stamp = 0;

  const load = async () => { state = { ...emptyState(), ...(await store.loadState()) }; return state; };
  const save = () => store.saveState(state);

  const markDirty = async (kind, id) => {
    state.dirty[docKey(kind, id)] = ++stamp + Date.now();
    await save();
  };

  // Al conectar por primera vez, todo lo local se sube.
  const connect = async (couple) => {
    await load();
    if (state.couple === couple) return false;
    state = emptyState(couple);
    for (const [kind, id] of await store.listDocs()) state.dirty[docKey(kind, id)] = ++stamp;
    await save();
    return true;
  };

  const fetchAssets = async (kind, data) => {
    let changed = false;
    for (const asset of assetsOf(kind, data)) {
      if (await store.hasAsset(asset)) continue;
      try {
        await store.writeAsset(asset, await backend.download(asset));
        state.uploaded[asset] = true;
        delete state.pendingAssets[asset];
        changed = true;
      } catch {
        state.pendingAssets[asset] = true; // Se reintenta en la próxima sincronización.
      }
    }
    return changed;
  };

  const applyRemote = async (row) => {
    const key = docKey(row.kind, row.id);
    if (row.deleted) await store.removeDoc(row.kind, row.id);
    else {
      await store.putDoc(row.kind, row.id, row.data);
      await fetchAssets(row.kind, row.data);
    }
    state.versions[key] = row.version;
    delete state.stale[key];
  };

  // Los dos cambiaron lo mismo: en las libretas se conservan ambas versiones, nunca se pierde lo escrito.
  const resolveConflict = async (row) => {
    const key = docKey(row.kind, row.id);
    const local = await store.getDoc(row.kind, row.id);
    if (row.deleted) {
      if (!local) { delete state.dirty[key]; state.versions[key] = row.version; return; }
      state.versions[key] = row.version; // Lo borró el otro, pero aquí se siguió editando: se conserva.
      return;
    }
    if (row.kind === 'book' && local) {
      const copyId = newId();
      await store.putDoc('book', copyId, { ...local, id: copyId, title: `${local.title} (copia)` });
      state.dirty[docKey('book', copyId)] = ++stamp;
    }
    delete state.dirty[key];
    await applyRemote(row);
  };

  const pull = async () => {
    const rows = await backend.pull(Math.max(0, state.cursor - OVERLAP));
    let changed = false;
    for (const row of rows) {
      const key = docKey(row.kind, row.id);
      state.cursor = Math.max(state.cursor, row.seq);
      if (row.version <= (state.versions[key] ?? 0)) continue;
      // Una libreta abierta no cambia bajo los dedos de nadie: se actualiza al cerrarla.
      if (row.kind === 'book' && isBusy(row.id)) { state.stale[key] = true; continue; }
      if (state.dirty[key]) { await resolveConflict(row); changed = true; continue; }
      await applyRemote(row);
      changed = true;
    }
    return changed;
  };

  const refreshStale = async () => {
    let changed = false;
    for (const key of Object.keys(state.stale)) {
      const [kind, id] = parseKey(key);
      if (isBusy(id)) continue;
      const row = await backend.fetchOne(kind, id);
      if (!row) { delete state.stale[key]; continue; }
      if (state.dirty[key]) await resolveConflict(row);
      else await applyRemote(row);
      changed = true;
    }
    return changed;
  };

  const uploadAssets = async (kind, data) => {
    for (const asset of assetsOf(kind, data)) {
      if (state.uploaded[asset]) continue;
      const blob = await store.readAsset(asset);
      if (!blob) continue; // Otro dispositivo aún debe subirla.
      await backend.upload(asset, blob);
      state.uploaded[asset] = true;
    }
  };

  const push = async () => {
    let changed = false;
    for (const [key, mark] of Object.entries(state.dirty)) {
      const [kind, id] = parseKey(key);
      if (kind === 'book' && isBusy(id)) continue; // Se sube al cerrarla, con todo lo que se editó.
      const data = await store.getDoc(kind, id);
      await uploadAssets(kind, data);
      const result = await backend.push({ kind, id, data, base: state.versions[key] ?? 0, deleted: !data });
      if (result.conflict) {
        const row = await backend.fetchOne(kind, id);
        if (row) { await resolveConflict(row); changed = true; }
        continue;
      }
      state.versions[key] = result.version;
      if (state.dirty[key] === mark) delete state.dirty[key];
    }
    return changed;
  };

  const retryAssets = async () => {
    let changed = false;
    const pending = Object.keys(state.pendingAssets);
    for (const asset of pending) {
      try {
        await store.writeAsset(asset, await backend.download(asset));
        delete state.pendingAssets[asset];
        state.uploaded[asset] = true;
        changed = true;
      } catch { /* sigue pendiente */ }
    }
    return changed;
  };

  // Una vuelta completa. Devuelve si cambió algo que la pantalla deba volver a mostrar.
  const syncOnce = async () => {
    let changed = await pull();
    changed = (await refreshStale()) || changed;
    changed = (await push()) || changed;
    changed = (await retryAssets()) || changed;
    await save();
    if (changed) onApplied();
    return changed;
  };

  return { load, connect, markDirty, syncOnce, getState: () => state };
}
