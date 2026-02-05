# Technical Reference - New Releases Admin System

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Admin Dashboard                   │
│                  /app/admin/page.tsx                │
│  (Filter State, Auth, Data Fetching, Modal State)   │
└────────────┬────────────────────────────────────────┘
             │
      ┌──────┴─────────┬──────────────┬──────────────┐
      ▼                ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Releases    │ │   Create     │ │    Edit      │ │   Preview    │
│   Table      │ │   Modal      │ │    Modal     │ │   Modal      │
│              │ │              │ │              │ │              │
│ • Filters    │ │ • Image      │ │ • Translate  │ │ • Display    │
│ • Search     │ │   Upload     │ │ • Manage     │ │   Release    │
│ • Sort       │ │ • Bullets    │ │   Group      │ │ • Image      │
│ • Bulk Ops   │ │ • Form       │ │ • Edit      │ │   Preview    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
      │                │              │              │
      └────────────────┴──────────────┴──────────────┘
             │
      ┌──────▼─────────────────────────┐
      │   Supabase Client               │
      │  (Auth, DB, Storage)            │
      └──────┬──────────┬───────────────┘
             │          │
      ┌──────▼──┐  ┌────▼────────────┐
      │ Database │  │  Storage        │
      │          │  │  (new-releases) │
      │ new_    │  │                 │
      │releases │  │  • Images       │
      │ table   │  │  • Metadata     │
      └─────────┘  └─────────────────┘
```

## Data Model

### NewRelease Interface
```typescript
interface NewRelease {
  id: string;              // UUID primary key
  group_id: string | null; // Groups translations
  tenant: string | null;   // Multi-tenancy (null for now)
  lang: "ES" | "EN" | "PT";
  title: string;
  month_label: string;     // e.g., "Feb 2026"
  size: "sm" | "md" | "lg";
  image_path: string;      // Storage path
  bullets: string[];       // Array of highlights
  kb_url: string;
  order_index: number;     // Display order
  published: boolean;      // true=visible, false=hidden
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}
```

## Group ID Logic Flow

### Creating First Release
```
User fills form
         │
         ▼
    Insert record with:
    - All fields
    - group_id: null
         │
         ▼
    Get returned record.id
         │
         ▼
    Update: SET group_id = {id}
         │
         ▼
    Result: group_id === id
    (This release is the "parent" of its group)
```

### Creating Translation
```
User clicks "Add Translation"
         │
         ▼
    Get original release data:
    - group_id (or original.id if null)
    - image_path
    - month_label, order_index, size, kb_url
         │
         ▼
    Check if translation exists:
    - Query where group_id = group_id AND lang = selected_lang
    - If exists: error toast
    - If not: proceed
         │
         ▼
    Insert new record:
    - title: "[LANG] Original Title"
    - lang: selected_lang
    - group_id: original.group_id
    - image_path: original.image_path (reuse)
    - month_label, order_index, size, kb_url: copied
    - published: original.published
    - bullets: original.bullets
         │
         ▼
    Success toast + refresh translations list
```

## Supabase Query Patterns

### Fetch All Releases
```typescript
const { data, error } = await supabase
  .from("new_releases")
  .select("*")
  .order("order_index", { ascending: true });
  // Client-side filtering: lang, status, search
```

### Fetch Group Translations
```typescript
const { data, error } = await supabase
  .from("new_releases")
  .select("*")
  .eq("group_id", groupId)
  .neq("id", currentId);
  // Returns all translations in same group
```

### Create with Group
```typescript
// Step 1: Insert
const { data: insertData, error: insertError } = await supabase
  .from("new_releases")
  .insert([{ ...formData, group_id: null }])
  .select();

// Step 2: Update group_id
if (insertData) {
  const newId = insertData[0].id;
  await supabase
    .from("new_releases")
    .update({ group_id: newId })
    .eq("id", newId);
}
```

### Delete with Image Cleanup
```typescript
// Step 1: Get image paths
const imagePaths = releases
  .filter(r => selectedIds.has(r.id))
  .map(r => r.image_path);

// Step 2: Delete from storage
await supabase.storage
  .from("new-releases")
  .remove(imagePaths);

// Step 3: Delete records
await supabase
  .from("new_releases")
  .delete()
  .in("id", Array.from(selectedIds));
```

## Component Communication

### AdminPage ↔ ReleasesTable
```
Props Down:
├── releases: NewRelease[]
├── onEdit: (release) => void
├── onPreview: (release) => void
├── onRefresh: () => void
├── filterLang: "ALL" | "ES" | "EN" | "PT"
├── setFilterLang: (lang) => void
├── filterStatus: "ALL" | "published" | "paused"
└── setFilterStatus: (status) => void

State Management:
├── selectedIds: Set<string>
├── search: string
├── deleteDialogOpen: boolean
└── visibleColumns: { [column]: boolean }
```

### AdminPage ↔ EditReleaseModal
```
Props:
├── open: boolean
├── onOpenChange: (open) => void
├── release: NewRelease | null
└── onSuccess: () => void

Internal State:
├── form fields (title, lang, size, etc.)
├── bullets: string[]
├── translations: NewRelease[]
├── showTranslationForm: boolean
├── translationLang: language
└── loading: boolean
```

## File Organization

### Components Structure
```
components/
├── releases/
│   ├── create-release-modal.tsx
│   │   └── Creates new release with group_id logic
│   ├── edit-release-modal.tsx
│   │   └── Edit + manage translations
│   ├── preview-release-modal.tsx
│   │   └── Display release with image
│   ├── release-image.tsx
│   │   └── Image component with Storage URL
│   └── releases-table.tsx
│       └── Main table with filters and bulk operations
├── ui/
│   ├── dialog.tsx          (shadcn)
│   ├── button.tsx          (shadcn)
│   ├── input.tsx           (shadcn)
│   ├── select.tsx          (shadcn)
│   ├── table.tsx           (shadcn)
│   ├── alert-dialog.tsx    (shadcn)
│   ├── checkbox.tsx        (shadcn)
│   ├── dropdown-menu.tsx   (shadcn)
│   └── badge.tsx           (shadcn)
└── ...
```

## Filter Logic

### Filtering Algorithm
```typescript
const filteredReleases = releases.filter(
  (r) =>
    // Search filter
    (r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.month_label.toLowerCase().includes(search.toLowerCase())) &&
    // Language filter
    (filterLang === "ALL" || r.lang === filterLang) &&
    // Status filter
    (filterStatus === "ALL" ||
      (filterStatus === "published" && r.published) ||
      (filterStatus === "paused" && !r.published))
);
```

Complexity: O(n) where n = number of releases
Result: Client-side filtered, no additional queries

## Image Storage Strategy

### Upload Path Pattern
```
new-releases/
└── cards/
    └── {random-string}.{ext}

Example:
new-releases/cards/a1b2c3d4e5f6g7h8.jpg
```

### Why cards/ subdirectory?
- Organizes images by type
- Future: could add other media types (videos, icons, etc.)
- Easy to batch operations on specific media type

### Image Reuse for Translations
```
Original Release ES:
  image_path: "new-releases/cards/abc123.jpg"

Translation EN (same group_id):
  image_path: "new-releases/cards/abc123.jpg"  // Identical

Translation PT (same group_id):
  image_path: "new-releases/cards/abc123.jpg"  // Identical

Result:
  • Single image file in storage
  • Three database records reference it
  • Consistent visual across languages
  • Storage efficient
```

## Error Handling

### Toast Notifications
```typescript
// Success cases
toast.success("Release created successfully!");
toast.success("Release updated successfully!");
toast.success("Release(s) deleted successfully!");
toast.success("Translation created successfully!");

// Error cases
toast.error("Title is required");
toast.error("Image is required");
toast.error(`Upload failed: ${uploadError.message}`);
toast.error(`Failed to create release: ${insertError.message}`);
toast.error(`Delete failed: ${error.message}`);
```

### Validation Rules
1. Title required for create/edit
2. Image required for create
3. Maximum 5 bullet points
4. No duplicate language translations in same group
5. Cannot change language of existing release

## Performance Considerations

### Current Implementation
- All releases loaded at once (fits in memory for typical use)
- Filters applied client-side (no additional queries)
- Search is case-insensitive substring match
- Image preview uses DataURL (loaded in memory)

### Scaling to 1000+ Releases
Consider implementing:
- Pagination (e.g., 50 per page)
- Server-side filtering
- Virtual scrolling for table
- Image lazy loading
- Debounced search

### Storage Optimization
- Images stored once, referenced multiple times
- Delete operation removes unused images
- No orphaned images (if delete succeeds)

## Security Considerations

### Current Implementation
- Admin auth check on page load
- User must be in new_releases_admins table
- All operations require valid session
- Images stored in private bucket (URLs are public but not listed)

### Future Enhancements
- Implement row-level security (RLS)
- Audit logging for admin actions
- Rate limiting on bulk operations
- Image size/format validation

## Testing Strategy

### Unit Tests (if added)
- Group ID logic after create
- Filter combinations
- Validation rules
- Error handling

### Integration Tests
- Full create → translate → delete flow
- Image upload and cleanup
- Database consistency after operations

### Manual Testing (See QUICK_TEST.md)
- User workflows
- UI responsiveness
- Toast notifications
- Error scenarios
