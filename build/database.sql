CREATE DATABASE animal_chip_tracker;
USE animal_chip_tracker;

-- Таблица пользователей
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица животных
CREATE TABLE animals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chip_number VARCHAR(50) UNIQUE NOT NULL,
    pet_name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    birth_date DATE,
    color VARCHAR(50),
    vaccinations TEXT,
    diseases TEXT,
    additional_info TEXT,
    owner_id INT,
    owner_name VARCHAR(100) NOT NULL,
    owner_phone VARCHAR(20) NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Пример данных
INSERT INTO users (full_name, phone, email, password) 
VALUES ('Иван Петров', '+79161234567', 'ivan@example.com', 'hashed_password_here');

INSERT INTO animals (chip_number, pet_name, species, breed, vaccinations, diseases, owner_name, owner_phone, owner_id)
VALUES ('CHIP-1234567890', 'Барсик', 'Кошка', 'Британская', 'Бешенство - 2023, Комплексная - 2024', 'Нет', 'Иван Петров', '+79161234567', 1);