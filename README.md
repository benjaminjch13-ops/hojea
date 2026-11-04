# Hojea

Digitaliza tus cuadernos de papel y hojéalos en 3D. Funciona en el navegador, se puede instalar como app y guarda todo en tu dispositivo.

## Cómo abrirla

Necesitas [Node.js](https://nodejs.org) y nada más: no hay dependencias que instalar.

```bash
npm start
```

Luego abre <http://localhost:5173>.

## Qué hace

- **Cuadernos:** crea cuadernos con portada de color y diseño, o usa una de tus páginas como portada.
- **Agregar páginas:** toma fotos seguidas con la cámara, elige varias de tus archivos o arrástralas a la ventana.
- **Recorte:** detecta los bordes de la hoja, deja ajustar las esquinas con lupa y endereza la perspectiva. Filtros: Original, Realce y Blanco y negro.
- **Libro 3D:** arrastra una página, haz clic en un lado, usa las flechas del teclado o la barra. Arrastra el fondo para girar el libro. También tiene vista en abanico y zoom.
- **Administrar:** reordena, amplía y elimina páginas.
- **Exportar:** genera un PDF con todas las páginas.

## Usarla en tu celular

Para una prueba rápida con el celular en la misma red Wi-Fi:

```bash
npm run lan
```

Abre `http://<IP-de-tu-computadora>:5173` en el celular. Sin HTTPS, el navegador no permite la cámara en vivo ni instalar la app, así que "Tomar fotos" abre la cámara del sistema.

Para tener todo, publica estos archivos en un hosting estático con HTTPS (Netlify, Vercel, GitHub Pages o Cloudflare Pages): `index.html`, `manifest.webmanifest`, `sw.js` y las carpetas `css`, `js` e `icons`.

## Tus datos

Las fotos se quedan en el almacenamiento del navegador (IndexedDB) y no se suben a ningún servidor. Por eso no se sincronizan entre dispositivos, y borrar los datos del sitio también borra los cuadernos. Exporta a PDF lo que quieras conservar.

## Desarrollo

```bash
npm test
```

| Archivo | Contenido |
| --- | --- |
| `js/app.js` | Pantallas y navegación |
| `js/book3d.js` | Libro 3D: animación y gestos |
| `js/capture.js` | Cámara y pantalla de recorte |
| `js/imaging.js` | Perspectiva, detección de bordes y filtros |
| `js/pdf.js` | Exportación a PDF |
| `js/db.js` | Almacenamiento local |
| `js/covers.js` | Portadas generadas |
| `js/demo.js` | Cuaderno de ejemplo |
