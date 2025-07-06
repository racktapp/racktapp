
// This is a basic service worker for PWA functionality.
// It enables the app to be "installable" but has minimal offline caching.
// For a robust offline experience, a more advanced strategy (e.g., using Workbox) would be recommended.

const CACHE_NAME = 'rackt-cache-v1';

// On install, we don't pre-cache anything for this basic setup.
self.addEventListener('install', (event) => {
  // console.log('Service Worker: Installing...');
  // event.waitUntil(
  //   caches.open(CACHE_NAME).then((cache) => {
  //     // Add app shell files to cache if needed
  //   })
  // );
});

// The fetch event handler is the core of the service worker.
// This example uses a "Network falling back to cache" strategy.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Try to get the response from the network first.
    fetch(event.request)
      .then((networkResponse) => {
        // If we get a valid response, we open the cache and put a clone of the response in it.
        return caches.open(CACHE_NAME).then((cache) => {
          // We only cache successful GET requests.
          if (event.request.method === 'GET' && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // If the network request fails (e.g., offline), try to get it from the cache.
        return caches.match(event.request);
      })
  );
});

// Clean up old caches on activation.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
