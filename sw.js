// Service Worker for Insurance PWA

// --- 1. 設定你的快取版本號和要離線存取的檔案 ---
// ⚠️ 重要：版本號已升級至 v3，確保手機抓取最新的 Emoji 故事版 HTML！
const CACHE_VERSION = 'insurance-pwa-cache-v3';
const FILES_TO_CACHE = [
  './index.html',     // 主應用程式檔案
  './manifest.json',  // PWA 設定檔
  './icon-192.png',   // 主要圖示
  './icon-512.png',   // 大型圖示
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js' // QR Code 函式庫
];

// --- 2. 安裝 Service Worker ---
// 當 PWA 被安裝時，會觸發此事件，並將上面列表的檔案存入快取
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 強制立即啟用新的 Service Worker
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[Service Worker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// --- 3. 啟用 Service Worker 並清理舊快取 ---
// 當新的 Service Worker 啟用時，會刪除所有舊版本 (如 v1, v2) 的快取
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
  // 讓 Service Worker 立即控制頁面
  return self.clients.claim();
});

// --- 4. 攔截網絡請求，並採用「網絡優先，快取備用」策略 ---
// 這能確保用戶永遠先看到最新內容，只有在沒有 Wi-Fi/數據 (離線) 時才會使用舊的快取版本
self.addEventListener('fetch', (event) => {
  // 我們只處理 GET 請求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 如果成功從網絡獲取，就回傳並同時更新快取
        console.log(`[Service Worker] Fetched ${event.request.url} from network.`);
        // 確保 response 有效
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 複製一份 response，因為 response 只能被讀取一次
        const responseToCache = response.clone();

        caches.open(CACHE_VERSION)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // 如果網絡請求失敗 (例如離線)，就從快取中尋找
        console.log(`[Service Worker] Fetch failed for ${event.request.url}. Trying cache.`);
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // 如果連快取都沒有，這通常發生在從未載入過的頁面
            console.error(`[Service Worker] No response found in cache for ${event.request.url}`);
          });
      })
  );
});
