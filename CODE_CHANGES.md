# Media Preview Fix - Code Changes Reference

## 📋 Three Files Modified

---

## File 1: `lib/media-upload.ts`
**Path:** `/Users/fer/Desktop/new-post/lib/media-upload.ts`  
**Lines:** 1-32 (added new function at top)

```typescript
// ✅ NEW: Add import for Supabase client
import { supabase } from "@/lib/supabase/client";

// ✅ NEW: Add new utility function
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
```

**What Changed:**
- Added Supabase import
- Added centralized `getPublicMediaUrl()` function
- Handles null/undefined, full URLs, and error cases
- Single source of truth for URL generation

---

## File 2: `components/releases/release-image.tsx`
**Path:** `/Users/fer/Desktop/new-post/components/releases/release-image.tsx`  
**Lines:** 1-82 (complete file rewrite)

### BEFORE (Broken):
```typescript
import { supabase } from "@/lib/supabase/client";  // ❌ Direct import
import { useEffect, useState } from "react";
import { type MediaType } from "@/lib/media-upload";
// ❌ Missing "use client" directive

interface ReleaseImageProps {
  mediaPath: string | null;
  mediaType?: MediaType | null;
  // ❌ No legacyImagePath support
}

export function ReleaseImage({ mediaPath, mediaType }: ReleaseImageProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  // ❌ Unnecessary error state

  useEffect(() => {
    if (!mediaPath) {
      setMediaUrl(null);
      setIsLoading(false);
      return;
    }

    // ❌ Complex try/catch with multiple bucket attempts
    const bucketNames = ["NEW-RELEASES", "new-releases"];
    let found = false;

    for (const bucketName of bucketNames) {
      try {
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(mediaPath);
        
        if (data && data.publicUrl) {
          setMediaUrl(data.publicUrl);
          setError(null);
          found = true;
          break;
        }
      } catch (err) {
        console.debug(`Bucket ${bucketName} failed:`, err);
      }
    }

    if (!found) {
      setError(`Could not load media from path: ${mediaPath}`);
      setMediaUrl(null);
    }

    setIsLoading(false);
  }, [mediaPath]);

  // ❌ Confusing render logic
  if (!mediaPath) { /* ... */ }
  if (error) { /* ... */ }
  if (mediaType === "video") { /* ... */ }
  // ... etc
}
```

### AFTER (Fixed):
```typescript
"use client";  // ✅ Added: Client component directive

import { useEffect, useState } from "react";
import { getPublicMediaUrl, type MediaType } from "@/lib/media-upload";  // ✅ Use utility

interface ReleaseImageProps {
  mediaPath: string | null;
  mediaType?: MediaType | null;
  legacyImagePath?: string | null;  // ✅ Added: Backward compatibility
}

export function ReleaseImage({ 
  mediaPath, 
  mediaType, 
  legacyImagePath  // ✅ New prop
}: ReleaseImageProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // ✅ Removed: error state (handled by utility)

  useEffect(() => {
    // ✅ Simplified: Prioritize new, fallback to legacy
    const pathToUse = mediaPath || legacyImagePath;
    
    if (!pathToUse) {
      setMediaUrl(null);
      setIsLoading(false);
      return;
    }

    // ✅ Use centralized utility instead of direct Supabase calls
    const url = getPublicMediaUrl(pathToUse);
    setMediaUrl(url);
    setIsLoading(false);
  }, [mediaPath, legacyImagePath]);  // ✅ Include both deps

  // ✅ Cleaner: Single check for no media
  if (!mediaUrl && !isLoading) {
    return (
      <div className="w-full bg-slate-100 rounded-md overflow-hidden">
        <div className="aspect-[1400/732] w-full flex items-center justify-center bg-slate-200">
          <span className="text-sm text-slate-500">No media</span>
        </div>
      </div>
    );
  }

  // ✅ Clean video rendering
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

  // ✅ Clean image rendering
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
```

**Key Changes:**
- ✅ Added `"use client"` directive
- ✅ Import `getPublicMediaUrl` utility
- ✅ Added `legacyImagePath` prop
- ✅ Simplified URL generation (single utility call)
- ✅ Removed error state (handled gracefully)
- ✅ Cleaner conditional rendering
- ✅ Proper dependency array

---

## File 3: `components/releases/preview-release-modal.tsx`
**Path:** `/Users/fer/Desktop/new-post/components/releases/preview-release-modal.tsx`  
**Lines:** 80-95 (only section changed)

### BEFORE:
```typescript
{languages.map((lang) => {
  const releaseRow = groupRows.find((r) => r.lang === lang);
  if (!releaseRow) return null;

  // ❌ No support for legacy image_path
  const mediaPath = releaseRow.media_path || principalRow.media_path;
  const mediaType = releaseRow.media_type || principalRow.media_type;

  return (
    <TabsContent key={lang} value={lang} className="space-y-6 py-4">
      <ReleaseImage mediaPath={mediaPath} mediaType={mediaType} />
      {/* ... rest of content ... */}
    </TabsContent>
  );
})}
```

### AFTER:
```typescript
{languages.map((lang) => {
  const releaseRow = groupRows.find((r) => r.lang === lang);
  if (!releaseRow) return null;

  // ✅ Support all three fields
  const mediaPath = releaseRow.media_path || principalRow.media_path;
  const mediaType = releaseRow.media_type || principalRow.media_type;
  const legacyImagePath = releaseRow.image_path || principalRow.image_path;  // ✅ Added

  return (
    <TabsContent key={lang} value={lang} className="space-y-6 py-4">
      <ReleaseImage 
        mediaPath={mediaPath}            // ✅ Pass all props
        mediaType={mediaType}
        legacyImagePath={legacyImagePath}  // ✅ Pass legacy prop
      />
      {/* ... rest of content ... */}
    </TabsContent>
  );
})}
```

**Key Changes:**
- ✅ Extract `legacyImagePath` from both release rows
- ✅ Pass as third prop to `ReleaseImage`
- ✅ Maintains fallback chain (release → principal row)

---

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Files Modified** | - | 3 files |
| **Lines Added** | - | ~60 |
| **Lines Removed** | - | ~40 |
| **Net Change** | - | +20 lines cleaner code |
| **URL Generation** | ❌ Duplicated in component | ✅ Centralized in utility |
| **Error Handling** | ❌ Complex try/catch | ✅ Graceful utility |
| **Backward Compat** | ❌ No legacy support | ✅ Full legacy support |
| **Client Directive** | ❌ Missing | ✅ Added |
| **Code Quality** | ❌ Complex, error-prone | ✅ Simple, maintainable |

---

## Testing the Fix

**For legacy images (image_path like "cards/..."):**
1. Open Admin Preview
2. Should display correctly via fallback path

**For new images/videos (media_path like "releases/...", media_type):**
1. Create new release with image or video
2. Open preview
3. Media should display correctly

**For videos:**
1. Select video file on create/edit
2. Open preview
3. Should show `<video controls>` element

**Error cases:**
1. Missing media → "No media" placeholder
2. Invalid path → "No media" placeholder
3. No console errors related to URL generation

---

## Deployment Notes

✅ **No database changes needed** - Works with existing schema  
✅ **No migrations needed** - Backward compatible  
✅ **No env var changes needed** - Uses existing Supabase client  
✅ **No build issues** - All TypeScript validates  

---

Ready to commit! 🚀
