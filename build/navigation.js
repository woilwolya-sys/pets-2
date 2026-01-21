// navigation.js - ОБНОВЛЕННЫЙ ДЛЯ РАБОТЫ С API
document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ Navigation module loaded');
    
    // Проверяем авторизацию и защищаем маршруты
    checkAuthAndProtectRoutes();
    
    // Настраиваем навигацию
    setupNavigation();
    
    // Добавляем обработчик для кнопки выхода
    setupLogoutHandler();
});

// 🔧 ПРОВЕРКА АВТОРИЗАЦИИ И ЗАЩИТА МАРШРУТОВ
function checkAuthAndProtectRoutes() {
    const currentPage = window.location.pathname.split('/').pop();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    console.log(`📄 Current page: ${currentPage}`);
    console.log(`🔑 Auth status: ${token ? 'Authenticated' : 'Not authenticated'}`);
    
    // Страницы, доступные только для авторизованных пользователей
    const protectedPages = ['dashboard.html', 'add-pet.html', 'edit-pet.html', 'pet-profile.html'];
    
    // Страницы, недоступные для авторизованных пользователей
    const publicOnlyPages = ['login.html', 'register.html'];
    
    // Если пользователь не авторизован и пытается попасть на защищенную страницу
    if (!token && protectedPages.includes(currentPage)) {
        console.log('🚫 Access denied to protected page, redirecting to login...');
        showAccessMessage('Для доступа к этой странице необходимо войти в систему');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // Если пользователь авторизован и пытается попасть на публичную страницу
    if (token && publicOnlyPages.includes(currentPage)) {
        console.log('🚫 Authenticated user on public page, redirecting to dashboard...');
        showAccessMessage('Вы уже авторизованы');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return;
    }
    
    // Проверяем, что редактируемый питомец принадлежит пользователю
    if (currentPage === 'edit-pet.html') {
        checkEditPermissions();
    }
}

// 🔧 ПРОВЕРКА ПРАВ НА РЕДАКТИРОВАНИЕ
async function checkEditPermissions() {
    const urlParams = new URLSearchParams(window.location.search);
    const animalId = urlParams.get('id');
    
    if (!animalId) {
        showAccessMessage('ID питомца не указан');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        showAccessMessage('Необходимо войти в систему');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    try {
        // Проверяем, принадлежит ли питомец пользователю
        const response = await api.getAnimal(animalId);
        
        if (!response.success || response.animal.ownerId !== user.id) {
            throw new Error('Доступ запрещен');
        }
        
    } catch (error) {
        console.error('❌ Edit permission check failed:', error);
        showAccessMessage('У вас нет прав для редактирования этого питомца');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
    }
}

// 🔧 НАСТРОЙКА НАВИГАЦИИ
function setupNavigation() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const currentPage = window.location.pathname.split('/').pop();
    
    updateNavigation(!!user);
    highlightActiveLink(currentPage);
}

// 🔧 ОБНОВЛЕНИЕ НАВИГАЦИОННОЙ ПАНЕЛИ
function updateNavigation(isAuthenticated) {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (isAuthenticated) {
        // Для авторизованных пользователей
        navLinks.innerHTML = `
            <a href="dashboard.html" class="${isActive('dashboard.html', currentPage)}">
                <i class="fas fa-tachometer-alt"></i> Личный кабинет
            </a>
            <a href="add-pet.html" class="${isActive('add-pet.html', currentPage)}">
                <i class="fas fa-plus-circle"></i> Добавить питомца
            </a>
            <button class="btn-logout">
                <i class="fas fa-sign-out-alt"></i> Выйти
            </button>
        `;
    } else {
        // Для неавторизованных пользователей
        navLinks.innerHTML = `
            <a href="index.html" class="${isActive('index.html', currentPage)}">
                <i class="fas fa-home"></i> Главная
            </a>
            <a href="login.html" class="${isActive('login.html', currentPage)}">
                <i class="fas fa-sign-in-alt"></i> Вход
            </a>
            <a href="register.html" class="${isActive('register.html', currentPage)}">
                <i class="fas fa-user-plus"></i> Регистрация
            </a>
        `;
    }
    
    // Добавляем обработчики для новых элементов
    setupLogoutHandler();
}

// 🔧 ПОДСВЕТКА АКТИВНОЙ ССЫЛКИ
function highlightActiveLink(currentPage) {
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (href === 'index.html' && currentPage === '')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// 🔧 ПРОВЕРКА АКТИВНОЙ СТРАНИЦЫ
function isActive(page, currentPage) {
    return page === currentPage ? 'active' : '';
}

// 🔧 НАСТРОЙКА ОБРАБОТЧИКА ВЫХОДА
function setupLogoutHandler() {
    const logoutButtons = document.querySelectorAll('.btn-logout');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Вы уверены, что хотите выйти?')) {
                console.log('👋 User logging out...');
                api.logout();
            }
        });
    });
}

// 🔧 ПОКАЗ СООБЩЕНИЯ О ДОСТУПЕ
function showAccessMessage(message) {
    const accessMessage = document.createElement('div');
    accessMessage.className = 'access-message';
    accessMessage.innerHTML = `
        <div class="access-message-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Стили для сообщения
    const style = document.createElement('style');
    style.textContent = `
        .access-message {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(15, 10, 32, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            z-index: 10000;
            box-shadow: var(--shadow-xl);
            animation: fadeIn 0.3s ease;
        }
        .access-message-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .access-message-content i {
            font-size: 4rem;
            color: var(--lavender);
        }
        .access-message-content span {
            color: var(--text-primary);
            font-size: 1.2rem;
            font-weight: 500;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(accessMessage);
    
    // Удаляем сообщение через 3 секунды
    setTimeout(() => {
        if (accessMessage.parentNode) {
            accessMessage.parentNode.removeChild(accessMessage);
        }
        style.remove();
    }, 3000);
}