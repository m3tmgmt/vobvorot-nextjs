// Тестируем подключение к новому боту @VobvorotecomAdminBot
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function testBot() {
  try {
    console.log('🤖 Тестируем нового бота @VobvorotecomAdminBot...');
    console.log(`🔑 Token: ${BOT_TOKEN ? BOT_TOKEN.substring(0, 20) + '...' : 'НЕ НАЙДЕН'}`);
    
    // Получаем информацию о боте
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
      
      // Проверяем webhook
      const webhookResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const webhookInfo = await webhookResponse.json();
      
      if (webhookInfo.ok) {
        console.log('\n📡 Информация о webhook:');
        console.log(`   URL: ${webhookInfo.result.url || 'НЕ УСТАНОВЛЕН'}`);
        console.log(`   Pending Updates: ${webhookInfo.result.pending_update_count}`);
        console.log(`   Last Error: ${webhookInfo.result.last_error_date ? new Date(webhookInfo.result.last_error_date * 1000) : 'Нет ошибок'}`);
        console.log(`   Max Connections: ${webhookInfo.result.max_connections}`);
      }
      
    } else {
      console.error('❌ Ошибка подключения к боту:', botInfo);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testBot();