import { NextRequest, NextResponse } from 'next/server'
import { reserveStock, InventoryItem, checkStockAvailability } from '@/lib/inventory-management'

export async function POST(request: NextRequest) {
  try {
    const { items, sessionId } = await request.json()

    // Validate request data
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid cart items provided' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Format items for inventory management
    const inventoryItems: InventoryItem[] = items.map((item: any) => ({
      skuId: item.skuId,
      quantity: item.quantity || 1
    }))

    console.log(`=== CART RESERVATION REQUEST ===`)
    console.log(`Session ID: ${sessionId}`)
    console.log(`Items to reserve:`, inventoryItems)

    // Check stock availability first
    const availability = await checkStockAvailability(inventoryItems)
    if (!availability.available) {
      return NextResponse.json({
        success: false,
        error: 'Some items are not available in requested quantities',
        unavailableItems: availability.unavailableItems
      }, { status: 409 })
    }

    // Reserve stock for 5 minutes without order ID (temporary reservation)
    console.log('Calling reserveStock with:', {
      items: inventoryItems,
      orderId: null // Temporary reservation without order
    })
    
    const reservationResults = await reserveStock(inventoryItems)
    
    console.log('reserveStock returned:', JSON.stringify(reservationResults, null, 2))

    // Check if all reservations were successful
    const failedReservations = reservationResults.filter(result => !result.success)
    
    if (failedReservations.length > 0) {
      console.error('Some reservations failed:', failedReservations)
      return NextResponse.json({
        success: false,
        error: 'Failed to reserve some items',
        failures: failedReservations
      }, { status: 409 })
    }

    const reservationIds = reservationResults
      .filter(result => result.success && result.reservationId)
      .map(result => result.reservationId!)
    
    // Prepare reservation data for frontend stock updates  
    const reservations = reservationResults
      .filter(result => result.success)
      .map(result => ({
        skuId: result.skuId,
        reservedStock: result.reservedStock || 0,
        originalStock: result.originalStock || 0
      }))

    console.log(`Successfully reserved ${reservationIds.length} items`)
    console.log(`Reservation IDs:`, reservationIds)

    return NextResponse.json({
      success: true,
      message: `Successfully reserved ${reservationIds.length} items for 5 minutes`,
      reservationIds,
      reservations, // Include reservation details for frontend
      sessionId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('Cart reservation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Release cart reservations
export async function DELETE(request: NextRequest) {
  try {
    const { reservationIds } = await request.json()

    if (!reservationIds || !Array.isArray(reservationIds)) {
      return NextResponse.json(
        { success: false, error: 'Reservation IDs are required' },
        { status: 400 }
      )
    }

    // Import the function we need
    const { releaseReservation } = await import('@/lib/inventory-management')
    
    let releasedCount = 0
    for (const reservationId of reservationIds) {
      const released = await releaseReservation(reservationId)
      if (released) releasedCount++
    }

    console.log(`Released ${releasedCount} of ${reservationIds.length} reservations`)
    
    return NextResponse.json({
      success: true,
      message: `Released ${releasedCount} cart reservations successfully`,
      releasedCount
    })

  } catch (error) {
    console.error('Cart reservation release error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}