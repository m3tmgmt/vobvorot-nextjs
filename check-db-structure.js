// Детальная проверка структуры БД
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStructure() {
  console.log('🔍 ДЕТАЛЬНАЯ ПРОВЕРКА СТРУКТУРЫ БД\n');
  
  try {
    // 1. Проверяем структуру таблицы categories
    console.log('📂 ТАБЛИЦА CATEGORIES:');
    const categoryColumns = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `;
    
    console.log('Поля:');
    categoryColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // 2. Проверяем структуру таблицы products
    console.log('\n📦 ТАБЛИЦА PRODUCTS:');
    const productColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `;
    
    console.log('Поля:');
    productColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 3. Проверяем структуру таблицы product_skus
    console.log('\n📏 ТАБЛИЦА PRODUCT_SKUS:');
    const skuColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'product_skus'
      ORDER BY ordinal_position
    `;
    
    console.log('Поля:');
    skuColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 4. Проверяем индексы
    console.log('\n🔍 ИНДЕКСЫ:');
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('categories', 'products', 'product_skus')
      ORDER BY tablename, indexname
    `;
    
    indexes.forEach(idx => {
      console.log(`- ${idx.tablename}.${idx.indexname}`);
    });
    
    // 5. Проверяем внешние ключи
    console.log('\n🔗 ВНЕШНИЕ КЛЮЧИ:');
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name IN ('products', 'product_skus')
    `;
    
    foreignKeys.forEach(fk => {
      console.log(`- ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    console.log('\n✅ Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStructure();