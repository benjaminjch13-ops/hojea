// Pide una sugerencia de cita a la IA. Si no se puede, responde con la lista propia de Muu y lo dice.
import { pickIdea } from './date-ideas.js';

const TIMEOUT_MS = 30000;

const validAnswer = (a) => a && typeof a.titulo === 'string' && a.titulo && typeof a.dice === 'string'
  && Array.isArray(a.pasos) && a.pasos.every((p) => typeof p === 'string') && typeof a.consejo === 'string';

function fromList(filters, seenIds, reason) {
  const idea = pickIdea(filters, seenIds);
  return { titulo: idea.t, dice: '', pasos: [], consejo: idea.tip, src: idea.src, id: idea.id, source: 'lista', reason };
}

// seenTitles evita que la IA repita lo que ya sugirió en esta sesión.
export async function askMuu({ lugar, costo, antojo }, seenIds = [], seenTitles = []) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('/api/muu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lugar, costo, antojo, evitar: seenTitles.slice(-8) }),
      signal: controller.signal,
    });
    if (!res.ok) return fromList({ lugar, costo }, seenIds, res.status === 503 || res.status === 404 ? 'sin-ia' : 'error');
    const answer = await res.json();
    if (!validAnswer(answer)) return fromList({ lugar, costo }, seenIds, 'error');
    return { ...answer, source: 'ia' };
  } catch {
    return fromList({ lugar, costo }, seenIds, navigator.onLine === false ? 'sin-conexion' : 'error');
  } finally {
    clearTimeout(timer);
  }
}
