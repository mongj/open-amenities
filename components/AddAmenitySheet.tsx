"use client";

import { ImageUploader } from "@/components/images/ImageUploader";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { Category } from "@/types/amenity";
import { useState } from "react";

interface AddAmenitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedLocation: { lat: number; lng: number } | null;
  onSubmit: (data: {
    category_id: string;
    name: string;
    description?: string;
    lat: number;
    lng: number;
  }) => Promise<{ success: boolean; amenityId?: string; error?: string }>;
}

export default function AddAmenitySheet({
  isOpen,
  onClose,
  categories,
  selectedLocation,
  onSubmit,
}: AddAmenitySheetProps) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    images,
    addImages,
    removeImage,
    uploadImages,
    clearImages,
    isUploading,
    canAddMore,
  } = useImageUpload({ maxImages: 3 });

  const resetForm = () => {
    setCategoryId("");
    setName("");
    setDescription("");
    setError(null);
    clearImages();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      setError("Please select a location on the map");
      return;
    }
    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }

    setSubmitting(true);
    setError(null);

    // 1. Create amenity first
    const result = await onSubmit({
      category_id: categoryId,
      name: name.trim(),
      description: description.trim() || undefined,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    });

    if (!result.success || !result.amenityId) {
      setError(result.error || "Failed to add amenity");
      setSubmitting(false);
      return;
    }

    // 2. Upload images if any
    const pendingImages = images.filter((img) => img.status === "pending");
    if (pendingImages.length > 0) {
      const uploadedImages = await uploadImages(result.amenityId);

      if (uploadedImages.length > 0) {
        // 3. Confirm uploads
        const imagesToConfirm = uploadedImages
          .filter((img) => img.r2Key && img.cdnUrl)
          .map((img, index) => ({
            r2Key: img.r2Key!,
            cdnUrl: img.cdnUrl!,
            filename: img.file.name,
            contentType: img.file.type,
            fileSize: img.file.size,
            displayOrder: index,
          }));

        if (imagesToConfirm.length > 0) {
          try {
            await fetch("/api/images/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amenityId: result.amenityId,
                images: imagesToConfirm,
              }),
            });
          } catch (uploadError) {
            console.error("Failed to confirm image uploads:", uploadError);
            // Continue anyway - amenity was created successfully
          }
        }
      }
    }

    setSubmitting(false);

    handleClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up-sheet">
        <div className="rounded-t-3xl bg-white shadow-2xl safe-area-bottom">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-stone-300" />
          </div>

          {/* Header */}
          <div className="px-5 pb-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-stone-900">
                  Add New Spot
                </h2>
              </div>
            </div>
          </div>

          {/* Location Badge */}
          {selectedLocation && (
            <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg bg-sage/10 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage/20">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-sage-dark"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-sage-dark">
                  Location confirmed
                </p>
                <p className="text-xs text-stone-500">
                  {selectedLocation.lat.toFixed(5)},{" "}
                  {selectedLocation.lng.toFixed(5)}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 pb-6">
            {/* Category Selection */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  const categoryColor = cat.color || "#E07A5F";

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`press-effect flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                        isSelected
                          ? "text-white shadow-md"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                      style={{
                        backgroundColor: isSelected ? categoryColor : undefined,
                      }}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  selectedCategory
                    ? `e.g., ${selectedCategory.name} at Starbucks`
                    : "Give this spot a name"
                }
                className="input-field"
                maxLength={100}
              />
            </div>

            {/* Description Input */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Details{" "}
                <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any helpful details — opening hours, exact location, etc."
                rows={3}
                className="input-field resize-none"
                maxLength={500}
              />
              <p className="mt-1.5 text-xs text-stone-400">
                {description.length}/500 characters
              </p>
            </div>

            {/* Image Upload */}
            <div className="mb-5">
              <ImageUploader
                images={images}
                onAddImages={addImages}
                onRemoveImage={removeImage}
                isUploading={isUploading}
                canAddMore={canAddMore}
                maxImages={3}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 animate-scale-in">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-red-500"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  isUploading ||
                  !selectedLocation ||
                  !categoryId ||
                  !name.trim()
                }
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting || isUploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {isUploading ? "Uploading..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Spot
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
