const CACHE_NAME = 'battle-arena-v2'; // Bumped version
const ASSETS = [
    '/',
    '/css/style.css',
    '/js/script.js',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

// Install Event - caching assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event - cleaning up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Network-First strategy for better updates
self.addEventListener('fetch', (event) => {
    // We want a Network-First strategy for our main scripts/styles to avoid stale cache issues
    if (ASSETS.some(asset => event.request.url.includes(asset))) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Update cache on successful fetch
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});
