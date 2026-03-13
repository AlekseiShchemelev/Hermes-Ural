let instructionsData = [];
let currentFilteredData = [];

function getViewLink(downloadLink) {
  if (!downloadLink) return "";
  const match = downloadLink.match(/[-\w]{25,}/);
  if (match) {
    return `https://drive.google.com/file/d/${match[0]}/preview`;
  }
  return downloadLink.replace("export=download", "export=media");
}

document.addEventListener("DOMContentLoaded", function () {
  initElements();
  loadData();
  initEventListeners();
});

function initElements() {
  window.tableBody = document.getElementById("tableBody");
  window.searchInput = document.getElementById("searchInput");
  window.resetSearchBtn = document.getElementById("resetSearchBtn");
  window.generatePdfBtn = document.getElementById("generatePdfBtn");
  window.resultsCount = document.getElementById("resultsCount");
}

async function loadData() {
  try {
    if (!window.spreadsheetConfig)
      throw new Error("spreadsheetConfig не загружен");
    const url = window.spreadsheetConfig.SPREADSHEET_URLS.techInstructions;
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);
    instructionsData = rows.map((row, index) => ({
      id: index + 1,
      number: row["number"] || row["№ ТИ"] || "",
      year: row["year"] || row["Год ввода"] || "",
      name: row["name"] || row["Наименование"] || "",
      status: row["status"] || row["Статус"] || "",
      location: row["location"] || row["Место хранения"] || "",
      comments: row["comments"] || row["Комментарии"] || "",
      pdfLink: row["pdfLink"] || row["Ссылка на PDF"] || "",
    }));
    currentFilteredData = [...instructionsData];
    displayResults(currentFilteredData);
    window.registryCommon.showNotification(
      `Загружено ${instructionsData.length} инструкций`,
      "success",
    );
  } catch (error) {
    console.error("Ошибка загрузки:", error);
    window.registryCommon.showNotification("Ошибка загрузки данных", "error");
  }
}

function displayResults(data) {
  tableBody.innerHTML = "";
  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Нет данных</td></tr>`;
    resultsCount.textContent = "Записей: 0";
    return;
  }
  resultsCount.textContent = `Записей: ${data.length}`;

  data.forEach((item) => {
    // Основная строка
    const mainRow = document.createElement("tr");
    mainRow.className = "clickable-row";

    if (item.status && !item.status.toLowerCase().includes("действует")) {
      mainRow.classList.add("row-inactive");
    }

    mainRow.setAttribute("data-id", item.id);
    mainRow.innerHTML = `
      <td>${item.number}</td>
      <td>${item.year}</td>
      <td>${item.name}</td>
    `;
    tableBody.appendChild(mainRow);

    // Детальная строка
    const detailRow = document.createElement("tr");
    detailRow.className = "image-row hidden";
    detailRow.setAttribute("data-id", item.id);

    const fileType = item.pdfLink
      ? item.pdfLink.toLowerCase().endsWith(".pdf")
        ? "PDF"
        : item.pdfLink.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)
          ? "Изображение"
          : "Файл"
      : "";

    let detailsHTML = `
      <td colspan="3">
        <div style="padding: 15px; background: #f8fafc; border-radius: 8px;">
          <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px;">
            <div style="flex:1; min-width:150px;">
              <strong>Статус:</strong> ${item.status || "—"}
            </div>
            <div style="flex:1; min-width:150px;">
              <strong>Место хранения:</strong> ${item.location || "—"}
            </div>
            <div style="flex:1; min-width:150px;">
              <strong>Комментарии:</strong> ${item.comments || "—"}
            </div>
          </div>
    `;

    if (item.pdfLink) {
      const viewLink = getViewLink(item.pdfLink);
      detailsHTML += `
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <a href="${viewLink}" target="_blank" class="btn-view" style="margin-right:10px; padding:8px 16px;">
            <i class="fas fa-eye"></i> Просмотреть
          </a>
          <a href="${item.pdfLink}" download class="btn-secondary" style="padding:8px 16px;">
            <i class="fas fa-download"></i> Скачать
          </a>
          <span class="badge" style="background:#e3f2fd; color:#1976d2; align-self:center;">
            ${fileType}
          </span>
        </div>
      `;
    } else {
      detailsHTML += `
        <div style="text-align:center; padding:10px; color:#95a5a6;">
          <i class="fas fa-file-alt"></i> PDF не доступен
        </div>
      `;
    }

    detailsHTML += `</div></td>`;
    detailRow.innerHTML = detailsHTML;
    tableBody.appendChild(detailRow);
  });

  document.querySelectorAll(".clickable-row").forEach((row) => {
    row.addEventListener("click", function () {
      const id = this.dataset.id;
      const detail = document.querySelector(`.image-row[data-id="${id}"]`);
      if (detail) detail.classList.toggle("hidden");
    });
  });
}

function filterData() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  if (!searchTerm) {
    currentFilteredData = [...instructionsData];
  } else {
    currentFilteredData = instructionsData.filter((item) =>
      item.name.toLowerCase().includes(searchTerm),
    );
  }
  displayResults(currentFilteredData);
}

function resetSearch() {
  searchInput.value = "";
  filterData();
}

function generatePDF() {
  if (currentFilteredData.length === 0) {
    window.registryCommon.showNotification("Нет данных для PDF.", "warning");
    return;
  }
  if (typeof html2pdf === "undefined") {
    window.registryCommon.showNotification(
      "Ошибка: библиотека PDF не загружена. Проверьте подключение к интернету.",
      "error",
    );
    console.error("html2pdf не доступен");
    return;
  }
  const originalText = generatePdfBtn.innerHTML;
  generatePdfBtn.innerHTML = '<div class="loading-spinner"></div> Генерация...';
  generatePdfBtn.disabled = true;

  // Создаем HTML элемент для PDF
  const element = document.createElement("div");
  element.style.padding = "20px";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.fontSize = "12px";
  element.style.lineHeight = "1.4";

  let html = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px;">РЕЕСТР ТЕХНОЛОГИЧЕСКИХ ИНСТРУКЦИЙ</h2>
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #555;">
        <span><strong>Дата:</strong> ${new Date().toLocaleDateString("ru-RU")}</span>
        <span><strong>Всего записей:</strong> ${currentFilteredData.length}</span>
      </div>
    </div>
    <table style="border-collapse: collapse; width: 100%; font-size: 9px;">
      <thead>
        <tr style="background: #27ae60; color: white;">
          <th style="border: 1px solid #1e8449; padding: 8px; text-align: center; font-weight: bold;">№ ТИ</th>
          <th style="border: 1px solid #1e8449; padding: 8px; text-align: center; font-weight: bold;">Год</th>
          <th style="border: 1px solid #1e8449; padding: 8px; text-align: left; font-weight: bold;">Наименование</th>
          <th style="border: 1px solid #1e8449; padding: 8px; text-align: center; font-weight: bold;">Статус</th>
          <th style="border: 1px solid #1e8449; padding: 8px; text-align: left; font-weight: bold;">Место хранения</th>
          <th style="border: 1px solid #1e8449; padding: 8px; text-align: left; font-weight: bold;">Комментарии</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  currentFilteredData.forEach((item, index) => {
    const bgColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa";
    const isActive = item.status && item.status.toLowerCase().includes("действует");
    const statusColor = isActive ? "#27ae60" : "#e74c3c";
    
    html += `
      <tr style="background: ${bgColor};">
        <td style="border: 1px solid #dee2e6; padding: 6px; text-align: center;">${item.number || "-"}</td>
        <td style="border: 1px solid #dee2e6; padding: 6px; text-align: center;">${item.year || "-"}</td>
        <td style="border: 1px solid #dee2e6; padding: 6px;">${item.name || "-"}</td>
        <td style="border: 1px solid #dee2e6; padding: 6px; text-align: center; color: ${statusColor}; font-weight: bold;">${item.status || "-"}</td>
        <td style="border: 1px solid #dee2e6; padding: 6px;">${item.location || "-"}</td>
        <td style="border: 1px solid #dee2e6; padding: 6px;">${item.comments || "-"}</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    <div style="margin-top: 15px; font-size: 9px; color: #7f8c8d; text-align: right;">
      Сформировано: ${new Date().toLocaleString("ru-RU")}
    </div>
  `;
  element.innerHTML = html;

  const opt = {
    margin: [10, 8, 10, 8],
    filename: `тех_инструкции_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: { 
      unit: "mm", 
      format: "a4", 
      orientation: "landscape" 
    },
  };
  
  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      generatePdfBtn.innerHTML = originalText;
      generatePdfBtn.disabled = false;
      window.registryCommon.showNotification("PDF успешно создан", "success");
    })
    .catch((error) => {
      console.error(error);
      generatePdfBtn.innerHTML = originalText;
      generatePdfBtn.disabled = false;
      window.registryCommon.showNotification("Ошибка создания PDF", "error");
    });
}

function initEventListeners() {
  searchInput.addEventListener("input", filterData);
  resetSearchBtn.addEventListener("click", resetSearch);
  generatePdfBtn.addEventListener("click", generatePDF);
}
