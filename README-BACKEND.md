# Backend y reportes de Fiber Electronics

La aplicación usa un servidor Node y una base PostgreSQL independiente. En Railway deben configurarse:

- `DATABASE_URL`: suministrada por una instancia PostgreSQL propia de Fiber.
- `VERIFY_SECRET`: secreto largo y aleatorio para firmar sesiones.
- `ADMIN_USER`: usuario del panel `/admin`.
- `ADMIN_PASSWORD`: contraseña fuerte del panel.
- `NODE_ENV=production`.

El endpoint `/api/health` confirma si el servicio y la base están disponibles. El panel se encuentra en `/admin`.

Las rutas indexables se enumeran en `data/patchcord-routes.json` y `sitemap.xml`. El servidor también interpreta otras combinaciones válidas para que el selector pueda compartir su URL, pero solamente deben añadirse al sitemap las referencias reales que se quieran publicar en buscadores.

## Nota de mejora SEO - 2026-09-23

El panel privado usa el modelo estadístico común de DukeVilla, Fiber y Speednet: visitas, consultas, descargas, contactos, tendencias por día/mes/año, procedencia agrupada y actividad reciente completa. Estos indicadores permiten priorizar páginas de entrada, referencias y fichas técnicas; las métricas del selector continúan como módulo específico de Fiber Electronics.
