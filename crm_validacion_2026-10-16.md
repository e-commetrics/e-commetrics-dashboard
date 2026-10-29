# CRM: validación en producción y cambios del dashboard (2026-10-16)

Sesión de trabajo del 2026-10-16. Alcance de la validación: **solo correo**. WhatsApp y SMS quedan
en pendiente a propósito (no configurados) y no se usan. El CRM v2 (asistente de voz) sigue en
pausa: ver `crm_v2_backlog.md`.

Relacionado: `BACKLOG.md` (puntos 1, 3 y 4), `ReformaDental2025/CRM_STATUS.md`,
`ReformaDental2025/CRM_USUARIOS.md`.

> No se guardan aquí contraseñas, tokens ni correos de pacientes.

> **Actualización 2026-10-19:** los pasos 11 y 12 y el hallazgo 1 de la sección 6 ya se
> comprobaron; ver `crm_validacion_2026-10-19.md`, que además trae las opciones para el cron.

## Dónde nos quedamos (retomar el lunes 2026-10-19)

**Hecho el viernes 2026-10-16:** pasos 1 al 10 de la validación (el 2 se omitió), sidebar en
carpetas, corrección del borde de foco y del selector Template (ambos ya en producción). Detalle
en las secciones 1, 2 y 4.

**Lo primero el lunes, en este orden:**

1. **Paso 12, ¿la app se duerme?** El fin de semana sirve de prueba. Antes de pulsar nada, abre el
   CRM → Settings y lee **Last sync** *sin presionar "Sync now"*:
   - Si es de hace pocos minutos (hora de cron, p. ej. 8:05 AM del lunes): el cron corre aunque no
     haya tráfico.
   - Si es del viernes o del fin de semana: la app se duerme y el sync automático no corre solo.
   - Matiz: las visitas al sitio o al calendario de `reformadental.com` también despiertan la app,
     así que un Last sync reciente no es concluyente por sí solo; si dudas, repite con 20 minutos sin
     usar nada. El Last sync del viernes quedó en 12:38 PM (manual, "Sync now"); el cron pudo
     actualizarlo después.
2. **Lead de prueba (Kevin Okhuysen):** en "Contacted" desde el 14-oct 6:03 PM, cumplía 48 h el
   viernes a las 6:03 PM. Abre su ficha y revisa **Tasks**: debería haber **una** tarea "Follow up
   again". Si hay más de una, anótalo (hallazgo 1 de la sección 6). No la completes todavía si quieres
   comprobar si se recrea.
3. **Paso 13:** segundo usuario del CRM (`/health` marcaba `users: 1`; ver `CRM_USUARIOS.md`).
4. Contestar lo que quedó sin reportar del paso 10: estado y disparador de las otras tres reglas.

**Después, según el tiempo:** paso 11 (tarea "Call within 1 hour" en el próximo lead real), probar el
permiso `CRM` con un cliente, probar el correo hacia Outlook, y decidir el orden de las correcciones
de las secciones 6 y 7 (la de seguridad del calendario de Reforma es la más grave).

**No hacer mientras se valida:** cambiar la etapa de leads reales, activar reglas de mensaje o usar
WhatsApp/SMS (CAPI está en modo real y cada cambio de etapa manda un evento a Meta).

## 1. Cambios hechos en el dashboard

| Cambio | Archivo | Estado |
|---|---|---|
| Sidebar en tres carpetas por tipo (Apps, Calendarios, CRM). Cada tipo es una carpeta; un CRM nuevo es una entrada más en `APPS` con `category: "crm"` | `src/components/app-sidebar.tsx` | Desplegado |
| ScanEat oculto para todos, admin incluido (`available: false` en su entrada) | `src/components/app-sidebar.tsx` | Desplegado |
| El CRM se muestra como "CRM Reforma" / "Reforma CRM". El permiso sigue siendo `"CRM"` | `src/components/app-sidebar.tsx` | Desplegado |
| Se unificaron las listas ES/EN en una sola y las carpetas comparten un componente (`AppFolder`) | `src/components/app-sidebar.tsx` | Desplegado |
| Corregido: al buscar sin resultados dentro de una carpeta, la carpeta entera desaparecía | `src/components/app-sidebar.tsx` | Desplegado |
| Borde que quedaba pegado en el botón de la carpeta tras elegir un link o hacer clic fuera: el outline global `:focus-visible` (sin capa) le ganaba a las utilidades del sidebar, y Radix devolvía el foco al botón al cerrar | `src/app/globals.css`, `src/components/app-sidebar.tsx` | Desplegado y confirmado por el usuario |
| Selector **Template** vacío en el modal "Send message" del lead: la lista se abría detrás del modal (modal `z-index` 51, lista `z-50`). Se subió la lista del CRM a `z-[60]` | `src/app/dashboard/webapp/crm/components/ui.tsx` | Desplegado y verificado en producción por el usuario (también se probó antes en localhost) |

## 2. Cambios en el backend

- `GET /api/users/:id/apps` devolvía una lista fija sin `CRM`, así que un cliente con ese permiso
  no lo veía nunca (el toggle aparecía apagado al recargar). Se agregó `"CRM"` a `allComponents`.
- Aplicado por el usuario en producción (código y tabla `users_apps` de MySQL), y reflejado en la
  copia del repo `ReformaDental2025/server/dashboard.js` (línea 269).
- `backend.js` ya no existe en `e-commetrics-dashboard`; la única copia en `e-commetrics` es la de
  Reforma.
- **Sin probar con un cliente real** (no hubo acceso a uno). Pendiente.

## 3. Quién puede ver el CRM

- El permiso `CRM` solo controla el **menú**. La página `/dashboard/webapp/crm` no revisa permiso ni
  rol: cualquier usuario del dashboard que escriba la URL llega a la pantalla.
- Lo que realmente protege es el **login propio del CRM** (`crm_users`, sesión de 7 días).
- Dentro del CRM **no hay roles**: cualquier usuario de `crm_users` puede ver y exportar todos los
  leads, editar reglas y plantillas y mandar mensajes.

## 4. Validación en producción (solo correo)

Verificado con `GET /health` y `GET /crm/me` públicos, y con pruebas del usuario en pantalla.

| # | Paso | Resultado |
|---|---|---|
| 1 | Entrar al CRM desde el dashboard e iniciar sesión | Correcto, sin errores en la consola |
| 2 | Permiso `CRM` con un cliente | **Omitido** (sin acceso a un cliente) |
| 3 | Revisar leads | Correcto: datos en todas las columnas, información completa |
| 4 | Sync de Facebook | Correcto: token válido, "Sync now" actualiza Last sync, sin errores |
| 5 | Lead de prueba con correo propio | Correcto (Kevin Okhuysen, correo del usuario) |
| 6 | Mensaje de prueba por email (Settings) | Correcto: llegó a **entrada** en Gmail, remitente `mydentist@reformadental.com`. **Outlook/Hotmail sin probar** |
| 7 | Plantilla `new-lead-confirmation` desde el lead | Correcto: sin error, actividad `message_sent` registrada, correo recibido con el texto de la plantilla. El selector Template ya se ve en producción tras el deploy de la corrección |
| 8 | SPF, DKIM, DMARC | Verificado por DNS público (Gmail no mostró "Mostrar original") |
| 9 | Email Deliverability en cPanel | SPF, DKIM, DMARC y PTR válidos |
| 10 | Reglas de automatización | Las dos reglas de **mensaje** muestran su disparador y están **apagadas**. Las otras tres no se reportaron |

Estado de `/health` observado: `status: ok`, base de datos y calendario correctos, tablas CRM
correctas, `jwtSecret` correcto, cron activo, semilla (6 etapas, 5 reglas, 6 plantillas),
`users: 1`, email configurado, CAPI en modo real, SMS sin configurar, WhatsApp "configurado"
(solo variables del número de pruebas de Meta).

### Autenticación del dominio `reformadental.com`

- **SPF:** válido. Incluye `spf.hosting.registrar-servers.com`, que cubre el servidor de envío. Cierra
  con `~all`. Trae una IP privada (`10.10.10.12`) que no hace daño pero es ruido.
- **DKIM:** válido (selector `default`).
- **DMARC:** válido pero en `p=none` (solo observación, sin dirección de reportes). No protege contra
  suplantación. No urgente.
- **PTR:** válido (`host11-1.registrar-servers.com`).

## 5. Cron y app dormida

- El sync de Facebook y las automatizaciones corren cada 5 minutos (`*/5 * * * *`) dentro del
  proceso de la app (`ReformaDental2025/server/crm/scheduler.js`; el paquete `out/server.js` tiene la
  misma programación; ambos con fecha 29-sep). El check de token corre a las 8:00 y al arrancar.
- El dashboard (frontend) no tiene ningún sync automático: solo el botón "Sync now".
- **Indicio de que la app se duerme:** al consultar `/health` el proceso había arrancado en ese
  instante (`uptimeSeconds: 1`), y el Last sync se quedó en 12:15 hasta que se pulsó "Sync now" a las
  12:38. Aún no confirmado: ver pendiente 12.

## 6. Hallazgos de la revisión del código del CRM (sin corregir)

Leídos del código, no probados contra el servidor.

1. **La tarea "Follow up again" se recrea cada 5 minutos.** Solo se evita duplicar tareas
   *abiertas*; al completarla, el lead sigue "Contacted" y reaparece otra idéntica.
2. **"Sin actividad" no cuenta mensajes ni tareas.** La regla mide `updated_at`, que solo cambia con
   la etapa y las notas.
3. **Un `send_message` programado se repetiría cada 5 minutos.** Solo `create_task` deduplica. Hoy no
   pasa porque esas reglas están apagadas.
4. **El sync de Facebook aborta completo** si falla un formulario, no pagina (solo la primera página
   de cada formulario) y no tiene candado contra ejecuciones simultáneas.
5. **Sin límite en envíos**: `/leads/:id/send`, `/messaging-test` e `import-csv` (este último
   dispara CAPI y reglas por fila dentro de una sola petición).
6. **Sin roles** en las rutas del CRM.
7. **Tokens sin revocación:** `requireAuth` no consulta la base; un usuario borrado conserva su
   sesión hasta 7 días.
8. **Límite de intentos de login por `req.ip`** sin `trust proxy`: detrás del proxy de cPanel podría
   contar la IP del proxy para todos.
9. WhatsApp: siempre envía `[nombre]` como parámetro aunque la plantilla no tenga variables; el
   idioma por defecto es `en_US`; el CRM no puede recibir respuestas ni saber si el mensaje llegó.
10. `/dashboard` del CRM carga todos los leads, tareas y actividades en memoria en cada petición.
11. CAPI manda a Meta correo y teléfono con hash, y otros campos si vienen: aplica el punto 4 de
    `BACKLOG.md` para clientes médicos.

**Caso real a observar:** el lead de prueba está en "Contacted" desde el 14-oct 6:03 PM y cumple 48 h
el 16-oct 6:03 PM; después de esa hora debería crearse la tarea "Follow up again", lo que permite ver
el hallazgo 1 en vivo.

## 7. Hallazgos de seguridad en otros backends (sin corregir)

- **Calendario de Reforma, rutas sin autenticación:** `GET /api/appointments` expone nombre, teléfono y
  correo de pacientes; `PUT`/`DELETE /api/appointments/:id`, `/bloquear-fecha`,
  `/desbloquear-fecha/:id` y `/api/appointments-dashboard` están abiertas. `/api/citas/agendar` es
  pública por diseño pero sin límite ni captcha, y envía correo desde el dominio de la clínica a la
  dirección que reciba, con `nombre` y `telefono` sin escapar en el HTML.
- **Backend del dashboard (`dashboard.js` / antes `backend.js`):** casi todas las rutas sin
  autenticación (`GET /api/users` con `SELECT *`, `PUT /api/users/:id` con `password`,
  `POST /api/register`, `DELETE /api/users/:id`, subidas sin sesión ni límite), `JWT_SECRET` y una
  contraseña SMTP escritos en el código, y contraseñas enviadas en texto plano por correo. Detalle
  en `BACKLOG.md` punto 3.
- **ScanEat:** la página usa una clave de admin con prefijo `NEXT_PUBLIC_`, visible en el navegador
  aunque la página esté oculta. La ruta `/dashboard/webapp/scan-eat` sigue accesible por URL directa.
  Se dejó como permiso en la pantalla de Permisos para no borrar accesos existentes al guardar.

## 8. Pendientes

**De la validación**

- [x] **Paso 12:** la app se detiene sin tráfico (comprobado el 2026-10-19). Resuelto con un cron de
      cPanel que llama a `POST /crm/cron/tick`; ver `crm_validacion_2026-10-19.md` §1 y §10.
- [ ] **Paso 13:** segundo usuario del CRM (`/health` marca `users: 1`; ver `CRM_USUARIOS.md`).
- [x] **Paso 11:** cubierto con el lead de prueba: "Call within 1 hour" se creó sola un segundo
      después de entrar el lead (`crm_validacion_2026-10-19.md` §2).
- [ ] Reportar el estado de las otras tres reglas (disparador y encendidas).
- [ ] Probar el permiso `CRM` con un cliente real (con y sin permiso).
- [ ] Probar el correo hacia Outlook/Hotmail.
- [x] Desplegar la corrección del selector Template (hecho y verificado en producción).

**De cierre**

- [ ] Cerrar la página del CRM por permiso o rol (hoy se entra por URL).
- [x] Hallazgos 1 y 2 de la sección 6 corregidos y desplegados el 2026-10-19: completar una tarea y
      enviar un mensaje cuentan como actividad del lead.
- [ ] Hallazgo 3 de la sección 6: queda mitigado solo para envíos exitosos (un envío fallido no
      cuenta como actividad y la regla puede repetirlo en cada tick). Corregirlo antes de activar
      cualquier regla de mensajes.
- [ ] Activar `new_lead_confirmation_message` solo después de validar Outlook y revisar el texto de
      las plantillas.
- [ ] Revisar leads de prueba y eventos CAPI de prueba ya enviados en modo real.
- [ ] Cerrar las rutas sin autenticación del calendario y del backend del dashboard.
- [ ] Rotar la clave de ScanEat y la contraseña SMTP de facturación.

**Fuera de alcance por ahora**

- WhatsApp: número real, token permanente, plantillas aprobadas por Meta.
- SMS (Twilio): credenciales, paquete `twilio`, registro A2P.
- CRM v2 con asistente (`crm_v2_backlog.md`).

## 9. Git

- `ReformaDental2025`: rama `feature/crm-module`, **nada confirmado**. `server/dashboard.js` está sin
  trackear y contiene secretos; no usar `git add .`.
- `e-commetrics-dashboard`: rama `compliance`, muchos cambios sin confirmar. `BACKLOG.md` figura como
  `UU` (conflicto), aunque su contenido no muestra marcas de conflicto; probablemente falta un
  `git add` para cerrarlo.
