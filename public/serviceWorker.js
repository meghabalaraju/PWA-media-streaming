let CACHE_STATIC = 'static-v1';
let CACHE_DYNAMIC = 'dynamic-v1';

self.addEventListener('install', async (event) => {
    console.log('[Service Worker] Installing Service Worker...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then((cache) => {
                console.log('[Service Worker] Pre-Caching App Shell');
                cache.addAll([
                    '/',
                    '/download',
                    '/views/index.hbs',
                    '/views/download.hbs',
                    '/views/offline.html',
                    '/js/app.js',
                    '/js/index.js',
                    '/js/player.js',
                    '/js/shaka-player.compiled.js',
                    '/css/fontawesome/css/all.css',
                    '/css/index.css',
                    '/css/responsive.css',
                    '/css/controls.css',
                    '/css/images/avatar-sm.png',
                    '/css/images/film.png',
                    '/css/images/gear.png',
                    '/css/images/logo3.png',
                    '/css/images/menu.png',
                    '/css/images/search.png',
                    '/css/images/user.png',
                    '/css/images/thumbnails/art_of_motion.png',
                    '/css/images/thumbnails/azure.png',
                    '/css/images/thumbnails/sintel.png',
                ]);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating Service Worker...', event);
    event.waitUntil(
        caches.keys()
            .then((keyList) => {
                return Promise.all(keyList.map((key) => {
                    if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
                        console.log('[Service Worker] Removing old cache.', key);
                        return caches.delete(key);
                    }
                }));
            })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request)
                        .then((res) => {
                            // return res;
                            return caches.open(CACHE_DYNAMIC)
                                .then((cache) => {
                                    const manifestUrlIncluded =
                                        event.request.url.includes('https://amssamples') ||
                                        event.request.url.includes('https://storage') ||
                                        event.request.url.includes('https://bitdash-a');

                                    if (!manifestUrlIncluded) {
                                        cache.put(event.request.url, res.clone());
                                    }
                                    return res;
                                })
                        })
                        .catch((err) => {
                            return caches.open(CACHE_STATIC)
                                .then((cache) => {
                                    return cache.match('/views/offline.html')
                                })
                        })
                }
            })
    );
});
