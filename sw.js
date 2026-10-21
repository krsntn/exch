// Service worker: keeps every app file in a cache, so the app opens and works offline.
// When you change any app file, change CACHE (for example exch-v2). The new worker then caches
// all files again, and the page shows the update bar.
var CACHE = 'exch-v1';
var FILES = [
  './',
  'index.html',
  'convert.html',
  'style.css',
  'compare.js',
  'shared.js',
  'currency-picker.js',
  'app.js',
  'convert.js',
  'pwa.js',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'favicon.ico'
];

self.addEventListener('install', function (event) {
  // cache: 'reload' skips the browser HTTP cache, so the new cache does not get old files.
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(FILES.map(function (file) { return new Request(file, { cache: 'reload' }); }));
  }));
  // The new worker waits until the user taps Reload on the update bar (see pwa.js).
});

self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
      return caches.delete(key);
    }));
  }));
});

// Cache first. ignoreSearch lets index.html?launch use the cached index.html.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(event.request);
  }));
});
