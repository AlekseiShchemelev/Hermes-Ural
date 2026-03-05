let weldingData = {};
let currentFilteredData = [];

const METHOD_MAPPING = {
  "Автоматическая сварка": "af",
  "Ручная дуговая": "rd",
  "Полуавтоматическая сварка": "mp",
  "Аргонодуговая сварка": "rad",
};

const methodDisplay = {
  "Автоматическая сварка": "АФ (Автоматическая сварка)",
  "Ручная дуговая": "РД (Ручная дуговая)",
  "Полуавтоматическая сварка": "МП (Полуавтоматическая сварка)",
  "Аргонодуговая сварка": "РАД (Аргонодуговая сварка)",
};

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
  await loadWeldingData();
  initEventListeners();
  initNavigation();
});

function initElements() {
  window.screenSelect = document.getElementById("select-section");
  window.screenResults = document.getElementById("results-section");
  window.weldingTypeSelect = document.getElementById("weldingType");
  window.confirmBtn = document.getElementById("confirmBtn");
  window.backToSearchBtn2 = document.getElementById("backToSearchBtn2");
  window.noResults = document.getElementById("noResults");
  window.tableBody = document.getElementById("tableBody");
  window.generatePdfBtn = document.getElementById("generatePdfBtn");
  window.resultsCount = document.getElementById("resultsCount");
  window.resetBtn = document.getElementById("resetBtn");
  window.backToSearchBtn = document.getElementById("backToSearchBtn");
}

async function loadWeldingData() {
  try {
    console.log("Загрузка данных сварщиков из Google Sheets...");
    window.registryCommon.showNotification(
      "Загрузка данных сварщиков...",
      "info",
    );

    if (!window.spreadsheetConfig)
      throw new Error("spreadsheetConfig не загружен");

    const url = window.spreadsheetConfig.SPREADSHEET_URLS.welders;
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);

    weldingData = {};
    rows.forEach((row) => {
      const methodName = row["Method"] || "";
      let category = mapMethodToCategory(methodName);
      if (!category) category = "Другие";

      if (!weldingData[category]) weldingData[category] = [];

      weldingData[category].push({
        fio: row["FIO"] || "",
        stamp: row["Stamp"] || "",
        thickness: row["Thickness"] || "",
        validUntil: row["ValidUntil"] ? row["ValidUntil"].split(" ")[0] : "",
        material: row["Material"] || "",
        certificateImage: row["CertificateImage"] || "",
        comment: row["Comment"] || "",
      });
    });

    console.log("Данные сварщиков загружены", Object.keys(weldingData));
    const total = Object.values(weldingData).reduce((s, a) => s + a.length, 0);
    window.registryCommon.showNotification(
      `Загружено ${total} сварщиков`,
      "success",
    );
  } catch (error) {
    console.error("Ошибка загрузки сварщиков:", error);
    weldingData = {};
    window.registryCommon.showNotification("Ошибка загрузки данных", "error");
  }
}

function mapMethodToCategory(method) {
  if (!method) return null;
  const m = method.trim().toUpperCase();
  if (m === "AF" || m.includes("AUTOMATIC")) return "Автоматическая сварка";
  if (m === "MP" || m.includes("MIG")) return "Полуавтоматическая сварка";
  if (m === "RD" || m.includes("MMA")) return "Ручная дуговая";
  if (m === "RAD" || m.includes("TIG")) return "Аргонодуговая сварка";
  return null;
}

function initEventListeners() {
  confirmBtn.addEventListener("click", performSearch);

  if (backToSearchBtn) {
    backToSearchBtn.addEventListener("click", () => {
      window.registryCommon.showSection("select");
    });
  }

  if (backToSearchBtn2) {
    backToSearchBtn2.addEventListener("click", () => {
      window.registryCommon.showSection("select");
    });
  }

  if (generatePdfBtn) {
    generatePdfBtn.addEventListener("click", generatePDF);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetFilters);
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
  const selected = weldingTypeSelect.value.trim();

  if (!selected) {
    window.registryCommon.showNotification(
      "Пожалуйста, выберите тип сварки",
      "warning",
    );
    return;
  }

  const matchedKey = Object.keys(weldingData).find(
    (key) => key.trim() === selected,
  );

  if (!matchedKey) {
    console.log("Доступные ключи:", Object.keys(weldingData));
    console.log("Выбрано:", selected);
    window.registryCommon.showNotification(
      "Данные не загружены для выбранного типа",
      "error",
    );
    return;
  }

  currentFilteredData = weldingData[matchedKey] || [];
  displayResults(currentFilteredData);

  window.registryCommon.showNotification(
    `Найдено ${currentFilteredData.length} сварщиков`,
    "success",
  );
}

function displayResults(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 40px; color: #95a5a6;">
          <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
          Нет данных для отображения
        </td>
      </tr>
    `;
  } else {
    data.forEach((item) => {
      const isValid = !window.registryCommon.isExpired(item.validUntil);
      const certificateUrl = item.certificateImage;
      const fileType = certificateUrl
        ? certificateUrl.toLowerCase().endsWith(".pdf")
          ? "PDF"
          : certificateUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)
            ? "Изображение"
            : "Файл"
        : null;

      const row = document.createElement("tr");
      row.className = "clickable-row";
      row.innerHTML = `
        <td><strong>${item.fio}</strong></td>
        <td><span class="badge">${item.stamp}</span></td>
        <td>${item.thickness} мм</td>
        <td>
          <span class="${isValid ? "status-valid" : "status-expired"}">
            <i class="fas fa-${isValid ? "check-circle" : "exclamation-circle"}"></i>
            ${window.registryCommon.formatDate(item.validUntil)}
          </span>
        </td>
        <td>${item.material}</td>
        <td>
          ${
            certificateUrl
              ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">
                  <i class="fas fa-${fileType === "PDF" ? "file-pdf" : "file-alt"}"></i>
                  ${fileType}
                </span>`
              : "—"
          }
        </td>
      `;
      tbody.appendChild(row);

      // Детальная строка
      const detailRow = document.createElement("tr");
      detailRow.className = "image-row hidden";

      let detailsHTML = `
        <td colspan="6">
          <div style="padding: 25px; background: #f8fafc; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h4 style="margin: 0; color: #4a5568; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-user-hard-hat"></i>
                Удостоверение сварщика: ${item.fio}
              </h4>
              ${certificateUrl ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">${fileType}</span>` : ""}
            </div>
      `;

      if (certificateUrl) {
        const viewLink = getViewLink(certificateUrl);
        detailsHTML += `
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${viewLink}" target="_blank" class="btn-view" style="margin-right:10px; padding:5px 10px;">
              <i class="fas fa-eye"></i> Просмотреть
            </a>
            <a href="${certificateUrl}" download class="btn-secondary" style="padding:5px 10px;">
              <i class="fas fa-download"></i> Скачать
            </a>
          </div>
        `;
      } else {
        detailsHTML += `
          <div style="text-align: center; padding: 20px; color: #95a5a6;">
            <i class="fas fa-file-alt" style="font-size: 48px; margin-bottom: 10px;"></i>
            <p>Документ удостоверения недоступен в электронном виде</p>
          </div>
        `;
      }

      detailsHTML += `
        <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #3498db;">
            <strong><i class="fas fa-hashtag"></i> Клеймо:</strong>
            <p style="margin: 5px 0 0;">${item.stamp || "-"}</p>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #27ae60;">
            <strong><i class="fas fa-ruler-vertical"></i> Толщина:</strong>
            <p style="margin: 5px 0 0;">${item.thickness || "-"} мм</p>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #f39c12;">
            <strong><i class="fas fa-calendar-check"></i> Действует до:</strong>
            <p style="margin: 5px 0 0;" class="${isValid ? "status-valid" : "status-expired"}">
              ${window.registryCommon.formatDate(item.validUntil) || "-"}
            </p>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #9b59b6;">
            <strong><i class="fas fa-layer-group"></i> Материал:</strong>
            <p style="margin: 5px 0 0;">${item.material || "-"}</p>
          </div>
        </div>
      `;

      if (item.comment) {
        detailsHTML += `
          <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 3px solid #e74c3c; text-align: left;">
            <strong><i class="fas fa-comment"></i> Примечание:</strong>
            <p style="margin-top: 5px; margin-bottom: 0;">${item.comment}</p>
          </div>
        `;
      }

      detailsHTML += `</div></td>`;
      detailRow.innerHTML = detailsHTML;
      tbody.appendChild(detailRow);
    });
  }

  if (resultsCount) {
    resultsCount.textContent = `Найдено: ${data.length} записей`;
  }

  window.registryCommon.showSection("results");
  window.registryCommon.initClickableRows();
}

function resetFilters() {
  weldingTypeSelect.value = "";
  currentFilteredData = [];
  displayResults([]);
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

  const originalText = generatePdfBtn.innerHTML;
  generatePdfBtn.innerHTML = '<div class="loading-spinner"></div> Генерация...';
  generatePdfBtn.disabled = true;

  setTimeout(() => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.text("РЕЕСТР СВАРЩИКОВ", 105, 15, null, null, "center");

      doc.setFontSize(11);
      const selectedType =
        weldingTypeSelect.options[weldingTypeSelect.selectedIndex].text;
      doc.text(`Тип сварки: ${selectedType}`, 20, 25);
      doc.text(
        `Дата генерации: ${new Date().toLocaleDateString("ru-RU")}`,
        20,
        32,
      );
      doc.text(`Всего записей: ${currentFilteredData.length}`, 150, 32);

      doc.autoTable({
        head: [
          [
            "ФИО",
            "Клеймо",
            "Толщина, мм",
            "Действует до",
            "Материал",
            "Статус",
          ],
        ],
        body: currentFilteredData.map((item) => {
          const isValid = !window.registryCommon.isExpired(item.validUntil);
          return [
            item.fio || "",
            item.stamp || "",
            item.thickness || "",
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
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 40 },
          5: { cellWidth: 25 },
        },
        margin: { left: 15, right: 15 },
      });

      const fileName = `сварщики_${selectedType.replace(/[^а-яА-Я0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      generatePdfBtn.innerHTML = originalText;
      generatePdfBtn.disabled = false;
      window.registryCommon.showNotification(
        `PDF создан: ${fileName}`,
        "success",
      );
    } catch (error) {
      console.error("Ошибка генерации PDF:", error);
      generatePdfBtn.innerHTML = originalText;
      generatePdfBtn.disabled = false;
      window.registryCommon.showNotification("Ошибка создания PDF", "error");
    }
  }, 800);
}

window.weldersRegistry = {
  performSearch,
  generatePDF,
  loadWeldingData,
};
