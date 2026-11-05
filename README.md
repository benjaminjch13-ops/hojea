# Date's with Muu

Digitaliza tus cuadernos de papel y hojéalos en 3D, dentro de una libreta de cuero hecha a tu gusto. Funciona en el navegador, se puede instalar como app y guarda tus fotos en tu dispositivo.

La personalización de las libretas, por fuera y por dentro, viene de [Delulu Journal V2](https://github.com/benjaminjch13-ops/delulusV2), y los charms reales, de [delulusjournal](https://github.com/benjaminjch13-ops/delulusjournal).

## Cómo abrirla

Necesitas [Node.js](https://nodejs.org) y nada más. La app no tiene dependencias; `npm install` solo hace falta para las pruebas y las sugerencias con IA (`api/muu.js`).

```bash
npm start
```

Luego abre <http://localhost:5173>.

## Qué hace

- **Inicio:** saludo, días juntos, un recuerdo al azar de sus páginas e ideas para la próxima cita.
- **Animaciones:** las hojas se doblan y proyectan sombra al pasarlas, y cada libreta nueva cae del cielo.
- **Muu:** la vaquita peluda de la app. Reacciona al tocarla y es el ícono. Además hay pelaje y manchas de vaca para las libretas, charms, stickers, frases y un paquete de plantillas de vaquitas.
- **Libretas a tu gusto:** modelo con solapa y remaches o con costura, color, textura, acabado, patrón e imagen de portada; elástico y cinta marcapáginas; hasta 6 charms, reales o dibujados; título e iniciales grabados, en oro, en plata o impresos. También tiene un botón "Sorpréndeme".
- **Decorar por dentro:** cualquier página, sea una foto de tu cuaderno o una en blanco, lleva stickers, cintas, papeles, notas, texto, fotos con forma y marco, y dibujo libre. Incluye fondos de papel, plantillas y paquetes temáticos, quitar fondo, favoritos, guías de alineación y deshacer.
- **Fondos:** 9 temas para la app.
- **Agregar páginas:** toma fotos seguidas con la cámara, elige varias de tus archivos o arrástralas a la ventana.
- **Recorte:** detecta los bordes de la hoja, deja ajustar las esquinas con lupa y endereza la perspectiva. Filtros: Original, Realce y Blanco y negro.
- **Libro 3D:** arrastra una página, haz clic en un lado, usa las flechas del teclado o la barra. Al abrirla, el elástico se suelta y el cuero asoma alrededor de las hojas. Arrastra el fondo para girar el libro. También tiene vista en abanico y zoom.
- **Administrar:** reordena, amplía y elimina páginas.
- **Exportar:** PDF, imágenes PNG o una página web hojeable, como libro abierto o una página por hoja, con o sin el diseño de la libreta, con rango de páginas y calidad para imprimir.

## Paleta

Los colores de la interfaz están en las variables de `:root`, al inicio de `css/styles.css`: Milk Cream, Strawberry Milk, Muu Pink, Butter Yellow, Matcha Milk, Lavender, Cocoa y Soft White. Para el texto se usan dos tonos más oscuros de Cocoa, porque el original no alcanza a leerse en letra chica sobre los pasteles. La paleta no afecta a las libretas: el cuero, los charms, los stickers y el papel tienen sus propios colores.

## Sugerencias de Muu

Las ideas están en `js/date-ideas.js` (Guatemala, tendencias de redes, clásicas y de vaquitas). "Pregúntale a Muu" llama a `api/muu.js`, que usa Claude con la clave guardada en Vercel como `ANTHROPIC_API_KEY`. Sin clave o sin conexión, Muu elige de su lista y lo avisa. Solo se envían los filtros y lo que se escribe en el antojo; las libretas y las fotos no salen del dispositivo.

## Citas y vaquitas

Cada cita se registra aparte de las libretas (`js/dates.js`), así que una libreta puede guardar muchas citas y borrar una libreta no borra las vaquitas. Cada cita gana una de las 100 vaquitas temáticas de `js/vaquitas.js` y `js/vaquitas-series.js`, que luego se puede usar como sticker; `nextVaquita` decide cuál.

## Publicación

La app está en <https://dates-with-muu.vercel.app>. Cada push a `main` la publica en Vercel; `vercel.json` y `.vercelignore` definen qué se sube.

Para probar en un celular antes de publicar, con el celular en la misma red Wi-Fi:

```bash
npm run lan
```

Abre `http://<IP-de-tu-computadora>:5173`. Sin HTTPS el navegador no permite la cámara en vivo ni instalar la app, así que "Tomar fotos" abre la cámara del sistema.

## Tus datos

Las fotos se quedan en el almacenamiento del navegador (IndexedDB) y no se suben a ningún servidor. Por eso no se sincronizan entre dispositivos, y borrar los datos del sitio también borra los cuadernos. Exporta a PDF lo que quieras conservar.

Las tipografías de los títulos se cargan desde Google Fonts. Sin conexión, los títulos usan una letra del sistema.

## Desarrollo

```bash
npm test
```

| Archivo | Contenido |
| --- | --- |
| `js/app.js` | Pantallas y navegación |
| `js/home.js` | Tarjetas de la pantalla inicial |
| `js/cow.js` | Dibujo de Muu y stickers de vaquitas |
| `js/book3d.js` | Libro 3D: animación y gestos |
| `js/capture.js` | Cámara y pantalla de recorte |
| `js/imaging.js` | Perspectiva, detección de bordes y filtros |
| `js/export-dialog.js`, `js/pdf.js` | Opciones de exportación y escritor de PDF |
| `js/db.js` | Almacenamiento local |
| `js/cover.js` | Libreta de cuero: materiales y dibujo |
| `js/cover-editor.js` | Editor de la portada |
| `js/delulu.js`, `css/delulu.css` | Editor de páginas, traído de Delulu Journal V2 |
| `js/charm-photos.js` | Fotos de los charms reales |
| `js/themes.js` | Fondos de la app |
| `js/demo.js` | Cuaderno de ejemplo |
