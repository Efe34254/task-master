const CACHE_NAME = 'task-master-pro-v5';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// Install Event
self.addEventListener('install', (e) => {
    console.log('[SW] Install');
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (e) => {
    console.log('[SW] Activate');
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
    self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) return;

    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request).then((fetchRes) => {
                if (fetchRes.status === 200) {
                    const resClone = fetchRes.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
                }
                return fetchRes;
            });
        }).catch(() => {
            if (e.request.mode === 'navigate') return caches.match('./index.html');
        })
    );
});

// Notification Logic
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    if (event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body } = event.data.payload;
        const options = {
            body: body,
            icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
            vibrate: [100, 50, 100],
            data: { dateOfArrival: Date.now() },
            actions: [
                { action: 'explore', title: 'Open App' }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});
