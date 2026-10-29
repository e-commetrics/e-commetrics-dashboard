# CRM: continuación de la validación y plan del cron (2026-10-19)

Continuación de `crm_validacion_2026-10-16.md`. Alcance: **solo correo**; WhatsApp y SMS siguen en
pendiente a propósito. El CRM v2 sigue en pausa: ver `crm_v2_backlog.md`.

> No se guardan aquí contraseñas, tokens ni correos de pacientes.

## Dónde nos quedamos

**Hecho el lunes 2026-10-19:** pasos 11 y 12 de la validación, y el hallazgo 1 de la sección 6 del
documento del viernes queda **confirmado en vivo**. Se diagnosticó por qué la app se duerme y se
listaron opciones para el cron. **No se cambió código** ni en el dashboard ni en Reforma.

**Decisión tomada (2026-10-19):** por ahora hay un solo CRM (Reforma), así que se **estabiliza en el
backend actual** sin SSH: un endpoint protegido que dispara el tick y una línea en Cron Jobs de
cPanel (secciones 8 y 9). La migración a un backend propio queda para cuando haya un segundo CRM.
**Desplegado y verificado esa misma noche** (sección 10). Sigue sin commit en
`ReformaDental2025` (rama `feature/crm-module`; `server/dashboard.js` sin trackear y con secretos,
no usar `git add .`).

## Para retomar mañana (2026-10-20)

> **Actualización 2026-10-20:** esta lista se ejecutó. El resultado, la causa del cron roto y los
> pendientes nuevos están en `crm_validacion_2026-10-20.md`.

Estado al cierre del 2026-10-19: el cron está desplegado y verificado (sección 10). Lo que sigue,
en este orden.

### A. Revisión de la mañana (5 minutos, antes de tocar nada)

- [ ] `GET https://reformadental.com/health`: `uptimeSeconds` debe ser de **horas** (la app debió
      pasar la noche despierta; es la mejor prueba de que el cron funciona), `lastTick.finishedAt`
      de hace pocos minutos y sin `warnings`. Si `uptimeSeconds` es de segundos o minutos: revisar en
      cPanel → Cron Jobs que el trabajo siga ahí (y el token), y el correo de la cuenta
      `clinicareforma`, donde llegaría el error de `curl` (el comando lleva `-f`).
- [ ] Settings del CRM: anotar **Last sync** (debe ser de hace menos de 10 minutos) y **Last error**
      (nunca se ha reportado). Si Last error trae texto, copiarlo.
- [ ] Ficha del lead de prueba, pestaña Tasks: deben seguir solo las dos "Follow up again"
      completadas y "Call within 1 hour". Una tercera nueva sería un problema.

### B. Pendientes de hoy que no se hicieron

- [ ] **Monitor externo** a `/health` cada 1 a 3 minutos, que avise si deja de responder o si trae
      `warnings`. Es alarma, no programador. Antes de elegir servicio, verificar el intervalo
      mínimo de su plan gratuito.
- [ ] **Reglas de automatización:** en Settings, reportar disparador y si están encendidas las
      tres reglas que faltan (las dos de mensaje siguen apagadas a propósito).
- [ ] **Paso 13:** crear el segundo usuario del CRM (`/health` marca `users: 1`; guía en
      `ReformaDental2025/CRM_USUARIOS.md`). Sin pegar contraseñas en el chat.
- [ ] **CRM viejo de Next.js:** confirmar si sigue sincronizando Facebook en paralelo. Si sigue,
      decidir cuándo apagarlo (`CRM_STATUS.md` §6.9).
- [ ] **Commit** en `ReformaDental2025` (rama `feature/crm-module`) y en `e-commetrics-dashboard`
      (rama `compliance`), sin `git add .`. Hay que decidir archivo por archivo; ver "Cuidados".

### C. Con fecha: comprobar que "Follow up again" vuelve una sola vez

- [ ] Alrededor del **2026-10-21, 5:50 PM hora de Tijuana** (aproximado: 48 h después de que se
      completó la tarea del 19-oct) y en el tick siguiente, el lead de prueba debe recibir **una**
      "Follow up again" nueva, y no más.
- [ ] **Solo después de eso**, probar `touchLead` con un mensaje: enviar una plantilla al lead de
      prueba y comprobar que `updatedAt` cambió (columna `updatedAt` del CSV exportado desde el
      CRM, o `SELECT updated_at FROM crm_leads WHERE ...` en phpMyAdmin). Se hace al final porque
      enviar un mensaje reinicia el reloj de 48 h y arruinaría la comprobación anterior.

### D. Después, según el tiempo

- [ ] Correo hacia Outlook/Hotmail.
- [ ] Permiso `CRM` con un cliente real, con y sin permiso.
- [ ] Cerrar la página del CRM por permiso o rol (hoy se entra por URL).
- [ ] Hallazgo 3 (un envío fallido de una regla de mensaje se repetiría en cada tick) antes de
      encender cualquier regla de mensaje.
- [ ] Seguridad de las rutas sin autenticación del calendario de Reforma y del backend del
      dashboard (lo más grave de los pendientes).
- [ ] Comentario de `crm/cli.js` que menciona `build.js` (no existe; el script está en
      `package.json`). Solo documentación en el código.
- [ ] Cuando haya un segundo CRM: una instancia por CRM en un VPS (sección 8).

### E. Por decidir (no urgente): asistente con IA del CRM v2

- [ ] **Decidir si se aplica o no.** Hoy solo hay análisis y no se construye nada hasta decidir.
      No es tarea de mañana ni tiene fecha. Los cambios desde el 14-oct, los criterios para decidir
      y las opciones A, B y C están en `crm_v2_backlog.md`, sección "Actualización 2026-10-19".
      Resumen: antes de cualquier opción distinta de no aplicar hay que cerrar las rutas sin
      autenticación y pedir al dueño la decisión de privacidad (datos de salud).

### Cuidados

- No cambiar la etapa de leads reales ni crear leads de prueba: **CAPI está en modo real** y cada
  cambio manda un evento a Meta. No activar reglas de mensaje ni usar WhatsApp/SMS.
- Hasta cumplir la comprobación de 48 h (C), no completar tareas ni enviar mensajes en el lead de
  prueba. Mirar la ficha no afecta.
- No usar `git add .`: `ReformaDental2025/server/dashboard.js` tiene secretos y está sin trackear,
  y `server/backup.js` hay que revisarlo. En el dashboard, `BACKLOG.md` figura en conflicto (`UU`) y
  hay trabajo de cumplimiento mezclado.
- No pegar el token del cron ni contraseñas en el chat ni en documentos.
- Consultar `/health` despierta la app si estaba parada; para pruebas limpias, consultarlo una sola
  vez y leer `uptimeSeconds` al llegar.

## 1. Paso 12: ¿la app se duerme? Sí

Datos de **Settings** del CRM al empezar el lunes (la hora actual era algo después de las 10:05):

| Dato | Valor |
|---|---|
| Last sync | 2026-10-19 7:00:01 AM |
| Last token check | 2026-10-19 10:05:14 AM |
| Last CAPI event | 2026-10-14 6:03:19 PM |

Lectura:

- **Last sync 7:00:01:** cae en un múltiplo de 5 minutos, así que lo hizo el cron, no un clic. Con el
  cron en `*/5`, han pasado más de 3 horas sin otro sync.
- **Last token check 10:05:14:** según `scheduler.js` ese check corre a las 8:00 y al arrancar el
  proceso. Las 10:05 no es hora de cron, así que el proceso **arrancó** a esa hora, probablemente
  despertado por la visita al CRM.
- Matiz: una visita al sitio o al calendario de `reformadental.com` también despierta la app, por
  lo que un Last sync reciente no sería concluyente. Lo que lo hace concluyente es el hueco de 3 horas.
- El viernes la app sí estaba despierta a las 6:05 PM (la tarea "Follow up again" se creó en ese
  tick), así que el estado depende del tráfico.

**Causa probable:** el hosting usa Passenger y cierra el proceso tras 5 minutos sin peticiones
(`passenger_pool_idle_time`, 300 s por defecto según su documentación). El cron `*/5` está dentro
del proceso Node (`crm/scheduler.js`), así que muere con él. Es una **inferencia**: no se ha
verificado que el hosting de Reforma use Passenger ni si el plan permite cambiar ese ajuste.

**Consecuencia:** los leads de Facebook y las automatizaciones solo se procesan cuando alguien
despierta la app. Un lead que entre de madrugada o en fin de semana puede esperar horas sin sync ni
evento CAPI.

## 2. Paso 11: tarea "Call within 1 hour"

En la ficha del lead de prueba (Kevin Okhuysen):

- "Call within 1 hour", vence 9/29/2026 6:55:02 PM, abierta y vencida. Se creó a las 5:55:02 PM, un
  segundo después de que el lead entró por Facebook (5:55:01). La regla se dispara sola con
  `new_lead`, una sola vez. **Paso 11 cubierto** con ese lead.

## 3. Hallazgo 1 confirmado: "Follow up again" se recrea

Secuencia observada en la ficha del mismo lead:

1. El lead cumplió 48 h en "Contacted" el 16-oct a las 6:03 PM. Se creó **una** tarea "Follow up
   again", con vencimiento 6:05:01 PM. No hubo duplicados mientras seguía abierta
   (`automation.js:47` evita repetir una tarea abierta idéntica).
2. Se completó la tarea el 19-oct.
3. Primera comprobación, unos 10 minutos después: no apareció ninguna nueva. **No concluyente**:
   la app estaba dormida y no hubo tick.
4. Tras despertar la app y esperar un tick de 5 minutos: apareció una **nueva** "Follow up again" con
   vencimiento 10/19/2026 10:25:01 AM. La anterior seguía completada.

**Por qué ocurre:** `runAutomationTick` compara `lead.updatedAt` con las 48 h, y ese campo solo se
actualiza al cambiar la etapa o las notas (`repo/leads.js:154` y `:180`). Completar una tarea o
mandar un mensaje no cuenta como actividad (hallazgo 2). Mientras el lead siga en "Contacted", la
tarea reaparece en máximo 5 minutos cada vez que se completa.

**Nota:** crear una tarea no deja registro en **Activity**; solo se ve en **Tasks**. Una ausencia de
línea en Activity no prueba nada.

**Estado actual del lead de prueba:** tiene una "Follow up again" abierta y vencida (10:25 AM del
19-oct), además de la completada y de "Call within 1 hour".

## 4. Opciones para el cron y orden de trabajo

### 4.1 Alternativas para que el sync no dependa de la app despierta

| # | Opción | Ventajas | Desventajas |
|---|---|---|---|
| A | Ping externo a `/health` cada 1 a 3 min (monitor) | Sin código. También avisa si el CRM se cae | Parche. Con 5 min exactos queda al borde del idle time. Si el hosting mata el proceso por memoria, se pierde el sync. Depende de un tercero |
| B | **Cron de cPanel** que corre el trabajo del CRM | No depende de que la app esté viva. Aislado del resto del backend | Cambio de código en Reforma |
| C | Programador externo (cron-job.org, GitHub Actions, Cloudflare Workers) a un endpoint con token | Respaldo fuera del hosting | Endpoint nuevo con token. GitHub Actions puede retrasarse minutos |
| D | Cambiar de hosting (VPS, Render, Railway, Fly) | Resuelve la raíz | Costo y migración en producción |
| E | Webhook de Meta (Leadgen) en vez de sondear | Tiempo real | Configuración y posible revisión de Meta. No cubre reglas por tiempo |

### 4.2 B se puede aplicar solo al CRM

> **Superado por la sección 9.** Este plan (flag `--crm-tick` con Node desde cPanel) necesita SSH
> para probarse y la ruta del entorno virtual de Node. Se eligió la variante por HTTP, que no los
> necesita. Se conserva por el análisis del código.

Revisado en el código, no probado en el servidor:

- Todo el cron del CRM vive en `crm/scheduler.js` y se arranca con `startScheduler()` en
  `crm/index.js:77`. El calendario y las citas no lo usan.
- Ya existe `crm/cli.js`, que permite correr comandos del CRM como flags de `server.js` sin levantar
  el servidor ni el cron (`--crm-seed`, `--crm-create-user`, `--crm-migrate`).
- Plan: agregar `--crm-tick` (`syncFacebookLeads()` y luego `runAutomationTick()`) y
  `--crm-check-token`, y en cPanel:

```
*/5 * * * *  node server.js --crm-tick
0 8 * * *    node server.js --crm-check-token
```

- Sin ruta HTTP nueva ni token expuesto.
- Cambios previstos:
  1. `crm/cli.js`: los dos flags.
  2. Un **candado** para que dos ticks no corran a la vez (cubre también el hallazgo 4).
  3. Apagar el `node-cron` interno con una variable de entorno (por ejemplo `CRM_INTERNAL_CRON=off`),
     para evitar doble ejecución y poder volver atrás sin redeploy.
  4. Regenerar `out/server.js` con el build.
- Conservar el `try/catch` por tarea: el proceso del CRM es el mismo que sirve las citas.

**Por verificar antes de programar nada:**
- Que la sección **Cron Jobs** de cPanel esté disponible y cuál es la ruta completa al Node de la
  app (a veces necesita su entorno virtual).
- Que `node server.js --crm-...` realmente salga sin levantar el servidor (lo dice el comentario de
  `cli.js`, no se ha ejecutado).
- Qué muestra **Setup Node.js App** sobre inactividad o reinicio.
- El consumo de recursos de un proceso nuevo cada 5 minutos en el hosting.

### 4.3 Orden de trabajo (por decidir)

| Opción | Orden | Ventaja | Riesgo |
|---|---|---|---|
| 1 | Hallazgo 1, luego cron | El cron nace sin el bug conocido | Bajo. Los leads siguen entrando tarde mientras tanto |
| 2 | Cron, luego hallazgo 1 | Los leads se sincronizan a tiempo ya | Medio. "Follow up again" se recrea cada 5 min; se reduce apagando la regla "Contacted > 48h" |
| 3 | Monitor hoy y las dos correcciones después | No se toca producción hoy | Casi nulo, pero no resuelve la causa |

**Recomendación:** opción 1, más el monitor de la opción 3 desde hoy.

### 4.4 Correcciones posibles del hallazgo 1

1. Que completar tareas y enviar mensajes actualice `updated_at` del lead. Cambio pequeño.
2. Que la regla dispare una sola vez por lead, guardando que ya se disparó. Más robusto, pero
   necesita una columna o tabla nueva.

Recomendado: la 1 primero y revisar la 2 después.

## 5. Estado de la validación

| Paso | Estado |
|---|---|
| 1, 3 al 9 | Hechos el viernes |
| 2 (permiso `CRM` con un cliente) | Omitido, sin acceso a un cliente |
| 10 (reglas de automatización) | Faltan por reportar disparador y estado de **tres** reglas |
| 11 (tarea "Call within 1 hour") | **Cubierto** con el lead de prueba |
| 12 (¿la app se duerme?) | **Sí se duerme** (sección 1) |
| 13 (segundo usuario del CRM) | Pendiente: `/health` marcaba `users: 1`; ver `CRM_USUARIOS.md` |

## 6. Pendientes

- [x] **Decidir** el enfoque: estabilizar en el backend actual, sin SSH (sección 8).
- [x] **Implementar** el plan de la sección 9 (hecho el 2026-10-19, **solo en local, sin commit y sin
      desplegar**): `crm/services/tick.js` y `crm/routes/cron.js` nuevos; cambios en
      `crm/services/repo/leads.js` (`touchLead`), `repo/tasks.js`, `messaging/index.js`,
      `crm/scheduler.js`, `crm/index.js`, `crm/health.js` y `server/.env.example`. Sin cambios de
      SQL ni de frontend. Probado con simulaciones (18 comprobaciones: candado, token, códigos
      HTTP, `touchLead`) y el bundle compila. **No probado:** MySQL real, Facebook real, la ruta de
      `messaging` con `touchLead`, `/health` y el montaje en `index.js` (solo sintaxis y bundle).
      Respaldo de los archivos originales en la carpeta temporal de la sesión.
- [x] La variable `CRM_CRON_TOKEN` está en cPanel y la ruta está activa.
- [x] **Desplegado** (2026-10-19): build, `server.js` subido, `/health` con `cronEndpoint: true`,
      endpoint probado desde la PC y trabajo de Cron Jobs cada 5 minutos funcionando. Detalle y
      resultados en la sección 10.
- [x] Hallazgo 1 verificado en producción: tras completar "Follow up again" no se recreó la tarea.
- [ ] Poner un monitor externo a `/health` cada 1 a 3 minutos (alarma, no programador).
- [ ] Ver **Last sync** y **Last error** en Settings para distinguir las causas de la sección 7.7.
- [ ] Confirmar si el CRM viejo de Next.js sigue sincronizando Facebook en paralelo.
- [ ] Mientras se corrige: opcionalmente **apagar** la regla "Contacted > 48h" en Settings para no
      acumular tareas duplicadas.
- [ ] Reportar el estado de las otras tres reglas de automatización.
- [ ] Paso 13: segundo usuario del CRM.
- [ ] Del documento del viernes, siguen abiertos: permiso `CRM` con un cliente, correo hacia
      Outlook, cerrar la página del CRM por permiso o rol, hallazgo 3 (el 2 ya quedó corregido), y la
      seguridad de los backends sin autenticación.
- [ ] Trabajar en una rama aparte en `ReformaDental2025`, sin `git add .`.

**No hacer mientras se valida:** cambiar la etapa de leads reales, activar reglas de mensaje o usar
WhatsApp/SMS (CAPI está en modo real y cada cambio de etapa manda un evento a Meta).

## 7. Análisis del backend de Reforma (2026-10-19)

Leído del código de `ReformaDental2025/server` y de la documentación pública. No se tuvo acceso
al cPanel; lo que se sabe de él viene de lo que se pegó en la conversación y de `CRM_STATUS.md`.

### 7.1 Estructura y despliegue

- Fuente: `server/server.src.js`. Se compila con `bun build` (formato cjs, `--packages=external`)
  a `server/out/server.js`, que se sube a cPanel como `server.js`. `crm/` no se sube. No existe
  `build.js`; el script está en `package.json`.
- Node 22 en cPanel. El puerto está fijo en 3001 dentro del código.
- Para el CRM, `server.src.js` solo hace: `require("./crm/cli").run(...)` (línea 5) y
  `app.use("/crm", require("./crm").mount({db, mail, allowedOrigins}))` (línea 565). El cron del
  CRM se arranca dentro de `mount()` (`crm/index.js:77`).

### 7.2 Qué tan acoplado está el CRM al calendario

Poco. Solo recibe el pool de MySQL, el transporte de correo y los orígenes permitidos. Ya existe
`useStandalonePool()` (pool propio, usado por los comandos `--crm-*`) y `email.js` arma su propio
transporte con las variables `EMAIL_*` si no recibe el del calendario. Esto es lo que haría barata
una extracción futura.

### 7.3 Efectos al cargar `server.src.js`

Las líneas 44 a 83 se ejecutan siempre, aunque se pase un flag `--crm-*`: crean el pool del
calendario, prueban la conexión (`✓ Base de datos conectada`), imprimen la configuración de correo y
llaman a `mail.verify()`, que abre una conexión SMTP real. Consecuencia: ejecutar
`node server.js --crm-tick` desde cron mandaría correo de cPanel en cada ejecución y haría unas 288
conexiones SMTP al día. Por eso se descartó esa variante.

### 7.4 Semántica del sync y de las reglas

- `syncFacebookLeads()` nunca lanza: guarda el error en la base y devuelve `ok: false`.
- **Last sync solo avanza si el sync tuvo éxito** (`sync.js:109`). Un fallo no mueve la fecha.
- `runAutomationTick()` corre aunque el sync falle (el sync no lanza).
- Crear una tarea no deja registro en **Activity**; solo se ve en **Tasks**.
- El sync deduplica por `fbLeadgenId`, así que repetirlo no duplica leads.

### 7.5 Frontend y autenticación

- El dashboard llama a `CRM_API = "https://reformadental.com/crm"`, fijo en
  `webapp/crm/lib/api.ts`.
- Cookie `httpOnly; secure; sameSite: none` (otro dominio) y respaldo con `Bearer` en el cuerpo del
  login. `requireSameOrigin` acepta peticiones sin `Origin` (curl).

### 7.6 Documentación de Namecheap consultada

- **SSH** está desactivado por defecto y se activa con el plugin **Manage Shell**; entonces aparece
  **Terminal** en cPanel. `CRM_STATUS.md` decía "no hay terminal"; se puede cambiar.
- El artículo de Setup Node.js App **no dice nada** de inactividad, de que la app se duerma ni de
  límites de recursos, y no menciona Passenger.
- El cPanel del cliente muestra: máximo 5 trabajos de cron, no más seguido que cada 5 minutos.
- No se pudo verificar si Namecheap permite **Remote MySQL** en este plan (la búsqueda del sitio
  devolvió 403).

### 7.7 Qué se sabe y qué no sobre por qué la app se detiene

- **Sólido:** el check del token al arrancar es lo único que explica **Last token check 10:05:14**;
  el proceso arrancó a esa hora, o sea, no estaba corriendo antes.
- **No confirmado:** la causa. Puede ser cierre por inactividad (la documentación de Passenger fija
  300 s por defecto, pero no está confirmado que este hosting use Passenger ni ese valor), muerte
  por límite de memoria o procesos, un reinicio, o syncs fallando sin que se note.
- Cómo distinguir: leer **Last error** en Settings y, si existe, el log de errores de la app.

### 7.8 Hallazgos menores

- `crm/cli.js` y `CRM_STATUS.md` mencionan `server.js` y `build.js`; el archivo real es
  `server.src.js` y no hay `build.js`.
- `GET /health` avisa "el cron del CRM no esta arrancado" si el cron interno está apagado
  (`health.js:148`). Hay que ajustarlo si algún día se apaga el cron interno.
- El `.env.example` de la raíz tiene una cadena suelta al final; se confirmó que son datos
  genéricos, sin nada real.

## 8. Decisión de arquitectura

Hoy hay **un solo CRM** (Reforma). A futuro habrá varios dentro del dashboard.

### 8.1 Ruta 1 (elegida) y Ruta 2

| | Ruta 1: estabilizar en el backend actual | Ruta 2: backend propio (VPS) |
|---|---|---|
| Esfuerzo | Bajo, días | Alto, semanas |
| Soluciona la causa | No, la evita con un disparador externo | Sí, proceso siempre encendido |
| Riesgo | Bajo, reversible | Medio: mover datos de pacientes, cron doble mientras conviven |
| Dependencias sin verificar | `curl` en Cron Jobs, tiempos del sync | Base remota (Remote MySQL no verificado) o migrar tablas |
| Operación nueva | Ninguna | Servidor, SSL, backups, parches, monitoreo |
| Calendario | Intacto | Intacto |

**Se eligió la Ruta 1** porque resuelve ya el problema con un solo CRM, y la ventaja de la Ruta 2
solo aparece con el segundo CRM.

### 8.2 Cuándo pasar a la Ruta 2

- Cuando vaya a haber un segundo CRM.
- Si el hosting mata el proceso con frecuencia o el cron falla seguido.
- Si el volumen de leads hace insuficiente el tick de 5 minutos.

### 8.3 Varios CRM en el futuro

| Modelo | Descripción | Ventajas | Desventajas |
|---|---|---|---|
| M1 | Un backend para todos, con `tenant_id` | Un solo despliegue | El código es de un solo cliente (token de Facebook, plantillas, reglas y usuarios globales): refactor grande. Mezcla datos de pacientes de clientes distintos |
| M2 | Una instancia por CRM, con su `.env`, su base y su subdominio | Aislamiento total y casi sin cambios de código | Más procesos que administrar; el costo crece con cada cliente |

Recomendado: **M2** en un **VPS** con un proceso siempre encendido por CRM (`pm2` o Docker Compose).
Ahí el cron interno actual vuelve a funcionar y el problema de la app dormida desaparece. Un
subdominio de `e-commetrics.com` volvería las cookies same-site. La URL `CRM_API` tendría que pasar
a ser configurable por CRM. Dónde alojar datos de salud lo decide el dueño, no el desarrollo.

Costos orientativos (de artículos de terceros, sin verificar): Render siempre encendido ~$7/mes
(el plan gratis se duerme a los 15 min), Railway ~$5/mes más uso, Fly.io sin plan gratis, VPS
Hetzner ~€4.5/mes.

## 9. Plan elegido: tick por HTTP con Cron Jobs de cPanel (sin SSH)

El cron de cPanel no necesita SSH. En lugar de ejecutar Node, llama con `curl` a un endpoint del
propio backend. La petición despierta la app y el trabajo corre dentro del proceso, sin depender
del cron interno.

### 9.1 Cambios de código (solo backend; el frontend no cambia)

1. Endpoint `POST /crm/cron/tick` montado **antes** de `requireAuth`, con su propio chequeo de
   token en la cabecera `X-Cron-Token`:
   - El token viene de la variable `CRM_CRON_TOKEN` (mínimo 32 caracteres).
   - Sin la variable o con una demasiado corta, el endpoint queda apagado.
   - Comparación en tiempo constante.
   - Ejecuta `syncFacebookLeads()` y luego `runAutomationTick()` y devuelve un resumen.
   - Si se pasa de un tiempo máximo, responde que sigue en curso y deja terminar el trabajo.
2. **Candado** contra ejecuciones simultáneas (cubre el hallazgo 4), por ejemplo una marca de
   tiempo de la última ejecución para omitir si hay otra reciente.
3. **Hallazgo 1:** completar una tarea y enviar un mensaje actualizan `updated_at` del lead, para
   que "Follow up again" no se recree.
4. El cron interno puede quedarse; el candado evita la doble ejecución.

### 9.2 Despliegue

1. `cd server && bun run build`.
2. Subir `out/server.js` como `server.js`, como hasta ahora.
3. En Setup Node.js App, agregar `CRM_CRON_TOKEN`. Generarlo en la PC con
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. No pegarlo en el
   chat ni en el repo.
4. Reiniciar la app y comprobar `GET /health` en 200.

### 9.3 Prueba

1. Desde la PC, con PowerShell, hacer el `POST` al endpoint con el token. Debe responder con un
   resumen y **Last sync** debe moverse.
2. Repetir sin token o con uno incorrecto: debe rechazar.
3. Completar la tarea "Follow up again" del lead de prueba y esperar un tick: **no** debe aparecer
   otra.

### 9.4 Cron de cPanel

En Cron Jobs, cada 5 minutos (`*/5 * * * *`):

```
curl -fsS --max-time 90 --retry 2 -X POST -H "X-Cron-Token: <token>" https://reformadental.com/crm/cron/tick >/dev/null
```

`>/dev/null` evita correos por la salida normal; los errores seguirán llegando al correo del cron.
El token queda visible para quien tenga acceso al cPanel.

### 9.5 Verificación final

Dejar 20 minutos sin usar el CRM y comprobar que **Last sync** sigue avanzando solo. Después de
confirmarlo, poner el monitor externo a `/health` como alarma.

### 9.6 Reversión

Borrar la línea de Cron Jobs y quitar `CRM_CRON_TOKEN` (el endpoint queda apagado). El CRM vuelve
a funcionar como antes.

### 9.7 Riesgos y puntos sin verificar

- Que `curl` esté disponible en Cron Jobs de este plan.
- Cuánto tarda el sync en la práctica y si algún límite de tiempo del hosting lo corta.
- El trabajo corre dentro del mismo proceso que sirve las citas; el `try/catch` y el candado
  limitan el daño.
- Si el hosting detiene el proceso por memoria, el siguiente `curl` lo levanta, pero el sync de ese
  ciclo puede perderse.
- Si cPanel no deja usar `curl` desde Cron Jobs, la alternativa es un programador externo
  (cron-job.org, hasta cada minuto) que llame al mismo endpoint.

### 9.8 Git

Rama `feature/crm-module` de `ReformaDental2025`, todo sin commit. Antes de commitear: no usar
`git add .`; sacar `server/dashboard.js` del repo o agregarlo a `.gitignore`; revisar qué es
`server/backup.js`.

### Fuentes consultadas

- Namecheap, [Setup Node.js App](https://www.namecheap.com/support/knowledgebase/article.aspx/10047/2182/how-to-work-with-nodejs-app/)
  y [activar SSH](https://www.namecheap.com/support/knowledgebase/article.aspx/10040/2210/how-to-enable-ssh-shell-in-cpanel/).
- Passenger, `passenger_pool_idle_time`: <https://www.phusionpassenger.com/docs/references/config_reference>.
- [cron-job.org FAQ](https://cron-job.org/faq/).

## 10. Despliegue y verificación (2026-10-19, noche)

Horas en UTC (Tijuana = UTC−7).

| Hora | Qué pasó |
|---|---|
| 00:07 | Se desplegó el nuevo `server.js`. `GET /health`: `status: ok`, `cronEndpoint: true`, `scheduler: true`, `lastTick: null` (proceso recién arrancado) |
| 00:13 | `POST /crm/cron/tick` desde la PC: `ok: true`, `source: http`, **1234 ms**, `sync` con 20 leads traídos y 0 creados (la deduplicación funciona), reglas sin error |
| 00:26 y 00:38 | Dos consultas a `/health` encontraron `uptimeSeconds: 1`: la app estaba parada y la consulta la arrancó. Primera evidencia de que se detiene sin tráfico |
| ~00:40 | Primer comando de Cron Jobs **no se ejecutó** (no se creó el log). Causa probable: llevaba `-w "...%{http_code}..."` y en crontab un `%` sin escapar corta el comando. Corregido con `-i` y sin `%` |
| 00:45 | El log mostró `HTTP/2 202` con `{"status":"skipped","reason":"hubo un tick hace menos de un minuto"}`: el cron de cPanel llegó, el token se aceptó y el candado omitió el duplicado porque el cron interno había corrido 23 s antes. La cabecera `x-powered-by: Express, Phusion Passenger(R)` **confirma que el hosting usa Passenger** |
| 01:01:30 | `uptimeSeconds: 1355` (22.6 min), mismo proceso desde las 00:38:56, `lastTick` a las 01:00:03 `ok`. La app **ya no se detiene** con el cron de cPanel llamando cada 5 minutos |
| ~01:00 | Hallazgo 1: tras completar la "Follow up again" (con el arreglo desplegado), **no apareció una nueva** en los ticks siguientes |

### Estado final del cron

- Trabajo de Cron Jobs cada 5 minutos con el comando final
  `curl -fsS --max-time 90 --retry 2 -X POST -H "X-Cron-Token: <token>" https://reformadental.com/crm/cron/tick >/dev/null`
  (sin log). El usuario borró `crm-tick.log`.
- **Reparto de trabajo observado:** cPanel despierta y mantiene viva la app; el sync lo suele hacer
  el cron interno (`source: cron interno`) y la llamada de cPanel recibe `202 skipped`. Si la app
  estuviera dormida, la llamada de cPanel haría el tick (`source: http`).
- Por eso `lastTick.source` en `/health` **no** sirve para saber si el cron de cPanel funciona;
  sirve el `uptimeSeconds` y la hora de `lastTick`.

### Notas y lecciones

- **No poner `%` sin escapar en comandos de Cron Jobs** (o escaparlo como `\%`).
- Cada consulta a `/health` despierta la app si estaba parada; para pruebas limpias, consultar una
  sola vez y leer `uptimeSeconds` al llegar.
- Sigue sin saberse el tiempo exacto de inactividad del hosting ni si la causa es solo ese.
- Al contar las tareas completadas y los mensajes enviados como actividad, también queda corregido
  el **hallazgo 2** del documento del viernes. El **3** queda mitigado solo para envíos exitosos: un
  envío fallido no cuenta y una regla de mensaje podría repetirlo en cada tick.
- "Follow up again" ya no se recrea en 5 min. Volverá a aparecer unas **48 h después de completarla**
  si el lead sigue en "Contacted" sin actividad (completar tareas y enviar mensajes cuenta como
  actividad).

### Pendientes tras el despliegue

- [ ] Monitor externo a `/health` cada 1 a 3 minutos como alarma (no como programador).
- [ ] Leer **Last error** en Settings (nunca se reportó) y confirmar que **Last sync** avanza.
- [ ] Comprobar en 48 h que "Follow up again" reaparece una sola vez.
- [ ] Probar que `touchLead` funciona al enviar un mensaje desde un lead (no se probó en producción).
- [ ] Reglas: reportar disparador y estado de las otras tres; paso 13 (segundo usuario); correo hacia
      Outlook; permiso `CRM` con un cliente real.
- [ ] Confirmar si el CRM viejo de Next.js sigue sincronizando Facebook en paralelo.
- [ ] Commit en `ReformaDental2025` y en el dashboard, sin `git add .`.
