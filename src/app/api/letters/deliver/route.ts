import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// POST /api/letters/deliver - Manual trigger for letter delivery (for testing)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Simple API key protection for manual triggers
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get letters ready for delivery
    const now = new Date();
    const lettersToDeliver = await prisma.futureLetter.findMany({
      where: {
        status: 'SCHEDULED',
        deliveryDate: {
          lte: now
        }
      },
      take: 50 // Process in batches
    });

    if (lettersToDeliver.length === 0) {
      return NextResponse.json({ 
        message: 'No letters ready for delivery',
        delivered: 0
      });
    }

    let delivered = 0;
    let failed = 0;

    for (const letter of lettersToDeliver) {
      try {
        // Generate email template
        const emailTemplate = generateLetterEmailTemplate(letter);
        
        // Send email
        await sendEmail({
          to: letter.recipientEmail || letter.senderEmail,
          subject: `💌 ${letter.subject}`,
          html: emailTemplate
        });

        // Mark as delivered
        await prisma.futureLetter.update({
          where: { id: letter.id },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date()
          }
        });

        delivered++;
      } catch (error) {
        console.error(`Failed to deliver letter ${letter.id}:`, error);
        
        // Mark as failed
        await prisma.futureLetter.update({
          where: { id: letter.id },
          data: {
            status: 'FAILED',
            failureReason: error instanceof Error ? error.message : 'Unknown error'
          }
        });

        failed++;
      }
    }

    return NextResponse.json({
      message: `Letter delivery completed`,
      delivered,
      failed,
      total: lettersToDeliver.length
    });

  } catch (error) {
    console.error('Error in letter delivery:', error);
    return NextResponse.json(
      { error: 'Failed to process letter delivery' }, 
      { status: 500 }
    );
  }
}

function generateLetterEmailTemplate(letter: any): string {
  const deliveryDateFormatted = new Date(letter.deliveryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const createdDateFormatted = new Date(letter.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Letter from the Past</title>
      <style>
        body {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #000000 0%, #1a0014 50%, #000000 100%);
          color: #ffffff;
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #FF6B9D;
          border-radius: 20px;
          padding: 40px;
          backdrop-filter: blur(20px);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-size: 2.5em;
          font-weight: 700;
          background: linear-gradient(45deg, #FF6B9D, #00F5FF);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        .subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1em;
        }
        .letter-content {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 107, 157, 0.3);
          border-radius: 15px;
          padding: 30px;
          margin: 30px 0;
          line-height: 1.6;
          font-size: 1.1em;
        }
        .meta-info {
          background: rgba(255, 107, 157, 0.1);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          font-size: 0.9em;
          color: rgba(255, 255, 255, 0.8);
        }
        .signature {
          text-align: right;
          margin-top: 30px;
          font-style: italic;
          color: #00F5FF;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 107, 157, 0.3);
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9em;
        }
        .vobvorot-link {
          color: #FF6B9D;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">💌 Letter from the Past</h1>
          <p class="subtitle">A message has arrived from your younger self</p>
        </div>

        <div class="meta-info">
          <strong>📅 Written on:</strong> ${createdDateFormatted}<br>
          <strong>🎯 Scheduled for:</strong> ${deliveryDateFormatted}<br>
          <strong>✍️ From:</strong> ${letter.senderName || 'Your Past Self'}
        </div>

        <div class="letter-content">
          ${letter.message.replace(/\n/g, '<br>')}
        </div>

        <div class="signature">
          — Time Traveler ✨
        </div>

        <div class="footer">
          <p>This letter was sent using <a href="https://vobvorot.com" class="vobvorot-link">vobvorot.com</a></p>
          <p>✨ digital playground for time travelers ✨</p>
        </div>
      </div>
    </body>
    </html>
  `;
}