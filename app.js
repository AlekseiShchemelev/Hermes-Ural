const confirmBtn = document.getElementById("confirmBtn");
const weldingTypeSelect = document.getElementById("weldingType");

// Основная функция перехода
confirmBtn.addEventListener("click", () => {
  const selected = weldingTypeSelect.value;
  if (!selected) {
    showNotification("Пожалуйста, выберите реестр", "warning");
    return;
  }

  // Добавляем анимацию загрузки
  confirmBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin btn-icon"></i> Загрузка...';
  confirmBtn.disabled = true;

  // Имитация загрузки для лучшего UX
  setTimeout(() => {
    const routes = {
      resWire: "./resWire/index.html",
      resTP: "./resTP/index.html",
      resWeld: "./resWeld/index.html",
      resSpec: "./resSpec/index.html",
      resTechInstructions: "./resTechInstructions/index.html",
      resWeldingEquipment: "./resWeldingEquipment/index.html",
    };

    window.location.href = routes[selected];
  }, 500);
});

// Функция показа уведомлений
function showNotification(message, type = "info") {
  // Создаем элемент уведомления
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <i class="fas fa-${
          type === "warning" ? "exclamation-triangle" : "info-circle"
        }"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

  document.body.appendChild(notification);

  // Автоматическое удаление через 4 секунды
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 4000);
}

// Добавляем обработчик для клавиши Enter
weldingTypeSelect.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    confirmBtn.click();
  }
});
