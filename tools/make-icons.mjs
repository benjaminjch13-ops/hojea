// Genera icons/icon.svg con la cara de Muu. Para los PNG hace falta @resvg/resvg-js, que no es parte de la app:
//   npm install --no-save @resvg/resvg-js && npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import { fluffyHead } from '../js/cow.js';

// La cara ocupa la zona segura del centro, para que no se recorte en íconos redondos.
export const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="bg" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#4d50b8"/><stop offset="1" stop-color="#7b7fdc"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(100 112) scale(3.12)">${fluffyHead()}</g>
</svg>`;

const dir = new URL('../icons/', import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('icon.svg', dir), iconSVG);

try {
  const { Resvg } = await import('@resvg/resvg-js');
  for (const size of [192, 512]) {
    const png = new Resvg(iconSVG, { fitTo: { mode: 'width', value: size } }).render().asPng();
    writeFileSync(new URL(`icon-${size}.png`, dir), png);
  }
  console.log('Íconos generados');
} catch {
  console.log('Se generó icon.svg. Para los PNG instala @resvg/resvg-js (ver el comentario de este archivo).');
}
