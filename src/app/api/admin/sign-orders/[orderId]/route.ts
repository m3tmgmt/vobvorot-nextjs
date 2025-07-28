import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

// PATCH - Update sign order (upload photo, update status)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization')
    const adminApiKey = process.env.ADMIN_API_KEY
    
    if (!authHeader || !adminApiKey || authHeader !== `Bearer ${adminApiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId } = await context.params
    const body = await request.json()
    const { action, photoUrl, status } = body

    // Find order with sign details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        orderType: 'SIGN_PHOTO'
      },
      include: {
        signOrder: true,
        user: true
      }
    })

    if (!order || !order.signOrder) {
      return NextResponse.json(
        { error: 'Sign order not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'upload_photo':
        if (!photoUrl) {
          return NextResponse.json(
            { error: 'Photo URL is required' },
            { status: 400 }
          )
        }

        // Update sign order with photo URL
        await prisma.signOrder.update({
          where: { id: order.signOrder.id },
          data: {
            photoUrl: photoUrl,
            updatedAt: new Date()
          }
        })

        // Update order status to processing
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING'
          }
        })

        logger.info('Sign photo uploaded', {
          orderId,
          photoUrl
        })

        return NextResponse.json({
          success: true,
          message: 'Photo uploaded successfully'
        })

      case 'send_photo':
        if (!order.signOrder.photoUrl) {
          return NextResponse.json(
            { error: 'No photo uploaded yet' },
            { status: 400 }
          )
        }

        // Send email with photo
        try {
          await sendEmail({
            to: order.shippingEmail,
            subject: `Your custom sign photo is ready! - Order ${order.orderNumber}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f0f0f0;
                    margin: 0;
                    padding: 20px;
                  }
                  .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  }
                  .header {
                    background: linear-gradient(135deg, #FF6B9D, #9D4EDD);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                  }
                  .content {
                    padding: 40px 30px;
                    text-align: center;
                  }
                  .photo-container {
                    margin: 30px 0;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                  }
                  .photo-container img {
                    width: 100%;
                    height: auto;
                    display: block;
                  }
                  .message {
                    font-size: 18px;
                    line-height: 1.6;
                    color: #333;
                    margin: 20px 0;
                  }
                  .footer {
                    background-color: #f8f8f8;
                    padding: 30px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0; font-size: 32px;">✨ Your Sign is Ready! ✨</h1>
                  </div>
                  <div class="content">
                    <p class="message">
                      Hey ${order.shippingName}! 💕<br><br>
                      Your custom sign photo is here and it's absolutely gorgeous!<br>
                      Thanks for trusting me with your special moment.
                    </p>
                    <div class="photo-container">
                      <img src="${order.signOrder.photoUrl}" alt="Your custom sign photo">
                    </div>
                    <p class="message">
                      <strong>"${order.signOrder.signName}"</strong><br><br>
                      ${order.signOrder.extraNotes ? `Your note: ${order.signOrder.extraNotes}<br><br>` : ''}
                      Stay golden, stay iconic. ✨
                    </p>
                  </div>
                  <div class="footer">
                    <p>
                      Order #${order.orderNumber}<br>
                      EXVICPMOUR - Your Name, My Pic<br>
                      © 2024 All rights reserved
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `
Hey ${order.shippingName}!

Your custom sign photo is ready!

Sign text: "${order.signOrder.signName}"
${order.signOrder.extraNotes ? `Your note: ${order.signOrder.extraNotes}` : ''}

View your photo here: ${order.signOrder.photoUrl}

Stay golden, stay iconic. ✨

Order #${order.orderNumber}
EXVICPMOUR - Your Name, My Pic
            `
          })

          // Update sign order delivery status
          await prisma.signOrder.update({
            where: { id: order.signOrder.id },
            data: {
              deliveredAt: new Date()
            }
          })

          // Update order status to delivered
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'DELIVERED'
            }
          })

          logger.info('Sign photo sent to customer', {
            orderId,
            customerEmail: order.shippingEmail
          })

          return NextResponse.json({
            success: true,
            message: 'Photo sent to customer successfully'
          })

        } catch (emailError) {
          logger.error('Failed to send sign photo email', {
            orderId,
            error: emailError
          })
          
          return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
          )
        }

      case 'update_status':
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required' },
            { status: 400 }
          )
        }

        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: status
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Status updated successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Sign order update error', {
      orderId: (await context.params).orderId,
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get sign order details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        orderType: 'SIGN_PHOTO'
      },
      include: {
        signOrder: true,
        payment: true,
        orderLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Sign order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        signDetails: order.signOrder
      }
    })

  } catch (error) {
    logger.error('Sign order fetch error', {
      orderId: (await context.params).orderId,
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      { error: 'Failed to fetch sign order' },
      { status: 500 }
    )
  }
}