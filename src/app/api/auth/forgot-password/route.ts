import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

      // Store reset token in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      })

      // Create reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

      // Email content
      const emailContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #ff6b9d, #00f5ff); padding: 2px; border-radius: 12px;">
            <div style="background: #000; padding: 2rem; border-radius: 10px; color: white;">
              <h1 style="color: #ff6b9d; text-align: center; margin-bottom: 2rem;">
                🔐 Password Reset Request
              </h1>
              
              <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
                Hello ${user.name || user.email},
              </p>
              
              <p style="color: #ffffff; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your VobVorot account. 
                If you didn't make this request, you can safely ignore this email.
              </p>
              
              <div style="text-align: center; margin: 2rem 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background: linear-gradient(45deg, #ff6b9d, #00f5ff); 
                          color: white; text-decoration: none; padding: 1rem 2rem; 
                          border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Reset Your Password
                </a>
              </div>
              
              <p style="color: #cccccc; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #00f5ff; font-size: 14px; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <div style="border-top: 1px solid #333; margin: 2rem 0; padding-top: 1rem;">
                <p style="color: #cccccc; font-size: 14px; line-height: 1.6;">
                  ⏰ This link will expire in 1 hour for your security.
                </p>
                <p style="color: #cccccc; font-size: 14px; line-height: 1.6;">
                  🛡️ If you didn't request this reset, please secure your account by changing your password.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 2rem; border-top: 1px solid #333; padding-top: 1rem;">
                <p style="color: #888; font-size: 12px;">
                  VobVorot Store - Y2K Fashion Revolution
                </p>
              </div>
            </div>
          </div>
        </div>
      `

      try {
        await sendEmail({
          to: email,
          subject: '🔐 Reset Your VobVorot Password',
          html: emailContent
        })
      } catch (error) {
        console.error('Failed to send password reset email:', error)
        // Still return success to prevent email enumeration
      }
    }

    return NextResponse.json({
      message: 'If an account with that email exists, we\'ve sent password reset instructions.'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}