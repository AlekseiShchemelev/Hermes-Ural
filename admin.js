// Глобальные переменные для данных
var wireData = [];
var weldersData = {};
var techprocessData = {};
var specialistsData = {};
var techInstructionsData = [];
var weldingEquipmentData = [];

var DATA_TYPES = {
  WIRE: "wire",
  WELDERS: "welders",
  SPECIALISTS: "specialists",
  TECHPROCESS: "techprocess",
  TECHINSTRUCTIONS: "techInstructions",
  WELDINGEQUIPMENT: "weldingEquipment",
};

var currentDataType = null;

var METHOD_MAPPING = {
  MP: "mp",
  AF: "af",
  RAD: "rad",
  RD: "rd",
};

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadData() {
  try {
    console.log("Загрузка данных из Google Sheets...");
    if (typeof window.registryCommon !== "undefined") {
      window.registryCommon.showNotification("Загрузка данных...", "info");
    }

    // Очищаем предыдущие данные
    wireData = [];
    weldersData = {};
    techprocessData = {};
    specialistsData = {};

    // Загрузка проволоки
    await loadWireData();
    // Загрузка сварщиков
    await loadWeldersData();
    // Загрузка техпроцессов
    await loadTechprocessData();
    // Загрузка специалистов
    await loadSpecialistsData();
    await loadTechInstructionsData();
    await loadWeldingEquipmentData();

    console.log("Все данные загружены");
    updateStats();

    // Уведомление с учётом кэша
    const loadInfo = window.spreadsheetConfig.getLastLoadInfo();
    if (loadInfo && loadInfo.fromCache) {
      window.registryCommon.showNotification(
        loadInfo.isExpired
          ? "Данные загружены (кэш устарел - нет интернета)"
          : "Данные загружены (из кэша)",
        loadInfo.isExpired ? "warning" : "info",
      );
    } else {
      window.registryCommon.showNotification("Данные загружены", "success");
    }
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
    if (typeof window.registryCommon !== "undefined") {
      window.registryCommon.showNotification("Ошибка загрузки данных", "error");
    }
  }
}

async function loadWireData() {
  if (!window.spreadsheetConfig) return;
  const url = window.spreadsheetConfig.SPREADSHEET_URLS.wire;
  try {
    console.log("Загрузка проволоки из:", url);
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);
    console.log("Сырые данные проволоки (первые 2):", rows.slice(0, 2));
    console.log(
      "Заголовки проволоки:",
      rows.length > 0 ? Object.keys(rows[0]) : "нет данных",
    );

    wireData = rows.map((row, index) => {
      const methodRaw = row["Method"] || row["Способ сварки"] || "";
      const methodMapped = mapMethodName(methodRaw);
      if (!methodMapped && methodRaw) {
        console.log(`⚠️ Строка ${index}: метод "${methodRaw}" не распознан`);
      }
      return {
        id: index + 1,
        brand: row["Brand"] || row["Марка"] || "",
        type: row["Type"] || row["Тип"] || "",
        method: methodMapped,
        diameter: row["Diameter"] || row["Диаметр"] || "",
        standard: row["Standard"] || row["ГОСТ/ТУ"] || "",
        manufacturer: row["Manufacturer"] || row["Производитель"] || "",
        issueDate:
          row["IssueDate"] || row["НАКС до"] || row["Дата выдачи"] || "",
        certificate: row["Certificate"] || row["Сертификат"] || "",
        description: row["Description"] || row["Описание"] || "",
      };
    });

    // Убираем фильтр, чтобы увидеть все записи
    // wireData = wireData.filter(item => item.method); // раскомментировать позже, если нужно

    console.log(`Загружено проволоки (после маппинга): ${wireData.length}`);
    if (wireData.length > 0) {
      console.log("Пример метода первого элемента:", wireData[0].method);
    }
  } catch (error) {
    console.error("Ошибка загрузки проволоки:", error);
    wireData = [];
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
  return null; // если не распознано
}

async function loadWeldersData() {
  if (!window.spreadsheetConfig) return;
  const url = window.spreadsheetConfig.SPREADSHEET_URLS.welders;
  try {
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);
    weldersData = {};
    rows.forEach((row) => {
      const methodName = row["Method"] || row["Способ сварки"] || "";
      let category = null;
      for (const key of Object.keys(METHOD_MAPPING)) {
        if (methodName.toUpperCase().includes(key)) {
          // сравнение по коду
          category = key;
          break;
        }
      }
      if (!category) category = "Другие";

      if (!weldersData[category]) weldersData[category] = [];
      weldersData[category].push({
        fio: row["FIO"] || row["ФИО"] || "",
        stamp: row["Stamp"] || row["Клеймо"] || "",
        thickness: row["Thickness"] || row["Толщина"] || "",
        validUntil: row["ValidUntil"] || row["Действует до"] || "",
        material: row["Material"] || row["Тип материала"] || "",
        certificateImage:
          row["CertificateImage"] || row["Изображение сертификата"] || "",
        comment: row["Comment"] || row["Комментарий"] || "",
      });
    });
    console.log(
      `Загружено сварщиков: ${Object.values(weldersData).reduce((s, a) => s + a.length, 0)}`,
    );
  } catch (error) {
    console.error("Ошибка загрузки сварщиков:", error);
    weldersData = {};
  }
}

async function loadTechprocessData() {
  if (!window.spreadsheetConfig) return;
  const url = window.spreadsheetConfig.SPREADSHEET_URLS.techprocess;
  try {
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);
    techprocessData = {};
    rows.forEach((row) => {
      const methodName = row["Method"] || row["Способ сварки"] || "";
      let category = null;
      for (const key of Object.keys(METHOD_MAPPING)) {
        if (methodName.toUpperCase().includes(key)) {
          category = key;
          break;
        }
      }
      if (!category) category = "Другие";

      if (!techprocessData[category]) techprocessData[category] = [];
      techprocessData[category].push({
        cert: row["Cert"] || row["Сертификат"] || "",
        groupAbr: row["GroupAbr"] || row["Группа (аббревиатура)"] || "",
        group: row["Group"] || row["Группа"] || "",
        validUntil: row["ValidUntil"] || row["Действует до"] || "",
        material: row["Material"] || row["Тип материала"] || "",
        certificateLink:
          row["CertificateLink"] || row["Ссылка на сертификат"] || "",
        comment: row["Comment"] || row["Комментарий"] || "",
      });
    });
    console.log(
      `Загружено техпроцессов: ${Object.values(techprocessData).reduce((s, a) => s + a.length, 0)}`,
    );
  } catch (error) {
    console.error("Ошибка загрузки техпроцессов:", error);
    techprocessData = {};
  }
}

async function loadSpecialistsData() {
  if (!window.spreadsheetConfig) return;
  const url = window.spreadsheetConfig.SPREADSHEET_URLS.specialists;
  try {
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);
    specialistsData = {};
    rows.forEach((row) => {
      const fio = row["SpecialistName"] || row["ФИО"] || "Не указано";
      if (!specialistsData[fio]) specialistsData[fio] = [];

      specialistsData[fio].push({
        cert: row["Cert"] || row["№ удостоверения"] || "",
        groupAbr: row["GroupAbr"] || row["Группа (аббревиатура)"] || "",
        group: row["Group"] || row["Уровень"] || "",
        validUntil: row["ValidUntil"] || row["Действует до"] || "",
        certificateLink:
          row["CertificateLink"] || row["Ссылка на сертификат"] || "",
        comment: row["Comment"] || row["Комментарий"] || "",
      });
    });
    console.log(
      `Загружено специалистов: ${Object.values(specialistsData).reduce((s, a) => s + a.length, 0)}`,
    );
  } catch (error) {
    console.error("Ошибка загрузки специалистов:", error);
    specialistsData = {};
  }
}

async function loadTechInstructionsData() {
  if (!window.spreadsheetConfig) return;
  const url = window.spreadsheetConfig.SPREADSHEET_URLS.techInstructions;
  try {
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);
    techInstructionsData = rows.map((row, index) => ({
      id: index + 1,
      number: row["number"] || row["№ ТИ"] || "",
      year: row["year"] || row["Год ввода"] || "",
      name: row["name"] || row["Наименование"] || "",
      status: row["status"] || row["Статус"] || "",
      location: row["location"] || row["Место хранения"] || "",
      comments: row["comments"] || row["Комментарии"] || "",
    }));
    console.log(`Загружено инструкций: ${techInstructionsData.length}`);
  } catch (error) {
    console.error("Ошибка загрузки инструкций:", error);
    techInstructionsData = [];
  }
}

async function loadWeldingEquipmentData() {
  if (!window.spreadsheetConfig) return;
  const url = window.spreadsheetConfig.SPREADSHEET_URLS.weldingEquipment;
  try {
    const rows = await window.spreadsheetConfig.loadCSVAsJSON(url);
    weldingEquipmentData = rows.map((row, index) => ({
      id: index + 1,
      name: row["Наименование"] || row["Name"] || "",
      manufactureDate: row["Дата изготовления"] || row["ManufactureDate"] || "",
      expiryDate: row["Срок действия"] || row["ExpiryDate"] || "",
    }));
    console.log(`Загружено оборудования: ${weldingEquipmentData.length}`);
  } catch (error) {
    console.error("Ошибка загрузки оборудования:", error);
    weldingEquipmentData = [];
  }
}

// ========== НАВИГАЦИЯ ==========
function selectDataType(dataType) {
  document
    .querySelectorAll(".data-type-nav button")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.getElementById(`${dataType}-btn`);
  if (activeBtn) activeBtn.classList.add("active");
  currentDataType = dataType;

  const activeFunctionBtn = document.querySelector(
    ".function-nav button.active",
  );
  if (activeFunctionBtn) {
    const functionName = activeFunctionBtn.id.replace("-btn", "");
    showSection(functionName);
  } else {
    showSection("overview");
  }
}

function showSection(sectionName) {
  document
    .querySelectorAll(".function-nav button")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.getElementById(`${sectionName}-btn`);
  if (activeBtn) activeBtn.classList.add("active");

  document.querySelectorAll(".hidden-section").forEach((section) => {
    section.classList.remove("active");
    section.style.display = "none";
  });

  if (currentDataType) {
    const targetSection = document.getElementById(
      `${currentDataType}-${sectionName}-section`,
    );
    if (targetSection) {
      targetSection.classList.add("active");
      targetSection.style.display = "block";
    }
    if (sectionName === "manage") {
      loadTable();
    } else if (sectionName === "overview") {
      updateStats();
    }

    // Обновляем статистику при переключении типов данных
    if (currentDataType) {
      updateStats();
    }
  }
}

// ========== ОТОБРАЖЕНИЕ ТАБЛИЦ ==========
function loadTable() {
  if (!currentDataType) return;
  switch (currentDataType) {
    case DATA_TYPES.WIRE:
      loadWireTable();
      break;
    case DATA_TYPES.WELDERS:
      loadWeldersTable();
      break;
    case DATA_TYPES.SPECIALISTS:
      loadSpecialistsTable();
      break;
    case DATA_TYPES.TECHPROCESS:
      loadTechprocessTable();
      break;
    case DATA_TYPES.TECHINSTRUCTIONS:
      loadTechInstructionsTable();
      break;
    case DATA_TYPES.WELDINGEQUIPMENT:
      loadWeldingEquipmentTable();
      break;
  }
}

function loadWireTable() {
  console.log("loadWireTable called, wireData length:", wireData.length);
  const tbody = document.getElementById("wire-admin-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filterMethod = document.getElementById("wire-filter-method")
    ? document.getElementById("wire-filter-method").value
    : null;
  let filtered = filterMethod
    ? wireData.filter((item) => item.method === filterMethod)
    : wireData;

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;">Нет данных</td></tr>';
    return;
  }

  filtered.forEach((item) => {
    const row = document.createElement("tr");
    const isExpired =
      window.registryCommon && window.registryCommon.isExpired(item.issueDate);
    row.innerHTML = `
      <td>${item.id}</td>
      <td><strong>${item.brand}</strong></td>
      <td>${item.type}</td>
      <td>${getMethodDisplay(item.method)}</td>
      <td>${item.diameter}</td>
      <td>${item.manufacturer}</td>
      <td style="color: ${isExpired ? "red" : "green"}">${item.issueDate}</td>
    `;
    tbody.appendChild(row);
  });
}

function loadWeldersTable() {
  const tbody = document.getElementById("welders-admin-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filterMethod = document.getElementById("welders-filter-method")
    ? document.getElementById("welders-filter-method").value
    : null;
  let allWelders = [];
  Object.entries(weldersData).forEach(([category, welders]) => {
    if (!filterMethod || category === filterMethod) {
      welders.forEach((welder) => allWelders.push({ ...welder, category }));
    }
  });

  allWelders.forEach((welder) => {
    const row = document.createElement("tr");
    const isValid =
      window.registryCommon &&
      !window.registryCommon.isExpired(welder.validUntil);
    row.innerHTML = `
      <td><strong>${welder.fio}</strong></td>
      <td>${welder.stamp}</td>
      <td>${welder.thickness}</td>
      <td style="color: ${isValid ? "green" : "red"}">${welder.validUntil}</td>
      <td>${welder.material}</td>
    `;
    tbody.appendChild(row);
  });
}

function loadSpecialistsTable() {
  const tbody = document.getElementById("specialists-admin-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  Object.entries(specialistsData).forEach(([fio, specialists]) => {
    specialists.forEach((specialist) => {
      const row = document.createElement("tr");
      const isValid =
        window.registryCommon &&
        !window.registryCommon.isExpired(specialist.validUntil);
      row.innerHTML = `
        <td><strong>${fio}</strong></td>
        <td>${specialist.cert}</td>
        <td>${specialist.groupAbr}</td>
        <td>${specialist.group}</td>
        <td style="color: ${isValid ? "green" : "red"}">${specialist.validUntil}</td>
      `;
      tbody.appendChild(row);
    });
  });
}

function loadTechprocessTable() {
  const tbody = document.getElementById("techprocess-admin-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filterMethod = document.getElementById("techprocess-filter-method")
    ? document.getElementById("techprocess-filter-method").value
    : null;
  let allProcesses = [];
  Object.entries(techprocessData).forEach(([category, processes]) => {
    if (!filterMethod || category === filterMethod) {
      processes.forEach((process) =>
        allProcesses.push({ ...process, category }),
      );
    }
  });

  allProcesses.forEach((process) => {
    const row = document.createElement("tr");
    const isValid =
      window.registryCommon &&
      !window.registryCommon.isExpired(process.validUntil);
    row.innerHTML = `
      <td>${process.cert}</td>
      <td>${process.groupAbr}</td>
      <td>${process.material}</td>
      <td>${process.category}</td>
      <td style="color: ${isValid ? "green" : "red"}">${process.validUntil}</td>
    `;
    tbody.appendChild(row);
  });
}

function loadTechInstructionsTable() {
  const tbody = document.getElementById("techInstructions-admin-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  techInstructionsData.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${item.number}</td>
            <td>${item.year}</td>
            <td>${item.name}</td>
            <td>${item.status}</td>
            <td>${item.location}</td>
            <td>${item.comments}</td>
        `;
    tbody.appendChild(row);
  });
}

function loadWeldingEquipmentTable() {
  const tbody = document.getElementById("weldingEquipment-admin-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  weldingEquipmentData.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.manufactureDate ? window.registryCommon.formatDate(item.manufactureDate) : ""}</td>
            <td>${item.expiryDate ? window.registryCommon.formatDate(item.expiryDate) : ""}</td>
        `;
    tbody.appendChild(row);
  });
}

function getMethodDisplay(method) {
  const map = { AF: "АФ", MP: "МП", RD: "РД", RAD: "РАД" };
  return map[method] || method || "—";
}

// Фильтры
function filterWireRecords() {
  loadWireTable();
}
function filterWeldersRecords() {
  loadWeldersTable();
}
function filterTechprocessRecords() {
  loadTechprocessTable();
}

// ========== СТАТИСТИКА ==========
function updateStats() {
  updateWireStats();
  updateWeldersStats();
  updateSpecialistsStats();
  updateTechprocessStats();
  updateTechInstructionsStats();
  updateWeldingEquipmentStats();
}

function updateWireStats() {
  const total = wireData.length;
  const mp = wireData.filter((w) => w.method === "MP").length;
  const af = wireData.filter((w) => w.method === "AF").length;
  const rad = wireData.filter((w) => w.method === "RAD").length;
  const rd = wireData.filter((w) => w.method === "RD").length;

  // Используем исправленную функцию isExpired из registry-common.js
  let expired = 0;
  if (window.registryCommon && window.registryCommon.isExpired) {
    wireData.forEach((w) => {
      if (window.registryCommon.isExpired(w.issueDate)) {
        expired++;
      }
    });
  }

  setText("wire-total-count", total);
  setText("wire-mp-count", mp);
  setText("wire-af-count", af);
  setText("wire-rad-count", rad);
  setText("wire-rd-count", rd);
  setText("wire-expired-count", expired);
}

function updateWeldersStats() {
  let total = 0,
    active = 0,
    expired = 0;
  Object.values(weldersData).forEach((arr) => {
    total += arr.length;
    arr.forEach((w) => {
      if (
        window.registryCommon &&
        window.registryCommon.isExpired(w.validUntil)
      )
        expired++;
      else active++;
    });
  });
  setText("welders-total-count", total);
  setText("welders-active-count", active);
  setText("welders-expired-count", expired);
}

function updateSpecialistsStats() {
  let total = 0,
    level3 = 0,
    expired = 0;
  Object.values(specialistsData).forEach((arr) => {
    total += arr.length;
    arr.forEach((s) => {
      if (s.group === "III уровень") level3++;
      if (
        window.registryCommon &&
        window.registryCommon.isExpired(s.validUntil)
      )
        expired++;
    });
  });
  setText("specialists-total-count", total);
  setText("specialists-level3-count", level3);
  setText("specialists-expired-count", expired);
}

function updateTechprocessStats() {
  let total = 0,
    expired = 0;
  Object.values(techprocessData).forEach((arr) => {
    total += arr.length;
    arr.forEach((p) => {
      if (
        window.registryCommon &&
        window.registryCommon.isExpired(p.validUntil)
      )
        expired++;
    });
  });
  setText("techprocess-total-count", total);
  setText("techprocess-expired-count", expired);
}

function updateTechInstructionsStats() {
  const total = techInstructionsData.length;
  const active = techInstructionsData.filter(
    (item) => item.status && item.status.toLowerCase().includes("действует"),
  ).length;
  const cancelled = techInstructionsData.filter(
    (item) => item.status && !item.status.toLowerCase().includes("действует"),
  ).length;

  setText("techInstructions-total-count", total);
  setText("techInstructions-active-count", active);
  setText("techInstructions-cancelled-count", cancelled);
}

function updateWeldingEquipmentStats() {
  const total = weldingEquipmentData.length;

  let active = 0;
  let expired = 0;

  weldingEquipmentData.forEach((item) => {
    if (
      window.registryCommon &&
      window.registryCommon.isExpired(item.expiryDate)
    ) {
      expired++;
    } else {
      active++;
    }
  });

  setText("weldingEquipment-total-count", total);
  setText("weldingEquipment-active-count", active);
  setText("weldingEquipment-expired-count", expired);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "—";
}

// ========== МОБИЛЬНОЕ МЕНЮ ==========
function toggleMobileMenu() {
  const sidebar = document.querySelector(".admin-sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const toggle = document.getElementById("mobileMenuToggle");

  sidebar.classList.toggle("mobile-open");
  overlay.classList.toggle("active");

  // Меняем иконку
  const icon = toggle.querySelector("i");
  if (sidebar.classList.contains("mobile-open")) {
    icon.classList.remove("fa-bars");
    icon.classList.add("fa-times");
  } else {
    icon.classList.remove("fa-times");
    icon.classList.add("fa-bars");
  }
}

// ========== МОДАЛЬНОЕ ОКНО ПРОСРОЧЕННЫХ ==========
function showExpiredModal(dataType) {
  const modal = document.getElementById("expired-modal");
  const listContainer = document.getElementById("expired-list");

  if (!modal || !listContainer) return;

  let expiredItems = [];
  let title = "";

  if (dataType === "wire") {
    title = "Просроченная проволока";
    expiredItems = wireData
      .filter(
        (item) =>
          window.registryCommon &&
          window.registryCommon.isExpired(item.issueDate),
      )
      .map((item) => ({
        name: item.brand || "—",
        detail: `${item.diameter || "—"} мм`,
      }));
  } else if (dataType === "equipment") {
    title = "Просроченное оборудование";
    expiredItems = weldingEquipmentData
      .filter(
        (item) =>
          window.registryCommon &&
          window.registryCommon.isExpired(item.expiryDate),
      )
      .map((item) => ({
        name: item.name || "—",
        detail: item.equipmentSN || "—",
      }));
  }

  // Обновляем заголовок модального окна
  const modalHeader = modal.querySelector(".modal-header h3");
  if (modalHeader) {
    modalHeader.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${title}`;
  }

  if (expiredItems.length === 0) {
    listContainer.innerHTML = `
      <div class="expired-empty">
        <i class="fas fa-check-circle" style="font-size: 48px; color: #28a745; margin-bottom: 15px;"></i>
        <p>Просроченных записей не найдено</p>
      </div>
    `;
  } else {
    listContainer.innerHTML = expiredItems
      .map(
        (item) => `
      <div class="expired-item">
        <span class="expired-item-brand">${item.name}</span>
        <span class="expired-item-diameter">${item.detail}</span>
      </div>
    `,
      )
      .join("");
  }

  modal.classList.remove("hidden");
}

function closeExpiredModal() {
  const modal = document.getElementById("expired-modal");
  if (modal) modal.classList.add("hidden");
}

// ========== УПРАВЛЕНИЕ КЭШЕМ ==========

// Обновить все данные (принудительно)
window.refreshAllData = async function () {
  if (!navigator.onLine) {
    if (window.registryCommon) {
      window.registryCommon.showNotification(
        "Нет подключения к интернету",
        "error",
      );
    }
    return;
  }

  try {
    if (window.registryCommon) {
      window.registryCommon.showNotification("Обновление данных...", "info");
    }

    // Очищаем кэш перед обновлением
    if (window.DataManager) {
      await window.DataManager.clearAllCache();
    }

    // Перезагружаем данные
    await loadData();

    if (window.registryCommon) {
      window.registryCommon.showNotification(
        "Данные успешно обновлены",
        "success",
      );
    }
  } catch (error) {
    console.error("Ошибка обновления данных:", error);
    if (window.registryCommon) {
      window.registryCommon.showNotification(
        "Ошибка обновления: " + error.message,
        "error",
      );
    }
  }
};

// Сбросить весь кэш
window.clearAllCache = async function () {
  console.log("[Admin] Начинаем очистку кэша...");

  try {
    // 1. Сначала очищаем Service Worker кэш
    if ("caches" in window) {
      var cacheNames = await caches.keys();
      console.log("[Admin] Найдено кэшей:", cacheNames.length);
      for (var i = 0; i < cacheNames.length; i++) {
        var deleted = await caches.delete(cacheNames[i]);
        console.log("[Admin] Кэш", cacheNames[i], "удалён:", deleted);
      }
    }

    // 2. Очищаем localStorage
    if ("localStorage" in window) {
      localStorage.clear();
      console.log("[Admin] localStorage очищен");
    }

    // 3. Очищаем sessionStorage
    if ("sessionStorage" in window) {
      sessionStorage.clear();
      console.log("[Admin] sessionStorage очищен");
    }

    // 4. Удаляем IndexedDB через DataManager (он сам закроет соединение)
    if (window.DataManager) {
      await window.DataManager.clearAllCache();
    }

    // Очищаем текущие данные
    wireData = [];
    weldersData = {};
    techprocessData = {};
    specialistsData = {};
    techInstructionsData = [];
    weldingEquipmentData = [];

    updateStats();

    if (window.registryCommon) {
      window.registryCommon.showNotification(
        "Кэш полностью сброшен. Обновите страницу.",
        "success",
      );
    }
  } catch (error) {
    console.error("[Admin] Ошибка сброса кэша:", error);
    if (window.registryCommon) {
      window.registryCommon.showNotification(
        "Ошибка сброса кэша: " + error.message,
        "error",
      );
    }
  }
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener("DOMContentLoaded", async function () {
  // Делаем функции глобальными
  window.selectDataType = selectDataType;
  window.showSection = showSection;
  window.filterWireRecords = filterWireRecords;
  window.filterWeldersRecords = filterWeldersRecords;
  window.filterTechprocessRecords = filterTechprocessRecords;
  window.updateStats = updateStats;
  window.showExpiredModal = showExpiredModal;
  window.closeExpiredModal = closeExpiredModal;
  window.toggleMobileMenu = toggleMobileMenu;

  await loadData();
  selectDataType("wire");
  showSection("overview");
});
