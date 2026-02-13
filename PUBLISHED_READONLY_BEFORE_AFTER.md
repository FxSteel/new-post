# Published Field - Before & After Comparison

## UI Cambios - Tabla

### ANTES
```
┌─────────────────────────────────┐
│ Order │ Month │ Lang │ Status ⬅ │
├─────────────────────────────────┤
│ 1     │ Feb   │ ES   │ Published│ ← Dropdown editable
│ 2     │ Jan   │ ES   │ Paused   │ ← Dropdown editable
│ 3     │ Dec   │ EN   │ Published│ ← Dropdown editable
└─────────────────────────────────┘
```

### AHORA
```
┌─────────────────────────────────┐
│ Order │ Month │ Lang │ Status   │
├─────────────────────────────────┤
│ 1     │ Feb   │ ES   │ [Publicado] │ ← Badge (read-only, green)
│ 2     │ Jan   │ ES   │ [Oculto]    │ ← Badge (read-only, blue)
│ 3     │ Dec   │ EN   │ [Publicado] │ ← Badge (read-only, green)
└─────────────────────────────────┘
```

---

## Create Release Modal - Status Field

### ANTES
```
┌─────────────────────────────────┐
│ Status                          │
├─────────────────────────────────┤
│  [Select ▼]                     │
│  ├─ Published                   │
│  └─ Paused (disabled)           │
└─────────────────────────────────┘
```

### AHORA
```
┌─────────────────────────────────┐
│ Status                          │
├─────────────────────────────────┤
│  [Publicado]                    │
│  Los nuevos releases se crean   │
│  como publicados                │
└─────────────────────────────────┘
```

**Resultado**: Todos los nuevos releases se crean con `published: true`

---

## Edit Release Modal - Status Field

### ANTES
```
Shared Settings
├─ Status
│  └─ [Select ▼]
│     ├─ Published ← Usuario podía seleccionar
│     └─ Paused    ← Usuario podía cambiar a esto
```

### AHORA
```
Shared Settings
├─ Status
│  └─ [Publicado]  ← Badge read-only
│     published solo se controla fuera del admin
│     (super admin/otra capa)
```

**Resultado**: El campo Status es ahora solo información, no se puede cambiar desde Admin

---

## Payloads - Cambios Técnicos

### Create Release - Insert Payload

**ANTES:**
```typescript
insert({
  title,
  lang,
  media_path,
  bullets,
  published: status === "published", // ❌ Variable basada en dropdown
  release_type,
  // ... otros campos
})
```

**AHORA:**
```typescript
insert({
  title,
  lang,
  media_path,
  bullets,
  published: true, // ✅ Siempre true (forzado)
  release_type,
  // ... otros campos
})
```

---

### Edit Release - Update Payload

**ANTES:**
```typescript
update({
  title,
  bullets,
  media_path,
  size,
  order_index,
  kb_url,
  published: status === "published", // ❌ Incluía published
  release_type,
  has_cost,
})
```

**AHORA:**
```typescript
update({
  title,
  bullets,
  media_path,
  size,
  order_index,
  kb_url,
  // ✅ NO incluye published
  release_type,
  has_cost,
})
```

---

### Add Translation - Payload

**ANTES:**
```typescript
insert({
  title,
  lang,
  bullets,
  published: status === "published", // ❌ Basado en dropdown del modal
  release_type,
  has_cost,
  group_id,
})
```

**AHORA:**
```typescript
insert({
  title,
  lang,
  bullets,
  published: groupRows[0]?.published || false, // ✅ Hereda del grupo
  release_type,
  has_cost,
  group_id,
})
```

---

## Filtro de Status - Labels

### ANTES
```
Status Filter:
├─ All Status
├─ Published  ← Label en inglés
└─ Paused     ← Confuso (no es estado actual, es "oculto")
```

### AHORA
```
Status Filter:
├─ All Status
├─ Publicado  ← Label en español
└─ Oculto     ← Claramente indica "no visible"
```

---

## Badge Styles

### Status Badge Colors

| Estado | Color Antes | Color Ahora |
|--------|------------|------------|
| Published | green | green |
| Paused/Oculto | slate (gray) | blue |

**Visual Change:**
```
ANTES: [Published] (green) [Paused] (gray)
AHORA: [Publicado] (green) [Oculto] (blue)
```

---

## Database Impact

### ❌ NO Changes to DB
- Tabla `new_releases` sin cambios
- Columna `published` sin cambios
- RLS policies sin cambios
- Existing data sin cambios

### ✅ Query Impact
```
Antes:
SELECT * FROM new_releases
  WHERE published = true  ← Admin solo veía publicados
  
Ahora:
SELECT * FROM new_releases
  ← Admin ve todos (RLS permite, policy admin)
```

---

## Flow Diagrams

### Create Release Flow

**ANTES:**
```
User opens Modal
  → Can choose Status (Published/Paused)
  → Submit with chosen status
  → INSERT published = (true/false)
  → May create "hidden" release
```

**AHORA:**
```
User opens Modal
  → Status always shows "Publicado"
  → Cannot change it
  → Submit
  → INSERT published = true (hardcoded)
  → Always creates "visible" release
```

---

### Edit Release Flow

**ANTES:**
```
User opens Edit Modal
  → Current status shown in dropdown
  → Can change to different status
  → Submit
  → UPDATE published = (new choice)
  → May hide/show release
```

**AHORA:**
```
User opens Edit Modal
  → Current status shown as read-only badge
  → Cannot change it
  → Edit other fields (title, media, etc.)
  → Submit
  → UPDATE (no published field)
  → Status unchanged
  → Change must go through other channel
```

---

### Table Filter Flow

**ANTES:**
```
User selects "Paused" in filter
  → Table shows only published=false
  → This is just filtering
  → No DB changes
```

**AHORA:**
```
User selects "Oculto" in filter
  → Table shows only published=false
  → This is just filtering (visual only)
  → No DB changes
  → User cannot modify from modal
```

---

## State Variables Changes

### Create Release Modal

**ANTES:**
```typescript
const [status, setStatus] = useState("published"); // ❌ Removido
const [releaseType, setReleaseType] = useState<"feature" | "bug">("feature");
```

**AHORA:**
```typescript
// status removed ✅
const [releaseType, setReleaseType] = useState<"feature" | "bug">("feature");
```

### Edit Release Modal

**ANTES:**
```typescript
const [status, setStatus] = useState("published"); // ✅ Mantiene para lectura
```

**AHORA:**
```typescript
const [status, setStatus] = useState("published"); // ✅ Mantiene para mostrar estado
```

---

## Summary Table

| Aspecto | Antes | Ahora |
|--------|-------|-------|
| **Create - Status field** | Dropdown editable | Badge read-only |
| **Create - published valor** | Basado en dropdown | Siempre true |
| **Edit - Status field** | Dropdown editable | Badge read-only |
| **Edit - Update payload** | Incluye published | NO incluye published |
| **Add Translation** | Basado en dropdown | Hereda del grupo |
| **Table - Status column** | Dropdown editable | Badge read-only |
| **Filtro Status** | Published/Paused | Publicado/Oculto |
| **published en DB** | Puede cambiar | Inmutable desde Admin |

---

## Comportamiento Resultante

✅ **Admin puede:**
- Ver todos los releases (publicados y ocultos)
- Crear nuevos releases (siempre publicados)
- Editar título, media, bullets, tipo, costo, etc.
- Agregar traducciones
- Ver estado actual (Publicado/Oculto) como información

❌ **Admin NO puede:**
- Cambiar de publicado a oculto
- Cambiar de oculto a publicado
- Modificar campo `published` en ningún modal
- El campo está protegido en UI y payload

✅ **Para cambiar published:**
- Super admin API
- Direct DB
- CLI tool
- Supabase RPC function
- (Fuera del admin panel)
