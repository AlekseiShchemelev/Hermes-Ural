import { CommonUtils, DATA_TYPES } from './common.js';

/**
 * Модуль для работы с данными специалистов
 */
export const SpecialistsManager = {
  // Приватные свойства
  _currentFilteredData: [],
  _elements: {},

  /**
   * Инициализация модуля специалистов
   */
  init() {
    this.initElements();
    this.loadSpecialistsData();
  },

  /**
   * Инициализация элементов DOM
   */
  initElements() {
    this._elements = {
      screenSelect: document.getElementById("select-section"),
      screenResults: document.getElementById("results-section"),
      specialistSelect: document.getElementById("specialistSelect"),
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
    const { confirmBtn, backToSelectBtn, backToSearchBtn2, generatePdfBtn, specialistSelect } = this._elements;

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

    // Изменение специалиста
    if (specialistSelect) {
      specialistSelect.addEventListener("change", () => {
        this._onSpecialistChange();
      });
    }
  },

  /**
   * Обработка изменения специалиста
   */
  _onSpecialistChange() {
    const { specialistSelect } = this._elements;
    const selectedSpecialist = specialistSelect.value;
    
    console.log(`Изменен специалист на: ${selectedSpecialist}`);
    CommonUtils.showNotification(`Выбран специалист: ${selectedSpecialist}`, 'info');
  },

  /**
   * Выполнение поиска
   */
  performSearch() {
    const { specialistSelect } = this._elements;
    const selectedSpecialist = specialistSelect.value;
    
    if (!selectedSpecialist) {
      CommonUtils.showNotification('Выберите специалиста', 'warning');
      return;
    }

    console.log(`Поиск специалиста: ${selectedSpecialist}`);
    CommonUtils.showNotification('Выполняется поиск специалиста...', 'info');

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
      console.log('Отображение результатов поиска специалистов');
    }
  },

  /**
   * Загрузка данных специалистов
   */
  async loadSpecialistsData() {
    try {
      CommonUtils.showNotification('Загрузка данных специалистов...', 'info');
      console.log('SpecialistsManager: Загрузка данных специалистов');
      
      // Здесь должна быть логика загрузки с сервера
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      CommonUtils.showNotification('Данные специалистов загружены', 'success');
    } catch (error) {
      console.error('Ошибка загрузки данных специалистов:', error);
      CommonUtils.showNotification('Ошибка загрузки данных', 'error');
    }
  },

  /**
   * Генерация PDF отчета
   */
  generatePDF() {
    console.log('SpecialistsManager: Генерация PDF отчета');
    CommonUtils.showNotification('Генерация PDF отчета...', 'info');
  },

  /**
   * Редактирование специалиста
   * @param {string} fio - ФИО специалиста
   * @param {number} index - Индекс
   */
  editSpecialist(fio, index) {
    console.log(`Редактирование специалиста: ${fio}, индекс: ${index}`);
    CommonUtils.showNotification(`Редактирование специалиста ${fio}`, 'info');
  },

  /**
   * Удаление специалиста
   * @param {string} fio - ФИО специалиста
   * @param {number} index - Индекс
   */
  deleteSpecialist(fio, index) {
    console.log(`Удаление специалиста: ${fio}, индекс: ${index}`);
    CommonUtils.showNotification(`Специалист ${fio} удален`, 'success');
  },

  /**
   * Обновление статистики специалистов
   */
  updateSpecialistsStats() {
    console.log('SpecialistsManager: Обновление статистики специалистов');
    // Логика обновления статистики
  },

  /**
   * Получение отфильтрованных данных
   */
  getFilteredData() {
    return this._currentFilteredData;
  },

  /**
   * Получение текущего специалиста
   */
  getCurrentSpecialist() {
    const { specialistSelect } = this._elements;
    return specialistSelect?.value || '';
  }
};

// Делаем модуль доступным глобально для совместимости
window.SpecialistsManager = SpecialistsManager;