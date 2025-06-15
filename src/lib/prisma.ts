import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool settings
    ...(process.env.DATABASE_URL?.includes('postgresql') && {
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?connection_limit=5&pool_timeout=2',
        },
      },
    }),
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}