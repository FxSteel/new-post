# Quick Code Reference - Has Cost Implementation

## Files Modified Summary

### 1. ✅ types/new-release.ts
```typescript
export interface NewRelease {
  // ... existing fields ...
  release_type: "feature" | "bug";
  has_cost: boolean;  // ← ADDED
  created_at: string;
  updated_at: string;
}
```

---

### 2. ✅ components/ui/switch.tsx (NEW FILE)
Complete Switch component implementation using Radix UI + Tailwind.

---

### 3. ✅ components/releases/create-release-modal.tsx

**Import added:**
```tsx
import { Switch } from "@/components/ui/switch";
```

**State added:**
```tsx
const [hasCost, setHasCost] = useState(false);
```

**Field added after Tipo:**
```tsx
{/* Has Cost */}
<div className="space-y-2">
  <Label className="text-sm font-medium">Tiene costo asociado</Label>
  <div className="flex items-center gap-3">
    <Switch
      checked={hasCost}
      onCheckedChange={setHasCost}
      disabled={releaseType === "bug" || loading}
    />
    <span className="text-sm text-slate-600">
      {releaseType === "bug" ? "(Disabled for Bug releases)" : hasCost ? "Yes" : "No"}
    </span>
  </div>
</div>
```

**Release type handler updated:**
```tsx
onValueChange={(v) => {
  const newType = v as "feature" | "bug";
  setReleaseType(newType);
  // Auto-disable has_cost for bugs
  if (newType === "bug") {
    setHasCost(false);
  }
}}
```

**Insert payload:**
```tsx
has_cost: releaseType === "bug" ? false : hasCost,
```

**Form reset:**
```tsx
setHasCost(false);
```

---

### 4. ✅ components/releases/edit-release-modal.tsx

**Import added:**
```tsx
import { Switch } from "@/components/ui/switch";
```

**State added:**
```tsx
const [tabHasCost, setTabHasCost] = useState(false);
```

**loadTabData updated:**
```tsx
const loadTabData = (row: NewRelease) => {
  setTabTitle(row.title);
  setTabBullets(row.bullets || []);
  setTabReleaseType(row.release_type || "feature");
  setTabHasCost(row.has_cost || false);  // ← ADDED
};
```

**Field added in TabsContent after Tipo (per translation):**
```tsx
{/* Has Cost */}
<div className="space-y-2">
  <Label className="text-sm font-medium">Tiene costo asociado</Label>
  <div className="flex items-center gap-3">
    <Switch
      checked={activeTab === row.lang ? tabHasCost : false}
      onCheckedChange={(checked) => activeTab === row.lang && setTabHasCost(checked)}
      disabled={loading || activeTab !== row.lang || tabReleaseType === "bug"}
    />
    <span className="text-sm text-slate-600">
      {activeTab === row.lang ? (
        tabReleaseType === "bug" 
          ? "(Disabled for Bug releases)" 
          : tabHasCost ? "Yes" : "No"
      ) : ""}
    </span>
  </div>
  <p className="text-xs text-slate-500">Shared across all translations in this group</p>
</div>
```

**Release type handler updated in TabsContent:**
```tsx
onValueChange={(v) => {
  if (activeTab === row.lang) {
    const newType = v as "feature" | "bug";
    setTabReleaseType(newType);
    // Auto-disable has_cost for bugs
    if (newType === "bug") {
      setTabHasCost(false);
    }
  }
}}
```

**Update payload in handleSubmit:**
```tsx
const updatedRows = groupRows.map((row) => {
  if (row.lang === activeTab) {
    return {
      ...row,
      title: tabTitle,
      bullets: tabBullets.filter((b) => b.trim()),
      month_date: monthDateValue,
      release_type: tabReleaseType,
      has_cost: tabReleaseType === "bug" ? false : tabHasCost,  // ← ADDED
    };
  }
  return row;
});

// Update all rows - shared has_cost
const updatePromises = updatedRows.map((row) =>
  supabase
    .from("new_releases")
    .update({
      // ... existing fields ...
      release_type: row.release_type,
      has_cost: row.has_cost,  // ← ADDED
    })
    .eq("id", row.id)
);
```

**Add translation payload:**
```tsx
const { error: insertError } = await supabase
  .from("new_releases")
  .insert([
    {
      // ... existing fields ...
      release_type: groupRows[0]?.release_type || "feature",
      has_cost: (groupRows[0]?.release_type === "bug") ? false : (groupRows[0]?.has_cost || false),  // ← ADDED
      tenant: groupRows[0]?.tenant,
      group_id: groupIdToUse,
    },
  ]);
```

---

### 5. ✅ components/releases/releases-table.tsx

**Type column updated in table rows:**
```tsx
{visibleColumns.type && (
  <TableCell>
    <div className="flex gap-2 flex-wrap items-center">
      <Badge
        variant="default"
        className={
          group.principalRow.release_type === "bug"
            ? "bg-red-100 text-red-900 border border-red-200"
            : "bg-blue-100 text-blue-900 border border-blue-200"
        }
      >
        {group.principalRow.release_type === "bug" ? (
          <>
            <Bug className="h-3 w-3 mr-1 inline" />
            Bug
          </>
        ) : (
          <>
            <Zap className="h-3 w-3 mr-1 inline" />
            Feature
          </>
        )}
      </Badge>
      {group.principalRow.release_type === "feature" && group.principalRow.has_cost && (
        <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
          Con costo
        </Badge>
      )}
    </div>
  </TableCell>
)}
```

---

## Key Implementation Points

### 1. **Conditional Enable/Disable**
- Feature releases: Switch enabled ✅
- Bug releases: Switch disabled, always `false` ❌

### 2. **Auto-Detection**
When release type changes to "bug" → automatically sets `has_cost=false`

### 3. **Shared Across Translations**
All translations in the same `group_id` share the same `has_cost` value

### 4. **Table Display**
"Con costo" badge shows only when:
```
release_type === "feature" AND has_cost === true
```

### 5. **Data Consistency**
- Insert: Force `false` for bugs
- Update: Force `false` for bugs  
- New translations: Inherit from primary

---

## Validation Rules

| Scenario | Action |
|----------|--------|
| Create Feature, toggle has_cost=true | ✅ Saved as `true` |
| Create Bug, has_cost=true attempted | ✅ Forced to `false` |
| Edit Feature, change to Bug | ✅ `has_cost` auto-set to `false` |
| Switch language tabs | ✅ `has_cost` persists across group |
| Add translation to paid Feature | ✅ New translation inherits `has_cost=true` |

