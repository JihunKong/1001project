import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // For now, return empty array to prevent the HTML error
    // This will be populated when the microSurvey feature is fully implemented
    return NextResponse.json([])
    
  } catch (error) {
    console.error('Error fetching surveys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    )
  }
}