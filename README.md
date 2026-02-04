# New Releases Admin

Admin panel para gestionar releases en Supabase. Interfaz moderna con Next.js, shadcn/ui y Tailwind CSS.

## Setup

### Requisitos previos
- Node.js 18+
- npm o yarn

### Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Desarrollo

Ejecutar servidor de desarrollo:
```bash
npm run dev
```

Luego acceder a `http://localhost:3000`

### Build para producción

```bash
npm run build
npm start
```

## Características

### Autenticación
- Login con email/password usando Supabase Auth
- Validación de permisos de admin contra tabla `new_releases_admins`
- Protección de rutas

### Gestión de Releases
- **Data Table** con busca, filtros y selección múltiple
- **Crear** nuevos releases con:
  - Imagen (cargada a storage)
  - Título, idioma, mes
  - Bullets/highlights (hasta 5)
  - Tamaño (sm/md/lg)
  - URL de Knowledge Base
  - Estado (Publicado/Pausado)

- **Editar** releases existentes
- **Preview** con vista previa del release
- **Eliminar** releases (individual o múltiple)

### Columnas de la tabla
1. Order - Índice de orden
2. Month - Etiqueta del mes
3. Lang - Idioma (ES/EN/PT/BR)
4. Status - Estado (Published/Paused)
5. Preview - Botón de vista previa
6. Last updated - Última actualización
7. Actions - Menú de acciones

### UI/UX
- Interfaz profesional y limpia (estilo shadcn)
- Toasts para confirmaciones (sonner)
- Diálogos de confirmación para eliminar
- Columnas configurables (mostrar/ocultar)
- Responsive design

## Estructura del proyecto

```
├── app/
│   ├── admin/
│   │   └── page.tsx          # Página principal del admin
│   ├── page.tsx              # Página de login
│   └── layout.tsx            # Layout global
├── components/
│   ├── ui/                   # Componentes shadcn
│   └── releases/
│       ├── releases-table.tsx
│       ├── create-release-modal.tsx
│       ├── edit-release-modal.tsx
│       ├── preview-release-modal.tsx
│       └── release-image.tsx
├── lib/
│   ├── supabase/
│   │   └── client.ts         # Cliente de Supabase
│   ├── format.ts             # Utilidades de formato
│   └── utils.ts              # Utilidades compartidas
└── types/
    └── new-release.ts        # Tipos TypeScript
```

## Base de datos (Supabase)

### Tablas utilizadas
- **public.new_releases** - Datos de los releases
- **public.new_releases_admins** - Validación de permisos de admin

### Storage
- **new-releases** bucket - Imágenes de releases

## Despliegue

El proyecto es completamente compatible con Vercel:

```bash
vercel deploy
```

Asegúrate de configurar las variables de entorno en Vercel Project Settings.

## Notas técnicas

- TypeScript para type safety
- SSR y SSG con Next.js App Router
- Componentes completamente tipados
- Validación de auth en servidor
- Manejo de errores con toasts
- Compatible con Node.js 18+ en Vercel

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
