// Тестируем нового бота VobvorotAdminBot
const BOT_TOKEN = '7700098378:AAEa-cUAEVbUdigyFK9m4PrkOhK-_1jfvQM';

async function testNewBot() {
  try {
    console.log('🤖 Тестируем нового бота VobvorotAdminBot...');
    console.log(`🔑 Token: ${BOT_TOKEN.substring(0, 20)}...`);
    
    // 1. Получаем информацию о боте
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const botInfo = await response.json();
    
    if (botInfo.ok) {
      console.log('✅ Бот подключен успешно!');
      console.log('📋 Информация о боте:');
      console.log(`   ID: ${botInfo.result.id}`);
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   First Name: ${botInfo.result.first_name}`);
      console.log(`   Can Join Groups: ${botInfo.result.can_join_groups}`);
      console.log(`   Can Read All Group Messages: ${botInfo.result.can_read_all_group_messages}`);
      console.log(`   Supports Inline Queries: ${botInfo.result.supports_inline_queries}`);
    } else {
      console.error('❌ Ошибка подключения к боту:', botInfo);
      return;
    }
    
    // 2. Устанавливаем команды бота
    const commandsResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: '🚀 Запустить бота' },
          { command: 'menu', description: '📱 Главное меню' },
          { command: 'help', description: '❓ Помощь' }
        ]
      })
    });
    
    const commandsResult = await commandsResponse.json();
    if (commandsResult.ok) {
      console.log('✅ Команды бота установлены');
    } else {
      console.error('❌ Ошибка установки команд:', commandsResult);
    }
    
    // 3. Очищаем pending updates
    console.log('\n🧹 Очищаем pending updates...');
    const clearResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
    const clearResult = await clearResponse.json();
    if (clearResult.ok) {
      console.log(`✅ Очищено ${clearResult.result.length} pending updates`);
    }
    
    // 4. Проверяем webhook (должен быть пустой)
    const webhookResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const webhookInfo = await webhookResponse.json();
    
    if (webhookInfo.ok) {
      console.log('\n📡 Информация о webhook:');
      console.log(`   URL: ${webhookInfo.result.url || 'НЕ УСТАНОВЛЕН'}`);
      console.log(`   Pending Updates: ${webhookInfo.result.pending_update_count}`);
      console.log(`   Last Error: ${webhookInfo.result.last_error_message || 'Нет ошибок'}`);
    }
    
    console.log('\n🎉 Новый бот готов к тестированию!');
    console.log('\n💡 Следующие шаги:');
    console.log('1. Найти @VobvorotAdminBot в Telegram');
    console.log('2. Отправить /start');
    console.log('3. Проверить появление главного меню');
    console.log('4. Если работает - установить webhook');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testNewBot();