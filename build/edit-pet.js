// Функционал редактирования и удаления питомцев
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const animalId = urlParams.get('id');
    
    if (!animalId) {
        showError('ID питомца не указан');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return;
    }
    
    loadAnimalData(animalId);
    setupFormHandlers(animalId);
    setupDeleteModal(animalId);
});

async function loadAnimalData(animalId) {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            showError('Пожалуйста, войдите в систему');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        // В реальном приложении здесь будет запрос к серверу
        const animals = JSON.parse(localStorage.getItem('animalTrackerAnimals')) || [];
        const animal = animals.find(a => a.id === animalId && a.ownerId === user.id);
        
        if (!animal) {
            showError('Питомец не найден или у вас нет доступа');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }
        
        // Заполняем форму данными
        populateForm(animal);
        
        // Обновляем описание страницы
        document.getElementById('pageDescription').textContent = 
            `Редактирование информации о ${animal.petName}`;
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Произошла ошибка при загрузке данных питомца');
    }
}

function populateForm(animal) {
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
}

function setupFormHandlers(animalId) {
    const editForm = document.getElementById('editAnimalForm');
    if (!editForm) return;
    
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateAnimal(animalId);
    });
}

async function updateAnimal(animalId) {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            showError('Пожалуйста, войдите в систему');
            return;
        }
        
        // Собираем данные из формы
        const formData = {
            id: animalId,
            chipNumber: document.getElementById('editChipNumber').value.trim(),
            petName: document.getElementById('editPetName').value.trim(),
            species: document.getElementById('editSpecies').value,
            breed: document.getElementById('editBreed').value.trim() || '',
            birthDate: document.getElementById('editBirthDate').value || '',
            color: document.getElementById('editColor').value.trim() || '',
            gender: document.getElementById('editGender').value || '',
            vaccinations: document.getElementById('editVaccinations').value.trim() || '',
            diseases: document.getElementById('editDiseases').value.trim() || '',
            vetInfo: document.getElementById('editVetInfo').value.trim() || '',
            diet: document.getElementById('editDiet').value.trim() || '',
            behavior: document.getElementById('editBehavior').value.trim() || '',
            additionalInfo: document.getElementById('editAdditionalInfo').value.trim() || '',
            lastUpdated: new Date().toISOString()
        };
        
        // Валидация
        const errors = [];
        if (!formData.petName) errors.push('Введите кличку животного');
        if (!formData.species) errors.push('Выберите вид животного');
        
        if (errors.length > 0) {
            showError(errors.join('<br>'));
            return;
        }
        
        // В реальном приложении здесь будет запрос к серверу
        const animals = JSON.parse(localStorage.getItem('animalTrackerAnimals')) || [];
        const animalIndex = animals.findIndex(a => a.id === animalId && a.ownerId === user.id);
        
        if (animalIndex === -1) {
            showError('Питомец не найден');
            return;
        }
        
        // Сохраняем неизменяемые поля
        const originalAnimal = animals[animalIndex];
        formData.ownerId = originalAnimal.ownerId;
        formData.ownerName = originalAnimal.ownerName;
        formData.ownerPhone = originalAnimal.ownerPhone;
        formData.registrationDate = originalAnimal.registrationDate;
        
        // Обновляем данные
        animals[animalIndex] = { ...originalAnimal, ...formData };
        localStorage.setItem('animalTrackerAnimals', JSON.stringify(animals));
        
        // Добавляем активность
        addActivity(`Обновлена информация о питомце: ${formData.petName}`);
        
        // Показываем успешное сообщение
        showSuccessModal('Информация о питомце успешно обновлена!', formData.petName);
        
    } catch (error) {
        console.error('Ошибка обновления:', error);
        showError('Произошла ошибка при обновлении информации');
    }
}

function setupDeleteModal(animalId) {
    const deleteBtn = document.getElementById('deletePetBtn');
    const deleteModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    
    if (!deleteBtn || !deleteModal) return;
    
    deleteBtn.addEventListener('click', function() {
        // Получаем информацию о питомце для сообщения
        const animals = JSON.parse(localStorage.getItem('animalTrackerAnimals')) || [];
        const animal = animals.find(a => a.id === animalId);
        
        if (animal) {
            document.getElementById('deleteConfirmMessage').textContent = 
                `Вы уверены, что хотите удалить питомца "${animal.petName}"? Это действие нельзя отменить.`;
        }
        
        deleteModal.style.display = 'flex';
    });
    
    // Отмена удаления
    cancelDeleteBtn?.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    // Подтверждение удаления
    confirmDeleteBtn?.addEventListener('click', async function() {
        await deleteAnimal(animalId);
        deleteModal.style.display = 'none';
    });
    
    // Закрытие по клику вне модального окна
    deleteModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
}

async function deleteAnimal(animalId) {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            showError('Пожалуйста, войдите в систему');
            return;
        }
        
        // В реальном приложении здесь будет запрос к серверу
        const animals = JSON.parse(localStorage.getItem('animalTrackerAnimals')) || [];
        const animalIndex = animals.findIndex(a => a.id === animalId && a.ownerId === user.id);
        
        if (animalIndex === -1) {
            showError('Питомец не найден');
            return;
        }
        
        const deletedAnimal = animals[animalIndex];
        
        // Удаляем питомца
        animals.splice(animalIndex, 1);
        localStorage.setItem('animalTrackerAnimals', JSON.stringify(animals));
        
        // Добавляем активность
        addActivity(`Удален питомец: ${deletedAnimal.petName}`);
        
        // Показываем успешное сообщение и перенаправляем
        showSuccessModal(`Питомец "${deletedAnimal.petName}" успешно удален!`, null, true);
        
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showError('Произошла ошибка при удалении питомца');
    }
}

function addActivity(message) {
    const activities = JSON.parse(localStorage.getItem('userActivities')) || [];
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user) return;
    
    const activity = {
        id: Date.now().toString(),
        userId: user.id,
        message: message,
        timestamp: new Date().toISOString(),
        type: 'system'
    };
    
    activities.unshift(activity);
    // Сохраняем только последние 10 активностей
    localStorage.setItem('userActivities', JSON.stringify(activities.slice(0, 10)));
}

function showSuccessModal(message, petName = null, redirect = false) {
    const modal = document.getElementById('successModal');
    if (!modal) return;
    
    document.getElementById('successTitle').textContent = redirect ? 'Удаление успешно' : 'Обновление успешно';
    document.getElementById('successMessage').textContent = message;
    
    const okBtn = document.getElementById('successOkBtn');
    if (okBtn) {
        // Удаляем старые обработчики
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        
        // Добавляем новый обработчик
        newOkBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            if (redirect) {
                window.location.href = 'dashboard.html';
            }
        });
    }
    
    modal.style.display = 'flex';
    
    // Автоматическое перенаправление через 3 секунды
    if (redirect) {
        setTimeout(() => {
            modal.style.display = 'none';
            window.location.href = 'dashboard.html';
        }, 3000);
    }
}

function showError(message) {
    const errorModal = document.getElementById('errorModal');
    if (errorModal) {
        document.getElementById('errorMessage').innerHTML = message;
        errorModal.style.display = 'flex';
        
        // Настройка кнопки закрытия
        document.getElementById('errorOkBtn')?.addEventListener('click', function() {
            errorModal.style.display = 'none';
        });
    } else {
        alert(message);
    }
}

// Если модального окна ошибки нет в HTML, создаем его динамически
function ensureErrorModal() {
    if (!document.getElementById('errorModal')) {
        const modalHTML = `
            <div id="errorModal" class="modal">
                <div class="modal-content">
                    <div class="modal-icon error">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Ошибка!</h3>
                    <p id="errorMessage"></p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="errorOkBtn">
                            Понятно
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Инициализируем модальное окно ошибки
ensureErrorModal();