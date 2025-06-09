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

export default function AccountPage() {
  const { data: session, status } = useSession()
  const { state: wishlistState, removeFromWishlist } = useWishlist()
  const [activeTab, setActiveTab] = useState('profile')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  })

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
              <h2 style={{
                color: 'var(--cyan-accent)',
                fontSize: '1.8rem',
                marginBottom: '2rem'
              }}>
                Order History
              </h2>
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
                  <p>Start shopping to see your orders here!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--pink-main)',
                        borderRadius: '8px',
                        padding: '1.5rem'
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
                  <button style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--pink-main)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--white)',
                    cursor: 'pointer'
                  }}>
                    Change Password
                  </button>
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