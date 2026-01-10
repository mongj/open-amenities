"use client";

import { Amenity, MapViewState } from "@/types/amenity";
import type { GeolocateControl as MapboxGeolocateControl } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GeolocateControl,
  Map as MapGL,
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from "react-map-gl/mapbox";
import AmenityPopup from "./AmenityPopup";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Singapore bounds
const SINGAPORE_BOUNDS: [[number, number], [number, number]] = [
  [103.6, 1.15], // Southwest
  [104.1, 1.5], // Northeast
];

interface MapProps {
  amenities: Amenity[];
  onMarkerClick?: (amenity: Amenity) => void;
  selectedAmenity?: Amenity | null;
  onClosePopup?: () => void;
  initialViewState?: Partial<MapViewState>;
  autoLocate?: boolean;
  isAddMode?: boolean;
  onCenterChange?: (center: { lng: number; lat: number }) => void;
}

export default function Map({
  amenities,
  onMarkerClick,
  selectedAmenity,
  onClosePopup,
  initialViewState,
  autoLocate = true,
  isAddMode = false,
  onCenterChange,
}: MapProps) {
  const mapRef = useRef<MapRef>(null);
  const geolocateRef = useRef<MapboxGeolocateControl>(null);
  const [viewState, setViewState] = useState<MapViewState>({
    longitude: initialViewState?.longitude ?? 103.8198,
    latitude: initialViewState?.latitude ?? 1.3521,
    zoom: initialViewState?.zoom ?? 16,
  });

  // Auto-trigger geolocation when map loads
  const handleMapLoad = useCallback(() => {
    if (autoLocate && geolocateRef.current) {
      // Small delay to ensure the control is ready
      setTimeout(() => {
        geolocateRef.current?.trigger();
      }, 100);
    }
    // Report initial center if in add mode
    if (isAddMode && onCenterChange) {
      onCenterChange({
        lng: viewState.longitude,
        lat: viewState.latitude,
      });
    }
  }, [
    autoLocate,
    isAddMode,
    onCenterChange,
    viewState.longitude,
    viewState.latitude,
  ]);

  // Trigger geolocation when entering add mode
  useEffect(() => {
    if (isAddMode && geolocateRef.current) {
      setTimeout(() => {
        geolocateRef.current?.trigger();
      }, 100);
    }
  }, [isAddMode]);

  return (
    <MapGL
      ref={mapRef}
      {...viewState}
      onMove={(evt) => {
        setViewState(evt.viewState);
        if (isAddMode && onCenterChange) {
          onCenterChange({
            lng: evt.viewState.longitude,
            lat: evt.viewState.latitude,
          });
        }
      }}
      onLoad={handleMapLoad}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/standard"
      style={{ width: "100%", height: "100%" }}
      maxBounds={SINGAPORE_BOUNDS}
      minZoom={10}
      maxZoom={18}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <GeolocateControl
        ref={geolocateRef as React.RefObject<MapboxGeolocateControl>}
        position="top-right"
        trackUserLocation
        showUserHeading
        showUserLocation
        fitBoundsOptions={{ maxZoom: 16 }}
      />

      {amenities.map((amenity) => (
        <Marker
          key={amenity.id}
          longitude={amenity.lng}
          latitude={amenity.lat}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            onMarkerClick?.(amenity);
          }}
        >
          <div className="group relative">
            {/* Marker with custom styling */}
            <div
              className="map-marker-circle transition-all duration-150 group-hover:scale-110"
              style={{ backgroundColor: amenity.category_color || "#E07A5F" }}
              title={amenity.name}
            >
              <span className="text-base leading-none">
                {amenity.category_icon}
              </span>
            </div>
            {/* Shadow underneath */}
            <div className="absolute -bottom-1 left-1/2 h-2 w-6 -translate-x-1/2 rounded-full bg-black/10 blur-sm transition-all group-hover:w-8" />
          </div>
        </Marker>
      ))}

      {selectedAmenity && (
        <Popup
          longitude={selectedAmenity.lng}
          latitude={selectedAmenity.lat}
          anchor="bottom"
          onClose={onClosePopup}
          closeOnClick={true}
          offset={44}
          closeButton={false}
          className="amenity-popup"
        >
          <AmenityPopup
            amenity={selectedAmenity}
            onClose={onClosePopup ?? (() => {})}
          />
        </Popup>
      )}
    </MapGL>
  );
}
