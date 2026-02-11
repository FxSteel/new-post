# Media Upload Implementation - Image & Video Support

## Overview
Added support for uploading **image OR video** for each release in the New Releases Admin. The implementation includes validation, preview, and proper storage management.

## Database Schema
- **Table**: `public.new_releases`
- **New Columns**:
  - `media_path` (text | null): Path inside storage bucket
  - `media_type` (text | null): "image" | "video"
- **Deprecated**: `image_path` (still exists but code no longer uses it)

## Storage Configuration
- **Bucket**: "NEW-RELEASES" (PUBLIC)
- **Upload Paths**:
  - Images: `images/<uuid>-<filename>`
  - Videos: `videos/<uuid>-<filename>`
- **Database Storage**: Only path stored (e.g., "videos/abc123-file.mp4"), NOT full URL

## Files Modified

### 1. **Type Definitions** - [types/new-release.ts](types/new-release.ts)
- Added `media_path: string | null`
- Added `media_type: "image" | "video" | null`
- Kept `image_path?: string` for backward compatibility
- Removed mandatory `image_path: string`

### 2. **Upload Utilities** - [lib/media-upload.ts](lib/media-upload.ts) (NEW FILE)
Provides:
- `validateMediaFile()`: Validates file type and size
  - Images: JPEG, PNG, WebP (max 5MB)
  - Videos: MP4, WebM (max 50MB)
- `generateMediaStoragePath()`: Creates UUID-based storage paths
- `sanitizeFilename()`: Removes special characters from filenames
- `detectMediaType()`: Determines media type from file
- `createPreviewUrl()` & `revokePreviewUrl()`: Manages blob URLs for memory safety

### 3. **Create Modal** - [components/releases/create-release-modal.tsx](components/releases/create-release-modal.tsx)
**Changes**:
- Replaced `imageFile`/`imagePreview` with `mediaFile`/`mediaType`/`mediaPreviewUrl`
- File input accepts: `accept="image/*,video/*"`
- Added validation using `validateMediaFile()`
- Shows appropriate preview:
  - Images: `<img>` with aspect ratio container
  - Videos: `<video controls>` element
- Upload logic:
  - Generates storage path using `generateMediaStoragePath()`
  - Uploads to "NEW-RELEASES" bucket
  - Stores `media_path` and `media_type` in DB
  - Cleans up blob URLs on unmount
- Error handling: Deletes uploaded media if DB write fails

### 4. **Edit Modal** - [components/releases/edit-release-modal.tsx](components/releases/edit-release-modal.tsx)
**Changes**:
- Added `mediaFile`/`mediaType` state for new uploads
- Media section shows current media with emoji indicator (🖼️ for images, 📹 for videos)
- "Replace media" button allows uploading new media
- Preview shows below for verification
- On save:
  - If new media selected: uploads and updates DB with new paths
  - Deletes old media after successful DB update (best effort)
  - If no new media: keeps existing `media_path`/`media_type`
- Translation creation copies media from principal release

### 5. **Release Image Component** - [components/releases/release-image.tsx](components/releases/release-image.tsx)
**Changes**:
- Renamed prop from `imagePath` to `mediaPath`
- Added `mediaType` parameter to determine rendering
- Video rendering: `<video controls>`
- Image rendering: `<img>` with aspect ratio
- Handles null/missing media gracefully
- Fixed bucket name to "NEW-RELEASES" (uppercase)

### 6. **Preview Modal** - [components/releases/preview-release-modal.tsx](components/releases/preview-release-modal.tsx)
**Changes**:
- Updated `ReleaseImage` call to pass `mediaType`
- Falls back to principal release's media if translation has none
- Works seamlessly with both image and video types

### 7. **Releases Table** - [components/releases/releases-table.tsx](components/releases/releases-table.tsx)
**Changes**:
- Updated delete logic to remove `media_path` instead of `image_path`
- Changed bucket reference to "NEW-RELEASES"
- Added error handling for media deletion (ignores errors)
- No UI changes needed - table works with updated preview component

## Validation Rules

### Image Files
- **Allowed Types**: JPEG, PNG, WebP
- **Max Size**: 5MB
- **Validation**: Checked on file select, toast error if invalid

### Video Files
- **Allowed Types**: MP4, WebM
- **Max Size**: 50MB
- **Validation**: Checked on file select, toast error if invalid

## Upload Flow

### Create Release
1. User selects image or video
2. Validation runs immediately
3. Preview displays (image in aspect container, video with controls)
4. On submit:
   - Validates file again
   - Generates storage path with UUID
   - Uploads to "NEW-RELEASES" bucket
   - Inserts DB record with `media_path` and `media_type`
   - Sets `group_id` after insert
   - Shows success toast
   - Cleans up blob URLs

### Edit Release
1. Current media displayed with indicator
2. User can replace with new file (or skip to keep existing)
3. On submit:
   - If new file: uploads to "NEW-RELEASES" bucket
   - Updates DB record with new `media_path`/`media_type`
   - Deletes old file after successful DB update (best effort)
   - Shows success toast
   - Cleans up blob URLs

### Delete Release(s)
1. Collects all media paths from releases being deleted
2. Deletes media files from "NEW-RELEASES" bucket (ignores errors)
3. Deletes DB records
4. Shows success toast

## Security
- Admin uses authenticated Supabase client (user session)
- Storage bucket is PUBLIC for read access
- Uploads require authenticated user (bucket policies enforce)
- Service role keys NOT used in browser code

## Browser Compatibility
- Uses standard HTML5 video element with controls
- Uses standard img tag for images
- Uses modern Blob URL creation/revocation
- Compatible with all modern browsers

## Error Handling
- Invalid file type → Toast error, file not selected
- File too large → Toast error, file not selected
- Upload fails → Toast error, media deleted from storage, DB not updated
- DB write fails → Toast error, media deleted from storage
- Old media deletion → Errors silently ignored (best effort)

## Memory Management
- Blob URLs revoked on component unmount
- Blob URLs revoked when new file selected
- Preview cleanup prevents memory leaks

## Testing Checklist
- [ ] Create release with image (JPEG, PNG, WebP)
- [ ] Create release with video (MP4, WebM)
- [ ] Verify media displays in preview modal
- [ ] Edit release and replace media
- [ ] Edit release without changing media (kept)
- [ ] Delete release (media file deleted)
- [ ] Try invalid file type (toast error)
- [ ] Try oversized file (toast error)
- [ ] Verify storage paths in DB: `images/<uuid>-name` and `videos/<uuid>-name`
- [ ] Verify public URLs work from storage
- [ ] Test preview with multiple languages (uses principal if missing)
- [ ] Add new translation (copies media from principal)

## Future Enhancements (Optional)
- Add video thumbnail generation
- Compress images before upload
- Add drag-and-drop upload
- Show file size and dimensions before upload
- Add media crop/edit interface
- Multiple media support per release
