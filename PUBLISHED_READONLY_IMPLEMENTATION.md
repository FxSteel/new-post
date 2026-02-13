# Published Field - Read-Only Implementation Summary

## Objetivo Alcanzado ✅

Implementar el control de `published` como **solo lectura** en el Admin panel. El campo ahora solo se puede modificar desde capas administrativas superiores, no desde la UI del Admin panel.

---

## Cambios Realizados

### 1. **components/releases/releases-table.tsx**
**Cambios:**
- Status column: Reemplazado el color de "Oculto" de `slate` a `blue`
  - `Publicado` (published=true) → soft green pill
  - `Oculto` (published=false) → soft blue pill
- Filtro de Status: Actualizado labels
  - `Published` → `Publicado`
  - `Paused` → `Oculto`
- El filtro sigue siendo **solo visual** (no dispara updates a DB)

**Resultado:**
```tsx
{group.principalRow.published ? "Publicado" : "Oculto"}
// Colors:
// Publicado: bg-green-100 text-green-900 border border-green-200
// Oculto:   bg-blue-100 text-blue-900 border border-blue-200
```

---

### 2. **components/releases/create-release-modal.tsx**
**Cambios:**
- ✅ Removido: Campo Status editable (Select dropdown)
- ✅ Reemplazado por: Badge read-only mostrando "Publicado" siempre
- ✅ Actualizado: Payload insert fuerza `published: true`
- ✅ Removido: Variable `status` del state
- ✅ Agregado: Import de Badge component

**Status field (antes - dropdown editable):**
```tsx
// ANTES
<Select value={status} onValueChange={setStatus}>
  <SelectItem value="published">Published</SelectItem>
  <SelectItem value="paused" disabled>Paused</SelectItem>
</Select>

// AHORA
<Badge className="bg-green-100 text-green-900 border border-green-200 w-fit">
  Publicado
</Badge>
<p className="text-xs text-slate-500 mt-1">
  Los nuevos releases se crean como publicados
</p>
```

**Payload insert:**
```tsx
// ANTES
published: status === "published",

// AHORA
published: true,
```

---

### 3. **components/releases/edit-release-modal.tsx**
**Cambios:**
- ✅ Removido: Campo Status editable (Select dropdown)
- ✅ Reemplazado por: Badge read-only mostrando estado actual
- ✅ Actualizado: Payload update NO incluye `published`
- ✅ Actualizado: Add Translation hereda `published` del grupo

**Status field (antes - dropdown editable):**
```tsx
// ANTES
<Select value={status} onValueChange={setStatus}>
  <SelectItem value="published">Published</SelectItem>
  <SelectItem value="paused">Paused</SelectItem>
</Select>

// AHORA
<Badge className={status === "published" ? "bg-green-100..." : "bg-blue-100..."}>
  {status === "published" ? "Publicado" : "Oculto"}
</Badge>
<p className="text-xs text-slate-500 mt-1">
  published solo se controla fuera del admin (super admin/otra capa)
</p>
```

**Payload update (antes):**
```tsx
.update({
  title: row.title,
  bullets: row.bullets,
  published: status === "published", // ❌ REMOVIDO
  // ... other fields
})
```

**Payload update (ahora):**
```tsx
.update({
  title: row.title,
  bullets: row.bullets,
  // NO incluye published ✅
  // ... other fields
})
```

**Add Translation (hereda published):**
```tsx
// ANTES
published: status === "published",

// AHORA
published: groupRows[0]?.published || false,
```

---

## Flujo de Datos

### Create Release
```
Admin abre modal
  ↓
Llena campos (sin opción Status)
  ↓
Hace click Submit
  ↓
Payload: published: true (forzado)
  ↓
Insert a DB
  ↓
Nuevo release se crea siempre como "Publicado"
```

### Edit Release
```
Admin abre modal
  ↓
Ve Status como badge read-only (Publicado/Oculto)
  ↓
Edita título, bullets, media, etc.
  ↓
Payload NO incluye published
  ↓
Update a DB sin cambiar estado publicado
  ↓
Estado `published` se mantiene igual
```

### View & Filter
```
Tabla muestra todos los releases
  ├─ Publicado (green badge)
  └─ Oculto (blue badge)
  
Filtro Status:
  ├─ All Status → muestra todos
  ├─ Publicado → muestra solo published=true
  └─ Oculto → muestra solo published=false
  
(Filtro es SOLO visual, no dispara updates)
```

---

## Impacto en RLS & Auth

✅ **Sin cambios en RLS**
- Existing policy para admins sigue siendo válida
- Admin sigue pudiendo ver todos los releases (incluidos published=false)
- Admin sigue pudiendo editar campos permitidos

✅ **published ahora es inmutable desde Admin UI**
- No se pueden hacer UPDATE a `published` desde Admin
- Solo se puede cambiar en capas superiores (super admin API, CLI, etc.)

✅ **Iframe público sigue igual**
- Policy de iframe: SELECT WHERE published=true
- No se modifica

---

## Resumen de Cambios por Archivo

| Archivo | Cambios | Impacto |
|---------|---------|--------|
| `releases-table.tsx` | Status labels + colors | UI: Publicado/Oculto (blue para oculto) |
| `create-release-modal.tsx` | Badge read-only + published:true | Create siempre publicado |
| `edit-release-modal.tsx` | Badge read-only + sin published en payload | Edit no puede cambiar estado |

---

## Validación Post-Deployment

- [ ] Admin puede ver releases con published=false en la tabla
- [ ] Crear nuevo release → siempre published=true
- [ ] Editar release → Status muestra como badge, no editable
- [ ] Cambiar filtro Status → solo afecta UI, no DB
- [ ] Editar release con published=false → no cambia a published
- [ ] Agregar traducción → hereda published del grupo
- [ ] Iframe público → solo ve published=true
- [ ] No hay errores RLS al editar published=false

---

## Notas de Implementación

### ✅ Design Decision: Por qué `published` es inmutable

1. **Separación de preocupaciones**: Control editorial vs control de visibilidad
2. **Seguridad**: No queremos que cambios accidentales causen cambios de visibilidad
3. **Auditoria**: Cambios de `published` quedan fuera del Admin audit trail
4. **Flujo editorial**: Permite un flujo de aprobación separado (draft → review → publish)

### ✅ Para cambiar `published` desde afuera:
- **Super admin CLI**: Direct DB update
- **Admin API endpoint**: POST /api/admin/release/{id}/publish
- **Supabase RPC function**: Call function that handles publish logic

---

## Files Modified

1. ✅ `components/releases/releases-table.tsx`
2. ✅ `components/releases/create-release-modal.tsx`
3. ✅ `components/releases/edit-release-modal.tsx`

**Total changes**: ~15 logical changes
**Breaking changes**: None (backward compatible)
**Database changes**: None (column untouched)
**RLS changes**: None (policies unchanged)
