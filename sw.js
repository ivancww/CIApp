// Service Worker for Insurance PWA v9.4.4
const CACHE_VERSION = 'insurance-pwa-cache-v9.4.7';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. 安裝 Service Worker (預先快取核心檔案)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(FILES_TO_CACHE);
    }).catch(err => console.warn('[Service Worker] Pre-cache error:', err))
  );
});

// 2. 啟用並清理舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. 攔截請求 (網絡優先 Network-First，離線時使用快取)
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') return;

  // 對於 Google Apps Script (GAS) API 請求，強制走網絡，不走靜態快取
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 確保為有效響應 (允許 basic 及 cors 跨域圖片/CDN)
        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // 網絡斷開時，從快取讀取
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // 若連快取都沒有且請求的是頁面，返回首頁快取
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
