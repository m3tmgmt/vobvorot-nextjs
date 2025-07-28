// Простой тест для проверки функции sendShippingNotification
const { sendShippingNotification } = require('./src/lib/email.ts')

async function testShippingEmail() {
  try {
    console.log('🧪 Testing shipping notification email...')
    
    await sendShippingNotification(
      'EXV-123456789-TEST',
      'test@example.com', 
      'John Doe',
      '1Z9999999999999999',
      'UPS',
      'en'
    )
    
    console.log('✅ Shipping notification email test passed!')
  } catch (error) {
    console.error('❌ Shipping notification email test failed:', error.message)
  }
}

// Раскомментируйте для запуска теста:
// testShippingEmail()

console.log(`
📧 Функция sendShippingNotification готова!

Использование:
import { sendShippingNotification } from '@/lib/email'

await sendShippingNotification(
  'EXV-123456789-TEST',    // orderNumber
  'customer@email.com',    // customerEmail  
  'John Doe',              // customerName
  '1Z9999999999999999',    // trackingNumber
  'UPS',                   // carrier (optional)
  'en'                     // language (optional, default: 'en')
)

Поддерживаемые службы доставки:
- UPS
- FedEx  
- USPS
- DHL
- Nova Poshta
- Ukrposhta
- Meest

Email включает:
✅ Красивый дизайн с gradient кнопками
✅ Трек-номер с автоматической ссылкой для отслеживания
✅ Информацию о заказе
✅ Инструкции по доставке
✅ Мультиязычность (EN/RU)
✅ Responsive дизайн
`)