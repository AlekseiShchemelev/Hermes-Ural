// Service Worker для PWA с кэшированием на 7 дней
const CACHE_NAME = "hermes-ural-v5";
const STATIC_CACHE = "hermes-static-v5";
const DATA_CACHE = "hermes-data-v5";

// Время жизни кэша данных (7 дней в миллисекундах)
const DATA_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// Статические ресурсы для кэширования при установке
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/js/registry-common.js",
  "/js/data-manager.js",
  "/config/spreadsheet-config.js",
  "/css/styles.css",
  "/manifest.json",
];

// Установка Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Установка Service Worker...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Кэширование статических файлов");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error("[SW] Ошибка кэширования статики:", err)),
  );
});

// Активация Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Активация Service Worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return (
                name.startsWith("hermes-") &&
                name !== STATIC_CACHE &&
                name !== DATA_CACHE
              );
            })
            .map((name) => {
              console.log("[SW] Удаление старого кэша:", name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Перехват запросов
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const request = event.request;

  // Пропускаем POST запросы и другие не-GET методы
  if (request.method !== "GET") {
    return;
  }

  // Пропускаем запросы к Google Таблицам - пусть идут напрямую
  if (
    url.hostname.includes("docs.google.com") ||
    url.hostname.includes("drive.google.com")
  ) {
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
  const staticExtensions = [
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
  ];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Стратегия Cache First
async function cacheFirstStrategy(request) {
  if (request.method !== "GET") {
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
    console.log("[SW] Cache First - ошибка сети:", error);
    return new Response("Нет подключения к интернету", { status: 503 });
  }
}

// Стратегия Stale-While-Revalidate
async function staleWhileRevalidate(request) {
  if (request.method !== "GET") {
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
      console.log("[SW] SWR - ошибка сети:", error);
      return (
        cachedResponse ||
        new Response("Нет подключения к интернету", { status: 503 })
      );
    });

  return cachedResponse || fetchPromise;
}

// Сообщения от основного приложения
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
