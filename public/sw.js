// This is the most basic service worker, for PWA installability.
// It does not include caching strategies, which can be added later for offline support.
self.addEventListener('fetch', (event) => {
  // We are not intercepting fetch events for now.
  // This makes the app installable but doesn't add offline functionality.
  return;
});
