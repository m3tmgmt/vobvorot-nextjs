import { NextResponse } from 'next/server'
import { getAvailableCountries } from '@/lib/meest-shipping'

export async function GET() {
  try {
    const countries = getAvailableCountries()
    
    return NextResponse.json({
      success: true,
      countries
    })
  } catch (error) {
    console.error('Failed to get shipping countries:', error)
    return NextResponse.json(
      { error: 'Failed to get shipping countries' },
      { status: 500 }
    )
  }
}