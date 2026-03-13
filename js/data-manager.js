// Data Manager - управление кэшированием данных на 7 дней
// Использует IndexedDB для хранения данных с timestamp

(function (global) {
  "use strict";

  // Конфигурация
  var CONFIG = {
    DB_NAME: "HermesDataDB",
    DB_VERSION: 2,
    CACHE_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 дней
    STORE_NAME: "cachedData",
    PDF_STORE_NAME: "cachedPDFs",
  };

  var db = null;

  // Инициализация IndexedDB
  function initDB() {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

      request.onerror = function () {
        console.error("[DataManager] Ошибка открытия БД:", request.error);
        reject(request.error);
      };

      request.onupgradeneeded = function (event) {
        var database = event.target.result;

        if (!database.objectStoreNames.contains(CONFIG.STORE_NAME)) {
          database.createObjectStore(CONFIG.STORE_NAME, { keyPath: "url" });
        }

        if (!database.objectStoreNames.contains("timestamps")) {
          database.createObjectStore("timestamps", { keyPath: "url" });
        }

        if (!database.objectStoreNames.contains(CONFIG.PDF_STORE_NAME)) {
          database.createObjectStore(CONFIG.PDF_STORE_NAME, { keyPath: "url" });
          console.log("[DataManager] Создано хранилище для PDF");
        }
      };

      request.onsuccess = function (event) {
        db = event.target.result;
        console.log("[DataManager] IndexedDB инициализирована");
        resolve(db);
      };
    });
  }

  // Сохранение данных в IndexedDB
  async function saveData(url, data) {
    if (!db) await initDB();

    return new Promise(function (resolve, reject) {
      var tx = db.transaction(CONFIG.STORE_NAME, "readwrite");
      var store = tx.objectStore(CONFIG.STORE_NAME);

      var record = {
        url: url,
        data: data,
        timestamp: Date.now(),
      };

      var request = store.put(record);

      request.onsuccess = function () {
        console.log("[DataManager] Данные сохранены в IndexedDB:", url);
      };

      request.onerror = function () {
        console.error("[DataManager] Ошибка сохранения данных:", request.error);
        reject(request.error);
      };

      // Ждём завершения транзакции
      tx.oncomplete = function () {
        console.log("[DataManager] Транзакция сохранения завершена");
        resolve();
      };

      tx.onerror = function () {
        console.error("[DataManager] Ошибка транзакции:", tx.error);
        reject(tx.error);
      };
    });
  }

  // Получение данных из IndexedDB
  async function getData(url) {
    if (!db) await initDB();

    return new Promise(function (resolve, reject) {
      var tx = db.transaction(CONFIG.STORE_NAME, "readonly");
      var store = tx.objectStore(CONFIG.STORE_NAME);
      var request = store.get(url);

      request.onsuccess = function () {
        console.log(
          "[DataManager] getData результат:",
          request.result ? "найден" : "не найден",
          "для URL:",
          url,
        );
        resolve(request.result);
      };

      request.onerror = function () {
        console.error("[DataManager] Ошибка получения данных:", request.error);
        reject(request.error);
      };
    });
  }

  // ==================== PDF КЭШИРОВАНИЕ ====================

  // Сохранение PDF в IndexedDB
  async function savePDF(url, blob) {
    if (!db) await initDB();

    return new Promise(function (resolve, reject) {
      var tx = db.transaction(CONFIG.PDF_STORE_NAME, "readwrite");
      var store = tx.objectStore(CONFIG.PDF_STORE_NAME);

      var record = {
        url: url,
        blob: blob,
        timestamp: Date.now(),
      };

      var request = store.put(record);

      request.onsuccess = function () {
        console.log("[DataManager] PDF сохранён в кэш:", url);
        resolve();
      };

      request.onerror = function () {
        console.error("[DataManager] Ошибка сохранения PDF:", request.error);
        reject(request.error);
      };
    });
  }

  // Получение PDF из IndexedDB
  async function getPDF(url) {
    if (!db) await initDB();

    return new Promise(function (resolve, reject) {
      var tx = db.transaction(CONFIG.PDF_STORE_NAME, "readonly");
      var store = tx.objectStore(CONFIG.PDF_STORE_NAME);
      var request = store.get(url);

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        console.error("[DataManager] Ошибка получения PDF:", request.error);
        reject(request.error);
      };
    });
  }

  // Загрузка PDF с кэшированием
  async function loadPDFWithCache(url) {
    var isOnline = navigator.onLine;

    console.log("[DataManager] Загрузка PDF:", { url: url, online: isOnline });

    var cached = await getPDF(url);

    if (cached) {
      var age = Date.now() - cached.timestamp;
      var ageDays = Math.round(age / 1000 / 60 / 60 / 24);
      console.log("[DataManager] PDF найден в кэше, возраст:", ageDays, "дн.");

      if (isOnline && age > CONFIG.CACHE_DURATION) {
        fetchAndCachePDF(url).catch(function (err) {
          console.log("[DataManager] Фоновое обновление PDF не удалось:", err);
        });
      }

      return {
        blob: cached.blob,
        fromCache: true,
        url: URL.createObjectURL(cached.blob),
      };
    }

    if (isOnline) {
      var result = await fetchAndCachePDF(url);
      return result;
    }

    throw new Error("Нет подключения к интернету и PDF не сохранён в кэше");
  }

  // Загрузка и кэширование PDF
  async function fetchAndCachePDF(url) {
    console.log("[DataManager] Загрузка PDF с сервера:", url);

    var downloadUrl = url;
    if (url.indexOf("drive.google.com") !== -1) {
      var match = url.match(/[-\w]{25,}/);
      if (match) {
        downloadUrl =
          "https://drive.google.com/uc?export=download&id=" + match[0];
      }
    }

    var response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error("Ошибка загрузки PDF: " + response.status);
    }

    var blob = await response.blob();

    await savePDF(url, blob);

    console.log("[DataManager] PDF загружен и закэширован");

    return {
      blob: blob,
      fromCache: false,
      url: URL.createObjectURL(blob),
    };
  }

  // Проверка, есть ли PDF в кэше
  async function hasPDF(url) {
    var cached = await getPDF(url);
    return cached !== undefined;
  }

  // Получение статистики кэша PDF
  async function getPDFCacheStats() {
    if (!db) await initDB();

    return new Promise(function (resolve, reject) {
      var tx = db.transaction(CONFIG.PDF_STORE_NAME, "readonly");
      var store = tx.objectStore(CONFIG.PDF_STORE_NAME);
      var request = store.getAll();

      request.onsuccess = function () {
        var allPDFs = request.result;
        var totalSize = 0;

        allPDFs.forEach(function (item) {
          if (item.blob && item.blob.size) {
            totalSize += item.blob.size;
          }
        });

        resolve({
          count: allPDFs.length,
          totalSize: totalSize,
          totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
        });
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  // Очистка кэша PDF
  async function clearPDFCache() {
    if (!db) await initDB();

    return new Promise(function (resolve, reject) {
      var tx = db.transaction(CONFIG.PDF_STORE_NAME, "readwrite");
      var store = tx.objectStore(CONFIG.PDF_STORE_NAME);
      var request = store.clear();

      request.onsuccess = function () {
        console.log("[DataManager] Кэш PDF очищен");
        resolve();
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  // ==================== КОНЕЦ PDF ====================

  // Получение timestamp данных
  async function getTimestamp(url) {
    if (!db) await initDB();

    return new Promise(function (resolve, reject) {
      var tx = db.transaction("timestamps", "readonly");
      var store = tx.objectStore("timestamps");
      var request = store.get(url);

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  // Сохранение timestamp
  async function saveTimestamp(url) {
    if (!db) await initDB();

    return new Promise(function (resolve, reject) {
      var tx = db.transaction("timestamps", "readwrite");
      var store = tx.objectStore("timestamps");

      var record = {
        url: url,
        timestamp: Date.now(),
      };

      var request = store.put(record);

      request.onerror = function () {
        reject(request.error);
      };

      // Ждём завершения транзакции
      tx.oncomplete = function () {
        resolve();
      };

      tx.onerror = function () {
        reject(tx.error);
      };
    });
  }

  // Проверка, нужно ли обновить данные
  async function needsUpdate(url) {
    try {
      var timestampRecord = await getTimestamp(url);

      if (!timestampRecord) {
        console.log(
          "[DataManager] Нет сохранённых данных, требуется обновление",
        );
        return { needed: true, reason: "no_data" };
      }

      var age = Date.now() - timestampRecord.timestamp;
      var isFresh = age < CONFIG.CACHE_DURATION;
      var ageDays = Math.round(age / 1000 / 60 / 60 / 24);

      console.log(
        "[DataManager] Возраст данных: " +
          ageDays +
          " дней, свежие: " +
          isFresh,
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
    var isOnline = navigator.onLine;

    console.log("[DataManager] Загрузка данных: онлайн=" + isOnline);

    var cached = await getData(url);
    var updateInfo = await needsUpdate(url);

    if (!cached) {
      console.log("[DataManager] Нет кэшированных данных");

      if (isOnline) {
        var data = await fetchAndCacheData(url);
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
        throw new Error("Нет подключения к интернету и нет сохранённых данных");
      }
    }

    if (isOnline) {
      if (updateInfo.needed) {
        console.log("[DataManager] Кэш устарел, обновляем...");
        try {
          var freshData = await fetchAndCacheData(url);
          return {
            data: freshData,
            fromCache: false,
            message: "Данные обновлены",
          };
        } catch (error) {
          console.warn("[DataManager] Не удалось обновить данные:", error);
          return {
            data: cached.data,
            fromCache: true,
            message: "Использованы сохранённые данные (ошибка обновления)",
          };
        }
      } else {
        // Данные свежие - просто возвращаем из кэша
        return {
          data: cached.data,
          fromCache: true,
          message: "Использованы кэшированные данные",
        };
      }
    } else {
      var daysSinceCache = Math.round(
        (Date.now() - cached.timestamp) / 1000 / 60 / 60 / 24,
      );
      var isExpired = daysSinceCache >= 7;

      return {
        data: cached.data,
        fromCache: true,
        message: isExpired
          ? "Внимание: данные устарели более 7 дней (нет интернета для обновления)"
          : "Использованы сохранённые данные (офлайн режим)",
        isExpired: isExpired,
      };
    }
  }

  // Загрузка и кэширование данных с сервера
  async function fetchAndCacheData(url) {
    console.log("[DataManager] Загрузка данных с сервера:", url);

    var response = await fetch(url);

    if (!response.ok) {
      throw new Error("Ошибка загрузки: " + response.status);
    }

    var csvText = await response.text();
    var data = csvToJSON(csvText);

    await saveData(url, data);
    await saveTimestamp(url);

    console.log("[DataManager] Данные загружены и закэшированы");

    return data;
  }

  // Конвертация CSV в JSON
  function csvToJSON(csvText) {
    var lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];

    var headers = lines[0].split(",").map(function (h) {
      return h.trim().replace(/^"|"$/g, "");
    });

    var result = [];
    for (var i = 1; i < lines.length; i++) {
      var values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        var obj = {};
        headers.forEach(function (header, index) {
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
    var result = [];
    var current = "";
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
      var char = line[i];

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

  // Очистка всего кэша данных
  async function clearAllCache() {
    console.log("[DataManager] Начинаем очистку кэша...");

    // Сначала закрываем соединение с базой
    if (db) {
      db.close();
      db = null;
      console.log("[DataManager] Соединение с БД закрыто");
    }

    // Удаляем базу полностью
    return new Promise(function (resolve, reject) {
      var request = indexedDB.deleteDatabase(CONFIG.DB_NAME);

      request.onsuccess = function () {
        console.log("[DataManager] База данных удалена");
        resolve();
      };

      request.onerror = function () {
        console.error("[DataManager] Ошибка удаления БД:", request.error);
        reject(request.error);
      };

      request.onblocked = function () {
        console.warn(
          "[DataManager] Удаление БД заблокировано - закройте другие вкладки",
        );
        // Всё равно считаем успешным, так как хранилища очищены
        resolve();
      };
    });
  }

  // Принудительное обновление данных
  async function forceRefresh(url) {
    if (!navigator.onLine) {
      throw new Error("Нет подключения к интернету");
    }

    console.log("[DataManager] Принудительное обновление:", url);

    var data = await fetchAndCacheData(url);

    return {
      data: data,
      fromCache: false,
      message: "Данные обновлены принудительно",
    };
  }

  // Получение информации о статусе данных
  async function getDataStatus(url) {
    var cached = await getData(url);
    var updateInfo = await needsUpdate(url);

    if (!cached) {
      return {
        hasData: false,
        status: "no_data",
        message: "Нет сохранённых данных",
      };
    }

    var age = Date.now() - cached.timestamp;
    var ageDays = Math.round(age / 1000 / 60 / 60 / 24);

    return {
      hasData: true,
      status: updateInfo.needed ? "expired" : "fresh",
      age: age,
      ageDays: ageDays,
      timestamp: cached.timestamp,
      message: updateInfo.needed
        ? "Данные устарели (" + ageDays + " дн. назад)"
        : "Данные свежие (" + ageDays + " дн. назад)",
    };
  }

  // Экспорт модуля
  global.DataManager = {
    init: initDB,
    loadDataWithCache: loadDataWithCache,
    getData: getData,
    saveData: saveData,
    getDataStatus: getDataStatus,
    needsUpdate: needsUpdate,
    clearAllCache: clearAllCache,
    clearPDFCache: clearPDFCache,
    forceRefresh: forceRefresh,
    isOnline: function () {
      return navigator.onLine;
    },

    // PDF функции
    loadPDFWithCache: loadPDFWithCache,
    savePDF: savePDF,
    getPDF: getPDF,
    hasPDF: hasPDF,
    getPDFCacheStats: getPDFCacheStats,

    // Отладка
    debugInfo: async function () {
      if (!db) await initDB();

      return new Promise(function (resolve) {
        var result = {
          stores: [],
          counts: {},
        };

        var storeNames = Array.from(db.objectStoreNames);
        result.stores = storeNames;

        var pending = storeNames.length;

        storeNames.forEach(function (name) {
          var tx = db.transaction(name, "readonly");
          var store = tx.objectStore(name);
          var countReq = store.count();

          countReq.onsuccess = function () {
            result.counts[name] = countReq.result;
            pending--;
            if (pending === 0) {
              console.log("[DataManager] Debug info:", result);
              resolve(result);
            }
          };

          countReq.onerror = function () {
            result.counts[name] = "error";
            pending--;
            if (pending === 0) {
              resolve(result);
            }
          };
        });
      });
    },
  };
})(window);
