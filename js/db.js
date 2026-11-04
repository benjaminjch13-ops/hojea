// Almacenamiento local en IndexedDB. Las fotos se guardan como Blob, nunca salen del dispositivo.
const DB_NAME = 'hojea';
const DB_VERSION = 1;
let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('books', { keyPath: 'id' });
        db.createObjectStore('pages', { keyPath: 'id' });
        db.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(store, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const newId = () => crypto.randomUUID();

export async function listBooks() {
  const books = await run('books', 'readonly', (s) => s.getAll());
  return books.sort((a, b) => b.createdAt - a.createdAt);
}
export const getBook = (id) => run('books', 'readonly', (s) => s.get(id));
export const saveBook = (book) => run('books', 'readwrite', (s) => s.put(book));

export async function addPage(blob, w, h) {
  const id = newId();
  await run('pages', 'readwrite', (s) => s.put({ id, blob }));
  return { id, w, h };
}

const getPageRecord = (id) => run('pages', 'readonly', (s) => s.get(id));
export const getPageBlob = async (id) => (await getPageRecord(id))?.blob ?? null;

export async function deletePage(id) {
  await run('pages', 'readwrite', (s) => s.delete(id));
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(await url);
    urlCache.delete(id);
  }
}

export async function deleteBook(book) {
  await Promise.all(book.pages.map((p) => deletePage(p.id)));
  await run('books', 'readwrite', (s) => s.delete(book.id));
}

// Las URLs de objeto se reutilizan para no decodificar la misma foto varias veces.
const urlCache = new Map();
export function getPageUrl(id) {
  if (!urlCache.has(id)) {
    urlCache.set(id, getPageBlob(id).then((blob) => (blob ? URL.createObjectURL(blob) : '')));
  }
  return urlCache.get(id);
}

export const getMeta = async (key) => (await run('meta', 'readonly', (s) => s.get(key)))?.value;
export const setMeta = (key, value) => run('meta', 'readwrite', (s) => s.put({ key, value }));
