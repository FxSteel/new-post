# Quick Test Guide - New Releases Admin

## Prerequisites
- Access to admin panel (authenticated user)
- Test images ready (JPG/PNG)
- Supabase credentials configured

## Test Scenarios

### 1. Create Your First Release
**Goal:** Create a new release and verify group_id logic

**Steps:**
1. Click "New release" button
2. Fill in form:
   - Title: "Test Release ES"
   - Lang: ES
   - Upload an image (1400x732 recommended)
   - Add 2-3 bullet points
   - Order Index: 1
   - Size: md
   - KB URL: https://example.com
   - Status: Published
   - Month Label: "Feb 2026"
3. Click "Create Release"
4. Verify:
   - Success toast appears
   - Table updates with new release
   - group_id equals the release's id (check in Supabase console)
   - Image uploaded to Storage

### 2. Add Translation
**Goal:** Create a translation and verify shared group_id

**Steps:**
1. Click the release you just created
2. Click "Edit" in the actions menu
3. Scroll to "Translations" section
4. Click "Add Translation"
5. Select "EN" from dropdown
6. Click "Create Translation"
7. Verify:
   - Success toast
   - New translation appears in Translations list
   - Same image_path used
   - group_id matches original
   - Title shows "[EN] Test Release ES"

### 3. Test Filters
**Goal:** Verify filter functionality

**Steps:**
1. Go back to table
2. Filter by Language: "EN"
   - Verify: Only EN release shows
3. Filter by Language: "ES"
   - Verify: Only ES release shows
4. Filter by Status: "Published"
   - Verify: Both show (both published)
5. Filter by Status: "Paused"
   - Verify: No results
6. Clear filters and test search:
   - Search "Test" - should find both
   - Search "Feb" - should find both

### 4. Test Delete
**Goal:** Verify delete confirmation and cleanup

**Steps:**
1. Select the EN translation with checkbox
2. Click "Delete (1)" button
3. Verify:
   - Alert dialog appears (Spanish text)
   - Cancel button is soft red
   - Confirm button is white with black text
4. Click "Delete"
5. Verify:
   - Success toast
   - Release removed from table
   - Image removed from Storage (check Supabase)
   - Original ES release still exists

### 5. Test Bulk Delete
**Goal:** Verify multi-delete functionality

**Steps:**
1. Select "Select All" checkbox
2. Verify: All rows checked
3. Click "Delete (n)" button
4. Click "Delete" in confirmation dialog
5. Verify:
   - Success toast
   - All rows removed
   - Images cleaned up from Storage
   - Table shows "No releases found"

### 6. Test Edit
**Goal:** Verify edit and translation management

**Steps:**
1. Create new ES release (from step 1 again)
2. Click Edit
3. Change title to "Updated ES Release"
4. Change one bullet point
5. Click "Save Changes"
6. Verify: Success toast and changes apply
7. Reopen Edit modal
8. Verify: Changes persisted
9. Add EN translation as before
10. Verify: EN translation shows in Translations section

## Expected Behaviors

### Toast Notifications
- **Create Success:** "Release created successfully!" (soft green)
- **Update Success:** "Release updated successfully!" (soft green)
- **Delete Success:** "Release(s) deleted successfully!" (soft green)
- **Translation Success:** "Translation created successfully!" (soft green)
- **Error:** Shows error message (soft red)

### Image Handling
- Image preview shows in create modal
- Image aspect ratio maintained (1400/732)
- Same image reused for translations
- Image deleted from Storage when release deleted

### Filters Behavior
- Language filter works independent of status
- Status filter works independent of language
- Search works across all visible columns
- Filters combine (AND logic)

### Table Columns (in order)
1. Checkbox (select all)
2. Order
3. Month
4. Lang
5. Status (badge: Published/Paused)
6. Preview (eye icon)
7. Last Updated
8. Actions (... menu)

### Translations Section (in Edit Modal)
- Shows all releases with same group_id
- Displays language and status
- "Add Translation" button appears if languages available
- Cannot add duplicate language translations
- Language select shows only available options

## Troubleshooting

### "Group ID issue after create"
- Check: Record should have group_id = id immediately after insert
- If not: Verify the update query runs after insert

### "Image not showing in preview"
- Check: Image uploaded to correct bucket ("new-releases")
- Check: image_path is correct in database

### "Translation not appearing"
- Check: Both records have same group_id
- Check: select query filters by group_id correctly

### "Delete not removing image"
- Check: Storage bucket path is correct
- Check: image_path in DB matches actual file path

### "Filters not working"
- Check: Filter state passes correctly to table
- Check: Filter logic applies all conditions

## Performance Notes

- Table loads all releases, filters client-side
- For 1000+ releases, consider pagination
- Images optimized with object-cover and aspect ratio
- Bulk operations: Delete is sequential per image, then batch delete records
