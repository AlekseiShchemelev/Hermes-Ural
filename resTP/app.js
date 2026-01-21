// Загрузка данных из JSON файлов
let techprocessData = {};
const METHOD_MAPPING = {
  "Ручная дуговая сварка": "rd",
  "Ручная аргонодуговая сварка": "rad",
  "Полуавтоматическая сварка": "mp",
  "Автоматическая сварка под слоем флюса": "af",
};

// Методы сварки для отображения
const methodDisplay = {
  "Ручная дуговая сварка": "РД (Ручная дуговая)",
  "Ручная аргонодуговая сварка": "РАД (Ручная аргонодуговая)",
  "Полуавтоматическая сварка": "МП (Полуавтоматическая)",
  "Автоматическая сварка под слоем флюса": "АФ (Автоматическая под флюсом)",
};

// Общие переменные
let currentFilteredData = [];

// Инициализация
document.addEventListener("DOMContentLoaded", async function () {
  initElements();
  await loadTechprocessData();
  initEventListeners();
  initNavigation();
});

// Инициализация элементов
function initElements() {
  window.screenSelect = document.getElementById("select-section");
  window.screenResults = document.getElementById("results-section");
  window.weldingTypeSelect = document.getElementById("weldingType");
  window.confirmBtn = document.getElementById("confirmBtn");
  window.backToSelectBtn = document.getElementById("backToSelectBtn");
  window.backToSearchBtn2 = document.getElementById("backToSearchBtn2");
  window.noResults = document.getElementById("noResults");
  window.tableBody = document.getElementById("tableBody");
  window.generatePdfBtn = document.getElementById("generatePdfBtn");
  window.resultsCount = document.getElementById("resultsCount");
}

// Загрузка данных
async function loadTechprocessData() {
  try {
    console.log("Загрузка данных техпроцессов...");

    for (const [category, folder] of Object.entries(METHOD_MAPPING)) {
      try {
        const response = await fetch(
          `../data_json/${folder}/data-techprocess-${folder}.json`
        );
        if (response.ok) {
          const data = await response.json();
          const key = `techprocess${folder.toUpperCase()}`;
          if (data[key]) {
            // Добавляем категорию к каждому элементу
            const dataWithCategory = data[key].map((item) => ({
              ...item,
              category: category,
            }));

            if (!techprocessData[category]) {
              techprocessData[category] = [];
            }
            techprocessData[category].push(...dataWithCategory);

            console.log(
              `Загружено ${data[key].length} техпроцессов для ${category}`
            );
          }
        }
      } catch (error) {
        console.warn(`Ошибка загрузки для ${category}:`, error);
      }
    }

    // Преобразуем объект в плоский массив
    currentFilteredData = Object.values(techprocessData).flat();

    console.log("Данные загружены:", Object.keys(techprocessData));
    console.log(`Всего загружено техпроцессов: ${currentFilteredData.length}`);

    window.registryCommon.showNotification(
      "Данные техпроцессов загружены",
      "success"
    );
  } catch (error) {
    console.error("Ошибка при загрузке:", error);
    window.registryCommon.showNotification("Ошибка загрузки данных", "error");
  }
}

// Инициализация обработчиков событий
function initEventListeners() {
  confirmBtn.addEventListener("click", performSearch);

  // Кнопка "Назад к выбору"
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
  const selected = weldingTypeSelect.value;

  if (!selected) {
    window.registryCommon.showNotification(
      "Пожалуйста, выберите тип сварки",
      "warning"
    );
    return;
  }

  if (!techprocessData[selected]) {
    window.registryCommon.showNotification(
      "Данные не загружены для выбранного типа",
      "error"
    );
    return;
  }

  // Фильтруем данные по выбранной категории
  currentFilteredData = techprocessData[selected] || [];

  // Отображаем результаты
  displayResults(currentFilteredData);

  window.registryCommon.showNotification(
    `Найдено ${currentFilteredData.length} техпроцессов`,
    "success"
  );
}

// Функция отображения результатов
function displayResults(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 40px; color: #95a5a6;">
          <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
          Нет техпроцессов для отображения
        </td>
      </tr>
    `;
  } else {
    data.forEach((item) => {
      const isValid = !window.registryCommon.isExpired(item.validUntil);
      const docLink = item.certificateLink || item.certificateImage;

      // Основная строка
      const row = document.createElement("tr");
      row.className = "clickable-row";
      row.innerHTML = `
        <td><strong>${item.cert || "-"}</strong></td>
        <td><span class="badge">${item.groupAbr || "-"}</span></td>
        <td>${item.group || "-"}</td>
        <td>
          <span class="${isValid ? "status-valid" : "status-expired"}">
            <i class="fas fa-${
              isValid ? "check-circle" : "exclamation-circle"
            }"></i>
            ${window.registryCommon.formatDate(item.validUntil)}
          </span>
        </td>
        <td>${item.material || "-"}</td>
        <td>
          ${
            docLink
              ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">
                <i class="fas fa-${
                  docLink.endsWith(".pdf") ? "file-pdf" : "file-alt"
                }"></i>
                ${docLink.endsWith(".pdf") ? "PDF" : "Документ"}
              </span>`
              : "—"
          }
        </td>
      `;
      tbody.appendChild(row);

      // Строка с документами
      const docRow = document.createElement("tr");
      docRow.className = "image-row hidden";

      docRow.innerHTML = `
        <td colspan="6">
          <div style="padding: 25px; background: #f8fafc; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h4 style="margin: 0; color: #4a5568; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-file-contract"></i>
                Документация техпроцесса: ${item.cert || ""}
              </h4>
              ${
                docLink
                  ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">
                    <i class="fas fa-${
                      docLink.endsWith(".pdf") ? "file-pdf" : "image"
                    }"></i>
                    ${docLink.endsWith(".pdf") ? "PDF" : "Изображение"}
                  </span>`
                  : ""
              }
            </div>
            
            ${
              docLink
                ? `<div style="text-align: center; margin-bottom: 20px;">
                  <a href="${docLink}" 
                     target="_blank" 
                     class="btn-primary"
                     style="text-decoration: none; display: inline-flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                    <i class="fas fa-${
                      docLink.endsWith(".pdf") ? "file-pdf" : "image"
                    }"></i>
                    ${
                      docLink.endsWith(".pdf")
                        ? "Открыть технологическую карту (PDF)"
                        : "Открыть изображение"
                    }
                  </a>
                  <p style="color: #718096; font-size: 0.9rem; margin-bottom: 20px;">
                    <i class="fas fa-external-link-alt"></i>
                    Файл откроется в новой вкладке
                  </p>
                </div>`
                : `<div style="text-align: center; padding: 20px; color: #95a5a6; margin-bottom: 20px;">
                  <i class="fas fa-file-alt" style="font-size: 48px; margin-bottom: 10px;"></i>
                  <p>Документация недоступна в электронном виде</p>
                </div>`
            }
            
            <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #3498db;">
                <strong><i class="fas fa-certificate"></i> Сертификат:</strong>
                <p style="margin: 5px 0 0; font-size: 1.1em;">${
                  item.cert || "-"
                }</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #27ae60;">
                <strong><i class="fas fa-layer-group"></i> Группа:</strong>
                <p style="margin: 5px 0 0;">${item.group || "-"}</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #f39c12;">
                <strong><i class="fas fa-industry"></i> Материал:</strong>
                <p style="margin: 5px 0 0;">${item.material || "-"}</p>
              </div>
            </div>
            
            ${
              item.comment
                ? `<div style="margin-top: 20px; padding: 15px; 
                        background: white; border-radius: 6px;
                        border-left: 3px solid #9b59b6; text-align: left;">
                  <strong><i class="fas fa-comments"></i> Особенности техпроцесса:</strong>
                  <p style="margin-top: 5px; margin-bottom: 0;">${item.comment}</p>
                </div>`
                : ""
            }
          </div>
        </td>
      `;
      tbody.appendChild(docRow);
    });
  }

  // Обновляем счетчик
  if (resultsCount) {
    resultsCount.textContent = `Найдено: ${data.length} техпроцессов`;
  }

  window.registryCommon.showSection("results");
  window.registryCommon.initClickableRows();
}

// Функция генерации PDF для техпроцессов
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
      doc.text("РЕЕСТР ТЕХПРОЦЕССОВ", 105, 15, null, null, "center");

      // Подзаголовок
      doc.setFontSize(11);
      const selectedType =
        weldingTypeSelect.options[weldingTypeSelect.selectedIndex].text;
      doc.text(`Тип сварки: ${selectedType}`, 20, 25);
      doc.text(
        `Дата генерации: ${new Date().toLocaleDateString("ru-RU")}`,
        20,
        32
      );
      doc.text(`Всего записей: ${currentFilteredData.length}`, 150, 32);

      // Таблица
      doc.autoTable({
        head: [
          [
            "Сертификат",
            "Аббревиатура",
            "Группа",
            "Действует до",
            "Материал",
            "Статус",
          ],
        ],
        body: currentFilteredData.map((item) => {
          const isValid = !window.registryCommon.isExpired(item.validUntil);
          return [
            item.cert || "",
            item.groupAbr || "",
            item.group || "",
            item.validUntil
              ? window.registryCommon.formatDate(item.validUntil)
              : "",
            item.material || "",
            isValid ? "Действует" : "Просрочен",
          ];
        }),
        startY: 40,
        theme: "grid",
        styles: {
          fontSize: 9,
          font: "helvetica",
          cellPadding: 3,
          overflow: "linebreak",
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [155, 89, 182],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
          4: { cellWidth: 40 },
          5: { cellWidth: 25 },
        },
        margin: { left: 15, right: 15 },
      });

      // Сохраняем
      const fileName = `техпроцессы_${selectedType.replace(
        /[^а-яА-Я0-9]/g,
        "_"
      )}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      // Восстанавливаем кнопку
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

// Экспорт функций в глобальную область видимости
window.techprocessRegistry = {
  performSearch,
  generatePDF,
  loadTechprocessData,
};
