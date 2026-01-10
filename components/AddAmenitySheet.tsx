"use client";

import { ImageUploader } from "@/components/images/ImageUploader";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { Category } from "@/types/amenity";
import { useState } from "react";
import { Drawer } from "vaul";

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
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
    resetForm();
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[90vh] flex-col rounded-t-3xl bg-white outline-none">
          {/* Drag Handle */}
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1 w-10 shrink-0 rounded-full bg-stone-300" />

          <div className="safe-area-bottom flex-1 overflow-y-auto overscroll-contain">
            {/* Header */}
            <div className="px-5 pb-4">
              <Drawer.Title className="font-display text-lg font-semibold text-stone-900">
                Add New Spot
              </Drawer.Title>
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

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`press-effect cursor-pointer flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ${
                          isSelected
                            ? "bg-coral text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        <span className="text-sm">{cat.icon}</span>
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
                  placeholder="e.g. Basement outside Starbucks"
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
                  onClick={() => handleOpenChange(false)}
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
