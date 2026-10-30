# Backlog

Última actualización: **2026-10-08**. El punto 1 se actualizó el **2026-10-20**.

Orden de prioridad: de arriba hacia abajo. No empezar un punto hasta cerrar el anterior.

## 1. Cerrar el módulo CRM (en curso)

El frontend del CRM (`src/app/dashboard/webapp/crm/`) está **desplegado y en uso** (validado
en producción el 2026-10-16). El estado detallado y los pasos viven en el repo de Reforma
(`ReformaDental2025/CRM_STATUS.md` y `CRM_USUARIOS.md`) y en este repo, en
`crm_validacion_2026-10-16.md` y `crm_validacion_2026-10-19.md`.

Pendiente para darlo por cerrado:

- [x] Build y subida a `public_html`. La sidebar en carpetas (Apps, Calendarios, CRM) y la
      corrección del selector Template se desplegaron el 2026-10-16.
- [x] Probar de punta a punta, solo con correo (2026-10-16): pasos 1 al 10 de la validación.
      **Sin probar:** correo hacia Outlook/Hotmail y el permiso `CRM` con un cliente real.
- [x] Revisar la consola del navegador: sin errores (2026-10-16).
- [x] Commitear `access-app/page.tsx`, `app-sidebar.tsx` y `webapp/crm/`. **Ojo:** los cambios
      del 2026-10-16 (sidebar, `globals.css`, `ui.tsx`) y los documentos nuevos siguen sin commit.
- [x] `"CRM"` agregado a `allComponents` en `GET /api/users/:id/apps` del backend del dashboard
      (aplicado en producción y en MySQL el 2026-10-16).
- [x] Cron fiable (2026-10-19): `POST /crm/cron/tick` con token y Cron Jobs de cPanel cada 5
      minutos; corrección del bucle de "Follow up again". Ver `crm_validacion_2026-10-19.md` §10.
- [ ] Pendientes menores del CRM: monitor externo a `/health`, leer Last error, comprobar en 48 h
      que "Follow up again" reaparece una sola vez, probar el envío de mensajes en producción, las
      otras tres reglas y el segundo usuario del CRM.
- [ ] Commit de los cambios del 16 y 19 de octubre en este repo y en `ReformaDental2025`, sin
      `git add .`.
- [x] Revisión de la mañana del 2026-10-20: el cron de cPanel estaba roto por un comando mal
      escrito (ruta de log inexistente); corregido y funcionando. Last sync avanza, Last error
      vacío, sin tareas duplicadas. Ver `crm_validacion_2026-10-20.md`.
- [ ] **Reinicios del proceso:** aunque el cron llama cada 5 min, el proceso de Node se reinicia
      seguido y sin patrón fijo (vidas de ~65, ~35, ~22 y ~12 min el 20-oct). Los ticks siguen, sin
      pérdida de datos. Los límites de la cuenta están al 1–5%. Caso abierto con Namecheap (live
      chat del 20-oct; responderán por correo). Falta revisar las gráficas de 24 h de Resource Usage.
      Si no se puede evitar: VPS (Ruta 2) o Ruta 1 con monitor. Ver `crm_validacion_2026-10-20.md` §7.
- [x] **Correo de aviso del cron:** guardado un correo externo en Cron Jobs → Cron Email
      (2026-10-20).
- [x] **WhatsApp y SMS (Twilio) desactivados en la interfaz del CRM (2026-10-20):** siguen visibles
      pero atenuados con etiqueta "Disabled" (envío al lead, chips y test de Settings), porque solo
      el correo está validado. Se reactivan quitando el canal de `DISABLED_CHANNELS` en
      `webapp/crm/lib/channels.ts` cuando el usuario lo indique. Solo frontend: falta build, subida
      y commit; el backend sigue aceptando envíos directos. Ver `crm_validacion_2026-10-20.md` §11.
- **Actualización (2026-10-29):** WhatsApp quedó habilitado en el código del frontend; falta build
  y subida. SMS permanece desactivado. El backend sigue aceptando envíos y WhatsApp apunta al número
  de pruebas; validar configuración y plantillas antes de enviar a pacientes.
- [ ] **Monitor externo** a `/health` con palabra clave `warnings` (un `warnings` llega con código 200).
      Candidato: Better Stack; confirmar que su plan gratis incluye palabra clave.
- [x] **Comprobación de 48 h de "Follow up again" y `touchLead`: OK (2026-10-21).** Una sola tarea nueva
      a las 5:55 PM; enviar la plantilla no creó otra. Ver `crm_validacion_2026-10-20.md` §14. Un tick
      a las 6:00 PM falló (`ok: false`) tras un reinicio, causa sin verificar.
- [x] **Reinicios del proceso: explicados (2026-10-21).** Namecheap confirmó (tickets NC-OHM-0983 y
      NC-HDA-9950) que Apache en Shared termina la app por diseño, que no se puede desactivar y que no hay
      logs del servidor; en VPS o dedicado no debería ocurrir. Decisión propuesta (sin confirmar):
      Ruta 1 con monitor externo; VPS si el CRM atiende pacientes a diario. Ver `crm_validacion_2026-10-20.md`
      §7 y §12.
- [x] **Efectos de creación a prueba de reinicios (2026-10-21):** columna `crm_leads.effects_fired_at`
      aplicada en MySQL de producción (21 leads, 0 pendientes) y código del backend desplegado según el
      usuario (`ReformaDental2025`, `CRM_STATUS.md` §11). **Falta:** probarlo con un lead nuevo real y
      commitear (el código tiene `tick.js` sin trackear y más cambios previos sin commit).
- [ ] Decidir Ruta 1 (Shared + monitor + correo de aviso) o Ruta 2 (VPS), con las ventajas y desventajas de
      `crm_validacion_2026-10-20.md` §12.
- [ ] Decisión futura: cuando haya un segundo CRM, pasar a una instancia por CRM en un VPS
      (`crm_validacion_2026-10-19.md` §8).
- [ ] **Asistente con IA del CRM v2 (en diseño, 2026-10-20):** se avanza por capas dentro del CRM
      de Reforma y con datos ficticios. Diseño de la capa de modelos y 52 casos de prueba en
      `crm_asistente_capa_modelos.md` y `crm_asistente_casos_prueba.json`; datos del negocio y prompt
      rellenado en `crm_v2_backlog.md`. **Falta la aprobación del diseño; no hay código.** El
      análisis original sigue vigente: si se aplica o no el asistente con IA del CRM v2 (Messenger e
      Instagram, voz). Solo análisis; sin fecha. Criterios y opciones A, B y C en
      `crm_v2_backlog.md`. Requiere antes cerrar el punto 3 de este backlog y la decisión
      de privacidad del dueño.

## 2. Migrar el frontend a Vercel (siguiente feature tras el CRM)

**Objetivo:** que el frontend deje de ser estático y de subirse a mano, para que crear una
ruta o un proyecto nuevo no exija build y subida cada vez.

**Decisión (2026-09-30):** frontend en Vercel, dinámico (sin `output: 'export'`);
backend, bases de datos, cron **e imágenes subidas se quedan en cPanel**.

**Alcance:** solo el frontend. El backend Express, las bases de datos y el cron
**se quedan en cPanel**. No mover Express a Vercel: el cron del CRM (sync de Facebook cada
5 min) y las conexiones persistentes a MySQL no encajan en funciones serverless.

**Imágenes:** no se necesita bucket. Multer guarda en `server/public/images/` del backend
(`dashboard.js`), Express las sirve con `express.static`, la base de datos guarda la ruta
relativa `/images/<archivo>` y el frontend la antepone con `NEXT_PUBLIC_URL`. El navegador
sube y pide las imágenes directo al backend, así que Vercel no interviene. Vercel no puede
guardar subidas (disco temporal); un bucket (Vercel Blob, R2, S3) solo haría falta si algún
día se sacan las imágenes de cPanel.

```
Navegador ──► e-commetrics.com (Vercel)   ← solo el frontend
                 ├──► backend Express del dashboard (cPanel)   /api/... y /images/...
                 └──► reformadental.com/crm (cPanel)           /crm/...
```

> **Corrección (2026-10-08):** el diagrama de arriba es el objetivo, pero el plan original
> daba por hecho que el backend tenía una URL propia. **No la tiene**: hoy el backend
> Express vive en el mismo dominio que el frontend (`NEXT_PUBLIC_URL=https://e-commetrics.com`).
> Ver "Intento del 2026-10-08" y "Backend en el mismo dominio" más abajo.

### Intento del 2026-10-08: DNS apuntado a Vercel y REVERTIDO

- El código de la rama `vercel` (sin `output: 'export'`, con `force-dynamic` y sin
  `generateStaticParams`) ya está subido (commit `209afdc`) y promovido a producción
  en Vercel. El build pasa limpio. El CRM es idéntico en `main` y `vercel`.
- Se cambió el DNS (`@` A → `216.198.79.1`, `www` CNAME → Vercel). El sitio cargó, pero
  **el login falló**: `POST https://e-commetrics.com/api/login 404`. Causa: `/api/...` y
  `/images/...` ya no llegaban a cPanel, sino a Vercel, que no tiene esas rutas.
- Se **revirtió** el DNS (`@` y `www` → A `198.54.126.137`). Verificado con `nslookup`:
  el servidor autoritativo y la API responden como antes. MX, `mail` y TXT no se tocaron.
- Lección DNS: un CNAME no puede convivir con otro registro del mismo nombre; había que
  borrar primero el A de `www`. Un A duplicado en `@` no rompe, pero hay que dejar solo uno.

### Estado: EN PAUSA (holding). No hay código pendiente: el árbol de trabajo está limpio.

Al retomar, empezar por "Backend en el mismo dominio" y luego el paso 1.

- **DNS:** se administra **dentro de cPanel** (Zone Editor), no en el registrador. Se
  descarta cambiar los nameservers a Vercel: habría que recrear a mano los MX y el
  correo. Solo se cambian registros del sitio web.
  - `@` (A) → `76.76.21.21`
  - `www` (CNAME) → `cname.vercel-dns.com`
  - No tocar MX. Borrar AAAA de `@` y `www` si existen (mandan tráfico al servidor viejo).
- **Variables de entorno del frontend:** no hay variables nuevas. El código usa solo
  `NEXT_PUBLIC_URL` (obligatoria; hay que cargarla en Vercel) y
  `NEXT_PUBLIC_SCANEAT_ADMIN_KEY` (solo `webapp/scan-eat/page.tsx`; al ser `NEXT_PUBLIC_`
  queda visible en el navegador, así que no es secreta).
- **`www`:** había un redirect `www` → `https://e-commetrics.com` en cPanel. **Dejará de
  funcionar** al apuntar `www` a Vercel (el tráfico ya no llega a cPanel). Decisión: se
  quita de cPanel y el redirect se define en Vercel (Domains → `www.e-commetrics.com` →
  *Redirect to* `e-commetrics.com`). Con esto `www` no llega a ser origen, así que no hace
  falta tocar el CORS.
- **Imágenes:** se confirma que se quedan en cPanel; no se necesita bucket.

**Orden seguro del cambio de dominio** (no quitar el redirect de cPanel antes de tiempo):
1. Código listo y desplegado en `*.vercel.app` (pasos 1 y 2).
2. En Vercel agregar `e-commetrics.com` y `www.e-commetrics.com` (este con redirect).
3. En el Zone Editor cambiar los registros de arriba.
4. Esperar "Valid Configuration" en ambos dominios en Vercel.
5. Recién entonces quitar el redirect de cPanel.

### Backend en el mismo dominio (decisión 2026-10-08: proxy con rewrites de Vercel)

Un mismo nombre de host solo puede apuntar a un lugar: Vercel **o** cPanel. Para que el
frontend y el backend sigan bajo `e-commetrics.com`, Vercel hace de proxy y reenvía
`/api/*`, `/images/*` y `/send-package-email` a un host de origen en cPanel. Ese host solo
lo usa Vercel; el navegador y el código del frontend siguen viendo `e-commetrics.com`.
Se descartó poner el backend en un subdominio visible (`api.`), que es la opción más
simple y de menos riesgo, pero implica CORS y cookies cross-site.

| | Proxy (elegido) | Subdominio visible (descartado) |
|---|---|---|
| Navegador ve | solo `e-commetrics.com` | `api.e-commetrics.com` |
| CORS / cookie | no aplica / first-party | se mantiene / cross-site |
| Imágenes | pasan por Vercel (ancho de banda) | directo desde cPanel |
| Riesgo | límites del proxy (tamaño, tiempo) | menor |

**Hallazgos del código (revisados 2026-10-08, sin cambios aplicados):**

- `components/packages.tsx:54` llama a `https://e-commetrics.com/send-package-email`
  (URL fija y **fuera de `/api`**): necesita su propio rewrite o moverse bajo `/api`.
- Las 67 filas de `project_content` guardan `source` como `/images/...` (lo cubre el
  rewrite de `/images`). Las fotos de perfil no se pudieron comprobar (requieren sesión).
- `NEXT_PUBLIC_URL` no se puede guardar vacía en Vercel. Para que los previews usen rutas
  relativas: no definirla en Preview y poner en `next.config.ts`
  `env: { NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL ?? "" }`.
- En `[project_name]/page.tsx`, la llamada del servidor debe ir directo a `BACKEND_ORIGIN`.
- Hay certificado **wildcard** `*.e-commetrics.com` (Sectigo) instalado en cPanel, **vence
  el 2026-12-19** y se renueva a mano (sin AutoSSL). Si caduca, el proxy cae y el dashboard
  con él. Poner recordatorio unas semanas antes.
- El correo no se ve afectado: MX → `mx1/2/3-hosting.jellyfish.systems` (externo); `mail`,
  `cpanel` y los TXT se quedan en cPanel (`198.54.126.137`).
- El CRM llama a `reformadental.com/crm` desde el navegador: no cambia con el proxy.

**Pendiente (en orden):**

1. **Revisar `dashboard.js`** (el backend no está en este repo): rutas fuera de `/api`;
   `trust proxy` para leer `X-Forwarded-For` (si no, `/api/geo` y cualquier límite por IP
   verán la IP de Vercel); que no arme URLs ni correos con `req.hostname`; que la cookie de
   sesión no tenga un `Domain=` fijo distinto.
2. **Revisar `public_html`** en cPanel: `robots.txt`, `sitemap.xml`, verificaciones de
   Google, `.well-known/`, otras carpetas o apps. Todo lo que no sea el build de Next
   dejará de servirse en `e-commetrics.com`. También los redirects del `.htaccess`
   (http→https, `www`), que se pierden; Vercel hace https y el `www` se define en Domains.
3. **Crear el host de origen** en cPanel (p. ej. `origin.e-commetrics.com`): registro A →
   `198.54.126.137` (el wildcard ya lo cubre), subdominio con su propio document root, y
   copiar el bloque `CLOUDLINUX PASSENGER CONFIGURATION` del `.htaccess` de la app Node al
   `.htaccess` del subdominio. **No** cambiar el dominio de la app en "Setup Node.js App".
   Probar: `curl https://origin.e-commetrics.com/api/projects` → 200.
4. **Código** (solo con visto bueno): `rewrites()` en `next.config.ts` hacia
   `BACKEND_ORIGIN` (sin barra final; sin variable no crea rewrites, así no afecta el
   desarrollo local), `env` de `NEXT_PUBLIC_URL`, y llamada del servidor en
   `[project_name]/page.tsx`.
5. **Variables en Vercel** (son de build: redeploy al cambiarlas):

   | Variable | Preview | Production |
   |---|---|---|
   | `BACKEND_ORIGIN` | `https://origin.e-commetrics.com` | igual |
   | `NEXT_PUBLIC_URL` | sin definir | `https://e-commetrics.com` |
   | `NEXT_PUBLIC_SCANEAT_ADMIN_KEY` | valor actual | valor actual |

6. **Probar en el preview `*.vercel.app` sin tocar el DNS**: login, proyectos, CRM, demás
   apps, chat, `send-package-email` y **subida de imágenes** (perfil y contenido) por el
   proxy; límites de tamaño y tiempo.
7. **Recién entonces mover el DNS** (ver "Orden seguro del cambio de dominio") y dejar
   `public_html/out` unos días como respaldo.

### Por qué

- `next.config.ts` tiene `output: 'export'`: todo se genera como HTML fijo en `out/`.
- `src/app/dashboard/[project_name]/page.tsx` pide los datos **en el build**
  (`generateStaticParams` y el `fetch` de la página). Un proyecto nuevo no tiene página
  hasta el siguiente build, y el contenido queda congelado en el HTML.
- En Vercel, sin `output: 'export'`, esa ruta se genera al primer acceso con datos
  frescos, y cada `git push` despliega solo.

### Ya está preparado

- Sin rutas de API de Next ni middleware: todo va por `fetch` al backend Express.
- URL del backend en `NEXT_PUBLIC_URL`; la del CRM fija en `webapp/crm/lib/api.ts`
  (`CRM_API`). Ninguna cambia al mudarse.
- El CRM ya está pensado para llamarse desde otro dominio (CORS + token `Bearer`).

### Pasos

1. **Preparar el código**
   - [ ] Quitar `output: 'export'` de `next.config.ts`.
   - [ ] En `[project_name]/page.tsx` agregar `export const dynamic = "force-dynamic";`
         (o `revalidate = 60` si se acepta un minuto de retraso).
   - [ ] Leer `ProjectClient` y confirmar si ya recarga datos en el navegador.
   - [ ] Confirmar que toda imagen (incl. `source` de `project_content`) se renderiza con el
         prefijo `NEXT_PUBLIC_URL`; ninguna ruta relativa sola.
   - [ ] Si se usa `next/image` con imágenes del backend, agregar su dominio a
         `images.remotePatterns` en `next.config.ts`.
   - [ ] `next build` limpio y revisar página por página lo que cambie.
2. **Crear el proyecto en Vercel**
   - [ ] Conectar el repo (rama `main`).
   - [ ] Definir `NEXT_PUBLIC_URL` en Vercel (Settings → Environment Variables) con la URL
         pública del backend Express del dashboard, sin barra final, en Production y
         Preview. Vercel no lee el `.env` local; sin la variable, las llamadas y las
         imágenes irían a `undefined/...`. Es variable de build (se incrusta al compilar):
         si se cambia, hay que hacer redeploy. Es pública, solo la URL del backend: nunca
         poner claves ahí. `CRM_API` no necesita variable (fija en `webapp/crm/lib/api.ts`).
   - [ ] Desplegar primero en la URL `*.vercel.app` **solo para revisar el build y el
         render**. El login no funcionará ahí (ver CORS abajo); es esperado.
3. **Dominio**
   - [ ] Apuntar `e-commetrics.com` a Vercel (dominio propio). Es requisito, no opcional.
   - [ ] Cambiar **solo** el registro del sitio web. No tocar los MX ni los registros del
         correo.
   - [ ] Bajar el TTL del DNS con antelación para poder volver atrás rápido.
4. **Verificar en producción**
   - [ ] Login del dashboard (cookie de sesión).
   - [ ] Entrar al CRM y a las demás apps.
   - [ ] Crear un proyecto nuevo desde el dashboard y abrir su página **sin hacer deploy**.
   - [ ] Editar el contenido de un proyecto y comprobar que se ve al momento.
   - [ ] Subir una foto de perfil y una imagen de contenido; comprobar que se ven (vienen
         del backend en cPanel).
5. **Retirar lo anterior**
   - [ ] Dejar el hosting estático de cPanel como respaldo unos días.
   - [ ] Después, borrar `out/` de `public_html`.

### Riesgos y cuidados

- **CORS y cookies.** El backend del dashboard tiene el CORS fijo a
  `https://e-commetrics.com`, `http://localhost:3000` y
  `https://foodhub-software.vercel.app`, y la cookie de sesión es `httpOnly`,
  `secure`, `sameSite: none`. El backend de Reforma acepta `e-commetrics.com` y
  `www.e-commetrics.com`. Con el proxy del mismo dominio el navegador envía
  `Origin: https://e-commetrics.com`, ya permitido: no hay que tocar nada. Sin proxy
  (llamando al backend por otro host), el login y el CRM fallan en `*.vercel.app`. Si se quiere probar ramas en URLs de Vercel, hay que agregarlas
  a la lista de ambos backends.
- **`www.e-commetrics.com`** no está en el CORS del backend del dashboard (sí en el de
  Reforma). Decidido (2026-10-07): se redirige al dominio sin `www` desde Vercel; no se
  añade al CORS. Ver "Estado" arriba.
- **Llamadas desde el servidor de Vercel.** `[project_name]/page.tsx` llama al backend
  desde los servidores de Vercel, no desde el navegador. Comprobar que el backend no
  bloquee IPs externas.
- **Un push malo va directo a producción.** Proteger `main` y usar ramas y previews para
  revisar antes de fusionar.
- **Plan de Vercel.** El plan gratuito tiene límites y es de uso no comercial. Revisar si
  hace falta el plan Pro, al ser una plataforma con clientes.
- **Imágenes en disco de cPanel.** Un redeploy del backend que sobrescriba `server/public/`
  las borraría. Respaldar esa carpeta antes de desplegar el backend.
- **Ver también** el punto 3: la seguridad del backend debe arreglarse pronto
  independientemente de esta migración.

### Criterio de "hecho"

Un `git push` publica los cambios sin subir nada a mano, y un proyecto creado desde el
dashboard tiene su página al momento, con el backend y las bases de datos intactos en cPanel.

## 3. Endurecer el backend del dashboard (`dashboard.js`)

Hallazgos leídos del código; **no se probaron contra el servidor**. Son independientes de
la migración a Vercel y conviene hacerlos pronto.

- [~] (2026-10-21, **desplegado**: ahora lee `JWT_SECRET` del entorno con el valor actual como respaldo, para no cerrar sesiones; falta definir la variable en cPanel y rotarla) `JWT_SECRET` está escrito en el código (`"mi-clave-super-secreta"`): pasarlo a
      variable de entorno. Al desplegarlo se cierran todas las sesiones.
- [~] (2026-10-21, **desplegado, verificado con 401 sin sesión y probado en el navegador como admin y cliente (2026-10-21)**: `requireAdmin` en `PUT`, `DELETE`, `POST /api/register` y `POST /api/users/:id/apps`; el frontend ya manda la cookie) `PUT /api/users/:id` **sin autenticación** y acepta `password`: cualquiera puede
      cambiar la contraseña de cualquier usuario, admin incluido. Es el más grave.
- [~] (2026-10-21, **desplegado**: solo admin y sin el hash de contraseña) `GET /api/users` sin auth y con `SELECT *`: expone los hashes de contraseña.
- [x] (2026-10-29, confirmado por el usuario y leído en `backend-actual.js`, la copia de producción en la
      raíz del repo, en `.gitignore`) `POST /api/register`, `DELETE /api/users/:id` y
      `POST /api/users/:id/apps` llevan `requireAdmin` en producción.
- [ ] `PUT /api/update-profile` sin auth. `PUT /api/change-password` toma el `id` del cuerpo y
      tampoco pide sesión.
- [ ] Siguen sin auth en producción (2026-10-29): `GET /api/users/:id/apps`, todas las rutas de
      proyectos y contenidos (`GET`, `POST`, `PUT`, `DELETE`), `POST /api/invoice` y
      `POST /send-package-email`. `PUT /api/projects/:id` y `DELETE /api/projects/:id` están
      definidas dos veces (gana la primera).
- [ ] Contraseña SMTP de facturación escrita en el código: pasarla a variable de entorno.
- [ ] `/api/register` envía la contraseña en texto plano por correo.
- [~] (2026-10-29: los middleware ya existen en producción y protegen las rutas de usuarios; falta
      aplicarlos al resto) Middleware `requireAuth` y `requireAdmin` para las rutas de listado y escritura.
- [ ] Añadir `"CRM"` a `allComponents` (si no se hizo ya en el punto 1).
- [ ] Rutas de subida (`/api/upload-profile-image`, `/api/projects/content`,
      `PUT /api/project_content/:id`): exigir sesión, y limitar tamaño y tipo de archivo en
      multer.

### 3.1 Rutas de citas de Reforma sin autenticación — **Prioridad: media** (2026-10-28, sin integrar)

Decisión del 2026-10-28: documentado y **no se integra por ahora**.

**Problema** (leído en `ReformaDental2025/server/server.src.js`, no probado contra producción para no
descargar datos de pacientes):
- `GET /api/appointments` devuelve nombre, teléfono, correo, servicio y seguro de **todos** los
  pacientes sin pedir sesión.
- `PUT` y `DELETE /api/appointments/:id` y `POST /api/appointments-dashboard` tampoco piden sesión:
  cualquiera con la URL puede editar, borrar o crear citas.
- **CORS no protege:** solo lo aplica el navegador, y la configuración acepta peticiones sin `Origin`
  (`if (!origin || …) callback(null, true)`), que es lo que mandan `curl` o un script.

**Restricción:** no se pueden cerrar sin más. `src/app/dashboard/webapp/calendar-reforma/page.tsx` usa
esas cuatro rutas sin token, y ese flujo está en uso. Tampoco se puede juntar el calendario con el CRM.
Las rutas del sitio público (`/api/citas/agendar`, `/agendar-en`, `/api/citas/ocupadas`) siguen abiertas
a propósito: las usan los pacientes, y `ocupadas` solo devuelve fecha y hora.

**Solución elegida: un pase de corta duración firmado por el dashboard.** El usuario no hace un segundo
login.
1. `calendar-reforma` pide un pase al backend del dashboard (ruta nueva, por ejemplo
   `GET /api/reforma-pass`). Esa petición sí lleva la cookie `token`, porque va a `e-commetrics.com`.
2. `dashboard.js` revisa la sesión y el permiso del calendario (admin, o cliente con el permiso), y firma
   un JWT de ~15 min con una clave compartida (`REFORMA_PASS_SECRET`, en el entorno de los dos servidores).
3. La página manda el pase en cada llamada de axios a Reforma (`Authorization: Bearer …`), como lo hace
   el CRM en `webapp/crm/lib/api.ts`.
4. El backend de Reforma lo verifica con `jsonwebtoken` (ya instalado). Sin pase válido devuelve 401.
5. Al vencer, la página pide otro sin intervención del usuario.

**Descartado:**
- Mandar la cookie del dashboard a Reforma: es `httpOnly` de `e-commetrics.com`, así que el navegador
  no la envía a `reformadental.com` y la página no puede leerla.
- Una clave fija en el frontend: el build es estático y quedaría visible.
- El login del CRM: obligaría a crear cuentas del CRM a quien hoy solo usa el calendario.

**Qué se toca:** `dashboard.js` (ruta del pase y variable), `server.src.js` de Reforma (verificación en
las cuatro rutas y variable en cPanel) y `calendar-reforma/page.tsx`.

**Antes de empezar:**
- [ ] Confirmar qué permiso de `AVAILABLE_COMPONENTS` corresponde a `calendar-reforma`.
- [ ] Confirmar que `ReformaDental2025/server/dashboard.js` es lo que corre en `e-commetrics.com` (ver la
      actualización del 2026-10-21).
- [ ] Definir `JWT_SECRET` en el cPanel del dashboard (punto de arriba, sigue en `[~]`). Sin eso el pase
      hereda el respaldo escrito en el código.
- [ ] Confirmar que nada llama `/guardar-datos` ni `/guardar-datos-es` (el dashboard ya no) y cerrarlas
      o quitarlas en el mismo cambio.

**Relacionado:** el patrón es el mismo que el "Login único" del punto 5 (endpoint de token en el
dashboard). Si se hace este primero, sirve de base.

## 4. Cumplimiento: privacidad y accesibilidad (2026-10-13)

Sale de comparar el doc "Compliance Remediation Plan" (2026-10-12) con este repo, que sirve
`e-commetrics.com`. El plan lo trata como sitio propio a corregir primero. El mismo ejercicio
para `ecommetrica.com` está en `Ecommetrica/BACKLOG.md`. Las cifras legales del doc (umbrales
del CCPA, montos de CIPA y Unruh) no están verificadas: confirmarlas con un abogado antes de
publicarlas. Cualquier texto legal que se publique necesita visto bueno explícito.

**ESTADO tras ejecutar la subtarea 2 (2026-10-13, solo frontend, cambios en el árbol de trabajo sin subir a git).** Hecho: `lint` migrado a `eslint` con la configuración nativa de Next 16; `<html lang>` sigue al idioma activo; enlace "saltar al contenido" y destino `<main>`; etiquetas asociadas y nombres accesibles en login y formulario de paquetes; casilla de consentimiento y aviso en el formulario de paquetes (el botón de envío espera el consentimiento); foco visible global; aviso del chat y roles de diálogo; páginas nuevas `/legal/privacy-policy` y `/accessibility` (bilingües, con enlaces en el pie de la landing y en el login); 3 errores de lint corregidos en archivos tocados. Verificación: `tsc` sin errores, `bun run build` correcto, axe sin hallazgos en entrada, landing, login (corregidos 1 crítico y 1 serio), formulario de paquetes, aviso y declaración, en claro y oscuro.
**PENDIENTE de esa ejecución:** (1) aprobar el texto del aviso de privacidad (afirma que no se venden datos, que no hay analítica de terceros, que un proveedor externo de IA procesa el chat y que Meta y WhatsApp intervienen en el CRM si el cliente los activa); (2) decidir la razón social del responsable y si hay un correo de privacidad dedicado (hoy `admin@e-commetrics.com`); (3) no existe página de términos; (4) pruebas con sesión iniciada (panel, CRM y chat) y con NVDA y VoiceOver; (5) revisar a ojo 13 elementos de contraste del login que axe marcó "a revisar"; (6) alta manual de leads e importación CSV sin campo de consentimiento (requiere backend); (7) el pie de la landing dice "SECURE · ENCRYPTED · MX" y "ALL SYSTEMS ONLINE" como texto fijo, que se lee como una afirmación de seguridad mientras el punto 3 está abierto; (8) quedan 16 errores de lint en archivos no tocados (CRM, sidebar, calendario de Palmas).

**Lo que ya cumple:** el frontend no carga trackers (sin GA, Pixel, Clarity ni scripts de
terceros), las cookies son funcionales (`lang`, `sidebar_state`, sesión) y el token del CRM
vive en memoria y `sessionStorage`. Por eso CMP, Consent Mode v2 y GPC no aplican hoy; pasan
a ser obligatorios si se agrega GA4 o Meta Pixel.

**Parte pública (landing, chatbot, formulario de paquetes):**

- [~] Política de privacidad y términos (verificado 2026-10-21: **la política existe** en `src/app/legal/privacy-policy`; **los términos no**; falta revisión de un abogado y confirmar los datos de abajo). Antes: **no existen** ni hay enlace. Es más grave que en
      `ecommetrica.com`. Necesita fecha, responsable, correo de privacidad, finalidades,
      terceros, retención y cómo ejercer ARCO. Decisiones previas: cómo identificar al
      responsable (DBA) y revisión de un abogado.
- [x] (verificado 2026-10-21: hecho, casilla sin marcar y enlace al aviso) `components/packages.tsx` (campo de correo, `POST /send-package-email`): agregar aviso
      simplificado y casilla de consentimiento sin marcar.
- [x] (verificado 2026-10-21: `lang="es"` por defecto y `LangContext` actualiza `document.documentElement.lang`) `<html lang="en">` fijo en `app/layout.tsx` aunque el sitio es bilingüe y por defecto
      en español: debe seguir el idioma activo.
- [~] (verificado 2026-10-21: hay aviso con enlace junto al chat; **la política no nombra al proveedor de IA** y falta decidir cuánto se guarda en el backend) Chatbot (`components/chatbot.tsx`): lo que escribe el visitante va a `/api/chat` y de ahí
      a un proveedor de IA (Groq). Es una transferencia a un tercero: avisarlo en la política
      y junto al chat, y decidir cuánto se guarda en el backend.
- [~] (verificado 2026-10-21: existe `/accessibility`, enlazada desde la landing y el login, con fecha 13-oct-2026, y hay `SkipLink` en el layout; **faltan** las pruebas manuales con teclado y NVDA/VoiceOver y el reporte guardado, y revisar que la fecha siga vigente) Declaración de accesibilidad (fecha de prueba, estándar, límites, contacto) y enlace
      "saltar al contenido". Publicarla solo después de correr axe y las pruebas manuales.
- [~] (verificado 2026-10-21: el login ya usa `<label htmlFor>`; **falta medir contraste** y revisar los `alt` de las banderas, que no aparecen como `MX`/`EN`) Accesibilidad del login y de la landing: las `<label>` son estilos en línea sin
      `htmlFor` ni `aria-*` a la vista (verificar), textos de 10.5 px en gris tenue (medir
      contraste en claro y oscuro), y `alt="MX"` / `alt="EN"` en las banderas del selector de
      idioma no describen el control.
- [~] (verificado 2026-10-21: script `lint` ahora es `eslint` y la config migró a flat config, **sin commit**; `bun run lint` corre pero da **16 errores y 30 avisos** en código previo: `react/no-unescaped-entities` x8 en `calendario-palmas`, `react-hooks/refs` x3, `purity` x2, `set-state-in-effect` x2 y 1 `no-explicit-any`) `package.json`: el script `lint` usa `next lint`, que ya no existe en Next 16; migrar a
      `eslint`. Sin lint no hay red automática de accesibilidad.
- [ ] (verificado 2026-10-21: **sigue fija**) `packages.tsx` llama a `https://e-commetrics.com/send-package-email` con la URL fija:
      moverla a variable o a `/api` junto con la migración a Vercel (punto 2).

**CRM y dashboard (datos de terceros; aquí Ecommetrica es encargado, no responsable):**

- [ ] El CRM guarda nombre, correo, teléfono, campaña y los campos crudos del formulario de
      Facebook (`fieldDataRaw`). Definir retención y borrado, y cómo se atiende una solicitud
      ARCO sobre un lead.
- [ ] Envíos de correo y WhatsApp desde `SendMessageModal` sin registro visible de
      consentimiento ni texto de baja. Guardar de dónde viene el consentimiento por lead
      (campo nuevo en el backend de Reforma, otro repo) y agregar la baja a las plantillas.
- [ ] Eventos CAPI de Facebook al cambiar un lead de etapa: para clientes médicos (Reforma
      Dental, Lumbán, Monge, Cesia, Palmas) no deben viajar datos de salud a Meta. Revisar
      qué campos y qué etapas disparan el evento y apagarlo o filtrarlo en esos clientes.
- [ ] Contrato de encargo con cada cliente cuyo CRM o dashboard administramos, y lista de
      subencargados (hosting, SMTP, WhatsApp, Meta, proveedor de IA del chatbot).
- [ ] Plan de respuesta ante una brecha. Se relaciona con el punto 3: hoy hay rutas sin
      autenticación que cambian contraseñas y exponen hashes, lo que ante la ley es una
      brecha de seguridad de datos personales. Cerrar el punto 3 antes que lo demás de este
      punto.

**Pruebas y evidencia:** axe en cada pantalla pública y en el dashboard, pasada con teclado y
con NVDA y VoiceOver sobre el login y los formularios, y reporte guardado con fecha y quién lo
hizo. No publicar declaración ni VPAT sin eso.

**Qué no publicar:** nada de "cumplimos con CCPA" ni afirmaciones sobre la situación legal de
Ecommetrica, ni los reportes de prueba, el inventario de tags o lo relativo al riesgo personal
por el DBA. Umbrales del CCPA y mención de California en la web: ver `Ecommetrica/BACKLOG.md`.

**Límites:** el frontend sigue siendo estático hasta migrar a Vercel (punto 2); los encabezados
de seguridad dependerán del hosting actual. La bitácora ARCO y el registro de consentimientos
no tienen dónde vivir si no se agrega almacenamiento en el backend.

**Orden sugerido (después del punto 3):** 1) política, términos, `lang` y consentimiento en
paquetes; 2) revisar CAPI y envíos del CRM para clientes médicos; 3) accesibilidad con pruebas
y declaración; 4) aviso del chatbot y contratos de encargo.

## 5. Ideas para más adelante

- **Login único** entre el dashboard y el CRM (hoy son dos logins separados, decisión de
  2026-09-29). Reconsiderar si hay 3 o más apps con login propio, si los usuarios del CRM
  crecen o rotan mucho, o si se ofrece el CRM a otros clientes. Requiere un endpoint de
  token en el backend del dashboard y firma asimétrica (ES256). Antes hay que cerrar el
  punto 3.
- **Pantalla de usuarios dentro del CRM** (crear, listar, borrar). Hoy se crean por SQL;
  ver `ReformaDental2025/CRM_USUARIOS.md`. No compensa con pocos usuarios.
- **Pruebas** de la lectura de reglas y del motor de automatización del CRM (un bug ahí
  pasó inadvertido).
- **Campana de notificaciones conectada al CRM** (idea del 2026-10-28). La campana anterior
  (`src/components/notification-bell.tsx`) era de muestra: contador fijo en 3, punto rojo siempre
  encendido y sin clic. **Se quitó del encabezado del dashboard el 2026-10-28** (recuperable con
  `git checkout -- src/components/notification-bell.tsx`, aunque no tenía lógica aprovechable).
  Propuesta para cuando el equipo use el CRM a diario:
  - Con sesión del CRM, mostrar lo que requiere atención: tareas vencidas y de hoy (incluye "Call
    within 1 hour"), leads nuevos desde la última vez que se abrió la campana, y citas del sitio que
    aún no están en el CRM (pestaña Web).
  - Al hacer clic, una lista donde cada elemento lleva al lead o a la pestaña Web. El punto rojo
    solo aparece si hay algo.
  - **Solo frontend** (2 o 3 archivos): los datos ya salen de `/crm/tasks`, `/crm/leads` y
    `/crm/appointments`. "Desde la última vez" se guarda en el navegador (`localStorage`).
  - Limitación: el dashboard y el CRM tienen logins separados. Sin sesión del CRM la campana se
    oculta (o mostraría otras apps si algún día se conectan). Se simplifica con el "Login único".
  - Accesibilidad: botón con `aria-label` y el número de pendientes anunciado, no solo un punto de
    color.

## Actualización 2026-10-15 (cumplimiento)
- Rama de trabajo: `compliance`, creada desde `main`. El sitio de producción se sirve como exportación estática desde `main`; la rama `vercel` no se puede subir a cPanel.
- Hechos en frontend: `prefers-reduced-motion` (CSS global y `motion-provider.tsx`), cookies `lang` y `sidebar_state` con `SameSite=Lax` y `Secure` en https (`src/lib/cookies.ts`), banderas del selector de idioma decorativas con `aria-label`, captura de red e inventario (documento fuera del repo) y borradores de procesos de conservación, ARCO, brechas y subencargados.
- Pendiente con visto bueno: corregir `e-commetris.com` en `src/app/layout.tsx` (línea 49) y quitar la limitación de movimiento reducido de `src/app/accessibility/page.tsx` (líneas 41 y 88). La tarea 2.10 (URL fija de `packages.tsx`) sigue en pausa con la migración a Vercel.
- Detalle en `BACKLOG-compliance-remediation.md` (carpeta `e-commetrics`, fuera del repo).

## Actualización 2026-10-21 (revisión de cumplimiento y seguridad)

- Las casillas de la sección 4 se contrastaron con el código: `[x]` = hecho y verificado, `[~]` =
  parcial (la nota dice qué falta). **Nada de esto tiene commit todavía.**
- Seguridad del backend del dashboard (sección 3): primer paso preparado en
  `ReformaDental2025/server/dashboard.js` (middleware `requireAuth` y `requireAdmin`, rutas de usuarios
  protegidas, `GET /api/users` sin hashes, `JWT_SECRET` desde el entorno con respaldo). **Sin desplegar.**
  Antes de subirlo: comparar `dashboard.js` con el de producción (está sin trackear y no se sabe si
  coinciden), subir **junto con el frontend** (las llamadas ahora mandan `credentials: "include"`) y
  probar con un admin: lista de usuarios, crear, editar, borrar y permisos. Efecto conocido: un cliente
  que abre su proyecto ya no verá el correo del dueño, porque esa pantalla usa `GET /api/users`. Siguen
  abiertas las rutas de proyectos, contenidos y subidas, la contraseña SMTP en el código y el correo
  con contraseña en texto plano.
- Paginación del sync de Facebook: preparada local en `ReformaDental2025`, sin desplegar (ver
  `crm_validacion_2026-10-20.md` §13).
