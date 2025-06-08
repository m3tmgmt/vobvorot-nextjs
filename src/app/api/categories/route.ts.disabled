import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const mockCategories = [
  { id: "1", name: "Shoes", slug: "shoes" },
  { id: "2", name: "Accessories", slug: "accessories" },
  { id: "3", name: "Hats", slug: "hats" },
  { id: "4", name: "Vintage", slug: "vintage" },
  { id: "5", name: "Y2K", slug: "y2k" },
  { id: "6", name: "EXVICPMOUR", slug: "exvicpmour" }
];

export async function GET() {
  try {
    return NextResponse.json(mockCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, parentId } = body

    const category = await prisma.category.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description,
        parentId
      },
      include: {
        parent: true,
        children: true
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}