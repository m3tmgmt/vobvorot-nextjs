'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Footer } from '@/components/Footer'
import { Navigation } from '@/components/Navigation'

// Types
interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
  currency: string
  createdAt: string
  updatedAt: string
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingCountry: string
  items: {
    id: string
    quantity: number
    price: number
    sku: {
      id: string
      size?: string
      color?: string
      product: {
        id: string
        name: string
        slug: string
        images: { url: string; alt?: string }[]
      }
    }
  }[]
}

interface OrderResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: Record<string, number>
  filters: {
    status: string | null
    sortBy: string
    sortOrder: string
  }
}

interface TrackingInfo {
  orderId: string
  orderNumber: string
  status: string
  trackingNumber: string
  estimatedDelivery: string
  currentStatus: {
    status: string
    description: string
    timestamp: string
    icon: string
  }
  events: Array<{
    id: string
    status: string
    description: string
    location?: string
    timestamp: string
    icon: string
  }>
  shippingInfo: {
    carrier: string
    method: string
    address: {
      name: string
      line1: string
      city: string
      country: string
      zipCode: string
    }
  }
}

const ORDER_STATUSES = [
  { value: 'ALL', label: 'All Orders', color: '#FFFFFF' },
  { value: 'PENDING', label: 'Pending', color: '#FFFF00' },
  { value: 'CONFIRMED', label: 'Confirmed', color: '#00F5FF' },
  { value: 'PROCESSING', label: 'Processing', color: '#9D4EDD' },
  { value: 'SHIPPED', label: 'Shipped', color: '#00FF7F' },
  { value: 'DELIVERED', label: 'Delivered', color: '#FF6B9D' },
  { value: 'CANCELLED', label: 'Cancelled', color: '#FF4444' }
]

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    status: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [showTracking, setShowTracking] = useState(false)
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
    }
  }, [session, pagination.page, filters])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })
      
      if (filters.status !== 'ALL') {
        params.append('status', filters.status)
      }

      const response = await fetch(`/api/orders?${params}`)
      if (response.ok) {
        const data: OrderResponse = await response.json()
        setOrders(data.orders)
        setPagination(data.pagination)
        setStats(data.stats || {})
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTracking = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/tracking`)
      if (response.ok) {
        const data: TrackingInfo = await response.json()
        setTrackingInfo(data)
        setShowTracking(true)
      }
    } catch (error) {
      console.error('Failed to fetch tracking:', error)
    }
  }

  const cancelOrder = async (orderId: string) => {
    try {
      setCancellingOrder(orderId)
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        await fetchOrders() // Refresh the orders list
        alert('Order cancelled successfully')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Failed to cancel order:', error)
      alert('Failed to cancel order')
    } finally {
      setCancellingOrder(null)
    }
  }

  const getStatusColor = (status: string) => {
    const statusObj = ORDER_STATUSES.find(s => s.value === status)
    return statusObj?.color || '#FFFFFF'
  }

  const canCancelOrder = (order: Order) => {
    return ['PENDING', 'CONFIRMED'].includes(order.status)
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
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
    <div style={{ minHeight: '100vh' }}>
      <Navigation />
      
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{
            color: 'var(--pink-main)',
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem',
            textShadow: '0 0 20px var(--pink-main)'
          }}>
            Order History
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1.2rem'
          }}>
            Track and manage your orders
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {ORDER_STATUSES.filter(status => status.value !== 'ALL').map((status) => (
            <div
              key={status.value}
              style={{
                background: 'rgba(0,0,0,0.6)',
                border: `1px solid ${status.color}`,
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{
                color: status.color,
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '0.5rem'
              }}>
                {stats[status.value] || 0}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem'
              }}>
                {status.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          border: '2px solid var(--cyan-accent)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Status Filter */}
            <div>
              <label style={{
                color: 'var(--white)',
                marginBottom: '0.5rem',
                display: 'block',
                fontSize: '0.9rem'
              }}>
                Filter by Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px',
                  color: 'var(--white)',
                  fontSize: '0.9rem',
                  minWidth: '150px'
                }}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status.value} value={status.value} style={{ background: '#000' }}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label style={{
                color: 'var(--white)',
                marginBottom: '0.5rem',
                display: 'block',
                fontSize: '0.9rem'
              }}>
                Sort by
              </label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-')
                  handleFilterChange({ ...filters, sortBy, sortOrder })
                }}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px',
                  color: 'var(--white)',
                  fontSize: '0.9rem',
                  minWidth: '150px'
                }}
              >
                <option value="createdAt-desc" style={{ background: '#000' }}>Newest First</option>
                <option value="createdAt-asc" style={{ background: '#000' }}>Oldest First</option>
                <option value="total-desc" style={{ background: '#000' }}>Highest Amount</option>
                <option value="total-asc" style={{ background: '#000' }}>Lowest Amount</option>
                <option value="status-asc" style={{ background: '#000' }}>Status A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--pink-main)' }}>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'rgba(255,255,255,0.6)',
            background: 'rgba(0,0,0,0.6)',
            border: '2px solid var(--pink-main)',
            borderRadius: '16px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ marginBottom: '1rem' }}>No orders found</h3>
            <p>
              {filters.status === 'ALL' 
                ? 'Start shopping to see your orders here!' 
                : `No orders with status "${filters.status}" found.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: '2px solid var(--pink-main)',
                  borderRadius: '16px',
                  padding: '2rem',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--cyan-accent)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,245,255,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--pink-main)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Order Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <h3 style={{ 
                      color: 'var(--white)', 
                      marginBottom: '0.5rem',
                      fontSize: '1.2rem'
                    }}>
                      Order #{order.orderNumber}
                    </h3>
                    <p style={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem'
                    }}>
                      Placed: {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p style={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      fontSize: '0.9rem'
                    }}>
                      Items: {order.items.length}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      color: getStatusColor(order.status),
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      fontSize: '1rem',
                      textShadow: `0 0 10px ${getStatusColor(order.status)}`
                    }}>
                      {order.status.replace('_', ' ')}
                    </div>
                    <div style={{ 
                      color: 'var(--pink-main)', 
                      fontWeight: '700',
                      fontSize: '1.3rem'
                    }}>
                      ${order.total.toFixed(2)} {order.currency}
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.8rem',
                      marginTop: '0.25rem'
                    }}>
                      Payment: {order.paymentStatus.toLowerCase()}
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  maxHeight: '120px',
                  overflow: 'hidden'
                }}>
                  {order.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{
                        width: '80px',
                        height: '80px',
                        background: item.sku.product.images[0] 
                          ? `url(${item.sku.product.images[0].url}) center/cover`
                          : 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }} />
                      <div style={{
                        color: 'var(--white)',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        marginBottom: '0.25rem'
                      }}>
                        {item.sku.product.name.substring(0, 20)}...
                      </div>
                      <div style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.7rem'
                      }}>
                        Qty: {item.quantity}
                      </div>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.9rem'
                    }}>
                      +{order.items.length - 4} more
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '1.5rem'
                }}>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(45deg, var(--cyan-accent), var(--purple-accent))',
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
                      e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,245,255,0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    View Details
                  </button>

                  {['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                    <button
                      onClick={() => fetchTracking(order.id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(0,245,255,0.2)',
                        border: '1px solid var(--cyan-accent)',
                        borderRadius: '8px',
                        color: 'var(--cyan-accent)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0,245,255,0.3)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0,245,255,0.2)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      Track Package
                    </button>
                  )}

                  {canCancelOrder(order) && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      disabled={cancellingOrder === order.id}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: cancellingOrder === order.id 
                          ? 'rgba(255,255,255,0.1)' 
                          : 'rgba(255,68,68,0.2)',
                        border: '1px solid #FF4444',
                        borderRadius: '8px',
                        color: cancellingOrder === order.id ? 'rgba(255,255,255,0.5)' : '#FF4444',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: cancellingOrder === order.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.background = 'rgba(255,68,68,0.3)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.background = 'rgba(255,68,68,0.2)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }
                      }}
                    >
                      {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '3rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              style={{
                padding: '0.75rem 1rem',
                background: pagination.page <= 1 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'rgba(255,107,157,0.2)',
                border: '1px solid var(--pink-main)',
                borderRadius: '8px',
                color: pagination.page <= 1 ? 'rgba(255,255,255,0.5)' : 'var(--pink-main)',
                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Previous
            </button>

            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum = i + 1
                if (pagination.pages > 5) {
                  const start = Math.max(1, pagination.page - 2)
                  const end = Math.min(pagination.pages, start + 4)
                  pageNum = start + i
                  if (pageNum > end) return null
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: '0.75rem 1rem',
                      background: pagination.page === pageNum 
                        ? 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))'
                        : 'rgba(255,255,255,0.1)',
                      border: '1px solid var(--pink-main)',
                      borderRadius: '8px',
                      color: 'var(--white)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minWidth: '45px'
                    }}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              style={{
                padding: '0.75rem 1rem',
                background: pagination.page >= pagination.pages 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'rgba(255,107,157,0.2)',
                border: '1px solid var(--pink-main)',
                borderRadius: '8px',
                color: pagination.page >= pagination.pages ? 'rgba(255,255,255,0.5)' : 'var(--pink-main)',
                cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Next
            </button>
          </div>
        )}

        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.9rem'
        }}>
          Showing {orders.length} of {pagination.total} orders
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.95)',
            border: '2px solid var(--pink-main)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            backdropFilter: 'blur(20px)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '1rem'
            }}>
              <h2 style={{
                color: 'var(--pink-main)',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                Order Details #{selectedOrder.orderNumber}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--pink-main)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--cyan-accent)'
                  e.currentTarget.style.transform = 'rotate(90deg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--pink-main)'
                  e.currentTarget.style.transform = 'rotate(0deg)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Order Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div>
                <h3 style={{
                  color: 'var(--cyan-accent)',
                  marginBottom: '1rem',
                  fontSize: '1.1rem'
                }}>
                  Order Information
                </h3>
                <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                  <p><strong>Status:</strong> <span style={{ color: getStatusColor(selectedOrder.status) }}>{selectedOrder.status}</span></p>
                  <p><strong>Payment:</strong> <span style={{ color: selectedOrder.paymentStatus === 'COMPLETED' ? 'var(--green-neon)' : 'var(--yellow-neon)' }}>{selectedOrder.paymentStatus}</span></p>
                  <p><strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p><strong>Last Updated:</strong> {new Date(selectedOrder.updatedAt).toLocaleDateString()}</p>
                  <p><strong>Total:</strong> <span style={{ color: 'var(--pink-main)', fontWeight: '700' }}>${selectedOrder.total.toFixed(2)} {selectedOrder.currency}</span></p>
                </div>
              </div>

              <div>
                <h3 style={{
                  color: 'var(--cyan-accent)',
                  marginBottom: '1rem',
                  fontSize: '1.1rem'
                }}>
                  Shipping Address
                </h3>
                <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                  <p><strong>{selectedOrder.shippingName}</strong></p>
                  <p>{selectedOrder.shippingAddress}</p>
                  <p>{selectedOrder.shippingCity}, {selectedOrder.shippingCountry}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 style={{
                color: 'var(--cyan-accent)',
                marginBottom: '1rem',
                fontSize: '1.1rem'
              }}>
                Items ({selectedOrder.items.length})
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: item.sku.product.images[0] 
                        ? `url(${item.sku.product.images[0].url}) center/cover`
                        : 'rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      flexShrink: 0
                    }} />
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        color: 'var(--white)',
                        marginBottom: '0.5rem',
                        fontSize: '1rem'
                      }}>
                        {item.sku.product.name}
                      </h4>
                      {(item.sku.size || item.sku.color) && (
                        <div style={{
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.9rem',
                          marginBottom: '0.5rem'
                        }}>
                          {item.sku.size && `Size: ${item.sku.size}`}
                          {item.sku.size && item.sku.color && ' • '}
                          {item.sku.color && `Color: ${item.sku.color}`}
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '0.9rem'
                        }}>
                          Quantity: {item.quantity}
                        </span>
                        <span style={{
                          color: 'var(--pink-main)',
                          fontWeight: '600',
                          fontSize: '1rem'
                        }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTracking && trackingInfo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.95)',
            border: '2px solid var(--cyan-accent)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            backdropFilter: 'blur(20px)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '1rem'
            }}>
              <div>
                <h2 style={{
                  color: 'var(--cyan-accent)',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem'
                }}>
                  Package Tracking
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.9rem'
                }}>
                  Tracking: {trackingInfo.trackingNumber}
                </p>
              </div>
              <button
                onClick={() => setShowTracking(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cyan-accent)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--pink-main)'
                  e.currentTarget.style.transform = 'rotate(90deg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--cyan-accent)'
                  e.currentTarget.style.transform = 'rotate(0deg)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Current Status */}
            <div style={{
              background: 'rgba(0,245,255,0.1)',
              border: '1px solid var(--cyan-accent)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '0.5rem'
              }}>
                {trackingInfo.currentStatus.icon}
              </div>
              <h3 style={{
                color: 'var(--cyan-accent)',
                marginBottom: '0.5rem',
                fontSize: '1.2rem'
              }}>
                {trackingInfo.currentStatus.status}
              </h3>
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '0.5rem'
              }}>
                {trackingInfo.currentStatus.description}
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.9rem'
              }}>
                {new Date(trackingInfo.currentStatus.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Estimated Delivery */}
            {trackingInfo.status !== 'DELIVERED' && (
              <div style={{
                background: 'rgba(255,107,157,0.1)',
                border: '1px solid var(--pink-main)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <p style={{
                  color: 'var(--pink-main)',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Estimated Delivery
                </p>
                <p style={{
                  color: 'var(--white)',
                  fontSize: '1.1rem'
                }}>
                  {new Date(trackingInfo.estimatedDelivery).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Tracking Timeline */}
            <div>
              <h3 style={{
                color: 'var(--white)',
                marginBottom: '1rem',
                fontSize: '1.1rem'
              }}>
                Tracking History
              </h3>
              <div style={{
                position: 'relative'
              }}>
                {/* Timeline Line */}
                <div style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '0.75rem',
                  bottom: '0.75rem',
                  width: '2px',
                  background: 'linear-gradient(to bottom, var(--cyan-accent), var(--pink-main))',
                  opacity: 0.3
                }} />
                
                {trackingInfo.events.map((event, index) => (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                      position: 'relative'
                    }}
                  >
                    {/* Timeline Dot */}
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      background: index === trackingInfo.events.length - 1 
                        ? 'linear-gradient(45deg, var(--cyan-accent), var(--pink-main))'
                        : 'rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      flexShrink: 0,
                      zIndex: 1,
                      position: 'relative'
                    }}>
                      {event.icon}
                    </div>
                    
                    {/* Event Details */}
                    <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                      <h4 style={{
                        color: 'var(--white)',
                        marginBottom: '0.25rem',
                        fontSize: '0.95rem',
                        fontWeight: '600'
                      }}>
                        {event.status}
                      </h4>
                      <p style={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.85rem',
                        marginBottom: '0.25rem',
                        lineHeight: '1.4'
                      }}>
                        {event.description}
                      </p>
                      {event.location && (
                        <p style={{
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.8rem',
                          marginBottom: '0.25rem'
                        }}>
                          📍 {event.location}
                        </p>
                      )}
                      <p style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.8rem'
                      }}>
                        {new Date(event.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <h4 style={{
                color: 'var(--white)',
                marginBottom: '0.5rem',
                fontSize: '0.9rem'
              }}>
                Shipping Details
              </h4>
              <div style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.8rem',
                lineHeight: '1.5'
              }}>
                <p><strong>Carrier:</strong> {trackingInfo.shippingInfo.carrier}</p>
                <p><strong>Method:</strong> {trackingInfo.shippingInfo.method}</p>
                <p><strong>Delivery Address:</strong></p>
                <p style={{ marginLeft: '1rem' }}>
                  {trackingInfo.shippingInfo.address.name}<br />
                  {trackingInfo.shippingInfo.address.line1}<br />
                  {trackingInfo.shippingInfo.address.city}, {trackingInfo.shippingInfo.address.country} {trackingInfo.shippingInfo.address.zipCode}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}