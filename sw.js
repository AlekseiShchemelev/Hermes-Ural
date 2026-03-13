// Service Worker для PWA с кэшированием на 24 часа
const CACHE_NAME = 'hermes-ural-v1';
const STATIC_CACHE = 'hermes-static-v1';
const DATA_CACHE = 'hermes-data-v1';

// Время жизни кэша данных (24 часа в миллисекундах)
const DATA_CACHE_DURATION = 24 * 60 * 60 * 1000;

// Статические ресурсы для кэширования при установке
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/js/registry-common.js',
  '/js/data-manager.js',
  '/config/spreadsheet-config.js',
  '/css/styles.css',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Установка Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Кэширование статических файлов');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Ошибка кэширования статики:', err))
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('hermes-') && 
                     name !== STATIC_CACHE && 
                     name !== DATA_CACHE;
            })
            .map((name) => {
              console.log('[SW] Удаление старого кэша:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const request = event.request;
  
  // Пропускаем POST запросы и другие не-GET методы
  if (request.method !== 'GET') {
    return;
  }
  
  // Пропускаем запросы к Google Таблицам
  if (url.hostname.includes('docs.google.com')) {
    event.respondWith(handleGoogleSheetsRequest(request));
    return;
  }
  
  // Для статических файлов - стратегия Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Для остальных запросов - Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Проверка, является ли файл статическим ресурсом
function isStaticAsset(pathname) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Стратегия Cache First
async function cacheFirstStrategy(request) {
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache First - ошибка сети:', error);
    return new Response('Нет подключения к интернету', { status: 503 });
  }
}

// Стратегия Stale-While-Revalidate
async function staleWhileRevalidate(request) {
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] SWR - ошибка сети:', error);
      return cachedResponse || new Response('Нет подключения к интернету', { status: 503 });
    });
  
  return cachedResponse || fetchPromise;
}

// Обработка запросов к Google Таблицам
async function handleGoogleSheetsRequest(request) {
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
      await saveDataTimestamp(request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Google Sheets - нет сети, используем кэш');
    
    const cache = await caches.open(DATA_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Нет данных: нет подключения и нет кэша', { 
      status: 503,
      statusText: 'No data available'
    });
  }
}

// Сохранение timestamp данных в IndexedDB
async function saveDataTimestamp(url) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HermesDataDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('dataTimestamps')) {
        db.createObjectStore('dataTimestamps', { keyPath: 'url' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('dataTimestamps')) {
        resolve();
        return;
      }
      
      const tx = db.transaction('dataTimestamps', 'readwrite');
      const store = tx.objectStore('dataTimestamps');
      
      store.put({
        url: url,
        timestamp: Date.now()
      });
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}

// Сообщения от основного приложения
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_DATA_STATUS') {
    checkDataStatus(event.data.url).then(status => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage(status);
      }
    });
  }
});

// Проверка статуса данных (возраст кэша)
async function checkDataStatus(url) {
  try {
    const db = await openDatabase();
    
    if (!db.objectStoreNames.contains('dataTimestamps')) {
      return { hasData: false, needsUpdate: true };
    }
    
    const tx = db.transaction('dataTimestamps', 'readonly');
    const store = tx.objectStore('dataTimestamps');
    const request = store.get(url);
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          const age = Date.now() - request.result.timestamp;
          const isFresh = age < DATA_CACHE_DURATION;
          resolve({
            hasData: true,
            timestamp: request.result.timestamp,
            age: age,
            isFresh: isFresh,
            needsUpdate: !isFresh
          });
        } else {
          resolve({ hasData: false, needsUpdate: true });
        }
      };
      
      request.onerror = () => {
        resolve({ hasData: false, needsUpdate: true, error: request.error });
      };
    });
  } catch (error) {
    return { hasData: false, needsUpdate: true, error: error.message };
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HermesDataDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
