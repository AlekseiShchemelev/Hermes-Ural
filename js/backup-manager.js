// backup-manager.js - Менеджер резервных копий с коммитами
class BackupManager {
  constructor() {
    this.backupHistory = [];
    this.maxBackups = 20;
    this.initializeBackupSystem();
  }

  // Инициализация системы бэкапов
  async initializeBackupSystem() {
    // Загружаем историю бэкапов из localStorage
    const savedHistory = localStorage.getItem("backupHistory");
    if (savedHistory) {
      try {
        this.backupHistory = JSON.parse(savedHistory);
      } catch (e) {
        console.error("Ошибка загрузки истории бэкапов:", e);
        this.backupHistory = [];
      }
    }
  }

  // Создание резервной копии всех данных
  async createBackup(description = "Ручное создание резервной копии") {
    try {
      const backup = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        description,
        version: "1.0",
        data: await this.exportAllDataForBackup(),
      };

      this.backupHistory.unshift(backup);

      // Ограничиваем количество бэкапов
      if (this.backupHistory.length > this.maxBackups) {
        this.backupHistory.pop();
      }

      // Сохраняем историю в localStorage
      localStorage.setItem("backupHistory", JSON.stringify(this.backupHistory));

      // Сохраняем бэкап как отдельный файл
      await this.saveBackupToFile(backup);

      this.showNotification("✅ Резервная копия успешно создана!", "success");
      return backup;
    } catch (error) {
      console.error("Ошибка создания бэкапа:", error);
      this.showNotification("❌ Ошибка создания бэкапа", "error");
      throw error;
    }
  }

  // Экспорт данных для бэкапа
  async exportAllDataForBackup() {
    const data = {
      wireData: {
        MP: await this.loadJSON("data_json/mp/data-wire-mp.json"),
        AF: await this.loadJSON("data_json/af/data-wire-af.json"),
        RAD: await this.loadJSON("data_json/rad/data-wire-rad.json"),
        RD: await this.loadJSON("data_json/rd/data-wire-rd.json"),
      },
      weldersData: {
        MP: await this.loadJSON("data_json/mp/data-welders-mp.json"),
        AF: await this.loadJSON("data_json/af/data-welders-af.json"),
        RAD: await this.loadJSON("data_json/rad/data-welders-rad.json"),
        RD: await this.loadJSON("data_json/rd/data-welders-rd.json"),
      },
      techprocessData: {
        MP: await this.loadJSON("data_json/mp/data-techprocess-mp.json"),
        AF: await this.loadJSON("data_json/af/data-techprocess-af.json"),
        RAD: await this.loadJSON("data_json/rad/data-techprocess-rad.json"),
        RD: await this.loadJSON("data_json/rd/data-techprocess-rd.json"),
      },
      specialistsData: await this.loadJSON("data_json/data-specialists.json"),
      metadata: {
        backupDate: new Date().toISOString(),
        systemVersion: "1.0.0",
        totalRecords: await this.calculateTotalRecords(),
      },
    };

    return data;
  }

  // Загрузка JSON файла
  async loadJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Файл не найден: ${url}`);
        return {};
      }
      return await response.json();
    } catch (error) {
      console.warn(`Ошибка загрузки ${url}:`, error);
      return {};
    }
  }

  // Подсчет общего количества записей
  async calculateTotalRecords() {
    let total = 0;

    const countRecords = (data, key) => {
      if (data && data[key] && Array.isArray(data[key])) {
        return data[key].length;
      }
      return 0;
    };

    const wireMP = await this.loadJSON("data_json/mp/data-wire-mp.json");
    const wireAF = await this.loadJSON("data_json/af/data-wire-af.json");
    const wireRAD = await this.loadJSON("data_json/rad/data-wire-rad.json");
    const wireRD = await this.loadJSON("data_json/rd/data-wire-rd.json");

    total += countRecords(wireMP, "wireDataMP");
    total += countRecords(wireAF, "wireDataAF");
    total += countRecords(wireRAD, "wireDataRAD");
    total += countRecords(wireRD, "wireDataRD");

    return total;
  }

  // Сохранение бэкапа в файл
  async saveBackupToFile(backup) {
    try {
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date(backup.id)
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка сохранения файла бэкапа:", error);
    }
  }

  // Восстановление из бэкапа
  async restoreFromBackup(backupId) {
    try {
      const backup = this.backupHistory.find((b) => b.id === backupId);
      if (!backup) {
        throw new Error("Бэкап не найден");
      }

      // Запрашиваем подтверждение
      if (!confirm("Вы уверены? Это заменит все текущие данные!")) {
        return false;
      }

      // Восстанавливаем все данные
      await this.applyBackupData(backup.data);

      // Создаем коммит восстановления
      await this.createCommit(
        `Восстановление из бэкапа: ${backup.description}`
      );

      this.showNotification("✅ Восстановление выполнено успешно!", "success");
      return true;
    } catch (error) {
      console.error("Ошибка восстановления:", error);
      this.showNotification("❌ Ошибка восстановления", "error");
      throw error;
    }
  }

  // Применение данных из бэкапа
  async applyBackupData(backupData) {
    // Здесь должен быть код для отправки данных на сервер
    // Для демонстрации эмулируем сохранение

    console.log("Применение данных из бэкапа:", backupData);

    // Обновляем данные в памяти (для демонстрации)
    if (window.wireData && Array.isArray(window.wireData)) {
      // Объединяем все данные проволоки из бэкапа
      window.wireData = [];
      if (backupData.wireData) {
        Object.values(backupData.wireData).forEach((data) => {
          if (data.wireDataMP) window.wireData.push(...data.wireDataMP);
          if (data.wireDataAF) window.wireData.push(...data.wireDataAF);
          if (data.wireDataRAD) window.wireData.push(...data.wireDataRAD);
          if (data.wireDataRD) window.wireData.push(...data.wireDataRD);
        });
      }
    }

    // Показываем сообщение о успешном применении
    alert(
      "Данные из бэкапа применены (в реальном приложении они будут сохранены на сервере)"
    );
  }

  // Создание коммита
  async createCommit(message) {
    const commit = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      message,
      author: "Администратор",
      changes: await this.getCurrentChanges(),
    };

    // Сохраняем коммит в localStorage
    const commits = JSON.parse(localStorage.getItem("commits") || "[]");
    commits.unshift(commit);

    // Ограничиваем количество коммитов
    if (commits.length > 50) {
      commits.pop();
    }

    localStorage.setItem("commits", JSON.stringify(commits));

    console.log("Создан коммит:", commit);
    this.showNotification(`✅ Коммит создан: ${message}`, "success");
  }

  // Получение текущих изменений
  async getCurrentChanges() {
    return {
      timestamp: new Date().toISOString(),
      summary: "Изменения через панель администрирования",
    };
  }

  // Загрузка бэкапа из файла
  async loadBackupFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          resolve(backup);
        } catch (error) {
          reject(new Error("Неверный формат файла бэкапа"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Ошибка чтения файла"));
      };

      reader.readAsText(file);
    });
  }

  // Показать уведомление
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `backup-notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
}

// Экспортируем глобально
window.BackupManager = BackupManager;
