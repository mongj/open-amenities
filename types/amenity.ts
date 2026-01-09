import { Json } from '@/lib/supabase/types'

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string | null
  description: string | null
}

export interface Amenity {
  id: string
  name: string
  description: string | null
  lat: number
  lng: number
  address: string | null
  metadata: Json
  category_id: string
  category_name: string
  category_slug: string
  category_icon: string
  category_color: string
  created_at: string
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
}
