'use client'

import { useCart } from '@/contexts/CartContext'
import { useEffect, useState } from 'react'

export default function TestCheckoutPage() {
  const { state } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
      <h1>Test Checkout Page</h1>
      <p>Mounted: {mounted ? 'Yes' : 'No'}</p>
      <p>Cart items: {state.items.length}</p>
      <p>Cart total: ${state.total.toFixed(2)}</p>
      
      <h2>Cart Items:</h2>
      {state.items.map((item, index) => (
        <div key={index} style={{ margin: '1rem 0', padding: '1rem', border: '1px solid white' }}>
          <p>Product: {item.productName}</p>
          <p>Price: ${item.price}</p>
          <p>Quantity: {item.quantity}</p>
        </div>
      ))}
      
      {state.items.length === 0 && <p>Cart is empty!</p>}
    </div>
  )
}