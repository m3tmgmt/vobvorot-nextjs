// Полная проверка всех полей во всех таблицах
const { Client } = require('pg');
const fs = require('fs');

async function verifyAllFields() {
  console.log('🔍 ПОЛНАЯ ПРОВЕРКА ВСЕХ ПОЛЕЙ ВО ВСЕХ ТАБЛИЦАХ\n');
  
  const client = new Client({
    connectionString: "postgresql://postgres.rrxkyqsqeumfmhxbtcty:VobvorotSecure2025@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });

  try {
    await client.connect();
    
    // Читаем Prisma схему для сравнения
    const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf8');
    
    // Мапинг Prisma типов на PostgreSQL
    const typeMapping = {
      'String': 'text',
      'String?': 'text',
      'Int': 'integer',
      'Int?': 'integer',
      'Boolean': 'boolean',
      'Boolean?': 'boolean',
      'DateTime': 'timestamp without time zone',
      'DateTime?': 'timestamp without time zone',
      'Decimal': 'numeric',
      'Decimal?': 'numeric',
      'BigInt': 'bigint',
      'BigInt?': 'bigint',
      'Json': 'jsonb',
      'Json?': 'jsonb'
    };
    
    // Парсим модели из схемы
    const models = schemaContent.match(/model\s+(\w+)\s*{[\s\S]*?^}/gm) || [];
    
    let allFieldsCorrect = true;
    let totalFieldsChecked = 0;
    let totalFieldsFound = 0;
    
    for (const modelBlock of models) {
      const modelNameMatch = modelBlock.match(/model\s+(\w+)/);
      if (!modelNameMatch) continue;
      
      const modelName = modelNameMatch[1];
      
      // Получаем имя таблицы
      const tableNameMatch = modelBlock.match(/@@map\("(\w+)"\)/);
      const tableName = tableNameMatch ? tableNameMatch[1] : 
        modelName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') + 's';
      
      // Специальные случаи для таблиц
      const specialTableNames = {
        'User': 'users',
        'Category': 'categories',
        'Address': 'addresses'
      };
      
      const actualTableName = specialTableNames[modelName] || tableName;
      
      console.log(`\n📋 Таблица: ${actualTableName} (модель: ${modelName})`);
      
      // Получаем поля из БД
      const dbFields = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [actualTableName]);
      
      const dbFieldsMap = {};
      dbFields.rows.forEach(field => {
        dbFieldsMap[field.column_name] = {
          type: field.data_type,
          nullable: field.is_nullable === 'YES'
        };
      });
      
      // Парсим поля из модели
      const fieldLines = modelBlock.split('\n').filter(line => 
        line.trim() && !line.includes('model') && !line.includes('{') && 
        !line.includes('}') && !line.includes('@@') && !line.includes('//')
      );
      
      let modelFieldsCount = 0;
      let modelFieldsFound = 0;
      
      for (const line of fieldLines) {
        const fieldMatch = line.match(/^\s*(\w+)\s+([\w\[\]]+\??)/);
        if (!fieldMatch) continue;
        
        const [, fieldName, fieldType] = fieldMatch;
        
        // Пропускаем отношения
        if (fieldType.includes('[') || ['Account', 'User', 'Category', 'Product', 'Order', 'ProductSku'].some(t => fieldType === t)) {
          continue;
        }
        
        modelFieldsCount++;
        totalFieldsChecked++;
        
        // Преобразуем имя поля в snake_case для БД
        const dbFieldName = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        
        if (dbFieldsMap[dbFieldName]) {
          modelFieldsFound++;
          totalFieldsFound++;
          console.log(`  ✅ ${fieldName} → ${dbFieldName}`);
        } else {
          console.log(`  ❌ ${fieldName} → ${dbFieldName} (НЕ НАЙДЕНО!)`);
          allFieldsCorrect = false;
        }
      }
      
      console.log(`  Проверено полей: ${modelFieldsFound}/${modelFieldsCount}`);
      
      // Проверяем лишние поля в БД
      const modelFieldNames = new Set();
      for (const line of fieldLines) {
        const fieldMatch = line.match(/^\s*(\w+)\s+/);
        if (fieldMatch) {
          const dbName = fieldMatch[1].replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
          modelFieldNames.add(dbName);
        }
      }
      
      const extraFields = Object.keys(dbFieldsMap).filter(f => !modelFieldNames.has(f));
      if (extraFields.length > 0) {
        console.log(`  ⚠️  Лишние поля в БД: ${extraFields.join(', ')}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 ИТОГОВАЯ СТАТИСТИКА:`);
    console.log(`Всего проверено полей: ${totalFieldsChecked}`);
    console.log(`Найдено в БД: ${totalFieldsFound}`);
    console.log(`Процент соответствия: ${((totalFieldsFound / totalFieldsChecked) * 100).toFixed(1)}%`);
    
    if (allFieldsCorrect && totalFieldsFound === totalFieldsChecked) {
      console.log('\n✅ ВСЕ ПОЛЯ СООТВЕТСТВУЮТ СХЕМЕ PRISMA!');
    } else {
      console.log('\n⚠️  Есть несоответствия между схемой и БД');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
  }
}

verifyAllFields();