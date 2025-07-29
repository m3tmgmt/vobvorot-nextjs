#!/usr/bin/env node

/**
 * Test script for AI assistant video functions
 * Tests: upload_home_video, view_home_video, delete_home_video,
 *        list_sign_videos, add_sign_video, delete_sign_video
 */

require('dotenv').config();

const WEBHOOK_URL = 'https://vobvorot.com/api/telegram/ai-assistant';
const ADMIN_CHAT_ID = '316593422';

// Тестовые команды для видео
const videoCommands = [
  {
    name: 'View home video',
    text: 'покажи видео главной страницы',
    expectedAction: 'view_home_video'
  },
  {
    name: 'Upload home video instruction',
    text: 'загрузи видео на главную',
    expectedAction: 'upload_home_video'
  },
  {
    name: 'Delete home video',
    text: 'удали видео с главной страницы',
    expectedAction: 'delete_home_video'
  },
  {
    name: 'List sign videos',
    text: 'покажи все видео подписей',
    expectedAction: 'list_sign_videos'
  },
  {
    name: 'Add sign video instruction',
    text: 'добавь новое видео подписей',
    expectedAction: 'add_sign_video'
  },
  {
    name: 'Delete specific sign video',
    text: 'удали видео подписей sign_video_123',
    expectedAction: 'delete_sign_video'
  }
];

async function sendMessage(text) {
  const update = {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: parseInt(ADMIN_CHAT_ID),
        first_name: 'Admin',
        username: 'admin'
      },
      chat: {
        id: parseInt(ADMIN_CHAT_ID),
        type: 'private'
      },
      date: Math.floor(Date.now() / 1000),
      text: text
    }
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    return { success: true, response: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testVideoFunctions() {
  console.log('🎬 Testing AI Assistant Video Functions\n');
  
  // Test each video command
  for (const cmd of videoCommands) {
    console.log(`\n📹 Testing: ${cmd.name}`);
    console.log(`   Command: "${cmd.text}"`);
    console.log(`   Expected action: ${cmd.expectedAction}`);
    
    const result = await sendMessage(cmd.text);
    
    if (result.success) {
      console.log('   ✅ Message sent successfully');
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }
    
    // Wait between messages
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n\n📊 Video Function Test Complete!');
  console.log('\nCheck your Telegram for responses.');
  console.log('\n🎯 Next steps:');
  console.log('1. Send actual video files with captions "главная" or "подписи"');
  console.log('2. Test video uploads and verify they appear on the website');
  console.log('3. Verify video deletion works correctly');
}

// Run tests
testVideoFunctions().catch(console.error);