const CACHE_NAME = 'battle-arena-v2.2'; // Bumped version to force update
const ASSETS = [
    '/',
    '/css/style.css?v=2.1',
    '/js/script.js?v=2.1',
    '/image/rock.png',
    '/image/paper.png',
    '/image/scissors.png',
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

// Fetch Event - Network-First strategy
self.addEventListener('fetch', (event) => {
    // Check if the request matches any of our ASSETS (ignoring query params if needed)
    const isAsset = ASSETS.some(asset => {
        const url = new URL(asset, self.location.origin);
        return event.request.url.includes(url.pathname);
    });

    if (isAsset) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
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
