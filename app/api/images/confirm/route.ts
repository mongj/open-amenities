import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MAX_IMAGES_PER_AMENITY = 3

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ImageData {
  r2Key: string
  cdnUrl: string
  filename: string
  contentType: string
  fileSize: number
  width?: number
  height?: number
  displayOrder: number
}

interface ConfirmRequest {
  amenityId: string
  images: ImageData[]
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmRequest = await request.json()
    const { amenityId, images } = body

    if (!amenityId || !images?.length) {
      return NextResponse.json(
        { error: 'Missing amenityId or images' },
        { status: 400 }
      )
    }

    // Verify amenity exists
    const { data: amenity, error: amenityError } = await supabase
      .from('amenities')
      .select('id')
      .eq('id', amenityId)
      .single()

    if (amenityError || !amenity) {
      return NextResponse.json(
        { error: 'Amenity not found' },
        { status: 404 }
      )
    }

    // Check existing image count
    const { count } = await supabase
      .from('amenity_images')
      .select('*', { count: 'exact', head: true })
      .eq('amenity_id', amenityId)

    if ((count || 0) + images.length > MAX_IMAGES_PER_AMENITY) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES_PER_AMENITY} images allowed per amenity` },
        { status: 400 }
      )
    }

    // Insert image records
    const imageRecords = images.map((img) => ({
      amenity_id: amenityId,
      r2_key: img.r2Key,
      cdn_url: img.cdnUrl,
      filename: img.filename,
      content_type: img.contentType,
      file_size: img.fileSize,
      width: img.width || null,
      height: img.height || null,
      display_order: img.displayOrder,
    }))

    const { data, error } = await supabase
      .from('amenity_images')
      .insert(imageRecords)
      .select()

    if (error) {
      console.error('Error saving image metadata:', error)
      return NextResponse.json(
        { error: 'Failed to save image metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, images: data })
  } catch (error) {
    console.error('Error confirming upload:', error)
    return NextResponse.json(
      { error: 'Failed to confirm upload' },
      { status: 500 }
    )
  }
}
