// Функционал темы животных
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем декоративные элементы
    initAnimalDecorations();
    
    // Настройка выбора иконок животных
    setupAnimalIcons();
    
    // Анимации для элементов животных
    initAnimalAnimations();
    
    // Обновление статистики по типам животных
    updateAnimalStats();
});

function initAnimalDecorations() {
    // Создаем следы животных на фоне
    createPawPrints();
    
    // Добавляем анимацию для логотипа
    animateLogo();
}

function createPawPrints() {
    const decorationContainer = document.querySelector('.animal-decorations');
    if (!decorationContainer) return;
    
    // Создаем 8 следов
    for (let i = 0; i < 8; i++) {
        const paw = document.createElement('div');
        paw.className = 'paw-print';
        paw.innerHTML = '🐾';
        
        // Случайные позиции
        const left = Math.random() * 90 + 5;
        const top = Math.random() * 90 + 5;
        const rotation = Math.random() * 360;
        const delay = Math.random() * 20;
        const duration = 15 + Math.random() * 10;
        
        paw.style.cssText = `
            left: ${left}%;
            top: ${top}%;
            --rotation: ${rotation}deg;
            animation-delay: -${delay}s;
            animation-duration: ${duration}s;
            opacity: ${0.05 + Math.random() * 0.1};
            transform: rotate(${rotation}deg) scale(${0.5 + Math.random() * 0.5});
        `;
        
        decorationContainer.appendChild(paw);
    }
}

function animateLogo() {
    const logoIcon = document.querySelector('.logo-icon');
    if (logoIcon) {
        setInterval(() => {
            logoIcon.style.transform = 'rotate(5deg)';
            setTimeout(() => {
                logoIcon.style.transform = 'rotate(-5deg)';
            }, 500);
            setTimeout(() => {
                logoIcon.style.transform = 'rotate(0deg)';
            }, 1000);
        }, 5000);
    }
}

function setupAnimalIcons() {
    const animalIcons = document.querySelectorAll('.animal-icon');
    animalIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            // Убираем активный класс у всех иконок
            animalIcons.forEach(i => i.classList.remove('active'));
            
            // Добавляем активный класс текущей иконке
            this.classList.add('active');
            
            // Получаем вид животного
            const species = this.getAttribute('data-species');
            
            // Устанавливаем значение в селект вида
            const speciesSelect = document.getElementById('species') || 
                                 document.getElementById('editSpecies');
            if (speciesSelect) {
                speciesSelect.value = species;
                
                // Показываем уведомление
                showAnimalNotification(`Выбран вид: ${species}`);
            }
        });
    });
}

function showAnimalNotification(message) {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification-animal');
    oldNotifications.forEach(n => n.remove());
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = 'notification-animal';
    notification.innerHTML = `
        <i class="fas fa-paw"></i>
        <div class="notification-content">
            <h4>Выбор животного</h4>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function initAnimalAnimations() {
    // Анимация для карточек животных
    const animalCards = document.querySelectorAll('.animal-card');
    animalCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Анимация для иконок в герое
    const heroAnimals = document.querySelectorAll('.hero-animal');
    heroAnimals.forEach((animal, index) => {
        animal.style.animationDelay = `${index * 0.2}s`;
    });
}

function updateAnimalStats() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;
    
    const animals = JSON.parse(localStorage.getItem('animalTrackerAnimals')) || [];
    const userAnimals = animals.filter(animal => animal.ownerId === user.id);
    
    // Статистика по видам животных
    const speciesStats = {
        'Собака': 0,
        'Кошка': 0,
        'Птица': 0,
        'Грызун': 0,
        'Рептилия': 0,
        'Другое': 0
    };
    
    userAnimals.forEach(animal => {
        if (speciesStats.hasOwnProperty(animal.species)) {
            speciesStats[animal.species]++;
        } else {
            speciesStats['Другое']++;
        }
    });
    
    // Показываем статистику в dashboard
    updateSpeciesStatsDisplay(speciesStats);
}

function updateSpeciesStatsDisplay(stats) {
    const statsElement = document.getElementById('speciesStats');
    if (!statsElement) return;
    
    let html = '<div class="species-stats-grid">';
    
    Object.entries(stats).forEach(([species, count]) => {
        if (count > 0) {
            html += `
                <div class="species-stat">
                    <div class="species-icon">
                        ${getSpeciesIcon(species)}
                    </div>
                    <div class="species-info">
                        <div class="species-count">${count}</div>
                        <div class="species-name">${species}</div>
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    statsElement.innerHTML = html;
}

function getSpeciesIcon(species) {
    const icons = {
        'Собака': '🐕',
        'Кошка': '🐈',
        'Птица': '🐦',
        'Грызун': '🐹',
        'Рептилия': '🦎',
        'Другое': '🐾'
    };
    
    return icons[species] || '🐾';
}

// Добавляем элементы в dashboard.html для отображения статистики
function addSpeciesStatsToDashboard() {
    const dashboard = document.querySelector('.dashboard-section');
    if (dashboard) {
        const statsHTML = `
            <div class="dashboard-section">
                <div class="section-header">
                    <h2><i class="fas fa-chart-bar"></i> Статистика по видам</h2>
                </div>
                <div id="speciesStats" class="species-stats-container">
                    <!-- Статистика будет загружена здесь -->
                </div>
            </div>
        `;
        
        // Находим место для вставки (перед быстрыми действиями)
        const quickActions = document.querySelector('.quick-actions');
        if (quickActions) {
            quickActions.insertAdjacentHTML('beforebegin', statsHTML);
        }
    }
}

// Добавляем стили для статистики видов
const speciesStatsStyles = `
    .species-stats-container {
        margin-top: 20px;
    }
    
    .species-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
    }
    
    .species-stat {
        background: var(--gradient-card);
        border: 1px solid var(--border-color);
        border-radius: 15px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        transition: all 0.3s ease;
    }
    
    .species-stat:hover {
        transform: translateY(-5px);
        border-color: var(--lavender);
    }
    
    .species-icon {
        font-size: 2rem;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .species-info {
        flex: 1;
    }
    
    .species-count {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--lavender);
        line-height: 1;
    }
    
    .species-name {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-top: 5px;
    }
`;

// Добавляем стили в head
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('species-stats-styles')) {
        const style = document.createElement('style');
        style.id = 'species-stats-styles';
        style.textContent = speciesStatsStyles;
        document.head.appendChild(style);
    }
    
    // Добавляем статистику в dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        addSpeciesStatsToDashboard();
        updateAnimalStats();
    }
});