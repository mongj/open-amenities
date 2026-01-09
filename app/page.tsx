"use client";

import AddAmenitySheet from "@/components/AddAmenitySheet";
import CategoryFilter from "@/components/CategoryFilter";
import SearchBar from "@/components/SearchBar";
import { useAmenities } from "@/lib/hooks/useAmenities";
import { useCategories } from "@/lib/hooks/useCategories";
import { Amenity } from "@/types/amenity";
import { Check } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

// Dynamically import Map to avoid SSR issues with mapbox-gl
const Map = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-stone-100">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-3 border-stone-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-3 border-transparent border-t-stone-400" />
        </div>
        <span className="text-sm text-stone-400">Loading map...</span>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const {
    amenities,
    allAmenities,
    loading: amenitiesLoading,
    filterByCategories,
    addAmenity,
  } = useAmenities();
  const { categories, loading: categoriesLoading } = useCategories();

  const [selectedSlugs, setSelectedSlugs] = useState<string[] | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isExitingAddMode, setIsExitingAddMode] = useState(false);
  const [addLocation, setAddLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [currentCenter, setCurrentCenter] = useState<{
    lng: number;
    lat: number;
  }>({ lng: 103.8198, lat: 1.3521 });

  // Derive effective slugs: null means "not initialized yet, use all"
  const effectiveSlugs = useMemo(() => {
    if (selectedSlugs !== null) return selectedSlugs;
    return categories.map((c) => c.slug);
  }, [selectedSlugs, categories]);

  // Calculate counts per category (from all amenities, not filtered)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allAmenities.forEach((amenity) => {
      counts[amenity.category_slug] = (counts[amenity.category_slug] || 0) + 1;
    });
    return counts;
  }, [allAmenities]);

  // Sync effectiveSlugs -> filterByCategories (syncing with external data layer)
  useEffect(() => {
    filterByCategories(effectiveSlugs);
  }, [effectiveSlugs, filterByCategories]);

  const handleCategoryToggle = useCallback(
    (slug: string) => {
      setSelectedSlugs((prev) => {
        const current = prev ?? categories.map((c) => c.slug);
        return current.includes(slug)
          ? current.filter((s) => s !== slug)
          : [...current, slug];
      });
    },
    [categories]
  );

  const handleSelectAll = useCallback(() => {
    const allSlugs = categories.map((c) => c.slug);
    const allSelected = effectiveSlugs.length === categories.length;
    setSelectedSlugs(allSelected ? [] : allSlugs);
  }, [categories, effectiveSlugs.length]);

  const handleMarkerClick = useCallback((amenity: Amenity) => {
    setSelectedAmenity(amenity);
  }, []);

  const handleSearchSelect = useCallback((lng: number, lat: number) => {
    setMapCenter({ lng, lat });
  }, []);

  const handleAddSubmit = useCallback(
    async (data: {
      category_id: string;
      name: string;
      description?: string;
      lat: number;
      lng: number;
    }) => {
      const result = await addAmenity(data);
      return result;
    },
    [addAmenity]
  );

  return (
    <div className="relative h-screen-safe w-full">
      {/* Full-screen Map */}
      <Map
        amenities={amenities}
        onMarkerClick={handleMarkerClick}
        selectedAmenity={selectedAmenity}
        onClosePopup={() => setSelectedAmenity(null)}
        initialViewState={
          mapCenter
            ? { longitude: mapCenter.lng, latitude: mapCenter.lat, zoom: 16 }
            : undefined
        }
        autoLocate={!mapCenter}
        key={mapCenter ? `${mapCenter.lng}-${mapCenter.lat}` : "default"}
        isAddMode={isAddMode && !addLocation}
        onCenterChange={setCurrentCenter}
      />

      {/* Overlay UI */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Top bar - wordmark and search */}
        <div className="flex items-start justify-between px-4 py-2.5">
          {/* Left side - Wordmark */}
          <div className="pointer-events-auto">
            <h1 className="font-display font-bold tracking-tight text-stone-900 opacity-70">
              OpenAmenitiesSG
            </h1>
          </div>

          {/* Right side - Search */}
          <div
            className={`pointer-events-auto mr-8 transition-opacity duration-150 ${
              isAddMode ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <SearchBar onSelectLocation={handleSearchSelect} />
          </div>
        </div>

        {/* Left sidebar - Category filter */}
        <div
          className={`absolute left-4 top-12 pointer-events-auto transition-opacity duration-150 ${
            isAddMode ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <CategoryFilter
            categories={categories}
            selectedSlugs={effectiveSlugs}
            onToggle={handleCategoryToggle}
            onSelectAll={handleSelectAll}
            loading={categoriesLoading}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Loading indicator */}
        {amenitiesLoading && (
          <div className="absolute left-1/2 top-20 -translate-x-1/2 pointer-events-auto animate-fade-in">
            <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-200 border-t-coral" />
              <span className="text-sm font-medium text-stone-600">
                Loading...
              </span>
            </div>
          </div>
        )}

        {/* Bottom right - Add button */}
        {!isAddMode && (
          <div className="absolute bottom-6 right-4 pointer-events-auto">
            <button
              onClick={() => {
                setIsAddMode(true);
                setAddLocation(null);
              }}
              className="flex h-12 items-center gap-2 rounded-2xl bg-coral px-5 cursor-pointer text-white shadow-lg transition-all duration-150 hover:-translate-y-0.5 hover:bg-coral-dark hover:shadow-xl active:translate-y-0 active:scale-95"
              aria-label="Add amenity"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="font-medium">Post</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Mode Overlay - uses existing map */}
      {(isAddMode || isExitingAddMode) && !addLocation && (
        <>
          {/* Center crosshair - hide immediately on exit */}
          {/* Offset upward so the bottom of the line marks the selected location */}
          {!isExitingAddMode && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center animate-fade-in">
              <div className="relative -translate-y-[58px]">
                <div
                  className="absolute -inset-3 animate-ping rounded-full bg-coral/20"
                  style={{ animationDuration: "2s" }}
                />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-coral shadow-xl">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                <div className="absolute left-1/2 top-full -translate-x-1/2">
                  <div className="h-8 w-1 rounded-full bg-coral" />
                </div>
              </div>
            </div>
          )}

          {/* Bottom action area */}
          <div
            className={`absolute inset-x-0 bottom-0 z-20 ${
              isExitingAddMode
                ? "animate-slide-down-action"
                : "animate-slide-up-action"
            }`}
          >
            <div className="bg-linear-to-t from-white via-white/80 to-transparent px-4 pb-6 pt-20">
              <div className="mx-auto max-w-sm">
                <p className="mb-4 text-center text-sm text-stone-500">
                  Drag the map to position the marker
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAddLocation({
                        lat: currentCenter.lat,
                        lng: currentCenter.lng,
                      });
                    }}
                    className="btn btn-primary flex-1 py-3.5 text-base"
                  >
                    <Check className="h-4 w-4" />
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setIsExitingAddMode(true);
                      setTimeout(() => {
                        setIsAddMode(false);
                        setAddLocation(null);
                        setIsExitingAddMode(false);
                      }, 250);
                    }}
                    className="btn btn-secondary flex-1 py-3.5 text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Amenity Sheet */}
      <AddAmenitySheet
        isOpen={isAddMode && addLocation !== null}
        onClose={() => {
          setIsAddMode(false);
          setAddLocation(null);
        }}
        categories={categories}
        selectedLocation={addLocation}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
}
