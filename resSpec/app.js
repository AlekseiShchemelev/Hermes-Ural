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
  window.backToSearchBtn2 = document.getElementById("backToSearchBtn2");
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

  const originalText = generatePdfBtn.innerHTML;
  generatePdfBtn.innerHTML = '<div class="loading-spinner"></div> Генерация...';
  generatePdfBtn.disabled = true;

  setTimeout(() => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.text("РЕЕСТР СПЕЦИАЛИСТОВ", 105, 15, null, null, "center");

      doc.setFontSize(11);
      const selectedSpecialist =
        specialistSelect.options[specialistSelect.selectedIndex].text;
      doc.text(`Специалист: ${selectedSpecialist}`, 20, 25);
      doc.text(
        `Дата генерации: ${new Date().toLocaleDateString("ru-RU")}`,
        20,
        32,
      );
      doc.text(`Всего записей: ${currentFilteredData.length}`, 150, 32);

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

      const fileName = `специалисты_${selectedSpecialist.replace(/[^а-яА-Я0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
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

window.specialistsRegistry = {
  performSearch,
  generatePDF,
  loadSpecialistsData,
};
