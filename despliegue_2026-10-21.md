# Despliegue paso a paso (preparado el 2026-10-21)

Dos despliegues **independientes**. Hazlos en días o momentos distintos, de uno en uno, y verifica antes de
pasar al siguiente. Nada de esto se ha subido. Los commits los haces tú; este documento no los incluye.

| Parte | Qué sube | Servidor | Riesgo |
|---|---|---|---|
| **A** | Backend de Reforma con la paginación del sync de Facebook | `reformadental.com` | Medio: ver el cuidado de CAPI en A0 |
| **B** | Frontend del dashboard + `dashboard.js` con autenticación en las rutas de usuarios | `e-commetrics.com` | Medio: puede bloquear pantallas de administración si algo no coincide |

**Estado actual (verificado):** el `out/server.js` local se construyó a las 13:07 del 2026-10-21 y trae la
recuperación de efectos de creación (`effects_fired_at`), pero **no** trae la paginación. La columna ya está
en MySQL de producción. `dashboard.js` local tiene los cambios de seguridad, sin subir.

## 0. Antes de cualquier despliegue

- [ ] Pasó la comprobación de ~5:50 PM Tijuana del 2026-10-21 ("Follow up again" salió una sola vez).
- [ ] No hay un lead nuevo entrando en este momento (revisa Activity y Last sync en Settings).
- [ ] Haz los respaldos de la parte que toques (A1 o B2). Un respaldo sin descargar a tu PC no cuenta.

---

## Parte A. Backend de Reforma: paginación del sync de Facebook

### A0. Cuidado antes de empezar (leer completo)

Hoy el sync lee solo la **primera página** de cada formulario (~25 leads). La paginación lee **todas**. Si en
Facebook hay leads más antiguos que nunca se importaron, el siguiente ciclo los **crearía como leads nuevos** y
por cada uno:

- enviaría un evento CAPI "New" **real** a Meta, con datos de leads viejos (distorsiona la atribución);
- crearía una tarea "Call within 1 hour" ya vencida.

Compruébalo **antes** de subir:

- [ ] En Meta (Leads Center o el formulario), cuenta cuántos leads tienen en total los formularios de la
      página. El CRM tiene 21 leads, de los cuales 2 son de prueba creados a mano o por el formulario de prueba.
      **Si Facebook tiene más de los que el CRM muestra, avísame antes de subir**: decidimos si importarlos o
      si hay que evitar los eventos CAPI de esos leads antiguos.
- [ ] Si el total coincide, la paginación solo descubrirá lo que ya existe y `created` será 0.

### A1. Respaldo

1. cPanel → Administrador de archivos → carpeta de la app de Reforma. Descarga a tu PC una copia del
   `server.js` que está en producción y renómbrala `server.js.bak-2026-10-21`.
2. **No sobrescribas ni borres `server/public/`** (imágenes subidas): un redeploy que la reemplace las borra.
3. phpMyAdmin: exporta `crm_leads` (Exportar, SQL). No cambia nada, pero es la tabla sensible.

### A2. Construir

En tu PC, desde la carpeta `ReformaDental2025/server`:

```
bun run build
```

Comprobaciones (deben dar lo que dice):

```
node --check out/server.js          # sin salida = sintaxis correcta
grep -c fetchAllPages out/server.js         # mayor que 0 (hoy da 0)
grep -c recoverPendingLeadEffects out/server.js   # mayor que 0
```

### A3. Subir y reiniciar

1. Sube `out/server.js` y renómbralo `server.js` en la carpeta de la app (reemplaza el actual, que ya
   respaldaste).
2. cPanel → Setup Node.js App → la app de Reforma → **Restart**.

### A4. Verificar

1. Una sola consulta (despierta la app, así que no repitas):

   ```
   curl -s https://reformadental.com/health
   ```

   Debe traer `"status":"ok"`, `crm.scheduler: true`, `crm.cronEndpoint: true` y `uptimeSeconds` pequeño.
2. **Espera al menos 5 minutos** y consulta otra vez: `lastTick` debe traer hora y `"ok": true`.
3. En el CRM → Settings: **Last sync** avanza y **Last error** vacío.
4. Provoca un ciclo y lee el resumen (necesitas tu `CRM_CRON_TOKEN`; no lo pegues en el chat):

   ```
   curl -s -X POST -H "X-Cron-Token: <tu-token>" https://reformadental.com/crm/cron/tick
   ```

   Esperado: `"ok": true` y en `sync`, **`"created": 0`**. Si `created` es mayor que 0, **detente y avísame**
   (A0). Si responde `202 skipped`, espera 1 minuto y repite (hubo un tick hace menos de 60 s).
5. Rutas del calendario (cada despliegue): `curl -i https://reformadental.com/api/appointments` y
   `curl -i https://reformadental.com/fechas-bloqueadas`, ambas con 200.
6. Revisa en el CRM que el número de leads sigue en **21**.

### A5. Revertir

Sube `server.js.bak-2026-10-21` como `server.js` y reinicia la app. La columna `effects_fired_at` puede
quedarse: el código anterior la ignora.

---

## Parte B. Dashboard: frontend + `dashboard.js`

**Qué cambia:** `GET /api/users` (ahora sin hashes), `PUT` y `DELETE /api/users/:id`, `POST /api/register` y
`POST /api/users/:id/apps` pasan a exigir una sesión **de administrador**. `JWT_SECRET` se lee del entorno, y
mientras no lo definas se usa el valor actual: **no se cierran sesiones al desplegar**.

**Efecto conocido:** un cliente que abre su proyecto ya no verá el correo del dueño (esa pantalla usaba
`GET /api/users`). El resto de su pantalla funciona.

**Sigue abierto después de esto:** rutas de proyectos, contenidos y subidas sin protección, contraseña SMTP en
el código, y `/api/register` manda la contraseña en texto plano por correo.

### B1. Comparar con producción (obligatorio)

`dashboard.js` está **sin trackear** y CRM_STATUS.md §7 lo llama "solo de referencia": no se sabe si coincide
con lo que corre en `e-commetrics.com`. Si difiere y lo subes tal cual, **borras cambios que solo existen en
producción**.

1. cPanel → carpeta de la app Node de **e-commetrics.com** (no la de Reforma). Descarga a tu PC el archivo que
   corre (puede llamarse distinto) como `produccion-dashboard.js`.
2. Compara con el local (desde la carpeta que tengas ambos):

   ```
   git diff --no-index --stat produccion-dashboard.js ReformaDental2025/server/dashboard.js
   git diff --no-index produccion-dashboard.js ReformaDental2025/server/dashboard.js
   ```

3. Las **únicas** diferencias deben ser: el bloque nuevo de `JWT_SECRET`, `requireAuth` y `requireAdmin`,
   `requireAdmin` en 5 rutas, y el `SELECT id, email, userName, role, profileImage` de `GET /api/users`.
   **Si hay más diferencias, no subas: pásamelas y las fusionamos.**
4. Si la contraseña de SMTP o cualquier valor secreto aparece en el diff, no lo pegues en el chat.

**Resultado de B1 (2026-10-21):** el usuario subió su copia del backend actual como
`ReformaDental2025/server/backend-actual.js`. Es **idéntica byte a byte** (mismo MD5) al `dashboard.js`
original sobre el que se hicieron los cambios, así que `server/dashboard.js` = `backend-actual.js` + solo los
cambios de seguridad (7 bloques). Qué subir: `server/dashboard.js`, con el nombre que tenga el archivo en
producción. Ambos archivos contienen secretos: **no commitearlos**.

### B2. Respaldo

- [ ] El archivo de producción que descargaste en B1, renombrado con la fecha.
- [ ] La carpeta `public/` de esa app (imágenes de perfil, proyectos y contenidos): descarga una copia.
- [ ] phpMyAdmin, base del dashboard: exporta `users` y `users_apps`.
- [ ] El `out/` actual del sitio en `public_html` (descárgalo antes de reemplazarlo).

### B3. Frontend primero

El frontend nuevo manda la cookie en las llamadas de administración y es compatible con el backend viejo, así
que subirlo antes no rompe nada.

```
cd e-commetrics-dashboard
bun run build
```

Esperado: termina sin errores y genera `out/` con las rutas (`/dashboard/access-app`,
`/dashboard/update-client`, etc.). Sube `out/` a `public_html` (reemplazando) y abre el sitio en una ventana
privada.

Este build también incluye, sin relación con la seguridad: las páginas de privacidad y accesibilidad, el
consentimiento del formulario de paquetes, el aviso del chatbot, y SMS y WhatsApp desactivados en el CRM.
Revisa esas pantallas en el navegador **antes** de subir; solo se comprobó que compilan.

### B4. Backend

1. Sube el `dashboard.js` nuevo con el **nombre exacto** del archivo que corre en producción.
2. cPanel → Setup Node.js App → la app de e-commetrics.com → **Restart**.
3. En el registro de la app debe aparecer el aviso `[auth] JWT_SECRET no definido en el entorno...`. Es lo
   esperado por ahora.

### B5. Verificar

**Desde tu PC, sin sesión (cada una debe dar 401):**

```
curl -i https://e-commetrics.com/api/users
curl -i -X PUT https://e-commetrics.com/api/users/999999 -H "Content-Type: application/json" -d "{\"email\":\"x@x.com\",\"role\":\"client\"}"
curl -i -X DELETE https://e-commetrics.com/api/users/999999
curl -i -X POST https://e-commetrics.com/api/register -H "Content-Type: application/json" -d "{}"
```

Si el `PUT` con id inexistente responde **404** en vez de 401, la protección **no** está activa: revierte.

**En el navegador, como admin:**

- [ ] Login normal (las sesiones existentes siguen valiendo).
- [ ] Access App: la lista de usuarios carga y se guardan permisos.
- [ ] Update Client: la lista carga; edita el correo de un usuario **de prueba** y bórralo solo si es de prueba.
- [ ] Create Client: crea un usuario de prueba.
- [ ] Create Project / Create Project Content: el selector de clientes se llena.
- [ ] Update Project: el selector de clientes se llena.

**Como cliente (no admin):**

- [ ] Login y su lista de proyectos.
- [ ] Abre su proyecto: carga el contenido (el correo del dueño queda vacío, es lo esperado).
- [ ] La barra lateral muestra sus apps (usa `GET /api/users/:id/apps`, que **no** cambió).

Si algo del admin falla con 401: cierra sesión y vuelve a entrar; si persiste, revierte (B6) y avísame con el
mensaje de la consola del navegador (pestaña Network).

### B6. Revertir

1. Sube de nuevo el archivo de producción que respaldaste y reinicia la app.
2. Si hizo falta, restaura el `out/` respaldado en `public_html`.

### B7. Rotar `JWT_SECRET` (después, aparte)

Hasta que lo hagas, el secreto sigue siendo el que está escrito en el código. Para cerrarlo:

1. Genera un valor aleatorio largo (48 bytes en hex) y **no lo pegues en el chat ni en el repo**.
2. cPanel → Setup Node.js App → la app de e-commetrics.com → agrega la variable `JWT_SECRET`.
3. Reinicia. **Todas las sesiones se cierran** (hazlo fuera de horario y avisa a los clientes que vuelvan a
   iniciar sesión). El aviso del registro desaparece.

---

## Orden recomendado

1. Hoy tras las 5:50 PM: nada. Solo la comprobación.
2. Parte A (paginación), cuando termines A0.
3. Parte B, otro día, con calma para B1 y las pruebas de B5.
4. B7 al final, fuera de horario.

## Lo que no incluye este despliegue

- El monitor externo, las otras reglas de automatización y el segundo usuario del CRM.
- WhatsApp, SMS y el asistente.
- Los 16 errores de lint que ya existían.

## Archivos a no subir al repo

`server/dashboard.js` (contiene secretos) y `server/backup.js` (no lo creó este trabajo). Si vas a commitear
esos cambios del dashboard, saca primero los secretos del archivo o mantenlo fuera del repo.

## Resultado del despliegue (2026-10-21, ~2:40 PM Tijuana)

El usuario subió el backend de Reforma (con paginación), el frontend y `dashboard.js`.

**Verificado desde fuera (sin sesión):**
- e-commetrics.com: `GET /api/users`, `PUT` y `DELETE /api/users/:id`, `POST /api/register` y
  `POST /api/users/:id/apps` responden **401**. `GET /api/projects` sigue en 200 y `GET /api/profile` en 401.
  `/`, `/legal/privacy-policy` y `/accessibility` responden 200.
- reformadental.com: arranque 21:37:58 UTC; primer tick con el código nuevo a las 21:40:02 UTC, `ok: true`,
  2.8 s (igual que antes, sin importaciones extra). El CRM **sigue en 21 leads** tras ese tick (comprobado
  por el usuario), así que la paginación no importó leads antiguos y no hubo eventos CAPI nuevos por eso.

**Sin verificar:**
- Que el `server.js` de producción sea el build con paginación (`/health` no expone versión).
- Pantallas nuevas del frontend (privacidad, accesibilidad, consentimiento, canales desactivados) vistas en el navegador.
- `JWT_SECRET` sigue sin definirse en el entorno de cPanel (B7, aparte).

**Verificado por el usuario (~4:00 PM Tijuana):** las pantallas de admin y de cliente de e-commetrics.com
siguen funcionando tras el despliegue. `/health` de Reforma con tick `ok` a las 23:00 UTC.
