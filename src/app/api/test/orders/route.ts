import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// import { WesternBidService } from '@/lib/westernbid';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Test route disabled during deployment' });
  /*
  try {
    // Test order flow end-to-end
    console.log('🧪 Starting order flow test...');

    // 1. Create test category first
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: `test-category-${Date.now()}`,
        description: 'Test category for order flow validation',
        isActive: true,
      }
    });
    
    // 2. Create test product
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product - VobVorot',
        slug: `test-product-${Date.now()}`,
        description: 'Test product for order flow validation',
        categoryId: testCategory.id,
        isActive: true,
      }
    });
    console.log('✅ Test product created:', testProduct.id);

    // 3. Create test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Test Customer',
        email: `test-${Date.now()}@vobvorot.com`,
        phone: '+1234567890',
      }
    });
    console.log('✅ Test user created:', testUser.id);

    // 4. Create test order
    const testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        totalAmount: 29.99,
        status: 'PENDING',
        items: {
          create: [{
            productId: testProduct.id,
            quantity: 1,
            price: 29.99,
          }]
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });
    console.log('✅ Test order created:', testOrder.id);

    // 5. Test WesternBid payment (mock)
    const paymentResult = {
      paymentId: `payment_${Date.now()}`,
      success: true
    };
    console.log('✅ Payment created (mock):', paymentResult.paymentId);

    // 6. Simulate payment success
    if (true) {
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { 
          status: 'COMPLETED',
          paymentId: paymentResult.paymentId,
          paymentStatus: 'completed'
        }
      });
      console.log('✅ Payment marked as successful (mock mode)');

      // Update inventory
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stock: { decrement: 1 } }
      });
      console.log('✅ Inventory updated');
    }

    // 7. Test Telegram notification (if enabled)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.OWNER_TELEGRAM_ID) {
      try {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.OWNER_TELEGRAM_ID,
            text: `🧪 Test Order #${testOrder.id}\n💰 Amount: $${testOrder.totalAmount}\n✅ Payment: ${paymentResult.paymentId}\n🎯 Status: Order flow test completed successfully`,
            parse_mode: 'HTML'
          })
        });
        console.log('✅ Telegram notification sent');
      } catch (error) {
        console.warn('⚠️ Telegram notification failed:', error);
      }
    }

    // 8. Cleanup - delete test data
    await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
    await prisma.order.delete({ where: { id: testOrder.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.product.delete({ where: { id: testProduct.id } });
    await prisma.category.delete({ where: { id: testCategory.id } });
    console.log('✅ Test data cleaned up');

    return NextResponse.json({
      success: true,
      message: 'Order flow test completed successfully',
      testResults: {
        productCreation: '✅ PASS',
        customerCreation: '✅ PASS',
        orderCreation: '✅ PASS',
        paymentProcessing: '✅ PASS',
        inventoryUpdate: '✅ PASS',
        telegramNotification: process.env.TELEGRAM_BOT_TOKEN ? '✅ PASS' : '⚠️ SKIP',
        dataCleanup: '✅ PASS'
      },
      details: {
        orderId: testOrder.id,
        paymentId: paymentResult.paymentId,
        amount: testOrder.totalAmount,
        mockMode: true
      }
    });

  } catch (error) {
    console.error('❌ Order flow test failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Order flow test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
  */
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Order flow test endpoint',
    usage: 'POST to this endpoint to run a complete order flow test',
    note: 'This will create and clean up test data automatically'
  });
}