// Тестовый скрипт для добавления видео на страницу "Your Name, My Pic"

async function addSignPageVideos() {
  const videos = [
    {
      url: 'https://example.com/sign-video-1.mp4',
      title: 'Sign Video 1'
    },
    {
      url: 'https://example.com/sign-video-2.mp4', 
      title: 'Sign Video 2'
    }
  ]

  try {
    // Замените YOUR_ADMIN_API_KEY на ваш реальный ключ
    const response = await fetch('http://localhost:3000/api/admin/site/sign-videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-API-Key': 'YOUR_ADMIN_API_KEY'
      },
      body: JSON.stringify({ videos })
    })

    const result = await response.json()
    console.log('Sign page videos update result:', result)
  } catch (error) {
    console.error('Failed to update sign page videos:', error)
  }
}

console.log(`
✅ Фаза 1 завершена: Видео функционал добавлен на страницу "Your Name, My Pic"

📦 Что было сделано:
1. ✅ Создан API эндпоинт /api/admin/site/sign-videos
2. ✅ Добавлена поддержка видео на страницу
3. ✅ Автопереключение видео каждые 8 секунд
4. ✅ Точки пагинации для переключения видео
5. ✅ Fallback на градиентный фон при отсутствии видео

🎥 Как добавить видео:
1. Используйте Admin API Key
2. Отправьте POST запрос на /api/admin/site/sign-videos
3. Формат: { videos: [{ url: "video-url", title: "title" }] }

⚠️ Важно:
- Видео должны быть в формате MP4
- Рекомендуемый размер: не более 10MB
- Оптимальное разрешение: 1920x1080
- Видео будут проигрываться без звука (muted)

🚀 Готово к переходу к Фазе 2: Интеграция с системой заказов
`)