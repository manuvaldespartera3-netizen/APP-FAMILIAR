const CACHE_NAME = 'familia-app-v9';
const URLS_TO_CACHE = [
  '/APP-FAMILIAR/',
  '/APP-FAMILIAR/index.html',
  '/APP-FAMILIAR/manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];

// Instalar y cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache abierto');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activar y limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Estrategia: red primero, cache como respaldo
self.addEventListener('fetch', event => {
  // No cachear peticiones a Supabase
  if (event.request.url.includes('supabase.co')) {
    return fetch(event.request);
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, la guardamos en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si no hay red, usamos el cache
        return caches.match(event.request).then(response => {
          return response || caches.match('/familia-app/index.html');
        });
      })
  );
});

// Notificaciones push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '💑 Manuel & Merche';
  const options = {
    body: data.body || 'Tienes una notificación',
    icon: '/familia-app/icons/icon-192.png',
    badge: '/familia-app/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/familia-app/' },
    actions: [
      { action: 'ver', title: 'Ver app' },
      { action: 'cerrar', title: 'Cerrar' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Click en notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'ver' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/familia-app/')
    );
  }
});
