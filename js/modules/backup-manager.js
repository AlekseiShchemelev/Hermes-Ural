import { CommonUtils } from './common.js';
import { fileServer } from './file-server.js';

/**
 * Модуль для управления резервными копиями и версионированием
 */
export class BackupManager {
  constructor() {
    this._backupStorageKey = 'backup_registry';
    this._commitsStorageKey = 'commit_registry';
    this._maxBackups = 10; // Максимальное количество хранимых бэкапов
  }

  /**
   * Инициализация системы бэкапов
   */
  init() {
    this._loadBackupRegistry();
    this._loadCommitRegistry();
    console.log('BackupManager: Система резервных копий инициализирована');
  }

  /**
   * Создание резервной копии всех данных
   * @param {string} description - Описание бэкапа
   */
  async createBackup(description = "Автоматическое создание резервной копии") {
    try {
      console.log('BackupManager: Создание резервной копии...');
      CommonUtils.showNotification('Создание резервной копии...', 'info');

      // Получаем текущие данные
      const backupData = await fileServer.createFullBackup();
      
      // Создаем запись о бэкапе
      const backup = {
        id: this._generateBackupId(),
        timestamp: new Date().toISOString(),
        description: description,
        data: backupData,
        size: JSON.stringify(backupData).length,
        recordCount: this._calculateTotalRecords(backupData)
      };

      // Сохраняем бэкап
      await this._saveBackup(backup);

      // Создаем коммит
      this.createCommit(`Создана резервная копия: ${description}`);

      CommonUtils.showNotification('Резервная копия создана', 'success');
      return backup;
    } catch (error) {
      console.error('Ошибка создания резервной копии:', error);
      CommonUtils.showNotification('Ошибка создания резервной копии', 'error');
      throw error;
    }
  }

  /**
   * Восстановление из бэкапа
   * @param {string} backupId - ID бэкапа
   */
  async restoreFromBackup(backupId) {
    try {
      console.log(`BackupManager: Восстановление из бэкапа ${backupId}`);
      
      const backup = await this._loadBackup(backupId);
      if (!backup) {
        throw new Error(`Резервная копия ${backupId} не найдена`);
      }

      CommonUtils.showNotification('Восстановление данных из резервной копии...', 'info');

      // Восстанавливаем данные
      await fileServer.restoreFromBackup(backup.data);

      // Создаем коммит восстановления
      this.createCommit(`Восстановление из резервной копии: ${backup.description}`);

      CommonUtils.showNotification('Данные успешно восстановлены', 'success');
      return true;
    } catch (error) {
      console.error('Ошибка восстановления из резервной копии:', error);
      CommonUtils.showNotification('Ошибка восстановления из резервной копии', 'error');
      throw error;
    }
  }

  /**
   * Загрузка бэкапа из файла
   * @param {File} file - Файл резервной копии
   */
  async loadBackupFromFile(file) {
    try {
      console.log('BackupManager: Загрузка бэкапа из файла');
      
      const fileContent = await this._readFileAsText(file);
      const backupData = JSON.parse(fileContent);

      if (!backupData._metadata || backupData._metadata.type !== 'full_backup') {
        throw new Error('Некорректный формат файла резервной копии');
      }

      CommonUtils.showNotification('Восстановление из файла...', 'info');

      // Восстанавливаем данные
      await fileServer.restoreFromBackup(backupData);

      // Создаем коммит
      this.createCommit(`Восстановление из файла: ${file.name}`);

      CommonUtils.showNotification('Данные восстановлены из файла', 'success');
      return true;
    } catch (error) {
      console.error('Ошибка загрузки бэкапа из файла:', error);
      CommonUtils.showNotification('Ошибка загрузки файла резервной копии', 'error');
      throw error;
    }
  }

  /**
   * Сохранение бэкапа в файл
   * @param {object} backup - Объект резервной копии
   */
  saveBackupToFile(backup) {
    try {
      console.log('BackupManager: Сохранение бэкапа в файл');
      
      const filename = `backup_${backup.id}_${new Date().toISOString().split('T')[0]}.json`;
      CommonUtils.downloadJSONFile(backup.data, filename);
      
      CommonUtils.showNotification(`Резервная копия сохранена как ${filename}`, 'success');
    } catch (error) {
      console.error('Ошибка сохранения бэкапа в файл:', error);
      CommonUtils.showNotification('Ошибка сохранения файла резервной копии', 'error');
      throw error;
    }
  }

  /**
   * Создание коммита изменений
   * @param {string} message - Сообщение коммита
   */
  createCommit(message) {
    const commit = {
      id: this._generateCommitId(),
      timestamp: new Date().toISOString(),
      message: message,
      changes: this.getCurrentChanges()
    };

    // Добавляем коммит в начало списка
    const commits = this._loadCommitRegistry();
    commits.unshift(commit);

    // Ограничиваем количество коммитов
    if (commits.length > 50) {
      commits.splice(50);
    }

    // Сохраняем
    localStorage.setItem(this._commitsStorageKey, JSON.stringify(commits));
    
    console.log(`Commit: ${message}`);
    return commit;
  }

  /**
   * Получение текущих изменений
   */
  getCurrentChanges() {
    // Здесь должна быть логика отслеживания изменений
    // Пока возвращаем заглушку
    return {
      modified: [],
      added: [],
      deleted: []
    };
  }

  /**
   * Подсчет общего количества записей
   */
  calculateTotalRecords() {
    // Подсчет общего количества записей во всех данных
    let total = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('file_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(data)) {
            total += data.length;
          }
        } catch (e) {
          // Игнорируем ошибки парсинга
        }
      }
    }
    
    return total;
  }

  /**
   * Получение списка всех резервных копий
   */
  getBackupList() {
    return this._loadBackupRegistry();
  }

  /**
   * Получение истории коммитов
   */
  getCommitHistory() {
    return this._loadCommitRegistry();
  }

  /**
   * Удаление резервной копии
   * @param {string} backupId - ID бэкапа
   */
  async deleteBackup(backupId) {
    try {
      const backups = this._loadBackupRegistry();
      const filteredBackups = backups.filter(b => b.id !== backupId);
      
      localStorage.setItem(this._backupStorageKey, JSON.stringify(filteredBackups));
      
      CommonUtils.showNotification('Резервная копия удалена', 'success');
      return true;
    } catch (error) {
      console.error('Ошибка удаления резервной копии:', error);
      CommonUtils.showNotification('Ошибка удаления резервной копии', 'error');
      throw error;
    }
  }

  // Приватные методы

  /**
   * Генерация ID для резервной копии
   */
  _generateBackupId() {
    return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Генерация ID для коммита
   */
  _generateCommitId() {
    return 'commit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Подсчет общего количества записей в данных
   * @param {object} data - Данные
   */
  _calculateTotalRecords(data) {
    let total = 0;
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith('_') && Array.isArray(value)) {
        total += value.length;
      }
    }
    return total;
  }

  /**
   * Чтение файла как текст
   * @param {File} file - Файл
   */
  _readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * Загрузка реестра резервных копий
   */
  _loadBackupRegistry() {
    try {
      const data = localStorage.getItem(this._backupStorageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Ошибка загрузки реестра резервных копий:', error);
      return [];
    }
  }

  /**
   * Загрузка реестра коммитов
   */
  _loadCommitRegistry() {
    try {
      const data = localStorage.getItem(this._commitsStorageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Ошибка загрузки реестра коммитов:', error);
      return [];
    }
  }

  /**
   * Сохранение резервной копии
   * @param {object} backup - Объект резервной копии
   */
  async _saveBackup(backup) {
    const backups = this._loadBackupRegistry();
    
    // Добавляем в начало списка
    backups.unshift(backup);
    
    // Ограничиваем количество бэкапов
    if (backups.length > this._maxBackups) {
      backups.splice(this._maxBackups);
    }
    
    localStorage.setItem(this._backupStorageKey, JSON.stringify(backups));
  }

  /**
   * Загрузка резервной копии по ID
   * @param {string} backupId - ID резервной копии
   */
  _loadBackup(backupId) {
    const backups = this._loadBackupRegistry();
    return backups.find(b => b.id === backupId);
  }
}

// Создаем глобальный экземпляр менеджера бэкапов
export const backupManager = new BackupManager();

// Делаем менеджер доступным глобально для совместимости
window.BackupManager = BackupManager;
window.backupManager = backupManager;