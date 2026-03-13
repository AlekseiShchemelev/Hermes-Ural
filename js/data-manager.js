// Data Manager - управление кэшированием данных на 24 часа
// Использует IndexedDB для хранения данных с timestamp

(function (global) {
  "use strict";

  // Конфигурация
  const CONFIG = {
    DB_NAME: "HermesDataDB",
    DB_VERSION: 1,
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 часа
    STORE_NAME: "cachedData",
  };

  // Инициализация IndexedDB
  let db = null;

  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

      request.onerror = () => {
        console.error("[DataManager] Ошибка открытия БД:", request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        // Создаём хранилище для кэшированных данных
        if (!database.objectStoreNames.contains(CONFIG.STORE_NAME)) {
          database.createObjectStore(CONFIG.STORE_NAME, { keyPath: "url" });
        }

        // Хранилище для timestamp
        if (!database.objectStoreNames.contains("timestamps")) {
          database.createObjectStore("timestamps", { keyPath: "url" });
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        console.log("[DataManager] IndexedDB инициализирована");
        resolve(db);
      };
    });
  }

  // Сохранение данных в IndexedDB
  async function saveData(url, data) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(CONFIG.STORE_NAME, "readwrite");
      const store = tx.objectStore(CONFIG.STORE_NAME);

      const record = {
        url: url,
        data: data,
        timestamp: Date.now(),
      };

      const request = store.put(record);

      request.onsuccess = () => {
        console.log("[DataManager] Данные сохранены в IndexedDB:", url);
        resolve();
      };

      request.onerror = () => {
        console.error("[DataManager] Ошибка сохранения данных:", request.error);
        reject(request.error);
      };
    });
  }

  // Получение данных из IndexedDB
  async function getData(url) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(CONFIG.STORE_NAME, "readonly");
      const store = tx.objectStore(CONFIG.STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error("[DataManager] Ошибка получения данных:", request.error);
        reject(request.error);
      };
    });
  }

  // Получение timestamp данных
  async function getTimestamp(url) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction("timestamps", "readonly");
      const store = tx.objectStore("timestamps");
      const request = store.get(url);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Сохранение timestamp
  async function saveTimestamp(url) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction("timestamps", "readwrite");
      const store = tx.objectStore("timestamps");

      const record = {
        url: url,
        timestamp: Date.now(),
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Проверка, нужно ли обновить данные
  async function needsUpdate(url) {
    try {
      const timestampRecord = await getTimestamp(url);

      if (!timestampRecord) {
        console.log(
          "[DataManager] Нет сохранённых данных, требуется обновление",
        );
        return { needed: true, reason: "no_data" };
      }

      const age = Date.now() - timestampRecord.timestamp;
      const isFresh = age < CONFIG.CACHE_DURATION;

      console.log(
        `[DataManager] Возраст данных: ${Math.round(age / 1000 / 60)} минут, свежие: ${isFresh}`,
      );

      return {
        needed: !isFresh,
        reason: isFresh ? "data_fresh" : "cache_expired",
        age: age,
        timestamp: timestampRecord.timestamp,
      };
    } catch (error) {
      console.error("[DataManager] Ошибка проверки данных:", error);
      return { needed: true, reason: "error", error: error.message };
    }
  }

  // Основная функция загрузки данных с кэшированием
  async function loadDataWithCache(url) {
    const isOnline = navigator.onLine;

    console.log(`[DataManager] Загрузка данных: онлайн=${isOnline}`);

    // Проверяем, есть ли сохранённые данные
    const cached = await getData(url);
    const updateInfo = await needsUpdate(url);

    // Если данных нет вообще
    if (!cached) {
      console.log("[DataManager] Нет кэшированных данных");

      if (isOnline) {
        // Загружаем с сервера
        const data = await fetchAndCacheData(url);
        console.log(
          "[DataManager] Возвращаем данные с сервера, количество записей:",
          data ? data.length : "null",
        );
        return {
          data: data,
          fromCache: false,
          message: "Данные загружены с сервера",
        };
      } else {
        // Нет данных и нет интернета
        throw new Error("Нет подключения к интернету и нет сохранённых данных");
      }
    }

    // Данные есть в кэше
    if (isOnline) {
      // Есть интернет - проверяем, нужно ли обновить
      if (updateInfo.needed) {
        console.log("[DataManager] Кэш устарел, обновляем...");
        try {
          const freshData = await fetchAndCacheData(url);
          return {
            data: freshData,
            fromCache: false,
            message: "Данные обновлены",
          };
        } catch (error) {
          console.warn("[DataManager] Не удалось обновить данные:", error);
          // Возвращаем старые данные
          return {
            data: cached.data,
            fromCache: true,
            message: "Использованы сохранённые данные (ошибка обновления)",
          };
        }
      } else {
        // Данные свежие, но пробуем обновить в фоне (Stale-While-Revalidate)
        fetchAndCacheData(url).catch((err) =>
          console.log("[DataManager] Фоновое обновление не удалось:", err),
        );

        return {
          data: cached.data,
          fromCache: true,
          message: "Использованы кэшированные данные",
        };
      }
    } else {
      // Нет интернета - используем кэш
      const hoursSinceCache = Math.round(
        (Date.now() - cached.timestamp) / 1000 / 60 / 60,
      );
      const isExpired = hoursSinceCache >= 24;

      return {
        data: cached.data,
        fromCache: true,
        message: isExpired
          ? "Внимание: данные устарели (нет интернета для обновления)"
          : "Использованы сохранённые данные (офлайн режим)",
        isExpired: isExpired,
      };
    }
  }

  // Загрузка и кэширование данных с сервера
  async function fetchAndCacheData(url) {
    console.log("[DataManager] Загрузка данных с сервера:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.status}`);
    }

    const csvText = await response.text();
    const data = csvToJSON(csvText);

    // Сохраняем данные
    await saveData(url, data);
    await saveTimestamp(url);

    console.log("[DataManager] Данные загружены и закэшированы");

    return data;
  }

  // Конвертация CSV в JSON
  function csvToJSON(csvText) {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));

    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index]
            ? values[index].trim().replace(/^"|"$/g, "")
            : "";
        });
        result.push(obj);
      }
    }

    return result;
  }

  // Парсинг строки CSV
  function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }

  // Очистка старых данных
  async function clearOldCache() {
    if (!db) await initDB();

    const tx = db.transaction(CONFIG.STORE_NAME, "readwrite");
    const store = tx.objectStore(CONFIG.STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = async () => {
        const allRecords = request.result;
        const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 дней

        let deleted = 0;
        for (const record of allRecords) {
          if (record.timestamp < cutoffTime) {
            await store.delete(record.url);
            deleted++;
          }
        }

        console.log(`[DataManager] Удалено записей: ${deleted}`);
        resolve(deleted);
      };
    });
  }

  // Получение информации о статусе данных
  async function getDataStatus(url) {
    const cached = await getData(url);
    const updateInfo = await needsUpdate(url);

    if (!cached) {
      return {
        hasData: false,
        status: "no_data",
        message: "Нет сохранённых данных",
      };
    }

    const age = Date.now() - cached.timestamp;
    const ageHours = Math.round(age / 1000 / 60 / 60);

    return {
      hasData: true,
      status: updateInfo.needed ? "expired" : "fresh",
      age: age,
      ageHours: ageHours,
      timestamp: cached.timestamp,
      message: updateInfo.needed
        ? `Данные устарели (${ageHours}ч назад)`
        : `Данные свежие (${ageHours}ч назад)`,
    };
  }

  // Экспорт модуля
  global.DataManager = {
    init: initDB,
    loadDataWithCache,
    getData,
    saveData,
    getDataStatus,
    needsUpdate,
    clearOldCache,
    isOnline: () => navigator.onLine,
  };
})(window);
