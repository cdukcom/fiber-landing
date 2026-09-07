# Backend y reportes de Fiber Electronics

La aplicación usa un servidor Node y una base PostgreSQL independiente. En Railway deben configurarse:

- `DATABASE_URL`: suministrada por una instancia PostgreSQL propia de Fiber.
- `VERIFY_SECRET`: secreto largo y aleatorio para firmar sesiones.
- `ADMIN_USER`: usuario del panel `/admin`.
- `ADMIN_PASSWORD`: contraseña fuerte del panel.
- `NODE_ENV=production`.

El endpoint `/api/health` confirma si el servicio y la base están disponibles. El panel se encuentra en `/admin`.

Las rutas indexables se enumeran en `data/patchcord-routes.json` y `sitemap.xml`. El servidor también interpreta otras combinaciones válidas para que el selector pueda compartir su URL, pero solamente deben añadirse al sitemap las referencias reales que se quieran publicar en buscadores.
