'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function EmailTestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [emailType, setEmailType] = useState<'test' | 'order-confirmation' | 'admin-notification' | 'status-update'>('test')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!session || session.user.role !== 'ADMIN') {
    router.push('/')
    return null
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: emailType,
          email: email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Email Testing
        </h1>

        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Test Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="test@example.com"
            />
          </div>

          <div>
            <label htmlFor="emailType" className="block text-sm font-medium text-gray-700 mb-1">
              Email Type
            </label>
            <select
              id="emailType"
              value={emailType}
              onChange={(e) => setEmailType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="test">Simple Test Email</option>
              <option value="order-confirmation">Order Confirmation</option>
              <option value="admin-notification">Admin Notification</option>
              <option value="status-update">Status Update</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Test Email'}
          </button>
        </form>

        {result && (
          <div className={`mt-4 p-4 rounded-md ${
            result.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm">{result.message}</p>
          </div>
        )}

        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Email Types:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>Simple Test:</strong> Basic test email</li>
            <li><strong>Order Confirmation:</strong> Customer order confirmation with mock data</li>
            <li><strong>Admin Notification:</strong> New order notification for admin</li>
            <li><strong>Status Update:</strong> Order status update notification</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/admin')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Admin Panel
          </button>
        </div>
      </div>
    </div>
  )
}