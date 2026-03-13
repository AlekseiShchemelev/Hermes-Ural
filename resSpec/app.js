let specialistsData = {};
let currentFilteredData = [];

function getViewLink(downloadLink) {
  if (!downloadLink) return "";
  const match = downloadLink.match(/[-\w]{25,}/);
  if (match) {
    return `https://drive.google.com/file/d/${match[0]}/preview`;
  }
  return downloadLink.replace("export=download", "export=media");
}

// Инициализация
document.addEventListener("DOMContentLoaded", async function () {
  initElements();
  await loadSpecialistsData();
  initEventListeners();
  initNavigation();
});

function initElements() {
  window.screenSelect = document.getElementById("select-section");
  window.screenResults = document.getElementById("results-section");
  window.specialistSelect = document.getElementById("specialistSelect");
  window.confirmBtn = document.getElementById("confirmBtn");
  window.backToSelectBtn = document.getElementById("backToSelectBtn");
  window.noResults = document.getElementById("noResults");
  window.tableBody = document.getElementById("tableBody");
  window.generatePdfBtn = document.getElementById("generatePdfBtn");
  window.resultsCount = document.getElementById("resultsCount");
}

async function loadSpecialistsData() {
  try {
    console.log("Загрузка данных специалистов из Google Sheets...");
    window.registryCommon.showNotification(
      "Загрузка данных специалистов...",
      "info",
    );

    if (!window.spreadsheetConfig)
      throw new Error("spreadsheetConfig не загружен");

    const url = window.spreadsheetConfig.SPREADSHEET_URLS.specialists;
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);

    specialistsData = {};
    rows.forEach((row) => {
      const fio = row["SpecialistName"] || row["ФИО"] || "Не указано";
      if (!specialistsData[fio]) specialistsData[fio] = [];

      specialistsData[fio].push({
        cert: row["Cert"] || row["№ удостоверения"] || "",
        groupAbr: row["GroupAbr"] || row["Группа (аббревиатура)"] || "",
        group: row["Group"] || row["Уровень"] || "",
        validUntil: row["ValidUntil"] ? row["ValidUntil"].split(" ")[0] : "",
        certificateLink: row["CertificateLink"] || "",
        comment: row["Comment"] || "",
      });
    });

    console.log("Данные специалистов загружены");
    const select = document.getElementById("specialistSelect");
    if (select) {
      select.innerHTML = '<option value="">-- Выберите фамилию --</option>';
      Object.keys(specialistsData)
        .sort()
        .forEach((fio) => {
          const option = document.createElement("option");
          option.value = fio;
          option.textContent = fio;
          select.appendChild(option);
        });
    }

    window.registryCommon.showNotification(
      "Данные специалистов загружены",
      "success",
    );
  } catch (error) {
    console.error("Ошибка загрузки специалистов:", error);
    specialistsData = {};
    window.registryCommon.showNotification("Ошибка загрузки данных", "error");
  }
}

function initEventListeners() {
  confirmBtn.addEventListener("click", performSearch);

  if (backToSelectBtn) {
    backToSelectBtn.addEventListener("click", () => {
      window.registryCommon.showSection("select");
    });
  }

  if (generatePdfBtn) {
    generatePdfBtn.addEventListener("click", generatePDF);
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

function performSearch() {
  const selected = specialistSelect.value.trim();

  if (!selected) {
    window.registryCommon.showNotification(
      "Пожалуйста, выберите специалиста",
      "warning",
    );
    return;
  }

  const matchedKey = Object.keys(specialistsData).find(
    (key) => key.trim() === selected,
  );

  if (!matchedKey) {
    console.log("Доступные ключи:", Object.keys(specialistsData));
    console.log("Выбрано:", selected);
    window.registryCommon.showNotification(
      "Данные не загружены для выбранного специалиста",
      "error",
    );
    return;
  }

  currentFilteredData = specialistsData[matchedKey] || [];
  displayResults(currentFilteredData, matchedKey);

  window.registryCommon.showNotification(
    `Загружено ${currentFilteredData.length} записей для ${matchedKey}`,
    "success",
  );
}

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
            <i class="fas fa-${isValid ? "check-circle" : "exclamation-circle"}"></i>
            ${window.registryCommon.formatDate(item.validUntil)}
          </span>
        </td>
        <td>
          ${item.certificateLink ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">PDF</span>` : "—"}
        </td>
      `;
      tbody.appendChild(row);

      // Детальная строка с PDF
      const pdfRow = document.createElement("tr");
      pdfRow.className = "image-row hidden";

      let pdfDetails = `
        <td colspan="5">
          <div style="padding: 25px; background: #f8fafc; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h4 style="margin: 0; color: #4a5568; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-file-certificate"></i>
                Свидетельство специалиста: ${item.cert || ""}
              </h4>
              ${item.certificateLink ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">PDF документ</span>` : ""}
            </div>
      `;

      if (item.certificateLink) {
        const viewLink = getViewLink(item.certificateLink);
        pdfDetails += `
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${viewLink}" target="_blank" class="btn-view" style="margin-right:10px; padding:5px 10px;">
              <i class="fas fa-eye"></i> Просмотреть
            </a>
            <a href="${item.certificateLink}" download class="btn-secondary" style="padding:5px 10px;">
              <i class="fas fa-download"></i> Скачать
            </a>
          </div>
        `;
      } else {
        pdfDetails += `
          <div style="text-align: center; padding: 20px; color: #95a5a6; margin-bottom: 20px;">
            <i class="fas fa-file-pdf" style="font-size: 48px; margin-bottom: 10px;"></i>
            <p>Свидетельство недоступно в электронном виде</p>
          </div>
        `;
      }

      pdfDetails += `
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
            <p style="margin: 5px 0 0;">${window.registryCommon.formatDate(item.validUntil) || "-"}</p>
          </div>
        </div>
      `;

      if (item.comment) {
        pdfDetails += `
          <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 3px solid #9b59b6; text-align: left;">
            <strong><i class="fas fa-comment-dots"></i> Дополнительная информация:</strong>
            <p style="margin-top: 5px; margin-bottom: 0;">${item.comment}</p>
          </div>
        `;
      }

      pdfDetails += `</div></td>`;
      pdfRow.innerHTML = pdfDetails;
      tbody.appendChild(pdfRow);
    });
  }

  if (resultsCount) {
    resultsCount.textContent = `Найдено: ${data.length} записей`;
  }

  window.registryCommon.showSection("results");
  window.registryCommon.initClickableRows();
}

function generatePDF() {
  if (!currentFilteredData || currentFilteredData.length === 0) {
    window.registryCommon.showNotification(
      "Нет данных для генерации PDF. Сначала выполните поиск.",
      "warning",
    );
    return;
  }

  // Проверка доступности библиотеки html2pdf
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

  const selectedSpecialist = specialistSelect.options[specialistSelect.selectedIndex].text;
  
  // Создаем HTML элемент для PDF
  const element = document.createElement("div");
  element.style.padding = "20px";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.fontSize = "12px";
  element.style.lineHeight = "1.4";

  let html = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px;">РЕЕСТР СПЕЦИАЛИСТОВ</h2>
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #555;">
        <span><strong>Специалист:</strong> ${selectedSpecialist}</span>
        <span><strong>Дата:</strong> ${new Date().toLocaleDateString("ru-RU")}</span>
        <span><strong>Всего записей:</strong> ${currentFilteredData.length}</span>
      </div>
    </div>
    <table style="border-collapse: collapse; width: 100%; font-size: 10px;">
      <thead>
        <tr style="background: #e67e22; color: white;">
          <th style="border: 1px solid #d35400; padding: 8px; text-align: left; font-weight: bold;">№ удостоверения</th>
          <th style="border: 1px solid #d35400; padding: 8px; text-align: center; font-weight: bold;">Аббр.</th>
          <th style="border: 1px solid #d35400; padding: 8px; text-align: left; font-weight: bold;">Группа</th>
          <th style="border: 1px solid #d35400; padding: 8px; text-align: center; font-weight: bold;">Действует до</th>
          <th style="border: 1px solid #d35400; padding: 8px; text-align: center; font-weight: bold;">Статус</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  currentFilteredData.forEach((item, index) => {
    const isValid = !window.registryCommon.isExpired(item.validUntil);
    const bgColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa";
    html += `
      <tr style="background: ${bgColor};">
        <td style="border: 1px solid #dee2e6; padding: 6px;">${item.cert || "-"}</td>
        <td style="border: 1px solid #dee2e6; padding: 6px; text-align: center;">${item.groupAbr || "-"}</td>
        <td style="border: 1px solid #dee2e6; padding: 6px;">${item.group || "-"}</td>
        <td style="border: 1px solid #dee2e6; padding: 6px; text-align: center;">${item.validUntil ? window.registryCommon.formatDate(item.validUntil) : "-"}</td>
        <td style="border: 1px solid #dee2e6; padding: 6px; text-align: center; color: ${isValid ? "#27ae60" : "#e74c3c"}; font-weight: bold;">${isValid ? "Действует" : "Просрочен"}</td>
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
    margin: [10, 10, 10, 10],
    filename: `специалисты_${selectedSpecialist.replace(/[^а-яА-Я0-9a-zA-Z]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: { 
      unit: "mm", 
      format: "a4", 
      orientation: "portrait"
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
      console.error("Ошибка генерации PDF:", error);
      generatePdfBtn.innerHTML = originalText;
      generatePdfBtn.disabled = false;
      window.registryCommon.showNotification("Ошибка создания PDF", "error");
    });
}

window.specialistsRegistry = {
  performSearch,
  generatePDF,
  loadSpecialistsData,
};
