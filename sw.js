// Primero la red, para no servir versiones viejas; la caché permite usar la app sin conexión.
const CACHE = 'hojea-v13';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'css/delulu.css',
  'js/app.js', 'js/book3d.js', 'js/capture.js', 'js/charm-photos.js', 'js/cover.js', 'js/cover-editor.js', 'js/cow.js',
  'js/collection-view.js', 'js/date-dialog.js', 'js/date-ideas.js', 'js/dates.js', 'js/vaquita-art.js', 'js/vaquitas-series.js', 'js/vaquitas.js', 'js/db.js', 'js/delulu.js', 'js/demo.js', 'js/export-dialog.js', 'js/home.js', 'js/imaging.js', 'js/muu-advisor.js', 'js/pdf.js', 'js/themes.js', 'js/ui.js',
  'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    } catch {
      return (await caches.match(e.request, { ignoreSearch: true })) ?? (await caches.match('./'));
    }
  })());
});
