// Загрузка данных из JSON файла
let specialistsData = {};
let currentFilteredData = [];

// Инициализация
document.addEventListener("DOMContentLoaded", async function () {
  initElements();
  await loadSpecialistsData();
  initEventListeners();
  initNavigation();
});

// Инициализация элементов
function initElements() {
  window.screenSelect = document.getElementById("select-section");
  window.screenResults = document.getElementById("results-section");
  window.specialistSelect = document.getElementById("specialistSelect");
  window.confirmBtn = document.getElementById("confirmBtn");
  window.backToSelectBtn = document.getElementById("backToSelectBtn");
  window.backToSearchBtn2 = document.getElementById("backToSearchBtn2");
  window.noResults = document.getElementById("noResults");
  window.tableBody = document.getElementById("tableBody");
  window.generatePdfBtn = document.getElementById("generatePdfBtn");
  window.resultsCount = document.getElementById("resultsCount");
}

// Загрузка данных
async function loadSpecialistsData() {
  try {
    console.log("Загрузка данных специалистов...");

    const response = await fetch(`../data_json/data-specialists.json`);
    if (response.ok) {
      specialistsData = await response.json();
      console.log("Данные специалистов загружены");

      // Обновляем список специалистов в select
      const select = document.getElementById("specialistSelect");
      select.innerHTML = '<option value="">-- Выберите фамилию --</option>';

      Object.keys(specialistsData).forEach((fio) => {
        const option = document.createElement("option");
        option.value = fio;
        option.textContent = fio;
        select.appendChild(option);
      });
    }

    window.registryCommon.showNotification(
      "Данные специалистов загружены",
      "success"
    );
  } catch (error) {
    console.error("Ошибка при загрузке данных специалистов:", error);
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
  const selected = specialistSelect.value;

  if (!selected) {
    window.registryCommon.showNotification(
      "Пожалуйста, выберите специалиста",
      "warning"
    );
    return;
  }

  if (!specialistsData[selected]) {
    window.registryCommon.showNotification(
      "Данные не загружены для выбранного специалиста",
      "error"
    );
    return;
  }

  // Фильтруем данные по выбранному специалисту
  currentFilteredData = specialistsData[selected] || [];

  // Отображаем результаты
  displayResults(currentFilteredData, selected);

  window.registryCommon.showNotification(
    `Загружено ${currentFilteredData.length} записей для ${selected}`,
    "success"
  );
}

// Функция отображения результатов
function displayResults(data, specialistName) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 40px; color: #95a5a6;">
          <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
          Нет аттестационных данных
        </td>
      </tr>
    `;
  } else {
    data.forEach((item) => {
      const isValid = !window.registryCommon.isExpired(item.validUntil);
      const levelClass = item.group.includes("III")
        ? "level-high"
        : item.group.includes("II")
        ? "level-medium"
        : "level-low";

      // Основная строка
      const row = document.createElement("tr");
      row.className = "clickable-row";
      row.innerHTML = `
        <td><strong>${item.cert || "-"}</strong></td>
        <td><span class="badge">${item.groupAbr || "-"}</span></td>
        <td>
          <span class="${levelClass}">
            <i class="fas fa-star"></i>
            ${item.group || "-"}
          </span>
        </td>
        <td>
          <span class="${isValid ? "status-valid" : "status-expired"}">
            <i class="fas fa-${
              isValid ? "check-circle" : "exclamation-circle"
            }"></i>
            ${window.registryCommon.formatDate(item.validUntil)}
          </span>
        </td>
        <td>
          ${
            item.certificateLink
              ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">
                <i class="fas fa-file-pdf"></i>
                PDF
              </span>`
              : "—"
          }
        </td>
      `;
      tbody.appendChild(row);

      // Строка с PDF
      const pdfRow = document.createElement("tr");
      pdfRow.className = "image-row hidden";
      pdfRow.innerHTML = `
        <td colspan="5">
          <div style="padding: 25px; background: #f8fafc; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h4 style="margin: 0; color: #4a5568; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-file-certificate"></i>
                Свидетельство специалиста: ${item.cert || ""}
              </h4>
              ${
                item.certificateLink
                  ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">
                    <i class="fas fa-file-pdf"></i>
                    PDF документ
                  </span>`
                  : ""
              }
            </div>
            
            ${
              item.certificateLink
                ? `<div style="text-align: center; margin-bottom: 20px;">
                  <a href="${item.certificateLink}" 
                     target="_blank" 
                     class="btn-primary"
                     style="text-decoration: none; display: inline-flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                    <i class="fas fa-file-pdf"></i>
                    Открыть свидетельство (PDF)
                  </a>
                  <p style="color: #718096; font-size: 0.9rem;">
                    <i class="fas fa-external-link-alt"></i>
                    Файл откроется в новой вкладке
                  </p>
                </div>`
                : `<div style="text-align: center; padding: 20px; color: #95a5a6; margin-bottom: 20px;">
                  <i class="fas fa-file-pdf" style="font-size: 48px; margin-bottom: 10px;"></i>
                  <p>Свидетельство недоступно в электронном виде</p>
                </div>`
            }
            
            <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #3498db;">
                <strong><i class="fas fa-certificate"></i> Сертификат:</strong>
                <p style="margin: 5px 0 0;">${item.cert || "-"}</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #27ae60;">
                <strong><i class="fas fa-layer-group"></i> Группа:</strong>
                <p style="margin: 5px 0 0;">${item.group || "-"}</p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #f39c12;">
                <strong><i class="fas fa-calendar-check"></i> Действует до:</strong>
                <p style="margin: 5px 0 0;">${
                  window.registryCommon.formatDate(item.validUntil) || "-"
                }</p>
              </div>
            </div>
            
            ${
              item.comment
                ? `<div style="margin-top: 20px; padding: 15px; 
                        background: white; border-radius: 6px;
                        border-left: 3px solid #9b59b6; text-align: left;">
                  <strong><i class="fas fa-comment-dots"></i> Дополнительная информация:</strong>
                  <p style="margin-top: 5px; margin-bottom: 0;">${item.comment}</p>
                </div>`
                : ""
            }
          </div>
        </td>
      `;
      tbody.appendChild(pdfRow);
    });
  }

  // Обновляем счетчик
  if (resultsCount) {
    resultsCount.textContent = `Найдено: ${data.length} записей`;
  }

  window.registryCommon.showSection("results");
  window.registryCommon.initClickableRows();
}

// Функция генерации PDF для специалистов
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
      doc.text("РЕЕСТР СПЕЦИАЛИСТОВ", 105, 15, null, null, "center");

      // Подзаголовок
      doc.setFontSize(11);
      const selectedSpecialist =
        specialistSelect.options[specialistSelect.selectedIndex].text;
      doc.text(`Специалист: ${selectedSpecialist}`, 20, 25);
      doc.text(
        `Дата генерации: ${new Date().toLocaleDateString("ru-RU")}`,
        20,
        32
      );
      doc.text(`Всего записей: ${currentFilteredData.length}`, 150, 32);

      // Таблица
      doc.autoTable({
        head: [
          ["Сертификат", "Аббревиатура", "Группа", "Действует до", "Статус"],
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
          fillColor: [230, 126, 34],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 30 },
          2: { cellWidth: 40 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
        },
        margin: { left: 15, right: 15 },
      });

      // Сохраняем
      const fileName = `специалисты_${selectedSpecialist.replace(
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
window.specialistsRegistry = {
  performSearch,
  generatePDF,
  loadSpecialistsData,
};
