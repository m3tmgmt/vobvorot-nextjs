import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'Missing productId'
      }, { status: 400 })
    }

    // Найти товар
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        skus: true
      }
    })

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 })
    }

    // Архивировать товар (установить isActive: false)
    await prisma.$transaction(async (tx) => {
      // Архивировать сам товар
      await tx.product.update({
        where: { id: productId },
        data: { isActive: false }
      })

      // Архивировать все SKU товара
      await tx.productSku.updateMany({
        where: { productId: productId },
        data: { isActive: false }
      })
    })

    return NextResponse.json({
      success: true,
      message: `Товар "${product.name}" успешно архивирован`,
      data: {
        productId: product.id,
        productName: product.name,
        archivedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Archive product error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to archive product',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}