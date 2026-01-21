// animals.js - ОБНОВЛЕННЫЙ ДЛЯ РАБОТЫ С API
document.addEventListener('DOMContentLoaded', function() {
    console.log('🐾 Animals module loaded');
    
    // Находим все формы на странице
    const animalForm = document.getElementById('animalRegistrationForm');
    const editAnimalForm = document.getElementById('editAnimalForm');
    
    // Настраиваем форму добавления питомца
    if (animalForm) {
        console.log('📝 Found animal registration form');
        animalForm.addEventListener('submit', handleAnimalRegistration);
    }
    
    // Настраиваем форму редактирования питомца
    if (editAnimalForm) {
        console.log('✏️ Found animal edit form');
        editAnimalForm.addEventListener('submit', handleAnimalUpdate);
    }
    
    // Загружаем животных на dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        console.log('📊 Loading dashboard data...');
        loadDashboardData();
    }
    
    // Загружаем данные питомца для редактирования
    if (window.location.pathname.includes('edit-pet.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const animalId = urlParams.get('id');
        if (animalId) {
            console.log('🔍 Loading animal data for edit:', animalId);
            loadAnimalForEdit(animalId);
        }
    }
    
    // Настраиваем модальные окна
    setupAnimalModals();
});

// 📝 ДОБАВЛЕНИЕ НОВОГО ПИТОМЦА
async function handleAnimalRegistration(e) {
    e.preventDefault();
    console.log('🔄 Processing animal registration...');
    
    // Проверяем авторизацию
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        showError('Пожалуйста, войдите в систему');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // Показываем индикатор загрузки
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
    submitButton.disabled = true;
    
    try {
        // Собираем данные формы
        const formData = {
            chipNumber: document.getElementById('chipNumber').value.trim(),
            petName: document.getElementById('petName').value.trim(),
            species: document.getElementById('species').value,
            breed: document.getElementById('breed')?.value.trim() || '',
            birthDate: document.getElementById('birthDate')?.value || '',
            color: document.getElementById('color')?.value.trim() || '',
            gender: document.getElementById('gender')?.value || '',
            vaccinations: document.getElementById('vaccinations')?.value.trim() || '',
            diseases: document.getElementById('diseases')?.value.trim() || '',
            vetInfo: document.getElementById('vetInfo')?.value.trim() || '',
            diet: document.getElementById('diet')?.value.trim() || '',
            behavior: document.getElementById('behavior')?.value.trim() || '',
            additionalInfo: document.getElementById('additionalInfo')?.value.trim() || ''
        };
        
        // ВАЛИДАЦИЯ
        const errors = [];
        if (!formData.chipNumber) errors.push('Введите номер чипа');
        if (!formData.petName) errors.push('Введите кличку животного');
        if (!formData.species) errors.push('Выберите вид животного');
        
        if (errors.length > 0) {
            throw new Error(errors.join('<br>'));
        }
        
        console.log('📨 Sending animal registration request...');
        
        // Отправляем запрос на сервер
        const response = await api.addAnimal(formData);
        
        if (response.success) {
            console.log('✅ Animal registered successfully:', response.animal);
            
            // Показываем успешное сообщение
            showSuccessModal(
                `Питомец "${formData.petName}" успешно зарегистрирован!`,
                response.animal.petName
            );
            
            // Очищаем форму
            e.target.reset();
            
        } else {
            throw new Error(response.error || 'Ошибка регистрации питомца');
        }
        
    } catch (error) {
        console.error('❌ Animal registration error:', error);
        showError(error.message || 'Произошла ошибка при регистрации питомца');
    } finally {
        // Восстанавливаем кнопку
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// ✏️ ОБНОВЛЕНИЕ ДАННЫХ ПИТОМЦА
async function handleAnimalUpdate(e) {
    e.preventDefault();
    
    const animalId = document.getElementById('animalId')?.value;
    if (!animalId) {
        showError('ID питомца не указан');
        return;
    }
    
    // Показываем индикатор загрузки
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
    submitButton.disabled = true;
    
    try {
        // Собираем данные формы
        const formData = {
            petName: document.getElementById('editPetName').value.trim(),
            species: document.getElementById('editSpecies').value,
            breed: document.getElementById('editBreed')?.value.trim() || '',
            birthDate: document.getElementById('editBirthDate')?.value || '',
            color: document.getElementById('editColor')?.value.trim() || '',
            gender: document.getElementById('editGender')?.value || '',
            vaccinations: document.getElementById('editVaccinations')?.value.trim() || '',
            diseases: document.getElementById('editDiseases')?.value.trim() || '',
            vetInfo: document.getElementById('editVetInfo')?.value.trim() || '',
            diet: document.getElementById('editDiet')?.value.trim() || '',
            behavior: document.getElementById('editBehavior')?.value.trim() || '',
            additionalInfo: document.getElementById('editAdditionalInfo')?.value.trim() || ''
        };
        
        // ВАЛИДАЦИЯ
        const errors = [];
        if (!formData.petName) errors.push('Введите кличку животного');
        if (!formData.species) errors.push('Выберите вид животного');
        
        if (errors.length > 0) {
            throw new Error(errors.join('<br>'));
        }
        
        console.log('📨 Sending animal update request...');
        
        // Отправляем запрос на сервер
        const response = await api.updateAnimal(animalId, formData);
        
        if (response.success) {
            console.log('✅ Animal updated successfully:', response.animal);
            
            // Показываем успешное сообщение
            showSuccessModal(
                'Информация о питомце успешно обновлена!',
                response.animal.petName
            );
            
        } else {
            throw new Error(response.error || 'Ошибка обновления питомца');
        }
        
    } catch (error) {
        console.error('❌ Animal update error:', error);
        showError(error.message || 'Произошла ошибка при обновлении информации');
    } finally {
        // Восстанавливаем кнопку
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// 📊 ЗАГРУЗКА ДАННЫХ ДЛЯ DASHBOARD
async function loadDashboardData() {
    try {
        console.log('🔄 Loading user animals...');
        
        // Загружаем животных пользователя
        const animalsResponse = await api.getAnimals();
        const animals = animalsResponse.animals || [];
        
        console.log(`✅ Loaded ${animals.length} animals`);
        
        // Обновляем статистику
        updateStats(animals);
        
        // Отображаем животных
        renderAnimalsGrid(animals);
        
        // Загружаем активности
        await loadActivities();
        
    } catch (error) {
        console.error('❌ Dashboard data loading error:', error);
        
        // Показываем сообщение об ошибке
        const petsGrid = document.getElementById('petsGrid');
        if (petsGrid) {
            petsGrid.innerHTML = `
                <div class="empty-state error">
                    <div class="empty-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Не удалось загрузить данные</h3>
                    <p>${error.message || 'Проверьте подключение к интернету'}</p>
                    <button class="btn btn-primary" id="retryLoading">
                        <i class="fas fa-sync-alt"></i> Попробовать снова
                    </button>
                </div>
            `;
            
            // Добавляем обработчик для кнопки повтора
            document.getElementById('retryLoading')?.addEventListener('click', loadDashboardData);
        }
    }
}

// 🔍 ЗАГРУЗКА ДАННЫХ ПИТОМЦА ДЛЯ РЕДАКТИРОВАНИЯ
async function loadAnimalForEdit(animalId) {
    try {
        console.log(`🔄 Loading animal data for edit: ${animalId}`);
        
        const response = await api.getAnimal(animalId);
        
        if (response.success && response.animal) {
            const animal = response.animal;
            
            // Заполняем форму данными
            populateEditForm(animal);
            
            // Настраиваем кнопку удаления
            setupDeleteButton(animalId, animal.petName);
            
        } else {
            throw new Error(response.error || 'Питомец не найден');
        }
        
    } catch (error) {
        console.error('❌ Animal loading error:', error);
        showError(error.message || 'Не удалось загрузить данные питомца');
        
        // Перенаправляем на dashboard через 3 секунды
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
    }
}

// 🔧 ЗАПОЛНЕНИЕ ФОРМЫ РЕДАКТИРОВАНИЯ
function populateEditForm(animal) {
    // Заполняем скрытые поля
    document.getElementById('animalId').value = animal.id;
    
    // Основная информация
    document.getElementById('editChipNumber').value = animal.chipNumber || '';
    document.getElementById('editPetName').value = animal.petName || '';
    document.getElementById('editSpecies').value = animal.species || '';
    document.getElementById('editBreed').value = animal.breed || '';
    document.getElementById('editBirthDate').value = animal.birthDate || '';
    document.getElementById('editColor').value = animal.color || '';
    document.getElementById('editGender').value = animal.gender || '';
    
    // Медицинская информация
    document.getElementById('editVaccinations').value = animal.vaccinations || '';
    document.getElementById('editDiseases').value = animal.diseases || '';
    document.getElementById('editVetInfo').value = animal.vetInfo || '';
    
    // Дополнительная информация
    document.getElementById('editDiet').value = animal.diet || '';
    document.getElementById('editBehavior').value = animal.behavior || '';
    document.getElementById('editAdditionalInfo').value = animal.additionalInfo || '';
    
    // Обновляем заголовок страницы
    const pageDescription = document.getElementById('pageDescription');
    if (pageDescription) {
        pageDescription.textContent = `Редактирование информации о ${animal.petName}`;
    }
}

// 🔧 НАСТРОЙКА КНОПКИ УДАЛЕНИЯ
function setupDeleteButton(animalId, petName) {
    const deleteBtn = document.getElementById('deletePetBtn');
    if (!deleteBtn) return;
    
    deleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        showDeleteConfirmation(animalId, petName);
    });
}

// 🗑️ ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ
async function showDeleteConfirmation(animalId, petName) {
    const modal = document.getElementById('deleteConfirmModal');
    if (!modal) {
        // Создаем модальное окно, если его нет
        createDeleteModal();
    }
    
    const messageElement = document.getElementById('deleteConfirmMessage');
    if (messageElement) {
        messageElement.textContent = 
            `Вы уверены, что хотите удалить питомца "${petName}"? Это действие нельзя отменить.`;
    }
    
    modal.style.display = 'flex';
    
    // Настраиваем обработчики
    setupDeleteModalHandlers(animalId);
}

// 🔧 СОЗДАНИЕ МОДАЛЬНОГО ОКНА УДАЛЕНИЯ
function createDeleteModal() {
    const modalHTML = `
        <div id="deleteConfirmModal" class="modal">
            <div class="modal-content">
                <div class="modal-icon danger">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Подтверждение удаления</h3>
                <p id="deleteConfirmMessage"></p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="cancelDelete">
                        <i class="fas fa-times"></i> Отмена
                    </button>
                    <button class="btn btn-danger" id="confirmDelete">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 🔧 НАСТРОЙКА ОБРАБОТЧИКОВ МОДАЛЬНОГО ОКНА
function setupDeleteModalHandlers(animalId) {
    const modal = document.getElementById('deleteConfirmModal');
    const cancelBtn = document.getElementById('cancelDelete');
    const confirmBtn = document.getElementById('confirmDelete');
    
    if (!modal || !cancelBtn || !confirmBtn) return;
    
    // Удаляем старые обработчики
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newConfirmBtn = confirmBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Отмена удаления
    newCancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Подтверждение удаления
    newConfirmBtn.addEventListener('click', async function() {
        try {
            console.log(`🗑️ Deleting animal: ${animalId}`);
            
            const response = await api.deleteAnimal(animalId);
            
            if (response.success) {
                showSuccessModal('Питомец успешно удален!', null, true);
                modal.style.display = 'none';
            } else {
                throw new Error(response.error || 'Ошибка удаления');
            }
            
        } catch (error) {
            console.error('❌ Delete error:', error);
            showError(error.message || 'Произошла ошибка при удалении питомца');
        }
    });
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
}

// 📊 ОБНОВЛЕНИЕ СТАТИСТИКИ
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
            viewPetProfile(animalId);
        });
    });
}

// 🔍 ПРОСМОТР ПРОФИЛЯ ПИТОМЦА
function viewPetProfile(animalId) {
    window.location.href = `pet-profile.html?id=${animalId}`;
}

// 📝 ЗАГРУЗКА АКТИВНОСТЕЙ
async function loadActivities() {
    try {
        const response = await api.getActivities();
        const activities = response.activities || [];
        
        renderActivities(activities);
        
    } catch (error) {
        console.error('❌ Activities loading error:', error);
    }
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

// 🔧 НАСТРОЙКА МОДАЛЬНЫХ ОКОН
function setupAnimalModals() {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }
}

// 🔧 ПОКАЗ УСПЕШНОГО СООБЩЕНИЯ
function showSuccessModal(message, petName = null, redirect = false) {
    const modal = document.getElementById('successModal');
    if (!modal) {
        // Создаем временное уведомление
        showNotification(message, 'success');
        
        if (redirect) {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
        return;
    }
    
    document.getElementById('modalMessage').textContent = message;
    modal.style.display = 'flex';
    
    // Настраиваем кнопку OK
    const okBtn = document.getElementById('successOkBtn');
    if (okBtn) {
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        
        newOkBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            if (redirect) {
                window.location.href = 'dashboard.html';
            }
        });
    }
    
    // Автоматическое перенаправление
    if (redirect) {
        setTimeout(() => {
            modal.style.display = 'none';
            window.location.href = 'dashboard.html';
        }, 3000);
    }
}

// 🔧 ПОКАЗ ОШИБКИ
function showError(message) {
    const errorModal = document.getElementById('errorModal');
    if (errorModal) {
        document.getElementById('errorMessage').innerHTML = message;
        errorModal.style.display = 'flex';
        
        document.getElementById('errorOkBtn')?.addEventListener('click', function() {
            errorModal.style.display = 'none';
        });
    } else {
        alert(message);
    }
}

// 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (остаются без изменений)
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

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
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
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}