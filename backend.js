// backend.js - САМЫЙ ПРОСТОЙ БЭКЕНД БЕЗ SQLite3!
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

// ✅ ВОТ И ВСЯ БАЗА ДАННЫХ! Просто файлы JSON!
const dataFiles = {
  users: './data/users.json',
  animals: './data/animals.json',
  activities: './data/activities.json'
};

// Включаем CORS (разрешаем запросы с фронтенда)
app.use(cors());
// Парсим JSON из запросов
app.use(express.json());
// Раздаем статические файлы (наш фронтенд)
app.use(express.static('.'));

// Функции для работы с "базой данных"

// Создаем папку data, если её нет
async function initDataFolder() {
  try {
    await fs.mkdir('./data', { recursive: true });
    
    // Создаем файлы с начальными данными, если их нет
    for (const [key, file] of Object.entries(dataFiles)) {
      try {
        await fs.access(file);
        console.log(`✅ Файл ${file} уже существует`);
      } catch {
        await fs.writeFile(file, JSON.stringify([]));
        console.log(`✅ Создан файл ${file}`);
      }
    }
  } catch (error) {
    console.error('❌ Ошибка создания папки data:', error);
  }
}

// Чтение данных из файла
async function readData(fileKey) {
  try {
    const data = await fs.readFile(dataFiles[fileKey], 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Ошибка чтения ${fileKey}:`, error);
    return [];
  }
}

// Запись данных в файл
async function writeData(fileKey, data) {
  try {
    await fs.writeFile(dataFiles[fileKey], JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Ошибка записи ${fileKey}:`, error);
    return false;
  }
}

// ✅ ПРОСТАЯ АУТЕНТИФИКАЦИЯ (без сложностей)
const JWT_SECRET = 'animal-chip-tracker-secret-key-2024';

// Middleware для проверки токена
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Недействительный токен' });
  }
}

// ✅ API ЭНДПОИНТЫ

// 1. Проверка сервера
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Сервер работает!',
    timestamp: new Date().toISOString()
  });
});

// 2. Регистрация пользователя
app.post('/api/register', async (req, res) => {
  try {
    console.log('📝 Регистрация пользователя:', req.body);
    
    const { fullName, phone, email, password } = req.body;
    
    // Простая валидация
    if (!fullName || !phone || !password) {
      return res.status(400).json({ error: 'Заполните обязательные поля: имя, телефон, пароль' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }
    
    // Читаем существующих пользователей
    const users = await readData('users');
    
    // Проверяем, есть ли пользователь с таким телефоном
    if (users.some(user => user.phone === phone)) {
      return res.status(400).json({ error: 'Пользователь с таким телефоном уже существует' });
    }
    
    // Хешируем пароль
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    // Создаем нового пользователя
    const newUser = {
      id: Date.now().toString(),
      fullName,
      phone,
      email: email || '',
      password: hashedPassword,
      registrationDate: new Date().toISOString()
    };
    
    console.log('👤 Создан пользователь:', { ...newUser, password: '******' });
    
    // Сохраняем
    users.push(newUser);
    await writeData('users', users);
    
    // Создаем токен
    const token = jwt.sign(
      { id: newUser.id, phone: newUser.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Возвращаем ответ (БЕЗ пароля!)
    const userResponse = { ...newUser };
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Регистрация успешна!',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// 3. Вход пользователя
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Попытка входа:', req.body);
    
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'Заполните телефон и пароль' });
    }
    
    // Ищем пользователя
    const users = await readData('users');
    const user = users.find(u => u.phone === phone);
    
    if (!user) {
      console.log('❌ Пользователь не найден:', phone);
      return res.status(401).json({ error: 'Неверный телефон или пароль' });
    }
    
    // Проверяем пароль
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      console.log('❌ Неверный пароль для пользователя:', phone);
      return res.status(401).json({ error: 'Неверный телефон или пароль' });
    }
    
    console.log('✅ Успешный вход пользователя:', user.fullName);
    
    // Создаем токен
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Возвращаем ответ (БЕЗ пароля!)
    const userResponse = { ...user };
    delete userResponse.password;
    
    res.json({
      success: true,
      message: 'Вход выполнен успешно!',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('❌ Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// 4. Получить данные текущего пользователя
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    console.log('👤 Получение данных пользователя:', req.user.id);
    
    const users = await readData('users');
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const userResponse = { ...user };
    delete userResponse.password;
    
    res.json({
      success: true,
      user: userResponse
    });
    
  } catch (error) {
    console.error('❌ Ошибка получения данных:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 5. Добавить питомца
app.post('/api/animals', authenticateToken, async (req, res) => {
  try {
    console.log('🐾 Добавление питомца пользователем:', req.user.id);
    
    const animalData = req.body;
    
    // Простая валидация
    if (!animalData.chipNumber || !animalData.petName || !animalData.species) {
      return res.status(400).json({ 
        error: 'Заполните обязательные поля: номер чипа, кличка, вид' 
      });
    }
    
    // Получаем данные пользователя
    const users = await readData('users');
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем уникальность номера чипа
    const animals = await readData('animals');
    if (animals.some(a => a.chipNumber === animalData.chipNumber)) {
      return res.status(400).json({ error: 'Животное с таким номером чипа уже существует' });
    }
    
    // Создаем запись животного
    const newAnimal = {
      id: Date.now().toString(),
      ...animalData,
      ownerId: user.id,
      ownerName: user.fullName,
      ownerPhone: user.phone,
      registrationDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    console.log('✅ Создано животное:', newAnimal);
    
    // Сохраняем
    animals.push(newAnimal);
    await writeData('animals', animals);
    
    // Добавляем активность
    const activities = await readData('activities');
    activities.unshift({
      id: Date.now().toString(),
      userId: user.id,
      message: `Добавлен питомец: ${animalData.petName}`,
      timestamp: new Date().toISOString(),
      type: 'animal_added'
    });
    await writeData('activities', activities.slice(0, 50)); // Храним только 50 последних
    
    res.status(201).json({
      success: true,
      message: 'Питомец успешно добавлен!',
      animal: newAnimal
    });
    
  } catch (error) {
    console.error('❌ Ошибка добавления питомца:', error);
    res.status(500).json({ error: 'Ошибка сервера при добавлении питомца' });
  }
});

// 6. Получить животных пользователя
app.get('/api/animals', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Получение животных пользователя:', req.user.id);
    
    const animals = await readData('animals');
    const userAnimals = animals.filter(a => a.ownerId === req.user.id);
    
    console.log(`✅ Найдено животных: ${userAnimals.length}`);
    
    res.json({
      success: true,
      animals: userAnimals
    });
    
  } catch (error) {
    console.error('❌ Ошибка получения животных:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении животных' });
  }
});

// 7. Получить одно животное по ID
app.get('/api/animals/:id', authenticateToken, async (req, res) => {
  try {
    const animalId = req.params.id;
    console.log(`🔍 Получение животного ${animalId} пользователем:`, req.user.id);
    
    const animals = await readData('animals');
    const animal = animals.find(a => a.id === animalId && a.ownerId === req.user.id);
    
    if (!animal) {
      return res.status(404).json({ error: 'Животное не найдено' });
    }
    
    res.json({
      success: true,
      animal
    });
    
  } catch (error) {
    console.error('❌ Ошибка получения животного:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 8. Обновить животное
app.put('/api/animals/:id', authenticateToken, async (req, res) => {
  try {
    const updateData = req.body;
    const animalId = req.params.id;
    
    console.log(`✏️ Обновление животного ${animalId}:`, updateData);
    
    // Получаем животных
    let animals = await readData('animals');
    const animalIndex = animals.findIndex(a => a.id === animalId && a.ownerId === req.user.id);
    
    if (animalIndex === -1) {
      return res.status(404).json({ error: 'Животное не найдено' });
    }
    
    // Обновляем данные (сохраняем неизменяемые поля)
    const originalAnimal = animals[animalIndex];
    const updatedAnimal = {
      ...originalAnimal,
      ...updateData,
      lastUpdated: new Date().toISOString()
    };
    
    // Номер чипа нельзя менять
    updatedAnimal.chipNumber = originalAnimal.chipNumber;
    
    // Сохраняем
    animals[animalIndex] = updatedAnimal;
    await writeData('animals', animals);
    
    // Добавляем активность
    const activities = await readData('activities');
    activities.unshift({
      id: Date.now().toString(),
      userId: req.user.id,
      message: `Обновлена информация о питомце: ${updatedAnimal.petName}`,
      timestamp: new Date().toISOString(),
      type: 'animal_updated'
    });
    await writeData('activities', activities.slice(0, 50));
    
    res.json({
      success: true,
      message: 'Информация обновлена успешно!',
      animal: updatedAnimal
    });
    
  } catch (error) {
    console.error('❌ Ошибка обновления животного:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении' });
  }
});

// 9. Удалить животное
app.delete('/api/animals/:id', authenticateToken, async (req, res) => {
  try {
    const animalId = req.params.id;
    console.log(`🗑️ Удаление животного ${animalId} пользователем:`, req.user.id);
    
    // Получаем животных
    let animals = await readData('animals');
    const animalIndex = animals.findIndex(a => a.id === animalId && a.ownerId === req.user.id);
    
    if (animalIndex === -1) {
      return res.status(404).json({ error: 'Животное не найдено' });
    }
    
    const deletedAnimal = animals[animalIndex];
    
    // Удаляем
    animals.splice(animalIndex, 1);
    await writeData('animals', animals);
    
    // Добавляем активность
    const activities = await readData('activities');
    activities.unshift({
      id: Date.now().toString(),
      userId: req.user.id,
      message: `Удален питомец: ${deletedAnimal.petName}`,
      timestamp: new Date().toISOString(),
      type: 'animal_deleted'
    });
    await writeData('activities', activities.slice(0, 50));
    
    res.json({
      success: true,
      message: 'Питомец успешно удален!'
    });
    
  } catch (error) {
    console.error('❌ Ошибка удаления животного:', error);
    res.status(500).json({ error: 'Ошибка сервера при удалении' });
  }
});

// 10. Получить активности пользователя
app.get('/api/activities', authenticateToken, async (req, res) => {
  try {
    console.log('📜 Получение активностей пользователя:', req.user.id);
    
    const activities = await readData('activities');
    const userActivities = activities
      .filter(a => a.userId === req.user.id)
      .slice(0, 20); // Только 20 последних
    
    res.json({
      success: true,
      activities: userActivities
    });
    
  } catch (error) {
    console.error('❌ Ошибка получения активностей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 11. Поиск животного по номеру чипа (публичный доступ)
app.get('/api/search/:chipNumber', async (req, res) => {
  try {
    const chipNumber = req.params.chipNumber;
    console.log(`🔎 Поиск животного по чипу: ${chipNumber}`);
    
    if (!chipNumber) {
      return res.status(400).json({ error: 'Укажите номер чипа' });
    }
    
    const animals = await readData('animals');
    const animal = animals.find(a => a.chipNumber === chipNumber);
    
    if (!animal) {
      return res.status(404).json({ error: 'Животное не найдено' });
    }
    
    // Возвращаем только публичную информацию
    const publicInfo = {
      petName: animal.petName,
      species: animal.species,
      breed: animal.breed,
      color: animal.color,
      ownerName: animal.ownerName,
      ownerPhone: animal.ownerPhone,
      chipNumber: animal.chipNumber
    };
    
    res.json({
      success: true,
      animal: publicInfo
    });
    
  } catch (error) {
    console.error('❌ Ошибка поиска:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 12. Главная страница (отдаем index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 13. Все остальные страницы
app.get('/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
  }
});

// Запуск сервера
async function startServer() {
  await initDataFolder();
  
  app.listen(PORT, () => {
    console.log(`
    🚀 Сервер запущен!
    🌐 Адрес: http://localhost:${PORT}
    📁 Данные хранятся в папке: ./data/
    📄 Файлы базы данных: users.json, animals.json, activities.json
    
    🎯 Доступные эндпоинты:
    GET    /api/health          - Проверка сервера
    POST   /api/register        - Регистрация
    POST   /api/login           - Вход
    GET    /api/me              - Данные пользователя
    POST   /api/animals         - Добавить питомца
    GET    /api/animals         - Мои питомцы
    GET    /api/animals/:id     - Получить питомца
    PUT    /api/animals/:id     - Обновить питомца
    DELETE /api/animals/:id     - Удалить питомца
    GET    /api/activities      - Активности
    GET    /api/search/:chip    - Поиск по чипу
    `);
  });
}

startServer();