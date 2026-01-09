"use client";

import { Category } from "@/types/amenity";
import { Check } from "lucide-react";

interface CategoryFilterProps {
  categories: Category[];
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
  onSelectAll: () => void;
  loading?: boolean;
  categoryCounts: Record<string, number>;
}

export default function CategoryFilter({
  categories,
  selectedSlugs,
  onToggle,
  onSelectAll,
  loading,
  categoryCounts,
}: CategoryFilterProps) {
  if (loading) {
    return (
      <div className="w-48 overflow-hidden rounded-2xl bg-white/95 shadow-lg backdrop-blur-sm">
        <div className="p-2 space-y-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton h-7 w-full rounded-lg"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const allSelected = selectedSlugs.length === categories.length;

  return (
    <div className="w-48 overflow-hidden rounded-2xl bg-white/95 shadow-lg backdrop-blur-sm ring-1 ring-stone-200/50">
      {/* Header */}
      <div className="border-b border-stone-100 px-3 py-2">
        <span className="text-xs font-medium text-stone-500">
          Filter by amenities
        </span>
      </div>

      {/* Category list */}
      <div className="p-1.5 space-y-0.5">
        {/* Select all toggle */}
        <button
          onClick={onSelectAll}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all duration-150 hover:bg-stone-50"
        >
          <div
            className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
              allSelected
                ? "border-stone-900 bg-stone-900"
                : "border-stone-300 bg-white"
            }`}
          >
            {allSelected && (
              <Check className="h-2 w-2 text-white" strokeWidth={3} />
            )}
          </div>
          <span className="text-xs font-medium text-stone-600">Select all</span>
        </button>

        {/* Category items */}
        {categories.map((category) => {
          const isSelected = selectedSlugs.includes(category.slug);
          const categoryColor = category.color || "#E07A5F";
          const count = categoryCounts[category.slug] || 0;

          return (
            <button
              key={category.id}
              onClick={() => onToggle(category.slug)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all duration-150 hover:bg-stone-100"
            >
              <div
                className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                  isSelected
                    ? "border-stone-900 bg-stone-900"
                    : "border-stone-300 bg-white"
                }`}
              >
                {isSelected && (
                  <Check className="h-2 w-2 text-white" strokeWidth={3} />
                )}
              </div>
              <div
                className="flex h-5 w-5 items-center justify-center rounded text-xs"
                style={{
                  backgroundColor: `${categoryColor}20`,
                }}
              >
                {category.icon}
              </div>
              <span className="flex-1 text-xs font-medium text-stone-700">
                {category.name}
              </span>
              <span className="text-xs text-stone-400">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
