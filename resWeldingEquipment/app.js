let equipmentData = [];
let currentFilteredData = [];

function getViewLink(downloadLink) {
  if (!downloadLink) return "";
  const match = downloadLink.match(/[-\w]{25,}/);
  if (match) {
    return `https://drive.google.com/file/d/${match[0]}/preview`;
  }
  return downloadLink.replace("export=download", "export=media");
}

function getExpiryStatus(dateStr) {
  if (!dateStr) return "";
  try {
    let parts;
    if (dateStr.includes("-")) {
      parts = dateStr.split(" ")[0].split("-");
      const expiryDate = new Date(parts[0], parts[1] - 1, parts[2]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const oneMonthLater = new Date(today);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      if (expiryDate < today) return "expired";
      if (expiryDate <= oneMonthLater) return "expiring-soon";
      return "";
    } else if (dateStr.includes(".")) {
      parts = dateStr.split(".");
      if (parts.length === 3) {
        const expiryDate = new Date(parts[2], parts[1] - 1, parts[0]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const oneMonthLater = new Date(today);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        if (expiryDate < today) return "expired";
        if (expiryDate <= oneMonthLater) return "expiring-soon";
        return "";
      }
    }
    return "";
  } catch (e) {
    return "";
  }
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
    const url = window.spreadsheetConfig.SPREADSHEET_URLS.weldingEquipment;
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);

    equipmentData = rows.map((row, index) => ({
      id: index + 1,
      method: row["method"] || row["Способ сварки"] || "",
      name: row["name"] || row["Наименование"] || "",
      equipmentSN:
        row["certNumber"] || row["Зав. номер"] || row["J22073365001"] || "",
      certNumber: row["cert"] || row["Сертификат НАКС"] || "",
      expiryDate:
        row["expiryDate"] || row["Срок действия"] || row["cert"] || "",
      passport: row["passport"] || row["Паспорт"] || "",
      manufactureDate: row["manufactureDate"] || row["Дата изготовления"] || "",
      codeCO: row["codeCO"] || row["Шифр СО"] || "",
      certificateLink: row["CertificateLink"] || row["Ссылка на PDF"] || "",
    }));

    currentFilteredData = [...equipmentData];
    displayResults(currentFilteredData);
    window.registryCommon.showNotification(
      `Загружено ${equipmentData.length} записей`,
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
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Нет данных</td></tr>`;
    resultsCount.textContent = "Записей: 0";
    return;
  }
  resultsCount.textContent = `Записей: ${data.length}`;

  data.forEach((item) => {
    const mainRow = document.createElement("tr");
    mainRow.className = "clickable-row";
    const statusClass = getExpiryStatus(item.expiryDate);
    if (statusClass) mainRow.classList.add(statusClass);
    mainRow.setAttribute("data-id", item.id);
    mainRow.innerHTML = `
      <td>${item.method}</td>
      <td>${item.name}</td>
      <td>${item.equipmentSN}</td>
      <td>${item.certNumber || ""}</td>
      <td>${item.expiryDate ? window.registryCommon.formatDate(item.expiryDate) : ""}</td>
    `;
    tableBody.appendChild(mainRow);

    const detailRow = document.createElement("tr");
    detailRow.className = "image-row hidden";
    detailRow.setAttribute("data-id", item.id);

    let detailsHTML = `<td colspan="5"><div style="padding:15px; background:#f8fafc; border-radius:8px;">`;
    detailsHTML += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">`;

    if (item.codeCO) {
      detailsHTML += `<div><strong>Шифр СО:</strong> ${item.codeCO}</div>`;
    }

    if (item.manufactureDate) {
      detailsHTML += `<div><strong>Дата изготовления:</strong> ${window.registryCommon.formatDate(item.manufactureDate)}</div>`;
    }

    if (item.passport) {
      const viewPassport = getViewLink(item.passport);
      detailsHTML += `
        <div>
          <strong>Паспорт:</strong><br>
          <a href="${viewPassport}" target="_blank" class="btn-view" style="display:inline-block; margin-right:5px; padding:5px 10px; text-decoration:none;"><i class="fas fa-eye"></i> Просмотреть</a>
          <a href="${item.passport}" download class="btn-secondary" style="display:inline-block; padding:5px 10px; text-decoration:none;"><i class="fas fa-download"></i> Скачать</a>
        </div>
      `;
    }

    if (item.certificateLink) {
      const viewCert = getViewLink(item.certificateLink);
      detailsHTML += `
        <div>
          <strong>Сертификат НАКС (PDF):</strong><br>
          <a href="${viewCert}" target="_blank" class="btn-view" style="display:inline-block; margin-right:5px; padding:5px 10px; text-decoration:none;"><i class="fas fa-eye"></i> Просмотреть</a>
          <a href="${item.certificateLink}" download class="btn-secondary" style="display:inline-block; padding:5px 10px; text-decoration:none;"><i class="fas fa-download"></i> Скачать</a>
        </div>
      `;
    }

    detailsHTML += `</div></div></td>`;
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
    currentFilteredData = [...equipmentData];
  } else {
    currentFilteredData = equipmentData.filter((item) =>
      item.name.toLowerCase().includes(searchTerm),
    );
  }
  displayResults(currentFilteredData);
}

function normalizeMethodInput(input) {
  const lower = input.toLowerCase().trim();
  const map = {
    af: "AF",
    mp: "MP",
    rad: "RAD",
    rd: "RD",
    аф: "AF",
    мп: "MP",
    рад: "RAD",
    рд: "RD",
  };
  return map[lower] || null;
}

function filterData() {
  const searchTerm = searchInput.value.trim();
  if (!searchTerm) {
    currentFilteredData = [...equipmentData];
  } else {
    const terms = searchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t);
    currentFilteredData = equipmentData.filter((item) => {
      const methodMatch = terms.some((term) => {
        const norm = normalizeMethodInput(term);
        return norm && item.method === norm;
      });
      const nameMatch = terms.some((term) =>
        item.name.toLowerCase().includes(term),
      );
      return methodMatch || nameMatch;
    });
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
    <h2 style="text-align:center;">Реестр сварочного оборудования</h2>
    <p>Дата: ${new Date().toLocaleDateString("ru-RU")}</p>
    <p>Всего записей: ${currentFilteredData.length}</p>
    <table border="1" cellpadding="5" style="border-collapse: collapse; width:100%;">
      <thead style="background:#27ae60; color:white;">
        <tr>
          <th>Способ сварки</th><th>Наименование</th><th>Зав. номер</th><th>Срок действия</th>
        </tr>
      </thead>
      <tbody>
  `;
  currentFilteredData.forEach((item) => {
    html += `<tr>
      <td>${item.method}</td>
      <td>${item.name}</td>
      <td>${item.equipmentSN}</td>
      <td>${item.expiryDate ? window.registryCommon.formatDate(item.expiryDate) : ""}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  element.innerHTML = html;

  const opt = {
    margin: 0.5,
    filename: `equipment_${new Date().toISOString().slice(0, 10)}.pdf`,
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
