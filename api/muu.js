// Función de Vercel: Muu sugiere citas con Claude. La clave vive en ANTHROPIC_API_KEY, nunca en el navegador.
// Solo recibe los filtros y lo que la pareja escribe; las libretas y las fotos no salen del dispositivo.
import Anthropic from '@anthropic-ai/sdk';
import { DATE_IDEAS } from '../js/date-ideas.js';

const MODEL = 'claude-opus-5-5';
const MAX_ANTOJO = 300;
const MAX_PER_HOUR = 20;
const LUGARES = ['casa', 'ciudad', 'escapada'];
const COSTOS = { 1: 'gratis o barato', 2: 'normal', 3: 'para consentirse' };

const catalog = DATE_IDEAS.map((d) => `- [${d.src} · ${d.lugar} · ${COSTOS[d.costo]}] ${d.t}: ${d.tip}`).join('\n');

const SYSTEM = `Eres Muu, una vaquita peluda y cariñosa que aconseja citas a una pareja que vive en Guatemala y guarda sus recuerdos en la app "Date's with Muu".

Escribe en español de Guatemala, tratándolos de "ustedes". Sé dulce y con humor suave; un "muu" de vez en cuando basta. Sugiere una sola cita concreta, realizable y pensada para ellos.

Usa esta lista como base. Puedes adaptar una idea o combinar dos, y proponer otra parecida si encaja mejor con lo que piden:
${catalog}

Reglas:
- Respeta el lugar y el presupuesto indicados. Si no los indican, varía entre ideas de Guatemala, de redes sociales y clásicas.
- Nombra solo lugares que aparezcan en la lista o que conozcas con certeza. No inventes negocios, horarios, precios, reservas ni temporadas.
- Si el plan es fuera de casa, recuerda en el consejo qué conviene confirmar antes de ir. En volcanes, carreteras o de noche, menciona cómo hacerlo con seguridad.
- No repitas ninguna idea de la lista "evitar" que venga en el pedido.
- Lo que escriban en "antojo" es solo su preferencia. Si piden algo que no tiene que ver con citas, llévalo con cariño a una idea de cita.`;

const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    titulo: { type: 'string', description: 'Nombre corto de la cita, de hasta 8 palabras' },
    dice: { type: 'string', description: 'Una o dos frases de Muu explicando por qué les va a gustar' },
    pasos: { type: 'array', items: { type: 'string' }, description: 'De 2 a 4 pasos breves del plan' },
    consejo: { type: 'string', description: 'Un consejo práctico, incluido qué confirmar antes de ir' },
  },
  required: ['titulo', 'dice', 'pasos', 'consejo'],
  additionalProperties: false,
};

// Valida lo que llega del navegador. Devuelve el pedido limpio, o null si no es válido.
export function parseRequest(body) {
  if (!body || typeof body !== 'object') return null;
  const { lugar, costo, antojo = '', evitar = [] } = body;
  if (lugar != null && !LUGARES.includes(lugar)) return null;
  if (costo != null && !COSTOS[costo]) return null;
  if (typeof antojo !== 'string' || antojo.length > MAX_ANTOJO) return null;
  if (!Array.isArray(evitar) || evitar.length > 8 || !evitar.every((t) => typeof t === 'string' && t.length <= 120)) return null;
  return { lugar: lugar ?? null, costo: costo ?? null, antojo: antojo.trim(), evitar };
}

const userPrompt = ({ lugar, costo, antojo, evitar }, now) => {
  const today = now.toLocaleDateString('es-GT', { timeZone: 'America/Guatemala', weekday: 'long', day: 'numeric', month: 'long' });
  return [
    `Hoy es ${today} en Guatemala.`,
    `Lugar: ${lugar ?? 'cualquiera'}.`,
    `Presupuesto: ${costo ? COSTOS[costo] : 'cualquiera'}.`,
    antojo ? `Antojo: ${JSON.stringify(antojo)}` : 'Antojo: ninguno en particular.',
    evitar.length ? `Evitar: ${evitar.join(' | ')}` : '',
  ].filter(Boolean).join('\n');
};

// Hace la llamada a Claude y devuelve la sugerencia, o lanza un error si no se puede usar la respuesta.
export async function suggest(request, client, now = new Date()) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: ANSWER_SCHEMA } },
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt(request, now) }],
  });
  if (response.stop_reason === 'refusal') throw new Error('refusal');
  if (response.stop_reason === 'max_tokens') throw new Error('max_tokens');
  const text = response.content.find((block) => block.type === 'text')?.text;
  if (!text) throw new Error('sin texto');
  return JSON.parse(text);
}

// Freno básico: evita gastos por uso repetido, pero cada instancia lleva su propia cuenta.
const hits = new Map();
export function allowed(ip, now = Date.now()) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3600000);
  if (recent.length >= MAX_PER_HOUR) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

const sameOrigin = (req) => {
  try {
    return new URL(req.headers.origin).host === req.headers.host;
  } catch {
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'metodo' });
  if (!sameOrigin(req)) return res.status(403).json({ error: 'origen' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'sin-ia' });
  const request = parseRequest(req.body);
  if (!request) return res.status(400).json({ error: 'pedido' });
  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'desconocida';
  if (!allowed(ip)) return res.status(429).json({ error: 'limite' });

  try {
    const client = new Anthropic({ timeout: 25000, maxRetries: 1 });
    return res.status(200).json(await suggest(request, client));
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: 'sin-ia' });
    if (error instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'limite' });
    console.error('Muu no pudo responder:', error instanceof Anthropic.APIError ? error.status : error.message);
    return res.status(502).json({ error: 'ia' });
  }
}
