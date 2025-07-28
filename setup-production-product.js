// Создание товара Lv на продакшне через новый API
require('dotenv').config();

async function setupProductionProduct() {
  const baseUrl = 'https://vobvorot-nextjs-h0m4yna15-m3tmgmt-gmailcoms-projects.vercel.app';
  const adminApiKey = process.env.ADMIN_API_KEY || 'admin_secret_key_2024';
  
  console.log('🚀 Настройка товара на продакшне...');
  console.log(`URL: ${baseUrl}`);
  
  try {
    // 1. Сначала создадим категорию EXVICPMOUR
    console.log('\n1️⃣ Создание категории EXVICPMOUR...');
    const categoryResponse = await fetch(`${baseUrl}/api/admin/categories-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify({
        name: 'EXVICPMOUR',
        description: 'Коллекция EXVICPMOUR'
      })
    });
    
    let categoryId;
    if (categoryResponse.ok) {
      const categoryData = await categoryResponse.json();
      categoryId = categoryData.category.id;
      console.log(`✅ Категория создана: ${categoryId}`);
    } else {
      // Возможно категория уже существует, попробуем получить
      console.log('❓ Категория может уже существовать, пробуем получить...');
      const getCategoriesResponse = await fetch(`${baseUrl}/api/admin/categories-db`, {
        headers: {
          'Authorization': `Bearer ${adminApiKey}`
        }
      });
      
      if (getCategoriesResponse.ok) {
        const categoriesData = await getCategoriesResponse.json();
        const exvicpmourCategory = categoriesData.categories?.find(cat => cat.name === 'EXVICPMOUR');
        if (exvicpmourCategory) {
          categoryId = exvicpmourCategory.id;
          console.log(`✅ Найдена существующая категория: ${categoryId}`);
        } else {
          console.log('❌ Не удалось найти или создать категорию EXVICPMOUR');
          console.log(await categoryResponse.text());
          return;
        }
      } else {
        console.log('❌ Ошибка получения категорий');
        console.log(await getCategoriesResponse.text());
        return;
      }
    }
    
    // 2. Теперь создадим товар Lv
    console.log('\n2️⃣ Создание товара Lv...');
    const productData = {
      name: 'Lv',
      description: 'Supa dupa',
      brand: 'EXVICPMOUR',
      categoryId: categoryId,
      price: 1.00,
      stock: 5,
      weight: 0.5
    };
    
    const productResponse = await fetch(`${baseUrl}/api/admin/products-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminApiKey}`
      },
      body: JSON.stringify(productData)
    });
    
    if (productResponse.ok) {
      const productResult = await productResponse.json();
      console.log('✅ Товар Lv создан успешно!');
      console.log(`   ID: ${productResult.product.id}`);
      console.log(`   Название: ${productResult.product.name}`);
      console.log(`   Slug: ${productResult.product.slug}`);
    } else {
      console.log('❌ Ошибка создания товара');
      console.log(`Статус: ${productResponse.status}`);
      console.log(await productResponse.text());
      return;
    }
    
    // 3. Проверим что товар появился в основном API
    console.log('\n3️⃣ Проверка товара через основной API...');
    const checkResponse = await fetch(`${baseUrl}/api/products`);
    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log(`✅ API товаров работает: ${checkData.products?.length || 0} товаров`);
      
      const lvProduct = checkData.products?.find(p => p.name === 'Lv');
      if (lvProduct) {
        console.log('✅ Товар "Lv" найден в основном API!');
        console.log(`   Цена: $${lvProduct.skus?.[0]?.price || 'неизвестно'}`);
        console.log(`   Склад: ${lvProduct.skus?.[0]?.stock || 'неизвестно'} шт.`);
      } else {
        console.log('❌ Товар "Lv" НЕ найден в основном API');
      }
    } else {
      console.log('❌ Основной API товаров не работает');
      console.log(await checkResponse.text());
    }
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
  
  console.log('\n🎉 Настройка завершена!');
}

setupProductionProduct();