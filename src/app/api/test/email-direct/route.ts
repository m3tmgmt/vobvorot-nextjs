import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    // Send directly to your Gmail
    const result = await resend.emails.send({
      from: 'noreply@vobvorot.com',
      to: 'vobvorot.work@gmail.com', // Your Gmail directly
      subject: '✅ Direct Test - vobvorot.com Email System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email System Test - Direct to Gmail</h2>
          <p>If you receive this email, your email system is working!</p>
          <hr>
          <p><strong>Sent from:</strong> noreply@vobvorot.com</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>SPF Status:</strong> Should be passing now</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is a test from your VobVorot store email system.
          </p>
        </div>
      `,
      text: `Email System Test - Direct to Gmail
      
If you receive this email, your email system is working!

Sent from: noreply@vobvorot.com
Sent at: ${new Date().toLocaleString()}
SPF Status: Should be passing now

This is a test from your VobVorot store email system.`
    })

    return NextResponse.json({
      success: true,
      message: 'Email sent directly to vobvorot.work@gmail.com',
      emailId: result.data?.id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Direct email test failed:', error)
    return NextResponse.json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}