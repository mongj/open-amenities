"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

interface SearchBarProps {
  onSelectLocation: (lng: number, lat: number) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function SearchBar({ onSelectLocation }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !MAPBOX_TOKEN) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_TOKEN}&country=sg&limit=5`
      );
      const data = await response.json();
      setResults(
        data.features?.map(
          (f: {
            id: string;
            place_name: string;
            center: [number, number];
          }) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
          })
        ) || []
      );
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      searchLocations(query);
    }, 300);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, searchLocations]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
        setQuery("");
        setResults([]);
      }
    };
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  const handleSelect = (result: SearchResult) => {
    onSelectLocation(result.center[0], result.center[1]);
    setQuery("");
    setResults([]);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Bar Container */}
      <div
        onClick={handleExpand}
        className={`flex h-10 items-center overflow-hidden rounded-2xl bg-white/95 shadow-md backdrop-blur-sm transition-all duration-300 ease-out ${
          isExpanded
            ? "w-72 shadow-xl ring-1 ring-stone-200/50"
            : "w-25 cursor-pointer hover:bg-white hover:shadow-lg"
        }`}
      >
        <div className="flex items-center gap-2 px-3 w-full">
          {/* Magnifying glass icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="shrink-0 text-stone-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length > 0) {
                setLoading(true);
              } else {
                setLoading(false);
              }
            }}
            placeholder="Search"
            className={`flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none transition-opacity duration-150 ${
              isExpanded ? "pointer-events-auto" : "pointer-events-none"
            }`}
            readOnly={!isExpanded}
          />

          {/* Loading spinner or close button (only when expanded) */}
          {isExpanded && (
            <>
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-200 border-t-coral" />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {isExpanded && results.length > 0 && (
        <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-stone-200/50 animate-in fade-in slide-in-from-top-2 duration-150">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-stone-50"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11 8 12 1-1 8-6.6 8-12a8 8 0 0 0-8-8Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">
                  {result.place_name.split(",")[0]}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {result.place_name.split(",").slice(1).join(",").trim()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isExpanded && query && !loading && results.length === 0 && (
        <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-2xl bg-white p-4 text-center shadow-xl ring-1 ring-stone-200/50 animate-in fade-in slide-in-from-top-2 duration-150">
          <p className="text-sm text-stone-500">No places found</p>
        </div>
      )}
    </div>
  );
}
