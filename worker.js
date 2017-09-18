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
    e.respondWith(
        fetch(e.request).catch(err => {
            return caches.match(e.request);
        })
    )
});

