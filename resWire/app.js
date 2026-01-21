// Общие переменные
let wireData = [];
let currentFilteredData = [];

// Диаметры по способам сварки - только диапазоны
const diameterOptions = {
  MP: [{ value: "0.8-1.6", text: "0,8-1,6" }],
  RAD: [{ value: "2.0-3.0", text: "2,0-3,0" }],
  AF: [{ value: "3.0-4.0", text: "3,0-4,0" }],
  RD: [{ value: "2.5-5.0", text: "2,5-5,0" }],
};

// Методы сварки для отображения
const methodDisplay = {
  MP: "МП - полуавтоматическая",
  RAD: "РАД - ручная аргонодуговая",
  AF: "АФ - автоматическая под флюсом",
  RD: "РД - ручная дуговая",
};

// Маппинг категорий
const categoryMapping = {
  carbon: "Углеродистая или низколегированная",
  stainless: "Нержавеющая аустенитная",
};

// Инициализация
document.addEventListener("DOMContentLoaded", function () {
  initElements();
  loadWireData();
  initEventListeners();
  initNavigation();
});

// Инициализация элементов
function initElements() {
  window.screenSelect = document.getElementById("select-section");
  window.screenResults = document.getElementById("results-section");
  window.wireCategorySelect = document.getElementById("wireCategory");
  window.weldingMethodSelect = document.getElementById("weldingMethod");
  window.wireDiameterSelect = document.getElementById("wireDiameter");
  window.searchBtn = document.getElementById("searchBtn");
  window.resetBtn = document.getElementById("resetBtn");
  window.backToSearchBtn = document.getElementById("backToSearchBtn");
  window.generatePdfBtn = document.getElementById("generatePdfBtn");
  window.backToSearchBtn2 = document.getElementById("backToSearchBtn2");
  window.resultsBody = document.getElementById("resultsBody");
  window.noResults = document.getElementById("noResults");
  window.resultsCount = document.getElementById("resultsCount");
}

// Загрузка данных из JSON файлов
async function loadWireData() {
  try {
    console.log("Загрузка данных проволоки из JSON файлов...");

    // Показываем уведомление о начале загрузки
    window.registryCommon.showNotification(
      "Загрузка данных проволоки...",
      "info"
    );

    // Загружаем данные из всех папок
    const methods = ["MP", "AF", "RAD", "RD"];
    const folders = ["mp", "af", "rad", "rd"];
    let totalLoaded = 0;

    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];
      const folder = folders[i];

      try {
        const response = await fetch(
          `../data_json/${folder}/data-wire-${folder}.json`
        );
        if (response.ok) {
          const data = await response.json();
          const key = `wireData${method}`;
          if (data[key] && Array.isArray(data[key])) {
            // Добавляем метод к каждому элементу для фильтрации
            const dataWithMethod = data[key].map((item) => ({
              ...item,
              method: method,
            }));
            wireData.push(...dataWithMethod);
            totalLoaded += data[key].length;
            console.log(
              `Загружено ${data[key].length} записей проволоки из ${folder} (${method})`
            );
          } else {
            console.warn(`Не найден массив ${key} в файле ${folder}`);
          }
        } else {
          console.warn(
            `Файл ${folder} не найден или ошибка загрузки: ${response.status}`
          );
        }
      } catch (error) {
        console.warn(`Ошибка загрузки данных из ${folder}:`, error);
      }
    }

    console.log(`Всего загружено записей проволоки: ${wireData.length}`);

    if (totalLoaded > 0) {
      window.registryCommon.showNotification(
        `Загружено ${totalLoaded} записей проволоки`,
        "success"
      );
    } else {
      window.registryCommon.showNotification(
        "Данные проволоки не найдены. Проверьте файлы в папке data_json/",
        "warning"
      );
    }
  } catch (error) {
    console.error("Ошибка при загрузке данных проволоки:", error);
    wireData = [];
    window.registryCommon.showNotification(
      "Ошибка загрузки данных проволоки",
      "error"
    );
  }
}

// Инициализация обработчиков событий
function initEventListeners() {
  // Обновляем опции диаметра при выборе способа сварки
  weldingMethodSelect.addEventListener("change", function () {
    const method = this.value;
    wireDiameterSelect.innerHTML =
      '<option value="">-- Выберите диаметр --</option>';

    if (method && diameterOptions[method]) {
      diameterOptions[method].forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.text;
        wireDiameterSelect.appendChild(opt);
      });
    }
  });

  // Кнопки поиска и сброса
  searchBtn.addEventListener("click", performSearch);
  resetBtn.addEventListener("click", resetFilters);

  // Кнопка "Назад к выбору"
  if (backToSearchBtn) {
    backToSearchBtn.addEventListener("click", () => {
      window.registryCommon.showSection("select");
    });
  }

  // Кнопка "Назад к поиску" (исправленное имя ID)
  if (backToSelectBtn) {
    backToSelectBtn.addEventListener("click", () => {
      window.registryCommon.showSection("select");
    });
  }

  // Кнопка "Вернуться к поиску" в пустых результатах
  if (backToSearchBtn2) {
    backToSearchBtn2.addEventListener("click", () => {
      window.registryCommon.showSection("select");
    });
  }

  // Кнопка генерации PDF
  if (generatePdfBtn) {
    generatePdfBtn.addEventListener("click", generatePDF);
  }
}

// Инициализация навигации в сайдбаре
function initNavigation() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".nav-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const section = this.getAttribute("onclick").match(/'([^']+)'/)[1];
      window.registryCommon.showSection(section);
    });
  });
}

// Функция поиска
function performSearch() {
  const wireCategory = wireCategorySelect.value;
  const weldingMethod = weldingMethodSelect.value;
  const wireDiameter = wireDiameterSelect.value;

  // Проверка заполнения всех фильтров
  if (!wireCategory || !weldingMethod || !wireDiameter) {
    window.registryCommon.showNotification(
      "Пожалуйста, заполните все фильтры поиска.",
      "warning"
    );
    return;
  }

  // Показать спиннер загрузки
  const originalText = searchBtn.innerHTML;
  searchBtn.innerHTML = '<div class="loading-spinner"></div> Поиск...';
  searchBtn.disabled = true;

  // Имитация загрузки для UX
  setTimeout(() => {
    // Фильтрация данных
    currentFilteredData = wireData.filter((item) => {
      // Определяем категорию по марке проволоки
      let itemCategory = "stainless"; // По умолчанию нержавеющая
      const brand = item.brand || "";

      if (
        brand.includes("10НМА") ||
        brand.includes("08ГА") ||
        brand.includes("08Г2С") ||
        brand.includes("ПРО 51С") ||
        brand.includes("УОНИИ-13/55")
      ) {
        itemCategory = "carbon";
      }

      const categoryMatch = !wireCategory || itemCategory === wireCategory;
      const methodMatch = !weldingMethod || item.method === weldingMethod;

      // Проверка диаметра - работает только с диапазонами
      let diameterMatch = false;
      if (item.diameter && wireDiameter) {
        const itemDiameter = parseFloat(item.diameter.replace(",", "."));

        if (wireDiameter.includes("-")) {
          // Диапазон (например "0.8-1.6")
          const [min, max] = wireDiameter.split("-").map(Number);
          diameterMatch = itemDiameter >= min && itemDiameter <= max;
        }
      }

      return categoryMatch && methodMatch && diameterMatch;
    });

    // Отображение результатов
    displayResults(currentFilteredData);

    // Восстановить кнопку
    searchBtn.innerHTML = originalText;
    searchBtn.disabled = false;

    // Показать секцию результатов
    window.registryCommon.showSection("results");
  }, 500);
}

// Функция отображения результатов
function displayResults(data) {
  resultsBody.innerHTML = "";

  if (data.length === 0) {
    noResults.classList.remove("hidden");
    if (resultsCount) {
      resultsCount.textContent = "Найдено: 0 записей";
    }
  } else {
    noResults.classList.add("hidden");

    if (resultsCount) {
      resultsCount.textContent = `Найдено: ${data.length} записей`;
    }

    data.forEach((item) => {
      // Основная строка с данными
      const row = document.createElement("tr");
      row.className = "clickable-row";

      // Определение отображаемого способа сварки
      const displayMethod = methodDisplay[item.method] || item.method;

      // Проверяем срок действия сертификата
      const isExpired = item.issueDate
        ? window.registryCommon.isExpired(item.issueDate)
        : false;

      row.innerHTML = `
                <td>
                    <div>
                        <strong>${item.brand || ""}</strong>
                        ${
                          item.description
                            ? `<br><small style="color: #718096;">${item.description}</small>`
                            : ""
                        }
                    </div>
                </td>
                <td>${item.type || ""}</td>
                <td>${displayMethod}</td>
                <td>${item.diameter || ""}</td>
                <td>${item.standard || ""}</td>
                <td>${item.manufacturer || ""}</td>
                <td>
                    ${
                      item.issueDate
                        ? `<span class="${
                            isExpired ? "status-expired" : "status-valid"
                          }">
                            <i class="fas fa-${
                              isExpired ? "exclamation-circle" : "check-circle"
                            }"></i>
                            ${window.registryCommon.formatDate(item.issueDate)}
                        </span>`
                        : "<em style='color: #95a5a6;'>не указана</em>"
                    }
                </td>
            `;

      resultsBody.appendChild(row);

      // Создаём строку для сертификата (изначально скрыта)
      const certRow = document.createElement("tr");
      certRow.className = "image-row hidden";

      const fileType = item.certificate
        ? item.certificate.toLowerCase().endsWith(".pdf")
          ? "PDF"
          : item.certificate.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)
          ? "Изображение"
          : "Файл"
        : "";

      certRow.innerHTML = `
                <td colspan="7">
                    <div style="padding: 25px; background: #f8fafc; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h4 style="margin: 0; color: #4a5568; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-file-certificate"></i>
                                Сертификат на проволоку ${item.brand || ""}
                            </h4>
                            <span class="badge" style="background: #e3f2fd; color: #1976d2;">
                                ${fileType}
                            </span>
                        </div>
                        
                        ${
                          item.certificate
                            ? `<div style="text-align: center;">
                                <a href="${item.certificate}" 
                                   target="_blank" 
                                   class="btn-primary"
                                   style="text-decoration: none; display: inline-flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                                    <i class="fas fa-${
                                      fileType === "PDF" ? "file-pdf" : "image"
                                    }"></i>
                                    Открыть сертификат
                                </a>
                                <p style="color: #718096; font-size: 0.9rem;">
                                    <i class="fas fa-external-link-alt"></i>
                                    Файл откроется в новой вкладке
                                </p>
                            </div>`
                            : `<div style="text-align: center; padding: 20px; color: #95a5a6;">
                                <i class="fas fa-file-alt" style="font-size: 48px; margin-bottom: 10px;"></i>
                                <p>Сертификат недоступен в электронном виде</p>
                            </div>`
                        }
                        
                        <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #3498db;">
                                <strong><i class="fas fa-industry"></i> Производитель:</strong>
                                <p style="margin: 5px 0 0;">${
                                  item.manufacturer || "-"
                                }</p>
                            </div>
                            
                            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #27ae60;">
                                <strong><i class="fas fa-ruler"></i> Диаметр:</strong>
                                <p style="margin: 5px 0 0;">${
                                  item.diameter || "-"
                                } мм</p>
                            </div>
                            
                            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #f39c12;">
                                <strong><i class="fas fa-file-alt"></i> Стандарт:</strong>
                                <p style="margin: 5px 0 0;">${
                                  item.standard || "-"
                                }</p>
                            </div>
                        </div>
                        
                        ${
                          item.description
                            ? `<div style="margin-top: 20px; padding: 15px; 
                                      background: white; border-radius: 6px;
                                      border-left: 3px solid #9b59b6; text-align: left;">
                                <strong><i class="fas fa-info-circle"></i> Описание:</strong>
                                <p style="margin-top: 5px; margin-bottom: 0;">${item.description}</p>
                            </div>`
                            : ""
                        }
                    </div>
                </td>
            `;
      resultsBody.appendChild(certRow);
    });
  }

  // Инициализируем кликабельные строки
  window.registryCommon.initClickableRows();
}

// Функция сброса фильтров
function resetFilters() {
  wireCategorySelect.value = "";
  weldingMethodSelect.value = "";
  wireDiameterSelect.innerHTML =
    '<option value="">-- Сначала выберите способ сварки --</option>';
  currentFilteredData = [];

  window.registryCommon.showNotification("Фильтры сброшены", "info");
}

// Функция генерации PDF для проволоки
function generatePDF() {
  if (!currentFilteredData || currentFilteredData.length === 0) {
    window.registryCommon.showNotification(
      "Нет данных для генерации PDF. Сначала выполните поиск.",
      "warning"
    );
    return;
  }

  const originalText = generatePdfBtn.innerHTML;
  generatePdfBtn.innerHTML = '<div class="loading-spinner"></div> Генерация...';
  generatePdfBtn.disabled = true;

  setTimeout(() => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Используем шрифт с поддержкой кириллицы
      doc.setFont("helvetica", "normal");

      // Заголовок
      doc.setFontSize(16);
      doc.text("РЕЕСТР СВАРОЧНОЙ ПРОВОЛОКИ", 105, 15, null, null, "center");

      // Фильтры
      doc.setFontSize(10);
      const filters = getCurrentFiltersText();
      doc.text(`Параметры поиска: ${filters}`, 20, 25);
      doc.text(`Дата: ${new Date().toLocaleDateString("ru-RU")}`, 20, 32);
      doc.text(`Найдено: ${currentFilteredData.length} записей`, 150, 32);

      // Таблица
      doc.autoTable({
        head: [
          [
            "Марка",
            "Тип",
            "Способ сварки",
            "Диаметр, мм",
            "ГОСТ/ТУ",
            "Производитель",
            "Выдано",
          ],
        ],
        body: currentFilteredData.map((item) => {
          const displayMethod = methodDisplay[item.method] || item.method;
          return [
            item.brand || "",
            item.type || "",
            displayMethod,
            item.diameter || "",
            item.standard || "",
            item.manufacturer || "",
            item.issueDate
              ? window.registryCommon.formatDate(item.issueDate)
              : "",
          ];
        }),
        startY: 40,
        theme: "grid",
        styles: {
          fontSize: 8,
          font: "helvetica",
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [39, 174, 96],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 20 },
          4: { cellWidth: 30 },
          5: { cellWidth: 35 },
          6: { cellWidth: 25 },
        },
        margin: { left: 10, right: 10 },
      });

      const fileName = `проволока_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      generatePdfBtn.innerHTML = originalText;
      generatePdfBtn.disabled = false;
      window.registryCommon.showNotification(
        `PDF создан: ${fileName}`,
        "success"
      );
    } catch (error) {
      console.error("Ошибка генерации PDF:", error);
      generatePdfBtn.innerHTML = originalText;
      generatePdfBtn.disabled = false;
      window.registryCommon.showNotification("Ошибка создания PDF", "error");
    }
  }, 800);
}

// Получение текста текущих фильтров
function getCurrentFiltersText() {
  const filters = [];

  if (wireCategorySelect.value) {
    filters.push(
      `Тип: ${
        categoryMapping[wireCategorySelect.value] || wireCategorySelect.value
      }`
    );
  }

  if (weldingMethodSelect.value) {
    filters.push(
      `Способ: ${
        methodDisplay[weldingMethodSelect.value] || weldingMethodSelect.value
      }`
    );
  }

  if (wireDiameterSelect.value) {
    filters.push(`Диаметр: ${wireDiameterSelect.value} мм`);
  }

  return filters.join(", ");
}

// Экспорт функций в глобальную область видимости
window.wireRegistry = {
  performSearch,
  resetFilters,
  generatePDF,
  loadWireData,
  getCurrentFilters: getCurrentFiltersText,
};
