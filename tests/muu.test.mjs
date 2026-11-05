import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DATE_IDEAS, SOURCE_LABELS, pickIdea } from '../js/date-ideas.js';
import { MUU_BREEDS, MUU_PINK, muuBreedHead, muuHead, muuMascotHTML, muuSittingInner } from '../js/cow.js';
import { allowed, parseRequest, suggest } from '../api/muu.js';

const fakeClient = (response, calls = []) => ({
  beta: { messages: { create: async (params) => { calls.push(params); return response; } } },
});
const answer = { titulo: 'Picnic', dice: 'Muu', pasos: ['Uno', 'Dos'], consejo: 'Confirmen' };
const okResponse = { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify(answer) }] };

test('las ideas vienen de las tres fuentes pedidas y no se repiten', () => {
  for (const src of ['guatemala', 'internet', 'clasica']) {
    assert.ok(DATE_IDEAS.filter((d) => d.src === src).length >= 10, src);
  }
  assert.equal(new Set(DATE_IDEAS.map((d) => d.id)).size, DATE_IDEAS.length);
  for (const d of DATE_IDEAS) {
    assert.ok(SOURCE_LABELS[d.src] && d.t && d.tip && ['casa', 'ciudad', 'escapada'].includes(d.lugar) && [1, 2, 3].includes(d.costo), d.id);
  }
});

test('pickIdea respeta los filtros, evita lo visto y nunca se queda sin idea', () => {
  const inHouse = DATE_IDEAS.filter((d) => d.lugar === 'casa' && d.costo === 1);
  assert.ok(inHouse.some((d) => d.id === pickIdea({ lugar: 'casa', costo: 1 }, [], () => 0).id));
  const skipped = inHouse[0].id;
  assert.notEqual(pickIdea({ lugar: 'casa', costo: 1 }, [skipped], () => 0).id, skipped);
  assert.ok(pickIdea({ lugar: 'casa', costo: 1 }, DATE_IDEAS.map((d) => d.id), () => 0), 'todas vistas');
  assert.ok(pickIdea({ lugar: 'casa', costo: 3 }, [], () => 0), 'combinación sin ideas');
});

test('el pedido a la IA se valida', () => {
  assert.deepEqual(parseRequest({ lugar: 'casa', costo: 1, antojo: ' algo rico ' }), { lugar: 'casa', costo: 1, antojo: 'algo rico', evitar: [] });
  assert.ok(parseRequest({}));
  assert.equal(parseRequest({ lugar: 'luna' }), null);
  assert.equal(parseRequest({ costo: 9 }), null);
  assert.equal(parseRequest({ antojo: 'x'.repeat(301) }), null);
  assert.equal(parseRequest({ evitar: 'todo' }), null);
  assert.equal(parseRequest(null), null);
});

test('suggest pide JSON y lee la respuesta de la IA', async () => {
  const calls = [];
  const result = await suggest(parseRequest({ lugar: 'ciudad', antojo: 'café', evitar: ['Karaoke'] }), fakeClient(okResponse, calls));
  assert.deepEqual(result, answer);
  const [params] = calls;
  assert.equal(params.model, 'claude-opus-5-5');
  assert.equal(params.fallbacks, 'default');
  assert.equal(params.output_config.format.type, 'json_schema');
  assert.match(params.system[0].text, /Guatemala/);
  assert.match(params.messages[0].content, /Lugar: ciudad/);
  assert.match(params.messages[0].content, /café/);
  assert.match(params.messages[0].content, /Karaoke/);
});

test('suggest falla si la IA se niega, se corta o responde mal', async () => {
  const bad = [
    { stop_reason: 'refusal', content: [] },
    { stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"titulo"' }] },
    { stop_reason: 'end_turn', content: [] },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'no es json' }] },
  ];
  for (const response of bad) await assert.rejects(suggest(parseRequest({}), fakeClient(response)));
});

test('el freno limita los pedidos por hora de cada dirección', () => {
  const ip = `prueba-${Math.random()}`;
  for (let i = 0; i < 20; i++) assert.equal(allowed(ip, 1000), true);
  assert.equal(allowed(ip, 1000), false);
  assert.equal(allowed(ip, 1000 + 3600001), true);
});

test('Muu sentada usa la cara y el pelaje del color elegido', () => {
  for (const b of MUU_BREEDS) {
    const body = muuSittingInner(b.id);
    assert.ok(body.includes(muuBreedHead(b.id)), `${b.id}: cara`);
    assert.ok(!/undefined|NaN/.test(body), `${b.id}: dibujo completo`);
  }
  assert.ok(muuMascotHTML(muuSittingInner('negra')).includes(muuSittingInner('negra')), 'la mascota muestra su dibujo');
  assert.ok(muuMascotHTML('x', true).includes('has-costume'), 'avisa si lleva disfraz');
  assert.equal(muuSittingInner('otra'), muuSittingInner('rosa'), 'un color desconocido vuelve a Muu rosa');
});

test('Muu cambia de color, pero el ícono de la app sigue rosa', () => {
  assert.ok(MUU_BREEDS.length >= 6);
  assert.equal(new Set(MUU_BREEDS.map((b) => muuBreedHead(b.id))).size, MUU_BREEDS.length, 'cada color se dibuja distinto');
  assert.equal(muuBreedHead(undefined), muuHead(), 'sin elegir, es Muu rosa');
  assert.equal(muuBreedHead('otra'), muuHead(), 'un color desconocido vuelve a Muu rosa');
  const icon = readFileSync(new URL('../icons/icon.svg', import.meta.url), 'utf8');
  assert.ok(icon.includes(MUU_PINK), 'ícono');
  assert.ok(!icon.includes('#b8703a'), 'el ícono no usa el café');
});
