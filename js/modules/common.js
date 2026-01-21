/**
 * Общие утилиты и вспомогательные функции
 */
export const CommonUtils = {
  /**
   * Показать уведомление пользователю
   * @param {string} message - Текст сообщения
   * @param {string} type - Тип уведомления (info, success, warning, error)
   */
  showNotification(message, type = "info") {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Автоматически удаляем через 3 секунды
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  },

  /**
   * Получение текущей даты в формате YYYY-MM-DD
   */
  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * Создание и скачивание JSON файла
   * @param {object} jsonString - JSON данные
   * @param {string} filename - Имя файла
   */
  downloadJSONFile(jsonString, filename) {
    const dataStr = JSON.stringify(jsonString, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Создание коммита изменений
   * @param {string} dataType - Тип данных
   */
  commitChanges(dataType) {
    const timestamp = new Date().toISOString();
    const commitMessage = `Обновление данных ${dataType || "всех типов"} - ${timestamp}`;
    console.log(`Коммит: ${commitMessage}`);
    return commitMessage;
  }
};

/**
 * Константы для типов данных
 */
export const DATA_TYPES = {
  WIRE: 'wire',
  WELDERS: 'welders', 
  SPECIALISTS: 'specialists',
  TECHPROCESS: 'techprocess'
};

/**
 * Модуль для работы с секциями интерфейса
 */
export const SectionManager = {
  /**
   * Переключение между секциями
   * @param {string} sectionName - Название секции
   */
  showSection(sectionName) {
    console.log(`showSection вызвана с параметром: ${sectionName}`);

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
      const currentDataType = window.currentDataType;
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
          window.AdminManager?.loadTable();
        } else if (sectionName === "overview") {
          window.AdminManager?.updateStats();
        }
      }
    }
  }
};