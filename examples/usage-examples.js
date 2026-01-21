// Примеры использования модульной архитектуры Hermes-Ural
// Данный файл показывает, как использовать новые модули в различных сценариях

// ============================================================================
// 1. БАЗОВЫЕ МОДУЛИ - Общие утилиты и функции
// ============================================================================

// Пример 1.1: Использование CommonUtils для уведомлений
import { CommonUtils, DATA_TYPES } from './js/modules/common.js';

// Показать уведомление
CommonUtils.showNotification('Данные успешно сохранены', 'success');
CommonUtils.showNotification('Произошла ошибка', 'error');
CommonUtils.showNotification('Внимание! Проверьте данные', 'warning');
CommonUtils.showNotification('Информационное сообщение', 'info');

// Получить текущую дату
const currentDate = CommonUtils.getCurrentDate();
console.log('Сегодня:', currentDate);

// Создать коммит изменений
const commitMessage = CommonUtils.commitChanges(DATA_TYPES.WIRE);
console.log('Коммит:', commitMessage);

// Скачать JSON файл
const dataToDownload = { records: [1, 2, 3], timestamp: new Date().toISOString() };
CommonUtils.downloadJSONFile(dataToDownload, 'export_data.json');

// ============================================================================
// 2. МОДУЛЬ АДМИНИСТРИРОВАНИЯ - Управление данными
// ============================================================================

// Пример 2.1: Инициализация и загрузка данных
import { AdminManager } from './js/modules/admin.js';

// Инициализация админ модуля
AdminManager.init();

// Загрузка данных
async function loadAllApplicationData() {
    try {
        await AdminManager.loadData();
        console.log('Данные загружены успешно');
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
}

// Выбор типа данных
AdminManager.selectDataType(DATA_TYPES.WIRE);

// Загрузка конкретной таблицы
AdminManager.loadWireTable();
AdminManager.loadWeldersTable();
AdminManager.loadSpecialistsTable();
AdminManager.loadTechprocessTable();

// Обновление статистики
AdminManager.updateStats();

// Пример 2.2: Управление записями
// Редактирование записи
AdminManager.editRecord('123', DATA_TYPES.WIRE);

// Удаление записи
AdminManager.deleteRecord('123', DATA_TYPES.WIRE);

// Сохранение данных
AdminManager.saveData(DATA_TYPES.WIRE);
AdminManager.saveData(); // Сохранить все данные

// Создание резервной копии
AdminManager.createBackup();

// Экспорт данных
AdminManager.exportAllData();
AdminManager.exportData(DATA_TYPES.WIRE);

// ============================================================================
// 3. МОДУЛИ ДАННЫХ - Работа с конкретными типами данных
// ============================================================================

// Пример 3.1: Модуль работы с проволокой
import { WireManager } from './js/modules/wire.js';

// Инициализация модуля проволоки
WireManager.init();

// Поиск с фильтрами
function searchWire() {
    WireManager.performSearch();
    
    // Получение текущих фильтров
    const filters = WireManager.getCurrentFilters();
    console.log('Активные фильтры:', filters);
    
    // Получение результатов
    const results = WireManager.getFilteredData();
    console.log('Найдено записей:', results.length);
}

// Сброс фильтров
function resetWireFilters() {
    WireManager.resetFilters();
}

// Генерация PDF отчета
function generateWireReport() {
    WireManager.generatePDF();
}

// Пример 3.2: Модуль работы со сварщиками
import { WeldersManager } from './js/modules/welders.js';

// Инициализация
WeldersManager.init();

// Поиск сварщиков
function searchWelders() {
    WeldersManager.performSearch();
}

// Редактирование сварщика
function editWelderRecord(fio, category, index = null) {
    WeldersManager.editWelder(fio, category, index);
}

// Удаление сварщика
function deleteWelderRecord(fio, category, index = null) {
    WeldersManager.deleteWelder(fio, category, index);
}

// Пример 3.3: Модуль работы со специалистами
import { SpecialistsManager } from './js/modules/specialists.js';

// Инициализация
SpecialistsManager.init();

// Поиск специалистов
function searchSpecialists() {
    SpecialistsManager.performSearch();
}

// Редактирование специалиста
function editSpecialistRecord(fio, index) {
    SpecialistsManager.editSpecialist(fio, index);
}

// Удаление специалиста
function deleteSpecialistRecord(fio, index) {
    SpecialistsManager.deleteSpecialist(fio, index);
}

// Обновление статистики специалистов
function updateSpecialistsStatistics() {
    SpecialistsManager.updateSpecialistsStats();
}

// Пример 3.4: Модуль работы с техпроцессами
import { TechprocessManager } from './js/modules/techprocess.js';

// Инициализация
TechprocessManager.init();

// Поиск техпроцессов
function searchTechprocesses() {
    TechprocessManager.performSearch();
}

// Редактирование техпроцесса
function editTechprocessRecord(category, index = null) {
    TechprocessManager.editTechprocess(category, index);
}

// Удаление техпроцесса
function deleteTechprocessRecord(category, index = null) {
    TechprocessManager.deleteTechprocess(category, index);
}

// Фильтрация техпроцессов
function filterTechprocessRecords() {
    TechprocessManager.filterTechprocessRecords();
}

// Получение доступных категорий
const categories = TechprocessManager.getAvailableCategories();
console.log('Доступные категории:', categories);

// ============================================================================
// 4. СЕРВЕРНЫЕ МОДУЛИ - Работа с файлами и резервными копиями
// ============================================================================

// Пример 4.1: Файловый сервер
import { FileServer, fileServer } from './js/modules/file-server.js';

// Создание экземпляра файлового сервера
const server = new FileServer();

// Сохранение JSON файла
async function saveDataFile() {
    try {
        const data = { type: 'wire', records: [] };
        await server.saveJSONFile('data/wire.json', data);
        console.log('Файл сохранен');
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

// Загрузка JSON файла
async function loadDataFile() {
    try {
        const data = await server.loadJSONFile('data/wire.json');
        console.log('Загруженные данные:', data);
        return data;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
}

// Удаление файла
async function deleteDataFile() {
    try {
        await server.deleteFile('data/wire.json');
        console.log('Файл удален');
    } catch (error) {
        console.error('Ошибка удаления:', error);
    }
}

// Получение списка файлов
async function listDataFiles() {
    try {
        const files = await server.listFiles('data');
        console.log('Найденные файлы:', files);
        return files;
    } catch (error) {
        console.error('Ошибка получения списка:', error);
    }
}

// Создание полного бэкапа
async function createFullBackup() {
    try {
        const backup = await server.createFullBackup();
        console.log('Бэкап создан:', backup);
        return backup;
    } catch (error) {
        console.error('Ошибка создания бэкапа:', error);
    }
}

// Восстановление из бэкапа
async function restoreFromBackup(backupData) {
    try {
        await server.restoreFromBackup(backupData);
        console.log('Данные восстановлены');
    } catch (error) {
        console.error('Ошибка восстановления:', error);
    }
}

// Пример 4.2: Менеджер резервных копий
import { BackupManager, backupManager } from './js/modules/backup-manager.js';

// Создание резервной копии
async function createApplicationBackup() {
    try {
        const backup = await backupManager.createBackup('Еженедельный бэкап');
        console.log('Резервная копия создана:', backup);
        return backup;
    } catch (error) {
        console.error('Ошибка создания резервной копии:', error);
    }
}

// Восстановление из резервной копии
async function restoreFromBackupId(backupId) {
    try {
        await backupManager.restoreFromBackup(backupId);
        console.log('Восстановление завершено');
    } catch (error) {
        console.error('Ошибка восстановления:', error);
    }
}

// Загрузка бэкапа из файла
async function loadBackupFromFile(file) {
    try {
        await backupManager.loadBackupFromFile(file);
        console.log('Бэкап загружен из файла');
    } catch (error) {
        console.error('Ошибка загрузки бэкапа:', error);
    }
}

// Сохранение бэкапа в файл
function saveBackupToFile(backup) {
    try {
        backupManager.saveBackupToFile(backup);
        console.log('Бэкап сохранен в файл');
    } catch (error) {
        console.error('Ошибка сохранения бэкапа:', error);
    }
}

// Создание коммита
function createApplicationCommit(message) {
    const commit = backupManager.createCommit(message);
    console.log('Коммит создан:', commit);
    return commit;
}

// Получение списка резервных копий
function getBackupList() {
    const backups = backupManager.getBackupList();
    console.log('Список резервных копий:', backups);
    return backups;
}

// Получение истории коммитов
function getCommitHistory() {
    const commits = backupManager.getCommitHistory();
    console.log('История коммитов:', commits);
    return commits;
}

// Подсчет общего количества записей
function getTotalRecordsCount() {
    const count = backupManager.calculateTotalRecords();
    console.log('Общее количество записей:', count);
    return count;
}

// ============================================================================
// 5. ГЛАВНЫЙ МОДУЛЬ ПРИЛОЖЕНИЯ - Координация работы модулей
// ============================================================================

// Пример 5.1: Инициализация приложения
import { Application, app } from './js/modules/app.js';

// Создание экземпляра приложения
const application = new Application();

// Инициализация всего приложения
async function initializeApplication() {
    try {
        await application.init();
        console.log('Приложение инициализировано');
    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
    }
}

// Получение конкретного модуля
function getAdminModule() {
    const adminModule = application.getModule('admin');
    console.log('Модуль администрирования:', adminModule);
    return adminModule;
}

// Получение всех модулей
function getAllApplicationModules() {
    const modules = application.getAllModules();
    console.log('Все модули приложения:', modules);
    return modules;
}

// Перезагрузка модуля
async function reloadWireModule() {
    try {
        await application.reloadModule('wire');
        console.log('Модуль проволоки перезагружен');
    } catch (error) {
        console.error('Ошибка перезагрузки модуля:', error);
    }
}

// ============================================================================
// 6. НАВИГАЦИЯ И СЕКЦИИ
// ============================================================================

// Пример 6.1: Работа с секциями
import { SectionManager } from './js/modules/common.js';

// Переключение между секциями
function switchToWireSection() {
    SectionManager.showSection('wire');
}

function switchToWeldersSection() {
    SectionManager.showSection('welders');
}

function switchToSpecialistsSection() {
    SectionManager.showSection('specialists');
}

function switchToTechprocessSection() {
    SectionManager.showSection('techprocess');
}

function switchToAdminSection() {
    SectionManager.showSection('admin');
}

// ============================================================================
// 7. ПОЛНЫЕ СЦЕНАРИИ ИСПОЛЬЗОВАНИЯ
// ============================================================================

// Пример 7.1: Полный цикл работы с данными проволоки
async function wireDataWorkflow() {
    console.log('=== Начало работы с данными проволоки ===');
    
    // 1. Инициализация
    WireManager.init();
    
    // 2. Навигация к секции проволоки
    SectionManager.showSection('wire');
    
    // 3. Выполнение поиска
    WireManager.performSearch();
    
    // 4. Получение результатов
    const results = WireManager.getFilteredData();
    console.log(`Найдено ${results.length} записей проволоки`);
    
    // 5. Генерация отчета
    WireManager.generatePDF();
    
    // 6. Сохранение изменений
    AdminManager.saveData(DATA_TYPES.WIRE);
    
    // 7. Создание коммита
    backupManager.createCommit('Обновление данных проволоки');
    
    console.log('=== Работа с данными проволоки завершена ===');
}

// Пример 7.2: Полный цикл создания резервной копии
async function backupWorkflow() {
    console.log('=== Создание резервной копии ===');
    
    try {
        // 1. Создание бэкапа
        const backup = await backupManager.createBackup('Автоматический бэкап перед обновлением');
        console.log('Резервная копия создана:', backup.id);
        
        // 2. Сохранение бэкапа в файл
        backupManager.saveBackupToFile(backup);
        
        // 3. Создание коммита
        backupManager.createCommit('Создана резервная копия');
        
        console.log('=== Резервная копия готова ===');
        return backup;
        
    } catch (error) {
        console.error('Ошибка создания резервной копии:', error);
        throw error;
    }
}

// Пример 7.3: Полный цикл восстановления из бэкапа
async function restoreWorkflow(backupId) {
    console.log('=== Восстановление из резервной копии ===');
    
    try {
        // 1. Получение списка бэкапов
        const backups = backupManager.getBackupList();
        const targetBackup = backups.find(b => b.id === backupId);
        
        if (!targetBackup) {
            throw new Error(`Резервная копия ${backupId} не найдена`);
        }
        
        // 2. Восстановление
        await backupManager.restoreFromBackup(backupId);
        
        // 3. Перезагрузка всех модулей
        const modules = ['wire', 'welders', 'specialists', 'techprocess'];
        for (const moduleName of modules) {
            await application.reloadModule(moduleName);
        }
        
        // 4. Создание коммита восстановления
        backupManager.createCommit(`Восстановление из резервной копии: ${targetBackup.description}`);
        
        console.log('=== Восстановление завершено ===');
        
    } catch (error) {
        console.error('Ошибка восстановления:', error);
        throw error;
    }
}

// ============================================================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ
// ============================================================================

// Делаем основные функции глобально доступными для обратной совместимости
window.ModularExamples = {
    // Базовые функции
    showNotification: CommonUtils.showNotification,
    getCurrentDate: CommonUtils.getCurrentDate,
    
    // Админ функции
    loadAllData: () => AdminManager.loadAllData(),
    saveData: (dataType) => AdminManager.saveData(dataType),
    createBackup: () => AdminManager.createBackup(),
    
    // Навигация
    showSection: (sectionName) => SectionManager.showSection(sectionName),
    
    // Поиск по типам данных
    searchWire: searchWire,
    searchWelders: searchWelders,
    searchSpecialists: searchSpecialists,
    searchTechprocesses: searchTechprocesses,
    
    // Резервные копии
    createBackup: createApplicationBackup,
    restoreFromBackup: restoreFromBackupId,
    
    // Полные сценарии
    wireWorkflow: wireDataWorkflow,
    backupWorkflow: backupWorkflow,
    restoreWorkflow: restoreWorkflow
};

console.log('Примеры модульной архитектуры загружены');
console.log('Доступные функции:', Object.keys(window.ModularExamples));