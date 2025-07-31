#!/usr/bin/env node

// АБСОЛЮТНЫЙ АНАЛИЗ: Проверка webhook конфигурации

const BOT_TOKEN = '7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI';

async function checkWebhook() {
  console.log('🔍 АБСОЛЮТНЫЙ АНАЛИЗ WEBHOOK КОНФИГУРАЦИИ');
  console.log('==========================================');
  
  try {
    // 1. Получаем текущий webhook
    const webhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
    const response = await fetch(webhookUrl);
    const data = await response.json();
    
    console.log('\n📡 ТЕКУЩИЙ WEBHOOK:');
    console.log('URL:', data.result.url || 'НЕ УСТАНОВЛЕН!');
    console.log('Pending updates:', data.result.pending_update_count || 0);
    console.log('Has secret token:', data.result.has_custom_certificate || false);
    console.log('Last error:', data.result.last_error_message || 'Нет ошибок');
    console.log('Last error date:', data.result.last_error_date ? new Date(data.result.last_error_date * 1000) : 'Нет');
    
    if (!data.result.url) {
      console.log('\n❌ WEBHOOK НЕ УСТАНОВЛЕН! Это объясняет почему бот не отвечает!');
    } else if (data.result.url.includes('ai-assistant')) {
      console.log('\n❌ WEBHOOK УКАЗЫВАЕТ НА AI-ASSISTANT! Нужно обновить!');
    } else if (!data.result.url.includes('/api/telegram/webhook')) {
      console.log('\n⚠️ WEBHOOK НЕ СООТВЕТСТВУЕТ ОЖИДАЕМОМУ ПУТИ!');
    }
    
    // 2. Проверяем информацию о боте
    console.log('\n🤖 ИНФОРМАЦИЯ О БОТЕ:');
    const meUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getMe`;
    const meResponse = await fetch(meUrl);
    const meData = await meResponse.json();
    
    if (meData.ok) {
      console.log('ID:', meData.result.id);
      console.log('Username:', '@' + meData.result.username);
      console.log('Name:', meData.result.first_name);
      console.log('Can join groups:', meData.result.can_join_groups);
      console.log('Can read messages:', meData.result.can_read_all_group_messages);
      console.log('Supports inline:', meData.result.supports_inline_queries);
    } else {
      console.log('❌ Ошибка получения информации о боте:', meData.description);
    }
    
    // 3. Анализ и рекомендации
    console.log('\n🎯 АНАЛИЗ ПРОБЛЕМЫ:');
    
    if (!data.result.url) {
      console.log('1. Webhook не установлен - бот не может получать сообщения');
      console.log('2. Нужно установить webhook на правильный URL после деплоя');
      console.log('3. URL должен быть: https://vobvorot.com/api/telegram/webhook');
    }
    
    if (data.result.pending_update_count > 0) {
      console.log(`⚠️ Есть ${data.result.pending_update_count} необработанных обновлений`);
    }
    
    console.log('\n🔧 РЕШЕНИЕ:');
    console.log('После завершения деплоя нужно выполнить:');
    console.log('curl -X POST https://api.telegram.org/bot' + BOT_TOKEN + '/setWebhook \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"url":"https://vobvorot.com/api/telegram/webhook","secret_token":"vobvorot_webhook_secret_2025"}\'');
    
  } catch (error) {
    console.error('❌ Ошибка проверки:', error);
  }
}

checkWebhook();