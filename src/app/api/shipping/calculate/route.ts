import { NextRequest, NextResponse } from 'next/server'
import { calculateShipping, canShipToCountry } from '@/lib/meest-shipping'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      countryCode, 
      items, 
      packageType = 'box', 
      currency = 'USD' 
    } = body

    // Валидация обязательных полей
    if (!countryCode || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields: countryCode, items' },
        { status: 400 }
      )
    }

    // Рассчитать общий вес всех товаров
    const totalWeight = items.reduce((total: number, item: any) => {
      const itemWeight = item.weight || 0.5 // default 0.5kg if weight not specified
      return total + (item.quantity * itemWeight)
    }, 0)

    // Проверить возможность доставки
    const shippingCheck = canShipToCountry(countryCode, totalWeight)
    
    if (!shippingCheck.canShip) {
      return NextResponse.json({
        success: false,
        error: shippingCheck.reason,
        maxWeight: shippingCheck.maxWeight
      }, { status: 400 })
    }

    // Рассчитать стоимость доставки
    const shippingResult = calculateShipping(
      countryCode,
      packageType as 'box' | 'package',
      totalWeight,
      undefined, // dimensions not specified
      currency as 'UAH' | 'USD'
    )

    return NextResponse.json({
      success: true,
      shipping: {
        ...shippingResult,
        totalWeight,
        items: items.map((item: any) => ({
          productId: item.productId,
          weight: item.weight || 0.5,
          quantity: item.quantity,
          totalWeight: (item.weight || 0.5) * item.quantity
        }))
      }
    })

  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate shipping cost' },
      { status: 500 }
    )
  }
}