# Publicar BAN en internet (Vercel + Supabase)

Tiempo estimado: 15 minutos. Costo: $0 con los planes gratuitos.

- **Supabase** guarda la base de datos (productos, pedidos, usuarios).
- **Vercel** publica la página y la actualiza sola cada vez que hay cambios en GitHub.

El proyecto ya está preparado: al publicar, Vercel crea las tablas, tu usuario administrador y los productos de
ejemplo automáticamente.

---

## Paso 1. Crear la base de datos en Supabase

1. Entra a <https://supabase.com> y pulsa **Start your project**. Regístrate con tu correo de Gmail
   (o con tu cuenta de GitHub).
2. Pulsa **New project**:
   - **Name:** `ban`
   - **Database Password:** pulsa **Generate a password** y **guárdala** en un lugar seguro.
   - **Region:** `East US (North Virginia)`. Es la misma zona donde Vercel corre la página por defecto, así la tienda responde más rápido.
   - Plan **Free**.
3. Espera 1–2 minutos a que el proyecto esté listo.
4. Arriba pulsa **Connect**. En la pestaña de cadenas de conexión elige **Transaction pooler** y copia la URI. Se ve así:
   ```
   postgresql://postgres.abcdxyz:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
5. Reemplaza `[YOUR-PASSWORD]` por la contraseña del punto 2 (sin corchetes). Guarda esta URL: es tu `DATABASE_URL`.

> Si la contraseña tiene símbolos como `@`, `#` o `/`, genera otra sin símbolos o la URL no funcionará.

## Paso 2. Publicar en Vercel

1. Entra a <https://vercel.com/signup> y regístrate **con GitHub** (cuenta `briancota2801`). Así Vercel puede leer el
   repositorio. Tu correo de Gmail queda como correo de la cuenta.
2. Pulsa **Add New… → Project** y, en la lista, **Import** el repositorio `ban`.
   Si no aparece, pulsa **Adjust GitHub App Permissions** y dale acceso al repositorio.
3. En la pantalla de configuración:
   - **Root Directory:** pulsa **Edit** y elige la carpeta **`web`**. Es importante.
   - **Framework Preset:** Next.js (se detecta solo).
4. Abre **Environment Variables** y agrega estas tres. Deja marcados los tres entornos (Production, Preview y Development):

   | Nombre | Valor |
   |---|---|
   | `DATABASE_URL` | La URL del paso 1 |
   | `ADMIN_EMAIL` | Tu correo de Gmail (con él entrarás al panel) |
   | `ADMIN_PASSWORD` | Una contraseña de **12 caracteres o más**, distinta a la de tu Gmail |

5. Pulsa **Deploy** y espera 2–3 minutos.
6. Al terminar, Vercel te da una dirección tipo `https://ban-xxxx.vercel.app`. ¡La tienda ya está en línea!

## Paso 3. Entrar al panel

1. Abre `https://TU-DIRECCION.vercel.app/admin`.
2. Entra con `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
3. Recomendado: ve a **Mi cuenta** (`/cuenta`) y cambia la contraseña. Las siguientes publicaciones ya no la tocan.

Desde el panel puedes editar los productos de ejemplo, subir fotos, cambiar el banner y crear promociones.

---

## Después

- **Actualizaciones:** cada cambio que se suba a GitHub se publica solo en Vercel.
- **Dominio propio** (ej. `ban.mx`): en Vercel, **Settings → Domains**. Después agrega la variable
  `SITE_URL=https://ban.mx` y vuelve a publicar.
- **Cobrar de verdad:** sigue la sección *Pagos* de [`web/README.md`](../web/README.md) para conectar Stripe.
  Mientras tanto la tienda está en **modo demostración**: los pedidos se crean como "pendiente de pago".
- **Plan gratuito de Supabase:** pausa la base si pasa una semana sin visitas. Se reactiva con un clic en el panel de
  Supabase. Antes de lanzar formalmente, conviene pasar al plan Pro (US$25 al mes).
- **Olvidaste la contraseña del panel:** en Vercel cambia `ADMIN_EMAIL` a un correo nuevo con su contraseña y vuelve
  a publicar; o desde tu computadora corre `npm run admin:create -- tu@gmail.com "nueva contraseña"` con la `DATABASE_URL` de Supabase.

## Si algo falla

| Mensaje en Vercel | Qué hacer |
|---|---|
| `Falta la variable DATABASE_URL` | En *Settings → Environment Variables*: el nombre debe ser exactamente `DATABASE_URL` y tener marcados **Production y Preview**. Después, *Deployments → ⋯ → Redeploy*. Las variables nuevas no se aplican a publicaciones anteriores |
| `password authentication failed` | La contraseña en la URL no coincide. En Supabase: *Project Settings → Database → Reset database password* y actualiza la URL |
| `ENOTFOUND` o `timeout` | Copiaste la URL de conexión directa. Usa la de **Transaction pooler** (puerto 6543) |
| Error de `npm run db:migrate` | Copia el mensaje completo y compártelo para revisarlo |
