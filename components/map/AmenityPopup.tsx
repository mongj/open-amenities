"use client";

import { Amenity, AmenityImage } from "@/types/amenity";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface AmenityPopupProps {
  amenity: Amenity;
  onClose: () => void;
}

export default function AmenityPopup({ amenity, onClose }: AmenityPopupProps) {
  const [images, setImages] = useState<AmenityImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // Fetch images if amenity has them
  useEffect(() => {
    if (amenity.image_count && amenity.image_count > 0) {
      fetch(`/api/images/${amenity.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.images) {
            setImages(data.images);
          }
        })
        .catch(console.error);
    }
  }, [amenity.id, amenity.image_count]);

  // Track current slide
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const hasImages = images.length > 0 || amenity.primary_image_url;

  return (
    <div className="relative min-w-64 max-w-80 overflow-hidden rounded-2xl bg-white shadow-xl">
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={`absolute right-2 top-2 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors ${
          hasImages
            ? "bg-stone-600/50 text-white backdrop-blur-sm hover:bg-stone-900/70"
            : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/70"
        }`}
        aria-label="Close"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Image Carousel */}
      {hasImages && (
        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {images.length > 0
                ? images.map((img) => (
                    <div key={img.id} className="relative h-40 w-full shrink-0">
                      <Image
                        src={img.cdn_url}
                        alt={img.filename}
                        fill
                        className="object-cover"
                        sizes="320px"
                      />
                    </div>
                  ))
                : amenity.primary_image_url && (
                    <div className="relative h-40 w-full shrink-0">
                      <Image
                        src={amenity.primary_image_url}
                        alt={amenity.name}
                        fill
                        className="object-cover"
                        sizes="320px"
                      />
                    </div>
                  )}
            </div>
          </div>

          {/* Carousel dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    idx === currentIndex ? "w-3 bg-white" : "bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Image count badge */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {currentIndex + 1}/{images.length}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Category badge */}
        <div className="mb-2 flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{
              backgroundColor: `${amenity.category_color || "#E07A5F"}20`,
            }}
          >
            <span className="text-sm">{amenity.category_icon}</span>
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: amenity.category_color || "#E07A5F" }}
          >
            {amenity.category_name}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-display text-base font-semibold leading-snug text-stone-900">
          {amenity.name}
        </h3>

        {/* Description */}
        {amenity.description && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-stone-600">
            {amenity.description}
          </p>
        )}

        {/* Address */}
        {amenity.address && (
          <div className="mt-3 flex items-start gap-2 border-t border-stone-100 pt-3">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mt-0.5 shrink-0 text-stone-400"
            >
              <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11 8 12 1-1 8-6.6 8-12a8 8 0 0 0-8-8Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p className="text-xs leading-relaxed text-stone-500">
              {amenity.address}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
