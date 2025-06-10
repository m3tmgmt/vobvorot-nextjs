import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/letters - Get user's letters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!session && !email) {
      return NextResponse.json(
        { error: 'Email required for anonymous letters' }, 
        { status: 400 }
      );
    }

    const where = session?.user?.id 
      ? { userId: session.user.id }
      : { senderEmail: email };

    const letters = await prisma.futureLetter.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        deliveryDate: true,
        status: true,
        deliveredAt: true,
        createdAt: true,
        // Don't return message content for security
      }
    });

    return NextResponse.json({ letters });
  } catch (error) {
    console.error('Error fetching letters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch letters' }, 
      { status: 500 }
    );
  }
}

// POST /api/letters - Create new letter
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const { 
      message, 
      deliveryDate, 
      subject,
      senderEmail, 
      senderName,
      recipientEmail,
      isAnonymous = false 
    } = body;

    // Validation
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' }, 
        { status: 400 }
      );
    }

    if (!deliveryDate) {
      return NextResponse.json(
        { error: 'Delivery date is required' }, 
        { status: 400 }
      );
    }

    const delivery = new Date(deliveryDate);
    const now = new Date();
    
    if (delivery <= now) {
      return NextResponse.json(
        { error: 'Delivery date must be in the future' }, 
        { status: 400 }
      );
    }

    // For authenticated users
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true }
      });

      const letter = await prisma.futureLetter.create({
        data: {
          userId: session.user.id,
          senderEmail: user?.email || senderEmail,
          senderName: user?.name || senderName,
          recipientEmail: recipientEmail || user?.email,
          subject: subject || 'Letter from the past',
          message: message.trim(),
          deliveryDate: delivery,
          isAnonymous,
          status: 'SCHEDULED'
        }
      });

      return NextResponse.json({ 
        success: true, 
        letterId: letter.id,
        message: 'Letter scheduled for delivery! ✨'
      });
    }

    // For anonymous users
    if (!senderEmail) {
      return NextResponse.json(
        { error: 'Email is required for anonymous letters' }, 
        { status: 400 }
      );
    }

    const letter = await prisma.futureLetter.create({
      data: {
        senderEmail,
        senderName: senderName || 'Anonymous Time Traveler',
        recipientEmail: recipientEmail || senderEmail,
        subject: subject || 'Letter from the past',
        message: message.trim(),
        deliveryDate: delivery,
        isAnonymous,
        status: 'SCHEDULED'
      }
    });

    return NextResponse.json({ 
      success: true, 
      letterId: letter.id,
      message: 'Letter scheduled for delivery! ✨'
    });

  } catch (error) {
    console.error('Error creating letter:', error);
    return NextResponse.json(
      { error: 'Failed to create letter' }, 
      { status: 500 }
    );
  }
}