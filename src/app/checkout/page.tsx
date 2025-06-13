'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { Footer } from '@/components/Footer'
import PaymentMethodSelector, { type PaymentMethod } from '@/components/PaymentMethodSelector'

interface ShippingInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
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
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'US',
    state: ''
  })

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: null
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

  // Calculate shipping cost based on country
  useEffect(() => {
    const calculateShipping = () => {
      const baseWeight = state.items.reduce((total, item) => total + (item.quantity * 0.5), 0) // 0.5kg per item
      
      if (shippingInfo.country === 'US') {
        return Math.max(15, baseWeight * 2) // Minimum $15, $2 per kg
      } else if (['CA', 'MX'].includes(shippingInfo.country)) {
        return Math.max(25, baseWeight * 3) // North America
      } else if (['GB', 'FR', 'DE', 'IT', 'ES'].includes(shippingInfo.country)) {
        return Math.max(35, baseWeight * 4) // Europe
      } else {
        return Math.max(45, baseWeight * 5) // Rest of world
      }
    }
    
    setShippingCost(calculateShipping())
  }, [shippingInfo.country, state.items])

  const totalAmount = state.total + shippingCost
  const tax = totalAmount * 0.08 // 8% tax
  const finalTotal = totalAmount + tax

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
          method: paymentInfo.method?.id || 'westernbid',
          gateway: paymentInfo.method?.name || 'WesternBid Gateway'
        },
        items: state.items,
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
        
        // Clear cart
        dispatch({ type: 'CLEAR_CART' })
        
        // If payment URL is provided, redirect to WesternBid payment
        if (order.paymentUrl) {
          window.location.href = order.paymentUrl
        } else {
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
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--white)',
                      marginBottom: '0.5rem'
                    }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.firstName}
                      onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
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
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--white)',
                      marginBottom: '0.5rem'
                    }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.lastName}
                      onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
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
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--white)',
                      marginBottom: '0.5rem'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
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
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--white)',
                      marginBottom: '0.5rem'
                    }}>
                      Phone *
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={shippingInfo.country === 'US' ? '+1' : 
                               shippingInfo.country === 'GB' ? '+44' :
                               shippingInfo.country === 'FR' ? '+33' :
                               shippingInfo.country === 'DE' ? '+49' :
                               shippingInfo.country === 'IT' ? '+39' :
                               shippingInfo.country === 'ES' ? '+34' :
                               shippingInfo.country === 'CA' ? '+1' :
                               shippingInfo.country === 'AU' ? '+61' :
                               shippingInfo.country === 'JP' ? '+81' :
                               shippingInfo.country === 'MX' ? '+52' : '+1'}
                        onChange={(e) => {/* Handle code change if needed */}}
                        style={{
                          width: '120px',
                          padding: '1rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid var(--cyan-accent)',
                          borderRadius: '8px',
                          color: 'var(--white)',
                          fontSize: '1rem'
                        }}
                      >
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+52">🇲🇽 +52</option>
                        <option value="+380">🇺🇦 +380</option>
                        <option value="+7">🇷🇺 +7</option>
                        <option value="+86">🇨🇳 +86</option>
                        <option value="+91">🇮🇳 +91</option>
                      </select>
                      <input
                        type="tel"
                        required
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                        placeholder="123 456 7890"
                        style={{
                          flex: 1,
                          padding: '1rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid var(--cyan-accent)',
                          borderRadius: '8px',
                          color: 'var(--white)',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'var(--white)',
                    marginBottom: '0.5rem'
                  }}>
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
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

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--white)',
                      marginBottom: '0.5rem'
                    }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
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
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--white)',
                      marginBottom: '0.5rem'
                    }}>
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.postalCode}
                      onChange={(e) => setShippingInfo({...shippingInfo, postalCode: e.target.value})}
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
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--white)',
                      marginBottom: '0.5rem'
                    }}>
                      Country *
                    </label>
                    <select
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
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="MX">Mexico</option>
                      <option value="GB">United Kingdom</option>
                      <option value="FR">France</option>
                      <option value="DE">Germany</option>
                      <option value="IT">Italy</option>
                      <option value="ES">Spain</option>
                      <option value="AU">Australia</option>
                      <option value="JP">Japan</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

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
                      id: 'westernbid', 
                      name: 'WesternBid (Stripe & PayPal)', 
                      description: 'Pay with Credit Card or PayPal',
                      icon: '💳'
                    }
                  ].map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentInfo({ method: method as any })}
                      style={{
                        padding: '1.5rem',
                        background: paymentInfo.method?.id === method.id 
                          ? 'rgba(0,245,255,0.2)' 
                          : 'rgba(255,255,255,0.1)',
                        border: `2px solid ${paymentInfo.method?.id === method.id 
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
                            {method.description}
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
                    <p>{shippingInfo.firstName} {shippingInfo.lastName}</p>
                    <p>{shippingInfo.address}</p>
                    <p>{shippingInfo.city}, {shippingInfo.postalCode}</p>
                    <p>{shippingInfo.country}</p>
                    <p>{shippingInfo.email} • {shippingInfo.phone}</p>
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
                      `💳 ${paymentInfo.method.name} - ${paymentInfo.method.description}`
                    ) : (
                      '💳 WesternBid Payment (PayPal & Stripe)'
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
                    {loading ? 'Processing...' : 'Proceed to Payment'}
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