import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  // Simple check for admin access using query parameter
  const searchParams = request.nextUrl.searchParams
  const adminKey = searchParams.get('key')
  
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({
      error: 'Unauthorized - Admin key required',
      hint: 'Use ?key=ADMIN_API_KEY in URL'
    }, { status: 401 })
  }
  try {
    // Check if we can access Resend API
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY not configured'
      }, { status: 500 })
    }

    // Get list of domains configured in Resend
    let domains = null
    try {
      const domainsResponse = await resend.domains.list()
      domains = domainsResponse.data
    } catch (error) {
      console.log('Could not fetch domains:', error)
    }

    // Test sending a simple email to verify configuration
    const testEmail = {
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: process.env.ADMIN_EMAIL || 'admin@vobvorot.com',
      subject: 'Email Configuration Test',
      html: `
        <h2>Email System Test</h2>
        <p>This is a test email to verify your email configuration.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p><strong>From address:</strong> ${process.env.FROM_EMAIL || 'noreply@vobvorot.com'}</p>
        <p><strong>To address:</strong> ${process.env.ADMIN_EMAIL || 'admin@vobvorot.com'}</p>
      `,
      text: `Email System Test
      
This is a test email to verify your email configuration.
Sent at: ${new Date().toISOString()}
From: ${process.env.FROM_EMAIL || 'noreply@vobvorot.com'}
To: ${process.env.ADMIN_EMAIL || 'admin@vobvorot.com'}`
    }

    return NextResponse.json({
      status: 'ready',
      configuration: {
        resendApiKey: process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing',
        fromEmail: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
        adminEmail: process.env.ADMIN_EMAIL || 'admin@vobvorot.com',
        resendFromEmail: process.env.RESEND_FROM_EMAIL || 'Not set'
      },
      domains: domains || 'Could not fetch domains',
      testEmail: {
        ready: true,
        from: testEmail.from,
        to: testEmail.to,
        subject: testEmail.subject
      }
    })
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json({
      error: 'Email test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Simple check for admin access using query parameter
  const searchParams = request.nextUrl.searchParams
  const adminKey = searchParams.get('key')
  
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({
      error: 'Unauthorized - Admin key required',
      hint: 'Use ?key=ADMIN_API_KEY in URL'
    }, { status: 401 })
  }
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY not configured'
      }, { status: 500 })
    }

    // Send actual test email
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: process.env.ADMIN_EMAIL || 'admin@vobvorot.com',
      subject: '✅ Email Test - vobvorot.com',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">✅ Email System Working!</h2>
          <p>Your email configuration is working correctly.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>From:</strong> ${process.env.FROM_EMAIL || 'noreply@vobvorot.com'}</li>
              <li><strong>To:</strong> ${process.env.ADMIN_EMAIL || 'admin@vobvorot.com'}</li>
              <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Domain:</strong> vobvorot.com</li>
            </ul>
          </div>
          <p style="color: #666;">This email was sent from your EXVICPMOUR store to test the email configuration.</p>
        </div>
      `,
      text: `Email System Working!
      
Your email configuration is working correctly.

Configuration Details:
- From: ${process.env.FROM_EMAIL || 'noreply@vobvorot.com'}
- To: ${process.env.ADMIN_EMAIL || 'admin@vobvorot.com'}
- Sent at: ${new Date().toLocaleString()}
- Domain: vobvorot.com

This email was sent from your EXVICPMOUR store to test the email configuration.`
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      emailId: result.data?.id,
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: process.env.ADMIN_EMAIL || 'admin@vobvorot.com'
    })
  } catch (error) {
    console.error('Failed to send test email:', error)
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}