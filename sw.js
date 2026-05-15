const CACHE = 'actas-v6';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './escudo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalación
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[SW] Error al cachear algunos assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación - limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch normal
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      
      return fetch(e.request).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

// 🔧 SOLUCIÓN DEL ERROR: Manejar mensajes del cliente
self.addEventListener('message', event => {
  // Responder inmediatamente para que no se cierre el canal
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ status: 'ok' });
    }
  }
  
  // Siempre responder para mantener el canal abierto
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ received: true });
  }
});
