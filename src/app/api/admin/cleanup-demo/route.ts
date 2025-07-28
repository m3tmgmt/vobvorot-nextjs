import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем admin access
    const authHeader = request.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== adminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('🧹 Starting demo data cleanup...')
    
    // Находим все демо товары
    const demoProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'Sample' } },
          { name: { contains: 'Demo' } },
          { name: { contains: 'Test' } },
          { description: { contains: 'sample' } },
          { description: { contains: 'demo' } },
          { description: { contains: 'test' } }
        ]
      },
      include: {
        skus: true,
        images: true
      }
    })
    
    console.log(`📦 Found ${demoProducts.length} demo products`)
    
    let deletedCount = 0
    
    for (const product of demoProducts) {
      console.log(`🗑️ Deleting demo product: ${product.name}`)
      
      // Удаляем связанные данные
      await prisma.productImage.deleteMany({
        where: { productId: product.id }
      })
      
      await prisma.productSku.deleteMany({
        where: { productId: product.id }
      })
      
      // Удаляем сам товар
      await prisma.product.delete({
        where: { id: product.id }
      })
      
      deletedCount++
    }
    
    // Также проверяем и удаляем демо заказы если есть
    const demoOrders = await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: 'DEMO' } },
          { orderNumber: { contains: 'TEST' } },
          { orderNumber: { contains: 'SAMPLE' } }
        ]
      }
    })
    
    let deletedOrdersCount = 0
    
    for (const order of demoOrders) {
      console.log(`🗑️ Deleting demo order: ${order.orderNumber}`)
      
      // Удаляем items заказа
      await prisma.orderItem.deleteMany({
        where: { orderId: order.id }
      })
      
      // Удаляем сам заказ
      await prisma.order.delete({
        where: { id: order.id }
      })
      
      deletedOrdersCount++
    }
    
    console.log(`✅ Cleanup completed: ${deletedCount} products, ${deletedOrdersCount} orders deleted`)
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      deleted: {
        products: deletedCount,
        orders: deletedOrdersCount
      }
    })
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup demo data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Проверяем что есть демо данные
    const demoProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'Sample' } },
          { name: { contains: 'Demo' } },
          { name: { contains: 'Test' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true
      }
    })
    
    const demoOrders = await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: 'DEMO' } },
          { orderNumber: { contains: 'TEST' } },
          { orderNumber: { contains: 'SAMPLE' } }
        ]
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({
      success: true,
      demoData: {
        products: demoProducts,
        orders: demoOrders
      },
      counts: {
        products: demoProducts.length,
        orders: demoOrders.length
      }
    })
    
  } catch (error) {
    console.error('❌ Error checking demo data:', error)
    return NextResponse.json(
      { error: 'Failed to check demo data' },
      { status: 500 }
    )
  }
}