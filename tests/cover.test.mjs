import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_ELASTICS, BASE_LEATHERS, MAX_CHARMS, charmSVG, coverDefaults, migrateBook, newCharm, shade, surpriseCover } from '../js/cover.js';
import { CHARM_PHOTOS } from '../js/charm-photos.js';

test('los cuadernos anteriores a la unión conservan color, páginas y portada', () => {
  const old = { id: 'x', title: 'Viejo', palette: 'noche', pattern: 'flores', aspect: 0.75, coverPageId: 'p2', pages: [{ id: 'p1' }, { id: 'p2' }], createdAt: 5 };
  const book = migrateBook(old);
  assert.equal(book.cover.color, '#1e2a78');
  assert.equal(book.cover.pattern, 'floral');
  assert.equal(book.cover.photoId, 'p2');
  assert.equal(book.cover.photoOwn, false, 'la foto es una página: no debe borrarse con la portada');
  assert.deepEqual(book.pages.map((p) => p.id), ['p1', 'p2']);
  assert.deepEqual(book.pages.map((p) => p.scan), ['p1', 'p2'], 'cada foto antigua sigue siendo la base de su página');
  assert.ok(book.pages.every((p) => Array.isArray(p.elements) && p.elements.length === 0 && p.bg));
  assert.equal(book.aspect, 0.75);
  assert.ok(!('palette' in book) && !('coverPageId' in book));
});

test('migrateBook no toca un cuaderno ya convertido ni falla sin cuaderno', () => {
  const book = { id: 'y', cover: coverDefaults() };
  assert.equal(migrateBook(book), book);
  assert.equal(migrateBook(undefined), undefined);
});

test('la libreta por defecto es la Delulu real y usa un charm que existe', () => {
  const c = coverDefaults();
  assert.equal(c.model, 'delulu');
  assert.equal(c.color, '#6E4127');
  assert.ok(CHARM_PHOTOS[c.charms[0].shape]);
  assert.ok(c.charms.length <= MAX_CHARMS);
});

test('Sorpréndeme usa colores y charms reales y conserva el resto', () => {
  const base = coverDefaults();
  base.initials.text = 'SM';
  for (let i = 0; i < 40; i++) {
    const c = surpriseCover(base);
    assert.ok(BASE_LEATHERS.some((l) => l[2] === c.color));
    assert.ok(BASE_ELASTICS.some((l) => l[2] === c.elastic.color));
    assert.ok(CHARM_PHOTOS[c.charms[0].shape]);
    assert.equal(c.initials.text, 'SM');
  }
  assert.equal(base.color, '#6E4127', 'no debe modificar la portada original');
});

test('charmSVG escapa la inicial y dibuja las fotos reales', () => {
  const svg = charmSVG({ ...newCharm('letter'), letter: '<' });
  assert.ok(svg.includes('&lt;'));
  assert.ok(!svg.includes('><</text>'));
  assert.ok(charmSVG(newCharm('concha')).includes('data:image/webp'));
});

test('shade aclara y oscurece sin salirse del rango', () => {
  assert.equal(shade('#808080', -1), '#000000');
  assert.equal(shade('#808080', 1), '#ffffff');
  assert.match(shade('#6E4127', -0.5), /^#[0-9a-f]{6}$/);
});
