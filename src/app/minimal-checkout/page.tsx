'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { Footer } from '@/components/Footer'
import { useCSRFToken } from '@/lib/csrf-protection'
import SimplePaymentMethodSelector, { type PaymentMethod } from '@/components/SimplePaymentMethodSelector'

interface MinimalShippingInfo {
  country: string
}

interface PaymentInfo {
  method: PaymentMethod | null
}

export default function MinimalCheckoutPage() {
  const { state, dispatch } = useCart()
  const { getCSRFToken } = useCSRFToken()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [shippingCost, setShippingCost] = useState(0)
  const [mounted, setMounted] = useState(false)
  
  const [shippingInfo, setShippingInfo] = useState<MinimalShippingInfo>({
    country: 'US'
  })

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'westernbid_paypal'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && state.items.length === 0) {
      router.push('/products')
    }
  }, [mounted, state.items.length, router])

  // Calculate shipping cost based on country
  useEffect(() => {
    const calculateShipping = async () => {
      if (!shippingInfo.country) return

      try {
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            country: shippingInfo.country,
            items: state.items
          })
        })

        if (response.ok) {
          const data = await response.json()
          setShippingCost(data.cost || 0)
        }
      } catch (error) {
        console.error('Shipping calculation error:', error)
        setShippingCost(0)
      }
    }

    calculateShipping()
  }, [shippingInfo.country, state.items])

  const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal + shippingCost

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create minimal order with only country and items
      const orderData = {
        items: state.items.map(item => ({
          product: {
            id: item.productId,
            name: item.productName,
            price: item.price,
            images: item.image ? [{ url: item.image }] : []
          },
          quantity: item.quantity,
          selectedSize: item.size,
          selectedColor: item.color
        })),
        shippingCountry: shippingInfo.country,
        shippingCost,
        subtotal,
        total,
        paymentMethod: paymentInfo.method,
        // Minimal data - rest will come from WesternBid
        shippingName: 'Customer Name (will be updated from payment)',
        shippingEmail: 'customer@example.com (will be updated from payment)', 
        shippingAddress: 'Address will be updated from payment data',
        shippingCity: 'City will be updated from payment data',
        shippingZip: 'ZIP will be updated from payment data',
        currency: 'USD',
        isMinimalCheckout: true // Flag to indicate this is minimal checkout
      }

      // Получаем CSRF токен для защиты запроса
      const csrfToken = await getCSRFToken()
      
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const order = await response.json()

      // Cart will be cleared only after successful payment verification

      // Redirect to payment with order ID
      if (paymentInfo.method?.startsWith('westernbid_')) {
        const gateway = paymentInfo.method.replace('westernbid_', '')
        window.location.href = `/api/payment/westernbid/redirect?orderId=${order.orderNumber}&gateway=${gateway}`
      }
    } catch (error) {
      console.error('Order creation error:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Quick Checkout</h1>
          
          {/* Order Summary */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-4">
              {state.items.map((item) => (
                <div key={`${item.productId}-${item.skuId}-${item.size || ''}-${item.color || ''}`} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.productName}</h3>
                    {(item.size || item.color) && (
                      <p className="text-sm text-gray-500">
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && ', '}
                        {item.color && `Color: ${item.color}`}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Checkout Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipping Country - Only Required Field */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Country *
                  </label>
                  <select
                    id="country"
                    required
                    value={shippingInfo.country}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="AU">Australia</option>
                    <option value="UA">Ukraine</option>
                    <option value="PL">Poland</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="CH">Switzerland</option>
                    <option value="AT">Austria</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                    <option value="FI">Finland</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Your detailed shipping information will be collected securely during payment.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              <SimplePaymentMethodSelector
                selectedMethod={paymentInfo.method}
                onMethodChange={(method) => setPaymentInfo({ method })}
                showOnlyWesternbid={true}
              />
            </div>

            {/* Submit Button */}
            <div className="border-t pt-6">
              <button
                type="submit"
                disabled={loading || !paymentInfo.method}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  '🔒 Proceed to Secure Payment'
                )}
              </button>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  🛡️ Your personal and payment information will be collected securely through our payment processor. 
                  No card details are stored on our servers.
                </p>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  After payment, we'll receive your complete shipping information and contact details 
                  to process and ship your order.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}