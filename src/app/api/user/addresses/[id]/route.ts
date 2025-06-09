import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if address belongs to user
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // If this is set as default, remove default from other addresses of same type
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: {
          userId: session.user.id,
          type: type || existingAddress.type,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      })
    }

    const address = await prisma.userAddress.update({
      where: { id },
      data: {
        type: type || existingAddress.type,
        firstName: firstName || existingAddress.firstName,
        lastName: lastName || existingAddress.lastName,
        company,
        address1: address1 || existingAddress.address1,
        address2,
        city: city || existingAddress.city,
        state,
        country: country || existingAddress.country,
        zipCode: zipCode || existingAddress.zipCode,
        phone,
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault
      }
    })

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if address belongs to user
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    await prisma.userAddress.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    )
  }
}