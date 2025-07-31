// Временное исправление - убираем проверку emoji из API
const fs = require('fs');
const path = require('path');

console.log('🔧 Применяем временное исправление для API...\n');

// Файлы которые нужно пропатчить
const filesToPatch = [
  './src/app/api/products/route.ts',
  './src/app/page.tsx',
  './src/app/products/[slug]/page.tsx',
  './src/lib/telegram-bot.ts'
];

let patchedCount = 0;

filesToPatch.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Файл не найден: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Убираем emoji из include запросов Prisma
    content = content.replace(
      /category:\s*{\s*include:\s*{\s*_count:\s*true\s*}\s*}/g,
      'category: true'
    );
    
    // Убираем emoji из select запросов
    content = content.replace(
      /emoji:\s*true,?/g,
      ''
    );
    
    // Заменяем обращения к category.emoji на дефолтное значение
    content = content.replace(
      /category\.emoji/g,
      '(category.emoji || "📦")'
    );
    
    // Убираем emoji из деструктуризации
    content = content.replace(
      /const\s*{\s*([^}]*),?\s*emoji\s*,?\s*([^}]*)\s*}\s*=/g,
      'const { $1 $2 } ='
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Пропатчен: ${filePath}`);
      patchedCount++;
    } else {
      console.log(`ℹ️  Не требует изменений: ${filePath}`);
    }
    
  } catch (error) {
    console.log(`❌ Ошибка с файлом ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Готово! Пропатчено файлов: ${patchedCount}`);
console.log('\n🚀 Теперь выполните деплой:');
console.log('   npx vercel --prod --token yGHkW9HSoepeo4Q8ZnSBEKwn');