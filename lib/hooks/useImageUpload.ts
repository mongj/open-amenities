"use client";

import imageCompression from "browser-image-compression";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  r2Key?: string;
  cdnUrl?: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  progress: number;
  error?: string;
}

interface UseImageUploadOptions {
  maxImages?: number;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { maxImages = 5, maxSizeMB = 5, maxWidthOrHeight = 1920 } = options;

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addImages = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = maxImages - images.length;

      // Check if too many files
      if (fileArray.length > remainingSlots) {
        toast.error(`You can only upload ${maxImages} images`);
      }

      const filesToAdd = fileArray.slice(0, remainingSlots);
      if (filesToAdd.length === 0) return;

      const validImages: UploadedImage[] = [];

      for (const file of filesToAdd) {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(
            `"${file.name}" is not supported. Use JPEG, PNG, or WebP.`
          );
          continue;
        }

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(
            `"${file.name}" is too large. Maximum size is ${maxSizeMB}MB.`
          );
          continue;
        }

        // Compress image
        let compressedFile: File;
        try {
          compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight,
            useWebWorker: true,
            fileType: "image/webp" as const,
          });
        } catch {
          compressedFile = file;
        }

        const preview = URL.createObjectURL(compressedFile);

        validImages.push({
          id: crypto.randomUUID(),
          file: compressedFile,
          preview,
          status: "pending" as const,
          progress: 0,
        });
      }

      if (validImages.length > 0) {
        setImages((prev) => [...prev, ...validImages]);
      }
    },
    [images.length, maxImages, maxSizeMB, maxWidthOrHeight]
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const uploadImages = useCallback(
    async (amenityId?: string) => {
      const pendingImages = images.filter((img) => img.status === "pending");
      if (pendingImages.length === 0) return [];

      setIsUploading(true);
      const results: UploadedImage[] = [];

      for (const image of pendingImages) {
        try {
          // Update status to uploading
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id
                ? { ...img, status: "uploading" as const }
                : img
            )
          );

          // 1. Get presigned URL
          const presignResponse = await fetch("/api/images/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: image.file.name,
              contentType: image.file.type,
              fileSize: image.file.size,
              amenityId,
            }),
          });

          if (!presignResponse.ok) {
            const errorData = await presignResponse.json();
            throw new Error(errorData.error || "Failed to get upload URL");
          }

          const { presignedUrl, r2Key, cdnUrl } = await presignResponse.json();

          // 2. Upload directly to R2
          const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            body: image.file,
            headers: {
              "Content-Type": image.file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload image");
          }

          // Update image with success
          const uploadedImage: UploadedImage = {
            ...image,
            r2Key,
            cdnUrl,
            status: "uploaded",
            progress: 100,
          };

          setImages((prev) =>
            prev.map((img) => (img.id === image.id ? uploadedImage : img))
          );

          results.push(uploadedImage);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";
          toast.error(`Failed to upload image: ${errorMessage}`);
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id
                ? {
                    ...img,
                    status: "error" as const,
                    error: errorMessage,
                  }
                : img
            )
          );
        }
      }

      setIsUploading(false);
      return results;
    },
    [images]
  );

  const clearImages = useCallback(() => {
    images.forEach((img) => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    setImages([]);
  }, [images]);

  const getUploadedImages = useCallback(() => {
    return images
      .filter((img) => img.status === "uploaded" && img.r2Key && img.cdnUrl)
      .map((img, index) => ({
        r2Key: img.r2Key!,
        cdnUrl: img.cdnUrl!,
        filename: img.file.name,
        contentType: img.file.type,
        fileSize: img.file.size,
        displayOrder: index,
      }));
  }, [images]);

  return {
    images,
    addImages,
    removeImage,
    uploadImages,
    clearImages,
    getUploadedImages,
    isUploading,
    canAddMore: images.length < maxImages,
    remainingSlots: maxImages - images.length,
  };
}
