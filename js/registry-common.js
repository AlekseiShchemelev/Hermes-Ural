// registry-common.js - Общие функции для всех реестров
// Обновлен для работы с модульной архитектурой

(function (global) {
  "use strict";

  /**
   * Модуль общих функций и утилит
   */
  const RegistryCommon = {
    /**
     * Утилиты для уведомлений
     */
    showNotification(message, type = "info") {
      console.log(`[${type.toUpperCase()}] ${message}`);

      const notification = document.createElement("div");
      notification.className = `notification ${type}`;

      const icon =
        type === "success"
          ? "check-circle"
          : type === "error"
          ? "exclamation-circle"
          : type === "warning"
          ? "exclamation-triangle"
          : "info-circle";

      notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateY(-20px)";
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },

    /**
     * Форматирование даты
     */
    formatDate(dateStr) {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[0]}.${parts[1]}.${parts[2]}`;
      }
      return dateStr;
    },

    /**
     * Проверка на истекший срок
     */
    isExpired(dateStr) {
      if (!dateStr) return false;
      try {
        const date = new Date(dateStr.split("-").reverse().join("-"));
        return date < new Date();
      } catch (e) {
        return false;
      }
    },

    /**
     * Получение класса уровня
     */
    getLevelClass(level) {
      if (!level) return "";
      if (level.includes("III") || level.includes("3")) return "level-high";
      if (level.includes("II") || level.includes("2")) return "level-medium";
      if (level.includes("I") || level.includes("1")) return "level-low";
      return "";
    },

    /**
     * Инициализация кнопок
     */
    initButtons() {
      document
        .querySelectorAll(".btn-primary, .btn-secondary")
        .forEach((btn) => {
          btn.addEventListener("mouseenter", () => {
            btn.style.transform = "translateY(-2px)";
          });

          btn.addEventListener("mouseleave", () => {
            btn.style.transform = "translateY(0)";
          });
        });

      document.querySelectorAll("select").forEach((select) => {
        select.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            const confirmBtn =
              document.getElementById("confirmBtn") ||
              document.getElementById("searchBtn");
            if (confirmBtn) confirmBtn.click();
          }
        });
      });
    },

    /**
     * Инициализация таблиц с кликабельными строками
     */
    initClickableRows() {
      document.querySelectorAll(".clickable-row").forEach((row) => {
        if (!row.hasAttribute("data-initialized")) {
          row.setAttribute("data-initialized", "true");
          row.addEventListener("click", function () {
            const imageRow = this.nextElementSibling;
            if (imageRow && imageRow.classList.contains("image-row")) {
              const isHidden = imageRow.classList.contains("hidden");

              // Закрываем все открытые строки
              if (isHidden) {
                document
                  .querySelectorAll(".image-row:not(.hidden)")
                  .forEach((openRow) => {
                    openRow.classList.add("hidden");
                  });
              }

              imageRow.classList.toggle("hidden");

              // Анимация
              if (!isHidden) {
                imageRow.style.opacity = "0";
                setTimeout(() => {
                  imageRow.style.opacity = "1";
                }, 10);
              }
            }
          });
        }
      });
    },

    /**
     * Показать/скрыть секции
     * Обновлено для работы с модульной архитектурой
     */
    showSection(sectionName) {
      console.log(
        `RegistryCommon: showSection вызвана с параметром: ${sectionName}`
      );

      ["select-section", "results-section"].forEach((section) => {
        const el = document.getElementById(section);
        if (el) el.classList.add("hidden");
      });

      const targetSection = document.getElementById(`${sectionName}-section`);
      if (targetSection) {
        targetSection.classList.remove("hidden");
      }

      // Обновляем активную кнопку в сайдбаре
      document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.classList.remove("active");
      });
      const activeBtn = document.querySelector(`[onclick*="${sectionName}"]`);
      if (activeBtn) {
        activeBtn.classList.add("active");
      }

      // Вызываем соответствующий модуль если он доступен
      this._callModuleMethod(sectionName);
    },

    /**
     * Вызов метода соответствующего модуля
     */
    _callModuleMethod(sectionName) {
      try {
        switch (sectionName) {
          case "wire":
            if (
              window.WireManager &&
              typeof window.WireManager.init === "function"
            ) {
              window.WireManager.init();
            }
            break;
          case "welders":
            if (
              window.WeldersManager &&
              typeof window.WeldersManager.init === "function"
            ) {
              window.WeldersManager.init();
            }
            break;
          case "specialists":
            if (
              window.SpecialistsManager &&
              typeof window.SpecialistsManager.init === "function"
            ) {
              window.SpecialistsManager.init();
            }
            break;
          case "techprocess":
            if (
              window.TechprocessManager &&
              typeof window.TechprocessManager.init === "function"
            ) {
              window.TechprocessManager.init();
            }
            break;
          case "admin":
            if (
              window.AdminManager &&
              typeof window.AdminManager.init === "function"
            ) {
              window.AdminManager.init();
            }
            break;
          default:
            console.log(`RegistryCommon: Неизвестная секция ${sectionName}`);
        }
      } catch (error) {
        console.error(
          `RegistryCommon: Ошибка вызова модуля для секции ${sectionName}:`,
          error
        );
      }
    },

    /**
     * Создание загрузочного спиннера
     */
    createSpinner() {
      const spinner = document.createElement("div");
      spinner.className = "loading-spinner";
      return spinner;
    },

    /**
     * Инициализация модуля
     */
    init() {
      console.log("RegistryCommon: Инициализация модуля");
      this.initButtons();
      this.initClickableRows();

      // Добавляем обработчики для навигации в сайдбаре
      document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          document
            .querySelectorAll(".nav-btn")
            .forEach((b) => b.classList.remove("active"));
          this.classList.add("active");
        });
      });
    },

    /**
     * Получение текущей активной секции
     */
    getCurrentSection() {
      const sections = ["select", "results"];
      for (const section of sections) {
        const el = document.getElementById(`${section}-section`);
        if (el && !el.classList.contains("hidden")) {
          return section;
        }
      }
      return null;
    },

    /**
     * Проверка доступности модуля
     */
    isModuleAvailable(moduleName) {
      const moduleMap = {
        wire: () => window.WireManager,
        welders: () => window.WeldersManager,
        specialists: () => window.SpecialistsManager,
        techprocess: () => window.TechprocessManager,
        admin: () => window.AdminManager,
      };

      const moduleGetter = moduleMap[moduleName];
      return moduleGetter ? typeof moduleGetter() !== "undefined" : false;
    },
  };

  // Экспортируем модуль глобально
  global.registryCommon = RegistryCommon;

  // Автоматическая инициализация при загрузке
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      RegistryCommon.init();
    });
  } else {
    RegistryCommon.init();
  }

  // Функция для перехода на главную (обновлена)
  global.goToMain = function () {
    window.location.href = "../index.html";
  };
})(window);
