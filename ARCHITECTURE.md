# ZyraxCloud Admin

Dashboard privado, separado de Vibra, desplegable en Vercel y conectado al mismo proyecto Supabase.

## Frontera de seguridad

- El navegador recibe únicamente `NEXT_PUBLIC_SUPABASE_URL` y la clave anon/publishable.
- La service role, App Sign, contraseñas y claves de cifrado viven solo en variables de entorno de Vercel.
- Toda acción sensible pasa por `src/app/api/admin/*`, valida sesión, MFA y rol, y crea un registro inmutable en `audit_logs`.
- Nunca se devuelve un secreto guardado. La UI muestra únicamente estado, fecha de rotación y valor enmascarado.
- Los secretos editables deben cifrarse con un KMS o AES-256-GCM antes de persistirlos. Si pueden ser variables de despliegue, es preferible gestionarlos directamente en Vercel.

## Módulos recomendados

```text
src/app/(auth)             inicio de sesión y MFA
src/app/(dashboard)        usuarios, verificaciones, lives, flags, servicios
src/app/api/admin          backend seguro (Route Handlers)
src/lib/supabase           clientes browser/server/admin separados
src/lib/auth               autorización por rol
src/lib/audit              registro de cambios
supabase                   esquema y migraciones compartidas
```

## Antes de conectar producción

1. Configurar Supabase Auth y permitir únicamente cuentas administrativas.
2. Implementar `proxy.ts` para proteger todas las rutas del dashboard.
3. Validar rol y MFA dentro de cada Route Handler; ocultar botones no reemplaza autorización.
4. Crear funciones SQL/RPC transaccionales para bloqueos, verificaciones y moderación.
5. Mantener RLS activa y probar que la aplicación móvil no puede leer tablas administrativas.
6. Añadir rate limiting, protección CSRF/origin, alertas y retención de auditoría.
