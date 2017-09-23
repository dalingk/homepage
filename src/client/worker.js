// Service worker for caching resources


const CACHE_NAME = 'homepage-cache';

const URLS_TO_CACHE = ['./', 'index.html', 'homepage.js', 'homepage.css', 'links.json'];

self.addEventListener('install', function install (e) {
    e.waitUntil(caches.open(CACHE_NAME).then(
        function(cache) {
            return cache.addAll(URLS_TO_CACHE);
        })
    )
});

self.addEventListener('fetch', function (e) {
    e.respondWith(caches.open(CACHE_NAME).then(cache => {
        return cache.match(e.request).then(response => {
            let fetchPromise = fetch(e.request).then(networkResponse => {
                cache.put(e.request, networkResponse.clone());
                return networkResponse;
            });
            return response || fetchPromise;
        })
    }))
});

