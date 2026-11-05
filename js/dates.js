// Las citas registradas. Se guardan aparte de las libretas: borrar una libreta no borra sus citas ni sus vaquitas.
import { deleteMeta, getMeta, getMetaByPrefix, newId, setMeta } from './db.js';
import { nextVaquita } from './vaquitas.js';

const PREFIX = 'cita:';

export const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const longDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
};

// De la más reciente a la más antigua.
export async function listDates() {
  const rows = Object.values(await getMetaByPrefix(PREFIX));
  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

export const dateForPage = async (pageId) => (await listDates()).find((d) => d.pageId === pageId) ?? null;

// Decide qué vaquita ganará la cita, antes de guardarla, para poder pegarla en su página.
export async function chooseVaquita({ date, title, place, ideaSrc }) {
  const dates = await listDates();
  return nextVaquita({
    taken: dates.map((d) => d.cow).filter(Boolean),
    total: dates.length + 1,
    date,
    title,
    place,
    ideaSrc,
    togetherSince: await getMeta('togetherSince'),
  });
}

export async function saveDate({ title, date, place = '', bookId = null, pageId = null, cow = null }) {
  const record = { id: newId(), title, date, place, bookId, pageId, cow, createdAt: Date.now() };
  await setMeta(PREFIX + record.id, record);
  return record;
}

// El disfraz de Muu. Solo cuenta si todavía tienen la vaquita: al borrar su cita, Muu se lo quita.
export const earnedCostumes = async () => (await listDates()).map((d) => d.cow).filter(Boolean);
export async function currentCostume() {
  const id = await getMeta('muuCostume');
  return id && (await earnedCostumes()).includes(id) ? id : null;
}
export const setCostume = (id) => (id ? setMeta('muuCostume', id) : deleteMeta('muuCostume'));

// La vaquita sale de la cita, así que se va con ella.
export const deleteDate = (id) => deleteMeta(PREFIX + id);
