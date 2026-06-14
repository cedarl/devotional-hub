const VERSION = 'dh-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './books.json',
  './icon-192.png',
  './icon-512.png',
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting(); // activate immediately
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control of all open tabs immediately
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses
        if(res && res.status === 200) {
          const clone = res.clone();
          caches.open(VERSION).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Tell all open tabs to reload when a new version activates
self.addEventListener('activate', e => {
  e.waitUntil(
    self.clients.matchAll({type:'window'}).then(clients => {
      clients.forEach(client => client.postMessage({type:'SW_UPDATED', version: VERSION}));
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./index.html'));
});