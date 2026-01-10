import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ amenityId: string }> }
) {
  try {
    const { amenityId } = await params

    if (!amenityId) {
      return NextResponse.json(
        { error: 'Missing amenityId' },
        { status: 400 }
      )
    }

    const { data: images, error } = await supabase
      .from('amenity_images')
      .select('*')
      .eq('amenity_id', amenityId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching images:', error)
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      )
    }

    return NextResponse.json({ images: images || [] })
  } catch (error) {
    console.error('Error in images API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
