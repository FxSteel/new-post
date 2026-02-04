# Documentación Técnica

## Estructura General

### Architecture
- **Frontend:** Next.js 16 (App Router)
- **UI Framework:** shadcn/ui + Tailwind CSS v4
- **Backend:** Supabase (Auth + Database + Storage)
- **Notifications:** Sonner
- **Language:** TypeScript

### Stack de dependencias principales
```json
{
  "next": "16.1.6",
  "react": "^19.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "sonner": "latest",
  "tailwindcss": "^4.0.0",
  "lucide-react": "latest"
}
```

## Estructura de carpetas

```
new-post/
├── app/
│   ├── admin/
│   │   └── page.tsx                    # Página principal del admin (client component)
│   ├── page.tsx                        # Página de login (client component)
│   ├── layout.tsx                      # Layout raíz con Toaster
│   └── globals.css                     # Estilos globales con Tailwind
│
├── components/
│   ├── ui/                             # Componentes shadcn (generados)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── table.tsx
│   │   ├── checkbox.tsx
│   │   ├── badge.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── form.tsx
│   │   └── utils.ts
│   │
│   └── releases/                       # Componentes de releases
│       ├── releases-table.tsx          # Data table con todas las funcionalidades
│       ├── create-release-modal.tsx    # Modal para crear nuevo release
│       ├── edit-release-modal.tsx      # Modal para editar release
│       ├── preview-release-modal.tsx   # Modal para ver preview
│       └── release-image.tsx           # Componente de imagen con ratio fijo
│
├── lib/
│   ├── supabase/
│   │   └── client.ts                   # Cliente Supabase inicializado
│   ├── format.ts                       # Funciones de formato (fechas)
│   └── utils.ts                        # Utilidades de clases (cn)
│
├── types/
│   └── new-release.ts                  # Interfaces TypeScript
│
├── .env.local                          # Variables de entorno
├── tailwind.config.ts                  # Configuración Tailwind
├── tsconfig.json                       # Configuración TypeScript
├── next.config.ts                      # Configuración Next.js
└── package.json
```

## Flujo de autenticación

```
Usuario ingresa credenciales
    ↓
supabase.auth.signInWithPassword()
    ↓
¿Session válida?
    ├─ No → Mostrar error toast → Quedarse en login
    └─ Sí → Consultar new_releases_admins por user_id
        ├─ No es admin → Sign out → Redirect a login
        └─ Es admin → Redirect /admin → Mostrar panel
```

## Flow de crear release

```
Click "+ New release"
    ↓
Modal se abre con formulario vacío
    ↓
Usuario completa campos
    ↓
Click "Create Release"
    ↓
Validar:
  - Título no vacío
  - Imagen seleccionada
  - Fields requeridos
    ↓
Upload imagen a storage → fileName = cards/{uuid}.{ext}
    ↓
INSERT new_releases con:
  - image_path = fileName
  - published = (status === 'published')
  - tenant = null
  - bullets = array filtrado
    ↓
Success toast
    ↓
Modal cierra
    ↓
Tabla se refresca (fetchReleases())
```

## Componentes principales

### ReleasesTable
**Responsabilidades:**
- Mostrar datos en formato tabla
- Buscar/filtrar
- Seleccionar múltiples
- Toggle de columnas
- Acciones (edit, delete, preview)
- Dialog de confirmación para delete

**Props:**
```typescript
interface ReleasesTableProps {
  releases: NewRelease[]
  onEdit: (release: NewRelease) => void
  onPreview: (release: NewRelease) => void
  onRefresh: () => void
}
```

**State:**
- `search`: string (filtro)
- `selectedIds`: Set<string> (seleccionados)
- `visibleColumns`: boolean flags por columna
- `deleteDialogOpen`: modal abierto?
- `deleteTarget`: id o "multiple"
- `deleting`: loading state

### CreateReleaseModal
**Responsabilidades:**
- Formulario para crear release
- Upload de imagen
- Manejo de bullets dinámico
- Validación
- Submit a BD

**Props:**
```typescript
interface CreateReleaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}
```

### EditReleaseModal
**Igual que CreateReleaseModal pero:**
- Carga datos del release al abrir
- No permite cambiar imagen
- UPDATE en lugar de INSERT

### PreviewReleaseModal
**Responsabilidades:**
- Mostrar preview del release
- Usar ReleaseImage para imagen
- Mostrar bullets, título, status

### ReleaseImage
**Responsabilidades:**
- Obtener URL pública de imagen
- Mostrar con ratio 1400:732
- Loading state
- Componente reutilizable

```typescript
interface ReleaseImageProps {
  imagePath: string
}
```

## Flujos de datos (Data flow)

### Cargar releases
```
useEffect en /admin
    ↓
checkAuth() → validar sesión y admin
    ↓
fetchReleases()
    ↓
supabase.from("new_releases").select()
    ↓
setReleases(data)
    ↓
Renderizar tabla
```

### Crear release
```
Submit form
    ↓
Upload image → supabase.storage.upload()
    ↓
Insert row → supabase.from("new_releases").insert()
    ↓
onSuccess() → onRefresh()
    ↓
fetchReleases() nuevamente
    ↓
Tabla actualizada
```

### Editar release
```
Submit form
    ↓
UPDATE → supabase.from("new_releases").update()
    ↓
onSuccess() → onRefresh()
    ↓
fetchReleases() nuevamente
    ↓
Tabla actualizada
```

### Eliminar release
```
Confirmar en dialog
    ↓
Para cada id:
  - DELETE de storage (imagen)
  - DELETE de new_releases
    ↓
setSelectedIds = []
    ↓
onRefresh()
    ↓
fetchReleases()
    ↓
Tabla actualizada
```

## Manejo de errores

### Try/catch blocks
- Todos los llamados a Supabase están envueltos
- Capturan y muestran toast rojo con mensaje

### Validaciones
- Campos requeridos en formularios
- Tipos TypeScript previenen runtime errors
- RLS policies en Supabase validan en BD

### Error messages
```typescript
toast.error(error.message)  // Error específico de Supabase
toast.error("Failed to...")  // Error genérico
```

## Seguridad

### Authentication
- No guardar credentials en localStorage
- Supabase maneja session cookies
- JWT tokens validados por Supabase

### Authorization
- Check admin en servidor (checkAuth)
- RLS policies en BD validar accesos
- Solo leer/escribir própios releases

### Storage
- Archivos en bucket protected
- Paths con UUIDs previenen colisiones
- Public URLs pero sin acceso escritura directo

## Performance

### Optimizaciones
- Client components solo donde necesario
- Búsqueda local (no en BD) en tabla
- Imágenes con lazy loading
- Next.js automatic code splitting

### Consideraciones
- Tabla puede tener muchas filas (implementar paginación si necesario)
- Modal overflow-y para formularios largos
- Debounce en búsqueda si dataset muy grande

## Styling

### Tailwind v4
- Variables CSS automáticas
- Color palette estándar
- Responsive con breakpoints
- Clases utilitarias

### shadcn/ui
- Componentes pre-estilizados
- Temas consistentes
- Accesibilidad built-in
- Personalizables

### Color scheme
- Primario: slate (gris neutro)
- Accent: azul para links
- Estados: verde (éxito), rojo (error)
- Backgrounds: blanco, slate-50, slate-100

## Deployment

### Vercel
- Automático de GitHub
- Env variables en Project Settings
- Build command: `npm run build`
- Start command: `npm start`

### Requisitos
- Node.js 18+
- Variables NEXT_PUBLIC_SUPABASE_* configuradas
- Conexión a Supabase funcional

## Testing (futuro)

Puntos para tests unitarios:
- `formatDate()` - validar formato
- `toggleColumn()` - lógica de toggle
- Validaciones de formulario
- Llamados a Supabase (mocking)

## Troubleshooting

### Error: "supabaseUrl is required"
- Verificar `.env.local` existe
- Verificar variables tienen valores
- Reiniciar `npm run dev`

### Imagen no carga en preview
- Verificar path en `image_path` correcto
- Verificar storage tiene permisos públicos
- Verificar imagen fue subida correctamente

### Login no funciona
- Verificar credenciales en Supabase
- Verificar usuario existe en `new_releases_admins`
- Revisar console para errores específicos

### Build error con tipos TypeScript
- Ejecutar `npm run build` para ver errores específicos
- Revisar cambios en types/interfaces
- Asegurar imports estén correctos
