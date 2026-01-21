let wireData = [];
let weldersData = {};
let techprocessData = {};
let specialistsData = {};

const DATA_TYPES = {
  WIRE: "wire",
  WELDERS: "welders",
  SPECIALISTS: "specialists",
  TECHPROCESS: "techprocess",
};

let currentDataType = null;

const METHOD_MAPPING = {
  MP: "mp",
  AF: "af",
  RAD: "rad",
  RD: "rd",
};

function testFunction() {
  console.log("Тестовая функция работает!");
}

async function loadData() {
  try {
    console.log("=== НАЧАЛО ЗАГРУЗКИ ДАННЫХ ===");
    console.log("Размеры данных до загрузки:", {
      wireData: wireData.length,
      weldersData: Object.keys(weldersData).length,
      techprocessData: Object.keys(techprocessData).length,
      specialistsData: Object.keys(specialistsData).length,
    });

    console.log("METHOD_MAPPING:", METHOD_MAPPING);

    // Показываем уведомление о начале загрузки
    if (typeof window.registryCommon !== "undefined") {
      window.registryCommon.showNotification("Загрузка данных...", "info");
    }

    // Очищаем существующие данные перед загрузкой новых (предотвращаем задвоение)
    wireData = [];
    weldersData = {};
    techprocessData = {};
    specialistsData = {};

    console.log("Данные очищены, начинаем загрузку...");

    // Загрузка данных проволоки из всех папок
    let wireLoaded = 0;
    for (const [method, folder] of Object.entries(METHOD_MAPPING)) {
      try {
        const filePath = `data_json/${folder}/data-wire-${folder}.json`;
        console.log(`Попытка загрузить файл: ${filePath}`);

        const response = await fetch(filePath);
        console.log(`Ответ для ${filePath}:`, {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`Данные из файла ${filePath}:`, data);

          const key = `wireData${method}`;
          console.log(`Ищем ключ: ${key}`);

          if (data[key] && Array.isArray(data[key])) {
            console.log(
              `Найден массив ${key} с ${data[key].length} элементами`
            );

            // Сохраняем существующий метод или добавляем новый
            const dataWithMethod = data[key].map((item) => ({
              ...item,
              method: item.method || method, // Используем существующий method или добавляем новый
            }));

            // Удаляем дубликаты на основе brand + type + method (игнорируем index)
            const isDuplicate = (item, other) =>
              item.brand === other.brand &&
              item.type === other.type &&
              item.method === other.method;

            const uniqueData = dataWithMethod.filter(
              (item, index, self) =>
                index === self.findIndex((t) => isDuplicate(item, t))
            );

            console.log(
              `Из ${data[key].length} записей из ${folder} уникальных: ${uniqueData.length}`
            );

            // Показываем дубликаты для отладки
            const duplicates = dataWithMethod.filter(
              (item, index, self) =>
                index !==
                self.findIndex(
                  (t) =>
                    t.brand === item.brand &&
                    t.type === item.type &&
                    t.method === item.method
                )
            );
            if (duplicates.length > 0) {
              console.log(`Дубликаты в ${folder}:`, duplicates);
            }

            console.log(`Добавляем ${uniqueData.length} записей в wireData`);
            wireData.push(...uniqueData);
            wireLoaded += data[key].length;
            console.log(
              `Загружено ${data[key].length} записей проволоки из ${folder} (${method})`
            );

            console.log(`Текущий размер wireData: ${wireData.length}`);
          } else {
            console.warn(`Не найден массив ${key} в файле ${folder}`);
            console.warn(`Доступные ключи в файле:`, Object.keys(data));
          }
        } else {
          console.warn(
            `Файл ${folder} не найден или ошибка загрузки: ${response.status}`
          );
        }
      } catch (error) {
        console.warn(
          `Не удалось загрузить данные проволоки из ${folder}:`,
          error
        );
      }
    }

    console.log(`=== ЗАГРУЗКА ПРОВОЛОКИ ЗАВЕРШЕНА ===`);
    console.log(`Всего загружено записей проволоки: ${wireLoaded}`);
    console.log(`Размер массива wireData после загрузки: ${wireData.length}`);
    console.log(`Содержимое wireData:`, wireData);

    // Загрузка данных сварщиков из всех папок
    weldersData = {};
    let weldersLoaded = 0;
    for (const [method, folder] of Object.entries(METHOD_MAPPING)) {
      try {
        const response = await fetch(
          `data_json/${folder}/data-welders-${folder}.json`
        );
        if (response.ok) {
          const data = await response.json();
          const key = `welders${method}`;
          if (data[key] && Array.isArray(data[key])) {
            const categoryName = getWelderCategoryName(method);
            weldersData[categoryName] = data[key];
            weldersLoaded += data[key].length;
            console.log(`Загружено ${data[key].length} сварщиков из ${folder}`);
          } else {
            console.warn(`Не найден массив ${key} в файле ${folder}`);
          }
        } else {
          console.warn(
            `Файл ${folder} не найден или ошибка загрузки: ${response.status}`
          );
        }
      } catch (error) {
        console.warn(
          `Не удалось загрузить данные сварщиков из ${folder}:`,
          error
        );
      }
    }

    // Загрузка данных техпроцессов из всех папок
    techprocessData = {};
    let techprocessLoaded = 0;
    for (const [method, folder] of Object.entries(METHOD_MAPPING)) {
      try {
        const response = await fetch(
          `data_json/${folder}/data-techprocess-${folder}.json`
        );
        if (response.ok) {
          const data = await response.json();
          const key = `techprocess${method}`;
          if (data[key] && Array.isArray(data[key])) {
            const categoryName = getTechprocessCategoryName(method);
            techprocessData[categoryName] = data[key];
            techprocessLoaded += data[key].length;
            console.log(
              `Загружено ${data[key].length} техпроцессов из ${folder}`
            );
          } else {
            console.warn(`Не найден массив ${key} в файле ${folder}`);
          }
        } else {
          console.warn(
            `Файл ${folder} не найден или ошибка загрузки: ${response.status}`
          );
        }
      } catch (error) {
        console.warn(
          `Не удалось загрузить данные техпроцессов из ${folder}:`,
          error
        );
      }
    }

    // Загрузка данных специалистов
    try {
      const response = await fetch(`data_json/data-specialists.json`);
      if (response.ok) {
        specialistsData = await response.json();
        console.log("Загружены данные специалистов");
      } else {
        console.warn(
          `Файл data-specialists.json не найден: ${response.status}`
        );
      }
    } catch (error) {
      console.warn("Не удалось загрузить данные специалистов:", error);
    }

    console.log(
      `Загрузка завершена: ${wireLoaded} проволоки, ${weldersLoaded} сварщиков, ${techprocessLoaded} техпроцессов`
    );

    // Дополнительная проверка загруженных данных
    console.log("=== ПРОВЕРКА ЗАГРУЖЕННЫХ ДАННЫХ ПРОВОЛОКИ ===");
    const wireMethods = {};
    wireData.forEach((item, index) => {
      if (!wireMethods[item.method]) {
        wireMethods[item.method] = 0;
      }
      wireMethods[item.method]++;
    });
    console.log("Подсчет по методам:", wireMethods);

    // Показываем первые несколько записей для проверки
    console.log("Первые 5 записей проволоки:", wireData.slice(0, 5));

    console.log("=== РЕЗУЛЬТАТЫ ЗАГРУЗКИ ===");
    console.log("Размеры данных после загрузки:", {
      wireData: wireData.length,
      weldersCategories: Object.keys(weldersData),
      techprocessCategories: Object.keys(techprocessData),
      specialistsCategories: Object.keys(specialistsData),
    });

    // Удаляем дубликаты из всех данных проволоки (после загрузки из всех папок)
    console.log("=== УДАЛЕНИЕ ДУБЛИКАТОВ ИЗ ВСЕХ ДАННЫХ ===");
    console.log("До фильтрации:", wireData.length, "записей");

    const isDuplicateAll = (item, other) =>
      item.brand === other.brand &&
      item.type === other.type &&
      item.method === other.method;

    wireData = wireData.filter(
      (item, index, self) =>
        index === self.findIndex((t) => isDuplicateAll(item, t))
    );

    console.log("После фильтрации:", wireData.length, "уникальных записей");

    // Показываем статистику по методам после фильтрации
    const methodStats = {};
    wireData.forEach((item) => {
      if (!methodStats[item.method]) {
        methodStats[item.method] = 0;
      }
      methodStats[item.method]++;
    });
    console.log("Статистика по методам после фильтрации:", methodStats);

    console.log("=== ФИНАЛЬНАЯ ПРОВЕРКА ===");
    console.log("Финальный размер wireData:", wireData.length);
    console.log("Финальное содержимое wireData:", wireData);

    // Показываем уведомление об успешной загрузке
    if (typeof window.registryCommon !== "undefined") {
      window.registryCommon.showNotification(
        `Данные загружены: ${wireLoaded} проволоки, ${weldersLoaded} сварщиков`,
        "success"
      );
    }

    // Обновляем статистику после загрузки
    console.log("=== ВЫЗОВ UPDATE_STATS ===");
    updateStats();
  } catch (error) {
    console.error("Критическая ошибка при загрузке данных:", error);
    // Инициализируем пустыми данными в случае ошибки
    wireData = [];
    weldersData = {};
    specialistsData = {};
    techprocessData = {};

    // Показываем уведомление об ошибке
    if (typeof window.registryCommon !== "undefined") {
      window.registryCommon.showNotification(
        "Ошибка загрузки данных. Проверьте консоль для подробностей.",
        "error"
      );
    }
  }
}

// Функция проверки доступности файлов
async function checkFilesAvailability() {
  console.log("Проверяем доступность файлов данных...");

  const filesToCheck = [
    "data_json/mp/data-wire-mp.json",
    "data_json/af/data-wire-af.json",
    "data_json/rad/data-wire-rad.json",
    "data_json/rd/data-wire-rd.json",
  ];

  for (const filePath of filesToCheck) {
    try {
      console.log(`Проверяем файл: ${filePath}`);
      const response = await fetch(filePath, { method: "HEAD" });
      console.log(
        `${filePath}: ${response.ok ? "Доступен" : "Недоступен"} (${
          response.status
        })`
      );
    } catch (error) {
      console.error(`Ошибка при проверке ${filePath}:`, error);
    }
  }
}

// Получение названия категории сварщика по методу
function getWelderCategoryName(method) {
  const mapping = {
    MP: "Полуавтоматическая сварка",
    AF: "Автоматическая сварка",
    RAD: "Аргонодуговая сварка",
    RD: "Ручная дуговая",
  };
  return mapping[method] || method;
}

// Получение названия категории техпроцесса по методу
function getTechprocessCategoryName(method) {
  const mapping = {
    MP: "Полуавтоматическая сварка",
    AF: "Автоматическая сварка под слоем флюса",
    RAD: "Ручная аргонодуговая сварка",
    RD: "Ручная дуговая сварка",
  };
  return mapping[method] || method;
}

// Получение отображаемого названия способа сварки
function getMethodDisplay(method) {
  const mapping = {
    AF: "АФ - автоматическая под флюсом",
    MP: "МП - полуавтоматическая",
    RD: "РД - ручная дуговая",
    RAD: "РАД - ручная аргонодуговая",
  };
  return mapping[method] || method;
}

// Выбор типа данных
function selectDataType(dataType) {
  console.log("selectDataType вызвана с параметром:", dataType);

  // Убираем активный класс у всех кнопок типа данных
  document.querySelectorAll(".data-type-nav button").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Добавляем активный класс выбранной кнопке
  const activeBtn = document.getElementById(`${dataType}-btn`);
  console.log("Найдена кнопка:", activeBtn);

  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // Устанавливаем текущий тип данных
  currentDataType = dataType;

  // Обновляем отображение на основе текущей активной функции
  const activeFunctionBtn = document.querySelector(
    ".function-nav button.active"
  );
  if (activeFunctionBtn) {
    const functionName = activeFunctionBtn.id.replace("-btn", "");
    showSection(functionName);
  } else {
    // Если нет активной функции, показываем обзор по умолчанию
    showSection("overview");
  }
}

// Переключение между секциями
function showSection(sectionName) {
  console.log("showSection вызвана с параметром:", sectionName);

  // Убираем активный класс у всех кнопок функций
  document.querySelectorAll(".function-nav button").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Добавляем активный класс выбранной кнопке
  const activeBtn = document.getElementById(`${sectionName}-btn`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // Скрываем все секции
  document.querySelectorAll(".hidden-section").forEach((section) => {
    section.classList.remove("active");
    section.style.display = "none";
  });

  // Для секции импорта/экспорта используем особую логику
  if (sectionName === "import") {
    const importSection = document.getElementById("import-section");
    if (importSection) {
      importSection.classList.add("active");
      importSection.style.display = "block";
    }
  } else {
    // Показываем выбранную секцию для других типов данных
    if (currentDataType) {
      const targetSection = document.getElementById(
        `${currentDataType}-${sectionName}-section`
      );
      if (targetSection) {
        targetSection.classList.add("active");
        targetSection.style.display = "block";
      }

      // Если это раздел управления, загружаем данные
      if (sectionName === "manage") {
        loadTable();
      } else if (sectionName === "overview") {
        updateStats();
      }
    }
  }
}

// Сохранение данных в JSON файлы (эмуляция - в реальном приложении потребуется сервер)
function saveData(dataType = null) {
  console.log(`Сохранение данных типа: ${dataType || "все"}`);

  // В реальном приложении здесь был бы код для отправки данных на сервер
  // Для демонстрации просто логируем
  if (!dataType || dataType === DATA_TYPES.WIRE) {
    console.log(`Сохраняем ${wireData.length} записей проволоки`);
  }
  if (!dataType || dataType === DATA_TYPES.WELDERS) {
    console.log(`Сохраняем сварщиков:`, weldersData);
  }
  if (!dataType || dataType === DATA_TYPES.SPECIALISTS) {
    console.log(`Сохраняем специалистов:`, specialistsData);
  }
  if (!dataType || dataType === DATA_TYPES.TECHPROCESS) {
    console.log(`Сохраняем техпроцессы:`, techprocessData);
  }

  // Создаем коммит изменений
  commitChanges(dataType);
}

// Функция коммита изменений (эмуляция)
function commitChanges(dataType) {
  const timestamp = new Date().toISOString();
  const commitMessage = `Обновление данных ${
    dataType || "всех типов"
  } - ${timestamp}`;

  console.log(`Коммит: ${commitMessage}`);
}

// Загрузка всех данных (алиас для loadData)
function loadAllData() {
  loadData();
}

// Загрузка таблицы с записями
function loadTable() {
  const activeBtn = document.querySelector(".admin-nav button.active");
  if (!activeBtn) return;

  const dataType = activeBtn.id.replace("-btn", "");

  switch (dataType) {
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
    default:
      console.log(`Загрузка таблицы для ${dataType} еще не реализована`);
  }
}

// Загрузка таблицы проволоки
function loadWireTable() {
  const tbody = document.getElementById("wire-admin-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const filterMethod = document.getElementById("wire-filter-method")?.value;
  let filteredData = wireData;

  if (filterMethod) {
    filteredData = wireData.filter((item) => item.method === filterMethod);
  }

  filteredData.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${item.id}</td>
            <td><strong>${item.brand}</strong></td>
            <td>${item.type}</td>
            <td>${getMethodDisplay(item.method)}</td>
            <td>${item.diameter}</td>
            <td>${item.manufacturer}</td>
            <td class="action-buttons">
                <button onclick="editRecord(${item.id}, '${DATA_TYPES.WIRE}')"
                        class="btn-small btn-warning">✏️</button>
                <button onclick="deleteRecord(${item.id}, '${DATA_TYPES.WIRE}')"
                        class="btn-small btn-danger">🗑️</button>
            </td>
        `;
    tbody.appendChild(row);
  });
}

// Загрузка таблицы сварщиков
function loadWeldersTable() {
  const tbody = document.getElementById("welders-admin-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const filterMethod = document.getElementById("welders-filter-method")?.value;
  let allWelders = [];

  // Собираем всех сварщиков из всех категорий
  Object.entries(weldersData).forEach(([category, welders]) => {
    if (!filterMethod || category === filterMethod) {
      welders.forEach((welder, index) => {
        allWelders.push({ ...welder, category, index });
      });
    }
  });

  allWelders.forEach((welder) => {
    const row = document.createElement("tr");
    const validUntil = new Date(
      welder.validUntil.split("-").reverse().join("-")
    );
    const today = new Date();
    const isExpired = validUntil < today;

    row.innerHTML = `
      <td><strong>${welder.fio}</strong></td>
      <td>${welder.stamp}</td>
      <td>${welder.thickness}</td>
      <td style="color: ${isExpired ? "red" : "green"}">${
      welder.validUntil
    }</td>
      <td>${welder.material}</td>
      <td class="action-buttons">
        <button onclick="editWelder('${welder.fio}', '${welder.category}', ${
      welder.index
    })"
                class="btn-small btn-warning">✏️</button>
        <button onclick="deleteWelder('${welder.fio}', '${welder.category}', ${
      welder.index
    })"
                class="btn-small btn-danger">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Загрузка таблицы специалистов
function loadSpecialistsTable() {
  const tbody = document.getElementById("specialists-admin-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  Object.entries(specialistsData).forEach(([fio, specialists]) => {
    specialists.forEach((specialist, index) => {
      const row = document.createElement("tr");
      const validUntil = new Date(
        specialist.validUntil.split("-").reverse().join("-")
      );
      const today = new Date();
      const isExpired = validUntil < today;

      row.innerHTML = `
        <td><strong>${fio}</strong></td>
        <td>${specialist.cert}</td>
        <td>${specialist.groupAbr}</td>
        <td>${specialist.group}</td>
        <td style="color: ${isExpired ? "red" : "green"}">${
        specialist.validUntil
      }</td>
        <td class="action-buttons">
          <button onclick="editSpecialist('${fio}', ${index})"
                  class="btn-small btn-warning">✏️</button>
          <button onclick="deleteSpecialist('${fio}', ${index})"
                  class="btn-small btn-danger">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  });
}

// Загрузка таблицы техпроцессов
function loadTechprocessTable() {
  const tbody = document.getElementById("techprocess-admin-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const filterMethod = document.getElementById(
    "techprocess-filter-method"
  )?.value;
  let allProcesses = [];

  // Собираем все техпроцессы из всех категорий
  Object.entries(techprocessData).forEach(([category, processes]) => {
    if (!filterMethod || category === filterMethod) {
      processes.forEach((process, index) => {
        allProcesses.push({ ...process, category, index });
      });
    }
  });

  allProcesses.forEach((process) => {
    const row = document.createElement("tr");
    const validUntil = new Date(
      process.validUntil.split("-").reverse().join("-")
    );
    const today = new Date();
    const isExpired = validUntil < today;

    row.innerHTML = `
      <td>${process.cert}</td>
      <td>${process.groupAbr}</td>
      <td>${process.material}</td>
      <td>${process.category}</td>
      <td style="color: ${isExpired ? "red" : "green"}">${
      process.validUntil
    }</td>
      <td class="action-buttons">
        <button onclick="editTechprocess('${process.category}', ${
      process.index
    })"
                class="btn-small btn-warning">✏️</button>
        <button onclick="deleteTechprocess('${process.category}', ${
      process.index
    })"
                class="btn-small btn-danger">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Фильтрация записей
function filterRecords() {
  loadTable();
}

// Фильтрация проволоки
function filterWireRecords() {
  loadWireTable();
}

// Фильтрация сварщиков
function filterWeldersRecords() {
  loadWeldersTable();
}

// Фильтрация специалистов
function filterSpecialistsRecords() {
  loadSpecialistsTable();
}

// Фильтрация техпроцессов
function filterTechprocessRecords() {
  loadTechprocessTable();
}

// Редактирование записи
function editRecord(id, dataType = DATA_TYPES.WIRE) {
  console.log(`Редактирование записи ${id} типа ${dataType}`);
  // Здесь должна быть логика редактирования
}

// Удаление записи
function deleteRecord(id, dataType = DATA_TYPES.WIRE) {
  if (confirm(`Удалить запись ${id}?`)) {
    if (dataType === DATA_TYPES.WIRE) {
      wireData = wireData.filter((item) => item.id !== id);
      saveData(DATA_TYPES.WIRE);
      updateStats();
      loadTable();
      alert("✅ Запись удалена!");
    }
  }
}

// Функции для редактирования и удаления сварщиков
function editWelder(fio, category, index = null) {
  console.log(`Редактирование сварщика ${fio} из категории ${category}`);
  // Здесь должна быть логика редактирования
}

function deleteWelder(fio, category, index = null) {
  if (confirm(`Удалить сварщика ${fio}?`)) {
    if (index !== null) {
      weldersData[category].splice(index, 1);
    } else {
      weldersData[category] = weldersData[category].filter(
        (w) => w.fio !== fio
      );
    }

    // Если категория стала пустой, удаляем её
    if (weldersData[category].length === 0) {
      delete weldersData[category];
    }

    saveData(DATA_TYPES.WELDERS);
    updateStats();
    loadTable();
    alert("✅ Сварщик удален!");
  }
}

// Функции для редактирования и удаления специалистов
function editSpecialist(fio, index) {
  console.log(`Редактирование specialistа ${fio}, индекс ${index}`);
  // Здесь должна быть логика редактирования
}

function deleteSpecialist(fio, index) {
  if (confirm(`Удалить специалиста ${fio}?`)) {
    specialistsData[fio].splice(index, 1);

    // Если у специалиста не осталось записей, удаляем его
    if (specialistsData[fio].length === 0) {
      delete specialistsData[fio];
    }

    saveData(DATA_TYPES.SPECIALISTS);
    updateStats();
    loadTable();
    alert("✅ Специалист удален!");
  }
}

// Функции для редактирования и удаления техпроцессов
function editTechprocess(category, index = null) {
  console.log(`Редактирование техпроцесса из категории ${category}`);
  // Здесь должна быть логика редактирования
}

function deleteTechprocess(category, index = null) {
  if (confirm(`Удалить техпроцесс?`)) {
    if (index !== null) {
      techprocessData[category].splice(index, 1);
    }

    // Если категория стала пустой, удаляем её
    if (techprocessData[category].length === 0) {
      delete techprocessData[category];
    }

    saveData(DATA_TYPES.TECHPROCESS);
    updateStats();
    loadTable();
    alert("✅ Техпроцесс удален!");
  }
}

// Функция для импорта всех данных из файла
function importAllData(event) {
  console.log("Импорт всех данных");

  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      if (
        confirm(
          "Импортировать все данные из файла? Это заменит текущие данные."
        )
      ) {
        // Полный импорт всех данных
        if (data.wireData) wireData = data.wireData;
        if (data.weldersData) weldersData = data.weldersData;
        if (data.specialistsData) specialistsData = data.specialistsData;
        if (data.techprocessData) techprocessData = data.techprocessData;

        // Сохраняем и обновляем
        saveData();
        updateStats();
        loadTable();

        alert("✅ Все данные успешно импортированы!");
      }
    } catch (error) {
      console.error("Ошибка импорта всех данных:", error);
      alert("❌ Ошибка при импорте данных");
    }
  };

  reader.readAsText(file);
}

// Функция для импорта данных
function importData(event) {
  console.log("Импорт данных");
  // Базовая реализация - можно расширить
}

// Вспомогательная функция для получения текущей даты в формате YYYY-MM-DD
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Вспомогательная функция для создания и скачивания JSON файла
function downloadJSONFile(jsonString, filename) {
  // Создаем blob из JSON строки
  const blob = new Blob([jsonString], { type: "application/json" });

  // Создаем временную ссылку для скачивания
  const url = URL.createObjectURL(blob);

  // Создаем элемент <a> для скачивания
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";

  // Добавляем элемент в DOM, кликаем по нему и удаляем
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Очищаем временную ссылку
  URL.revokeObjectURL(url);
}

// Функции для экспорта данных
function exportData(dataType) {
  console.log(`Экспорт данных типа: ${dataType}`);

  try {
    let dataToExport = null;
    let filename = "";

    switch (dataType) {
      case "wire":
        dataToExport = wireData;
        filename = `wire_data_${getCurrentDate()}.json`;
        break;
      case "welders":
        dataToExport = weldersData;
        filename = `welders_data_${getCurrentDate()}.json`;
        break;
      case "specialists":
        dataToExport = specialistsData;
        filename = `specialists_data_${getCurrentDate()}.json`;
        break;
      case "techprocess":
        dataToExport = techprocessData;
        filename = `techprocess_data_${getCurrentDate()}.json`;
        break;
      default:
        alert("Неизвестный тип данных для экспорта");
        return;
    }

    if (
      !dataToExport ||
      (Array.isArray(dataToExport) && dataToExport.length === 0)
    ) {
      alert(`Нет данных для экспорта типа: ${dataType}`);
      return;
    }

    // Создаем JSON строку
    const jsonString = JSON.stringify(dataToExport, null, 2);

    // Создаем и скачиваем файл
    downloadJSONFile(jsonString, filename);

    alert(
      `✅ Данные типа "${dataType}" успешно экспортированы в файл ${filename}`
    );
  } catch (error) {
    console.error("Ошибка при экспорте данных:", error);
    alert("❌ Ошибка при экспорте данных. Проверьте консоль для подробностей.");
  }
}

function exportAllData() {
  console.log("Экспорт всех данных");

  try {
    const allData = {
      wireData: wireData,
      weldersData: weldersData,
      specialistsData: specialistsData,
      techprocessData: techprocessData,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const jsonString = JSON.stringify(allData, null, 2);
    const filename = `all_data_export_${getCurrentDate()}.json`;

    downloadJSONFile(jsonString, filename);

    alert(`✅ Все данные успешно экспортированы в файл ${filename}`);
  } catch (error) {
    console.error("Ошибка при экспорте всех данных:", error);
    alert("❌ Ошибка при экспорте данных. Проверьте консоль для подробностей.");
  }
}

// Создание резервной копии (новая функция)
function createBackup() {
  console.log("Создание резервной копии");

  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        wireData: wireData,
        weldersData: weldersData,
        specialistsData: specialistsData,
        techprocessData: techprocessData,
      },
      metadata: {
        wireCount: wireData.length,
        weldersCount: Object.values(weldersData).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
        specialistsCount: Object.values(specialistsData).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
        techprocessCount: Object.values(techprocessData).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
      },
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `backup_${getCurrentDate()}_${new Date()
      .toTimeString()
      .split(" ")[0]
      .replace(/:/g, "-")}.json`;

    downloadJSONFile(jsonString, filename);

    alert(`✅ Резервная копия создана: ${filename}`);
  } catch (error) {
    console.error("Ошибка при создании резервной копии:", error);
    alert(
      "❌ Ошибка при создании резервной копии. Проверьте консоль для подробностей."
    );
  }
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOMContentLoaded запущен");
  testFunction();

  // Делаем функции глобально доступными
  window.selectDataType = selectDataType;
  window.testFunction = testFunction;
  window.updateStats = updateStats; // Делаем updateStats глобально доступной

  console.log("Функции сделаны глобально доступными");

  // Проверяем доступность файлов перед загрузкой
  console.log("=== ПРОВЕРКА ДОСТУПНОСТИ ФАЙЛОВ ===");
  await checkFilesAvailability();

  // Сначала загружаем данные
  await loadData();

  // Устанавливаем проволоку по умолчанию и показываем обзор
  selectDataType("wire");
  showSection("overview");

  // Добавляем обработчик формы добавления проволоки
  const wireForm = document.getElementById("wire-add-form");
  if (wireForm) {
    wireForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const newRecord = {
        id: Date.now(),
        brand: document.getElementById("wire-add-brand").value,
        type: document.getElementById("wire-add-type").value,
        method: document.getElementById("wire-add-method").value,
        diameter: document.getElementById("wire-add-diameter").value,
        standard: document.getElementById("wire-add-standard").value,
        manufacturer: document.getElementById("wire-add-manufacturer").value,
        certificate: document.getElementById("wire-add-certificate").value,
        issueDate: document.getElementById("wire-add-issueDate").value,
        description: document.getElementById("wire-add-description").value,
      };

      wireData.push(newRecord);
      saveData(DATA_TYPES.WIRE);
      updateStats();

      wireForm.reset();
      alert("✅ Запись успешно добавлена!");
    });
  }

  // Добавляем обработчик формы добавления сварщика
  const weldersForm = document.getElementById("welders-add-form");
  if (weldersForm) {
    weldersForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const newWelder = {
        fio: document.getElementById("welders-add-fio").value,
        stamp: document.getElementById("welders-add-stamp").value,
        thickness: document.getElementById("welders-add-thickness").value,
        validUntil: document.getElementById("welders-add-validUntil").value,
        material: document.getElementById("welders-add-material").value,
        certificateImage: document.getElementById(
          "welders-add-certificateImage"
        ).value,
        comment: document.getElementById("welders-add-comment").value,
      };

      // Определяем категорию на основе типа материала или других критериев
      // Пока добавляем в общую категорию
      const category = "Общие"; // Можно добавить логику определения категории

      if (!weldersData[category]) {
        weldersData[category] = [];
      }
      weldersData[category].push(newWelder);

      saveData(DATA_TYPES.WELDERS);
      updateStats();

      weldersForm.reset();
      alert("✅ Сварщик успешно добавлен!");
    });
  }

  console.log("Инициализация завершена");
});

// Общая функция обновления статистики
function updateStats() {
  console.log("=== ВЫЗОВ UPDATE_STATS ===");
  console.log("Обновляем статистику для всех типов данных...");

  try {
    updateWireStats();
    updateWeldersStats();
    updateSpecialistsStats();
    updateTechprocessStats();
    console.log("Вся статистика обновлена успешно");
  } catch (error) {
    console.error("Ошибка при обновлении статистики:", error);
  }
}

// Статистика проволоки
function updateWireStats() {
  console.log(
    "Обновление статистики проволоки. Всего записей:",
    wireData.length
  );

  // Детальное логирование всех данных проволоки
  console.log("=== ДЕТАЛЬНЫЙ АНАЛИЗ ДАННЫХ ПРОВОЛОКИ ===");
  const methodCounts = {};
  wireData.forEach((item, index) => {
    if (!methodCounts[item.method]) {
      methodCounts[item.method] = [];
    }
    methodCounts[item.method].push({
      index: index,
      brand: item.brand,
      type: item.type,
      method: item.method,
    });
  });

  console.log("Группировка по методам:", methodCounts);

  // Проверяем на наличие undefined/null методов
  const undefinedMethods = wireData.filter((item) => !item.method);
  if (undefinedMethods.length > 0) {
    console.warn("Найдены записи без метода:", undefinedMethods);
  }

  const totalCount = wireData.length;
  const mpCount = wireData.filter((item) => item.method === "MP").length;
  const afCount = wireData.filter((item) => item.method === "AF").length;
  const radCount = wireData.filter((item) => item.method === "RAD").length;
  const rdCount = wireData.filter((item) => item.method === "RD").length;

  console.log("Подсчет по методам:", {
    total: totalCount,
    MP: mpCount,
    AF: afCount,
    RAD: radCount,
    RD: rdCount,
  });

  // Подсчет просроченных записей по дате выдачи
  let expiredWireCount = 0;
  wireData.forEach((wire) => {
    if (wire.issueDate) {
      try {
        const issueDate = new Date(
          wire.issueDate.split(".").reverse().join("-")
        );
        const today = new Date();
        // Считаем просроченными сертификаты старше 3 лет
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(today.getFullYear() - 3);

        if (issueDate < threeYearsAgo) {
          expiredWireCount++;
        }
      } catch (error) {
        console.warn(
          "Ошибка обработки даты для проволоки:",
          wire.issueDate,
          error
        );
      }
    }
  });

  console.log(`Просроченных записей: ${expiredWireCount}`);

  // Обновляем элементы DOM с проверкой существования
  const elements = {
    "wire-total-count": totalCount,
    "wire-mp-count": mpCount,
    "wire-af-count": afCount,
    "wire-rad-count": radCount,
    "wire-rd-count": rdCount,
    "wire-expired-count": expiredWireCount,
  };

  console.log("=== ОБНОВЛЕНИЕ ЭЛЕМЕНТОВ DOM ===");
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
      console.log(`✅ Обновлен элемент ${id}: ${value}`);
    } else {
      console.warn(`❌ Элемент ${id} не найден в DOM`);
    }
  });

  console.log("=== ЗАВЕРШЕНИЕ updateWireStats ===");
}

// Статистика сварщиков
function updateWeldersStats() {
  console.log("Обновление статистики сварщиков");
  console.log("Категории сварщиков:", Object.keys(weldersData));

  let totalCount = 0;
  let activeCount = 0;
  let expiredCount = 0;

  Object.values(weldersData).forEach((welders) => {
    totalCount += welders.length;
    welders.forEach((welder) => {
      try {
        const validUntil = new Date(
          welder.validUntil.split("-").reverse().join("-")
        );
        const today = new Date();
        if (validUntil > today) {
          activeCount++;
        } else {
          expiredCount++;
        }
      } catch (error) {
        console.warn(
          "Ошибка обработки даты для сварщика:",
          welder.fio,
          welder.validUntil,
          error
        );
      }
    });
  });

  console.log("Статистика сварщиков:", {
    total: totalCount,
    active: activeCount,
    expired: expiredCount,
  });

  // Обновляем элементы DOM с проверкой существования
  const elements = {
    "welders-total-count": totalCount,
    "welders-active-count": activeCount,
    "welders-expired-count": expiredCount,
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
      console.log(`Обновлен элемент ${id}: ${value}`);
    } else {
      console.warn(`Элемент ${id} не найден в DOM`);
    }
  });
}

// Статистика специалистов
function updateSpecialistsStats() {
  console.log("Обновление статистики специалистов");
  console.log("Категории специалистов:", Object.keys(specialistsData));

  let totalCount = 0;
  let level3Count = 0;
  let expiredSpecialistsCount = 0;

  Object.values(specialistsData).forEach((specialists) => {
    totalCount += specialists.length;
    specialists.forEach((specialist, index) => {
      if (specialist.group === "III уровень") {
        level3Count++;
      }

      // Подсчет просроченных специалистов
      if (specialist.validUntil) {
        try {
          const validUntil = new Date(
            specialist.validUntil.split("-").reverse().join("-")
          );
          const today = new Date();
          if (validUntil < today) {
            expiredSpecialistsCount++;
          }
        } catch (error) {
          console.warn(
            "Ошибка обработки даты для специалиста:",
            specialist,
            error
          );
        }
      }
    });
  });

  console.log("Статистика специалистов:", {
    total: totalCount,
    level3: level3Count,
    expired: expiredSpecialistsCount,
  });

  // Обновляем элементы DOM с проверкой существования
  const elements = {
    "specialists-total-count": totalCount,
    "specialists-level3-count": level3Count,
    "specialists-expired-count": expiredSpecialistsCount,
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
      console.log(`Обновлен элемент ${id}: ${value}`);
    } else {
      console.warn(`Элемент ${id} не найден в DOM`);
    }
  });
}

// Статистика техпроцессов
function updateTechprocessStats() {
  console.log("Обновление статистики техпроцессов");
  console.log("Категории техпроцессов:", Object.keys(techprocessData));

  let totalCount = 0;
  let expiredTechprocessCount = 0;

  Object.values(techprocessData).forEach((processes) => {
    totalCount += processes.length;
    processes.forEach((process) => {
      // Подсчет просроченных техпроцессов
      if (process.validUntil) {
        try {
          const validUntil = new Date(
            process.validUntil.split("-").reverse().join("-")
          );
          const today = new Date();
          if (validUntil < today) {
            expiredTechprocessCount++;
          }
        } catch (error) {
          console.warn(
            "Ошибка обработки даты для техпроцесса:",
            process,
            error
          );
        }
      }
    });
  });

  console.log("Статистика техпроцессов:", {
    total: totalCount,
    expired: expiredTechprocessCount,
  });

  // Обновляем элементы DOM с проверкой существования
  const elements = {
    "techprocess-total-count": totalCount,
    "techprocess-expired-count": expiredTechprocessCount,
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
      console.log(`Обновлен элемент ${id}: ${value}`);
    } else {
      console.warn(`Элемент ${id} не найден в DOM`);
    }
  });
}

// Делаем все функции глобально доступными
if (typeof window !== "undefined") {
  window.updateStats = updateStats;
  window.loadData = loadData;
  window.selectDataType = selectDataType;
  window.showSection = showSection;
  window.saveData = saveData;
  window.testFunction = testFunction;
  window.loadAllData = loadAllData;
  window.filterWireRecords = filterWireRecords;
  window.filterWeldersRecords = filterWeldersRecords;
  window.filterSpecialistsRecords = filterSpecialistsRecords;
  window.filterTechprocessRecords = filterTechprocessRecords;
  window.loadTable = loadTable;
  window.loadWireTable = loadWireTable;
  window.loadWeldersTable = loadWeldersTable;
  window.loadSpecialistsTable = loadSpecialistsTable;
  window.loadTechprocessTable = loadTechprocessTable;
  window.editRecord = editRecord;
  window.deleteRecord = deleteRecord;
  window.editWelder = editWelder;
  window.deleteWelder = deleteWelder;
  window.editSpecialist = editSpecialist;
  window.deleteSpecialist = deleteSpecialist;
  window.editTechprocess = editTechprocess;
  window.deleteTechprocess = deleteTechprocess;
  window.importData = importData;
  window.importAllData = importAllData;
  window.exportData = exportData;
  window.exportAllData = exportAllData;
  window.createBackup = createBackup;
  window.getWelderCategoryName = getWelderCategoryName;
  window.getTechprocessCategoryName = getTechprocessCategoryName;
  window.getMethodDisplay = getMethodDisplay;
  window.updateWireStats = updateWireStats;
  window.updateWeldersStats = updateWeldersStats;
  window.updateSpecialistsStats = updateSpecialistsStats;
  window.updateTechprocessStats = updateTechprocessStats;
}
