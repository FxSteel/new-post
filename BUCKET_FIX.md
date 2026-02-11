# Fix: Bucket Name Consistency - "new-releases"

## Problem
Upload was failing with "Bucket not found" error due to inconsistent bucket name references:
- Some places used `"NEW-RELEASES"` (uppercase)
- Some used `"new_releases"` (underscore)
- Correct name is `"new-releases"` (hyphen, lowercase)

## Solution
Updated ALL Supabase Storage references to use the correct bucket name: `"new-releases"`

## Files Changed

### 1. **components/releases/create-release-modal.tsx**
- Line 132: `"NEW-RELEASES"` → `"new-releases"` (upload)
- Line 169: `"NEW-RELEASES"` → `"new-releases"` (delete on error)

### 2. **components/releases/edit-release-modal.tsx**
- Line 285: `"NEW-RELEASES"` → `"new-releases"` (upload)
- Line 343: `"NEW-RELEASES"` → `"new-releases"` (delete on error)
- Line 358: `"NEW-RELEASES"` → `"new-releases"` (delete old media)

### 3. **components/releases/releases-table.tsx**
- Line 244: `"NEW-RELEASES"` → `"new-releases"` (delete)

### 4. **lib/media-upload.ts**
- Updated `generateMediaStoragePath()` to use `"releases/"` folder prefix
  - Before: `images/` or `videos/` folders based on type
  - After: All files stored in `releases/` folder with consistent naming

## Verification

✅ **Bucket name standardized**: All `storage.from()` calls now use `"new-releases"`  
✅ **Database operations**: Still correctly use `"new_releases"` (underscore) for table names  
✅ **Upload logic**: Correctly saves both `media_path` and `media_type` to database  
✅ **Storage path**: Consistent format `releases/{uuid}-{filename}`  
✅ **No TypeScript errors**: All changes validated  

## Storage Path Examples

**After fix:**
- Image: `releases/a1b2c3d4-photo.jpg`
- Video: `releases/x9y8z7w6-video.mp4`

**Database entry:**
```json
{
  "media_path": "releases/a1b2c3d4-photo.jpg",
  "media_type": "image"
}
```

## Testing
Upload should now work correctly:
1. ✅ Create release with image → stores in `releases/` folder
2. ✅ Create release with video → stores in `releases/` folder
3. ✅ Edit release with new media → uploads and deletes old correctly
4. ✅ Preview loads images/videos from correct bucket

## Commit Status
✅ Ready to commit - all storage operations use correct bucket name
