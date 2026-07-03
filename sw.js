const CACHE_VERSION = 'v4';

const CACHE_NAME = `toolsuite-${CACHE_VERSION}-core`;
const DYNAMIC_CACHE = `toolsuite-${CACHE_VERSION}-dynamic`;

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    // Shared styles
    './theme.css',
    './assets/css/notifications.css',

    // Shared scripts
    './theme.js',
    './assets/js/notifications.js',

    // PWA assets
    './robots.txt',
    './sitemap.xml'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Pre-caching App Shell V2');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                // If the cache key doesn't match current version, delete it
                if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    // Ensure that updates to the service worker take effect immediately
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match('./offline.html'))
        );
        return;
    }

    // For the main page, we want the LATEST tool list, not the cached one.
    if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    return caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => caches.match(event.request)) // Fallback to cache if offline
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Silently fail network update if offline
            });

            return cachedResponse || fetchPromise;
        })
    );
});
