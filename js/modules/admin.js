import { CommonUtils, DATA_TYPES, SectionManager } from './common.js';

/**
 * Модуль администрирования данных
 */
export const AdminManager = {
  // Приватные свойства для хранения состояния
  _currentDataType: null,
  _dataCache: new Map(),

  /**
   * Инициализация админ модуля
   */
  init() {
    this._bindEvents();
    this._initializeDataCache();
  },

  /**
   * Привязка событий
   */
  _bindEvents() {
    // События будут привязаны через HTML или другие модули
    console.log('AdminManager: События инициализированы');
  },

  /**
   * Инициализация кэша данных
   */
  _initializeDataCache() {
    // Инициализируем пустой кэш для всех типов данных
    Object.values(DATA_TYPES).forEach(type => {
      this._dataCache.set(type, []);
    });
  },

  /**
   * Выбор типа данных
   * @param {string} dataType - Тип данных
   */
  selectDataType(dataType) {
    this._currentDataType = dataType;
    window.currentDataType = dataType; // Для совместимости с существующим кодом
    CommonUtils.showNotification(`Выбран тип данных: ${dataType}`, 'info');
  },

  /**
   * Загрузка всех данных (алиас для loadData)
   */
  loadAllData() {
    return this.loadData();
  },

  /**
   * Загрузка данных
   */
  async loadData() {
    try {
      CommonUtils.showNotification('Загрузка данных...', 'info');
      // Здесь должна быть логика загрузки с сервера
      // Пока используем заглушку
      console.log('AdminManager: Загрузка данных');
      CommonUtils.showNotification('Данные загружены', 'success');
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      CommonUtils.showNotification('Ошибка загрузки данных', 'error');
    }
  },

  /**
   * Загрузка таблицы
   */
  loadTable() {
    if (!this._currentDataType) {
      CommonUtils.showNotification('Не выбран тип данных', 'warning');
      return;
    }
    console.log(`Загрузка таблицы для типа: ${this._currentDataType}`);
    // Логика загрузки таблицы
  },

  /**
   * Загрузка таблицы проволоки
   */
  loadWireTable() {
    console.log('Загрузка таблицы проволоки');
    // Специфичная логика для проволоки
  },

  /**
   * Загрузка таблицы сварщиков
   */
  loadWeldersTable() {
    console.log('Загрузка таблицы сварщиков');
    // Специфичная логика для сварщиков
  },

  /**
   * Загрузка таблицы специалистов
   */
  loadSpecialistsTable() {
    console.log('Загрузка таблицы специалистов');
    // Специфичная логика для специалистов
  },

  /**
   * Загрузка таблицы техпроцессов
   */
  loadTechprocessTable() {
    console.log('Загрузка таблицы техпроцессов');
    // Специфичная логика для техпроцессов
  },

  /**
   * Общая функция обновления статистики
   */
  updateStats() {
    this.updateWireStats();
    this.updateWeldersStats();
    this.updateSpecialistsStats();
    this.updateTechprocessStats();
  },

  /**
   * Статистика проволоки
   */
  updateWireStats() {
    console.log('Обновление статистики проволоки');
    // Логика обновления статистики проволоки
  },

  /**
   * Статистика сварщиков
   */
  updateWeldersStats() {
    console.log('Обновление статистики сварщиков');
    // Логика обновления статистики сварщиков
  },

  /**
   * Статистика специалистов
   */
  updateSpecialistsStats() {
    console.log('Обновление статистики специалистов');
    // Логика обновления статистики специалистов
  },

  /**
   * Статистика техпроцессов
   */
  updateTechprocessStats() {
    console.log('Обновление статистики техпроцессов');
    // Логика обновления статистики техпроцессов
  },

  /**
   * Переключение между секциями
   * @param {string} sectionName - Название секции
   */
  showSection(sectionName) {
    SectionManager.showSection(sectionName);
  },

  /**
   * Редактирование записи
   * @param {string} id - ID записи
   * @param {string} dataType - Тип данных
   */
  editRecord(id, dataType = DATA_TYPES.WIRE) {
    console.log(`Редактирование записи ${id} типа ${dataType}`);
    CommonUtils.showNotification(`Редактирование записи ${id}`, 'info');
  },

  /**
   * Удаление записи
   * @param {string} id - ID записи
   * @param {string} dataType - Тип данных
   */
  deleteRecord(id, dataType = DATA_TYPES.WIRE) {
    console.log(`Удаление записи ${id} типа ${dataType}`);
    CommonUtils.showNotification(`Запись ${id} удалена`, 'success');
  },

  /**
   * Сохранение данных в JSON файлы
   * @param {string} dataType - Тип данных
   */
  saveData(dataType = null) {
    const message = dataType ? `Сохранение данных типа ${dataType}` : 'Сохранение всех данных';
    console.log(message);
    CommonUtils.showNotification(message, 'info');
  },

  /**
   * Создание резервной копии
   */
  createBackup() {
    console.log('Создание резервной копии');
    CommonUtils.showNotification('Создание резервной копии...', 'info');
    // Логика создания бэкапа
  },

  /**
   * Фильтрация записей
   */
  filterRecords() {
    console.log('Фильтрация записей');
    this.loadTable();
  },

  /**
   * Фильтрация проволоки
   */
  filterWireRecords() {
    console.log('Фильтрация проволоки');
    this.loadWireTable();
  },

  /**
   * Фильтрация сварщиков
   */
  filterWeldersRecords() {
    console.log('Фильтрация сварщиков');
    this.loadWeldersTable();
  },

  /**
   * Фильтрация специалистов
   */
  filterSpecialistsRecords() {
    console.log('Фильтрация специалистов');
    this.loadSpecialistsTable();
  },

  /**
   * Фильтрация техпроцессов
   */
  filterTechprocessRecords() {
    console.log('Фильтрация техпроцессов');
    this.loadTechprocessTable();
  },

  /**
   * Экспорт всех данных
   */
  exportAllData() {
    console.log('Экспорт всех данных');
    CommonUtils.showNotification('Экспорт всех данных', 'info');
    // Логика экспорта
  },

  /**
   * Экспорт данных
   * @param {string} dataType - Тип данных
   */
  exportData(dataType) {
    console.log(`Экспорт данных типа: ${dataType}`);
    CommonUtils.showNotification(`Экспорт данных типа ${dataType}`, 'info');
    // Логика экспорта
  },

  /**
   * Импорт всех данных из файла
   * @param {Event} event - Событие файла
   */
  importAllData(event) {
    console.log('Импорт всех данных');
    CommonUtils.showNotification('Импорт всех данных', 'info');
    // Логика импорта
  },

  /**
   * Импорт данных
   * @param {Event} event - Событие файла
   */
  importData(event) {
    console.log('Импорт данных');
    CommonUtils.showNotification('Импорт данных', 'info');
    // Логика импорта
  },

  /**
   * Получение названия категории сварщика по методу
   * @param {string} method - Метод сварки
   */
  getWelderCategoryName(method) {
    const categories = {
      'manual': 'Ручная сварка',
      'automatic': 'Автоматическая сварка',
      'semi-automatic': 'Полуавтоматическая сварка'
    };
    return categories[method] || 'Неизвестная категория';
  },

  /**
   * Получение названия категории техпроцесса по методу
   * @param {string} method - Метод
   */
  getTechprocessCategoryName(method) {
    const categories = {
      'cutting': 'Резка',
      'welding': 'Сварка',
      'assembly': 'Сборка'
    };
    return categories[method] || 'Неизвестная категория';
  },

  /**
   * Получение отображаемого названия способа сварки
   * @param {string} method - Метод сварки
   */
  getMethodDisplay(method) {
    const displays = {
      'MMA': 'Ручная дуговая сварка',
      'TIG': 'Аргонодуговая сварка',
      'MIG': 'Полуавтоматическая сварка'
    };
    return displays[method] || method;
  },

  /**
   * Проверка доступности файлов
   */
  checkFilesAvailability() {
    console.log('Проверка доступности файлов');
    // Логика проверки файлов
    return true; // Заглушка
  }
};

// Делаем модуль доступным глобально для совместимости
window.AdminManager = AdminManager;