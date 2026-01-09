'use client'

import { useCallback, useEffect, useState } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
  permissionDenied: boolean
}

// Default to Singapore center
const SINGAPORE_CENTER = {
  latitude: 1.3521,
  longitude: 103.8198,
}

export function useGeolocation(requestOnMount = true) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: requestOnMount, // Start loading if requesting on mount
    permissionDenied: false,
  })

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        latitude: SINGAPORE_CENTER.latitude,
        longitude: SINGAPORE_CENTER.longitude,
        loading: false,
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          permissionDenied: false,
        })
      },
      (error) => {
        let errorMessage = 'Unable to get location'
        let denied = false
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied'
            denied = true
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        setState({
          latitude: SINGAPORE_CENTER.latitude,
          longitude: SINGAPORE_CENTER.longitude,
          error: errorMessage,
          loading: false,
          permissionDenied: denied,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  // Request geolocation on mount if enabled
  useEffect(() => {
    if (requestOnMount) {
      getCurrentPosition()
    }
  }, [requestOnMount, getCurrentPosition])

  return {
    ...state,
    getCurrentPosition,
    defaultCenter: SINGAPORE_CENTER,
  }
}
