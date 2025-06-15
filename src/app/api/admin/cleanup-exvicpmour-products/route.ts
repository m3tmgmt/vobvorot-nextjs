import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🧹 Removing extra EXVICPMOUR products...')

    // Get all EXVICPMOUR products
    const exvicpmourProducts = await prisma.product.findMany({
      where: {
        category: {
          slug: 'exvicpmour'
        }
      },
      include: {
        images: true,
        skus: true,
        category: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`Found ${exvicpmourProducts.length} EXVICPMOUR products`)

    if (exvicpmourProducts.length <= 2) {
      return NextResponse.json({
        success: true,
        message: `Only ${exvicpmourProducts.length} EXVICPMOUR products found. No cleanup needed.`,
        products: exvicpmourProducts
      })
    }

    // Keep only the first 2 products (oldest ones - these are likely the real ones)
    const productsToKeep = exvicpmourProducts.slice(0, 2)
    const productsToDelete = exvicpmourProducts.slice(2)

    console.log(`Keeping ${productsToKeep.length} products, deleting ${productsToDelete.length} products`)

    const deletedProducts = []

    // Delete extra products
    for (const product of productsToDelete) {
      console.log(`Deleting product: ${product.name} (ID: ${product.id})`)

      // Delete any order items that reference the product SKUs
      for (const sku of product.skus) {
        await prisma.orderItem.deleteMany({
          where: { skuId: sku.id }
        })
      }

      // Delete product images
      await prisma.productImage.deleteMany({
        where: { productId: product.id }
      })

      // Delete product SKUs
      await prisma.productSku.deleteMany({
        where: { productId: product.id }
      })

      // Delete the product
      await prisma.product.delete({
        where: { id: product.id }
      })

      deletedProducts.push({
        id: product.id,
        name: product.name,
        slug: product.slug
      })
    }

    // Get final state
    const finalProducts = await prisma.product.findMany({
      where: {
        category: {
          slug: 'exvicpmour'
        }
      },
      include: {
        images: true,
        skus: true,
        category: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedProducts.length} extra EXVICPMOUR products`,
      kept_products: productsToKeep.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug
      })),
      deleted_products: deletedProducts,
      final_state: {
        total_products: finalProducts.length,
        products: finalProducts.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          isActive: p.isActive
        }))
      }
    })

  } catch (error) {
    console.error('❌ Error cleaning up EXVICPMOUR products:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to cleanup EXVICPMOUR products'
    }, { status: 500 })
  }
}