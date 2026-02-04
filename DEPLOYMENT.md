# Deployment - Vercel

## Requisitos previos

- Cuenta en Vercel
- Repositorio en GitHub con el código
- Acceso a variables de Supabase

## Pasos para desplegar

### 1. Conectar repositorio a Vercel

1. Ir a [vercel.com](https://vercel.com)
2. Click en "New Project"
3. Seleccionar "Import Git Repository"
4. Autenticar con GitHub y seleccionar el repositorio
5. Click "Import"

### 2. Configurar variables de entorno

En la página del proyecto en Vercel:

1. Ir a **Settings** → **Environment Variables**
2. Agregar las siguientes variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
```

3. Aplicar a todos los ambientes (Production, Preview, Development)
4. Click "Save"

### 3. Deploy

1. Click "Deploy"
2. Vercel automáticamente:
   - Instala dependencias
   - Ejecuta `npm run build`
   - Despliega la aplicación
3. Esperar a que se complete (~1-2 minutos)
4. La URL estará disponible una vez terminado

## Despliegues posteriores

Cada push a la rama principal automáticamente:
1. Dispara un nuevo build
2. Ejecuta tests (si los hay)
3. Despliega a producción

Para preview:
- Push a rama distinta a main → Crea URL temporal
- Perfecto para testing antes de merge

## Monitoreo

### Logs
En Vercel Dashboard:
- **Deployments** → click en el deployment → **Logs**
- Ver logs de build y runtime

### Métricas
- **Analytics** en dashboard
- Ver Web Vitals, duración de requests, etc.

## Troubleshooting

### "supabaseUrl is required"
- Variables de entorno no configuradas
- Ir a Settings → Environment Variables
- Verificar que tengan los valores correctos

### Build error: TypeScript
- Ejecutar `npm run build` localmente
- Resolver errores de tipos
- Commit y push nuevamente

### Página lenta
- Revisar Network tab en DevTools
- Verificar tamaño de bundle
- Considerar optimizar imágenes

## Rollback

Si algo sale mal post-deploy:

1. Ir a **Deployments**
2. Encontrar el deployment anterior
3. Click en los 3 puntos → **Promote to Production**
4. Confirmación

## Dominios personalizados

Para agregar tu propio dominio:

1. Ir a **Settings** → **Domains**
2. Agregar dominio
3. Seguir instrucciones para DNS
4. Generalmente 24h para propagación

## CI/CD Checks (opcional)

Vercel ejecuta automáticamente:
- ✅ Build
- ✅ TypeScript check
- ✅ ESLint (si está configurado)

Para agregar checks adicionales:
- Usar **vercel.json** o configuración de Vercel

## Performance tips

1. **Imágenes:** Usar Next.js Image component
2. **Code splitting:** Next.js lo hace automáticamente
3. **API routes:** Vercel les da serverless functions
4. **Database:** Supabase está optimizado para Vercel

## Backups

Vercel no mantiene backups automáticos. Para safety:
- Mantener código en GitHub
- Hacer backups de BD en Supabase
- Exportar datos periódicamente si es crítico
