// Конфигурация ссылок на Google Таблицы (опубликованные как CSV)
// Формат ссылки: https://docs.google.com/spreadsheets/d/e/.../pub?output=csv

const SPREADSHEET_URLS = {
  // Проволока (все методы в одной таблице)
  wire: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=0&single=true&output=csv",

  // Техпроцессы (нужна ссылка на таблицу)
  techprocess:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=365375436&single=true&output=csv",

  // Сварщики (нужна ссылка на таблицу)
  welders:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=486975204&single=true&output=csv",

  // Специалисты (нужна ссылка на таблицу)
  specialists:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=1406784205&single=true&output=csv",

  // Тех инструкции (нужна ссылка на таблицу)
  techInstructions:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=160757317&single=true&output=csv",

  // Сварочное оборудование (нужна ссылка на таблицу)
  weldingEquipment:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBUaDQFrjA7qYJlbwr-h_ni3_FZ5ajtlygUC9MIovaDiKY4SjWHHRLZvofXa99NYPLZGJeGssR7tVM/pub?gid=528555392&single=true&output=csv",
};

// Загрузка CSV и преобразование в JSON
async function loadCSVAsJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ошибка загрузки: ${response.status}`);
  }

  const csvText = await response.text();
  return csvToJSON(csvText);
}

// Конвертация CSV в JSON массив
function csvToJSON(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  // Заголовки из первой строки
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  // Данные
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

// Парсинг строки CSV с учётом кавычек
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

// Экспорт в глобальную область
window.spreadsheetConfig = {
  SPREADSHEET_URLS,
  loadCSVAsJSON,
};
