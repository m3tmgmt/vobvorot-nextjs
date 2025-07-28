// Тестируем нового бота на production
const PRODUCTION_URL = 'https://vobvorot-nextjs-in0kwgmt4-m3tmgmt-gmailcoms-projects.vercel.app';
const NEW_BOT_TOKEN = '7274106590:AAEu0baVLztVQO9YdnCjvo9fcb3SnMFQNe8';

async function testNewBotOnProduction() {
  try {
    console.log('🌐 Тестируем нового бота @VobvorotecomAdminBot на production...');
    console.log(`🔗 URL: ${PRODUCTION_URL}`);
    
    // 1. Проверяем информацию о боте напрямую
    console.log('\n📋 1. Информация о боте:');
    const botResponse = await fetch(`https://api.telegram.org/bot${NEW_BOT_TOKEN}/getMe`);
    const botInfo = await botResponse.json();
    
    if (botInfo.ok) {
      console.log('✅ Бот подключен:');
      console.log(`   ID: ${botInfo.result.id}`);
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   Name: ${botInfo.result.first_name}`);
    } else {
      console.error('❌ Ошибка получения информации о боте:', botInfo);
      return;
    }
    
    // 2. Проверяем webhook на production
    console.log('\n📡 2. Проверяем webhook на production:');
    const webhookResponse = await fetch(`${PRODUCTION_URL}/api/telegram/webhook?action=info`);
    const webhookResult = await webhookResponse.json();
    
    if (webhookResult.ok) {
      console.log('✅ Webhook настроен:');
      console.log(`   URL: ${webhookResult.result.url}`);
      console.log(`   Pending Updates: ${webhookResult.result.pending_update_count}`);
      console.log(`   Last Error: ${webhookResult.result.last_error_date || 'Нет ошибок'}`);
    } else {
      console.error('❌ Ошибка webhook:', webhookResult);
    }
    
    // 3. Устанавливаем webhook для нового бота
    console.log('\n🔧 3. Устанавливаем webhook для нового бота:');
    const setWebhookResponse = await fetch(`${PRODUCTION_URL}/api/telegram/webhook?action=set`);
    const setWebhookResult = await setWebhookResponse.json();
    
    if (setWebhookResult.ok) {
      console.log('✅ Webhook установлен успешно!');
    } else {
      console.error('❌ Ошибка установки webhook:', setWebhookResult);
    }
    
    // 4. Финальная проверка
    console.log('\n✅ 4. Финальная проверка:');
    const finalCheck = await fetch(`https://api.telegram.org/bot${NEW_BOT_TOKEN}/getWebhookInfo`);
    const finalInfo = await finalCheck.json();
    
    if (finalInfo.ok) {
      console.log('🎉 Webhook успешно настроен:');
      console.log(`   URL: ${finalInfo.result.url}`);
      console.log(`   Certificate: ${finalInfo.result.has_custom_certificate ? 'Да' : 'Нет'}`);
      console.log(`   Max Connections: ${finalInfo.result.max_connections}`);
      console.log(`   Allowed Updates: ${finalInfo.result.allowed_updates?.join(', ') || 'Все'}`);
    }
    
    console.log('\n🤖 Готово! Теперь можно тестировать бота:');
    console.log('1. Найти @VobvorotecomAdminBot в Telegram');
    console.log('2. Отправить /start');
    console.log('3. Проверить главное меню');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testNewBotOnProduction();