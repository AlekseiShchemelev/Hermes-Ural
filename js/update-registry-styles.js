// Скрипт для обновления всех реестров
const fs = require("fs");
const path = require("path");

// Шаблон для всех реестров
const getRegistryTemplate = (registryName, title, icon) => `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Hermes-Ural</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/admin.css">
    <link rel="stylesheet" href="../css/registry-common.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="registry-container">
    <div class="admin-container">
        <div class="admin-sidebar">
            <div class="sidebar-header">
                <h2><i class="${icon}"></i> ${registryName}</h2>
            </div>
            <div class="sidebar-nav">
                <button class="nav-btn active" onclick="showSection('select')">
                    <i class="fas fa-search"></i> Поиск
                </button>
                <button class="nav-btn" onclick="showSection('results')">
                    <i class="fas fa-table"></i> Результаты
                </button>
            </div>
        </div>
        
        <div class="admin-main">
            <div class="admin-header">
                <div class="header-left">
                    <h1><i class="${icon}"></i> ${title}</h1>
                </div>
                <div class="header-actions">
                    <button onclick="window.location.href='../index.html'" class="action-btn back-btn">
                        <i class="fas fa-arrow-left"></i> На главную
                    </button>
                </div>
            </div>
            
            <div class="admin-content">
                <!-- Экран выбора (будет заполнен индивидуально) -->
                <div id="select-section" class="selection-card">
                    <!-- Индивидуальный контент для каждого реестра -->
                </div>
                
                <!-- Экран результатов -->
                <div id="results-section" class="hidden">
                    <div class="table-container">
                        <div class="table-header">
                            <h2><i class="fas fa-table"></i> Результаты</h2>
                            <button id="backToSelectBtn" class="btn-secondary">
                                <i class="fas fa-arrow-left"></i> Назад к выбору
                            </button>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="registry-table">
                                <thead id="tableHeader">
                                    <!-- Заголовки таблицы -->
                                </thead>
                                <tbody id="tableBody"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="../js/registry-common.js"></script>
    <script src="app.js"></script>
</body>
</html>
`;

// Конфигурация реестров
const registries = [
  {
    name: "resWire",
    title: "Реестр сварочной проволоки",
    icon: "fas fa-coil",
  },
  {
    name: "resWeld",
    title: "Реестр сварщиков",
    icon: "fas fa-user-hard-hat",
  },
  {
    name: "resSpec",
    title: "Реестр специалистов",
    icon: "fas fa-user-tie",
  },
  {
    name: "resTP",
    title: "Реестр технологии сварки",
    icon: "fas fa-cogs",
  },
];

// Обновление файлов
registries.forEach((registry) => {
  const indexPath = path.join(__dirname, registry.name, "index.html");

  if (fs.existsSync(indexPath)) {
    console.log(`Обновляю: ${registry.name}`);
    fs.writeFileSync(
      indexPath,
      getRegistryTemplate(
        registry.name.replace("res", ""),
        registry.title,
        registry.icon
      )
    );
  }
});

console.log("Обновление завершено!");
