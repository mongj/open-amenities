'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Amenity } from '@/types/amenity'

// Singapore bounds - covers the entire country
const SINGAPORE_BOUNDS = {
  min_lat: 1.15,
  max_lat: 1.5,
  min_lng: 103.6,
  max_lng: 104.1,
}

export function useAmenities() {
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([])
  const [filteredAmenities, setFilteredAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])

  // Fetch all amenities on mount using the existing RPC with Singapore-wide bounds
  useEffect(() => {
    async function prefetchAllAmenities() {
      setLoading(true)
      setError(null)

      try {
        // Use the existing RPC function with bounds covering all of Singapore
        const { data, error: fetchError } = await supabase.rpc('get_amenities_in_bounds', {
          min_lat: SINGAPORE_BOUNDS.min_lat,
          min_lng: SINGAPORE_BOUNDS.min_lng,
          max_lat: SINGAPORE_BOUNDS.max_lat,
          max_lng: SINGAPORE_BOUNDS.max_lng,
          category_slugs: null, // Fetch all categories
        })

        if (fetchError) throw fetchError

        const amenities = (data || []) as Amenity[]
        console.log('Total amenities fetched:', amenities.length)

        setAllAmenities(amenities)
        // Start with nothing shown until user selects categories
        setFilteredAmenities([])
      } catch (err) {
        console.error('Failed to fetch amenities:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch amenities')
      } finally {
        setLoading(false)
      }
    }

    prefetchAllAmenities()
  }, [])

  // Filter amenities by selected category slugs (client-side)
  // When no categories are selected, show nothing
  const filterByCategories = useCallback((slugs: string[]) => {
    setSelectedSlugs(slugs)
    if (slugs.length === 0) {
      setFilteredAmenities([])
    } else {
      setFilteredAmenities(
        allAmenities.filter((a) => slugs.includes(a.category_slug))
      )
    }
  }, [allAmenities])

  // Refetch all amenities (e.g., after adding a new one)
  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase.rpc('get_amenities_in_bounds', {
        min_lat: SINGAPORE_BOUNDS.min_lat,
        min_lng: SINGAPORE_BOUNDS.min_lng,
        max_lat: SINGAPORE_BOUNDS.max_lat,
        max_lng: SINGAPORE_BOUNDS.max_lng,
        category_slugs: null,
      })

      if (fetchError) throw fetchError

      const amenities = (data || []) as Amenity[]
      setAllAmenities(amenities)

      // Re-apply current filter (empty selection = show nothing)
      if (selectedSlugs.length === 0) {
        setFilteredAmenities([])
      } else {
        setFilteredAmenities(
          amenities.filter((a) => selectedSlugs.includes(a.category_slug))
        )
      }
    } catch (err) {
      console.error('Failed to refetch amenities:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedSlugs])

  const addAmenity = useCallback(async (amenity: {
    category_id: string
    name: string
    description?: string
    lat: number
    lng: number
    address?: string
  }) => {
    try {
      const { error } = await supabase.from('amenities').insert({
        category_id: amenity.category_id,
        name: amenity.name,
        description: amenity.description || null,
        location: `POINT(${amenity.lng} ${amenity.lat})`,
        address: amenity.address || null,
        status: 'approved',
      })

      if (error) throw error

      // Refetch all amenities to include the new one
      await refetch()

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add amenity'
      }
    }
  }, [refetch])

  return {
    amenities: filteredAmenities,
    allAmenities,
    loading,
    error,
    filterByCategories,
    addAmenity,
    refetch,
  }
}
