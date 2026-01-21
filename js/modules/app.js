import { CommonUtils, SectionManager } from './common.js';
import { AdminManager } from './admin.js';
import { WireManager } from './wire.js';
import { WeldersManager } from './welders.js';
import { SpecialistsManager } from './specialists.js';
import { TechprocessManager } from './techprocess.js';
import { FileServer, fileServer } from './file-server.js';
import { BackupManager, backupManager } from './backup-manager.js';

/**
 * Главный модуль приложения
 * Отвечает за инициализацию всех модулей и координацию их работы
 */
export class Application {
  constructor() {
    this._modules = {};
    this._initialized = false;
  }

  /**
   * Инициализация всего приложения
   */
  async init() {
    if (this._initialized) {
      console.warn('Приложение уже инициализировано');
      return;
    }

    try {
      console.log('Application: Начало инициализации приложения...');
      
      // Инициализируем базовые модули
      this._initBasicModules();
      
      // Инициализируем модули данных
      await this._initDataModules();
      
      // Инициализируем серверные модули
      await this._initServerModules();
      
      // Настраиваем глобальную навигацию
      this._setupGlobalNavigation();
      
      // Инициализируем тестовые данные если нужно
      await this._initTestData();
      
      this._initialized = true;
      
      CommonUtils.showNotification('Приложение успешно инициализировано', 'success');
      console.log('Application: Инициализация завершена');
      
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      CommonUtils.showNotification('Ошибка инициализации приложения', 'error');
      throw error;
    }
  }

  /**
   * Инициализация базовых модулей
   */
  _initBasicModules() {
    console.log('Application: Инициализация базовых модулей');
    
    // AdminManager уже инициализирован в своем модуле
    this._modules.admin = AdminManager;
    
    // Делаем модули доступными глобально для совместимости
    window.registryCommon = {
      showSection: (sectionName) => SectionManager.showSection(sectionName),
      showNotification: (message, type) => CommonUtils.showNotification(message, type)
    };
  }

  /**
   * Инициализация модулей данных
   */
  async _initDataModules() {
    console.log('Application: Инициализация модулей данных');
    
    // Инициализируем WireManager только если элементы существуют
    if (document.getElementById('wireCategory')) {
      this._modules.wire = WireManager;
      WireManager.init();
    }
    
    // Инициализируем WeldersManager только если элементы существуют
    if (document.getElementById('weldingType')) {
      this._modules.welders = WeldersManager;
      WeldersManager.init();
    }
    
    // Инициализируем SpecialistsManager только если элементы существуют
    if (document.getElementById('specialistSelect')) {
      this._modules.specialists = SpecialistsManager;
      SpecialistsManager.init();
    }
    
    // Инициализируем TechprocessManager только если элементы существуют
    if (document.getElementById('weldingType')) {
      this._modules.techprocess = TechprocessManager;
      TechprocessManager.init();
    }
  }

  /**
   * Инициализация серверных модулей
   */
  async _initServerModules() {
    console.log('Application: Инициализация серверных модулей');
    
    // Инициализируем FileServer
    this._modules.fileServer = fileServer;
    
    // Инициализируем BackupManager
    this._modules.backup = backupManager;
    backupManager.init();
  }

  /**
   * Настройка глобальной навигации
   */
  _setupGlobalNavigation() {
    console.log('Application: Настройка глобальной навигации');
    
    // Делаем функции навигации глобально доступными для совместимости
    window.showSection = (sectionName) => SectionManager.showSection(sectionName);
    
    // Функции для совместимости с существующим кодом
    window.editTechprocess = (category, index = null) => {
      TechprocessManager.editTechprocess(category, index);
    };
    
    window.loadAllData = () => {
      AdminManager.loadAllData();
    };
    
    window.loadData = () => {
      return AdminManager.loadData();
    };
    
    window.testFunction = () => {
      console.log("Тестовая функция работает!");
      CommonUtils.showNotification("Тестовая функция работает!", 'info');
    };
    
    window.commitChanges = (dataType) => {
      return CommonUtils.commitChanges(dataType);
    };
    
    // Функции для фильтрации
    window.filterTechprocessRecords = () => {
      TechprocessManager.filterTechprocessRecords();
    };
  }

  /**
   * Инициализация тестовых данных
   */
  async _initTestData() {
    // Проверяем, есть ли уже данные
    const hasData = await fileServer.checkFilesAvailability();
    
    if (!hasData) {
      console.log('Application: Инициализация тестовых данных');
      await fileServer.initializeTestData();
    }
  }

  /**
   * Получение модуля по имени
   * @param {string} moduleName - Имя модуля
   */
  getModule(moduleName) {
    return this._modules[moduleName];
  }

  /**
   * Получение всех модулей
   */
  getAllModules() {
    return { ...this._modules };
  }

  /**
   * Перезагрузка модуля
   * @param {string} moduleName - Имя модуля
   */
  async reloadModule(moduleName) {
    console.log(`Application: Перезагрузка модуля ${moduleName}`);
    
    const module = this._modules[moduleName];
    if (module && typeof module.init === 'function') {
      await module.init();
      CommonUtils.showNotification(`Модуль ${moduleName} перезагружен`, 'success');
    }
  }

  /**
   * Получение статуса инициализации
   */
  isInitialized() {
    return this._initialized;
  }
}

// Создаем глобальный экземпляр приложения
export const app = new Application();

// Делаем приложение доступным глобально для отладки
window.Application = Application;
window.app = app;

/**
 * Автоматическая инициализация при загрузке DOM
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init().catch(error => {
      console.error('Критическая ошибка инициализации:', error);
    });
  });
} else {
  // DOM уже загружен
  app.init().catch(error => {
    console.error('Критическая ошибка инициализации:', error);
  });
}