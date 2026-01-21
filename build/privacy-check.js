// Проверка принятия политики конфиденциальности
document.addEventListener('DOMContentLoaded', function() {
    const privacyAccepted = localStorage.getItem('privacyAccepted');
    const currentPage = window.location.pathname.split('/').pop();
    
    // Проверяем только для страниц, требующих согласия
    if (['register.html', 'add-pet.html'].includes(currentPage)) {
        if (!privacyAccepted && !currentPage.includes('privacy.html')) {
            // Показываем модальное окно с требованием принять политику
            showPrivacyModal();
        }
    }
});

function showPrivacyModal() {
    const modalHTML = `
        <div id="privacyModal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <div class="modal-icon info">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3>Политика конфиденциальности</h3>
                </div>
                
                <div class="modal-body">
                    <p>Для использования сервиса <strong>ЧипТрекер</strong> необходимо принять нашу политику конфиденциальности.</p>
                    
                    <div class="privacy-highlights">
                        <div class="highlight-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Мы защищаем данные о вас и ваших питомцах</span>
                        </div>
                        <div class="highlight-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Не передаем данные третьим лицам без согласия</span>
                        </div>
                        <div class="highlight-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Используем современные методы шифрования</span>
                        </div>
                    </div>
                    
                    <div class="privacy-actions">
                        <button class="btn btn-secondary" id="viewPrivacy">
                            <i class="fas fa-file-alt"></i> Подробнее
                        </button>
                        <button class="btn btn-primary" id="acceptAndContinue">
                            <i class="fas fa-check"></i> Принять и продолжить
                        </button>
                    </div>
                    
                    <p class="privacy-note">
                        <small>Нажимая "Принять и продолжить", вы соглашаетесь с 
                        <a href="terms.html" target="_blank">условиями использования</a> и 
                        <a href="privacy.html" target="_blank">политикой конфиденциальности</a>.</small>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Стили для модального окна
    const styles = `
        .privacy-highlights {
            margin: 20px 0;
        }
        
        .highlight-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: var(--text-secondary);
        }
        
        .highlight-item i {
            color: var(--success);
        }
        
        .privacy-actions {
            display: flex;
            gap: 15px;
            margin: 25px 0;
        }
        
        .privacy-note {
            text-align: center;
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-top: 20px;
        }
    `;
    
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
    
    // Обработчики событий
    const modal = document.getElementById('privacyModal');
    modal.style.display = 'flex';
    
    document.getElementById('viewPrivacy').addEventListener('click', function() {
        window.open('privacy.html', '_blank');
    });
    
    document.getElementById('acceptAndContinue').addEventListener('click', function() {
        localStorage.setItem('privacyAccepted', 'true');
        modal.style.display = 'none';
    });
    
    // Закрытие по клику вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            // Не даем закрыть, пока не принята политика
            showNotification('Для продолжения необходимо принять политику конфиденциальности');
        }
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification warning';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(245, 158, 11, 0.2);
        border: 1px solid rgba(245, 158, 11, 0.3);
        color: var(--warning);
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}