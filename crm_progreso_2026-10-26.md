# Progreso del CRM de Reforma (2026-10-26)

Qué se puede hacer hoy, qué no y qué podría agregarse. Basado en la revisión del código (backend en
`ReformaDental2025/server/crm/`, frontend en `src/app/dashboard/webapp/crm/`), una consulta a `/health` y los
documentos de validación del 16, 19, 20 y 21 de octubre.

**Estado de `/health` (2026-10-26 23:59 UTC):** `status: ok`, base de datos y tablas ok, seed completo
(6 etapas, 5 reglas, 6 plantillas), cron activo, último tick `ok`. `uptimeSeconds: 284`: el proceso se había
reiniciado hacía ~5 min (Apache en Shared, ver `crm_validacion_2026-10-20.md` §12).
TypeScript compila sin errores. ESLint marca 6 errores de reglas de React en `hooks.tsx` y `session.tsx`,
que no impiden el build.

**No se creó ningún lead en producción durante la revisión:** CAPI está en modo real y cada lead nuevo
manda un evento a Meta.

---

## 1. Sí: funciona hoy

### Leads
- [x] **Recibir leads de Meta Lead Ads:** sync cada 5 min, sin duplicar (deduplica por `fbLeadgenId`) y
      leyendo todas las páginas de cada formulario (paginación desplegada el 21-oct).
- [x] **Alta manual** con el botón "Add lead" (nombre obligatorio; correo y teléfono opcionales).
- [x] **Importar leads desde CSV** (columnas `name`, `email`, `phone`). Ver las precauciones en §3.
- [x] **Mover de etapa:** New → Contacted → Scheduled → Consultation → Won / Lost, arrastrando la tarjeta o
      desde el selector de la ficha.
- [x] **Buscar** por nombre, correo, teléfono o campaña.
- [x] **Exportar a CSV** (con BOM para que Excel abra bien los acentos).
- [x] **Notas e historial de actividad** por lead.
- [x] **Origen del lead:** campaña, anuncio y formulario de Meta, y las respuestas del formulario.

### Mensajes
- [x] **Enviar correo con plantilla** a un lead. Probado el 21-oct: llegó y quedó `message_sent` en Activity.
- [x] **Editar plantillas** (asunto y cuerpo; solo admite `{{name}}`).
- [x] **Correo de prueba** desde Settings.

### Tareas y automatizaciones
- [x] "Call within 1 hour" al entrar un lead nuevo.
- [x] "Follow up again" si un lead lleva 48 h en Contacted sin actividad. Probado: se crea una sola vez.
- [x] Recordatorio al pasar un lead a Scheduled.
- [x] `touchLead`: enviar un mensaje o completar una tarea cuenta como actividad. Probado el 21-oct.
- [x] Marcar tareas como hechas.
- [x] Recuperación de los efectos de creación tras un reinicio (`effects_fired_at`). Desplegado; ver §3.
- [x] **Aviso de lead nuevo por correo** (2026-10-28): cada lead nuevo de Facebook manda un correo al
      equipo con sus datos. Los correos se administran en Settings › "New lead notifications" (agregar y
      quitar). Desplegado; falta verlo llegar con un lead real. Ver §6.

### Citas del sitio
- [x] **Pestaña Web en Pipeline** (2026-10-28): muestra las citas del calendario de reformadental.com,
      indica cuáles ya están en el CRM (por teléfono o correo) y permite agregarlas con "Add to CRM". Ver §7.

### Meta (anuncios)
- [x] **CAPI:** cada alta y cada cambio de etapa de un **lead de Facebook** manda a Meta un evento real con
      el nombre de la etapa, el `lead_id` de Facebook y el correo y teléfono con hash. Desde el 2026-10-28
      los leads manuales, de CSV y de citas ya no mandan CAPI (ver §7).
- [x] Revisión diaria del token de la página (8:00) y botón "Check token" en Settings.

### Panel
- [x] Dashboard: leads por etapa y por origen, tareas abiertas y vencidas, mensajes enviados y fallidos, y
      tasa de conversión.
- [x] Settings: estado del sync, del token y de CAPI, "Sync now", prueba de CAPI y activar o desactivar
      reglas.
- [x] **Archivar y restaurar leads** (2026-10-28): botón Archive / Restore en la ficha y "Show archived" en
      el Pipeline. Probado en producción: el sync no recrea un lead archivado. Ver §9.
- [x] **Tareas manuales** (2026-10-28): formulario "Add task" en la ficha del lead (descripción y fecha,
      mañana a las 10 por defecto). Probado en producción. Ver §10.

---

## 2. No: hoy no se puede

### Bloqueado por terceros
- [ ] **WhatsApp:** desactivado en la interfaz. Falta el número real de la clínica, un token permanente y
      plantillas aprobadas por Meta. `/health` dice `whatsapp: true` solo porque hay variables definidas
      (apuntan al número de pruebas).
- [ ] **SMS:** no configurado. Faltan las credenciales de Twilio, el paquete `twilio` y, si aplica, el
      registro A2P 10DLC.
- [ ] **Envíos automáticos:** las dos reglas de mensaje están apagadas a propósito. Todo correo es manual.

### No programado todavía (se puede hacer en el CRM, no depende de Meta)
- [ ] **Editar un lead** (nombre, correo, teléfono).
- [x] ~~**Borrar un lead.**~~ Hecho el 2026-10-28 como **archivar y restaurar** (§9).
- [x] ~~**Crear tareas a mano.**~~ Hecho el 2026-10-28 (§10).
- [ ] **Detectar duplicados por correo o teléfono.** Recomendado: avisar, no fusionar solo. Diseño y
      archivos en §10 ("Siguiente: duplicados"); se pospuso hasta que haya volumen de leads.
- [ ] **Segundo usuario del CRM** (`/health` dice `users: 1`).
- [ ] **Asistente con IA:** diseño y 52 casos de prueba listos, sin código. Falta decidir si se hace y
      en qué versión, y las respuestas del dueño. Lista completa de lo que falta en §11.

### No se hará desde el CRM
- **Crear o administrar anuncios.** La Marketing API lo permite (para tu propia cuenta basta el acceso
  estándar a `ads_management`, más `pages_manage_ads`, `pages_read_engagement` y `pages_show_list`), pero
  sería reconstruir Ads Manager. Se sigue haciendo en Meta Ads Manager.

---

## 3. Funciona, pero con cuidado

- ~~**Leads manuales y de CSV también mandan "New" a Meta.**~~ Corregido el 2026-10-28: CAPI solo sale
  para leads con `source = facebook` (ver §7).
- **Importar CSV no deduplica:** cada fila crea un lead y una tarea. Un nombre con coma
  ("Pérez, Ana") se parte en dos columnas.
- **Reinicios del proceso:** los efectos de **creación** se recuperan; los de un **cambio de etapa** no. Si
  el proceso cae justo ahí, Meta no recibe ese evento.
- **Teléfonos sin lada:** CAPI quita los signos pero no agrega `52`. Un lead manual con `664…` no le sirve a
  Meta para identificar a la persona.
- **Sin `event_id` en CAPI:** si un reinicio cae entre el envío y la marca de `effects_fired_at`, Meta puede
  recibir "New" dos veces.
- **Volver a correr el seed** (`--crm-seed` o `crm-seed.sql`) reescribe `enabled` y regresa las reglas a como
  vienen de fábrica.
- **Falta probar un lead nuevo real de punta a punta** con `effects_fired_at`: en Activity deben aparecer
  "Lead created", "CAPI event New sent" y la tarea, y la columna con fecha pocos segundos después de
  `created_at`.
- **Build local del frontend del 23-oct:** no está confirmado que sea el que corre en `public_html`.

---

## 4. Tal vez: integraciones posibles

Ordenadas de más a menos viable.

| # | Integración | Qué da | Depende de | Viabilidad |
|---|---|---|---|---|
| 1 | ~~**Calendario del sitio → CRM**~~ | Ver las citas del sitio en el CRM y agregarlas como lead | — | **Hecho el 2026-10-28** como pestaña Web con alta manual (§7). Pendiente opcional: mover solo a Scheduled los leads que ya existen |
| 2 | ~~**Aviso de lead nuevo** al equipo por correo~~ | Cumplir "Call within 1 hour" | — | **Hecho el 2026-10-28** (§6) |
| 3 | **Resultados de campañas en el CRM** | Gasto, leads, costo por lead y costo por paciente real (Won) por campaña | Permiso `ads_read` de la cuenta publicitaria; el token actual no alcanza | Alta |
| 4 | **Funciones de leads de §2** (editar, archivar, tareas manuales, aviso de duplicados) | Uso diario más cómodo | Nada | Alta |
| 5 | **WhatsApp** | El canal que más contesta en México | Número, token y plantillas de Meta | Media (bloqueada) |
| 6 | **Recordatorio automático de cita** | Menos inasistencias | El punto 1, y WhatsApp para que sea útil | Media |
| 7 | **Otros orígenes:** Instagram, Google Ads, TikTok | Todos los leads en un solo lugar | Que haya inversión en esos canales | Media |
| 8 | **SMS** | Respaldo de WhatsApp | Twilio, costo por mensaje, A2P | Baja |
| 9 | **Asistente con IA** | Respuesta inmediata al lead | Decidir A/B/C, respuestas del dueño, cerrar rutas de citas y aprobar el diseño (§11) | Baja por ahora |
| 10 | **Sistema dental** (expedientes, tratamientos, pagos) | Todo en un lugar | Datos de salud: más obligaciones legales; la política de privacidad no cubre Meta ni IA | Baja |

**Decidido para el punto 1 (2026-10-28):** se reconoce a la persona por los últimos 10 dígitos del teléfono
y, si no hay coincidencia, por correo. Las citas no se vuelven lead solas: alguien del equipo pulsa
"Add to CRM".

---

## 5. Siguiente paso sugerido

1. Probar un lead nuevo real de punta a punta (§3), con el visto bueno del usuario.
2. ~~Calendario → CRM~~ (hecho el 2026-10-28 como pestaña Web, §7).
3. ~~Aviso de lead nuevo~~ y ~~no mandar CAPI para leads que no vienen de Facebook~~ (hechos el
   2026-10-28).
4. Cerrar las rutas de citas sin autenticación (`GET`, `PUT`, `DELETE /api/appointments` y
   `POST /api/appointments-dashboard`). **Prioridad media, no se integra por ahora** (decisión del
   2026-10-28). `calendar-reforma` del dashboard las usa, así que la solución es un pase corto firmado por
   el dashboard. Diseño completo en `BACKLOG.md` §3.1.
5. Lead → cita: **pendiente de implementación**, recomendada la opción 2 (§8).
6. Resultados de campañas.
7. WhatsApp, cuando el dueño entregue el número.

---

## 6. Aviso de lead nuevo (2026-10-28)

Detalle técnico, despliegue y reversión en `ReformaDental2025/CRM_STATUS.md` §12.

**Cómo funciona:** cuando el sync crea un lead nuevo de Facebook, sale un correo "New lead: <nombre>" con
nombre, teléfono, correo, campaña y formulario a cada dirección de Settings › "New lead notifications".
Los leads manuales y de CSV no avisan. Sin direcciones, no se manda nada.

**Estado:**
- [x] Columna `crm_sync_state.notify_emails` aplicada en producción.
- [x] Backend (`out/server.js` del 2026-10-28 11:34) subido y reiniciado.
- [x] Frontend con la lista de correos subido.
- [x] Verificado en producción: `/crm/settings` devuelve el correo guardado y Settings lo muestra.
- [ ] **Ver llegar el aviso con el siguiente lead real de Meta** (revisar spam la primera vez). En espera
      al 2026-10-29: no ha entrado ningún lead nuevo. Con ese mismo lead se hace la prueba de punta a
      punta de §3.
- [ ] Commits por archivo en ambos repos (no hechos).

**Archivos:**
- `ReformaDental2025/server/`: `crm/services/automation.js`, `crm/routes/settings.js`,
  `crm/services/repo/syncState.js`, `crm/db/connection.js`, `crm/types.js`, `schema.sql`. En cPanel solo
  se sube `out/server.js` como `server.js`.
- `e-commetrics-dashboard/src/app/dashboard/webapp/crm/`: `screens/SettingsScreen.tsx`, `lib/api.ts`,
  `lib/types.ts`.

**Lo aprendido en el despliegue:**
- El backend se despliega con `bun run build` y se sube **solo** `out/server.js`. Subir archivos sueltos de
  `crm/` no cambia nada.
- Toda columna nueva que el código lea tiene que agregarse a `COLUMN_MAP` en `crm/db/connection.js`. Si no,
  se lee `null` aunque la base tenga el dato.

**Riesgos conocidos:** si el proceso se reinicia justo después de mandar el aviso, la recuperación de
efectos puede mandarlo dos veces. Hay un correo por lead, sin agrupar.

---

## 7. Pestaña Web y CAPI solo para Facebook (2026-10-28)

Detalle técnico, despliegue y reversión en `ReformaDental2025/CRM_STATUS.md` §13.

**Por qué:** el calendario de reformadental.com es público y es la otra entrada de pacientes, aparte de
Meta. Datos del 2026-10-28: 4 citas, todas `web`, todas con correo, ninguna con lada; **solo 1 de 4**
coincide con un lead del CRM. Se eligió una pestaña con alta manual en vez de crear leads solos, para que
una cita falsa no se vuelva lead.

**Cómo funciona:**
- Pipeline tiene dos pestañas: **CRM** (el tablero de siempre) y **Web** (las citas del sitio).
- Cada cita muestra fecha y hora, paciente ("First visit"), teléfono y correo, servicio y seguro.
- Si la persona ya está en el CRM aparece **"In CRM"**, que abre su lead. Si no, **"Add to CRM"** crea el
  lead (origen `manual`, formulario "Website booking") con los datos de la cita en su ficha. Antes de
  crear vuelve a buscar, así que un doble clic no duplica.
- La coincidencia es por los últimos 10 dígitos del teléfono y, si no hay, por correo.
- **CAPI ya no sale para leads que no son de Facebook** (manuales, CSV y los de "Add to CRM"). Las reglas
  (tarea "Call within 1 hour") sí siguen corriendo para todos. La prueba de CAPI de Settings sigue
  funcionando con cualquier lead.

**Estado:**
- [x] Backend con la pestaña Web desplegado (`out/server.js` del 12:50).
- [x] Frontend desplegado; la pestaña Web se ve en producción.
- [x] Backend con el filtro de CAPI en producción (confirmado por el usuario el 2026-10-29).
- [x] Pestaña Web revisada en producción (2026-10-29).
- [x] "Add to CRM" probado con una cita real (2026-10-29).
- [ ] Commits en `e-commetrics-dashboard`: al 2026-10-29 los cambios siguen sin commitear.

**Archivos:**
- `ReformaDental2025/server/crm/`: nuevos `services/repo/appointments.js`, `services/appointments.js` y
  `routes/appointments.js`; modificados `index.js` (monta las rutas) y `services/automation.js` (filtro de
  CAPI).
- `e-commetrics-dashboard/src/app/dashboard/webapp/crm/`: nuevo `components/WebBookings.tsx`; modificados
  `screens/PipelineScreen.tsx` (pestañas), `lib/api.ts` y `lib/types.ts`.

**Pendientes que salen de aquí:**
- `GET /api/appointments` del calendario **no pide autenticación** y devuelve los datos de todos los
  pacientes; `PUT` y `DELETE /api/appointments/:id` tampoco. Leído del código, no probado contra
  producción. Antes de cerrarlas, confirmar qué las usa.
- Lead → cita (hoy no existe): ver las dos opciones en §8.
- La pestaña Web no avisa de citas nuevas; el calendario ya manda la confirmación con copia a la clínica.

---

## 8. Lead → cita: dos opciones (2026-10-28, pendiente de implementación)

**Hoy un lead nunca llega al calendario.** La integración va en un solo sentido: del calendario al CRM
(pestaña Web, §7). Pasar un lead a **Scheduled** solo cambia la etapa, manda CAPI si es de Facebook y crea
el recordatorio; **no crea una cita**.

**Flujo actual para un lead de Meta:** el equipo lo llama → si acepta, crea la cita **a mano** en
`calendar-reforma` y mueve el lead a Scheduled **a mano** en el CRM → en la pestaña Web la cita aparece
"In CRM". Son dos acciones en dos sistemas y se puede olvidar una.

| | Opción 1: botón "Book appointment" en el CRM | **Opción 2: la cita mueve el lead (recomendada)** |
|---|---|---|
| Qué hace | Desde la ficha del lead se elige fecha y hora, se crea la cita en `citas` y el lead pasa a Scheduled en un paso | Cuando se crea una cita para un lead que ya existe, el lead pasa solo a Scheduled |
| Flujo del calendario | Cambia: se agenda desde dos lugares | No cambia: se sigue agendando donde hoy |
| Restricción del usuario | Se parece a juntar CRM y calendario (descartado) | Respeta que el calendario siga separado |
| Trabajo | Formulario, horarios ocupados, choque con `UNIQUE (fecha, hora)` | Poco: reutiliza el cruce por teléfono y correo de la pestaña Web |
| Qué resuelve | Agendar y mover en un paso | Que no se olvide mover el lead |

**Diseño de la opción 2:**
- En el tick de 5 min, revisar las citas nuevas desde la última procesada. Cubre las del sitio y las del
  dashboard **sin tocar el código del calendario** y sobrevive a reinicios. Necesita una columna para la
  última cita revisada (por ejemplo `crm_sync_state.last_cita_id`) y agregarla a `COLUMN_MAP`.
- Si la cita coincide con un lead: moverlo a Scheduled y anotar fecha y hora de la cita en su actividad.
  Si no coincide: nada; queda en la pestaña Web para "Add to CRM".
- **Solo avanzar:** mover solo desde New o Contacted. En Consultation, Won o Lost, solo anotar la cita.
- **Manda CAPI real** "Scheduled" para los leads de Facebook (es lo buscado, pero es un evento real).
- Riesgos: un teléfono compartido (familia) movería el lead equivocado, aunque la nota deja rastro; una
  cita borrada no regresa el lead de etapa.

**Con el asistente con IA (`crm_v2_backlog.md`):**
- La opción 2 sirve de base: si el bot escribe en `citas`, el tick mueve el lead sin código extra. El bot
  también podría mover el lead directo, porque sabe con quién habla.
- **Decisión pendiente 1:** el bot solo pide **un día, sin hora**, pero `citas` exige hora y
  `UNIQUE (fecha, hora)`. Hay que decidir dónde vive una solicitud sin hora (tabla aparte o hora opcional
  en `citas`); lo segundo toca el calendario en uso.
- **Decisión pendiente 2:** la cita del bot queda **solicitada**, no confirmada (términos del sitio).
  Recomendado: mover a Scheduled solo cuando el equipo la confirme, para que Meta no reciba "Scheduled" de
  citas que no se den.
- El bot sigue en pausa y su Fase 0 exige cerrar antes la seguridad del calendario (`BACKLOG.md` §3.1).

**Estado:**
- [ ] Elegir opción (recomendada la 2) e implementarla.
- [ ] Anotar las dos decisiones del bot en `crm_v2_backlog.md` cuando se retome el asistente.

---

## 9. Archivar y restaurar leads (2026-10-28)

Detalle técnico, despliegue y reversión en `ReformaDental2025/CRM_STATUS.md` §14.

**Por qué archivar y no borrar:** si se borra la fila de un lead de Facebook, el siguiente sync lo vuelve a
crear y manda otro "New" real a Meta. Archivar oculta el lead; el sync lo sigue encontrando por su id de
Facebook y no crea nada.

**Cómo funciona:**
- Ficha del lead: botón **Archive** / **Restore** y etiqueta "Archived" con la fecha.
- Pipeline: interruptor **"Show archived"**; las tarjetas archivadas se ven atenuadas.
- Un lead archivado **no aparece** en el Pipeline, la búsqueda, el panel de tareas, el Dashboard ni el CSV,
  y la regla "Follow up again" de 48 h no lo toma.
- **Restaurar** lo devuelve tal como estaba: misma etapa, notas, historial y tareas.
- Ni archivar ni restaurar mandan CAPI ni disparan reglas. En la actividad queda "Lead archived" o
  "Lead restored" (cuándo, **no quién**).
- Pestaña Web: un archivado sigue contando como coincidencia ("In CRM (archived)") para que "Add to CRM" no
  duplique a la persona.

**Estado:**
- [x] Columna `crm_leads.archived_at` aplicada en producción.
- [x] Backend (`out/server.js` del 2026-10-28 16:12) y frontend desplegados.
- [x] **Probado en producción:** se archivaron los 3 leads de prueba (`Kevin Okhuysen`,
      `<test lead: dummy data for full_name>` y `Reforma Dental Test`) y, tras "Sync now", siguen archivados
      y aparecen una sola vez con "Show archived".
- [ ] Commits por archivo en ambos repos (no hechos).

**Archivos:**
- `ReformaDental2025/server/`: `crm/services/repo/leads.js`, `crm/routes/leads.js`,
  `crm/services/repo/tasks.js`, `crm/services/appointments.js`, `crm/db/connection.js`, `crm/types.js`,
  `schema.sql`.
- `e-commetrics-dashboard/src/app/dashboard/webapp/crm/`: `screens/LeadDetailScreen.tsx`,
  `screens/PipelineScreen.tsx`, `components/LeadCard.tsx`, `components/WebBookings.tsx`, `lib/api.ts`,
  `lib/types.ts`.

**Pendientes que salen de aquí:**
- Registrar **quién** archivó cuando haya más de un usuario del CRM.
- Editar un lead (nombre, correo, teléfono) sigue pendiente (§2).

---

## 10. Tareas manuales (2026-10-28)

Detalle técnico, despliegue y reversión en `ReformaDental2025/CRM_STATUS.md` §15.

**Para qué:** que el equipo agende sus propios pendientes con cada paciente ("Mandar presupuesto del
implante", "Llamar el jueves"), no solo los de las reglas automáticas. Diferencia con lo que ya había: la
**etapa** dice dónde va el paciente, una **nota** registra lo que ya pasó, una **tarea** es un pendiente a
futuro que el panel muestra y marca en rojo al vencer.

**Cómo funciona:**
- Ficha del lead › Tasks › formulario **New task** (hasta 500 caracteres) + **Due** (fecha y hora local,
  mañana a las 10:00 por defecto) + **Add task**.
- La tarea va a la misma tabla y al mismo panel que las automáticas; se completa con la misma casilla.
- Queda "Task added: …" en la actividad del lead. No manda nada a Meta.
- Crear una tarea **cuenta como actividad** (`touchLead`): reinicia el contador de 48 h de "Follow up
  again".
- En un lead archivado se puede crear, pero no sale en el panel de tareas (a propósito, §9).
- Alcance elegido: **solo crear.** Editar o borrar tareas no está; una que sobre se marca como hecha.

**Estado:**
- [x] Backend (`out/server.js` del 2026-10-28 16:56) y frontend desplegados.
- [x] **Probado en producción** con un lead de prueba (restaurado y vuelto a archivar, sin tocar leads
      reales): la tarea sale en la ficha y en el panel con la hora correcta, y la actividad la registra.
- [ ] Commits por archivo en ambos repos (no hechos).

**Archivos:**
- `ReformaDental2025/server/crm/routes/dashboard.js` (ruta `POST /tasks`).
- `e-commetrics-dashboard/src/app/dashboard/webapp/crm/`: `screens/LeadDetailScreen.tsx` (formulario
  `AddTaskForm`) y `lib/api.ts` (`apiCreateTask`).

**Siguiente: duplicados (pospuesto hasta que haya volumen).** Diseño acordado: avisar sin fusionar ni
bloquear, contando archivados, en la ficha del lead ("Possible duplicate of X") y al dar "Add lead"
("Add anyway" / "Open existing"). Reutiliza `phoneKey` y `emailKey` de `crm/services/appointments.js`
(mejor moverlas a un `services/matching.js` común). Archivos: `services/appointments.js`,
`services/leads.js`, `routes/leads.js` (`duplicates` en `GET /leads/:id` y
`GET /leads/duplicates?phone=&email=`); `lib/types.ts`, `lib/api.ts`, `screens/LeadDetailScreen.tsx` y
`components/AddLeadModal.tsx`. Sin `ALTER`. Cuidado: si la búsqueda falla, no debe tumbar la ficha.

---

## 11. Asistente con IA: qué falta para implementarlo (2026-10-28)

Resumen de `crm_v2_backlog.md`, `crm_asistente_capa_modelos.md` y `pendientes_2026-10-21.md` §4.
**Estado: solo diseño, sin código.** La API key es el último paso, no el primero.

### 1. Decisión principal (pendiente desde el 2026-10-19)
¿Se hace y en qué versión?

| Opción | Qué es |
|---|---|
| A. No hacerlo | El CRM queda como está |
| **B. Piloto de texto en el sitio** (sugerida) | Asistente en el chatbot de reformadental.com que responde y solicita citas; sin Meta ni voz |
| C. Proyecto completo | Messenger e Instagram, recordatorios, voz y pantalla de conversaciones; varias semanas |

Datos para decidir: cuántos mensajes llegan hoy y cuánto tiempo cuesta atenderlos, costo mensual del
modelo de IA, y quién atiende urgencias y escalamientos.

### 2. Decisiones de negocio y legales (del dueño)
- [ ] Nombre del asistente.
- [ ] Quién atiende urgencias fuera de horario (noches y domingos) y en cuánto tiempo.
- [ ] Tiempo que se promete al escalar a una persona.
- [ ] Unificar los correos del sitio (`dentalreforma.com` / `reformadental.com`; `privacy@` /
      `privacidad@`).
- [ ] Política de privacidad: hoy no menciona IA, Meta ni datos de salud. Visto bueno del dueño y
      revisión legal.
- [ ] Dónde se guardan las conversaciones, cuánto tiempo, y cómo se atiende una solicitud ARCO.
- [ ] Solicitudes de cita **sin hora**: el bot solo pide el día, pero `citas` exige hora (§8).

### 3. Prerrequisitos técnicos ("Fase 0")
- [ ] Cerrar las rutas de citas sin autenticación (`BACKLOG.md` §3.1, hoy prioridad media): el bot
      escribiría en el calendario real.
- [ ] Endurecer el backend del dashboard (`BACKLOG.md` §3).
- [ ] Aprobar el diseño de la capa de modelos: ubicación (`server/crm/assistant/llm/`), umbrales (100 %
      en críticos, ≥90 % intención y herramienta, ≥85 % el resto) y quién juzga (otro modelo o una
      persona).
- [x] **Modelo decidido (2026-10-29): Claude Haiku 5.5** (`claude-haiku-5-5`, $0.10 / $0.50 por
      millón de tokens), con Sonnet 5.5 como juez de las pruebas. Gemini descartado: más caro de
      pago, y su capa gratuita no sirve con pacientes reales. Detalle en
      `crm_asistente_capa_modelos.md` §3.
- [ ] **API key de Anthropic: en espera** (2026-10-29). Es aparte de la suscripción Claude Pro.

### 4. Lo que se construiría (opción B)
1. Capa `generate()` con el adaptador de Claude (Haiku 5.5).
2. Corredor de pruebas con los 52 casos de `crm_asistente_casos_prueba.json` en Haiku 5.5, con
   Sonnet 5.5 como juez.
3. Herramientas: consultar disponibilidad, solicitar cita, marcar urgencia y escalar.
4. Tablas de conversaciones y aviso de "asistente automatizado".
5. Reemplazar el chatbot actual del sitio (Groq con `llama-3.3-70b-versatile`, una sola llamada sin
   herramientas: no puede consultar ni agendar).
6. API key solo en variables de entorno del servidor, nunca en el frontend.

### Recomendación
No programar todavía. Primero, la decisión A/B/C y las respuestas del dueño (sección 2). Si elige B, el
primer paso técnico es cerrar las rutas de citas (`BACKLOG.md` §3.1), que conviene de todos modos.
