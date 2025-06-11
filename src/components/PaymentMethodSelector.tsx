'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: PaymentMethod) => void
  disabled?: boolean
  selectedMethod?: PaymentMethod | null
  amount: number
  currency: string
}

export interface PaymentMethod {
  id: 'stripe' | 'paypal' | 'westernbid'
  name: string
  description: string
  icon: string
  fees: {
    percentage: number
    fixed: number
  }
  processingTime: string
  supportedCurrencies: string[]
  features: string[]
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'stripe',
    name: 'Credit/Debit Card',
    description: 'Pay securely with your credit or debit card via Stripe',
    icon: '/icons/stripe.svg',
    fees: {
      percentage: 2.9,
      fixed: 0.30
    },
    processingTime: 'Instant',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
    features: ['Secure encryption', '3D Secure', 'Fraud protection', 'Instant processing']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account or PayPal Credit',
    icon: '/icons/paypal.svg',
    fees: {
      percentage: 3.4,
      fixed: 0.30
    },
    processingTime: 'Instant',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    features: ['PayPal Protection', 'Pay in 4', 'Express checkout', 'Buyer protection']
  },
  {
    id: 'westernbid',
    name: 'WesternBid Gateway',
    description: 'Multiple payment options through WesternBid',
    icon: '/icons/westernbid.svg',
    fees: {
      percentage: 2.5,
      fixed: 0.25
    },
    processingTime: '1-3 business days',
    supportedCurrencies: ['USD', 'EUR'],
    features: ['Multiple gateways', 'Alternative methods', 'Lower fees', 'Global coverage']
  }
]

export default function PaymentMethodSelector({
  onMethodSelect,
  disabled = false,
  selectedMethod,
  amount,
  currency
}: PaymentMethodSelectorProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)

  const calculateFees = (method: PaymentMethod, amount: number) => {
    const percentageFee = (amount * method.fees.percentage) / 100
    const totalFee = percentageFee + method.fees.fixed
    return totalFee
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">
          Choose Payment Method
        </h2>
        <p className="text-gray-400 mt-2">
          Select your preferred way to complete the payment
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod?.id === method.id
          const isHovered = hoveredMethod === method.id
          const fees = calculateFees(method, amount)
          const totalAmount = amount + fees
          const isSupported = method.supportedCurrencies.includes(currency.toUpperCase())

          return (
            <div
              key={method.id}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer
                bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm
                ${isSelected 
                  ? 'border-cyan-400 shadow-lg shadow-cyan-400/20' 
                  : isHovered 
                    ? 'border-pink-400 shadow-lg shadow-pink-400/20' 
                    : 'border-gray-700 hover:border-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${!isSupported ? 'opacity-60' : ''}
              `}
              onClick={() => {
                if (!disabled && isSupported) {
                  onMethodSelect(method)
                }
              }}
              onMouseEnter={() => setHoveredMethod(method.id)}
              onMouseLeave={() => setHoveredMethod(null)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Payment method icon */}
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-800/50">
                {method.icon.startsWith('/icons/') ? (
                  <Image
                    src={method.icon}
                    alt={method.name}
                    width={32}
                    height={32}
                    className="object-contain"
                    onError={(e) => {
                      // Fallback to text if icon not found
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="text-2xl font-bold text-cyan-400">
                    {method.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Method name and description */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {method.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {method.description}
                </p>
              </div>

              {/* Pricing info */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Processing fee:</span>
                  <span className="text-white">
                    {method.fees.percentage}% + {formatCurrency(method.fees.fixed, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total fee:</span>
                  <span className="text-cyan-400 font-medium">
                    {formatCurrency(fees, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-gray-700 pt-2">
                  <span className="text-white">Total amount:</span>
                  <span className="text-cyan-400">
                    {formatCurrency(totalAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1 mb-4">
                <p className="text-xs font-medium text-gray-300 mb-2">Features:</p>
                {method.features.slice(0, 2).map((feature, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-400">
                    <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2" />
                    {feature}
                  </div>
                ))}
              </div>

              {/* Processing time */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Processing:</span>
                <span className="text-green-400">{method.processingTime}</span>
              </div>

              {/* Not supported warning */}
              {!isSupported && (
                <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-red-400 font-medium">Not available</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {currency.toUpperCase()} not supported
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Security notice */}
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-400 font-medium text-sm">Secure Payment</span>
        </div>
        <p className="text-xs text-gray-400">
          All payments are processed securely with industry-standard encryption. 
          Your payment information is never stored on our servers.
        </p>
      </div>

      {/* Action button */}
      {selectedMethod && (
        <Button
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-cyan-400 hover:from-pink-600 hover:to-cyan-500 text-white font-semibold"
          disabled={disabled}
          onClick={() => onMethodSelect(selectedMethod)}
        >
          Continue with {selectedMethod.name}
        </Button>
      )}
    </div>
  )
}