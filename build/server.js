const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Подключение к базе данных
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'animal_chip_tracker'
});

db.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
        return;
    }
    console.log('Успешное подключение к базе данных');
});

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// Маршруты API

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, phone, email, password } = req.body;
        
        // Проверка существующего пользователя
        const [existing] = await db.promise().query(
            'SELECT id FROM users WHERE phone = ?',
            [phone]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким телефоном уже существует' });
        }
        
        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Создание пользователя
        const [result] = await db.promise().query(
            'INSERT INTO users (full_name, phone, email, password) VALUES (?, ?, ?, ?)',
            [fullName, phone, email, hashedPassword]
        );
        
        // Генерация токена
        const token = jwt.sign(
            { id: result.insertId, phone },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            message: 'Регистрация успешна',
            token,
            user: { id: result.insertId, fullName, phone, email }
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Вход пользователя
app.post('/api/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        // Поиск пользователя
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE phone = ?',
            [phone]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Неверный телефон или пароль' });
        }
        
        const user = users[0];
        
        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный телефон или пароль' });
        }
        
        // Генерация токена
        const token = jwt.sign(
            { id: user.id, phone: user.phone },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                phone: user.phone,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавление животного
app.post('/api/animals', authenticateToken, async (req, res) => {
    try {
        const {
            chipNumber,
            petName,
            species,
            breed,
            birthDate,
            vaccinations,
            diseases,
            additionalInfo
        } = req.body;
        
        // Проверка существующего чипа
        const [existing] = await db.promise().query(
            'SELECT id FROM animals WHERE chip_number = ?',
            [chipNumber]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Животное с таким номером чипа уже зарегистрировано' });
        }
        
        // Получение информации о владельце
        const [users] = await db.promise().query(
            'SELECT full_name, phone FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const owner = users[0];
        
        // Добавление животного
        const [result] = await db.promise().query(
            `INSERT INTO animals (
                chip_number, pet_name, species, breed, birth_date,
                vaccinations, diseases, additional_info,
                owner_id, owner_name, owner_phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                chipNumber,
                petName,
                species,
                breed,
                birthDate,
                vaccinations,
                diseases,
                additionalInfo,
                req.user.id,
                owner.full_name,
                owner.phone
            ]
        );
        
        res.status(201).json({
            message: 'Животное успешно зарегистрировано',
            animalId: result.insertId
        });
    } catch (error) {
        console.error('Ошибка добавления животного:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение животных пользователя
app.get('/api/animals', authenticateToken, async (req, res) => {
    try {
        const [animals] = await db.promise().query(
            'SELECT * FROM animals WHERE owner_id = ? ORDER BY registration_date DESC',
            [req.user.id]
        );
        
        res.json(animals);
    } catch (error) {
        console.error('Ошибка получения животных:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Поиск животного по номеру чипа
app.get('/api/animals/search/:chipNumber', async (req, res) => {
    try {
        const [animals] = await db.promise().query(
            'SELECT * FROM animals WHERE chip_number = ?',
            [req.params.chipNumber]
        );
        
        if (animals.length === 0) {
            return res.status(404).json({ error: 'Животное не найдено' });
        }
        
        res.json(animals[0]);
    } catch (error) {
        console.error('Ошибка поиска животного:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление информации о животном
app.put('/api/animals/:id', authenticateToken, async (req, res) => {
    try {
        const animalId = req.params.id;
        const updateData = req.body;
        
        // Проверка прав доступа
        const [animals] = await db.promise().query(
            'SELECT owner_id FROM animals WHERE id = ?',
            [animalId]
        );
        
        if (animals.length === 0) {
            return res.status(404).json({ error: 'Животное не найдено' });
        }
        
        if (animals[0].owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Нет доступа к этому животному' });
        }
        
        // Обновление данных
        const fields = [];
        const values = [];
        
        Object.keys(updateData).forEach(key => {
            if (key !== 'id' && key !== 'owner_id' && key !== 'chip_number') {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });
        
        values.push(animalId);
        
        await db.promise().query(
            `UPDATE animals SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        
        res.json({ message: 'Информация обновлена успешно' });
    } catch (error) {
        console.error('Ошибка обновления животного:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Откройте http://localhost:${PORT} в браузере`);
});