# 🎬 AI Agent Video Functions Documentation

## Overview
The AI assistant now includes comprehensive video management functionality for VOBVOROT. This allows admins to manage videos directly through natural language commands in Telegram.

## Video Functions Implemented

### 1. Home Page Video Management
- **Upload Home Video**: "загрузи видео на главную"
- **View Home Video**: "покажи видео главной"
- **Delete Home Video**: "удали видео главной"

### 2. Sign Page Video Gallery
- **List Sign Videos**: "покажи видео подписей"
- **Add Sign Video**: "добавь видео подписей"
- **Delete Sign Video**: "удали видео подписей [ID]"

## How to Use

### Uploading Videos
1. **For Home Page**:
   - Say: "загрузи видео на главную"
   - Bot will respond with instructions
   - Send a video file with caption "главная"
   
2. **For Sign Page**:
   - Say: "добавь видео подписей"
   - Bot will respond with instructions
   - Send a video file with caption "подписи"

### Video Requirements
- Format: MP4 recommended
- Max size: 50MB
- Resolution: Automatically optimized to 1920x1080
- Quality: Auto-optimized for web

### Architecture

```
AI Agent (route.ts)
    ↓
Video Manager (video-manager.ts)
    ↓
Cloudinary API
    ↓
Database (Settings table)
```

### API Endpoints Used
- `/api/admin/site/home-video` - Home page video management
- `/api/admin/site/sign-videos` - Sign page videos management

### Implementation Details

1. **Stateless Design**: No sessions used, video type determined by message caption
2. **Cloudinary Integration**: All videos uploaded to cloud storage
3. **Folders**:
   - Home videos: `vobvorot-home`
   - Sign videos: `sign-page`
4. **Optimization**: Auto-resize to 1920x1080, quality optimization

### Natural Language Examples

```
Admin: покажи видео главной
Bot: 🎬 Видео главной страницы
     🔗 [Просмотреть видео](https://cloudinary.com/...)
     📅 Обновлено: 29.01.2025

Admin: загрузи видео на главную
Bot: 🎬 Загрузка видео на главную страницу
     Отправьте видео файл (рекомендуется MP4)
     📱 Команда: Отправьте видео с подписью "главная"

Admin: [sends video with caption "главная"]
Bot: ⏳ Загружаю видео в облако...
     ✅ Видео успешно загружено на главную!
     📍 Теперь отображается на главной странице

Admin: покажи все видео подписей
Bot: 📹 Видео подписей (3)
     1. [Видео 1](url) 📅 Добавлено: 29.01.2025 🆔 ID: sign_video_123
     2. [Видео 2](url) 📅 Добавлено: 28.01.2025 🆔 ID: sign_video_124
     📍 Отображаются на странице /your-name-my-pic
```

### Testing Instructions

1. **Set webhook** (if not already set):
   ```bash
   curl -X POST https://api.telegram.org/bot7700098378:AAGZ1zZOxiwXbJeknO9SvyN25KvfWQkQNrI/setWebhook \
     -H "Content-Type: application/json" \
     -d '{"url": "https://vobvorot.com/api/telegram/ai-assistant"}'
   ```

2. **Test commands in Telegram**:
   - Open @VobvorotBot
   - Send video commands
   - Upload test videos

3. **Verify on website**:
   - Home video: Check main page
   - Sign videos: Check /your-name-my-pic page

### Error Handling
- Invalid video format: Clear error message
- Upload failures: Detailed error description
- Missing parameters: Helpful instructions

### Security
- Admin-only access (IDs: 316593422, 1837334996)
- Bearer token authentication for API calls
- Rate limiting: 10 requests/minute per user

## Status Report

✅ **COMPLETED**:
- All 6 video actions implemented
- Cloudinary integration working
- Stateless architecture maintained
- MarkdownV2 escaping applied
- Error handling comprehensive
- Natural language processing accurate
- Build passes successfully

🎯 **ACHIEVEMENT**: Video management (8/100+ functions) fully operational!