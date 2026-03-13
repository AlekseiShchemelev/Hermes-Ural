// Загрузка данных из Google Sheets
let wireData = [];
let currentFilteredData = [];

// Динамические опции диаметров на основе фактических данных
let diameterOptions = {};

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

// Преобразование ссылки для просмотра
function getViewLink(downloadLink) {
  if (!downloadLink) return "";
  const match = downloadLink.match(/[-\w]{25,}/);
  if (match) {
    return `https://drive.google.com/file/d/${match[0]}/preview`;
  }
  return downloadLink.replace("export=download", "export=media");
}

// Инициализация
document.addEventListener("DOMContentLoaded", function () {
  initElements();
  loadWireData();
  initEventListeners();
  initNavigation();
});

function initElements() {
  window.screenSelect = document.getElementById("select-section");
  window.screenResults = document.getElementById("results-section");
  window.wireCategorySelect = document.getElementById("wireCategory");
  window.weldingMethodSelect = document.getElementById("weldingMethod");
  window.wireDiameterSelect = document.getElementById("wireDiameter");
  window.searchBtn = document.getElementById("searchBtn");
  window.resetBtn = document.getElementById("resetBtn");
  window.generatePdfBtn = document.getElementById("generatePdfBtn");
  window.backToSearchBtn2 = document.getElementById("backToSearchBtn2");
  window.resultsBody = document.getElementById("resultsBody");
  window.noResults = document.getElementById("noResults");
  window.resultsCount = document.getElementById("resultsCount");
}

async function loadWireData() {
  try {
    console.log("Загрузка данных проволоки из Google Sheets...");
    if (!window.spreadsheetConfig) {
      console.error("spreadsheetConfig не загружен");
      window.registryCommon.showNotification("Ошибка конфигурации", "error");
      return;
    }

    const url = window.spreadsheetConfig.SPREADSHEET_URLS.wire;
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);

    if (rows.length === 0) {
      console.warn("Нет данных в CSV");
      wireData = [];
      return;
    }

    wireData = rows.map((row, index) => ({
      id: index + 1,
      brand: row["Brand"] || row["Марка"] || "",
      type: row["Type"] || row["Тип"] || "",
      method: mapMethodName(row["Method"] || row["Способ сварки"] || ""),
      diameter: row["Diameter"] || row["Диаметр"] || "",
      standard: row["Standard"] || row["ГОСТ/ТУ"] || "",
      manufacturer: row["Manufacturer"] || row["Производитель"] || "",
      issueDate: row["IssueDate"] || row["Дата выдачи"] || "",
      certificate: row["Certificate"] || row["Сертификат"] || "",
      description: row["Description"] || row["Описание"] || "",
    }));

    console.log("wireData:", wireData);
    
    // Формируем динамические опции диаметров на основе загруженных данных
    buildDiameterOptions();
    
    window.registryCommon.showNotification(
      `Загружено ${wireData.length} записей`,
      "success",
    );
  } catch (error) {
    console.error("Ошибка загрузки проволоки:", error);
    wireData = [];
    window.registryCommon.showNotification("Ошибка загрузки данных", "error");
  }
}

function mapMethodName(method) {
  if (!method) return null;
  const m = method.trim().toUpperCase();
  if (m === "AF" || m.includes("AUTOMATIC") || m.includes("АВТОМАТ"))
    return "AF";
  if (m === "MP" || m.includes("MIG") || m.includes("ПОЛУ")) return "MP";
  if (m === "RD" || m.includes("MMA") || m.includes("РУЧН")) return "RD";
  if (m === "RAD" || m.includes("TIG") || m.includes("АРГОН")) return "RAD";
  return null;
}

function initEventListeners() {
  weldingMethodSelect.addEventListener("change", function () {
    const method = this.value;
    wireDiameterSelect.innerHTML =
      '<option value="">-- Выберите диаметр --</option>';

    if (method && diameterOptions[method]) {
      // Сортируем диаметры численно
      const sortedDiameters = diameterOptions[method].sort((a, b) => {
        const numA = parseFloat(a.replace(",", "."));
        const numB = parseFloat(b.replace(",", "."));
        return numA - numB;
      });
      
      sortedDiameters.forEach((diameter) => {
        const opt = document.createElement("option");
        opt.value = diameter;
        opt.textContent = diameter;
        wireDiameterSelect.appendChild(opt);
      });
    }
  });

  searchBtn.addEventListener("click", performSearch);
  resetBtn.addEventListener("click", resetFilters);

  if (backToSearchBtn2) {
    backToSearchBtn2.addEventListener("click", () => {
      window.registryCommon.showSection("select");
    });
  }

  if (window.generatePdfBtn) {
    window.generatePdfBtn.addEventListener("click", generatePDF);
  }
}

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

function buildDiameterOptions() {
  diameterOptions = {};
  
  wireData.forEach(item => {
    if (item.method && item.diameter) {
      if (!diameterOptions[item.method]) {
        diameterOptions[item.method] = new Set();
      }
      diameterOptions[item.method].add(item.diameter.trim());
    }
  });
  
  // Преобразуем Set в Array
  Object.keys(diameterOptions).forEach(method => {
    diameterOptions[method] = Array.from(diameterOptions[method]);
  });
  
  console.log("Динамические опции диаметров:", diameterOptions);
}

function performSearch() {
  const wireCategory = wireCategorySelect.value.trim();
  const weldingMethod = weldingMethodSelect.value.trim();
  const wireDiameter = wireDiameterSelect.value.trim();

  // Если фильтры не выбраны - показываем все данные
  const hasFilters = wireCategory || weldingMethod || wireDiameter;

  const originalText = searchBtn.innerHTML;
  searchBtn.innerHTML = '<div class="loading-spinner"></div> Поиск...';
  searchBtn.disabled = true;

  setTimeout(() => {
    currentFilteredData = wireData.filter((item) => {
      let itemCategory = "stainless";
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

      let diameterMatch = true; // По умолчанию true, если диаметр не выбран
      if (item.diameter && wireDiameter) {
        const itemDiameter = parseFloat(item.diameter.replace(",", "."));
        const searchDiameter = parseFloat(wireDiameter.replace(",", "."));
        diameterMatch = Math.abs(itemDiameter - searchDiameter) < 0.001; // Точное совпадение
      }

      return categoryMatch && methodMatch && diameterMatch;
    });

    displayResults(currentFilteredData);

    searchBtn.innerHTML = originalText;
    searchBtn.disabled = false;

    window.registryCommon.showSection("results");
    
    if (!hasFilters) {
      window.registryCommon.showNotification(
        `Показаны все данные: ${currentFilteredData.length} записей`,
        "info",
      );
    }
  }, 500);
}

function displayResults(data) {
  resultsBody.innerHTML = "";

  if (data.length === 0) {
    noResults.classList.remove("hidden");
    if (resultsCount) resultsCount.textContent = "Найдено: 0 записей";
  } else {
    noResults.classList.add("hidden");
    if (resultsCount)
      resultsCount.textContent = `Найдено: ${data.length} записей`;

    data.forEach((item) => {
      const row = document.createElement("tr");
      row.className = "clickable-row";
      const displayMethod = methodDisplay[item.method] || item.method;
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
              ? `<span class="${isExpired ? "status-expired" : "status-valid"}">
                  <i class="fas fa-${isExpired ? "exclamation-circle" : "check-circle"}"></i>
                  ${window.registryCommon.formatDate(item.issueDate)}
                </span>`
              : "<em style='color: #95a5a6;'>не указана</em>"
          }
        </td>
      `;
      resultsBody.appendChild(row);

      // Строка с сертификатом (детальная)
      const certRow = document.createElement("tr");
      certRow.className = "image-row hidden";
      const fileType = item.certificate
        ? item.certificate.toLowerCase().endsWith(".pdf")
          ? "PDF"
          : item.certificate.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)
            ? "Изображение"
            : "Файл"
        : "";

      let certDetails = `
        <td colspan="7">
          <div style="padding: 25px; background: #f8fafc; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h4 style="margin: 0; color: #4a5568; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-file-certificate"></i>
                Сертификат на проволоку ${item.brand || ""}
              </h4>
              ${fileType ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">${fileType}</span>` : ""}
            </div>
      `;

      if (item.certificate) {
        const viewLink = getViewLink(item.certificate);
        certDetails += `
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${viewLink}" target="_blank" class="btn-view" style="margin-right:10px; padding:5px 10px;">
              <i class="fas fa-eye"></i> Просмотреть
            </a>
            <a href="${item.certificate}" download class="btn-secondary" style="padding:5px 10px;">
              <i class="fas fa-download"></i> Скачать
            </a>
          </div>
        `;
      } else {
        certDetails += `
          <div style="text-align: center; padding: 20px; color: #95a5a6;">
            <i class="fas fa-file-alt" style="font-size: 48px; margin-bottom: 10px;"></i>
            <p>Сертификат недоступен в электронном виде</p>
          </div>
        `;
      }

      certDetails += `
        <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #3498db;">
            <strong><i class="fas fa-industry"></i> Производитель:</strong>
            <p style="margin: 5px 0 0;">${item.manufacturer || "-"}</p>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #27ae60;">
            <strong><i class="fas fa-ruler"></i> Диаметр:</strong>
            <p style="margin: 5px 0 0;">${item.diameter || "-"} мм</p>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #f39c12;">
            <strong><i class="fas fa-file-alt"></i> Стандарт:</strong>
            <p style="margin: 5px 0 0;">${item.standard || "-"}</p>
          </div>
        </div>
      `;

      if (item.description) {
        certDetails += `
          <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 3px solid #9b59b6; text-align: left;">
            <strong><i class="fas fa-info-circle"></i> Описание:</strong>
            <p style="margin-top: 5px; margin-bottom: 0;">${item.description}</p>
          </div>
        `;
      }

      certDetails += `</div></td>`;
      certRow.innerHTML = certDetails;
      resultsBody.appendChild(certRow);
    });
  }

  window.registryCommon.initClickableRows();
}

function resetFilters() {
  wireCategorySelect.value = "";
  weldingMethodSelect.value = "";
  wireDiameterSelect.innerHTML =
    '<option value="">-- Сначала выберите способ сварки --</option>';
  currentFilteredData = [];
  window.registryCommon.showNotification("Фильтры сброшены", "info");
}

function generatePDF() {
  if (!currentFilteredData || currentFilteredData.length === 0) {
    window.registryCommon.showNotification(
      "Нет данных для генерации PDF. Сначала выполните поиск.",
      "warning",
    );
    return;
  }

  const originalText = window.generatePdfBtn.innerHTML;
  window.generatePdfBtn.innerHTML = '<div class="loading-spinner"></div> Генерация...';
  window.generatePdfBtn.disabled = true;

  const element = document.createElement("div");
  element.style.padding = "20px";
  element.style.fontFamily = "Arial, sans-serif";

  const filters = getCurrentFiltersText();
  const date = new Date().toLocaleDateString("ru-RU");
  const count = currentFilteredData.length;

  let html = `
    <h2 style="text-align:center; color:#2c3e50;">Реестр сварочной проволоки</h2>
    <p><strong>Параметры поиска:</strong> ${filters}</p>
    <p><strong>Дата:</strong> ${date}</p>
    <p><strong>Найдено записей:</strong> ${count}</p>
    <table border="1" cellpadding="5" style="border-collapse: collapse; width:100%; font-size:12px;">
      <thead style="background:#27ae60; color:white;">
        <tr>
          <th>Марка</th>
          <th>Тип</th>
          <th>Способ сварки</th>
          <th>Диаметр, мм</th>
          <th>ГОСТ/ТУ</th>
          <th>Производитель</th>
          <th>Дата выдачи</th>
        </tr>
      </thead>
      <tbody>
  `;

  currentFilteredData.forEach((item) => {
    const displayMethod = methodDisplay[item.method] || item.method;
    html += `<tr>
      <td>${item.brand || ""}</td>
      <td>${item.type || ""}</td>
      <td>${displayMethod}</td>
      <td>${item.diameter || ""}</td>
      <td>${item.standard || ""}</td>
      <td>${item.manufacturer || ""}</td>
      <td>${item.issueDate ? window.registryCommon.formatDate(item.issueDate) : ""}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  element.innerHTML = html;

  const opt = {
    margin: 0.5,
    filename: `проволока_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, letterRendering: true },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      window.generatePdfBtn.innerHTML = originalText;
      window.generatePdfBtn.disabled = false;
      window.registryCommon.showNotification("PDF успешно создан", "success");
    })
    .catch((error) => {
      console.error("Ошибка генерации PDF:", error);
      window.generatePdfBtn.innerHTML = originalText;
      window.generatePdfBtn.disabled = false;
      window.registryCommon.showNotification("Ошибка создания PDF", "error");
    });
}

function getCurrentFiltersText() {
  const filters = [];

  if (wireCategorySelect.value) {
    filters.push(
      `Тип: ${categoryMapping[wireCategorySelect.value] || wireCategorySelect.value}`,
    );
  }

  if (weldingMethodSelect.value) {
    filters.push(
      `Способ: ${methodDisplay[weldingMethodSelect.value] || weldingMethodSelect.value}`,
    );
  }

  if (wireDiameterSelect.value) {
    filters.push(`Диаметр: ${wireDiameterSelect.value} мм`);
  }

  return filters.join(", ");
}

window.wireRegistry = {
  performSearch,
  resetFilters,
  generatePDF,
  loadWireData,
  getCurrentFilters: getCurrentFiltersText,
};
