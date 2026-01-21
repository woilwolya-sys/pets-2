// auth.js - ОБНОВЛЕННЫЙ ДЛЯ РАБОТЫ С API
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔑 Auth module loaded');
    
    // Проверяем подключение к серверу
    checkServerConnection();
    
    // Настраиваем формы, если они есть на странице
    const registrationForm = document.getElementById('userRegistrationForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registrationForm) {
        console.log('📝 Registration form found');
        setupPasswordVisibility();
        setupPasswordStrength();
        registrationForm.addEventListener('submit', handleUserRegistration);
    }
    
    if (loginForm) {
        console.log('🔐 Login form found');
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Проверяем авторизацию
    checkAuthStatus();
    
    // Настраиваем кнопки выхода
    setupLogoutButtons();
});

// 🔧 ПРОВЕРКА ПОДКЛЮЧЕНИЯ К СЕРВЕРУ
async function checkServerConnection() {
    try {
        // Пробуем сделать простой запрос
        await fetch('http://localhost:3000');
        console.log('✅ Server is running');
    } catch (error) {
        console.warn('⚠️ Server is not running or not accessible');
        showServerWarning();
    }
}

// ⚠️ ПРЕДУПРЕЖДЕНИЕ ОТСУТСТВИЯ СЕРВЕРА
function showServerWarning() {
    // Создаем баннер предупреждения
    const warningBanner = document.createElement('div');
    warningBanner.className = 'server-warning';
    warningBanner.innerHTML = `
        <div class="warning-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Сервер не запущен. Запустите бэкенд: <code>node backend.js</code></span>
        </div>
    `;
    
    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
        .server-warning {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 10px 20px;
            text-align: center;
            z-index: 9999;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .warning-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .warning-content i {
            font-size: 1.2rem;
        }
        .warning-content code {
            background: rgba(255,255,255,0.2);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            margin-left: 5px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.insertBefore(warningBanner, document.body.firstChild);
}

// 🔧 ПРОВЕРКА СТАТУСА АВТОРИЗАЦИИ
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.log('👤 User is not authenticated');
        return;
    }
    
    try {
        console.log('🔍 Checking authentication status...');
        const response = await api.getCurrentUser();
        
        if (response.success && response.user) {
            console.log('✅ User is authenticated:', response.user.fullName);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            updateNavigation(true);
            
            // Обновляем приветствие на dashboard
            if (window.location.pathname.includes('dashboard.html')) {
                updateUserGreeting(response.user);
            }
        }
    } catch (error) {
        console.log('❌ Authentication failed:', error.message);
        // Токен недействителен - удаляем его
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        updateNavigation(false);
    }
}

// 📝 РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
async function handleUserRegistration(e) {
    e.preventDefault();
    console.log('🔄 Processing registration...');
    
    // Показываем индикатор загрузки
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
    submitButton.disabled = true;
    
    try {
        // Собираем данные формы
        const formData = {
            fullName: document.getElementById('fullName').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim() || '',
            password: document.getElementById('password').value
        };
        
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsAccepted = document.getElementById('terms')?.checked;
        
        // ВАЛИДАЦИЯ
        const errors = [];
        if (!formData.fullName) errors.push('Введите полное имя');
        if (!formData.phone) errors.push('Введите телефон');
        if (!formData.password) errors.push('Введите пароль');
        if (formData.password.length < 6) errors.push('Пароль должен содержать минимум 6 символов');
        if (formData.password !== confirmPassword) errors.push('Пароли не совпадают');
        if (termsAccepted === false) errors.push('Примите условия использования');
        
        if (errors.length > 0) {
            throw new Error(errors.join('<br>'));
        }
        
        console.log('📨 Sending registration request...');
        
        // Отправляем запрос на регистрацию
        const response = await api.register(formData);
        
        if (response.success) {
            console.log('✅ Registration successful!');
            
            // Сохраняем токен и данные пользователя
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            // Показываем успешное сообщение
            showSuccess('Регистрация прошла успешно! Теперь вы можете добавить своих питомцев.');
            
            // Настраиваем кнопку продолжения
            const continueBtn = document.getElementById('continueToPet');
            if (continueBtn) {
                continueBtn.addEventListener('click', function() {
                    window.location.href = 'add-pet.html';
                });
            }
            
            // Очищаем форму
            document.getElementById('userRegistrationForm').reset();
            
        } else {
            throw new Error(response.error || 'Ошибка регистрации');
        }
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        showError(error.message || 'Произошла ошибка при регистрации. Попробуйте еще раз.');
    } finally {
        // Восстанавливаем кнопку
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// 🔐 ВХОД ПОЛЬЗОВАТЕЛЯ
async function handleLogin(e) {
    e.preventDefault();
    console.log('🔄 Processing login...');
    
    // Показываем индикатор загрузки
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
    submitButton.disabled = true;
    
    try {
        // Собираем данные формы
        const phone = document.getElementById('loginPhone')?.value.trim() || 
                      document.getElementById('phone')?.value.trim();
        const password = document.getElementById('loginPassword')?.value || 
                         document.getElementById('password')?.value;
        
        if (!phone || !password) {
            throw new Error('Введите телефон и пароль');
        }
        
        console.log('📨 Sending login request...');
        
        // Отправляем запрос на вход
        const response = await api.login({ phone, password });
        
        if (response.success) {
            console.log('✅ Login successful!');
            
            // Сохраняем токен и данные пользователя
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            // Показываем успешное сообщение
            showSuccess('Вход выполнен успешно! Перенаправление...');
            
            // Перенаправляем в личный кабинет через 1.5 секунды
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
            // Очищаем форму
            e.target.reset();
            
        } else {
            throw new Error(response.error || 'Ошибка входа');
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showError(error.message || 'Неверный телефон или пароль');
    } finally {
        // Восстанавливаем кнопку
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// 🔧 НАСТРОЙКА КНОПОК ВЫХОДА
function setupLogoutButtons() {
    const logoutButtons = document.querySelectorAll('.btn-logout, #logoutBtn');
    
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

// 🔧 ОБНОВЛЕНИЕ НАВИГАЦИИ
function updateNavigation(isAuthenticated) {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (isAuthenticated) {
        // Для авторизованных пользователей
        navLinks.innerHTML = `
            <a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'active' : ''}">
                <i class="fas fa-tachometer-alt"></i> Личный кабинет
            </a>
            <a href="add-pet.html" class="${currentPage === 'add-pet.html' ? 'active' : ''}">
                <i class="fas fa-plus-circle"></i> Добавить питомца
            </a>
            <button class="btn-logout">
                <i class="fas fa-sign-out-alt"></i> Выйти
            </button>
        `;
        
        // Добавляем обработчик для новой кнопки выхода
        const logoutBtn = navLinks.querySelector('.btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Вы уверены, что хотите выйти?')) {
                    api.logout();
                }
            });
        }
        
    } else {
        // Для неавторизованных пользователей
        navLinks.innerHTML = `
            <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">
                <i class="fas fa-home"></i> Главная
            </a>
            <a href="login.html" class="${currentPage === 'login.html' ? 'active' : ''}">
                <i class="fas fa-sign-in-alt"></i> Вход
            </a>
            <a href="register.html" class="${currentPage === 'register.html' ? 'active' : ''}">
                <i class="fas fa-user-plus"></i> Регистрация
            </a>
        `;
    }
}

// 🔧 ОБНОВЛЕНИЕ ПРИВЕТСТВИЯ ПОЛЬЗОВАТЕЛЯ
function updateUserGreeting(user) {
    const greetingElement = document.getElementById('userGreeting');
    const emailElement = document.getElementById('userEmail');
    const phoneElement = document.getElementById('userPhone');
    
    if (greetingElement) {
        greetingElement.textContent = `Добро пожаловать, ${user.fullName}!`;
    }
    
    if (emailElement && user.email) {
        emailElement.innerHTML = `<i class="fas fa-envelope"></i> ${user.email}`;
    } else if (emailElement) {
        emailElement.innerHTML = `<i class="fas fa-envelope"></i> Email не указан`;
    }
    
    if (phoneElement) {
        phoneElement.innerHTML = `<i class="fas fa-phone"></i> ${user.phone}`;
    }
}

// 🔧 ФУНКЦИИ ДЛЯ РАБОТЫ С ПАРОЛЯМИ (остаются без изменений)
function setupPasswordVisibility() {
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    }
    
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const icon = this.querySelector('i');
            
            if (confirmPasswordInput.type === 'password') {
                confirmPasswordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                confirmPasswordInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    }
}

function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;
        
        let strength = 0;
        let color = '';
        let text = '';
        
        if (password.length > 0) strength += 20;
        if (password.length >= 8) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/[0-9]/.test(password)) strength += 20;
        if (/[^A-Za-z0-9]/.test(password)) strength += 20;
        
        strength = Math.min(strength, 100);
        
        if (strength < 40) {
            color = '#F44336';
            text = 'Слабый';
        } else if (strength < 70) {
            color = '#FF9800';
            text = 'Средний';
        } else if (strength < 90) {
            color = '#2196F3';
            text = 'Хороший';
        } else {
            color = '#4CAF50';
            text = 'Отличный';
        }
        
        strengthBar.style.setProperty('--strength-color', color);
        strengthBar.querySelector('::after').style.width = strength + '%';
        strengthBar.querySelector('::after').style.backgroundColor = color;
        strengthText.textContent = text + ' пароль';
        strengthText.style.color = color;
    });
}

// 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function showSuccess(message) {
    const modal = document.getElementById('successModal');
    if (modal) {
        document.getElementById('modalMessage').textContent = message;
        modal.style.display = 'flex';
    } else {
        // Создаем временное уведомление
        showNotification(message, 'success');
    }
}

function showError(message) {
    const modal = document.getElementById('errorModal');
    if (modal) {
        document.getElementById('errorMessage').innerHTML = message;
        modal.style.display = 'flex';
        
        document.getElementById('errorOkBtn')?.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    } else {
        // Создаем временное уведомление
        showNotification(message, 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#F44336'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 500px;
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}