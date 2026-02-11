/**
 * Media upload utilities for image and video validation and upload
 */

import { supabase } from "@/lib/supabase/client";

export type MediaType = "image" | "video";

export interface MediaValidation {
  isValid: boolean;
  error?: string;
  mediaType?: MediaType;
}

/**
 * Get public URL for media from Supabase Storage
 * Handles both full URLs and relative paths
 * Bucket: "new-releases" (used for all media, both legacy and new)
 */
export function getPublicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  
  // If already a full URL, return as-is
  if (path.startsWith("http")) return path;
  
  try {
    const { data } = supabase.storage
      .from("new-releases")
      .getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (error) {
    console.error("Failed to generate public media URL for path:", path, error);
    return null;
  }
}

/**
 * Sanitize filename by removing spaces and special characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\s+/g, "-") // replace spaces with dashes
    .replace(/[^a-z0-9.-]/g, "") // keep only alphanumeric, dots, dashes
    .replace(/\.+/g, ".") // collapse multiple dots
    .replace(/^-+|-+$/g, ""); // remove leading/trailing dashes
}

/**
 * Detect media type from file
 */
export function detectMediaType(file: File): MediaType {
  if (file.type.startsWith("video/")) {
    return "video";
  }
  return "image";
}

/**
 * Validate media file for upload
 */
export function validateMediaFile(file: File): MediaValidation {
  const mediaType = detectMediaType(file);

  if (mediaType === "image") {
    // Validate image types
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedImageTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Image must be JPEG, PNG, or WebP",
      };
    }

    // Validate image size (5MB)
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxImageSize) {
      return {
        isValid: false,
        error: "Image must be less than 5MB",
      };
    }
  } else if (mediaType === "video") {
    // Validate video types
    const allowedVideoTypes = ["video/mp4", "video/webm"];
    if (!allowedVideoTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Video must be MP4 or WebM",
      };
    }

    // Validate video size (50MB)
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxVideoSize) {
      return {
        isValid: false,
        error: "Video must be less than 50MB",
      };
    }
  }

  return {
    isValid: true,
    mediaType,
  };
}

/**
 * Generate storage path for media file
 */
export function generateMediaStoragePath(
  file: File,
  mediaType: MediaType
): string {
  const uuid = crypto.randomUUID();
  const sanitized = sanitizeFilename(file.name);
  return `releases/${uuid}-${sanitized}`;
}

/**
 * Create object URL for preview (file or stored media)
 */
export function createPreviewUrl(file: File | null): string | null {
  if (!file) return null;
  return URL.createObjectURL(file);
}

/**
 * Release object URL to prevent memory leaks
 */
export function revokePreviewUrl(url: string | null): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
