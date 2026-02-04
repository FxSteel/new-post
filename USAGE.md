# Guía de Uso - New Releases Admin

## Acceso y Login

1. Navega a `http://localhost:3000` (desarrollo) o la URL de tu deploy
2. Ingresa credenciales de admin (usuario debe existir en tabla `new_releases_admins`)
3. Se validará automáticamente que seas admin
4. Si no eres admin, verás mensaje "Not authorized"

## Panel Principal (/admin)

### Header
- **New Releases Admin** - Título de la aplicación
- **+ New release** - Botón para crear nuevo release
- **Logout** - Cerrar sesión

### Data Table

#### Buscar y Filtrar
- Campo de búsqueda filtra por:
  - Título del release
  - Etiqueta del mes
- Búsqueda en tiempo real

#### Columnas (configurables)
1. **Order** - Número de orden del release
2. **Month** - Etiqueta del mes (ej: "Nov 2025")
3. **Lang** - Idioma (ES/EN/PT/BR)
4. **Status** - Badge con estado
   - Published (verde) = visible en iframe
   - Paused (gris) = no visible
5. **Preview** - Botón ojo para ver preview
6. **Last updated** - Fecha/hora de última actualización
7. **Actions** - Menú de opciones (Edit, Delete)

#### Acciones

**Selección múltiple:**
- Checkbox individual: selecciona un release
- Checkbox header: selecciona todos en página
- Cuando hay selecciones: botón "Delete (X)" elimina todas

**Columnas:**
- Click en "Columns" dropdown
- Toggle columnas con checkboxes
- Configuración se guarda en sesión

**Editar (menu Actions):**
- Click en icono 3 puntos
- Select "Edit"
- Se abre modal con todos los campos
- Cambios se guardan inmediatamente

**Preview:**
- Click en icono ojo
- Ver modal con release completo:
  - Imagen con ratio 1400:732
  - Título y mes
  - Bullets/highlights
  - Estado y tamaño
  - URL de KB

**Eliminar:**
- Opción "Delete" en menu Actions (individual)
- O checkbox + botón "Delete (X)" (múltiple)
- Confirmación con AlertDialog
- Se elimina: registro DB + imagen de storage

## Crear Release

Click "+ New release" abre modal con campos:

### Campos disponibles

**Título** (requerido)
- Campo de texto libre
- Placeholder: "Enter text"

**Language** (requerido)
- Dropdown con opciones: ES, EN, PT/BR

**Image** (requerido)
- Botón "Choose file"
- Acepta: jpg, png, webp, etc
- Preview se muestra automáticamente
- Ratio mostrado: 1400x732 (se respeta en preview)
- Modal NO se cierra al seleccionar imagen

**Highlights** (opcional, máx 5)
- Lista dinámica de bullets
- Botón "+ Add highlight" agrega un campo
- X rojo al lado elimina ese bullet
- Se pueden agregar hasta 5

**Order Index** (requerido)
- Campo numérico
- Determina el orden en la tabla

**Size** (requerido)
- Dropdown: Small, Medium, Large

**KB URL** (opcional)
- Campo URL
- Link visible en preview

**Status** (requerido)
- Dropdown: Published, Paused
- Paused está deshabilitado por ahora
- Published = visible en iframe (published: true en DB)

**Month Label** (opcional)
- Campo de texto
- Ej: "Nov 2025"

### Guardar
- Click "Create Release"
- Valida campos requeridos
- Sube imagen a storage (path: `cards/<uuid>.<ext>`)
- Guarda record en `new_releases`
- Toast verde "Release created successfully!"
- Modal se cierra automáticamente
- Tabla se refresca

## Editar Release

Click menu Actions → "Edit" en un release

### Diferencias vs Crear
- NO se puede cambiar imagen (solo editar metadatos)
- Mismos campos disponibles
- "Paused" sigue deshabilitado
- Click "Save Changes"
- Toast verde de éxito
- Modal se cierra
- Tabla se refresca

## Eliminar Releases

### Opción 1: Individual
1. Abre menu Actions (3 puntos)
2. Click "Delete"
3. Confirmación AlertDialog
4. Click "Delete" en dialog
5. Se elimina record + imagen
6. Toast verde de éxito

### Opción 2: Múltiple
1. Selecciona varios con checkboxes
2. Click "Delete (3)" (o cantidad)
3. Confirmación AlertDialog
4. Click "Delete"
5. Se eliminan todos + imágenes
6. Checkboxes se limpian
7. Toast verde de éxito

## Toasts (Notificaciones)

**Verde (éxito):**
- Release creado
- Release actualizado
- Release(s) eliminado(s)

**Rojo (error):**
- Falta título
- Falta imagen
- Error de upload
- Error de BD
- Mensaje específico del error

Se muestran en top-center de la pantalla por 5 segundos

## Validaciones

### Al crear/editar:
- Título no puede estar vacío
- Imagen requerida (solo al crear)
- Order index debe ser número
- URL debe ser válida si se ingresa

### Al eliminar:
- AlertDialog solicita confirmación
- Uno o múltiples según selección

### Errores de BD:
- Se muestran con toast rojo
- Mensaje específico del error Supabase

## Características técnicas

### Storage
- Bucket: `new-releases`
- Path: `cards/<uuid>.<extension>`
- Imagen tiene ratio 1400:732
- Object-cover: se recorta al centro

### Campos en BD
Tabla `new_releases`:
```sql
id (uuid)
tenant (text, nullable) → siempre null
lang (text) → ES | EN | PT/BR
title (text)
month_label (text)
size (text) → sm | md | lg
image_path (text)
bullets (jsonb) → array de strings
kb_url (text)
order_index (int4)
published (bool)
created_at, updated_at
```

### Autenticación
- Supabase Auth (email/password)
- Validación contra `new_releases_admins`
- Session-based
- Auto redirect si no admin

## Tips y trucos

1. **Búsqueda rápida:** Empieza a escribir en el campo Search
2. **Ocultar columnas:** Usa el dropdown "Columns" para personalizar vista
3. **Múltiples eliminaciones:** Selecciona con checkbox + delete es más rápido
4. **Preview antes de guardar:** Crea el release, luego preview para verificar
5. **Copiar releases:** No hay función clone, pero puedes crear similar
