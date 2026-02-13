# Has Cost Feature - Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Admin Dashboard                       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Create Release Modal                     │  │
│  │ ┌──────────────────────────────────────────────┐ │  │
│  │ │ Fields:                                      │ │  │
│  │ │ - Title                                      │ │  │
│  │ │ - Language (ES/EN/PT)                        │ │  │
│  │ │ - Media (Image/Video)                        │ │  │
│  │ │ - Bullets (5 max)                            │ │  │
│  │ │ - Order Index                                │ │  │
│  │ │ - Size (sm/md/lg)                            │ │  │
│  │ │ - Tipo (Feature/Bug) ← Controls has_cost     │ │  │
│  │ │ - 🆕 Tiene costo asociado [Switch] ✨        │ │  │
│  │ │ - KB URL                                     │ │  │
│  │ │ - Status (Published/Paused)                  │ │  │
│  │ │ - Month/Year                                 │ │  │
│  │ │                                              │ │  │
│  │ │ Logic:                                       │ │  │
│  │ │ Feature → has_cost enabled                   │ │  │
│  │ │ Bug → has_cost disabled (always false)       │ │  │
│  │ └──────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                             │
│                          ↓                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │    INSERT to new_releases table                │  │
│  │    payload: {                                  │  │
│  │      ...other fields,                          │  │
│  │      release_type: "feature|bug",              │  │
│  │      has_cost: bug ? false : userToggle        │  │
│  │    }                                           │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                             │
│                          ↓                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Edit Release Modal                      │  │
│  │ (for each translation in group)                 │  │
│  │ ┌──────────────────────────────────────────────┐ │  │
│  │ │ Tabs: [ES] [EN] [PT]                         │ │  │
│  │ │ ┌──────────────────────────────────────────┐ │ │  │
│  │ │ │ Per-Tab Fields:                          │ │ │  │
│  │ │ │ - Title (lang-specific)                  │ │ │  │
│  │ │ │ - Tipo (Feature/Bug)                     │ │ │  │
│  │ │ │ - 🆕 Tiene costo [Switch] (shared) ✨   │ │ │  │
│  │ │ │ - Bullets (lang-specific)                │ │ │  │
│  │ │ │                                          │ │ │  │
│  │ │ │ Shared Fields (across all tabs):         │ │ │  │
│  │ │ │ - Media Path/Type                        │ │ │  │
│  │ │ │ - Order Index                            │ │ │  │
│  │ │ │ - Size                                   │ │ │  │
│  │ │ │ - KB URL                                 │ │ │  │
│  │ │ │ - Status                                 │ │ │  │
│  │ │ │ - Month/Year                             │ │ │  │
│  │ │ └──────────────────────────────────────────┘ │ │  │
│  │ └──────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                             │
│                          ↓                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │    UPDATE all rows in group                    │  │
│  │    WHERE group_id = <groupId>                  │  │
│  │    payload: {                                  │  │
│  │      release_type: updated value,              │  │
│  │      has_cost: bug ? false : userToggle,       │  │
│  │      ...other fields                           │  │
│  │    }                                           │  │
│  │                                                │  │
│  │    Note: All translations get same has_cost!   │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                             │
│                          ↓                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Releases Table Display                  │  │
│  │ ┌──────────────────────────────────────────────┐ │  │
│  │ │ Columns:                                     │ │  │
│  │ │ [Order] [Month] [Lang] [Status] [Type] ...   │ │  │
│  │ │                                              │ │  │
│  │ │ Type Column Logic:                           │ │  │
│  │ │ ┌─────────────────────────────────────────┐ │ │  │
│  │ │ │ [Bug Badge] OR                          │ │ │  │
│  │ │ │ [Feature Badge] [Con costo Badge] 🏷️    │ │ │  │
│  │ │ │                                         │ │ │  │
│  │ │ │ "Con costo" shows only when:           │ │ │  │
│  │ │ │ release_type === "feature" &&          │ │ │  │
│  │ │ │ has_cost === true                      │ │ │  │
│  │ │ └─────────────────────────────────────────┘ │ │  │
│  │ └──────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
              ┌───────────────────────┐
              │  Supabase Database    │
              │                       │
              │  new_releases table   │
              │  - id                 │
              │  - group_id           │
              │  - lang               │
              │  - title              │
              │  - release_type       │
              │  - has_cost ✨        │
              │  - ...other fields    │
              │                       │
              └───────────────────────┘
```

---

## State Flow - Create Release

```
Initial State:
├─ releaseType: "feature"
├─ hasCost: false
└─ Switch: [ENABLED]

User changes releaseType → "bug":
├─ releaseType: "bug"
├─ hasCost: false (auto-set)
└─ Switch: [DISABLED]

User changes releaseType → "feature":
├─ releaseType: "feature"
├─ hasCost: false (remains)
└─ Switch: [ENABLED]

User toggles hasCost → true:
├─ releaseType: "feature"
├─ hasCost: true ✨
└─ Switch: [ENABLED]

Submit:
├─ API Payload:
│  ├─ release_type: "feature"
│  └─ has_cost: true
└─ DB Insert → new_releases table
```

---

## State Flow - Edit Release (with Translations)

```
Group: group_id = "abc123"
├─ Translation 1 (ES): has_cost = true
├─ Translation 2 (EN): has_cost = true
└─ Translation 3 (PT): has_cost = true

Edit Modal Opens:
├─ Load Tab (ES):
│  ├─ tabReleaseType: "feature"
│  └─ tabHasCost: true
├─ Switch: [ENABLED]
└─ Active Tab: ES

User switches to EN tab:
├─ Save ES data to local state
├─ Load Tab (EN):
│  ├─ tabReleaseType: "feature"
│  └─ tabHasCost: true (persists across group)
└─ Active Tab: EN

User toggles hasCost → false:
├─ tabHasCost: false
└─ Switch: [ENABLED]

User clicks Save:
├─ UPDATE new_releases
│  WHERE group_id = "abc123"
│  SET has_cost = false
│
├─ Result: All 3 translations updated
│  ├─ ES: has_cost = false
│  ├─ EN: has_cost = false
│  └─ PT: has_cost = false
└─ Toast: "Release updated successfully!"
```

---

## Conditional Logic Tree

```
┌─ Create Release Modal ─┐
│                        │
├─ releaseType ──────────┤
│  ├─ "feature"         │
│  │  ├─ hasCost Switch │
│  │  │  ├─ true  → Save as true
│  │  │  └─ false → Save as false
│  │  └─ UI: [ENABLED]
│  │
│  └─ "bug"
│     ├─ hasCost Auto   → false
│     └─ UI: [DISABLED]
│
└────────────────────────┘

┌─ Table Row Display ────┐
│                        │
├─ release_type         │
│  ├─ "feature"         │
│  │  ├─ has_cost       │
│  │  │  ├─ true        │
│  │  │  │  └─ Show Badge: "Con costo"
│  │  │  └─ false       │
│  │  │     └─ No Badge
│  │  └─ Show: [Feature Badge]
│  │
│  └─ "bug"
│     ├─ has_cost: false (always)
│     └─ Show: [Bug Badge]
│
└────────────────────────┘
```

---

## Data Flow Diagram

```
USER INPUT
    │
    ├─ Create Modal
    │  └─ releaseType + hasCost
    │     └─ Validate (bug → false)
    │        └─ generatePayload()
    │           └─ INSERT new_releases
    │              └─ Return: id, group_id, has_cost
    │
    ├─ Edit Modal
    │  └─ Per-tab: releaseType + hasCost
    │     └─ Validate (bug → false)
    │        └─ generatePayload()
    │           └─ UPDATE new_releases (all in group)
    │              └─ Result: all rows updated
    │
    └─ Add Translation
       └─ Inherit: has_cost from group
          └─ INSERT new_releases
             └─ New row created with inherited value

SUPABASE DATABASE (new_releases table)
    │
    ├─ Column: has_cost (boolean)
    ├─ Constraint: NOT NULL
    ├─ Default: false
    └─ Indexed: by group_id (for group queries)

DISPLAY LAYER (Table)
    │
    └─ Query: SELECT * WHERE group_id = ?
       └─ principalRow.release_type + principalRow.has_cost
          └─ Render badges conditionally
             ├─ If feature + has_cost: show "Con costo"
             ├─ If feature + !has_cost: no badge
             └─ If bug: no cost badge (has_cost always false)
```

---

## Component Hierarchy

```
App
└─ Page (Admin)
   └─ ReleasesTable
      ├─ CreateReleaseModal
      │  ├─ Dialog
      │  ├─ Form
      │  │  ├─ Input (title)
      │  │  ├─ Select (language)
      │  │  ├─ Select (tipo) ← Controls hasCost
      │  │  ├─ Switch (has_cost) ✨ ← NEW
      │  │  ├─ Input (kb_url)
      │  │  └─ Button (submit)
      │  └─ Logic: Supabase insert()
      │
      ├─ EditReleaseModal
      │  ├─ Dialog
      │  ├─ Tabs (language)
      │  │  ├─ TabsContent (per-lang)
      │  │  │  ├─ Input (title)
      │  │  │  ├─ Select (tipo) ← Controls tabHasCost
      │  │  │  ├─ Switch (has_cost) ✨ ← NEW
      │  │  │  └─ Inputs (bullets)
      │  │  └─ Add Translation Form
      │  │     └─ Inherits has_cost ✨
      │  └─ Logic: Supabase update()
      │
      └─ Table
         ├─ TableHeader
         ├─ TableBody
         │  └─ TableRow (per-group)
         │     ├─ Order, Month, Languages
         │     ├─ Type Column ✨
         │     │  ├─ [Feature/Bug Badge]
         │     │  └─ [Con costo Badge] (conditional)
         │     ├─ Status, Actions
         │     └─ Logic: Render conditional badges
         └─ Logic: Supabase select()
```

---

## API Payload Examples

### Create Release - Feature with Cost
```json
{
  "title": "New AI Features",
  "lang": "ES",
  "month_label": "Febrero 2026",
  "month_date": "2026-02-01",
  "size": "md",
  "order_index": 1,
  "kb_url": "https://docs.example.com/ai-features",
  "media_path": "new-releases/2026/2/abc123.jpg",
  "media_type": "image",
  "bullets": ["Bullet 1", "Bullet 2"],
  "published": true,
  "release_type": "feature",
  "has_cost": true,
  "tenant": null,
  "group_id": null
}
```

### Create Release - Bug (forced has_cost)
```json
{
  "title": "Fixed Login Issue",
  "lang": "ES",
  "month_label": "Febrero 2026",
  "month_date": "2026-02-01",
  "size": "sm",
  "order_index": 2,
  "kb_url": "https://docs.example.com/bug-fix",
  "media_path": "new-releases/2026/2/def456.jpg",
  "media_type": "image",
  "bullets": ["Fixed auth token expiration"],
  "published": true,
  "release_type": "bug",
  "has_cost": false,
  "tenant": null,
  "group_id": "group-123"
}
```

### Update Release (all in group)
```json
{
  "title": "Updated Title",
  "bullets": ["Updated bullet"],
  "month_date": "2026-03-01",
  "size": "lg",
  "order_index": 1,
  "kb_url": "https://docs.example.com/updated",
  "published": true,
  "media_path": "new-releases/2026/3/xyz789.jpg",
  "media_type": "image",
  "release_type": "feature",
  "has_cost": true
}
```

---

## Error Handling Flow

```
User Action
    │
    ├─ Validation
    │  ├─ Title required? → toast.error()
    │  ├─ Media selected? → toast.error()
    │  └─ Month/Year? → toast.error()
    │
    ├─ Upload Media
    │  └─ Error? → toast.error() + cleanup
    │
    ├─ Insert/Update
    │  └─ Supabase Error?
    │     ├─ Delete media (if uploaded)
    │     └─ toast.error()
    │
    └─ Success
       ├─ toast.success()
       ├─ Reset form
       ├─ Close modal
       └─ Refresh table
```

---

## Testing Scenarios

```
Scenario 1: Create Feature with Cost
├─ Select: Type = Feature
├─ Action: Toggle has_cost = true
├─ Result: ✅ Badge "Con costo" appears in table

Scenario 2: Create Bug (Forced Cost)
├─ Select: Type = Bug
├─ Observe: has_cost toggle [DISABLED]
├─ Submit: has_cost = false (enforced)
├─ Result: ✅ No cost badge in table

Scenario 3: Change Type to Bug
├─ Select: Type = Feature, has_cost = true
├─ Change: Type = Bug
├─ Observe: has_cost = false, toggle [DISABLED]
├─ Result: ✅ Cost badge removed from table

Scenario 4: Edit Translation Group
├─ Open: Edit modal (ES tab, has_cost = true)
├─ Switch: To EN tab
├─ Observe: has_cost = true (persisted)
├─ Change: has_cost = false
├─ Submit: All translations updated
├─ Result: ✅ All 3 languages have has_cost = false

Scenario 5: Add Translation to Paid Feature
├─ Open: Edit modal for paid feature (has_cost = true)
├─ Click: Add Translation (EN)
├─ Submit: New translation
├─ Observe: has_cost = true (inherited)
├─ Result: ✅ New translation has same has_cost value
```

---

This diagram shows the complete architecture and flow of the has_cost feature implementation.
