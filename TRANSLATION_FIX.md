# Fix: Translation Form Implementation - Complete Changes

**Fecha:** 5 de Febrero de 2026  
**Versión:** 2.0  
**Archivo modificado:** `components/releases/edit-release-modal.tsx`

---

## 🐛 Problemas Resueltos

### 1. Error de HTML Nested Forms
**Problema:** Consola mostraba "In HTML, cannot be a descendant of" - error hidratación.

**Causa:** Había un `<form onSubmit={handleAddTranslation}>` anidado dentro del `<form onSubmit={handleSubmit}>` principal (línea ~377).

**Solución:** Reemplazado por `<div>` con inputs controlados y `<Button type="button">` para acciones.

### 2. UI Incompleto para Traducciones
**Problema:** El modal NO permitía ingresar title, bullets, month_label traducidos.

**Causa:** El form anterior solo tenía un dropdown de idioma, sin inputs reales.

**Solución:** Implementado panel completo con:
- Dropdown de idioma
- Input para title traducido
- Input para month label traducido
- Inputs para bullets traducidos (máx 5)
- Validaciones completas

---

## ✅ Cambios Implementados

### A. Estado de Draft de Traducción

**Agregado:**
```typescript
// Translation draft state
const [translationDraft, setTranslationDraft] = useState({
  title: "",
  monthLabel: "",
  bullets: [] as string[],
});
```

**Propósito:** Mantener estado del formulario de traducción sin afectar el release principal.

---

### B. Función Principal: `handleAddTranslation()`

**Antes:** Async, recibía `e: React.FormEvent`, usaba valores globales.

**Ahora:** Async, sin parámetro `e`, validaciones completas:

```typescript
const handleAddTranslation = async () => {
  // 1. Validación de título
  if (!translationDraft.title.trim()) {
    toast.error("Title is required");
    return;
  }

  // 2. Validación de bullets
  const filteredBullets = translationDraft.bullets.filter((b) => b.trim());
  if (filteredBullets.length === 0) {
    toast.error("At least 1 bullet point is required");
    return;
  }

  // 3. Verificar traducción duplicada
  if (translations.some((t) => t.lang === translationLang)) {
    toast.error(`Translation in ${translationLang} already exists`);
    return;
  }

  // 4. Verificar idioma diferente del original
  if (translationLang === lang) {
    toast.error("Translation language cannot be the same as original");
    return;
  }

  setLoading(true);

  try {
    // 5. Determinar group_id
    let groupIdToUse = release.group_id;

    // Si el original no tiene group_id, asignarlo
    if (!groupIdToUse) {
      const { error: updateError } = await supabase
        .from("new_releases")
        .update({ group_id: release.id })
        .eq("id", release.id);

      if (updateError) {
        toast.error(`Failed to set group: ${updateError.message}`);
        setLoading(false);
        return;
      }

      groupIdToUse = release.id;
    }

    // 6. Insertar traducción
    const { error: insertError } = await supabase
      .from("new_releases")
      .insert([
        {
          title: translationDraft.title,                    // Input traducido
          lang: translationLang,
          month_label: translationDraft.monthLabel,         // Input traducido
          size,                                              // Copiado del original
          order_index: parseInt(orderIndex),                // Copiado del original
          kb_url: kbUrl,                                    // Copiado del original
          image_path: release.image_path,                   // Copiado del original
          bullets: filteredBullets,                         // Inputs traducidos
          published: release.published,                     // Copiado del original
          tenant: release.tenant,                           // Copiado del original (puede ser NULL)
          group_id: groupIdToUse,                           // Mismo grupo
        },
      ]);

    if (insertError) {
      toast.error(`Failed to create translation: ${insertError.message}`);
      setLoading(false);
      return;
    }

    toast.success("Translation created successfully!");

    // 7. Limpiar draft
    setShowTranslationForm(false);
    setTranslationDraft({
      title: "",
      monthLabel: "",
      bullets: [],
    });
    setTranslationLang("EN");

    // 8. Refrescar listas
    fetchTranslations(groupIdToUse);
    onSuccess(); // Refrescar tabla

  } catch (err) {
    toast.error("An error occurred");
  } finally {
    setLoading(false);
  }
};
```

**Funcionalidades:**
- ✅ Validación de título requerido
- ✅ Validación de bullets (mín 1, máx 5)
- ✅ Prevenir traducciones duplicadas
- ✅ Prevenir mismo idioma que original
- ✅ Lógica de group_id: asignar si no existe
- ✅ Copiar propiedades correctamente
- ✅ Sonner toasts (éxito/error)
- ✅ Refrescar UI después de crear

---

### C. Funciones Helper para Draft

**Agregadas:**
```typescript
// Cambiar bullet individual
const handleTranslationBulletChange = (idx: number, value: string) => {
  const newBullets = [...translationDraft.bullets];
  newBullets[idx] = value;
  setTranslationDraft({ ...translationDraft, bullets: newBullets });
};

// Agregar bullet (máx 5)
const handleTranslationAddBullet = () => {
  if (translationDraft.bullets.length < 5) {
    setTranslationDraft({
      ...translationDraft,
      bullets: [...translationDraft.bullets, ""],
    });
  }
};

// Eliminar bullet
const handleTranslationRemoveBullet = (idx: number) => {
  setTranslationDraft({
    ...translationDraft,
    bullets: translationDraft.bullets.filter((_, i) => i !== idx),
  });
};

// Cancelar y limpiar
const handleCancelTranslation = () => {
  setShowTranslationForm(false);
  setTranslationDraft({
    title: "",
    monthLabel: "",
    bullets: [],
  });
  setTranslationLang("EN");
};
```

---

### D. UI: Reemplazo de Form Anidado

**Antes:**
```tsx
<form onSubmit={handleAddTranslation} className="...">
  {/* Solo dropdown de idioma */}
  {/* Solo 1 botón de submit */}
</form>
```

**Ahora:**
```tsx
{/* Translation form - NO NESTED FORM, just div with inputs */}
{showTranslationForm && getAvailableLanguages().length > 0 && (
  <div className="space-y-3 p-3 rounded border border-slate-200 bg-slate-50">
    
    {/* Language Selection */}
    <div className="space-y-2">
      <Label className="text-sm font-medium">Language</Label>
      <Select value={translationLang} onValueChange={...}>
        {/* Opciones disponibles */}
      </Select>
    </div>

    {/* Title Input */}
    <div className="space-y-2">
      <Label className="text-sm font-medium">Title</Label>
      <Input
        placeholder="Enter title in target language"
        value={translationDraft.title}
        onChange={(e) => setTranslationDraft({ ...translationDraft, title: e.target.value })}
        disabled={loading}
      />
    </div>

    {/* Month Label Input */}
    <div className="space-y-2">
      <Label className="text-sm font-medium">Month Label (optional)</Label>
      <Input
        placeholder="e.g., Feb 2026"
        value={translationDraft.monthLabel}
        onChange={(e) => setTranslationDraft({ ...translationDraft, monthLabel: e.target.value })}
        disabled={loading}
      />
    </div>

    {/* Bullets - Misma UX que el modal de creación */}
    <div className="space-y-2">
      <Label className="text-sm font-medium">Highlights</Label>
      <div className="space-y-2">
        {translationDraft.bullets.map((bullet, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              placeholder={`Bullet ${idx + 1}`}
              value={bullet}
              onChange={(e) => handleTranslationBulletChange(idx, e.target.value)}
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleTranslationRemoveBullet(idx)}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      {translationDraft.bullets.length < 5 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTranslationAddBullet}
          disabled={loading}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add highlight
        </Button>
      )}
    </div>

    {/* Info text */}
    <p className="text-xs text-slate-500">
      The image, size, KB URL, and other properties will be copied from the original release.
    </p>

    {/* Action Buttons - type="button" para evitar form submit */}
    <div className="flex gap-2 justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCancelTranslation}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={handleAddTranslation}
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Translation"}
      </Button>
    </div>
  </div>
)}
```

**Cambios clave:**
- ✅ `<div>` en lugar de `<form>`
- ✅ Inputs para title, month label, bullets
- ✅ Buttons con `type="button"` (no triggeran form principal)
- ✅ Llamadas a handlers de translation específicos
- ✅ Texto descriptivo sobre qué se copia

---

### E. Listado de Traducciones Existentes

**Agregado:**
```tsx
{translations.length > 0 && (
  <div className="space-y-2">
    <p className="text-xs text-slate-500">Existing translations:</p>
    {translations.map((trans) => (
      <div key={trans.id} className="flex items-center justify-between p-2 rounded border...">
        <span className="text-sm font-medium text-slate-700">{trans.lang}</span>
        <Badge variant={trans.published ? "default" : "secondary"}>
          {trans.published ? "Published" : "Paused"}
        </Badge>
      </div>
    ))}
  </div>
)}
```

**Propósito:** Mostrar claramente qué traducciones ya existen.

---

## 🔄 Flujo de Trabajo

### Crear Traducción:
1. Click "Add Translation" en el modal edit
2. Seleccionar idioma disponible (EN o PT)
3. Ingresar title en idioma destino
4. Ingresar month label (opcional)
5. Agregar bullets traducidos (1-5)
6. Click "Create Translation"
7. Sistema:
   - Valida todos los campos
   - Asigna group_id al original si no lo tiene
   - Inserta nueva fila en DB con mismo group_id
   - Copia: image_path, size, kb_url, order_index, published, tenant
   - Muestra toast éxito
   - Limpia draft
   - Refrescha tabla

---

## 📊 Validaciones Implementadas

| Validación | Acción | Toast |
|-----------|--------|-------|
| Title vacío | Detener | "Title is required" |
| Cero bullets | Detener | "At least 1 bullet point is required" |
| Idioma duplicado | Detener | "Translation in {LANG} already exists" |
| Mismo idioma | Detener | "Translation language cannot be the same as original" |
| Error DB | Detener | Error real de Supabase |
| Success | Proceder | "Translation created successfully!" |

---

## 🔍 Supabase Logic

### Insert Record:
```typescript
{
  title: translationDraft.title,              // Traducido
  lang: translationLang,                      // EN o PT
  month_label: translationDraft.monthLabel,   // Traducido
  size: release.size,                         // Copiado
  order_index: parseInt(orderIndex),          // Copiado
  kb_url: release.kb_url,                     // Copiado
  image_path: release.image_path,             // Copiado
  bullets: filteredBullets,                   // Traducido
  published: release.published,               // Copiado
  tenant: release.tenant,                     // Copiado (NULL ok)
  group_id: groupIdToUse,                     // Mismo grupo
}
```

### Update group_id (si necesario):
```typescript
// Si original no tiene group_id
update new_releases 
set group_id = {original.id} 
where id = {original.id}
```

---

## 🎨 UX/UI Improvements

✅ **Eliminado error de nested forms** - Consola limpia  
✅ **Inputs reales para traducción** - Usuario puede escribir título y bullets  
✅ **Validaciones claras** - Mensajes de error específicos  
✅ **UI consistente** - Bullets con mismo patrón que create modal  
✅ **Listado de existentes** - Muestra qué traducciones ya existen  
✅ **Toasts Sonner** - Éxito/error comunicados claramente  
✅ **Refresho automático** - Tabla se actualiza después de crear

---

## 🧪 Testing Recomendado

### Caso 1: Crear Traducción en Release sin group_id
1. Crear ES release (obtendrá group_id = id)
2. Click Edit
3. Click "Add Translation"
4. Seleccionar EN
5. Ingresar datos traducidos
6. Verificar: se crea fila con mismo group_id ✓

### Caso 2: Crear Segunda Traducción
1. Misma release, click "Add Translation"
2. Seleccionar PT
3. Ingresar datos
4. Verificar: se crea con mismo group_id ✓

### Caso 3: Validaciones
1. Sin título - error toast ✓
2. Sin bullets - error toast ✓
3. Mismo idioma - error toast ✓
4. Idioma duplicado - error toast ✓

### Caso 4: UI Update
1. Después de crear - vuelve a lista vacía ✓
2. Tabla refrescada - nueva fila aparece ✓
3. Modal puede cerrarse sin problemas ✓

---

## 📝 Notas Técnicas

- **Sin form anidado:** Solo 1 `<form>` principal, traducción usa `<div>`
- **Inputs reales:** Los bullets translation son inputs reales, no fake
- **Group ID logic:** Auto-asigna si original no tiene
- **Copiar propiedades:** image_path, size, kb_url, order_index, published, tenant
- **Tenant nullable:** Copia el valor actual (puede ser NULL)
- **Sonner:** Toasts soft green/red según especificación
- **Refresho:** `onSuccess()` actualiza tabla parent

---

**✅ IMPLEMENTACIÓN COMPLETADA**

Todos los requisitos técnicos cumplidos. Modal sin errores, flujo completo de traducción con inputs reales.
