// emulate-server.js - Эмуляция серверного API для работы с файлами
class FileServer {
  constructor() {
    this.basePath = "/data_json/";
    this.fileCache = {};
  }

  // Сохранение JSON файла
  async saveJSONFile(path, data) {
    console.log(`[Сервер] Сохранение файла: ${path}`);

    // Эмуляция задержки сервера
    await this.delay(300);

    // Сохраняем в кэш (в реальном приложении здесь был бы запрос к серверу)
    this.fileCache[path] = JSON.parse(JSON.stringify(data));

    // Сохраняем в localStorage для демонстрации
    localStorage.setItem(`server_${path}`, JSON.stringify(data));

    console.log(`[Сервер] Файл ${path} сохранен успешно`);
    return { success: true, message: "Файл сохранен" };
  }

  // Загрузка JSON файла
  async loadJSONFile(path) {
    console.log(`[Сервер] Загрузка файла: ${path}`);

    // Проверяем кэш
    if (this.fileCache[path]) {
      return this.fileCache[path];
    }

    // Пытаемся загрузить из localStorage (эмуляция)
    const cached = localStorage.getItem(`server_${path}`);
    if (cached) {
      try {
        this.fileCache[path] = JSON.parse(cached);
        return this.fileCache[path];
      } catch (e) {
        console.warn(`[Сервер] Ошибка парсинга кэша: ${e}`);
      }
    }

    // Эмуляция задержки
    await this.delay(500);

    // Если нет в кэше, возвращаем пустой объект
    console.warn(`[Сервер] Файл не найден: ${path}`);
    return {};
  }

  // Удаление файла
  async deleteFile(path) {
    console.log(`[Сервер] Удаление файла: ${path}`);

    delete this.fileCache[path];
    localStorage.removeItem(`server_${path}`);

    return { success: true, message: "Файл удален" };
  }

  // Получение списка файлов
  async listFiles(directory) {
    console.log(`[Сервер] Получение списка файлов: ${directory}`);

    // Эмулируем структуру файлов
    const files = [];

    // Проверяем существующие файлы в localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`server_${directory}`)) {
        files.push({
          name: key.replace(`server_${directory}`, ""),
          path: key.replace("server_", ""),
          size: localStorage.getItem(key).length,
          modified: new Date().toISOString(),
        });
      }
    }

    return files;
  }

  // Эмуляция задержки
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Инициализация тестовых данных
  async initializeTestData() {
    console.log("[Сервер] Инициализация тестовых данных");

    // Создаем тестовые файлы структуры
    const testFiles = {
      "data_json/mp/data-wire-mp.json": {
        wireDataMP: [],
      },
      "data_json/af/data-wire-af.json": {
        wireDataAF: [],
      },
      "data_json/rad/data-wire-rad.json": {
        wireDataRAD: [],
      },
      "data_json/rd/data-wire-rd.json": {
        wireDataRD: [],
      },
    };

    for (const [path, data] of Object.entries(testFiles)) {
      await this.saveJSONFile(path, data);
    }

    console.log("[Сервер] Тестовые данные инициализированы");
  }
}

// Экспортируем глобально
window.FileServer = FileServer;
