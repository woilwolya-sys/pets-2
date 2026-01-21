// pet-profile.js - ОБНОВЛЕННЫЙ ДЛЯ РАБОТЫ С API
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
    
    loadAnimalProfile(animalId);
    setupProfileActions(animalId);
});

async function loadAnimalProfile(animalId) {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            showError('Пожалуйста, войдите в систему');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        console.log(`🔄 Загрузка профиля питомца: ${animalId}`);
        
        // Используем API вместо localStorage
        const response = await api.getAnimal(animalId);
        
        if (response.success && response.animal) {
            const animal = response.animal;
            
            // Проверяем, что питомец принадлежит текущему пользователю
            if (animal.ownerId !== user.id) {
                throw new Error('У вас нет доступа к этому питомцу');
            }
            
            populateProfile(animal);
            
        } else {
            throw new Error(response.error || 'Питомец не найден');
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки профиля:', error);
        showError(error.message || 'Не удалось загрузить профиль питомца');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
    }
}

// Функция populateProfile остается БЕЗ ИЗМЕНЕНИЙ (она уже работает правильно):
function populateProfile(animal) {
    // Заголовок
    document.getElementById('petName').textContent = animal.petName;
    document.getElementById('petChipNumber').textContent = 
        animal.chipNumber ? `Чип: ${animal.chipNumber}` : 'Без микрочипа';
    
    // Основная информация
    document.getElementById('petSpecies').textContent = animal.species || '—';
    document.getElementById('petBreed').textContent = animal.breed || '—';
    document.getElementById('petGender').textContent = animal.gender || '—';
    document.getElementById('petBirthDate').textContent = 
        animal.birthDate ? formatDate(animal.birthDate) : '—';
    document.getElementById('petColor').textContent = animal.color || '—';
    document.getElementById('petAge').textContent = 
        animal.birthDate ? calculateAge(animal.birthDate) : '—';
    
    // Медицинская информация
    populateTextContent('petVaccinations', animal.vaccinations);
    populateTextContent('petDiseases', animal.diseases);
    populateTextContent('petVetInfo', animal.vetInfo);
    
    // Дополнительная информация
    populateTextContent('petDiet', animal.diet);
    populateTextContent('petBehavior', animal.behavior);
    populateTextContent('petAdditionalInfo', animal.additionalInfo);
    
    // Информация о владельце
    document.getElementById('ownerName').textContent = animal.ownerName || '—';
    document.getElementById('ownerPhone').textContent = animal.ownerPhone || '—';
    document.getElementById('registrationDate').textContent = 
        animal.registrationDate ? formatDate(animal.registrationDate) : '—';
    document.getElementById('lastUpdated').textContent = 
        animal.lastUpdated ? formatDate(animal.lastUpdated) : 
        (animal.registrationDate ? formatDate(animal.registrationDate) : '—');
}

function setupProfileActions(animalId) {
    // Кнопка редактирования
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            window.location.href = `edit-pet.html?id=${animalId}`;
        });
    }
    
    // Кнопка печати
    const printBtn = document.getElementById('printProfileBtn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            printProfile();
        });
    }
    
    // Кнопка удаления
    const deleteBtn = document.getElementById('deleteProfileBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            showDeleteConfirmation(animalId);
        });
    }
}

// Функция showDeleteConfirmation обновлена для работы с API:
async function showDeleteConfirmation(animalId) {
    try {
        // Получаем информацию о питомце для сообщения
        const response = await api.getAnimal(animalId);
        
        if (response.success && response.animal) {
            const animal = response.animal;
            
            // Показываем модальное окно подтверждения
            if (confirm(`Вы уверены, что хотите удалить питомца "${animal.petName}"?`)) {
                await deleteAnimal(animalId);
            }
        }
    } catch (error) {
        console.error('❌ Ошибка подтверждения удаления:', error);
        showError('Не удалось получить информацию о питомце');
    }
}

// Функция deleteAnimal обновлена для работы с API:
async function deleteAnimal(animalId) {
    try {
        console.log(`🗑️ Удаление питомца: ${animalId}`);
        
        const response = await api.deleteAnimal(animalId);
        
        if (response.success) {
            showSuccessModal('Питомец успешно удален!', null, true);
        } else {
            throw new Error(response.error || 'Ошибка удаления');
        }
        
    } catch (error) {
        console.error('❌ Ошибка удаления:', error);
        showError(error.message || 'Произошла ошибка при удалении питомца');
    }
}

// Функция printProfile остается БЕЗ ИЗМЕНЕНИЙ:
function printProfile() {
    const printStyles = `
        <style>
            @media print {
                body * {
                    visibility: hidden;
                }
                .section, .section * {
                    visibility: visible;
                }
                .section {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                .navbar, .footer, .profile-actions, .profile-footer-actions {
                    display: none !important;
                }
                .profile-card {
                    break-inside: avoid;
                    margin-bottom: 20px;
                }
                .no-data {
                    color: #999 !important;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', printStyles);
    window.print();
    
    setTimeout(() => {
        const styles = document.querySelectorAll('style[media="print"]');
        styles.forEach(style => style.remove());
    }, 100);
}

// Вспомогательные функции остаются БЕЗ ИЗМЕНЕНИЙ:
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    if (years === 0) {
        return `${months} мес.`;
    } else if (months === 0) {
        return `${years} г.`;
    } else {
        return `${years} г. ${months} мес.`;
    }
}

function populateTextContent(elementId, text) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (text && text.trim()) {
        const formattedText = text.split('\n')
            .map(line => `<p>${escapeHtml(line)}</p>`)
            .join('');
        element.innerHTML = formattedText;
        element.classList.remove('no-data');
    } else {
        element.innerHTML = '<p class="no-data">Информация не указана</p>';
        element.classList.add('no-data');
    }
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Добавляем недостающие функции для показа сообщений:
function showSuccessModal(message, petName = null, redirect = false) {
    const modal = document.getElementById('successModal');
    if (!modal) {
        // Просто показываем уведомление
        alert(message);
        if (redirect) {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
        return;
    }
    
    document.getElementById('successMessage').textContent = message;
    modal.style.display = 'flex';
    
    if (redirect) {
        setTimeout(() => {
            modal.style.display = 'none';
            window.location.href = 'dashboard.html';
        }, 3000);
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
        alert(message);
    }
}