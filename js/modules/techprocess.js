import { CommonUtils, DATA_TYPES } from './common.js';

/**
 * Модуль для работы с данными техпроцессов
 */
export const TechprocessManager = {
  // Приватные свойства
  _currentFilteredData: [],
  _elements: {},
  _categoryOptions: {},

  /**
   * Инициализация модуля техпроцессов
   */
  init() {
    this.initElements();
    this.loadTechprocessData();
    this.setupCategoryOptions();
  },

  /**
   * Инициализация элементов DOM
   */
  initElements() {
    this._elements = {
      screenSelect: document.getElementById("select-section"),
      screenResults: document.getElementById("results-section"),
      weldingTypeSelect: document.getElementById("weldingType"),
      confirmBtn: document.getElementById("confirmBtn"),
      backToSelectBtn: document.getElementById("backToSelectBtn"),
      backToSearchBtn2: document.getElementById("backToSearchBtn2"),
      noResults: document.getElementById("noResults"),
      tableBody: document.getElementById("tableBody"),
      generatePdfBtn: document.getElementById("generatePdfBtn"),
      resultsCount: document.getElementById("resultsCount")
    };

    // Делаем элементы доступными глобально для совместимости
    Object.keys(this._elements).forEach(key => {
      window[key] = this._elements[key];
    });
  },

  /**
   * Настройка опций категорий техпроцессов
   */
  setupCategoryOptions() {
    this._categoryOptions = {
      'cutting': {
        name: 'Резка',
        methods: ['plasma', 'laser', 'waterjet', 'mechanical']
      },
      'welding': {
        name: 'Сварка',
        methods: ['MMA', 'TIG', 'MIG', 'MAG']
      },
      'assembly': {
        name: 'Сборка',
        methods: ['bolted', 'welded', 'glued', 'riveted']
      },
      'machining': {
        name: 'Механическая обработка',
        methods: ['turning', 'milling', 'drilling', 'grinding']
      }
    };
  },

  /**
   * Инициализация обработчиков событий
   */
  initEventListeners() {
    const { confirmBtn, backToSelectBtn, backToSearchBtn2, generatePdfBtn, weldingTypeSelect } = this._elements;

    // Кнопка подтверждения поиска
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => this.performSearch());
    }

    // Кнопки навигации
    if (backToSelectBtn) {
      backToSelectBtn.addEventListener("click", () => {
        window.registryCommon?.showSection("select");
      });
    }

    if (backToSearchBtn2) {
      backToSearchBtn2.addEventListener("click", () => {
        window.registryCommon?.showSection("select");
      });
    }

    // Кнопка генерации PDF
    if (generatePdfBtn) {
      generatePdfBtn.addEventListener("click", () => this.generatePDF());
    }

    // Изменение типа сварки/обработки
    if (weldingTypeSelect) {
      weldingTypeSelect.addEventListener("change", () => {
        this._onWeldingTypeChange();
      });
    }
  },

  /**
   * Обработка изменения типа сварки/обработки
   */
  _onWeldingTypeChange() {
    const { weldingTypeSelect } = this._elements;
    const selectedType = weldingTypeSelect.value;
    
    console.log(`Изменен тип обработки на: ${selectedType}`);
    CommonUtils.showNotification(`Выбран тип обработки: ${selectedType}`, 'info');
  },

  /**
   * Выполнение поиска
   */
  performSearch() {
    const { weldingTypeSelect } = this._elements;
    const selectedType = weldingTypeSelect.value;
    
    if (!selectedType) {
      CommonUtils.showNotification('Выберите тип обработки', 'warning');
      return;
    }

    console.log(`Поиск техпроцессов типа: ${selectedType}`);
    CommonUtils.showNotification('Выполняется поиск техпроцессов...', 'info');

    // Здесь должна быть логика фильтрации данных
    this._currentFilteredData = [];
    this._displayResults();
  },

  /**
   * Отображение результатов
   */
  _displayResults() {
    const { tableBody, noResults, resultsCount } = this._elements;
    
    tableBody.innerHTML = '';
    
    if (this._currentFilteredData.length === 0) {
      noResults.style.display = 'block';
      resultsCount.textContent = '0';
    } else {
      noResults.style.display = 'none';
      resultsCount.textContent = this._currentFilteredData.length.toString();
      
      // Здесь должна быть логика отрисовки таблицы
      console.log('Отображение результатов поиска техпроцессов');
    }
  },

  /**
   * Загрузка данных техпроцессов
   */
  async loadTechprocessData() {
    try {
      CommonUtils.showNotification('Загрузка данных техпроцессов...', 'info');
      console.log('TechprocessManager: Загрузка данных техпроцессов');
      
      // Здесь должна быть логика загрузки с сервера
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      CommonUtils.showNotification('Данные техпроцессов загружены', 'success');
    } catch (error) {
      console.error('Ошибка загрузки данных техпроцессов:', error);
      CommonUtils.showNotification('Ошибка загрузки данных', 'error');
    }
  },

  /**
   * Генерация PDF отчета
   */
  generatePDF() {
    console.log('TechprocessManager: Генерация PDF отчета');
    CommonUtils.showNotification('Генерация PDF отчета...', 'info');
  },

  /**
   * Редактирование техпроцесса
   * @param {string} category - Категория техпроцесса
   * @param {number} index - Индекс (опционально)
   */
  editTechprocess(category, index = null) {
    console.log(`Редактирование техпроцесса из категории ${category}, индекс: ${index}`);
    CommonUtils.showNotification(`Редактирование техпроцесса категории ${category}`, 'info');
  },

  /**
   * Удаление техпроцесса
   * @param {string} category - Категория техпроцесса
   * @param {number} index - Индекс (опционально)
   */
  deleteTechprocess(category, index = null) {
    console.log(`Удаление техпроцесса из категории ${category}, индекс: ${index}`);
    CommonUtils.showNotification(`Техпроцесс категории ${category} удален`, 'success');
  },

  /**
   * Обновление статистики техпроцессов
   */
  updateTechprocessStats() {
    console.log('TechprocessManager: Обновление статистики техпроцессов');
    // Логика обновления статистики
  },

  /**
   * Фильтрация записей техпроцессов
   */
  filterTechprocessRecords() {
    console.log('Фильтрация записей техпроцессов');
    this.loadTechprocessData();
  },

  /**
   * Получение названия категории техпроцесса
   * @param {string} method - Метод обработки
   */
  getCategoryName(method) {
    for (const [key, value] of Object.entries(this._categoryOptions)) {
      if (value.methods.includes(method)) {
        return value.name;
      }
    }
    return 'Неизвестная категория';
  },

  /**
   * Получение отфильтрованных данных
   */
  getFilteredData() {
    return this._currentFilteredData;
  },

  /**
   * Получение текущего типа обработки
   */
  getCurrentWeldingType() {
    const { weldingTypeSelect } = this._elements;
    return weldingTypeSelect?.value || '';
  },

  /**
   * Получение доступных категорий
   */
  getAvailableCategories() {
    return Object.keys(this._categoryOptions).map(key => ({
      key,
      name: this._categoryOptions[key].name
    }));
  }
};

// Делаем модуль доступным глобально для совместимости
window.TechprocessManager = TechprocessManager;