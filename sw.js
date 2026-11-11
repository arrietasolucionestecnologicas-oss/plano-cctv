/* Service worker de Plano CCTV: deja la app disponible sin internet.
   - Al instalar guarda el cascarón (página, manifiesto e iconos).
   - Al abrir la página con internet siempre trae la versión nueva (y la guarda); sin internet usa la guardada.
   - Lo que viene de otros sitios (las fuentes de Google) no se toca: sin internet la app usa la fuente del sistema.
   Los planos del usuario NO están aquí: viven en el almacenamiento del navegador. Para publicar un cambio, subir la versión de CACHE. */
var CACHE = 'plano-cctv-v1';
var ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;

  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(function (resp) {
        var copia = resp.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copia); });
        return resp;
      }).catch(function () {
        return caches.match('./index.html').then(function (x) { return x || caches.match('./'); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(r).then(function (hit) {
      return hit || fetch(r).then(function (resp) {
        if (resp && resp.ok) { var copia = resp.clone(); caches.open(CACHE).then(function (c) { c.put(r, copia); }); }
        return resp;
      });
    })
  );
});
