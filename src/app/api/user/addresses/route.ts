import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await prisma.userAddress.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const {
      type,
      firstName,
      lastName,
      company,
      address1,
      address2,
      city,
      state,
      country,
      zipCode,
      phone,
      isDefault
    } = data

    // Validate required fields
    if (!firstName || !lastName || !address1 || !city || !country || !zipCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If this is set as default, remove default from other addresses of same type
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: {
          userId: session.user.id,
          type: type || 'SHIPPING'
        },
        data: {
          isDefault: false
        }
      })
    }

    const address = await prisma.userAddress.create({
      data: {
        userId: session.user.id,
        type: type || 'SHIPPING',
        firstName,
        lastName,
        company,
        address1,
        address2,
        city,
        state,
        country,
        zipCode,
        phone,
        isDefault: isDefault || false
      }
    })

    return NextResponse.json({ address }, { status: 201 })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    )
  }
}