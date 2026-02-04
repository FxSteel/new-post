import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface ReleaseImageProps {
  imagePath: string;
}

export function ReleaseImage({ imagePath }: ReleaseImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imagePath) {
      const { data } = supabase.storage
        .from("new-releases")
        .getPublicUrl(imagePath);
      setImageUrl(data.publicUrl);
    }
  }, [imagePath]);

  return (
    <div className="w-full bg-slate-100 rounded-md overflow-hidden">
      <div className="aspect-[1400/732] w-full">
        {imageUrl ? (
          <img
            src={imageUrl}
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
