import { CommonUtils } from './common.js';

/**
 * Модуль для работы с данными проволоки
 */
export const WireManager = {
  // Приватные свойства
  _currentFilteredData: [],
  _elements: {},
  _diameterOptions: {},

  /**
   * Инициализация модуля проволоки
   */
  init() {
    this.initElements();
    this.initEventListeners();
    this.loadWireData();
    this.setupDiameterOptions();
  },

  /**
   * Инициализация элементов DOM
   */
  initElements() {
    this._elements = {
      screenSelect: document.getElementById("select-section"),
      screenResults: document.getElementById("results-section"),
      wireCategorySelect: document.getElementById("wireCategory"),
      weldingMethodSelect: document.getElementById("weldingMethod"),
      wireDiameterSelect: document.getElementById("wireDiameter"),
      searchBtn: document.getElementById("searchBtn"),
      resetBtn: document.getElementById("resetBtn"),
      backToSearchBtn: document.getElementById("backToSearchBtn"),
      generatePdfBtn: document.getElementById("generatePdfBtn"),
      backToSearchBtn2: document.getElementById("backToSearchBtn2"),
      resultsBody: document.getElementById("resultsBody"),
      noResults: document.getElementById("noResults"),
      resultsCount: document.getElementById("resultsCount")
    };

    // Делаем элементы доступными глобально для совместимости
    Object.keys(this._elements).forEach(key => {
      window[key] = this._elements[key];
    });
  },

  /**
   * Настройка опций диаметров для разных способов сварки
   */
  setupDiameterOptions() {
    this._diameterOptions = {
      'MMA': [
        { value: '2.5', text: '2.5 мм' },
        { value: '3.0', text: '3.0 мм' },
        { value: '4.0', text: '4.0 мм' }
      ],
      'TIG': [
        { value: '1.6', text: '1.6 мм' },
        { value: '2.0', text: '2.0 мм' },
        { value: '2.4', text: '2.4 мм' }
      ],
      'MIG': [
        { value: '0.6', text: '0.6 мм' },
        { value: '0.8', text: '0.8 мм' },
        { value: '1.0', text: '1.0 мм' }
      ]
    };
  },

  /**
   * Инициализация обработчиков событий
   */
  initEventListeners() {
    const { weldingMethodSelect, searchBtn, resetBtn, backToSearchBtn, backToSearchBtn2, generatePdfBtn } = this._elements;

    // Обновляем опции диаметра при выборе способа сварки
    if (weldingMethodSelect) {
      weldingMethodSelect.addEventListener("change", (event) => {
        this._updateDiameterOptions(event.target.value);
      });
    }

    // Кнопки поиска и сброса
    if (searchBtn) {
      searchBtn.addEventListener("click", () => this.performSearch());
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetFilters());
    }

    // Кнопка "Назад к выбору"
    if (backToSearchBtn) {
      backToSearchBtn.addEventListener("click", () => {
        window.registryCommon?.showSection("select");
      });
    }

    // Кнопка "Назад к поиску"
    if (backToSearchBtn2) {
      backToSearchBtn2.addEventListener("click", () => {
        window.registryCommon?.showSection("select");
      });
    }

    // Кнопка генерации PDF
    if (generatePdfBtn) {
      generatePdfBtn.addEventListener("click", () => this.generatePDF());
    }
  },

  /**
   * Обновление опций диаметра в зависимости от способа сварки
   * @param {string} method - Способ сварки
   */
  _updateDiameterOptions(method) {
    const { wireDiameterSelect } = this._elements;
    
    wireDiameterSelect.innerHTML = '<option value="">-- Выберите диаметр --</option>';

    if (method && this._diameterOptions[method]) {
      this._diameterOptions[method].forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.text;
        wireDiameterSelect.appendChild(opt);
      });
    }
  },

  /**
   * Выполнение поиска
   */
  performSearch() {
    const { wireCategorySelect, weldingMethodSelect, wireDiameterSelect } = this._elements;
    
    const filters = {
      category: wireCategorySelect.value,
      method: weldingMethodSelect.value,
      diameter: wireDiameterSelect.value
    };

    console.log('Поиск с фильтрами:', filters);
    CommonUtils.showNotification('Выполняется поиск...', 'info');

    // Здесь должна быть логика фильтрации данных
    // Пока используем заглушку
    this._currentFilteredData = [];
    this._displayResults();
  },

  /**
   * Сброс фильтров
   */
  resetFilters() {
    const { wireCategorySelect, weldingMethodSelect, wireDiameterSelect } = this._elements;
    
    wireCategorySelect.value = "";
    weldingMethodSelect.value = "";
    wireDiameterSelect.innerHTML = '<option value="">-- Сначала выберите способ сварки --</option>';
    this._currentFilteredData = [];

    CommonUtils.showNotification("Фильтры сброшены", "info");
  },

  /**
   * Отображение результатов
   */
  _displayResults() {
    const { resultsBody, noResults, resultsCount } = this._elements;
    
    resultsBody.innerHTML = '';
    
    if (this._currentFilteredData.length === 0) {
      noResults.style.display = 'block';
      resultsCount.textContent = '0';
    } else {
      noResults.style.display = 'none';
      resultsCount.textContent = this._currentFilteredData.length.toString();
      
      // Здесь должна быть логика отрисовки таблицы
      console.log('Отображение результатов поиска');
    }
  },

  /**
   * Загрузка данных проволоки
   */
  async loadWireData() {
    try {
      CommonUtils.showNotification('Загрузка данных проволоки...', 'info');
      console.log('WireManager: Загрузка данных проволоки');
      
      // Здесь должна быть логика загрузки с сервера
      // Пока используем заглушку
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      CommonUtils.showNotification('Данные проволоки загружены', 'success');
    } catch (error) {
      console.error('Ошибка загрузки данных проволоки:', error);
      CommonUtils.showNotification('Ошибка загрузки данных', 'error');
    }
  },

  /**
   * Генерация PDF отчета
   */
  generatePDF() {
    console.log('WireManager: Генерация PDF отчета');
    CommonUtils.showNotification('Генерация PDF отчета...', 'info');
    
    // Здесь должна быть логика генерации PDF
    // Можно использовать библиотеки типа jsPDF
  },

  /**
   * Получение отфильтрованных данных
   */
  getFilteredData() {
    return this._currentFilteredData;
  },

  /**
   * Получение текущих фильтров
   */
  getCurrentFilters() {
    const { wireCategorySelect, weldingMethodSelect, wireDiameterSelect } = this._elements;
    
    return {
      category: wireCategorySelect.value,
      method: weldingMethodSelect.value,
      diameter: wireDiameterSelect.value
    };
  }
};

// Делаем модуль доступным глобально для совместимости
window.WireManager = WireManager;