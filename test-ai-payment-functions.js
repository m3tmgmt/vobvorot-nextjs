// Тест платежных функций AI агента
// Node.js 18+ имеет встроенный fetch

const TEST_API_URL = 'https://vobvorot.com/api/telegram/ai-assistant'

async function testPaymentCommands() {
  console.log('🧪 Тестирование платежных функций AI агента...\n')

  const testCases = [
    {
      name: 'Проверка статуса платежа',
      message: 'проверь статус платежа 20250129-1234567',
      expected: 'check_payment_status'
    },
    {
      name: 'Информация о платеже',
      message: 'покажи информацию о платеже для заказа 20250129-1234567',
      expected: 'view_payment_info'
    },
    {
      name: 'Возврат платежа',
      message: 'сделай возврат для заказа 20250129-1234567 причина брак товара',
      expected: 'refund_payment',
      needConfirm: true
    },
    {
      name: 'Повторная попытка платежа',
      message: 'повтори платеж для заказа 20250129-1234567',
      expected: 'retry_payment'
    },
    {
      name: 'Частичный возврат',
      message: 'верни 500 рублей за заказ 20250129-1234567 причина повреждение при доставке',
      expected: 'refund_payment',
      needConfirm: true
    }
  ]

  // Имитация Telegram webhook для тестирования
  async function sendTelegramMessage(text) {
    const webhookPayload = {
      update_id: Math.floor(Math.random() * 1000000),
      message: {
        message_id: Math.floor(Math.random() * 1000000),
        from: {
          id: 316593422, // Admin ID
          is_bot: false,
          first_name: 'Test',
          username: 'testuser'
        },
        chat: {
          id: 316593422,
          first_name: 'Test',
          username: 'testuser',
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: text
      }
    }

    try {
      const response = await fetch(TEST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      })
      
      const result = await response.text()
      return { 
        status: response.status, 
        statusText: response.statusText,
        data: result 
      }
    } catch (error) {
      return { error: error.message }
    }
  }

  // Тестируем каждую команду
  for (const test of testCases) {
    console.log(`\n📋 Тест: ${test.name}`)
    console.log(`📝 Команда: "${test.message}"`)
    console.log(`✅ Ожидаемое действие: ${test.expected}`)
    if (test.needConfirm) {
      console.log(`⚠️  Требует подтверждения`)
    }
    
    const result = await sendTelegramMessage(test.message)
    console.log(`📊 Результат: ${result.status} ${result.statusText}`)
    
    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n\n✅ Тестирование завершено!')
  console.log('\n📝 Примечания:')
  console.log('- HTTP 200 означает успешную обработку команды')
  console.log('- Проверьте Telegram для просмотра ответов бота')
  console.log('- Для полного тестирования нужны реальные номера заказов из БД')
}

// Запускаем тесты
testPaymentCommands().catch(console.error)