-- ИСПРАВЛЕНИЕ: Добавляем отсутствующее поле emoji в таблицу categories
-- Выполните этот SQL в Railway Dashboard или через любой PostgreSQL клиент

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '📦';

-- Установим эмодзи для существующих категорий
UPDATE categories SET emoji = '👠' WHERE slug = 'shoes' OR name LIKE '%обув%';
UPDATE categories SET emoji = '👕' WHERE slug = 'clothing' OR name LIKE '%одежд%'; 
UPDATE categories SET emoji = '💍' WHERE slug = 'accessories' OR name LIKE '%аксессуар%';
UPDATE categories SET emoji = '👜' WHERE slug = 'bags' OR name LIKE '%сумк%';
UPDATE categories SET emoji = '🎩' WHERE slug = 'hats' OR name LIKE '%шляп%' OR name LIKE '%шапк%';
UPDATE categories SET emoji = '✨' WHERE slug = 'exvicpmour';

-- Проверка результата
SELECT id, name, slug, emoji FROM categories;