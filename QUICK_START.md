# Quick Start Commands

## Instalación inicial

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.local.example .env.local

# Agregar tus credenciales de Supabase en .env.local
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Acceder a
http://localhost:3000
```

## Build & Production

```bash
# Build para producción
npm run build

# Ejecutar servidor de producción
npm start
```

## Testing

```bash
# Verificar tipos TypeScript
npx tsc --noEmit

# Verificar ESLint
npm run lint
```

## Estructura rápida

```
src/
├── app/
│   ├── page.tsx          # Login
│   ├── admin/            # Admin panel
│   └── layout.tsx        # Layout global
├── components/
│   ├── releases/         # Modales y tabla
│   └── ui/              # shadcn components
├── lib/
│   ├── supabase/client.ts
│   └── format.ts        # Utilidades
└── types/
    └── new-release.ts   # Tipos
```

## Environment Variables

Agregar en `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Workflow típico

1. **Login**: `npm run dev` → http://localhost:3000
2. **Crear release**: Click "+ New release"
3. **Editar**: Menu Actions → Edit
4. **Eliminar**: Checkbox → Delete
5. **Preview**: Click ojo

## Troubleshooting rápido

| Problema | Solución |
|----------|----------|
| "supabaseUrl is required" | Verificar `.env.local` con valores |
| Port 3000 ocupado | `lsof -i :3000` → `kill -9 PID` |
| TypeScript errors | `npm run build` para ver detalles |
| Estilo no aplica | Reiniciar servidor dev |
| Imagen no carga | Verificar path en storage |

## Deploy

```bash
# Deploy a Vercel
vercel deploy

# Production deployment
vercel deploy --prod
```

## Tips

- **Búsqueda rápida**: Solo escribe en el campo Search
- **Ver código**: `cmd+P` en VS Code → archivo
- **Refrescar tabla**: Click logout y login nuevamente
- **Debug**: Abrir DevTools (F12) → Console tab

## Archivos importantes

| Archivo | Propósito |
|---------|-----------|
| `README.md` | Info general |
| `USAGE.md` | Guía de usuario |
| `TECHNICAL.md` | Documentación técnica |
| `DEPLOYMENT.md` | Instrucciones Vercel |
| `CHECKLIST.md` | Features completados |
| `.env.local` | Variables de entorno |
| `package.json` | Dependencias |

---

**Última actualización:** Febrero 4, 2026
