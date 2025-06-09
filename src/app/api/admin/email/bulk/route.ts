import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { sendBulkOrderNotifications, sendMarketingEmail, getEmailStats } from '@/lib/email-utils'

interface BulkEmailRequest {
  action: 'bulk-notifications' | 'marketing' | 'stats'
  type?: 'confirmation' | 'status-update'
  orderIds?: string[]
  status?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  dateFrom?: string
  dateTo?: string
  subject?: string
  htmlContent?: string
  textContent?: string
  customerIds?: string[]
  onlyRecentCustomers?: boolean
  daysBack?: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body: BulkEmailRequest = await request.json()
    
    if (!body.action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    switch (body.action) {
      case 'bulk-notifications':
        if (!body.type) {
          return NextResponse.json(
            { error: 'Type is required for bulk notifications' },
            { status: 400 }
          )
        }

        const options = {
          orderIds: body.orderIds,
          status: body.status,
          dateFrom: body.dateFrom ? new Date(body.dateFrom) : undefined,
          dateTo: body.dateTo ? new Date(body.dateTo) : undefined
        }

        const notificationResults = await sendBulkOrderNotifications(body.type, options)
        
        return NextResponse.json({
          success: true,
          results: notificationResults,
          message: `Bulk ${body.type} emails processed. Success: ${notificationResults.success}, Failed: ${notificationResults.failed}`
        })

      case 'marketing':
        if (!body.subject || !body.htmlContent) {
          return NextResponse.json(
            { error: 'Subject and HTML content are required for marketing emails' },
            { status: 400 }
          )
        }

        const marketingOptions = {
          customerIds: body.customerIds,
          onlyRecentCustomers: body.onlyRecentCustomers,
          daysBack: body.daysBack
        }

        const marketingResults = await sendMarketingEmail(
          body.subject,
          body.htmlContent,
          body.textContent,
          marketingOptions
        )
        
        return NextResponse.json({
          success: true,
          results: marketingResults,
          message: `Marketing emails processed. Success: ${marketingResults.success}, Failed: ${marketingResults.failed}`
        })

      case 'stats':
        const statsDateFrom = body.dateFrom ? new Date(body.dateFrom) : undefined
        const statsDateTo = body.dateTo ? new Date(body.dateTo) : undefined
        
        const stats = await getEmailStats(statsDateFrom, statsDateTo)
        
        return NextResponse.json({
          success: true,
          stats,
          message: 'Email statistics retrieved successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Bulk email error:', error)
    return NextResponse.json(
      { error: `Failed to process bulk email request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Bulk email management endpoint',
    actions: {
      'bulk-notifications': {
        description: 'Send bulk order notification emails',
        required: ['type'],
        optional: ['orderIds', 'status', 'dateFrom', 'dateTo'],
        types: ['confirmation', 'status-update']
      },
      'marketing': {
        description: 'Send marketing emails to customers',
        required: ['subject', 'htmlContent'],
        optional: ['textContent', 'customerIds', 'onlyRecentCustomers', 'daysBack']
      },
      'stats': {
        description: 'Get email statistics',
        optional: ['dateFrom', 'dateTo']
      }
    },
    examples: {
      bulkNotifications: {
        action: 'bulk-notifications',
        type: 'status-update',
        status: 'SHIPPED',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      },
      marketing: {
        action: 'marketing',
        subject: 'Special Offer for Our Valued Customers',
        htmlContent: '<h1>Hello {{customerName}}!</h1><p>We have a special offer for you...</p>',
        textContent: 'Hello {{customerName}}! We have a special offer for you...',
        onlyRecentCustomers: true,
        daysBack: 30
      },
      stats: {
        action: 'stats',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      }
    }
  })
}