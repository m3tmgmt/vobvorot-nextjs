'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error)
    console.error('Global error caught:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Что-то пошло не так</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Произошла неожиданная ошибка. Мы уже уведомлены об этой проблеме и работаем над её устранением.
                </p>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                  onClick={() => reset()}
                >
                  Попробовать снова
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  onClick={() => window.location.href = '/'}
                >
                  На главную
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}