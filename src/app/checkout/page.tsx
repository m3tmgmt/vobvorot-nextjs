'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { Footer } from '@/components/Footer'
export type PaymentMethod = 'westernbid_paypal' | 'westernbid_stripe' | null

interface ShippingInfo {
  email: string
  phone: string
  country: string
  state?: string
}

interface PaymentInfo {
  method: PaymentMethod | null
}

export default function CheckoutPage() {
  const { state, dispatch } = useCart()
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Shipping, 2: Payment, 3: Review
  const [loading, setLoading] = useState(false)
  const [shippingCost, setShippingCost] = useState(0)
  const [mounted, setMounted] = useState(false)

  console.log('CheckoutPage render - items:', state.items.length, 'mounted:', mounted)
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    email: '',
    phone: '',
    country: 'US'
  })

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'westernbid_stripe'
  })

  // Mount detection
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if cart is empty (only after component is mounted)
  useEffect(() => {
    console.log('Checkout: useEffect - mounted:', mounted, 'items:', state.items.length)
    if (mounted && state.items.length === 0) {
      console.log('Checkout: Cart is empty, redirecting to products')
      router.push('/products')
    } else if (mounted && state.items.length > 0) {
      console.log('Checkout: Cart has items, staying on checkout page')
    }
  }, [mounted, state.items.length, router])

  // Note: Guest checkout enabled - no session required

  // Calculate shipping cost using Meest tariffs
  useEffect(() => {
    const calculateShipping = async () => {
      try {
        // Import Meest shipping calculator
        const { calculateShipping: meestCalculateShipping, canShipToCountry } = await import('@/lib/meest-shipping')
        
        // Calculate total weight of items in cart
        const totalWeight = state.items.reduce((total, item) => {
          // Use product weight if available, otherwise default to 0.5kg per item
          const itemWeight = item.weight || 0.5
          return total + (item.quantity * itemWeight)
        }, 0)
        
        // Check if shipping is available to this country
        const shippingCheck = canShipToCountry(shippingInfo.country, totalWeight)
        
        if (!shippingCheck.canShip) {
          console.warn('Cannot ship to country:', shippingCheck.reason)
          setShippingCost(0)
          return
        }
        
        // Calculate shipping cost using Meest tariffs
        const shippingResult = meestCalculateShipping(
          shippingInfo.country,
          'box', // Default to box packaging
          totalWeight,
          undefined, // No specific dimensions for now
          'USD' // Convert to USD for display
        )
        
        setShippingCost(shippingResult.totalCost)
        
      } catch (error) {
        console.error('Shipping calculation error:', error)
        // Fallback to simple calculation
        setShippingCost(15) // Default $15 shipping
      }
    }
    
    calculateShipping()
  }, [shippingInfo.country, state.items, state.total])

  const totalAmount = state.total + shippingCost
  const tax = totalAmount * 0.08 // 8% tax
  const finalTotal = totalAmount + tax

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Проверить, что state заполнен для US и Canada
    if ((shippingInfo.country === 'US' || shippingInfo.country === 'CA') && !shippingInfo.state?.trim()) {
      alert(`${shippingInfo.country === 'US' ? 'State' : 'Province'} is required for ${shippingInfo.country === 'US' ? 'US' : 'Canadian'} addresses`)
      return
    }
    
    setStep(2)
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(3)
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    
    try {
      const orderData = {
        shippingInfo,
        paymentInfo: {
          method: paymentInfo.method || 'westernbid_stripe'
        },
        items: state.items.map(item => ({
          product: {
            id: item.productId,
            name: item.productName,
            price: item.price,
            images: item.image ? [{ url: item.image, alt: item.productName }] : []
          },
          quantity: item.quantity,
          selectedSize: item.size,
          selectedColor: item.color
        })),
        subtotal: state.total,
        shippingCost,
        tax,
        total: finalTotal
      }

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const order = await response.json()
        
        console.log('Order created successfully:', order)
        console.log('Payment URL:', order.paymentUrl)
        
        // Cart will be cleared only after successful payment verification
        
        // If form data is provided, create and submit form directly to WesternBid
        if (order.formData && order.targetUrl) {
          console.log('Creating direct payment form for:', order.paymentGateway)
          console.log('Form data:', order.formData)
          
          // Create form element
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = order.targetUrl
          form.style.display = 'none'
          
          // Add all form fields
          Object.entries(order.formData).forEach(([key, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = String(value)
            form.appendChild(input)
          })
          
          // Add form to page and submit
          document.body.appendChild(form)
          console.log('Submitting form directly to payment gateway...')
          form.submit()
          
        } else if (order.paymentUrl) {
          console.log('Redirecting to payment URL:', order.paymentUrl)
          window.location.href = order.paymentUrl
        } else {
          console.log('No payment URL provided, redirecting to success page')
          // Fallback to success page
          router.push(`/checkout/success?orderId=${order.id}`)
        }
      } else {
        const errorData = await response.json()
        console.error('Order creation failed:', errorData)
        
        // Show more user-friendly error messages
        if (errorData.error === 'Missing required order data') {
          alert('Please fill in all required fields')
        } else if (errorData.error === 'Payment gateway is currently disabled') {
          alert('Payment system is temporarily unavailable. Please try again later.')
        } else {
          alert(errorData.error || 'Unable to process your order. Please try again.')
        }
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Unable to connect to payment system. Please check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while cart is being loaded from localStorage
  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ color: 'var(--pink-main)', fontSize: '1.2rem' }}>
          Loading checkout...
        </div>
      </div>
    )
  }

  // Guest checkout enabled - no authentication required

  if (state.items.length === 0) {
    return null // Will redirect
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{
            color: 'var(--pink-main)',
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem',
            textShadow: '0 0 20px var(--pink-main)'
          }}>
            Checkout
          </h1>
          
          {/* Progress Steps */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            {[
              { num: 1, label: 'Shipping' },
              { num: 2, label: 'Payment' },
              { num: 3, label: 'Review' }
            ].map((stepItem) => (
              <div key={stepItem.num} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: step >= stepItem.num 
                    ? 'var(--green-neon)' 
                    : 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: step >= stepItem.num ? 'black' : 'white',
                  fontWeight: '600'
                }}>
                  {stepItem.num}
                </div>
                <span style={{
                  color: step >= stepItem.num ? 'var(--green-neon)' : 'rgba(255,255,255,0.6)'
                }}>
                  {stepItem.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '2rem'
        }}>
          {/* Main Content */}
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            border: '2px solid var(--cyan-accent)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(20px)'
          }}>
            {/* Step 1: Shipping Information */}
            {step === 1 && (
              <form onSubmit={handleShippingSubmit}>
                <h2 style={{
                  color: 'var(--cyan-accent)',
                  fontSize: '1.8rem',
                  marginBottom: '2rem'
                }}>
                  Shipping Information
                </h2>
                

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--white)',
                    marginBottom: '0.5rem'
                  }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={shippingInfo.email}
                    onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                    placeholder="your.email@example.com"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid var(--cyan-accent)',
                      borderRadius: '8px',
                      color: 'var(--white)',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--white)',
                    marginBottom: '0.5rem'
                  }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    required
                    maxLength={16}
                    value={shippingInfo.phone}
                    onChange={(e) => {
                      let value = e.target.value
                      
                      // Remove any non-digit characters except + and spaces/hyphens/parentheses for formatting
                      value = value.replace(/[^\d\+\s\-\(\)]/g, '')
                      
                      // Auto-add + if user starts typing a number without it
                      if (value.length > 0 && !value.startsWith('+') && /^\d/.test(value)) {
                        value = '+' + value
                      }
                      
                      // Limit to 16 characters
                      if (value.length > 16) {
                        value = value.substring(0, 16)
                      }
                      
                      setShippingInfo({...shippingInfo, phone: value})
                    }}
                    placeholder="+1 (555) 123-4567"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid var(--cyan-accent)',
                      borderRadius: '8px',
                      color: 'var(--white)',
                      fontSize: '1rem'
                    }}
                  />
                  <p style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.8rem',
                    marginTop: '0.25rem'
                  }}>
                    Include country code (e.g., +1 for US, +44 for UK)
                  </p>
                </div>


                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--white)',
                    marginBottom: '0.5rem'
                  }}>
                    Country *
                  </label>
                  <select
                    name="country"
                    autoComplete="country"
                    required
                    value={shippingInfo.country}
                    onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid var(--cyan-accent)',
                      borderRadius: '8px',
                      color: 'var(--white)',
                      fontSize: '1rem'
                    }}
                  >
                    {/* Популярные страны первыми */}
                    <option value="UA">Ukraine</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="AU">Australia</option>
                    
                    {/* Европа (по алфавиту) */}
                    <option value="AL">Albania</option>
                    <option value="AT">Austria</option>
                    <option value="BE">Belgium</option>
                    <option value="BA">Bosnia and Herzegovina</option>
                    <option value="BG">Bulgaria</option>
                    <option value="HR">Croatia</option>
                    <option value="CY">Cyprus</option>
                    <option value="CZ">Czech Republic</option>
                    <option value="DK">Denmark</option>
                    <option value="EE">Estonia</option>
                    <option value="FI">Finland</option>
                    <option value="FR">France</option>
                    <option value="GR">Greece</option>
                    <option value="HU">Hungary</option>
                    <option value="IS">Iceland</option>
                    <option value="IE">Ireland</option>
                    <option value="IT">Italy</option>
                    <option value="LV">Latvia</option>
                    <option value="LT">Lithuania</option>
                    <option value="LU">Luxembourg</option>
                    <option value="MT">Malta</option>
                    <option value="MD">Moldova</option>
                    <option value="ME">Montenegro</option>
                    <option value="NL">Netherlands</option>
                    <option value="NO">Norway</option>
                    <option value="PL">Poland</option>
                    <option value="PT">Portugal</option>
                    <option value="RO">Romania</option>
                    <option value="RS">Serbia</option>
                    <option value="SK">Slovakia</option>
                    <option value="SI">Slovenia</option>
                    <option value="ES">Spain</option>
                    <option value="SE">Sweden</option>
                    <option value="CH">Switzerland</option>
                    
                    {/* Азия */}
                    <option value="AM">Armenia</option>
                    <option value="AZ">Azerbaijan</option>
                    <option value="CN">China</option>
                    <option value="GE">Georgia</option>
                    <option value="HK">Hong Kong</option>
                    <option value="IN">India</option>
                    <option value="ID">Indonesia</option>
                    <option value="IL">Israel</option>
                    <option value="JP">Japan</option>
                    <option value="KZ">Kazakhstan</option>
                    <option value="KG">Kyrgyzstan</option>
                    <option value="KW">Kuwait</option>
                    <option value="PK">Pakistan</option>
                    <option value="QA">Qatar</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="SG">Singapore</option>
                    <option value="LK">Sri Lanka</option>
                    <option value="TR">Turkey</option>
                    <option value="AE">UAE</option>
                    <option value="UZ">Uzbekistan</option>
                    
                    {/* Америка */}
                    <option value="AR">Argentina</option>
                    <option value="BR">Brazil</option>
                    <option value="CL">Chile</option>
                    <option value="CO">Colombia</option>
                    <option value="CR">Costa Rica</option>
                    <option value="MX">Mexico</option>
                    <option value="PE">Peru</option>
                    
                    {/* Африка */}
                    <option value="EG">Egypt</option>
                    <option value="ET">Ethiopia</option>
                    <option value="KE">Kenya</option>
                    <option value="NG">Nigeria</option>
                    <option value="ZA">South Africa</option>
                    <option value="TZ">Tanzania</option>
                    
                    {/* Океания */}
                    <option value="NZ">New Zealand</option>
                  </select>
                </div>

                {/* State/Province field - показывать только для US и Canada */}
                {(shippingInfo.country === 'US' || shippingInfo.country === 'CA') && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      color: 'var(--white)',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      {shippingInfo.country === 'US' ? 'State' : 'Province'} *
                    </label>
                    <input
                      type="text"
                      name="state"
                      autoComplete="address-level1"
                      required
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                      placeholder={shippingInfo.country === 'US' ? 'e.g., California' : 'e.g., Ontario'}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid var(--cyan-accent)',
                        borderRadius: '8px',
                        color: 'var(--white)',
                        fontSize: '1rem',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="form-button"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Continue to Payment
                </button>
              </form>
            )}

            {/* Step 2: Payment Information */}
            {step === 2 && (
              <div>
                <h2 style={{
                  color: 'var(--cyan-accent)',
                  fontSize: '1.8rem',
                  marginBottom: '2rem'
                }}>
                  Payment Method
                </h2>

                {/* Simple payment method selection */}
                <div style={{ marginBottom: '2rem' }}>
                  {[
                    { 
                      id: 'westernbid_stripe', 
                      name: 'Credit/Debit Card', 
                      description: 'Pay securely with STRIPE',
                      icon: '💳'
                    },
                    { 
                      id: 'westernbid_paypal', 
                      name: 'PayPal', 
                      description: 'Pay with PayPal account',
                      icon: '💰'
                    }
                  ].map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentInfo({ method: method.id as any })}
                      style={{
                        padding: '1.5rem',
                        background: paymentInfo.method === method.id 
                          ? 'rgba(0,245,255,0.2)' 
                          : 'rgba(255,255,255,0.1)',
                        border: `2px solid ${paymentInfo.method === method.id 
                          ? 'var(--cyan-accent)' 
                          : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '2rem' }}>{method.icon}</span>
                        <div>
                          <h3 style={{ 
                            color: 'var(--white)', 
                            fontSize: '1.2rem',
                            marginBottom: '0.5rem' 
                          }}>
                            {method.name}
                          </h3>
                          <p style={{ 
                            color: 'rgba(255,255,255,0.7)', 
                            fontSize: '0.9rem' 
                          }}>
                            {method.id === 'westernbid_stripe' ? (
                              <>Pay securely with <strong>STRIPE</strong></>
                            ) : (
                              method.description
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem'
                }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid var(--cyan-accent)',
                      borderRadius: '8px',
                      color: 'var(--white)',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    Back to Shipping
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (paymentInfo.method) {
                        setStep(3)
                      }
                    }}
                    disabled={!paymentInfo.method}
                    style={{
                      flex: 2,
                      padding: '1rem',
                      background: paymentInfo.method
                        ? 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))'
                        : 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--white)',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: paymentInfo.method ? 'pointer' : 'not-allowed',
                      opacity: paymentInfo.method ? 1 : 0.5
                    }}
                  >
                    Continue to Review
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Order Review */}
            {step === 3 && (
              <div>
                <h2 style={{
                  color: 'var(--cyan-accent)',
                  fontSize: '1.8rem',
                  marginBottom: '2rem'
                }}>
                  Order Review
                </h2>

                {/* Shipping Address */}
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ color: 'var(--white)', marginBottom: '1rem' }}>
                    Shipping Address
                  </h3>
                  <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                    <p><strong>Email:</strong> {shippingInfo.email}</p>
                    <p><strong>Phone:</strong> {shippingInfo.phone}</p>
                    <p><strong>Country:</strong> {shippingInfo.country}</p>
                    {shippingInfo.state && (
                      <p><strong>State/Province:</strong> {shippingInfo.state}</p>
                    )}
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      Full shipping details will be collected after payment
                    </p>
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--pink-main)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ color: 'var(--white)', marginBottom: '1rem' }}>
                    Payment Method
                  </h3>
                  <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {paymentInfo.method ? (
                      paymentInfo.method === 'westernbid_stripe' 
                        ? <>💳 Credit/Debit Card - Pay securely with <strong>STRIPE</strong></>
                        : '💰 PayPal - Pay with PayPal account'
                    ) : (
                      '💳 Payment method not selected'
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem'
                }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid var(--cyan-accent)',
                      borderRadius: '8px',
                      color: 'var(--white)',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    style={{
                      flex: 2,
                      padding: '1rem',
                      background: loading 
                        ? 'rgba(255,255,255,0.2)' 
                        : 'linear-gradient(45deg, var(--green-neon), var(--pink-main))',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--white)',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Creating Order...' : '🔒 Proceed to Secure Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="checkout-sidebar" style={{
            background: 'rgba(0,0,0,0.6)',
            border: '2px solid var(--pink-main)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(20px)',
            height: 'fit-content',
            position: 'sticky',
            top: '2rem'
          }}>
            <h3 style={{
              color: 'var(--pink-main)',
              fontSize: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              Order Summary
            </h3>

            {/* Cart Items */}
            <div style={{ marginBottom: '1.5rem' }}>
              {state.items.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: `url(${item.image}) center/cover`,
                    borderRadius: '6px'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: 'var(--white)',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      {item.productName}
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.8rem'
                    }}>
                      Qty: {item.quantity} × ${item.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.2)',
              paddingTop: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.8)'
              }}>
                <span>Subtotal:</span>
                <span>${state.total.toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.8)'
              }}>
                <span>Shipping:</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                color: 'rgba(255,255,255,0.8)'
              }}>
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.2rem',
                fontWeight: '700',
                color: 'var(--pink-main)',
                borderTop: '1px solid var(--pink-main)',
                paddingTop: '1rem'
              }}>
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}