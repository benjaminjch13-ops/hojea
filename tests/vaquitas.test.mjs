import test from 'node:test';
import assert from 'node:assert/strict';
import { SERIES, VAQUITAS, TOTAL_VAQUITAS, nextVaquita, seriesOf, vaquitaCard, vaquitaCow } from '../js/vaquitas.js';

const ids = VAQUITAS.map((v) => v.id);
const regularIds = VAQUITAS.filter((v) => !v.special).map((v) => v.id);

test('una vaquita con lugar de otro país gana a su viajera, sin importar los acentos', () => {
  assert.equal(nextVaquita({ place: 'París' }), 'francia');
  assert.equal(nextVaquita({ place: 'Tokio, JAPÓN' }), 'japon');
  assert.equal(nextVaquita({ place: 'Cancún' }), 'mexico');
  assert.equal(nextVaquita({ place: 'Antigua' }), 'chapina', 'en Guatemala sigue la chapina');
  assert.equal(nextVaquita({ place: 'París', taken: ['francia'] }), 'chapina', 'cada viajera se gana una vez');
  assert.notEqual(nextVaquita({ place: 'Limón' }), 'peru', 'no confunde palabras parecidas');
});

test('hay una sola vaquita de Guatemala y viajeras de otros países', () => {
  assert.equal(VAQUITAS.filter((v) => /guatemala/i.test(v.theme)).length, 1);
  assert.equal(VAQUITAS.filter((v) => v.places).length, 19);
});

test('el tema de la cita elige la serie, y las series tienen su número', () => {
  assert.equal(nextVaquita({ title: 'Cena romántica' }), 'helado');
  assert.equal(nextVaquita({ title: 'Fuimos al cine' }), 'cine', 'si nombra a una vaquita, gana esa');
  assert.equal(nextVaquita({ title: 'Fuimos al cine', taken: ['cine'] }), 'navidad', 'si ya la tienen, otra de su serie');
  assert.equal(nextVaquita({ title: 'Caminata' }), 'astronauta', 'sin tema, sigue el orden');
  const count = (s) => VAQUITAS.filter((v) => seriesOf(v) === s).length;
  assert.deepEqual(SERIES.map(([s]) => count(s)), [19, 20, 15, 15, 15, 15, 1]);
});

test('Muu Dorada llega al final, cuando no queda ninguna otra', () => {
  const others = ids.filter((id) => id !== 'dorada');
  assert.equal(nextVaquita({ taken: others, total: 99 }), 'dorada');
  assert.notEqual(nextVaquita({ taken: others.slice(1), total: 98 }), 'dorada');
});

test('hay 100 vaquitas distintas, todas dibujadas', () => {
  assert.equal(TOTAL_VAQUITAS, 100);
  assert.equal(new Set(ids).size, 100);
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
