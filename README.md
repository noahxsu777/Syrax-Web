# ZyraxCloud Admin

Panel privado de administración de Vibra, construido con Next.js para Vercel y preparado para compartir el proyecto Supabase de la aplicación móvil.

## Desarrollo local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abre `http://localhost:3000`. La pantalla actual usa datos de muestra; las rutas bajo `src/app/api/admin` son la frontera para conectar operaciones reales.

## Despliegue en Vercel

1. Sube esta carpeta a un repositorio privado.
2. Importa el repositorio en Vercel como proyecto Next.js.
3. Copia las variables de `.env.example` en **Project Settings → Environment Variables**.
4. Restringe las variables privadas a Preview/Production según corresponda y no las expongas con el prefijo `NEXT_PUBLIC_`.
5. Configura un dominio privado y acceso administrativo antes de conectar datos reales.

Consulta [ARCHITECTURE.md](./ARCHITECTURE.md) para la estructura, seguridad y tareas necesarias antes de producción. El esquema inicial está en `supabase/schema.sql`.

## Comandos

- `npm run dev`: servidor local.
- `npm run build`: compilación de producción.
- `npm run lint`: comprobaciones de código.
