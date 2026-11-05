import test from 'node:test';
import assert from 'node:assert/strict';
import { VAQUITAS, TOTAL_VAQUITAS, nextVaquita, vaquitaCard, vaquitaCow } from '../js/vaquitas.js';

const ids = VAQUITAS.map((v) => v.id);
const regularIds = VAQUITAS.filter((v) => !v.special).map((v) => v.id);

test('hay 20 vaquitas distintas, todas dibujadas', () => {
  assert.equal(TOTAL_VAQUITAS, 20);
  assert.equal(new Set(ids).size, 20);
  for (const id of ids) {
    const card = vaquitaCard(id);
    const sticker = vaquitaCow(id);
    assert.ok(!/undefined|NaN/.test(card + sticker), id);
    assert.ok(card.includes('viewBox="0 0 120 120"'), id);
  }
});

test('la silueta no muestra el fondo ni el nombre', () => {
  const locked = vaquitaCard('astronauta', { locked: true });
  assert.ok(locked.includes('is-locked'));
  assert.ok(!locked.includes('Astro Muu'));
  assert.ok(!locked.includes('#1B2145'), 'sin fondo del espacio');
});

test('las citas normales ganan las vaquitas en orden, sin repetir', () => {
  assert.equal(nextVaquita({ taken: [], total: 1 }), regularIds[0]);
  assert.equal(nextVaquita({ taken: [regularIds[0]], total: 2 }), regularIds[1]);
});

test('las metas llegan al alcanzar su número de citas', () => {
  assert.equal(nextVaquita({ taken: regularIds.slice(0, 9), total: 10 }), 'campeona');
  assert.equal(nextVaquita({ taken: ['campeona'], total: 25 }), 'estrella');
  assert.equal(nextVaquita({ taken: ['campeona', 'estrella'], total: 50 }), 'reina');
  assert.notEqual(nextVaquita({ taken: [], total: 9 }), 'campeona');
});

test('una cita en su aniversario gana a Muu Enamorada', () => {
  const since = '2024-09-23';
  assert.equal(nextVaquita({ date: '2026-09-23', togetherSince: since }), 'enamorada');
  assert.notEqual(nextVaquita({ date: '2026-09-24', togetherSince: since }), 'enamorada');
  assert.notEqual(nextVaquita({ date: since, togetherSince: since }), 'enamorada', 'el mismo día que empezaron no es aniversario');
  assert.notEqual(nextVaquita({ date: '2026-09-23' }), 'enamorada', 'sin fecha guardada');
});

test('una cita de Guatemala o con lugar gana a Muu Chapina una sola vez', () => {
  assert.equal(nextVaquita({ ideaSrc: 'guatemala' }), 'chapina');
  assert.equal(nextVaquita({ place: 'Antigua' }), 'chapina');
  assert.notEqual(nextVaquita({ place: '   ' }), 'chapina');
  assert.notEqual(nextVaquita({ taken: ['chapina'], place: 'Antigua' }), 'chapina');
});

test('sin vaquitas disponibles, la cita igual se registra sin vaquita', () => {
  assert.equal(nextVaquita({ taken: ids, total: 60 }), null);
});
