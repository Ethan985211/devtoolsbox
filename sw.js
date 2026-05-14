const CACHE = 'devtoolsbox-v1';
const ASSETS = [
  '/',
  '/css/style.css',
  '/manifest.json',
  '/tools/image-compress.html',
  '/tools/image-convert.html',
  '/tools/json-formatter.html',
  '/tools/base64.html',
  '/tools/qr-code.html',
  '/tools/timestamp.html',
  '/tools/pdf-to-text.html',
  '/tools/pdf-merge.html',
  '/tools/pdf-split.html',
  '/tools/color-converter.html',
  '/tools/url-encode.html',
  '/tools/password-gen.html'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
