#!/usr/bin/env tsx

/**
 * Data Migration Script: SQLite to PostgreSQL
 * 
 * This script migrates data from SQLite to PostgreSQL while handling
 * data type conversions and maintaining referential integrity.
 */

import { PrismaClient as SQLitePrisma } from '@prisma/client'
import { PrismaClient as PostgresPrisma } from '@prisma/client'
import { createReadStream, createWriteStream } from 'fs'
import { join } from 'path'

// Configure clients
const sqliteClient = new SQLitePrisma({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
})

const postgresClient = new PostgresPrisma({
  datasources: {
    db: {
      url: process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL
    }
  }
})

interface MigrationStats {
  table: string
  migrated: number
  errors: number
  startTime: Date
  endTime?: Date
}

class DataMigrator {
  private stats: MigrationStats[] = []
  private logFile: string

  constructor() {
    this.logFile = join(process.cwd(), 'migration.log')
  }

  private log(message: string, error?: Error) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}${error ? ` ERROR: ${error.message}` : ''}\n`
    
    console.log(logMessage.trim())
    
    // Write to log file
    const stream = createWriteStream(this.logFile, { flags: 'a' })
    stream.write(logMessage)
    stream.end()
  }

  private startTableMigration(table: string): MigrationStats {
    const stat: MigrationStats = {
      table,
      migrated: 0,
      errors: 0,
      startTime: new Date()
    }
    this.stats.push(stat)
    this.log(`Starting migration for table: ${table}`)
    return stat
  }

  private endTableMigration(stat: MigrationStats) {
    stat.endTime = new Date()
    const duration = stat.endTime.getTime() - stat.startTime.getTime()
    this.log(`Completed migration for table: ${stat.table}. Migrated: ${stat.migrated}, Errors: ${stat.errors}, Duration: ${duration}ms`)
  }

  async migrateUsers() {
    const stat = this.startTableMigration('users')
    
    try {
      const users = await sqliteClient.user.findMany({
        include: {
          accounts: true,
          sessions: true
        }
      })

      for (const user of users) {
        try {
          // Convert user data
          const userData = {
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            name: user.name,
            password: user.password,
            image: user.image,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            // New fields with defaults
            isActive: true,
            newsletter: false,
            language: 'en'
          }

          await postgresClient.user.create({
            data: userData
          })

          // Migrate accounts
          for (const account of user.accounts) {
            await postgresClient.account.create({
              data: {
                id: account.id,
                userId: account.userId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state
              }
            })
          }

          // Migrate sessions
          for (const session of user.sessions) {
            await postgresClient.session.create({
              data: {
                id: session.id,
                sessionToken: session.sessionToken,
                userId: session.userId,
                expires: session.expires
              }
            })
          }

          stat.migrated++
        } catch (error) {
          stat.errors++
          this.log(`Error migrating user ${user.id}`, error as Error)
        }
      }
    } catch (error) {
      this.log('Error in user migration', error as Error)
    }

    this.endTableMigration(stat)
  }

  async migrateCategories() {
    const stat = this.startTableMigration('categories')
    
    try {
      const categories = await sqliteClient.category.findMany()

      for (const category of categories) {
        try {
          const categoryData = {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            parentId: category.parentId,
            // New fields with defaults
            isActive: true,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          await postgresClient.category.create({
            data: categoryData
          })

          stat.migrated++
        } catch (error) {
          stat.errors++
          this.log(`Error migrating category ${category.id}`, error as Error)
        }
      }
    } catch (error) {
      this.log('Error in category migration', error as Error)
    }

    this.endTableMigration(stat)
  }

  async migrateProducts() {
    const stat = this.startTableMigration('products')
    
    try {
      const products = await sqliteClient.product.findMany({
        include: {
          images: true,
          skus: true
        }
      })

      for (const product of products) {
        try {
          // Migrate product
          const productData = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            brand: product.brand,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            // New fields with defaults
            isActive: true
          }

          await postgresClient.product.create({
            data: productData
          })

          // Migrate product images
          for (const image of product.images) {
            await postgresClient.productImage.create({
              data: {
                id: image.id,
                url: image.url,
                alt: image.alt,
                isPrimary: image.isPrimary,
                productId: image.productId,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
          }

          // Migrate product SKUs
          for (const sku of product.skus) {
            await postgresClient.productSku.create({
              data: {
                id: sku.id,
                sku: sku.sku,
                size: sku.size,
                color: sku.color,
                price: sku.price,
                stock: sku.stock,
                productId: sku.productId,
                // New fields with defaults
                isActive: true,
                lowStockThreshold: 5,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
          }

          stat.migrated++
        } catch (error) {
          stat.errors++
          this.log(`Error migrating product ${product.id}`, error as Error)
        }
      }
    } catch (error) {
      this.log('Error in product migration', error as Error)
    }

    this.endTableMigration(stat)
  }

  async migrateOrders() {
    const stat = this.startTableMigration('orders')
    
    try {
      const orders = await sqliteClient.order.findMany({
        include: {
          items: {
            include: {
              sku: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      })

      for (const order of orders) {
        try {
          // Migrate order
          const orderData = {
            id: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            status: order.status,
            shippingName: order.shippingName,
            shippingEmail: order.shippingEmail,
            shippingPhone: order.shippingPhone,
            shippingAddress: order.shippingAddress,
            shippingCity: order.shippingCity,
            shippingCountry: order.shippingCountry,
            shippingZip: order.shippingZip,
            subtotal: order.subtotal,
            shippingCost: order.shippingCost,
            total: order.total,
            currency: order.currency,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paymentId: order.paymentId,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            // New fields with defaults
            tax: 0,
            discount: 0
          }

          await postgresClient.order.create({
            data: orderData
          })

          // Migrate order items
          for (const item of order.items) {
            await postgresClient.orderItem.create({
              data: {
                id: item.id,
                orderId: item.orderId,
                skuId: item.skuId,
                quantity: item.quantity,
                price: item.price,
                // Snapshot data
                productName: item.sku.product.name,
                productSku: item.sku.sku
              }
            })
          }

          stat.migrated++
        } catch (error) {
          stat.errors++
          this.log(`Error migrating order ${order.id}`, error as Error)
        }
      }
    } catch (error) {
      this.log('Error in order migration', error as Error)
    }

    this.endTableMigration(stat)
  }

  async migrateReviews() {
    const stat = this.startTableMigration('reviews')
    
    try {
      const reviews = await sqliteClient.review.findMany()

      for (const review of reviews) {
        try {
          await postgresClient.review.create({
            data: {
              id: review.id,
              userId: review.userId,
              productId: review.productId,
              rating: review.rating,
              title: review.title,
              comment: review.comment,
              createdAt: review.createdAt,
              updatedAt: review.updatedAt
            }
          })

          stat.migrated++
        } catch (error) {
          stat.errors++
          this.log(`Error migrating review ${review.id}`, error as Error)
        }
      }
    } catch (error) {
      this.log('Error in review migration', error as Error)
    }

    this.endTableMigration(stat)
  }

  async migrateWishlist() {
    const stat = this.startTableMigration('wishlist_items')
    
    try {
      const wishlistItems = await sqliteClient.wishlistItem.findMany()

      for (const item of wishlistItems) {
        try {
          await postgresClient.wishlistItem.create({
            data: {
              id: item.id,
              userId: item.userId,
              productId: item.productId,
              createdAt: item.createdAt
            }
          })

          stat.migrated++
        } catch (error) {
          stat.errors++
          this.log(`Error migrating wishlist item ${item.id}`, error as Error)
        }
      }
    } catch (error) {
      this.log('Error in wishlist migration', error as Error)
    }

    this.endTableMigration(stat)
  }

  async migrateVerificationTokens() {
    const stat = this.startTableMigration('verification_tokens')
    
    try {
      const tokens = await sqliteClient.verificationToken.findMany()

      for (const token of tokens) {
        try {
          await postgresClient.verificationToken.create({
            data: {
              identifier: token.identifier,
              token: token.token,
              expires: token.expires
            }
          })

          stat.migrated++
        } catch (error) {
          stat.errors++
          this.log(`Error migrating verification token`, error as Error)
        }
      }
    } catch (error) {
      this.log('Error in verification token migration', error as Error)
    }

    this.endTableMigration(stat)
  }

  async migrate() {
    this.log('Starting complete data migration from SQLite to PostgreSQL')
    
    try {
      // Migration order is important due to foreign keys
      await this.migrateUsers()
      await this.migrateCategories()
      await this.migrateProducts()
      await this.migrateOrders()
      await this.migrateReviews()
      await this.migrateWishlist()
      await this.migrateVerificationTokens()

      this.log('Migration completed successfully')
      this.printSummary()
    } catch (error) {
      this.log('Migration failed', error as Error)
      throw error
    }
  }

  private printSummary() {
    console.log('\n=== Migration Summary ===')
    console.log('Table\t\t\tMigrated\tErrors\t\tDuration')
    console.log('─'.repeat(60))
    
    let totalMigrated = 0
    let totalErrors = 0
    
    for (const stat of this.stats) {
      const duration = stat.endTime 
        ? stat.endTime.getTime() - stat.startTime.getTime()
        : 0
      
      console.log(
        `${stat.table.padEnd(20)}\t${stat.migrated}\t\t${stat.errors}\t\t${duration}ms`
      )
      
      totalMigrated += stat.migrated
      totalErrors += stat.errors
    }
    
    console.log('─'.repeat(60))
    console.log(`Total:\t\t\t${totalMigrated}\t\t${totalErrors}`)
    console.log(`\nLog file: ${this.logFile}`)
  }
}

// Run migration
async function main() {
  const migrator = new DataMigrator()
  
  try {
    await migrator.migrate()
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await sqliteClient.$disconnect()
    await postgresClient.$disconnect()
  }
}

if (require.main === module) {
  main()
}

export { DataMigrator }