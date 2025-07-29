// ============================================
// 🧪 ТЕСТИРОВАНИЕ ЛОГИКИ AI АССИСТЕНТА 
// ============================================
// Прямое тестирование AI анализа без сервера
// ============================================

const { GoogleGenerativeAI } = require('@google/generative-ai')

// Конфигурация
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDAh5xXaQwFNDHq-N9kTlNxtOB9fVmIvxA'

// Инициализация Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// System prompt из route.ts
const SYSTEM_PROMPT = `Ты AI ассистент магазина VOBVOROT. Анализируй сообщения и возвращай JSON с действием.

ВАЖНО: Возвращай ТОЛЬКО валидный JSON без дополнительного текста!

Формат ответа:
{
  "action": "string",
  "params": {},
  "needConfirm": boolean
}

Доступные действия:
- view_orders: показать заказы (params: {filter?: "today"|"week"|"month"|"all", status?: string})
- add_product: добавить товар (params: {name: string, price: number, category?: string})
- search_customer: найти клиента (params: {query: string})
- stats: статистика (params: {period?: "today"|"week"|"month"|"all"})
- search_product: найти товар (params: {query: string})
- update_order_status: изменить статус заказа (params: {orderId: number, status: string})
- add_category: создать категорию (params: {name: string, emoji?: string})
- view_categories: показать категории (params: {})
- upload_home_video: загрузить видео на главную (params: {})
- view_home_video: показать видео главной (params: {})
- delete_home_video: удалить видео главной (params: {})
- list_sign_videos: показать видео подписей (params: {})
- add_sign_video: добавить видео подписей (params: {})
- delete_sign_video: удалить видео подписей (params: {videoId: string})
- refund_payment: возврат платежа (params: {orderId: string, reason: string, amount?: number})
- check_payment_status: проверить статус платежа (params: {orderId: string})
- retry_payment: повторить платеж (params: {orderId: string})
- view_payment_info: информация о платеже (params: {orderId: string})
- send_test_email: отправить тестовое письмо (params: {email: string})
- send_order_notification: отправить уведомление о заказе (params: {orderId: string, type?: "confirmation"|"status-update"})
- send_shipping_notification: отправить трек-номер (params: {orderId: string, trackingNumber: string, carrier?: string})
- send_bulk_emails: массовая рассылка уведомлений (params: {type: string, orderIds?: string[], status?: string, dateFrom?: string, dateTo?: string})
- send_marketing_campaign: маркетинговая рассылка (params: {subject: string, content: string, customerIds?: string[], onlyRecentCustomers?: boolean, daysBack?: number})
- get_email_statistics: статистика email (params: {dateFrom?: string, dateTo?: string})
- calculate_shipping: рассчитать доставку (params: {orderId: string, packageType?: "box"|"package", currency?: "UAH"|"USD"})
- check_shipping: проверить доставку в страну (params: {countryCode: string, weight?: number})
- update_tracking: обновить трек-номер (params: {orderId: string, trackingNumber: string, carrier?: string})
- get_delivery_status: статус доставки (params: {orderId: string})
- get_shipping_zones: зоны доставки (params: {})
- calculate_bulk_shipping: массовый расчет доставки (params: {orderIds: string[], packageType?: "box"|"package", currency?: "UAH"|"USD"})
- view_logs: просмотр логов (params: {filter?: "errors"|"recent"|"user", userId?: string, dateFrom?: string, dateTo?: string})
- view_statistics: статистика использования (params: {dateFrom?: string, dateTo?: string})
- export_logs: экспорт логов (params: {format?: "csv"|"json", dateFrom?: string, dateTo?: string})
- cleanup_logs: очистка старых логов (params: {daysToKeep?: number})
- unknown: непонятная команда (params: {})

Примеры:
"покажи заказы" → {"action":"view_orders","params":{},"needConfirm":false}
"заказы за сегодня" → {"action":"view_orders","params":{"filter":"today"},"needConfirm":false}
"добавь платье за 2000" → {"action":"add_product","params":{"name":"платье","price":2000},"needConfirm":false}
"найди марию" → {"action":"search_customer","params":{"query":"мария"},"needConfirm":false}
"статистика за неделю" → {"action":"stats","params":{"period":"week"},"needConfirm":false}
"найди товар юбка" → {"action":"search_product","params":{"query":"юбка"},"needConfirm":false}
"измени статус заказа 123 на отправлен" → {"action":"update_order_status","params":{"orderId":123,"status":"отправлен"},"needConfirm":true}
"создай категорию одежда" → {"action":"add_category","params":{"name":"одежда"},"needConfirm":false}
"загрузи видео на главную" → {"action":"upload_home_video","params":{},"needConfirm":false}
"покажи видео главной" → {"action":"view_home_video","params":{},"needConfirm":false}
"удали видео главной" → {"action":"delete_home_video","params":{},"needConfirm":true}
"покажи видео подписей" → {"action":"list_sign_videos","params":{},"needConfirm":false}
"добавь видео подписей" → {"action":"add_sign_video","params":{},"needConfirm":false}
"удали видео подписей 123" → {"action":"delete_sign_video","params":{"videoId":"123"},"needConfirm":true}
"сделай возврат для заказа 123 причина брак" → {"action":"refund_payment","params":{"orderId":"123","reason":"брак"},"needConfirm":true}
"проверь статус платежа 456" → {"action":"check_payment_status","params":{"orderId":"456"},"needConfirm":false}
"повтори платеж для заказа 789" → {"action":"retry_payment","params":{"orderId":"789"},"needConfirm":false}
"информация о платеже 234" → {"action":"view_payment_info","params":{"orderId":"234"},"needConfirm":false}
"отправь тестовое письмо на test@example.com" → {"action":"send_test_email","params":{"email":"test@example.com"},"needConfirm":false}
"отправь уведомление о заказе 123" → {"action":"send_order_notification","params":{"orderId":"123"},"needConfirm":false}
"отправь трек-номер ABC123 для заказа 456" → {"action":"send_shipping_notification","params":{"orderId":"456","trackingNumber":"ABC123"},"needConfirm":false}
"сделай рассылку подтверждений за сегодня" → {"action":"send_bulk_emails","params":{"type":"confirmation","dateFrom":"today"},"needConfirm":true}
"отправь маркетинговое письмо всем: Скидка 20%" → {"action":"send_marketing_campaign","params":{"subject":"Скидка 20%","content":"Скидка 20%"},"needConfirm":true}
"покажи статистику email за месяц" → {"action":"get_email_statistics","params":{"dateFrom":"month"},"needConfirm":false}
"рассчитай доставку для заказа 789" → {"action":"calculate_shipping","params":{"orderId":"789"},"needConfirm":false}
"можно доставить в США" → {"action":"check_shipping","params":{"countryCode":"US"},"needConfirm":false}
"обнови трек-номер для заказа 123: RU123456789CN" → {"action":"update_tracking","params":{"orderId":"123","trackingNumber":"RU123456789CN"},"needConfirm":false}
"статус доставки заказа 456" → {"action":"get_delivery_status","params":{"orderId":"456"},"needConfirm":false}
"покажи зоны доставки" → {"action":"get_shipping_zones","params":{},"needConfirm":false}
"рассчитай доставку для заказов 123 456 789" → {"action":"calculate_bulk_shipping","params":{"orderIds":["123","456","789"]},"needConfirm":false}
"покажи логи ошибок" → {"action":"view_logs","params":{"filter":"errors"},"needConfirm":false}
"статистика за неделю" → {"action":"view_statistics","params":{"dateFrom":"week"},"needConfirm":false}
"экспорт логов в csv" → {"action":"export_logs","params":{"format":"csv"},"needConfirm":false}
"очистить логи старше 30 дней" → {"action":"cleanup_logs","params":{"daysToKeep":30},"needConfirm":true}

ВАЖНО: needConfirm должен быть true для критичных операций:
- update_order_status (изменение статуса заказа)
- delete_product (удаление товара) 
- delete_order (удаление заказа)
- send_mass_message (массовая рассылка)
- refund_payment (возврат платежа)
- delete_home_video (удаление видео главной)
- delete_sign_video (удаление видео подписей)
- send_bulk_emails (массовая рассылка email)
- send_marketing_campaign (маркетинговая рассылка)
- calculate_bulk_shipping (массовый расчет доставки)
- cleanup_logs (очистка логов)`

// AI анализ сообщения (копия из route.ts)
async function analyzeMessage(text) {
  try {
    const prompt = `${SYSTEM_PROMPT}\n\nСообщение пользователя: "${text}"\n\nОтвет JSON:`
    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()
    
    // Очистка ответа от возможных markdown блоков
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    
    return JSON.parse(cleanedText)
  } catch (error) {
    console.error('AI analysis error:', error.message)
    return { action: 'unknown', params: {}, needConfirm: false }
  }
}

// Тестовые случаи
const testCases = [
  // Управление заказами
  { input: 'покажи заказы', expected: { action: 'view_orders', params: {}, needConfirm: false } },
  { input: 'заказы за сегодня', expected: { action: 'view_orders', params: { filter: 'today' }, needConfirm: false } },
  { input: 'заказы за неделю', expected: { action: 'view_orders', params: { filter: 'week' }, needConfirm: false } },
  { input: 'заказы за месяц', expected: { action: 'view_orders', params: { filter: 'month' }, needConfirm: false } },
  { input: 'измени статус заказа 123 на отправлен', expected: { action: 'update_order_status', params: { orderId: 123, status: 'отправлен' }, needConfirm: true } },
  
  // Управление товарами
  { input: 'добавь платье за 2500', expected: { action: 'add_product', params: { name: 'платье', price: 2500 }, needConfirm: false } },
  { input: 'найди товар юбка', expected: { action: 'search_product', params: { query: 'юбка' }, needConfirm: false } },
  
  // Управление категориями
  { input: 'создай категорию одежда', expected: { action: 'add_category', params: { name: 'одежда' }, needConfirm: false } },
  { input: 'покажи категории', expected: { action: 'view_categories', params: {}, needConfirm: false } },
  
  // CRM
  { input: 'найди клиента мария', expected: { action: 'search_customer', params: { query: 'мария' }, needConfirm: false } },
  { input: 'найди покупателя по email test@mail.ru', expected: { action: 'search_customer', params: { query: 'test@mail.ru' }, needConfirm: false } },
  
  // Статистика
  { input: 'покажи статистику', expected: { action: 'stats', params: {}, needConfirm: false } },
  { input: 'статистика за неделю', expected: { action: 'stats', params: { period: 'week' }, needConfirm: false } },
  
  // Видео
  { input: 'загрузи видео на главную', expected: { action: 'upload_home_video', params: {}, needConfirm: false } },
  { input: 'покажи видео главной', expected: { action: 'view_home_video', params: {}, needConfirm: false } },
  { input: 'удали видео главной', expected: { action: 'delete_home_video', params: {}, needConfirm: true } },
  { input: 'покажи видео подписей', expected: { action: 'list_sign_videos', params: {}, needConfirm: false } },
  
  // Платежи
  { input: 'сделай возврат для заказа 123 причина брак', expected: { action: 'refund_payment', params: { orderId: '123', reason: 'брак' }, needConfirm: true } },
  { input: 'проверь статус платежа 456', expected: { action: 'check_payment_status', params: { orderId: '456' }, needConfirm: false } },
  { input: 'повтори платеж для заказа 789', expected: { action: 'retry_payment', params: { orderId: '789' }, needConfirm: false } },
  
  // Email
  { input: 'отправь тестовое письмо на test@example.com', expected: { action: 'send_test_email', params: { email: 'test@example.com' }, needConfirm: false } },
  { input: 'отправь уведомление о заказе 123', expected: { action: 'send_order_notification', params: { orderId: '123' }, needConfirm: false } },
  { input: 'отправь трек-номер ABC123 для заказа 456', expected: { action: 'send_shipping_notification', params: { orderId: '456', trackingNumber: 'ABC123' }, needConfirm: false } },
  
  // Доставка
  { input: 'рассчитай доставку для заказа 789', expected: { action: 'calculate_shipping', params: { orderId: '789' }, needConfirm: false } },
  { input: 'можно доставить в США', expected: { action: 'check_shipping', params: { countryCode: 'US' }, needConfirm: false } },
  { input: 'статус доставки заказа 456', expected: { action: 'get_delivery_status', params: { orderId: '456' }, needConfirm: false } },
  { input: 'покажи зоны доставки', expected: { action: 'get_shipping_zones', params: {}, needConfirm: false } },
  
  // Логирование
  { input: 'покажи логи ошибок', expected: { action: 'view_logs', params: { filter: 'errors' }, needConfirm: false } },
  { input: 'статистика использования за неделю', expected: { action: 'view_statistics', params: { dateFrom: 'week' }, needConfirm: false } },
  { input: 'экспорт логов в csv', expected: { action: 'export_logs', params: { format: 'csv' }, needConfirm: false } },
  { input: 'очистить логи старше 30 дней', expected: { action: 'cleanup_logs', params: { daysToKeep: 30 }, needConfirm: true } },
  
  // Крайние случаи
  { input: 'привет', expected: { action: 'unknown', params: {}, needConfirm: false } },
  { input: 'что ты умеешь?', expected: { action: 'unknown', params: {}, needConfirm: false } },
  { input: '123', expected: { action: 'unknown', params: {}, needConfirm: false } }
]

// Функция сравнения объектов
function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

// Функция для красивого вывода
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

// Главная функция тестирования
async function runTests() {
  console.log(`${colors.magenta}`)
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║       🧪 ТЕСТИРОВАНИЕ AI ЛОГИКИ БОТА            ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`${colors.reset}`)
  console.log(`📅 Дата: ${new Date().toLocaleString('ru-RU')}`)
  console.log(`🤖 AI модель: Gemini 1.5 Flash`)
  console.log(`📝 Всего тестов: ${testCases.length}`)
  console.log('─'.repeat(52))
  
  let passed = 0
  let failed = 0
  const startTime = Date.now()
  
  // Группировка тестов
  const groups = {
    'Заказы': testCases.slice(0, 5),
    'Товары': testCases.slice(5, 7),
    'Категории': testCases.slice(7, 9),
    'CRM': testCases.slice(9, 11),
    'Статистика': testCases.slice(11, 13),
    'Видео': testCases.slice(13, 17),
    'Платежи': testCases.slice(17, 20),
    'Email': testCases.slice(20, 23),
    'Доставка': testCases.slice(23, 27),
    'Логирование': testCases.slice(27, 31),
    'Крайние случаи': testCases.slice(31)
  }
  
  // Тестирование по группам
  for (const [groupName, tests] of Object.entries(groups)) {
    console.log(`\n${colors.cyan}📂 ${groupName}:${colors.reset}`)
    
    for (const test of tests) {
      process.stdout.write(`  • "${test.input}"... `)
      
      try {
        const result = await analyzeMessage(test.input)
        
        // Сравнение результата
        const isActionCorrect = result.action === test.expected.action
        const isParamsCorrect = deepEqual(result.params, test.expected.params)
        const isConfirmCorrect = result.needConfirm === test.expected.needConfirm
        
        if (isActionCorrect && isParamsCorrect && isConfirmCorrect) {
          console.log(`${colors.green}✅ PASS${colors.reset}`)
          passed++
        } else {
          console.log(`${colors.red}❌ FAIL${colors.reset}`)
          console.log(`    Ожидалось: ${JSON.stringify(test.expected)}`)
          console.log(`    Получено:  ${JSON.stringify(result)}`)
          failed++
        }
        
        // Задержка для избежания лимитов API
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.log(`${colors.red}❌ ERROR${colors.reset}`)
        console.log(`    Ошибка: ${error.message}`)
        failed++
      }
    }
  }
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  // Итоговая статистика
  console.log('\n' + '═'.repeat(52))
  console.log(`${colors.cyan}📊 ИТОГИ ТЕСТИРОВАНИЯ${colors.reset}`)
  console.log('─'.repeat(52))
  console.log(`⏱️  Время: ${duration} сек`)
  console.log(`${colors.green}✅ Успешно: ${passed} (${((passed/testCases.length)*100).toFixed(1)}%)${colors.reset}`)
  console.log(`${colors.red}❌ Провалено: ${failed} (${((failed/testCases.length)*100).toFixed(1)}%)${colors.reset}`)
  
  // Анализ результатов
  console.log('\n💡 Анализ:')
  console.log('─'.repeat(52))
  
  if (failed === 0) {
    console.log(`${colors.green}✨ Отлично! AI корректно распознает все команды.${colors.reset}`)
  } else if (failed < testCases.length * 0.1) {
    console.log(`${colors.yellow}⚠️  AI работает хорошо, но есть небольшие проблемы.${colors.reset}`)
  } else {
    console.log(`${colors.red}🚨 AI требует доработки промптов!${colors.reset}`)
  }
  
  // Рекомендации по проблемным категориям
  if (failed > 0) {
    console.log('\n📌 Рекомендации:')
    console.log('• Проверьте промпты для неудачных тестов')
    console.log('• Добавьте больше примеров в SYSTEM_PROMPT')
    console.log('• Убедитесь в корректности параметров')
  }
  
  console.log('\n' + '═'.repeat(52))
}

// Запуск тестов
if (require.main === module) {
  runTests().catch(error => {
    console.error(`${colors.red}Критическая ошибка: ${error.message}${colors.reset}`)
    process.exit(1)
  })
}

module.exports = { analyzeMessage, testCases }