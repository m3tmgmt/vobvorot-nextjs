// Проверка порядка загрузки переменных окружения
console.log('🔍 Проверка переменных окружения\n')

// До загрузки
console.log('1️⃣ До загрузки dotenv:')
console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@') || 'не установлено')

// Загрузка .env
require('dotenv').config()
console.log('\n2️⃣ После загрузки .env:')
console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@') || 'не установлено')

// Загрузка .env.local с перезаписью
require('dotenv').config({ path: '.env.local', override: true })
console.log('\n3️⃣ После загрузки .env.local с override:')
console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@') || 'не установлено')

// Проверка других важных переменных
console.log('\n📋 Другие важные переменные:')
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ установлен' : '❌ не установлен')
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ установлен' : '❌ не установлен')
console.log('NODE_ENV:', process.env.NODE_ENV || 'не установлено')

// Проверка, какие файлы существуют
const fs = require('fs')
console.log('\n📁 Проверка файлов конфигурации:')
console.log('.env:', fs.existsSync('.env') ? '✅ существует' : '❌ не найден')
console.log('.env.local:', fs.existsSync('.env.local') ? '✅ существует' : '❌ не найден')
console.log('.env.production:', fs.existsSync('.env.production') ? '✅ существует' : '❌ не найден')