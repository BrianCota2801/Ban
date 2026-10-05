# BAN — Tienda en línea

Página propia de BAN: tienda, cuentas de clientes, carrito, checkout y panel de administración.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Drizzle ORM · PostgreSQL (PGlite embebido en desarrollo) · Stripe (tarjeta y OXXO).

## Arrancar en tu computadora

Necesitas [Node.js 22 o más nuevo](https://nodejs.org).

```bash
cd web
npm install
cp .env.example .env        # y edita ADMIN_EMAIL / ADMIN_PASSWORD
npm run setup               # crea la base de datos y carga los productos de ejemplo
npm run dev                 # abre http://localhost:3000
```

Entra al panel en <http://localhost:3000/admin> con el correo y contraseña de tu `.env`.

> En desarrollo la base de datos vive en `web/.data/` (Postgres embebido, no hay que instalar nada).
> No corras `npm run db:seed` mientras `npm run dev` está abierto: detén el servidor primero.

## Qué incluye

### Tienda
| Página | Ruta |
|---|---|
| Inicio armado con bloques desde el panel | `/` |
| Catálogo con filtro por corte y orden por precio | `/productos`, `/productos?corte=oversize` |
| Producto: fotos por color, tallas, inventario, ficha de la prenda | `/productos/[slug]` |
| Drops con cuenta regresiva y lista de aviso | `/drops` |
| Carrito con cupones y barra de envío gratis | `/carrito` |
| Checkout con dirección mexicana y pago con Stripe | `/checkout` |
| Confirmación y seguimiento del pedido (con número de guía) | `/pedido/[id]` |
| Cuenta: pedidos y cambio de contraseña | `/cuenta`, `/login`, `/registro` |
| Ayuda y legales: envíos, devoluciones, guía de tallas, FAQ, nosotros, transparencia, términos, privacidad | `/ayuda/[slug]` |

### Panel de administración (`/admin`)
- **Resumen:** ventas del mes, pedidos por enviar, pendientes de pago, suscriptores, inventario bajo.
- **Página principal:** agrega, ordena, oculta o programa por fecha bloques de *banner*, *franja de promoción*,
  *rejilla de productos*, *accesos por corte* y *texto con imagen*. Con vista previa.
- **Productos:** alta y edición, colores y tallas con inventario, fotos por color, borrador/publicado/archivado,
  fecha de lanzamiento para drops.
- **Pedidos:** filtro por estado, cambio de estado, paquetería y número de guía. Cancelar regresa el inventario.
- **Promociones:** códigos de descuento por porcentaje o monto, con vigencia, compra mínima y límite de usos.
- **Suscriptores:** newsletter y avisos de drops, descarga en CSV.
- **Ajustes:** aviso superior, costo de envío y monto para envío gratis, contacto y redes.

## Seguridad

- Contraseñas con **scrypt** (sal única por usuario); nunca se guardan en texto.
- Sesiones con token aleatorio de 256 bits en cookie `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
  En la base solo se guarda el hash del token. Sesión de admin: 12 horas; clientes: 30 días.
- **Límite de intentos:** 5 fallos por correo o 25 por IP en 15 minutos bloquean el inicio de sesión.
  El mensaje de error no revela si el correo existe.
- Cambiar la contraseña cierra todas las demás sesiones.
- Cada página y **cada acción** del panel verifica en el servidor que la sesión sea de un admin.
  A un cliente que intenta entrar a `/admin` se le responde 404.
- Las acciones del servidor rechazan peticiones de otros dominios (protección CSRF de Next.js) y las cookies son `SameSite`.
- Precios, descuentos e inventario se calculan siempre en el servidor; el navegador no puede alterarlos.
  El inventario se descuenta dentro de una transacción para que dos personas no compren la última pieza.
- Imágenes: se valida el tipo real del archivo (no la extensión), máximo 5 MB, y se sirven con `nosniff` y CSP `sandbox`.
- Webhook de Stripe con verificación de firma HMAC y tolerancia de 5 minutos.
- Cabeceras: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y HSTS en producción.
- Bitácora de acciones de admin en la tabla `audit_log`.
- Redirecciones después del login solo a rutas internas (sin redirecciones abiertas).

## Poner la tienda en internet

Opción recomendada para empezar, con costo inicial bajo o nulo:

1. **Base de datos:** crea un proyecto en [Neon](https://neon.tech) (Postgres administrado) y copia su URL.
2. **Migraciones y admin:** en tu computadora, pon esa URL en `DATABASE_URL` del `.env` y corre `npm run setup`.
   Si no quieres los productos de ejemplo, usa `npm run db:migrate && npm run admin:create`.
3. **Hosting:** importa el repositorio en [Vercel](https://vercel.com), con *Root Directory* = `web`.
   Agrega las variables de entorno: `DATABASE_URL`, `SITE_URL` (tu dominio) y las de Stripe.
4. **Dominio:** conecta tu dominio (`ban.mx` o el que registres) en Vercel.
5. **Pagos:** en [Stripe](https://stripe.com/mx), activa tu cuenta y **OXXO** en *Payment methods*. Copia la
   *Secret key* a `STRIPE_SECRET_KEY`. Crea un webhook a `https://TU-DOMINIO/api/stripe/webhook` con los eventos
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed` y `checkout.session.expired`, y copia su secreto a `STRIPE_WEBHOOK_SECRET`.

Sin claves de Stripe la tienda funciona en **modo demostración**: los pedidos se crean como "pendiente de pago" y,
solo fuera de producción, aparece un botón para simular el pago.

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilar y correr en modo producción |
| `npm run lint` | Revisión de tipos (TypeScript) |
| `npm run db:generate` | Generar una migración después de cambiar `src/db/schema.ts` |
| `npm run db:migrate` | Aplicar migraciones |
| `npm run db:seed` | Cargar ajustes, admin y productos de ejemplo (solo si no hay productos) |
| `npm run admin:create -- correo "contraseña" "Nombre"` | Crear o restablecer un administrador |

## Estructura

```
web/
├── drizzle/              migraciones SQL
├── scripts/              migrate, seed, create-admin
└── src/
    ├── app/(tienda)/     páginas públicas
    ├── app/admin/        panel (páginas + actions.ts)
    ├── app/actions/      acciones de la tienda: carrito, checkout, auth, newsletter
    ├── components/       UI de la tienda y del panel
    ├── db/               esquema y conexión
    └── lib/              auth, carrito, precios, pagos, catálogo, fechas (hora de Sonora)
```
