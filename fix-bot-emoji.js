// ВРЕМЕННОЕ РЕШЕНИЕ: Патч для бота чтобы работал без emoji
const fs = require('fs')

// Читаем файл бота
const botFile = './src/lib/telegram-bot.ts'
let content = fs.readFileSync(botFile, 'utf8')

// Заменяем обращения к emoji
content = content.replace(
  /\$\{category\.emoji\}/g,
  '${category.emoji || "📦"}'
)

// Убираем emoji из запросов Prisma (если есть)
content = content.replace(
  /include:\s*{\s*category:\s*true/g,
  'include: { category: { select: { id: true, name: true, slug: true } }'
)

// Сохраняем
fs.writeFileSync(botFile, content)
console.log('✅ Бот пропатчен! Теперь будет работать без поля emoji')

// Создаем также безопасную версию
fs.writeFileSync('./src/lib/telegram-bot-safe.ts', content)
console.log('✅ Создана безопасная версия: telegram-bot-safe.ts')