import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking for duplicate EXVICPMOUR categories...')

    // Get all categories with name EXVICPMOUR or slug exvicpmour
    const exvicpmourCategories = await prisma.category.findMany({
      where: {
        OR: [
          { name: 'EXVICPMOUR' },
          { slug: 'exvicpmour' }
        ]
      },
      include: {
        products: {
          include: {
            images: true,
            skus: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`Found ${exvicpmourCategories.length} EXVICPMOUR categories`)

    if (exvicpmourCategories.length <= 1) {
      return NextResponse.json({
        success: true,
        message: 'No duplicate EXVICPMOUR categories found',
        categories_found: exvicpmourCategories.length,
        categories: exvicpmourCategories
      })
    }

    // Keep the newest category (last in the array)
    const categoryToKeep = exvicpmourCategories[exvicpmourCategories.length - 1]
    const categoriesToDelete = exvicpmourCategories.slice(0, -1)

    console.log(`Keeping category ID: ${categoryToKeep.id} (${categoryToKeep.name})`)
    console.log(`Deleting ${categoriesToDelete.length} old categories`)

    const deletedProducts = []
    const deletedCategories = []

    // Delete old categories and their products
    for (const category of categoriesToDelete) {
      console.log(`Deleting category ${category.id} with ${category.products.length} products`)

      // Delete all products in this category
      for (const product of category.products) {
        // First delete any order items that reference the product SKUs
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
          categoryId: category.id
        })
      }

      // Delete the category
      await prisma.category.delete({
        where: { id: category.id }
      })

      deletedCategories.push({
        id: category.id,
        name: category.name,
        productCount: category.products.length
      })
    }

    // Get final state
    const finalCategories = await prisma.category.findMany({
      where: {
        OR: [
          { name: 'EXVICPMOUR' },
          { slug: 'exvicpmour' }
        ]
      },
      include: {
        products: {
          include: {
            images: true,
            skus: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedCategories.length} duplicate categories and ${deletedProducts.length} products`,
      kept_category: {
        id: categoryToKeep.id,
        name: categoryToKeep.name,
        slug: categoryToKeep.slug,
        product_count: categoryToKeep.products.length
      },
      deleted: {
        categories: deletedCategories,
        products: deletedProducts
      },
      final_state: {
        categories_count: finalCategories.length,
        categories: finalCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          product_count: cat.products.length,
          products: cat.products.map(p => ({
            id: p.id,
            name: p.name,
            isActive: p.isActive
          }))
        }))
      }
    })

  } catch (error) {
    console.error('❌ Error cleaning up EXVICPMOUR categories:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to cleanup EXVICPMOUR categories'
    }, { status: 500 })
  }
}