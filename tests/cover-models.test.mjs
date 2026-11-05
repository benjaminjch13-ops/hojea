import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COVER_MODELS, backFaceHTML, bandHTML, charmsHTML, coverDefaults, coverFaceHTML, hasNoElastic, isSoftModel, miniBookHTML, modelClass, softClosureFor, softTitleFor, surpriseCover,
} from '../js/cover.js';

// Las portadas pintan su textura en un canvas; aquí basta con uno de mentira.
const context = new Proxy({}, {
  get: (_, name) => (name === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {}),
  set: () => true,
});
globalThis.document = {
  createElement: () => ({ getContext: () => context, toDataURL: () => 'data:image/jpeg;base64,' }),
  documentElement: { style: { setProperty: () => {} } },
};

const book = (model) => ({ id: 'x', title: 'Citas 2026', aspect: 0.72, pages: [], cover: { ...coverDefaults(), model } });
const SOFT = ['almohadita', 'cosida', 'acolchada'];

test('hay cinco modelos, con la versión 1 todavía disponible', () => {
  assert.deepEqual(COVER_MODELS.map(([id]) => id), [...SOFT, 'delulu', 'clasica']);
  for (const id of SOFT) assert.equal(isSoftModel(id), true);
  for (const id of ['delulu', 'clasica', undefined]) assert.equal(isSoftModel(id), false);
});

test('los modelos de la versión 1 se dibujan como siempre', () => {
  assert.equal(coverDefaults().model, 'delulu', 'las libretas nuevas no cambian solas');
  assert.ok(coverFaceHTML(book('delulu')).includes('lea-flap'));
  assert.ok(coverFaceHTML(book('clasica')).includes('lea-stitch'));
  assert.equal(modelClass('delulu'), '');
  assert.ok(bandHTML(book('delulu').cover).includes('lea-band outer'));
  assert.ok(!miniBookHTML(book('clasica')).includes('model-soft'));
});

test('cada modelo suave se dibuja completo, por fuera y por detrás', () => {
  for (const id of SOFT) {
    const b = book(id);
    const html = [coverFaceHTML(b), backFaceHTML(b), bandHTML(b.cover), charmsHTML(b.cover), miniBookHTML(b)].join('');
    assert.ok(!/undefined|NaN/.test(html), id);
    assert.ok(miniBookHTML(b).includes(`model-${id}`), id);
  }
  assert.ok(coverFaceHTML(book('almohadita')).includes('lea-puff'));
  assert.ok(coverFaceHTML(book('cosida')).includes('lea-stitch soft'));
  assert.ok(coverFaceHTML(book('acolchada')).includes('lea-quilt'));
});

test('cada modelo cierra a su manera', () => {
  assert.ok(bandHTML(book('almohadita').cover).includes('lea-band outer'), 'elástico');
  assert.ok(bandHTML(book('cosida').cover).includes('lea-clasp'), 'broche');
  assert.ok(bandHTML(book('acolchada').cover).includes('lea-bow'), 'moño');
  assert.equal(hasNoElastic('almohadita'), false);
  assert.ok(!backFaceHTML(book('cosida')).includes('lea-band'), 'el broche no da la vuelta');
});

test('sobre una etiqueta, el título siempre se puede leer', () => {
  for (const id of ['cosida', 'acolchada']) {
    const b = book(id);
    b.cover.title.fx = 'dorado';
    const face = coverFaceHTML(b);
    assert.ok(face.includes('on-label'), id);
    assert.ok(!face.includes('background-clip'), `${id}: sin el efecto metálico`);
  }
});

test('un elástico elegido se respeta al cambiar de modelo', () => {
  const base = coverDefaults().elastic;
  assert.equal(softClosureFor('almohadita', base).color, '#FFF8EF', 'el de fábrica toma el tono suave');
  const mine = { ...base, color: '#7F3A3C' };
  assert.equal(softClosureFor('acolchada', mine).color, '#7F3A3C');
  assert.deepEqual(softClosureFor('delulu', base), base);
});

test('al estrenar Almohadita, un título grabado pasa a uno que se lee', () => {
  const title = coverDefaults().title;
  assert.equal(softTitleFor('almohadita', title, '#6E4127').fx, 'impreso');
  assert.equal(softTitleFor('almohadita', title, '#6E4127').color, '#FFF8EF', 'claro sobre cuero oscuro');
  assert.equal(softTitleFor('almohadita', title, '#F6CAD2').color, '#54433D', 'oscuro sobre pastel');
  assert.equal(softTitleFor('almohadita', { ...title, fx: 'dorado' }, '#6E4127').fx, 'dorado', 'respeta el que ya eligieron');
  assert.equal(softTitleFor('delulu', title, '#6E4127').fx, title.fx);
});

test('Sorpréndeme solo elige modelos que existen', () => {
  const ids = COVER_MODELS.map(([id]) => id);
  for (let i = 0; i < 60; i++) {
    const { model, elastic } = surpriseCover(coverDefaults());
    assert.ok(ids.includes(model), model);
    if (hasNoElastic(model)) assert.equal(elastic.orient, 'horizontal', `${model}: broche o moño atravesado`);
  }
});
