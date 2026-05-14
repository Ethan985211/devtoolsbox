const CACHE = 'devtoolsbox-v2';
const ASSETS = [
  '/',
  '/css/style.css',
  '/manifest.json',
  '/tools/image-compress',
  '/tools/image-convert',
  '/tools/json-formatter',
  '/tools/base64',
  '/tools/qr-code',
  '/tools/timestamp',
  '/tools/pdf-to-text',
  '/tools/pdf-merge',
  '/tools/pdf-split',
  '/tools/color-converter',
  '/tools/url-encode',
  '/tools/password-gen'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Network-first for HTML, cache-first for static assets
      if (e.request.destination === 'document') {
        return fetch(e.request)
          .then(response => {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
            return response;
          })
          .catch(() => cached);
      }
      return cached || fetch(e.request);
    })
  );
});
