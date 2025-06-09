'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Footer } from '@/components/Footer'
import { useWishlist } from '@/contexts/WishlistContext'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  currency: string
  createdAt: string
  items: {
    id: string
    quantity: number
    price: number
    sku: {
      product: {
        name: string
        images: { url: string; alt?: string }[]
      }
      size?: string
      color?: string
    }
  }[]
}

interface Address {
  id: string
  type: 'SHIPPING' | 'BILLING'
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state?: string
  country: string
  zipCode: string
  phone?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const { state: wishlistState, removeFromWishlist } = useWishlist()
  const [activeTab, setActiveTab] = useState('profile')
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  })
  const [addressForm, setAddressForm] = useState({
    type: 'SHIPPING' as 'SHIPPING' | 'BILLING',
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    phone: '',
    isDefault: false
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (session?.user) {
      setProfileForm({
        name: session.user.name || '',
        email: session.user.email || ''
      })
    }
  }, [session])

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
      fetchAddresses()
    }
  }, [session])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    setAddressesLoading(true)
    try {
      const response = await fetch('/api/user/addresses')
      if (response.ok) {
        const data = await response.json()
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    } finally {
      setAddressesLoading(false)
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = editingAddress ? 'PUT' : 'POST'
      const url = editingAddress 
        ? `/api/user/addresses/${editingAddress.id}`
        : '/api/user/addresses'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressForm)
      })

      if (response.ok) {
        await fetchAddresses()
        setShowAddressForm(false)
        setEditingAddress(null)
        resetAddressForm()
      }
    } catch (error) {
      console.error('Failed to save address:', error)
    }
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setAddressForm({
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || '',
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state || '',
      country: address.country,
      zipCode: address.zipCode,
      phone: address.phone || '',
      isDefault: address.isDefault
    })
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchAddresses()
      }
    } catch (error) {
      console.error('Failed to delete address:', error)
    }
  }

  const resetAddressForm = () => {
    setAddressForm({
      type: 'SHIPPING',
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      phone: '',
      isDefault: false
    })
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      setPasswordLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long')
      setPasswordLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordMessage('Password changed successfully!')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordForm(false)
      } else {
        setPasswordError(data.error || 'Failed to change password')
      }
    } catch (error) {
      setPasswordError('Something went wrong. Please try again.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setPasswordError('')
    setPasswordMessage('')
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'var(--yellow-neon)'
      case 'confirmed': return 'var(--cyan-accent)'
      case 'processing': return 'var(--purple-accent)'
      case 'shipped': return 'var(--green-neon)'
      case 'delivered': return 'var(--pink-main)'
      case 'cancelled': return 'var(--pink-neon)'
      default: return 'var(--white)'
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ color: 'var(--pink-main)', fontSize: '1.2rem' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Middleware will redirect
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{
            color: 'var(--pink-main)',
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem',
            textShadow: '0 0 20px var(--pink-main)'
          }}>
            Account Dashboard
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1.2rem'
          }}>
            Welcome back, {session.user.name || session.user.email}! ✨
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '3rem',
          gap: '1rem'
        }}>
          {[
            { id: 'profile', label: 'Profile', icon: '👤' },
            { id: 'orders', label: 'Orders', icon: '📦' },
            { id: 'addresses', label: 'Addresses', icon: '🏠' },
            { id: 'wishlist', label: 'Wishlist', icon: '✨' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '1rem 2rem',
                background: activeTab === tab.id 
                  ? 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))'
                  : 'rgba(255,255,255,0.1)',
                border: activeTab === tab.id 
                  ? 'none'
                  : '1px solid var(--cyan-accent)',
                borderRadius: '12px',
                color: 'var(--white)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'rgba(0,245,255,0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          border: '2px solid var(--pink-main)',
          borderRadius: '16px',
          padding: '2rem',
          backdropFilter: 'blur(20px)',
          minHeight: '400px'
        }}>
          {activeTab === 'profile' && (
            <div>
              <h2 style={{
                color: 'var(--cyan-accent)',
                fontSize: '1.8rem',
                marginBottom: '2rem'
              }}>
                Profile Information
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'var(--white)',
                    marginBottom: '0.5rem',
                    fontSize: '1rem'
                  }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
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
                    marginBottom: '0.5rem',
                    fontSize: '1rem'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'rgba(0,245,255,0.1)',
                border: '1px solid var(--cyan-accent)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
                  Account Details
                </h3>
                <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                  <p><strong>Account Type:</strong> {session.user.role || 'USER'}</p>
                  <p><strong>Member Since:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Login Method:</strong> {session.user.email ? 'Email/Password' : 'Social Login'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <h2 style={{
                  color: 'var(--cyan-accent)',
                  fontSize: '1.8rem'
                }}>
                  Order History
                </h2>
                <button
                  onClick={() => window.location.href = '/account/orders'}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(255,107,157,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  View All Orders
                </button>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--pink-main)' }}>
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                  <h3 style={{ marginBottom: '1rem' }}>No orders yet</h3>
                  <p style={{ marginBottom: '2rem' }}>Start shopping to see your orders here!</p>
                  <button
                    onClick={() => window.location.href = '/products'}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(45deg, var(--pink-main), var(--purple-accent))',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--white)',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--pink-main)',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--cyan-accent)'
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,245,255,0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--pink-main)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <h3 style={{ color: 'var(--white)', marginBottom: '0.5rem' }}>
                            Order #{order.orderNumber}
                          </h3>
                          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            color: getStatusColor(order.status),
                            fontWeight: '600',
                            marginBottom: '0.5rem'
                          }}>
                            {order.status.toUpperCase()}
                          </div>
                          <div style={{ color: 'var(--pink-main)', fontWeight: '600' }}>
                            ${order.total.toFixed(2)} {order.currency}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: '1rem'
                      }}>
                        <span style={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.9rem'
                        }}>
                          {order.items?.length || 0} items
                        </span>
                        <button
                          onClick={() => window.location.href = '/account/orders'}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(0,245,255,0.2)',
                            border: '1px solid var(--cyan-accent)',
                            borderRadius: '6px',
                            color: 'var(--cyan-accent)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0,245,255,0.3)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0,245,255,0.2)'
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                  {orders.length > 3 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '1rem',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.9rem'
                    }}>
                      Showing 3 of {orders.length} orders. 
                      <button
                        onClick={() => window.location.href = '/account/orders'}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--cyan-accent)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          marginLeft: '0.5rem'
                        }}
                      >
                        View all orders
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <h2 style={{
                  color: 'var(--cyan-accent)',
                  fontSize: '1.8rem'
                }}>
                  Your Addresses
                </h2>
                <button
                  onClick={() => {
                    resetAddressForm()
                    setEditingAddress(null)
                    setShowAddressForm(true)
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(255,107,157,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  + Add Address
                </button>
              </div>

              {/* Address Form Modal */}
              {showAddressForm && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '2rem'
                }}>
                  <div style={{
                    background: 'var(--black)',
                    border: '2px solid var(--pink-main)',
                    borderRadius: '16px',
                    padding: '2rem',
                    maxWidth: '600px',
                    width: '100%',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '2rem'
                    }}>
                      <h3 style={{ color: 'var(--cyan-accent)', fontSize: '1.5rem' }}>
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowAddressForm(false)
                          setEditingAddress(null)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--pink-main)',
                          fontSize: '1.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleAddressSubmit}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <label style={{
                            display: 'block',
                            color: 'var(--white)',
                            marginBottom: '0.5rem'
                          }}>
                            Address Type *
                          </label>
                          <select
                            value={addressForm.type}
                            onChange={(e) => setAddressForm({
                              ...addressForm,
                              type: e.target.value as 'SHIPPING' | 'BILLING'
                            })}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid var(--cyan-accent)',
                              borderRadius: '8px',
                              color: 'var(--white)',
                              fontSize: '1rem'
                            }}
                          >
                            <option value="SHIPPING">Shipping</option>
                            <option value="BILLING">Billing</option>
                          </select>
                        </div>

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
                            value={addressForm.firstName}
                            onChange={(e) => setAddressForm({...addressForm, firstName: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
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
                            value={addressForm.lastName}
                            onChange={(e) => setAddressForm({...addressForm, lastName: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
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
                            Company
                          </label>
                          <input
                            type="text"
                            value={addressForm.company}
                            onChange={(e) => setAddressForm({...addressForm, company: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid var(--cyan-accent)',
                              borderRadius: '8px',
                              color: 'var(--white)',
                              fontSize: '1rem'
                            }}
                          />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{
                            display: 'block',
                            color: 'var(--white)',
                            marginBottom: '0.5rem'
                          }}>
                            Address Line 1 *
                          </label>
                          <input
                            type="text"
                            required
                            value={addressForm.address1}
                            onChange={(e) => setAddressForm({...addressForm, address1: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid var(--cyan-accent)',
                              borderRadius: '8px',
                              color: 'var(--white)',
                              fontSize: '1rem'
                            }}
                          />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{
                            display: 'block',
                            color: 'var(--white)',
                            marginBottom: '0.5rem'
                          }}>
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            value={addressForm.address2}
                            onChange={(e) => setAddressForm({...addressForm, address2: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
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
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
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
                            State/Province
                          </label>
                          <input
                            type="text"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
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
                            ZIP/Postal Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={addressForm.zipCode}
                            onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
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
                          <input
                            type="text"
                            required
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
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
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid var(--cyan-accent)',
                              borderRadius: '8px',
                              color: 'var(--white)',
                              fontSize: '1rem'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '2rem' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--white)',
                          cursor: 'pointer',
                          gap: '0.5rem'
                        }}>
                          <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                          />
                          Set as default {addressForm.type.toLowerCase()} address
                        </label>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false)
                            setEditingAddress(null)
                          }}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid var(--cyan-accent)',
                            borderRadius: '8px',
                            color: 'var(--cyan-accent)',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'var(--white)',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {editingAddress ? 'Update Address' : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Addresses List */}
              {addressesLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--pink-main)' }}>
                  Loading addresses...
                </div>
              ) : addresses.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
                  <h3 style={{ marginBottom: '1rem' }}>No addresses saved</h3>
                  <p>Add your first address to make checkout faster!</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: address.isDefault 
                          ? '2px solid var(--pink-main)' 
                          : '1px solid var(--cyan-accent)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!address.isDefault) {
                          e.currentTarget.style.borderColor = 'var(--pink-main)'
                        }
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,245,255,0.2)'
                      }}
                      onMouseLeave={(e) => {
                        if (!address.isDefault) {
                          e.currentTarget.style.borderColor = 'var(--cyan-accent)'
                        }
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      {address.isDefault && (
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          background: 'var(--pink-main)',
                          color: 'var(--white)',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          DEFAULT
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          background: address.type === 'SHIPPING' 
                            ? 'rgba(0,245,255,0.2)' 
                            : 'rgba(255,107,157,0.2)',
                          color: address.type === 'SHIPPING' 
                            ? 'var(--cyan-accent)' 
                            : 'var(--pink-main)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          {address.type}
                        </div>
                      </div>

                      <div style={{ color: 'var(--white)', lineHeight: '1.6' }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                          {address.firstName} {address.lastName}
                        </div>
                        {address.company && (
                          <div style={{ marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                            {address.company}
                          </div>
                        )}
                        <div>{address.address1}</div>
                        {address.address2 && <div>{address.address2}</div>}
                        <div>
                          {address.city}
                          {address.state && `, ${address.state}`} {address.zipCode}
                        </div>
                        <div>{address.country}</div>
                        {address.phone && (
                          <div style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                            📞 {address.phone}
                          </div>
                        )}
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '1.5rem'
                      }}>
                        <button
                          onClick={() => handleEditAddress(address)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'rgba(0,245,255,0.2)',
                            border: '1px solid var(--cyan-accent)',
                            borderRadius: '6px',
                            color: 'var(--cyan-accent)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          style={{
                            padding: '0.75rem',
                            background: 'rgba(255,107,157,0.2)',
                            border: '1px solid var(--pink-neon)',
                            borderRadius: '6px',
                            color: 'var(--pink-neon)',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div>
              <h2 style={{
                color: 'var(--cyan-accent)',
                fontSize: '1.8rem',
                marginBottom: '2rem'
              }}>
                Your Wishlist ({wishlistState.itemCount} items)
              </h2>
              {wishlistState.items.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                  <h3 style={{ marginBottom: '1rem' }}>Your wishlist is empty</h3>
                  <p>Start adding products you love to see them here!</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {wishlistState.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--cyan-accent)',
                        borderRadius: '12px',
                        padding: '1rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        width: '100%',
                        height: '200px',
                        background: `url(${item.images[0]?.url}) center/cover`,
                        borderRadius: '8px',
                        marginBottom: '1rem'
                      }} />
                      
                      <h3 style={{
                        color: 'var(--white)',
                        fontSize: '1.1rem',
                        marginBottom: '0.5rem'
                      }}>
                        {item.name}
                      </h3>
                      
                      <div style={{
                        color: 'var(--pink-main)',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        ${item.price}
                      </div>
                      
                      {item.brand && (
                        <div style={{
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.9rem',
                          marginBottom: '1rem'
                        }}>
                          {item.brand}
                        </div>
                      )}
                      
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => window.location.href = `/products/${item.slug}`}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'var(--white)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          View Product
                        </button>
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          style={{
                            padding: '0.75rem',
                            background: 'rgba(255,107,157,0.2)',
                            border: '1px solid var(--pink-neon)',
                            borderRadius: '6px',
                            color: 'var(--pink-neon)',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                          }}
                        >
                          ❌
                        </button>
                      </div>
                      
                      <div style={{
                        marginTop: '1rem',
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.8rem'
                      }}>
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 style={{
                color: 'var(--cyan-accent)',
                fontSize: '1.8rem',
                marginBottom: '2rem'
              }}>
                Account Settings
              </h2>
              {/* Success/Error Messages */}
              {passwordMessage && (
                <div style={{
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  color: 'var(--cyan-accent)',
                  textAlign: 'center'
                }}>
                  {passwordMessage}
                </div>
              )}

              {passwordError && (
                <div style={{
                  background: 'rgba(255,107,157,0.1)',
                  border: '1px solid var(--pink-neon)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  color: 'var(--pink-neon)',
                  textAlign: 'center'
                }}>
                  {passwordError}
                </div>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
              }}>
                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(255,107,157,0.1)',
                  border: '1px solid var(--pink-main)',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>
                    Security
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>
                    Manage your password and security settings
                  </p>
                  
                  {!showPasswordForm ? (
                    <button 
                      onClick={() => {
                        setShowPasswordForm(true)
                        resetPasswordForm()
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--pink-main)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'var(--white)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--pink-neon)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--pink-main)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      Change Password
                    </button>
                  ) : (
                    <form onSubmit={handlePasswordChange} style={{ marginTop: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}>
                        <div>
                          <label style={{
                            display: 'block',
                            color: 'var(--white)',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem'
                          }}>
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            required
                            disabled={passwordLoading}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid var(--cyan-accent)',
                              borderRadius: '6px',
                              color: 'var(--white)',
                              fontSize: '0.9rem'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            color: 'var(--white)',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem'
                          }}>
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            required
                            disabled={passwordLoading}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid var(--cyan-accent)',
                              borderRadius: '6px',
                              color: 'var(--white)',
                              fontSize: '0.9rem'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            color: 'var(--white)',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem'
                          }}>
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            required
                            disabled={passwordLoading}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(255,255,255,0.1)',
                              border: `1px solid ${passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? 'var(--pink-neon)' : 'var(--cyan-accent)'}`,
                              borderRadius: '6px',
                              color: 'var(--white)',
                              fontSize: '0.9rem'
                            }}
                          />
                          {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                            <div style={{
                              marginTop: '0.25rem',
                              color: 'var(--pink-neon)',
                              fontSize: '0.8rem'
                            }}>
                              Passwords do not match
                            </div>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: '1rem'
                        }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordForm(false)
                              resetPasswordForm()
                            }}
                            disabled={passwordLoading}
                            style={{
                              padding: '0.75rem 1rem',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid var(--cyan-accent)',
                              borderRadius: '6px',
                              color: 'var(--cyan-accent)',
                              cursor: passwordLoading ? 'not-allowed' : 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                            style={{
                              padding: '0.75rem 1rem',
                              background: passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword
                                ? 'rgba(255,255,255,0.1)'
                                : 'var(--pink-main)',
                              border: 'none',
                              borderRadius: '6px',
                              color: passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword
                                ? 'rgba(255,255,255,0.5)'
                                : 'var(--white)',
                              cursor: passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword
                                ? 'not-allowed'
                                : 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600'
                            }}
                          >
                            {passwordLoading ? 'Changing...' : 'Change Password'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
                
                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
                    Notifications
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>
                    Control your email and notification preferences
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--white)',
                      cursor: 'pointer'
                    }}>
                      <input type="checkbox" defaultChecked style={{ marginRight: '0.5rem' }} />
                      Order updates
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--white)',
                      cursor: 'pointer'
                    }}>
                      <input type="checkbox" defaultChecked style={{ marginRight: '0.5rem' }} />
                      New product notifications
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--white)',
                      cursor: 'pointer'
                    }}>
                      <input type="checkbox" style={{ marginRight: '0.5rem' }} />
                      Marketing emails
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  )
}