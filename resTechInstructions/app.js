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
    window.registryCommon.showNotification("Нет данных для PDF", "warning");
    return;
  }
  if (typeof html2pdf === "undefined") {
    window.registryCommon.showNotification(
      "Ошибка: библиотека PDF не загружена",
      "error",
    );
    return;
  }
  const originalText = generatePdfBtn.innerHTML;
  generatePdfBtn.innerHTML = '<div class="loading-spinner"></div> Генерация...';
  generatePdfBtn.disabled = true;

  const element = document.createElement("div");
  element.style.padding = "20px";
  element.style.fontFamily = "Arial, sans-serif";

  let html = `
    <h2 style="text-align:center;">Реестр технологических инструкций</h2>
    <p>Дата: ${new Date().toLocaleDateString("ru-RU")}</p>
    <p>Всего записей: ${currentFilteredData.length}</p>
    <table border="1" cellpadding="5" style="border-collapse: collapse; width:100%;">
      <thead style="background:#27ae60; color:white;">
        <tr>
          <th>№ ТИ</th><th>Год</th><th>Наименование</th><th>Статус</th><th>Место</th><th>Комментарии</th>
        </tr>
      </thead>
      <tbody>
  `;
  currentFilteredData.forEach((item) => {
    html += `<tr>
      <td>${item.number}</td>
      <td>${item.year}</td>
      <td>${item.name}</td>
      <td>${item.status}</td>
      <td>${item.location}</td>
      <td>${item.comments}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  element.innerHTML = html;

  const opt = {
    margin: 0.5,
    filename: `tech_instructions_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
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
