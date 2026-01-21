// api.js - ПРОСТОЙ КЛИЕНТ ДЛЯ РАБОТЫ С API
class ApiClient {
    constructor() {
        // Базовый URL API (наш бэкенд)
        this.baseUrl = 'http://localhost:3000/api';
        
        // Настройки по умолчанию для запросов
        this.defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }

    // 🔧 ПОЛУЧИТЬ ТОКЕН ИЗ LOCALSTORAGE
    getToken() {
        return localStorage.getItem('token');
    }

    // 🔧 БАЗОВЫЙ МЕТОД ДЛЯ ВСЕХ ЗАПРОСОВ
    async request(endpoint, options = {}) {
        const token = this.getToken();
        
        // Подготавливаем заголовки
        const headers = {
            ...this.defaultOptions.headers,
            ...options.headers
        };
        
        // Добавляем токен авторизации, если есть
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // URL запроса
        const url = `${this.baseUrl}${endpoint}`;
        
        console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
        
        try {
            // Выполняем запрос
            const response = await fetch(url, {
                ...this.defaultOptions,
                ...options,
                headers
            });

            // Парсим ответ
            const data = await response.json();

            // Проверяем успешность запроса
            if (!response.ok) {
                console.error(`❌ API Error (${response.status}):`, data);
                throw new Error(data.error || `Ошибка ${response.status}`);
            }

            console.log(`✅ API Response:`, data);
            return data;

        } catch (error) {
            console.error('❌ Network Error:', error);
            
            // Проверяем, нет ли проблем с интернетом
            if (!navigator.onLine) {
                throw new Error('Нет подключения к интернету. Проверьте соединение.');
            }
            
            // Проверяем, запущен ли сервер
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Сервер не отвечает. Убедитесь, что бэкенд запущен на порту 3000.');
            }
            
            throw error;
        }
    }

    // 👤 АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ

    async register(userData) {
        return this.request('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        return this.request('/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async getCurrentUser() {
        return this.request('/me');
    }

    // 🐾 РАБОТА С ЖИВОТНЫМИ

    async addAnimal(animalData) {
        return this.request('/animals', {
            method: 'POST',
            body: JSON.stringify(animalData)
        });
    }

    async getAnimals() {
        return this.request('/animals');
    }

    async getAnimal(id) {
        return this.request(`/animals/${id}`);
    }

    async updateAnimal(id, animalData) {
        return this.request(`/animals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(animalData)
        });
    }

    async deleteAnimal(id) {
        return this.request(`/animals/${id}`, {
            method: 'DELETE'
        });
    }

    // 📊 ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ

    async getActivities() {
        return this.request('/activities');
    }

    async searchByChip(chipNumber) {
        return this.request(`/search/${chipNumber}`);
    }

    // 🛠️ УТИЛИТНЫЕ МЕТОДЫ

    isAuthenticated() {
        return !!this.getToken();
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('animalTrackerUsers');
        localStorage.removeItem('animalTrackerAnimals');
        localStorage.removeItem('userActivities');
        
        // Перенаправляем на главную страницу
        window.location.href = 'index.html';
    }

    // 📡 ПРОВЕРКА ПОДКЛЮЧЕНИЯ К СЕРВЕРУ
    async checkConnection() {
        try {
            await fetch(`${this.baseUrl}/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            return true;
        } catch {
            return false;
        }
    }
}

// 🔧 СОЗДАЕМ ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР API
const api = new ApiClient();

// 🔧 ЭКСПОРТИРУЕМ ДЛЯ ИСПОЛЬЗОВАНИЯ
if (typeof window !== 'undefined') {
    window.api = api;
}

export { api };