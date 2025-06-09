# Настройка аутентификации

## Текущий статус

Система аутентификации настроена и работает с:
- ✅ CredentialsProvider (логин/пароль)
- ✅ База данных SQLite с NextAuth таблицами
- ✅ Регистрация пользователей
- ✅ Условная поддержка OAuth провайдеров

## Тестовый пользователь

Создан тестовый пользователь для проверки:
- Email: `test@example.com`
- Password: `test123`

## Настройка OAuth провайдеров

### Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials
5. Добавьте redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Скопируйте Client ID и Client Secret в .env:

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_GOOGLE_OAUTH=true
```

### GitHub OAuth

1. Перейдите в [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Создайте новое OAuth App
3. Установите Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Скопируйте Client ID и Client Secret в .env:

```bash
GITHUB_ID=your-client-id
GITHUB_SECRET=your-client-secret
NEXT_PUBLIC_GITHUB_OAUTH=true
```

## Структура файлов

- `/src/lib/auth.ts` - Конфигурация NextAuth
- `/src/app/api/auth/[...nextauth]/route.ts` - API маршрут NextAuth
- `/src/app/api/auth/register/route.ts` - Регистрация пользователей
- `/src/app/auth/signin/page.tsx` - Страница входа
- `/src/app/auth/signup/page.tsx` - Страница регистрации
- `/prisma/schema.prisma` - Схема базы данных с таблицами NextAuth

## Безопасность

- Пароли хешируются с bcrypt (12 rounds)
- JWT используется для сессий
- OAuth провайдеры показываются только если настроены
- Валидация данных с Zod

## Использование

```tsx
import { useSession, signIn, signOut } from 'next-auth/react'

function Component() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <p>Loading...</p>
  
  if (session) {
    return (
      <>
        <p>Signed in as {session.user.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  
  return (
    <>
      <p>Not signed in</p>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}
```