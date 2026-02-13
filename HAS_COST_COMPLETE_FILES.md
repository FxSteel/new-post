# Complete Updated Files - Has Cost Implementation

## File 1: types/new-release.ts
```typescript
export interface NewRelease {
  id: string;
  group_id: string | null;
  tenant: string | null;
  lang: "ES" | "EN" | "PT";
  title: string;
  month_label: string;
  month_date?: string; // Date string YYYY-MM-01
  size: "sm" | "md" | "lg";
  media_path: string | null;
  media_type: "image" | "video" | null;
  image_path?: string; // deprecated, kept for compatibility
  bullets: string[];
  kb_url: string;
  order_index: number;
  published: boolean;
  release_type: "feature" | "bug";
  has_cost: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewReleaseAdmin {
  id: string;
  user_id: string;
  created_at: string;
}
```

---

## File 2: components/ui/switch.tsx (NEW)
```tsx
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

---

## File 3: components/releases/create-release-modal.tsx
See the actual file at `/Users/fer/Desktop/new-post/components/releases/create-release-modal.tsx`

### Key Sections Changed:
1. Import Switch component (line 18)
2. Add hasCost state (line 50)
3. Add release type handler with auto-disable (lines 380-390)
4. Add has_cost field UI (lines 393-407)
5. Update insert payload (line 160)
6. Reset form includes hasCost (line 208)

---

## File 4: components/releases/edit-release-modal.tsx
See the actual file at `/Users/fer/Desktop/new-post/components/releases/edit-release-modal.tsx`

### Key Sections Changed:
1. Import Switch component (line 30)
2. Add tabHasCost state (line 62)
3. Update loadTabData (line 152)
4. Update release type handler with auto-disable (lines 744-754)
5. Add has_cost field UI in TabsContent (lines 765-782)
6. Update updatePromises payload (line 329)
7. Update addTranslation payload (line 428)

---

## File 5: components/releases/releases-table.tsx
See the actual file at `/Users/fer/Desktop/new-post/components/releases/releases-table.tsx`

### Key Section Changed:
1. Update type column rendering (lines 445-472) to include "Con costo" badge

---

## Summary of Changes

| File | Changes | Type |
|------|---------|------|
| `types/new-release.ts` | Added `has_cost: boolean` field | Type Definition |
| `components/ui/switch.tsx` | New Switch component file | New Component |
| `components/releases/create-release-modal.tsx` | 6 changes including import, state, handlers, UI, payload | Feature Addition |
| `components/releases/edit-release-modal.tsx` | 7 changes including import, state, handlers, UI, payloads | Feature Addition |
| `components/releases/releases-table.tsx` | 1 change to show cost badge | UI Enhancement |

## Total Lines Changed:
- ~500 new lines (Switch component)
- ~30 new state/logic lines
- ~25 new UI lines
- ~10 payload changes
- Total: ~565 net new meaningful lines

## Testing Command
```bash
npm run dev
# Navigate to http://localhost:3000/admin
# Test Create/Edit/Table functionality
```

## Deploy Checklist
- [ ] Run `npm run build` to verify no TypeScript errors
- [ ] Test Create Release with Feature type and toggle has_cost
- [ ] Test Create Release with Bug type (has_cost should be disabled)
- [ ] Test Edit Release and modify has_cost value
- [ ] Test switching tabs in Edit modal (has_cost value should persist)
- [ ] Verify "Con costo" badge appears only for paid Features
- [ ] Test Add Translation to a Feature release (should inherit has_cost)
