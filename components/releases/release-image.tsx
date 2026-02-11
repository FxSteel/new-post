"use client";

import { useEffect, useState } from "react";
import { getPublicMediaUrl, type MediaType } from "@/lib/media-upload";

interface ReleaseImageProps {
  mediaPath: string | null;
  mediaType?: MediaType | null;
  legacyImagePath?: string | null;
}

export function ReleaseImage({ 
  mediaPath, 
  mediaType, 
  legacyImagePath 
}: ReleaseImageProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use media_path first, fallback to legacy image_path
    const pathToUse = mediaPath || legacyImagePath;
    
    if (!pathToUse) {
      setMediaUrl(null);
      setIsLoading(false);
      return;
    }

    const url = getPublicMediaUrl(pathToUse);
    setMediaUrl(url);
    setIsLoading(false);
  }, [mediaPath, legacyImagePath]);

  if (!mediaUrl && !isLoading) {
    return (
      <div className="w-full bg-slate-100 rounded-md overflow-hidden">
        <div className="aspect-[1400/732] w-full flex items-center justify-center bg-slate-200">
          <span className="text-sm text-slate-500">No media</span>
        </div>
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <div className="w-full bg-slate-100 rounded-md overflow-hidden">
        {mediaUrl ? (
          <video
            src={mediaUrl}
            controls
            className="w-full h-auto bg-slate-100"
          />
        ) : (
          <div className="w-full h-96 flex items-center justify-center bg-slate-200">
            <span className="text-sm text-slate-500">Loading video...</span>
          </div>
        )}
      </div>
    );
  }

  // Default to image
  return (
    <div className="w-full bg-slate-100 rounded-md overflow-hidden">
      <div className="aspect-[1400/732] w-full">
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt="Release"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-slate-200">
            <span className="text-sm text-slate-500">Loading image...</span>
          </div>
        )}
      </div>
    </div>
  );
}
