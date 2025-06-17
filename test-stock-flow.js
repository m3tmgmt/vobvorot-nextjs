// Комплексный тест полного цикла резервирования
const baseUrl = 'https://vobvorot.com'

async function testFullReservationFlow() {
  console.log('🚀 Запуск полного теста резервирования товаров')
  
  try {
    // 1. Получить состояние товаров ДО резервирования
    console.log('\n1️⃣ Проверка остатков ДО резервирования')
    const productsBefore = await fetch(`${baseUrl}/api/products`)
      .then(res => res.json())
    
    console.log('Товары до резервирования:')
    productsBefore.products.forEach(product => {
      console.log(`  - ${product.name}:`, product.skus.map(sku => 
        `stock: ${sku.stock}, reserved: ${sku.reservedStock || 0}, available: ${sku.availableStock || (sku.stock - (sku.reservedStock || 0))}`
      ))
    })
    
    // 2. Создать заказ для резервирования
    console.log('\n2️⃣ Создание заказа с резервированием')
    const testProduct = productsBefore.products[0]
    if (!testProduct) {
      throw new Error('Нет доступных товаров для тестирования')
    }
    
    const orderData = {
      shippingInfo: {
        email: 'test@vobvorot.com',
        phone: '+380123456789',
        country: 'UA'
      },
      paymentInfo: {
        method: 'westernbid_stripe'
      },
      items: [{
        product: {
          id: testProduct.id,
          name: testProduct.name,
          price: testProduct.skus[0].price,
          images: testProduct.images || [{ url: '/test.jpg', alt: 'Test' }]
        },
        quantity: 1,
        selectedSize: testProduct.skus[0].size,
        selectedColor: testProduct.skus[0].color
      }],
      subtotal: testProduct.skus[0].price,
      shippingCost: 0,
      tax: 0,
      total: testProduct.skus[0].price
    }
    
    const orderResponse = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
    
    const orderResult = await orderResponse.json()
    
    console.log('Order response status:', orderResponse.status)
    console.log('Order response data:', JSON.stringify(orderResult, null, 2))
    
    if (orderResponse.ok) {
      console.log('✅ Заказ создан успешно:', orderResult.orderNumber)
      console.log('💳 Payment URL:', !!orderResult.paymentUrl)
    } else {
      console.log('❌ Ошибка создания заказа:', orderResult.error)
      
      if (orderResult.error === 'Insufficient stock') {
        console.log('📦 Недостаточно товаров:', orderResult.insufficientStock)
        return
      }
      
      throw new Error(`Не удалось создать заказ: ${orderResult.error}`)
    }
    
    // 3. Проверить состояние товаров ПОСЛЕ резервирования
    console.log('\n3️⃣ Проверка остатков ПОСЛЕ резервирования (через 2 секунды)')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const productsAfter = await fetch(`${baseUrl}/api/products`)
      .then(res => res.json())
    
    console.log('Товары после резервирования:')
    productsAfter.products.forEach(product => {
      console.log(`  - ${product.name}:`, product.skus.map(sku => 
        `stock: ${sku.stock}, reserved: ${sku.reservedStock || 0}, available: ${sku.availableStock || (sku.stock - (sku.reservedStock || 0))}`
      ))
    })
    
    // 4. Сравнить изменения
    console.log('\n4️⃣ Анализ изменений')
    const beforeProduct = productsBefore.products.find(p => p.id === testProduct.id)
    const afterProduct = productsAfter.products.find(p => p.id === testProduct.id)
    
    if (beforeProduct && afterProduct) {
      const beforeAvailable = beforeProduct.skus[0].availableStock || (beforeProduct.skus[0].stock - (beforeProduct.skus[0].reservedStock || 0))
      const afterAvailable = afterProduct.skus[0].availableStock || (afterProduct.skus[0].stock - (afterProduct.skus[0].reservedStock || 0))
      
      console.log(`Изменение доступных остатков: ${beforeAvailable} → ${afterAvailable}`)
      
      if (afterAvailable === beforeAvailable - 1) {
        console.log('✅ РЕЗЕРВИРОВАНИЕ РАБОТАЕТ КОРРЕКТНО!')
      } else {
        console.log('❌ Резервирование не изменило доступные остатки')
      }
    }
    
    // 5. Очистить просроченные резервирования (опционально)
    console.log('\n5️⃣ Очистка просроченных резервирований для следующих тестов')
    const cleanupResponse = await fetch(`${baseUrl}/api/cron/cleanup-reservations`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dev-secret'
      }
    })
    
    if (cleanupResponse.ok) {
      const cleanupResult = await cleanupResponse.json()
      console.log('🧹 Очистка выполнена:', cleanupResult)
    }
    
    console.log('\n🎉 Тест завершен успешно!')
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message)
  }
}

// Запуск теста
testFullReservationFlow()