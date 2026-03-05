let techprocessData = {};
let currentFilteredData = [];

const METHOD_MAPPING = {
  "Ручная дуговая сварка": "rd",
  "Ручная аргонодуговая сварка": "rad",
  "Полуавтоматическая сварка": "mp",
  "Автоматическая сварка под слоем флюса": "af",
};

const methodDisplay = {
  "Ручная дуговая сварка": "РД (Ручная дуговая)",
  "Ручная аргонодуговая сварка": "РАД (Ручная аргонодуговая)",
  "Полуавтоматическая сварка": "МП (Полуавтоматическая)",
  "Автоматическая сварка под слоем флюса": "АФ (Автоматическая под флюсом)",
};

function getViewLink(downloadLink) {
  if (!downloadLink) return "";
  const match = downloadLink.match(/[-\w]{25,}/);
  if (match) {
    return `https://drive.google.com/file/d/${match[0]}/preview`;
  }
  return downloadLink.replace("export=download", "export=media");
}

document.addEventListener("DOMContentLoaded", async function () {
  initElements();
  await loadTechprocessData();
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
}

async function loadTechprocessData() {
  try {
    console.log("Загрузка данных техпроцессов из Google Sheets...");
    window.registryCommon.showNotification(
      "Загрузка данных техпроцессов...",
      "info",
    );

    if (!window.spreadsheetConfig)
      throw new Error("spreadsheetConfig не загружен");

    const url = window.spreadsheetConfig.SPREADSHEET_URLS.techprocess;
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);

    techprocessData = {};
    rows.forEach((row) => {
      const methodName = row["Method"] || "";
      let category = mapMethodToCategory(methodName);
      if (!category) category = "Другие";

      if (!techprocessData[category]) techprocessData[category] = [];

      techprocessData[category].push({
        cert: row["Cert"] || "",
        groupAbr: row["GroupAbr"] || "",
        group: row["Group"] || "",
        validUntil: row["ValidUntil"] ? row["ValidUntil"].split(" ")[0] : "",
        material: row["Material"] || "",
        certificateLink: row["CertificateLink"] || "",
        comment: row["Comment"] || "",
        category: category,
      });
    });

    console.log("Данные техпроцессов загружены", Object.keys(techprocessData));
    const total = Object.values(techprocessData).reduce(
      (s, a) => s + a.length,
      0,
    );
    window.registryCommon.showNotification(
      `Загружено ${total} техпроцессов`,
      "success",
    );
  } catch (error) {
    console.error("Ошибка загрузки техпроцессов:", error);
    techprocessData = {};
    window.registryCommon.showNotification("Ошибка загрузки данных", "error");
  }
}

function mapMethodToCategory(method) {
  if (!method) return null;
  const m = method.trim().toUpperCase();
  if (m === "AF") return "Автоматическая сварка под слоем флюса";
  if (m === "MP") return "Полуавтоматическая сварка";
  if (m === "RD") return "Ручная дуговая сварка";
  if (m === "RAD") return "Ручная аргонодуговая сварка";
  return null;
}

function initEventListeners() {
  confirmBtn.addEventListener("click", performSearch);

  if (backToSelectBtn) {
    backToSelectBtn.addEventListener("click", () => {
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

  const matchedKey = Object.keys(techprocessData).find(
    (key) => key.trim() === selected,
  );

  if (!matchedKey) {
    console.log("Доступные ключи:", Object.keys(techprocessData));
    console.log("Выбрано:", selected);
    window.registryCommon.showNotification(
      "Данные не загружены для выбранного типа",
      "error",
    );
    return;
  }

  currentFilteredData = techprocessData[matchedKey] || [];
  displayResults(currentFilteredData);

  window.registryCommon.showNotification(
    `Найдено ${currentFilteredData.length} техпроцессов`,
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
          Нет техпроцессов для отображения
        </td>
      </tr>
    `;
  } else {
    data.forEach((item) => {
      const isValid = !window.registryCommon.isExpired(item.validUntil);
      const docLink = item.certificateLink;

      const row = document.createElement("tr");
      row.className = "clickable-row";
      row.innerHTML = `
        <td><strong>${item.cert || "-"}</strong></td>
        <td><span class="badge">${item.groupAbr || "-"}</span></td>
        <td>${item.group || "-"}</td>
        <td>
          <span class="${isValid ? "status-valid" : "status-expired"}">
            <i class="fas fa-${isValid ? "check-circle" : "exclamation-circle"}"></i>
            ${window.registryCommon.formatDate(item.validUntil)}
          </span>
        </td>
        <td>${item.material || "-"}</td>
        <td>
          ${docLink ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">PDF</span>` : "—"}
        </td>
      `;
      tbody.appendChild(row);

      // Детальная строка
      const docRow = document.createElement("tr");
      docRow.className = "image-row hidden";

      let docDetails = `
        <td colspan="6">
          <div style="padding: 25px; background: #f8fafc; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h4 style="margin: 0; color: #4a5568; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-file-contract"></i>
                Документация техпроцесса: ${item.cert || ""}
              </h4>
              ${docLink ? `<span class="badge" style="background: #e3f2fd; color: #1976d2;">${docLink.endsWith(".pdf") ? "PDF" : "Изображение"}</span>` : ""}
            </div>
      `;

      if (docLink) {
        const viewLink = getViewLink(docLink);
        docDetails += `
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${viewLink}" target="_blank" class="btn-view" style="margin-right:10px; padding:5px 10px;">
              <i class="fas fa-eye"></i> Просмотреть
            </a>
            <a href="${docLink}" download class="btn-secondary" style="padding:5px 10px;">
              <i class="fas fa-download"></i> Скачать
            </a>
          </div>
        `;
      } else {
        docDetails += `
          <div style="text-align: center; padding: 20px; color: #95a5a6; margin-bottom: 20px;">
            <i class="fas fa-file-alt" style="font-size: 48px; margin-bottom: 10px;"></i>
            <p>Документация недоступна в электронном виде</p>
          </div>
        `;
      }

      docDetails += `
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
            <strong><i class="fas fa-industry"></i> Материал:</strong>
            <p style="margin: 5px 0 0;">${item.material || "-"}</p>
          </div>
        </div>
      `;

      if (item.comment) {
        docDetails += `
          <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 3px solid #9b59b6; text-align: left;">
            <strong><i class="fas fa-comments"></i> Особенности техпроцесса:</strong>
            <p style="margin-top: 5px; margin-bottom: 0;">${item.comment}</p>
          </div>
        `;
      }

      docDetails += `</div></td>`;
      docRow.innerHTML = docDetails;
      tbody.appendChild(docRow);
    });
  }

  if (resultsCount) {
    resultsCount.textContent = `Найдено: ${data.length} техпроцессов`;
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

  const originalText = generatePdfBtn.innerHTML;
  generatePdfBtn.innerHTML = '<div class="loading-spinner"></div> Генерация...';
  generatePdfBtn.disabled = true;

  setTimeout(() => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.text("РЕЕСТР ТЕХПРОЦЕССОВ", 105, 15, null, null, "center");

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

      const fileName = `техпроцессы_${selectedType.replace(/[^а-яА-Я0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
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

window.techprocessRegistry = {
  performSearch,
  generatePDF,
  loadTechprocessData,
};
