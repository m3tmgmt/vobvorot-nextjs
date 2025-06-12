import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('TEST WEBHOOK RECEIVED:', JSON.stringify(body, null, 2))
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Webhook received',
      update_id: body.update_id,
      message_text: body.message?.text,
      from_id: body.message?.from?.id
    })
  } catch (error) {
    console.error('TEST WEBHOOK ERROR:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Test webhook endpoint is working',
    timestamp: new Date().toISOString()
  })
}