const screenSelect = document.getElementById("screen-select");
const confirmBtn = document.getElementById("confirmBtn");
const weldingTypeSelect = document.getElementById("weldingType");

// Анимация кнопки
confirmBtn.addEventListener("mouseenter", () => {
  confirmBtn.style.transform = "translateY(-2px)";
});

confirmBtn.addEventListener("mouseleave", () => {
  confirmBtn.style.transform = "translateY(0)";
});

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

// Добавляем стили для уведомлений
const notificationStyles = document.createElement("style");
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        background: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        border-left: 4px solid #3498db;
    }
    
    .notification-warning {
        border-left-color: #f39c12;
    }
    
    .notification i {
        font-size: 18px;
        color: #3498db;
    }
    
    .notification-warning i {
        color: #f39c12;
    }
    
    .notification span {
        flex: 1;
        color: #2c3e50;
        font-size: 14px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: #95a5a6;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: color 0.2s;
    }
    
    .notification-close:hover {
        color: #e74c3c;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @media (max-width: 768px) {
        .notification {
            left: 20px;
            right: 20px;
            max-width: none;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Добавляем обработчик для клавиши Enter
weldingTypeSelect.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    confirmBtn.click();
  }
});
