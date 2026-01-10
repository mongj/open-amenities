"use client";

import { UploadedImage } from "@/lib/hooks/useImageUpload";
import { useCallback, useRef } from "react";

interface ImageUploaderProps {
  images: UploadedImage[];
  onAddImages: (files: FileList | File[]) => void;
  onRemoveImage: (id: string) => void;
  isUploading: boolean;
  canAddMore: boolean;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onAddImages,
  onRemoveImage,
  isUploading,
  canAddMore,
  maxImages = 5,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!canAddMore) return;
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onAddImages(files);
      }
    },
    [canAddMore, onAddImages]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onAddImages(files);
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onAddImages]
  );

  return (
    <div className="space-y-3">
      <label className="mb-2 block text-sm font-medium text-stone-700">
        Photos{" "}
        <span className="font-normal text-stone-400">
          (optional, max {maxImages})
        </span>
      </label>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-md overflow-hidden bg-stone-100"
            >
              {image.preview && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={image.preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              )}

              {/* Status overlay - uploading */}
              {image.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
              )}

              {/* Status overlay - error */}
              {image.status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/80">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
              )}

              {/* Status overlay - uploaded checkmark */}
              {image.status === "uploaded" && (
                <div className="absolute bottom-1 right-1 rounded-full bg-green-500 p-1">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              {/* Remove button */}
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(image.id)}
                  className="absolute right-1.5 top-1.5 cursor-pointer rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / Add button */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-stone-300 bg-stone-50 p-6 transition-colors hover:border-coral hover:bg-coral/5"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mb-2 text-stone-400"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <p className="text-sm font-medium text-stone-600">Add photos</p>
          <p className="text-xs text-stone-400">Drag & drop or tap to select</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Hint text */}
      <p className="text-xs text-stone-400">
        JPEG, PNG, or WebP. Max 5MB per image.
      </p>
    </div>
  );
}
