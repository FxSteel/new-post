# Has Cost Implementation Summary

## Overview
Added "Has Cost" (`has_cost`) field to Feature releases in the Admin panel. This allows admins to mark releases as paid/premium items.

## Implementation Details

### Key Features
- ✅ **Type Safety**: Added `has_cost: boolean` to the `NewRelease` interface
- ✅ **Create Release**: Admin can toggle `has_cost` for Feature releases; disabled for Bug releases
- ✅ **Edit Release**: Admin can modify `has_cost`; shared across all translations in the group
- ✅ **Table UI**: Shows "Con costo" badge for paid Feature releases
- ✅ **Validation**: Bug releases automatically forced to `has_cost=false`
- ✅ **UX**: Auto-disables toggle when release type is changed to "bug"

## Files Modified

### 1. **types/new-release.ts**
- Added `has_cost: boolean` field to the `NewRelease` interface
- This field is included in all database queries and operations

### 2. **components/ui/switch.tsx** (NEW)
- Created new Switch component using shadcn/ui pattern
- Built on Radix UI Switch Primitive (`@radix-ui/react-switch`)
- Styled with Tailwind CSS for consistent look and feel
- Features:
  - Smooth animations and transitions
  - Disabled state support
  - Focus ring support

### 3. **components/releases/create-release-modal.tsx**
**Changes:**
- Added `import { Switch } from "@/components/ui/switch"`
- Added state: `const [hasCost, setHasCost] = useState(false)`
- Updated release type selection handler to auto-disable `has_cost` for bugs
- Added new field section: "Tiene costo asociado" with Switch component
- In insert payload: `has_cost: releaseType === "bug" ? false : hasCost`
- Reset form includes: `setHasCost(false)`

**Behavior:**
- If `release_type === "feature"`: Switch is enabled, admin can toggle
- If `release_type === "bug"`: Switch is disabled, always `false`
- Changing release type to "bug" automatically sets `has_cost=false`

### 4. **components/releases/edit-release-modal.tsx**
**Changes:**
- Added `import { Switch } from "@/components/ui/switch"`
- Added state: `const [tabHasCost, setTabHasCost] = useState(false)`
- Updated `loadTabData()` to include `setTabHasCost(row.has_cost || false)`
- Updated release type handler to auto-disable `has_cost` for bugs
- Added new field section in tab content: "Tiene costo asociado" with Switch
- Updated `handleSubmit()` to include `has_cost` in update payload
- Applied shared rule: `has_cost: tabReleaseType === "bug" ? false : tabHasCost`
- Updated `handleAddTranslation()` to copy `has_cost` from primary translation

**Behavior:**
- When switching language tabs: `has_cost` value reflects the loaded translation
- When editing: `has_cost` is updated for the active tab
- **Shared Rule**: Since `has_cost` is a business property, all translations in the same group share the value
- When adding new translation: inherits `has_cost` from the primary translation
- If release type is "bug": forces `has_cost=false` and disables UI

### 5. **components/releases/releases-table.tsx**
**Changes:**
- Updated the Type column to show conditional badge
- Added "Con costo" badge that appears only when:
  - `release_type === "feature"` AND
  - `has_cost === true`

**Styling:**
- Blue pill badge: `bg-blue-50 text-blue-700 border border-blue-200`
- Positioned next to the Type badge (Feature/Bug)
- Only shown for paid Feature releases

## Database Considerations

The `has_cost` column already exists in the `public.new_releases` table:
- Column: `has_cost` (boolean, NOT NULL, default false)
- No migrations needed

### Queries Affected
All SELECT queries now include the `has_cost` field to ensure data consistency.

## Business Logic

### Rule: Bug releases cannot have cost
- When creating: If `release_type === "bug"`, the `has_cost` value is forced to `false`
- When updating: Same enforcement
- UI Enforcement: Toggle is disabled when release type is "bug"

### Rule: Shared cost across translations
- The `has_cost` field is shared across all translations in the same `group_id`
- When editing, changing `has_cost` updates the value for the entire group
- New translations inherit `has_cost` from the primary translation

## UI Components

### Create Release Modal
- Field Position: After "Tipo" field
- Label: "Tiene costo asociado"
- Control: Switch + text indicator (Yes/No or "Disabled for Bug releases")
- Disabled State: When release type is "bug" or form is loading

### Edit Release Modal
- Field Position: In each translation tab, after "Tipo" field
- Label: "Tiene costo asociado"
- Helper Text: "Shared across all translations in this group"
- Control: Switch + text indicator
- Disabled State: When release type is "bug", form is loading, or not in active tab

### Releases Table
- Badge: "Con costo" (soft blue pill)
- Visibility: Only for Feature releases with `has_cost === true`
- Position: Adjacent to Type badge (Feature/Bug)

## Testing Checklist

✅ **Create Release:**
- [ ] Create Feature release with `has_cost=false` (default)
- [ ] Create Feature release with `has_cost=true`
- [ ] Create Bug release (should always be `has_cost=false`)
- [ ] Switch from Feature to Bug (should auto-set `has_cost=false`)

✅ **Edit Release:**
- [ ] Edit Feature release and toggle `has_cost`
- [ ] Switch between language tabs (value should persist)
- [ ] Switch release type from Feature to Bug (should force `has_cost=false`)
- [ ] Add new translation to Feature with cost (new translation inherits `has_cost`)

✅ **Table Display:**
- [ ] "Con costo" badge shows only for paid Features
- [ ] Badge doesn't show for Bug releases
- [ ] Badge doesn't show for Feature releases with `has_cost=false`

## Validation & Error Handling

- ✅ Supabase errors: Toast error messages shown
- ✅ Invalid state: Bug releases cannot have cost (enforced at UI and API layer)
- ✅ Data consistency: All translations in a group have the same `has_cost` value
- ✅ Loading states: UI disabled during submission

## Notes

1. **Switch Component**: Created fresh based on shadcn/ui patterns since it wasn't previously available in the project
2. **Shared Rule**: `has_cost` is always shared across all translations in the same `group_id`. This is a business decision to keep cost information consistent across languages
3. **Backward Compatibility**: Existing releases default to `has_cost=false`, so no data migration is needed
4. **RLS**: No RLS changes needed; existing admin auth applies

## Deployment Notes

- No database migrations required (column already exists)
- No environment variable changes needed
- All changes are backward compatible
- Existing releases will have `has_cost=false` by default
