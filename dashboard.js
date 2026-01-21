// dashboard.js - ОБНОВЛЕННЫЙ ДЛЯ РАБОТЫ С API
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard module loaded');
    
    // Проверяем авторизацию
    checkDashboardAuth();
    
    // Загружаем данные пользователя
    loadUserData();
    
    // Настраиваем действия на dashboard
    setupDashboardActions();
    
    // Настраиваем поиск по чипу
    setupSearchFunctionality();
});

// 🔧 ПРОВЕРКА АВТОРИЗАЦИИ НА DASHBOARD
function checkDashboardAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        console.log('🚫 Unauthorized access to dashboard, redirecting...');
        showAccessMessage('Для доступа к личному кабинету необходимо войти в систему');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

// 🔧 ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user) {
        console.error('❌ No user data found');
        return;
    }
    
    // Обновляем приветствие
    updateUserGreeting(user);
    
    // Загружаем животных пользователя
    loadUserAnimals();
    
    // Загружаем активности
    loadUserActivities();
}

// 🔧 ОБНОВЛЕНИЕ ПРИВЕТСТВИЯ
function updateUserGreeting(user) {
    const greetingElement = document.getElementById('userGreeting');
    const emailElement = document.getElementById('userEmail');
    const phoneElement = document.getElementById('userPhone');
    
    if (greetingElement) {
        greetingElement.textContent = `Добро пожаловать, ${user.fullName}!`;
    }
    
    if (emailElement) {
        emailElement.innerHTML = `<i class="fas fa-envelope"></i> ${user.email || 'Email не указан'}`;
    }
    
    if (phoneElement) {
        phoneElement.innerHTML = `<i class="fas fa-phone"></i> ${user.phone}`;
    }
}

// 🔧 ЗАГРУЗКА ЖИВОТНЫХ ПОЛЬЗОВАТЕЛЯ
async function loadUserAnimals() {
    try {
        console.log('🔄 Loading user animals...');
        
        const response = await api.getAnimals();
        const animals = response.animals || [];
        
        console.log(`✅ Loaded ${animals.length} animals`);
        
        // Обновляем статистику
        updateStats(animals);
        
        // Отображаем животных
        renderAnimalsGrid(animals);
        
    } catch (error) {
        console.error('❌ Error loading animals:', error);
        
        const petsGrid = document.getElementById('petsGrid');
        if (petsGrid) {
            petsGrid.innerHTML = `
                <div class="empty-state error">
                    <div class="empty-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Не удалось загрузить питомцев</h3>
                    <p>${error.message || 'Проверьте подключение к интернету'}</p>
                    <button class="btn btn-primary" id="retryAnimals">
                        <i class="fas fa-sync-alt"></i> Попробовать снова
                    </button>
                </div>
            `;
            
            document.getElementById('retryAnimals')?.addEventListener('click', loadUserAnimals);
        }
    }
}

// 🔧 ЗАГРУЗКА АКТИВНОСТЕЙ
async function loadUserActivities() {
    try {
        const response = await api.getActivities();
        const activities = response.activities || [];
        
        renderActivities(activities);
        
    } catch (error) {
        console.error('❌ Error loading activities:', error);
    }
}

// 🔧 ОБНОВЛЕНИЕ СТАТИСТИКИ
function updateStats(animals) {
    const totalPets = document.getElementById('totalPets');
    const vaccinatedPets = document.getElementById('vaccinatedPets');
    const recentPets = document.getElementById('recentPets');
    const chippedPets = document.getElementById('chippedPets');
    
    if (totalPets) totalPets.textContent = animals.length;
    
    if (vaccinatedPets) {
        const vaccinated = animals.filter(animal => 
            animal.vaccinations && animal.vaccinations.trim() !== ''
        ).length;
        vaccinatedPets.textContent = vaccinated;
    }
    
    if (recentPets) {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const recent = animals.filter(animal => 
            new Date(animal.registrationDate) > monthAgo
        ).length;
        recentPets.textContent = recent;
    }
    
    if (chippedPets) {
        const chipped = animals.filter(animal => 
            animal.chipNumber && animal.chipNumber.trim() !== ''
        ).length;
        chippedPets.textContent = chipped;
    }
}

// 🎨 ОТОБРАЖЕНИЕ СЕТКИ ЖИВОТНЫХ
function renderAnimalsGrid(animals) {
    const petsGrid = document.getElementById('petsGrid');
    if (!petsGrid) return;
    
    if (animals.length === 0) {
        petsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-dog"></i>
                </div>
                <h3>Пока нет питомцев</h3>
                <p>Добавьте первого питомца, чтобы начать использование системы</p>
                <a href="add-pet.html" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Добавить первого питомца
                </a>
            </div>
        `;
        return;
    }
    
    petsGrid.innerHTML = animals.map(animal => `
        <div class="animal-card" data-id="${animal.id}">
            <div class="animal-card-header">
                <div class="animal-header-info">
                    <h3 class="animal-name">${escapeHtml(animal.petName)}</h3>
                    <div class="animal-badges">
                        ${animal.vaccinations ? 
                            '<span class="badge badge-success"><i class="fas fa-syringe"></i> Привит</span>' : ''}
                        ${animal.chipNumber ? 
                            '<span class="badge badge-info"><i class="fas fa-microchip"></i> Чипирован</span>' : ''}
                    </div>
                </div>
                <span class="chip-number">
                    <i class="fas fa-microchip"></i> ${escapeHtml(animal.chipNumber || 'Без чипа')}
                </span>
            </div>
            
            <div class="animal-card-body">
                <div class="animal-info">
                    <div class="info-row">
                        <span class="info-label">Вид:</span>
                        <span class="info-value">${escapeHtml(animal.species)}</span>
                    </div>
                    ${animal.breed ? `
                    <div class="info-row">
                        <span class="info-label">Порода:</span>
                        <span class="info-value">${escapeHtml(animal.breed)}</span>
                    </div>` : ''}
                    ${animal.gender ? `
                    <div class="info-row">
                        <span class="info-label">Пол:</span>
                        <span class="info-value">${escapeHtml(animal.gender)}</span>
                    </div>` : ''}
                    ${animal.birthDate ? `
                    <div class="info-row">
                        <span class="info-label">Дата рождения:</span>
                        <span class="info-value">${formatDate(animal.birthDate)}</span>
                    </div>` : ''}
                </div>
                
                <div class="animal-actions">
                    <button class="btn-view-pet" data-id="${animal.id}">
                        <i class="fas fa-eye"></i> Просмотр
                    </button>
                    <a href="edit-pet.html?id=${animal.id}" class="btn-edit-pet">
                        <i class="fas fa-edit"></i> Редактировать
                    </a>
                </div>
            </div>
            
            <div class="animal-card-footer">
                <span class="registration-date">
                    <i class="fas fa-calendar-alt"></i> 
                    ${animal.lastUpdated ? 
                        `Обновлен: ${formatDate(animal.lastUpdated)}` : 
                        `Зарегистрирован: ${formatDate(animal.registrationDate)}`
                    }
                </span>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок просмотра
    document.querySelectorAll('.btn-view-pet').forEach(btn => {
        btn.addEventListener('click', function() {
            const animalId = this.getAttribute('data-id');
            window.location.href = `pet-profile.html?id=${animalId}`;
        });
    });
}

// 🎨 ОТОБРАЖЕНИЕ АКТИВНОСТЕЙ
function renderActivities(activities) {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;
    
    if (activities.length === 0) {
        activitiesList.innerHTML = `
            <div class="empty-state small">
                <p>Активности не найдены</p>
            </div>
        `;
        return;
    }
    
    activitiesList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-history"></i>
            </div>
            <div class="activity-content">
                <h4>${escapeHtml(activity.message)}</h4>
                <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

// 🔧 НАСТРОЙКА ДЕЙСТВИЙ НА DASHBOARD
function setupDashboardActions() {
    // Кнопка обновления
    const refreshBtn = document.getElementById('refreshPets');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log('🔄 Refreshing dashboard data...');
            loadUserData();
            showNotification('Данные обновлены', 'success');
        });
    }
    
    // Кнопка поиска по чипу
    const searchChipBtn = document.getElementById('searchChip');
    if (searchChipBtn) {
        searchChipBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showSearchModal();
        });
    }
    
    // Кнопка печати карточек
    const printCardsBtn = document.getElementById('printCards');
    if (printCardsBtn) {
        printCardsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            printAnimalCards();
        });
    }
    
    // Кнопка напоминаний
    const vaccineRemindersBtn = document.getElementById('vaccineReminders');
    if (vaccineRemindersBtn) {
        vaccineRemindersBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showVaccineReminders();
        });
    }
    
    // Кнопка настроек профиля
    const profileSettingsBtn = document.getElementById('profileSettings');
    if (profileSettingsBtn) {
        profileSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showProfileSettings();
        });
    }
}

// 🔍 НАСТРОЙКА ПОИСКА ПО ЧИПУ
function setupSearchFunctionality() {
    // Модальное окно поиска
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchChipInput');
    const performSearchBtn = document.getElementById('performSearch');
    const cancelSearchBtn = document.getElementById('cancelSearch');
    
    if (!searchModal || !searchInput || !performSearchBtn || !cancelSearchBtn) return;
    
    // Открытие модального окна
    const searchChipBtn = document.getElementById('searchChip');
    if (searchChipBtn) {
        searchChipBtn.addEventListener('click', function(e) {
            e.preventDefault();
            searchModal.style.display = 'flex';
            searchInput.focus();
        });
    }
    
    // Закрытие модального окна
    cancelSearchBtn.addEventListener('click', function() {
        searchModal.style.display = 'none';
        searchInput.value = '';
    });
    
    // Поиск
    performSearchBtn.addEventListener('click', async function() {
        const chipNumber = searchInput.value.trim();
        
        if (!chipNumber) {
            showNotification('Введите номер чипа для поиска', 'error');
            return;
        }
        
        try {
            console.log(`🔍 Searching for chip: ${chipNumber}`);
            
            const response = await api.searchByChip(chipNumber);
            
            if (response.success) {
                showSearchResult(response.animal);
            } else {
                throw new Error(response.error || 'Животное не найдено');
            }
            
        } catch (error) {
            console.error('❌ Search error:', error);
            showNotification(error.message || 'Животное с таким номером чипа не найдено', 'error');
        } finally {
            searchModal.style.display = 'none';
            searchInput.value = '';
        }
    });
    
    // Закрытие по клику вне модального окна
    searchModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            searchInput.value = '';
        }
    });
}

// 🔍 ПОКАЗ РЕЗУЛЬТАТОВ ПОИСКА
function showSearchResult(animal) {
    const resultHTML = `
        <div class="search-result-modal">
            <div class="modal-content">
                <h3><i class="fas fa-search"></i> Результаты поиска</h3>
                <div class="search-result">
                    <div class="result-header">
                        <h4>${escapeHtml(animal.petName)}</h4>
                        <span class="chip-number">Чип: ${escapeHtml(animal.chipNumber)}</span>
                    </div>
                    <div class="result-info">
                        <div class="info-row">
                            <span class="info-label">Вид:</span>
                            <span class="info-value">${escapeHtml(animal.species)}</span>
                        </div>
                        ${animal.breed ? `
                        <div class="info-row">
                            <span class="info-label">Порода:</span>
                            <span class="info-value">${escapeHtml(animal.breed)}</span>
                        </div>` : ''}
                        <div class="info-row">
                            <span class="info-label">Владелец:</span>
                            <span class="info-value">${escapeHtml(animal.ownerName)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Контакты:</span>
                            <span class="info-value">${escapeHtml(animal.ownerPhone)}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="closeSearchResult">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Добавляем результат на страницу
    const resultModal = document.createElement('div');
    resultModal.innerHTML = resultHTML;
    document.body.appendChild(resultModal);
    
    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
        .search-result-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 10, 32, 0.95);
            backdrop-filter: blur(20px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        .search-result {
            background: var(--gradient-card);
            border: 1px solid var(--border-color);
            border-radius: 15px;
            padding: 25px;
            margin: 20px 0;
        }
        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .result-header h4 {
            font-size: 1.4rem;
            color: var(--text-primary);
            margin: 0;
        }
        .result-info .info-row {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(157, 78, 221, 0.1);
        }
        .result-info .info-row:last-child {
            border-bottom: none;
        }
    `;
    document.head.appendChild(style);
    
    // Кнопка закрытия
    document.getElementById('closeSearchResult').addEventListener('click', function() {
        resultModal.remove();
        style.remove();
    });
    
    // Закрытие по клику вне модального окна
    resultModal.addEventListener('click', function(e) {
        if (e.target.classList.contains('search-result-modal')) {
            resultModal.remove();
            style.remove();
        }
    });
}

// 🖨️ ПЕЧАТЬ КАРТОЧЕК ЖИВОТНЫХ
function printAnimalCards() {
    // Создаем стили для печати
    const printStyles = `
        <style>
            @media print {
                body * {
                    visibility: hidden;
                }
                .animal-card, .animal-card * {
                    visibility: visible;
                }
                .animal-card {
                    page-break-inside: avoid;
                    margin-bottom: 20px;
                    border: 1px solid #000 !important;
                    box-shadow: none !important;
                }
                .navbar, .footer, .dashboard-header, .dashboard-stats, 
                .section-header, .quick-actions, .activities-list {
                    display: none !important;
                }
                .animal-card .animal-actions {
                    display: none !important;
                }
            }
        </style>
    `;
    
    // Добавляем стили
    document.head.insertAdjacentHTML('beforeend', printStyles);
    
    // Печатаем
    window.print();
    
    // Удаляем стили после печати
    setTimeout(() => {
        const styles = document.querySelectorAll('style[media="print"]');
        styles.forEach(style => style.remove());
    }, 100);
}

// 🔔 ПОКАЗ НАПОМИНАНИЙ О ПРИВИВКАХ
function showVaccineReminders() {
    try {
        const animals = JSON.parse(localStorage.getItem('animalTrackerAnimals')) || [];
        
        const animalsNeedingVaccines = animals.filter(animal => {
            return animal.vaccinations && 
                   animal.vaccinations.includes('2023') && // Пример: проверка старых прививок
                   !animal.vaccinations.includes('2024');  // Нет прививок за текущий год
        });
        
        if (animalsNeedingVaccines.length === 0) {
            showNotification('Все прививки актуальны! 🎉', 'success');
            return;
        }
        
        let message = `<strong>Требуют обновления прививок:</strong><br>`;
        animalsNeedingVaccines.forEach(animal => {
            message += `• ${animal.petName} (${animal.species})<br>`;
        });
        
        showNotification(message, 'warning');
        
    } catch (error) {
        console.error('❌ Error checking vaccine reminders:', error);
        showNotification('Не удалось проверить напоминания о прививках', 'error');
    }
}

// ⚙️ ПОКАЗ НАСТРОЕК ПРОФИЛЯ
function showProfileSettings() {
    showNotification('Настройки профиля находятся в разработке', 'info');
}

// 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function formatDate(dateString) {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    
    return date.toLocaleDateString('ru-RU');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAccessMessage(message) {
    const accessMessage = document.createElement('div');
    accessMessage.className = 'access-message';
    accessMessage.innerHTML = `
        <div class="access-message-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    accessMessage.style.cssText = `
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
    `;
    
    document.body.appendChild(accessMessage);
    
    setTimeout(() => {
        if (accessMessage.parentNode) {
            accessMessage.parentNode.removeChild(accessMessage);
        }
    }, 3000);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'warning' ? 'exclamation-triangle' : 
                              type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : 
                     type === 'warning' ? '#F59E0B' : 
                     type === 'error' ? '#F44336' : '#2196F3'};
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
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}