import { CommonUtils, DATA_TYPES } from './common.js';

/**
 * Модуль для работы с данными сварщиков
 */
export const WeldersManager = {
  // Приватные свойства
  _currentFilteredData: [],
  _elements: {},

  /**
   * Инициализация модуля сварщиков
   */
  init() {
    this.initElements();
    this.loadWeldingData();
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

    // Изменение типа сварки
    if (weldingTypeSelect) {
      weldingTypeSelect.addEventListener("change", () => {
        this._onWeldingTypeChange();
      });
    }
  },

  /**
   * Обработка изменения типа сварки
   */
  _onWeldingTypeChange() {
    const { weldingTypeSelect } = this._elements;
    const selectedType = weldingTypeSelect.value;
    
    console.log(`Изменен тип сварки на: ${selectedType}`);
    CommonUtils.showNotification(`Выбран тип сварки: ${selectedType}`, 'info');
  },

  /**
   * Выполнение поиска
   */
  performSearch() {
    const { weldingTypeSelect } = this._elements;
    const selectedType = weldingTypeSelect.value;
    
    if (!selectedType) {
      CommonUtils.showNotification('Выберите тип сварки', 'warning');
      return;
    }

    console.log(`Поиск сварщиков типа: ${selectedType}`);
    CommonUtils.showNotification('Выполняется поиск сварщиков...', 'info');

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
      console.log('Отображение результатов поиска сварщиков');
    }
  },

  /**
   * Загрузка данных сварщиков
   */
  async loadWeldingData() {
    try {
      CommonUtils.showNotification('Загрузка данных сварщиков...', 'info');
      console.log('WeldersManager: Загрузка данных сварщиков');
      
      // Здесь должна быть логика загрузки с сервера
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      CommonUtils.showNotification('Данные сварщиков загружены', 'success');
    } catch (error) {
      console.error('Ошибка загрузки данных сварщиков:', error);
      CommonUtils.showNotification('Ошибка загрузки данных', 'error');
    }
  },

  /**
   * Генерация PDF отчета
   */
  generatePDF() {
    console.log('WeldersManager: Генерация PDF отчета');
    CommonUtils.showNotification('Генерация PDF отчета...', 'info');
  },

  /**
   * Редактирование сварщика
   * @param {string} fio - ФИО сварщика
   * @param {string} category - Категория
   * @param {number} index - Индекс (опционально)
   */
  editWelder(fio, category, index = null) {
    console.log(`Редактирование сварщика: ${fio}, категория: ${category}, индекс: ${index}`);
    CommonUtils.showNotification(`Редактирование сварщика ${fio}`, 'info');
  },

  /**
   * Удаление сварщика
   * @param {string} fio - ФИО сварщика
   * @param {string} category - Категория
   * @param {number} index - Индекс (опционально)
   */
  deleteWelder(fio, category, index = null) {
    console.log(`Удаление сварщика: ${fio}, категория: ${category}, индекс: ${index}`);
    CommonUtils.showNotification(`Сварщик ${fio} удален`, 'success');
  },

  /**
   * Получение отфильтрованных данных
   */
  getFilteredData() {
    return this._currentFilteredData;
  },

  /**
   * Получение текущего типа сварки
   */
  getCurrentWeldingType() {
    const { weldingTypeSelect } = this._elements;
    return weldingTypeSelect?.value || '';
  }
};

// Делаем модуль доступным глобально для совместимости
window.WeldersManager = WeldersManager;