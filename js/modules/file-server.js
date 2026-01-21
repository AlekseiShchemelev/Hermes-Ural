import { CommonUtils } from './common.js';

/**
 * Модуль для работы с серверными операциями и файловой системой
 */
export class FileServer {
  constructor() {
    this._basePath = './data_json';
    this._delayMs = 500; // Эмуляция задержки сервера
  }

  /**
   * Сохранение JSON файла
   * @param {string} path - Путь к файлу
   * @param {object} data - Данные для сохранения
   */
  async saveJSONFile(path, data) {
    try {
      await this._delay();
      console.log(`FileServer: Сохранение файла ${path}`, data);
      
      // В реальном приложении здесь был бы HTTP запрос к серверу
      // Пока используем localStorage как эмуляцию
      localStorage.setItem(`file_${path}`, JSON.stringify(data));
      
      CommonUtils.showNotification(`Файл ${path} сохранен`, 'success');
      return true;
    } catch (error) {
      console.error('Ошибка сохранения файла:', error);
      CommonUtils.showNotification(`Ошибка сохранения файла ${path}`, 'error');
      throw error;
    }
  }

  /**
   * Загрузка JSON файла
   * @param {string} path - Путь к файлу
   */
  async loadJSONFile(path) {
    try {
      await this._delay();
      console.log(`FileServer: Загрузка файла ${path}`);
      
      // В реальном приложении здесь был бы HTTP запрос к серверу
      // Пока используем localStorage как эмуляцию
      const data = localStorage.getItem(`file_${path}`);
      
      if (data) {
        const parsedData = JSON.parse(data);
        CommonUtils.showNotification(`Файл ${path} загружен`, 'success');
        return parsedData;
      } else {
        console.warn(`Файл ${path} не найден, возвращаем пустой массив`);
        return [];
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      CommonUtils.showNotification(`Ошибка загрузки файла ${path}`, 'error');
      throw error;
    }
  }

  /**
   * Удаление файла
   * @param {string} path - Путь к файлу
   */
  async deleteFile(path) {
    try {
      await this._delay();
      console.log(`FileServer: Удаление файла ${path}`);
      
      // В реальном приложении здесь был бы HTTP запрос к серверу
      localStorage.removeItem(`file_${path}`);
      
      CommonUtils.showNotification(`Файл ${path} удален`, 'success');
      return true;
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      CommonUtils.showNotification(`Ошибка удаления файла ${path}`, 'error');
      throw error;
    }
  }

  /**
   * Получение списка файлов
   * @param {string} directory - Директория
   */
  async listFiles(directory) {
    try {
      await this._delay();
      console.log(`FileServer: Получение списка файлов в ${directory}`);
      
      // Получаем все ключи из localStorage
      const files = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`file_${directory}`)) {
          files.push(key.replace(`file_`, ''));
        }
      }
      
      return files;
    } catch (error) {
      console.error('Ошибка получения списка файлов:', error);
      CommonUtils.showNotification('Ошибка получения списка файлов', 'error');
      throw error;
    }
  }

  /**
   * Эмуляция задержки
   * @param {number} ms - Время задержки в миллисекундах
   */
  async _delay(ms = this._delayMs) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Инициализация тестовых данных
   */
  async initializeTestData() {
    try {
      console.log('FileServer: Инициализация тестовых данных');
      
      // Создаем тестовые данные для проволоки
      const wireData = [
        { id: 1, category: 'MMA', diameter: '2.5', type: 'Электроды' },
        { id: 2, category: 'TIG', diameter: '1.6', type: 'Прутки' }
      ];
      
      // Создаем тестовые данные для сварщиков
      const weldersData = [
        { id: 1, fio: 'Иванов И.И.', category: 'MMA', experience: 5 },
        { id: 2, fio: 'Петров П.П.', category: 'TIG', experience: 3 }
      ];
      
      // Сохраняем тестовые данные
      await this.saveJSONFile('wire/data.json', wireData);
      await this.saveJSONFile('welders/data.json', weldersData);
      
      CommonUtils.showNotification('Тестовые данные инициализированы', 'success');
    } catch (error) {
      console.error('Ошибка инициализации тестовых данных:', error);
      CommonUtils.showNotification('Ошибка инициализации тестовых данных', 'error');
    }
  }

  /**
   * Резервное копирование всех данных
   */
  async createFullBackup() {
    try {
      console.log('FileServer: Создание полного резервного копирования');
      
      const backupData = {};
      
      // Получаем все данные из localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('file_')) {
          const filePath = key.replace('file_', '');
          const data = localStorage.getItem(key);
          backupData[filePath] = JSON.parse(data);
        }
      }
      
      // Добавляем метаданные
      backupData._metadata = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'full_backup'
      };
      
      return backupData;
    } catch (error) {
      console.error('Ошибка создания резервной копии:', error);
      CommonUtils.showNotification('Ошибка создания резервной копии', 'error');
      throw error;
    }
  }

  /**
   * Восстановление из резервной копии
   * @param {object} backupData - Данные резервной копии
   */
  async restoreFromBackup(backupData) {
    try {
      console.log('FileServer: Восстановление из резервной копии');
      
      // Очищаем текущие данные
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('file_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Восстанавливаем данные из резервной копии
      for (const [filePath, data] of Object.entries(backupData)) {
        if (!filePath.startsWith('_')) { // Пропускаем метаданные
          await this.saveJSONFile(filePath, data);
        }
      }
      
      CommonUtils.showNotification('Данные восстановлены из резервной копии', 'success');
    } catch (error) {
      console.error('Ошибка восстановления из резервной копии:', error);
      CommonUtils.showNotification('Ошибка восстановления из резервной копии', 'error');
      throw error;
    }
  }

  /**
   * Проверка доступности файлов
   */
  async checkFilesAvailability() {
    try {
      console.log('FileServer: Проверка доступности файлов');
      
      const files = await this.listFiles('');
      const availableFiles = files.length;
      
      CommonUtils.showNotification(`Доступно файлов: ${availableFiles}`, 'info');
      return availableFiles > 0;
    } catch (error) {
      console.error('Ошибка проверки доступности файлов:', error);
      return false;
    }
  }
}

// Создаем глобальный экземпляр сервера
export const fileServer = new FileServer();

// Делаем сервер доступным глобально для совместимости
window.FileServer = FileServer;
window.fileServer = fileServer;