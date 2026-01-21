# UML Диаграммы приложения Registry

## Обзор

Данный каталог содержит UML диаграммы, описывающие архитектуру веб-приложения для управления данными (сварщики, специалисты, техпроцессы, проволока).

## Список диаграмм

### 1. Class Diagram (`class-diagram.puml`)
**Описание:** Диаграмма классов, показывающая структуру всех модулей приложения и их взаимосвязи.

**Ключевые компоненты:**
- `CommonUtils` - общие утилиты
- `SectionManager` - управление секциями
- `WireManager` - модуль проволоки
- `WeldersManager` - модуль сварщиков
- `SpecialistsManager` - модуль специалистов
- `TechprocessManager` - модуль техпроцессов
- `FileServer` - серверные операции
- `BackupManager` - резервное копирование
- `Application` - главный модуль
- `AdminManager` - администрирование

### 2. Component Diagram (`component-diagram.puml`)
**Описание:** Компонентная диаграмма, показывающая структуру приложения и зависимости между компонентами.

**Слои:**
- Frontend (HTML/CSS)
- JavaScript Modules
- Data Storage (localStorage, data_json)

### 3. Sequence Diagram - Initialization (`initialization-sequence.puml`)
**Описание:** Диаграмма последовательности процесса инициализации приложения.

**Основные шаги:**
1. Событие DOMContentLoaded
2. Инициализация базовых модулей
3. Инициализация модулей данных
4. Инициализация серверных модулей
5. Проверка доступности файлов
6. Инициализация тестовых данных

### 4. Sequence Diagram - Wire Search (`wire-search-sequence.puml`)
**Описание:** Диаграмма последовательности операции поиска проволоки.

**Основные шаги:**
1. Выбор параметров поиска (категория, метод, диаметр)
2. Нажатие кнопки "Поиск"
3. Загрузка данных с сервера
4. Фильтрация данных
5. Отображение результатов

## Просмотр диаграмм

### Онлайн-редакторы PlantUML:

1. **PlantUML Web Server:**
   - Перейдите на: https://www.plantuml.com/plantuml/
   - Скопируйте содержимое файла .puml
   - Вставьте в редактор

2. **GitHub с расширением:**
   - Установите расширение "PlantUML" для VS Code
   - Откройте файл .puml в редакторе
   - Используйте превью (Ctrl+Shift+V)

3. **Offline с VS Code:**
   ```bash
   # Установка расширения
   code --install-extension jebbs.plantuml

   # Просмотр
   # Откройте файл .puml и используйте Ctrl+Shift+P
   # Команда: Plantuml: Preview Current File
   ```

### Локальная установка PlantUML:

```bash
# Через npm
npm install -g plantuml

# Запуск
plantuml uml/class-diagram.puml

# Или через Docker
docker run --rm -v $(pwd):/data plantuml/plantuml uml/class-diagram.puml
```

## Генерация изображений

Для генерации PNG изображений из диаграмм:

```bash
# Linux/Mac
for file in uml/*.puml; do
    plantuml -o images/ "$file"
done

# Windows (PowerShell)
foreach ($file in Get-ChildItem uml\*.puml) {
    plantuml -o images\ $file.FullName
}
```

## Зависимости модулей

```
Application
├── CommonUtils (общие утилиты)
├── SectionManager (управление секциями)
├── AdminManager (администрирование)
├── WireManager (проволока)
├── WeldersManager (сварщики)
├── SpecialistsManager (специалисты)
├── TechprocessManager (техпроцессы)
├── FileServer (файловые операции)
└── BackupManager (резервное копирование)
```

## Архитектура данных

```
┌─────────────────────────────────────────┐
│           Application                   │
├─────────────────────────────────────────┤
│  - Инициализация всех модулей            │
│  - Координация работы модулей             │
│  - Глобальная навигация                 │
├─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Common     │ │ Data Modules│ │   Services  │
├─────────────┤ ├─────────────┤ ├─────────────┤
│- showNotify │ │- WireManager│ │- FileServer │
│- getDate    │ │- WeldersMgr │ │- BackupMgr  │
│- download   │ │- Specialists│ │             │
│- SectionMgr │ │- TechProc   │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │     FileServer      │
         ├─────────────────────┤
         │- localStorage       │
         │- data_json files    │
         └─────────────────────┘
```

## Связь с кодом

Диаграммы соответствуют файлам в `js/modules/`:
- `class-diagram.puml` → Все файлы в `js/modules/`
- `component-diagram.puml` → Структура проекта
- `initialization-sequence.puml` → `js/modules/app.js`
- `wire-search-sequence.puml` → `js/modules/wire.js`