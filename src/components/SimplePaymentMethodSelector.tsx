'use client'

import { useState } from 'react'

export type PaymentMethod = 'westernbid_paypal' | 'westernbid_stripe' | null

interface SimplePaymentMethodSelectorProps {
  selectedMethod?: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
  showOnlyWesternbid?: boolean
}

const WESTERNBID_METHODS = [
  {
    id: 'westernbid_paypal' as const,
    name: 'PayPal',
    description: 'Pay with PayPal through WesternBid secure gateway',
    icon: '💳',
    features: ['Secure PayPal processing', 'Buyer protection', 'Instant confirmation']
  },
  {
    id: 'westernbid_stripe' as const,
    name: 'Credit/Debit Card',
    description: 'Pay with your card through WesternBid secure gateway',
    icon: '💰', 
    features: ['Credit/Debit cards', 'Secure encryption', 'Instant processing']
  }
]

export default function SimplePaymentMethodSelector({ 
  selectedMethod, 
  onMethodChange,
  showOnlyWesternbid = false 
}: SimplePaymentMethodSelectorProps) {
  const methods = showOnlyWesternbid ? WESTERNBID_METHODS : WESTERNBID_METHODS

  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <div
          key={method.id}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === method.id
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onMethodChange(method.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{method.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{method.name}</h3>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                checked={selectedMethod === method.id}
                onChange={() => onMethodChange(method.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {method.features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-medium">🔒 Secure Payment:</span> All payments are processed through 
          WesternBid's secure payment gateway. Your payment information is encrypted and never stored on our servers.
        </p>
      </div>
    </div>
  )
}