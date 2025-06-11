import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Just return current email configuration without sending emails
    const emailConfig = {
      resendConfigured: !!process.env.RESEND_API_KEY,
      fromEmail: process.env.FROM_EMAIL || 'Not configured',
      adminEmail: process.env.ADMIN_EMAIL || 'Not configured',
      resendFromEmail: process.env.RESEND_FROM_EMAIL || 'Not configured',
      timestamp: new Date().toISOString(),
      status: 'Configuration check completed'
    }

    // Check if domain is likely configured
    const vobvorotEmails = [
      process.env.FROM_EMAIL,
      process.env.ADMIN_EMAIL,
      process.env.RESEND_FROM_EMAIL
    ].filter(email => email?.includes('@vobvorot.com'))

    return NextResponse.json({
      emailConfiguration: emailConfig,
      vobvorotDomainEmails: vobvorotEmails,
      recommendation: vobvorotEmails.length > 0 
        ? 'vobvorot.com domain emails are configured' 
        : 'No vobvorot.com domain emails found',
      nextSteps: [
        '1. Verify domain ownership in Resend dashboard',
        '2. Check DNS records for vobvorot.com',
        '3. Send test email using POST to this endpoint',
        '4. Check email deliverability'
      ]
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Configuration check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY not configured'
      }, { status: 500 })
    }

    // Import Resend dynamically to avoid issues
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Send test email to admin
    const testEmailResult = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
      to: process.env.ADMIN_EMAIL || 'admin@vobvorot.com',
      subject: '🧪 Email Test - vobvorot.com Configuration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a1a; text-align: center; margin-bottom: 30px;">🧪 Email Configuration Test</h1>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
              <h2 style="color: #155724; margin-top: 0;">✅ Email System Working!</h2>
              <p style="margin-bottom: 0; color: #155724;">Your vobvorot.com email configuration is functioning correctly.</p>
            </div>
            
            <div style="margin: 30px 0;">
              <h3 style="color: #1a1a1a;">Configuration Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">From Address:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${process.env.FROM_EMAIL || 'noreply@vobvorot.com'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">To Address:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${process.env.ADMIN_EMAIL || 'admin@vobvorot.com'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Test Time:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Domain:</td>
                  <td style="padding: 8px;">vobvorot.com</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;">
                <strong>Next Steps:</strong> If you received this email, your vobvorot.com email configuration is working correctly!
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                This test was sent from your EXVICPMOUR store email system
              </p>
            </div>
          </div>
        </div>
      `,
      text: `Email Configuration Test

✅ Email System Working!
Your vobvorot.com email configuration is functioning correctly.

Configuration Details:
- From Address: ${process.env.FROM_EMAIL || 'noreply@vobvorot.com'}
- To Address: ${process.env.ADMIN_EMAIL || 'admin@vobvorot.com'}
- Test Time: ${new Date().toLocaleString()}
- Domain: vobvorot.com

Next Steps: If you received this email, your vobvorot.com email configuration is working correctly!

This test was sent from your EXVICPMOUR store email system.`
    })

    return NextResponse.json({
      success: true,
      message: '🎉 Test email sent successfully!',
      emailId: testEmailResult.data?.id,
      details: {
        from: process.env.FROM_EMAIL || 'noreply@vobvorot.com',
        to: process.env.ADMIN_EMAIL || 'admin@vobvorot.com',
        subject: '🧪 Email Test - vobvorot.com Configuration'
      },
      instructions: 'Check your inbox for the test email. If you don\'t receive it, check spam folder or verify domain configuration.'
    })
  } catch (error) {
    console.error('Email test failed:', error)
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error',
      possibleCauses: [
        'Domain not verified in Resend',
        'DNS records not configured',
        'Invalid API key',
        'Rate limiting'
      ]
    }, { status: 500 })
  }
}