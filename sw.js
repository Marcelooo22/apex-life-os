/* Apex service worker: app shell offline-first.
   Sube VERSION solo si agregas archivos nuevos al SHELL. */
const VERSION = 'apex-v2.0.0';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Páginas: abre al instante desde caché y actualiza en segundo plano.
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.open(VERSION).then(async cache => {
        const cached = await cache.match('./index.html');
        const fresh = fetch(req).then(res => {
          if (res && res.ok) cache.put('./index.html', res.clone());
          return res;
        }).catch(() => null);
        return cached || (await fresh) || Response.error();
      })
    );
    return;
  }

  // Recursos estáticos: caché primero.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
