// Конфигурация ссылок на Google Таблицы (опубликованные как CSV)
// Формат ссылки: https://docs.google.com/spreadsheets/d/e/.../pub?output=csv

const SPREADSHEET_URLS = {
  // Проволока (все методы в одной таблице)
  wire: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=0&single=true&output=csv",

  // Техпроцессы
  techprocess:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=365375436&single=true&output=csv",

  // Сварщики
  welders:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=486975204&single=true&output=csv",

  // Специалисты
  specialists:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=1406784205&single=true&output=csv",

  // Тех инструкции
  techInstructions:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=160757317&single=true&output=csv",

  // Сварочное оборудование
  weldingEquipment:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=528555392&single=true&output=csv",
};

// Инициализация DataManager
let dataManagerReady = false;
let lastLoadInfo = null;

async function initDataManager() {
  if (!dataManagerReady && window.DataManager) {
    await window.DataManager.init();
    dataManagerReady = true;
  }
  return dataManagerReady;
}

function getLastLoadInfo() {
  return lastLoadInfo;
}

// Загрузка CSV с кэшированием на 24 часа
async function loadCSVAsJSON(url) {
  if (window.DataManager) {
    await initDataManager();

    try {
      const result = await window.DataManager.loadDataWithCache(url);

      lastLoadInfo = {
        url: url,
        fromCache: result.fromCache,
        message: result.message,
        isExpired: result.isExpired,
        timestamp: Date.now(),
      };

      console.log("[spreadsheet-config] Загрузка:", lastLoadInfo);

      if (result && result.data) {
        return result.data;
      } else {
        console.error("[spreadsheet-config] result.data is undefined!");
        return await loadCSVDirect(url);
      }
    } catch (error) {
      console.error("[spreadsheet-config] Ошибка:", error);

      if (navigator.onLine) {
        const data = await loadCSVDirect(url);
        lastLoadInfo = {
          url: url,
          fromCache: false,
          message: "Данные загружены с сервера",
          isExpired: false,
          timestamp: Date.now(),
        };
        return data;
      }
      throw error;
    }
  }

  // Fallback
  const data = await loadCSVDirect(url);
  lastLoadInfo = {
    url: url,
    fromCache: false,
    message: "Данные загружены с сервера (без кэширования)",
    isExpired: false,
    timestamp: Date.now(),
  };
  return data;
}

// Прямая загрузка CSV
async function loadCSVDirect(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Ошибка загрузки: " + response.status);
  }

  const csvText = await response.text();
  return csvToJSON(csvText);
}

// Конвертация CSV в JSON
function csvToJSON(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(function(h) {
    return h.trim().replace(/^"|"$/g, "");
  });

  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length) {
      const obj = {};
      headers.forEach(function(header, index) {
        obj[header] = values[index] ? values[index].trim().replace(/^"|"$/g, "") : "";
      });
      result.push(obj);
    }
  }

  return result;
}

// Парсинг CSV строки
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

// Экспорт
window.spreadsheetConfig = {
  SPREADSHEET_URLS: SPREADSHEET_URLS,
  loadCSVAsJSON: loadCSVAsJSON,
  getLastLoadInfo: getLastLoadInfo
};
