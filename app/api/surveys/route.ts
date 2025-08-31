import { NextRequest, NextResponse } from 'next/server'

// Public endpoint - no authentication required
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Set CORS headers to allow public access
    const response = NextResponse.json([])
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Cache-Control', 'no-store')
    
    return response
    
  } catch (error) {
    console.error('Error fetching surveys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    )
  }
}