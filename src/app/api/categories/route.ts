import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const mockCategories = [
  { id: "1", name: "Shoes", slug: "shoes", emoji: "👠" },
  { id: "2", name: "Accessories", slug: "accessories", emoji: "💍" },
  { id: "3", name: "Hats", slug: "hats", emoji: "🎩" },
  { id: "4", name: "EXVICPMOUR", slug: "exvicpmour", emoji: "✨" },
  { id: "5", name: "Bags", slug: "bags", emoji: "👜" },
  { id: "6", name: "Clothing", slug: "clothing", emoji: "👕" }
];

// Map category names to emojis
const categoryEmojiMap: Record<string, string> = {
  "Shoes": "👠",
  "Accessories": "💍", 
  "Hats": "🎩",
  "EXVICPMOUR": "✨",
  "Bags": "👜",
  "Clothing": "👕"
};

export async function GET() {
  try {
    // Try to get categories from database first
    try {
      const dbCategories = await prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true, 
          slug: true,
          description: true
        },
        orderBy: { sortOrder: 'asc' }
      });

      if (dbCategories.length > 0) {
        console.log('Returning database categories with emoji enhancement');
        
        // Add emojis to database categories based on name mapping
        const enhancedCategories = dbCategories.map(category => ({
          ...category,
          emoji: categoryEmojiMap[category.name] || "📦" // Default emoji if not found
        }));
        
        return NextResponse.json(enhancedCategories);
      }
    } catch (dbError) {
      console.error('Database connection failed, using mock categories:', dbError);
    }
    
    // Fallback to mock categories
    console.log('Using mock categories as fallback');
    return NextResponse.json(mockCategories);
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