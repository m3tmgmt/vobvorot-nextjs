require('dotenv').config();

// Тестирование синхронизации бота с API

async function testBotSync() {
  const baseUrl = 'http://localhost:3000'; // Принудительно используем локальный URL
  const adminApiKey = process.env.ADMIN_API_KEY;
  
  console.log('🔍 Тестирование синхронизации бота с API...');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Admin API Key: ${adminApiKey ? 'установлен' : 'НЕ установлен'}`);
  
  if (!adminApiKey) {
    console.log('❌ ADMIN_API_KEY не установлен в переменных окружения');
    return;
  }
  
  // Тест 1: Получение категорий
  console.log('\n1️⃣ Тестирование получения категорий...');
  try {
    const categoriesResponse = await fetch(`${baseUrl}/api/admin/categories-db`, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    });
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log(`✅ Получено категорий: ${categoriesData.categories?.length || 0}`);
      categoriesData.categories?.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug}) - товаров: ${cat.products?.length || 0}`);
      });
    } else {
      console.log(`❌ Ошибка получения категорий: ${categoriesResponse.status}`);
      console.log(await categoriesResponse.text());
    }
  } catch (error) {
    console.log(`❌ Ошибка запроса категорий: ${error.message}`);
  }
  
  // Тест 2: Получение товаров
  console.log('\n2️⃣ Тестирование получения товаров...');
  try {
    const productsResponse = await fetch(`${baseUrl}/api/admin/products-db`, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    });
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log(`✅ Получено товаров: ${productsData.products?.length || 0}`);
      productsData.products?.forEach(product => {
        console.log(`   - ${product.name} (${product.slug})`);
        console.log(`     Категория: ${product.category?.name || 'Нет'}`);
        console.log(`     SKU: ${product.skus?.length || 0} шт.`);
        if (product.skus && product.skus.length > 0) {
          const sku = product.skus[0];
          console.log(`     Цена: $${sku.price}, Склад: ${sku.stock} шт.`);
        }
      });
    } else {
      console.log(`❌ Ошибка получения товаров: ${productsResponse.status}`);
      console.log(await productsResponse.text());
    }
  } catch (error) {
    console.log(`❌ Ошибка запроса товаров: ${error.message}`);
  }
  
  // Тест 3: Создание товара через API (симуляция бота)
  console.log('\n3️⃣ Тестирование создания товара через API (симуляция бота)...');
  try {
    // Сначала получим ID категории EXVICPMOUR
    const categoriesResponse = await fetch(`${baseUrl}/api/admin/categories-db`, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`
      }
    });
    
    if (!categoriesResponse.ok) {
      console.log('❌ Не удалось получить категории для теста');
      return;
    }
    
    const categoriesData = await categoriesResponse.json();
    const exvicpmourCategory = categoriesData.categories?.find(cat => cat.name === 'EXVICPMOUR');
    
    if (!exvicpmourCategory) {
      console.log('❌ Категория EXVICPMOUR не найдена. Создание товара невозможно.');
      return;
    }
    
    console.log(`   Категория EXVICPMOUR найдена: ${exvicpmourCategory.id}`);
    
    // Создаем тестовый товар
    const testProductData = {
      name: 'Test Bot Product',
      description: 'Тестовый товар созданный через API бота',
      brand: 'EXVICPMOUR',
      categoryId: exvicpmourCategory.id,
      price: 99.99,
      stock: 10,
      weight: 0.5
    };
    
    const createResponse = await fetch(`${baseUrl}/api/admin/products-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify(testProductData)
    });
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Товар успешно создан через API!');
      console.log(`   ID: ${createData.product.id}`);
      console.log(`   Название: ${createData.product.name}`);
      console.log(`   Slug: ${createData.product.slug}`);
      console.log(`   SKU создан: ${createData.product.skus?.length > 0 ? 'Да' : 'Нет'}`);
    } else {
      console.log(`❌ Ошибка создания товара: ${createResponse.status}`);
      console.log(await createResponse.text());
    }
  } catch (error) {
    console.log(`❌ Ошибка создания товара: ${error.message}`);
  }
  
  console.log('\n✅ Тестирование завершено!');
}

testBotSync();