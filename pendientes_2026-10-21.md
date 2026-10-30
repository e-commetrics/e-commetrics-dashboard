# Pendientes consolidados (2026-10-21)

Listado armado desde `BACKLOG.md`, `ReformaDental2025/CRM_STATUS.md`, `crm_v2_backlog.md` y los
documentos de validación del 16, 19 y 20 de octubre. Los puntos de cumplimiento (§6) se copiaron del
backlog **sin comprobarlos contra el código**: parte ya existe en el árbol sin commit (`src/app/legal/`,
`src/app/accessibility/`), así que ese bloque puede estar desactualizado.

Estado de referencia original: el CRM funcionaba solo con correo; WhatsApp y SMS estaban desactivados
en la interfaz. **Actualizado 2026-10-29:** WhatsApp quedó habilitado en el código del frontend; falta
build y subida. SMS sigue desactivado. El asistente con IA está en diseño, sin código. CAPI está en
modo real: no cambiar etapas de leads reales ni activar reglas de mensaje.

## 1. Hoy y esta semana (CRM solo con correo)

- [ ] **~5:50 PM Tijuana (2026-10-21):** comprobar que "Follow up again" vuelve **una sola vez**. Hasta
      entonces no completar tareas ni enviar mensajes en el lead de prueba.
- [ ] **Probar `touchLead`:** enviar una plantilla al lead de prueba, después de lo anterior.
- [ ] **Probar `effects_fired_at` con un lead nuevo real.** La columna está aplicada y el código
      desplegado según el usuario, pero sin probar (ver `ReformaDental2025/CRM_STATUS.md` §11).
- [ ] **Monitor externo** a `/health` con palabra clave `warnings`. Candidato: Better Stack; confirmar
      que su plan gratis incluye palabra clave.
- [ ] **Reglas de automatización:** reportar el disparador y el estado de las otras tres.
- [ ] **Paso 13:** segundo usuario del CRM (`ReformaDental2025/CRM_USUARIOS.md`).
- [ ] **Decisión:** Ruta 1 (Shared + monitor + correo de aviso) o Ruta 2 (VPS). Ventajas y desventajas en
      `crm_validacion_2026-10-20.md` §12.
- [ ] **Resource Usage de 24 h** en cPanel (prioridad baja: la causa de los reinicios ya se conoce).
- [ ] **CRM viejo de Next.js:** confirmar si sigue sincronizando Facebook en paralelo y retirarlo al final.
- [x] **Leads de prueba:** `Reforma Dental Test`, `<test lead: dummy data for full_name>` y el de Kevin
      Okhuysen. **Resuelto el 2026-10-28:** los 3 se **archivaron** desde el CRM (sin borrarlos en Facebook)
      y el sync no los recreó. Ver `crm_progreso_2026-10-26.md` §9.
- [~] **Desfase de la cuenta de leads:** el CRM viejo muestra 17 y el nuevo tiene 21. Con los 3 de prueba
      archivados (2026-10-28), comparar de nuevo el total del Dashboard con el CRM viejo.
- [ ] **Paginación del sync de Facebook:** solo lee la primera página (~25) por formulario.
- [ ] **Events Manager:** revisar el efecto de los eventos CAPI de prueba enviados en modo real.
- [ ] **Commits por archivo,** sin `git add .`, en este repo (`compliance`) y en `ReformaDental2025`
      (`feature/crm-module`). Cuidado con `server/dashboard.js` (secretos) y `server/backup.js` (no lo creó
      este trabajo). `server/crm/services/tick.js` está sin trackear.
- [ ] **Subir a producción** el build con WhatsApp habilitado y SMS desactivado en la interfaz.
- [ ] **Probar** correo a Outlook/Hotmail y el permiso `CRM` con un cliente real.

## 2. WhatsApp (Meta)

Hoy apunta al **número de pruebas**; `/health` dice `whatsapp: true` solo porque hay variables definidas.
El botón quedó habilitado en el frontend el 2026-10-29; no enviar a pacientes hasta configurar y validar
el número real y las plantillas aprobadas.

- [ ] Registrar y verificar el número real de la clínica en WhatsApp Business.
- [ ] Cambiar `CRM_WHATSAPP_PHONE_NUMBER_ID` al del número real.
- [ ] Token permanente (usuario del sistema), no el temporal de 24 h.
- [ ] Plantillas aprobadas por Meta; anotar `whatsapp_template_name` y el idioma en la plantilla del CRM.
- [ ] Reiniciar la app y probar con "Send a test message" a un número propio.
- [x] Quitar `whatsapp` de `DISABLED_CHANNELS` en `webapp/crm/lib/channels.ts` (2026-10-29).
- [ ] Hacer build y subir el frontend con WhatsApp habilitado.
- [ ] Confirmar que las reglas de mensaje sigan deshabilitadas: el backend aún acepta envíos directos.

## 3. SMS (Twilio)

No está configurado (`sms: false`).

- [ ] Credenciales `CRM_TWILIO_ACCOUNT_SID`, `CRM_TWILIO_AUTH_TOKEN` y `CRM_TWILIO_FROM_SMS_NUMBER`, del
      dueño de la cuenta.
- [ ] Agregar el paquete `twilio` a `package.json` y correr "Run NPM Install" en cPanel.
- [ ] Registro **A2P 10DLC** si se envía a números de EE. UU. (confirmar las reglas para México).
- [ ] Probar con un número propio y quitar `sms` de `DISABLED_CHANNELS`.

## 4. Asistente con IA (en pausa, sin código)

Documentos: `crm_asistente_capa_modelos.md`, `crm_asistente_casos_prueba.json` (52 casos) y
`crm_v2_backlog.md`.

**Falta la aprobación del diseño:**

- [ ] Ubicación del código: `ReformaDental2025/server/crm/assistant/llm/`.
- [ ] Umbrales: 100 % en críticos, ≥90 % intención y herramienta, ≥85 % en el resto.
- [ ] Quién actúa como juez: otro modelo o una persona.
- [ ] Nombre del asistente.

**Decisiones abiertas del prompt:**

- [ ] Quién atiende urgencias fuera de horario y en cuánto tiempo.
- [ ] Tiempo que se promete al escalar a una persona.
- [ ] Unificar los correos del sitio (`dentalreforma.com` / `reformadental.com`; `privacy@` / `privacidad@`).
- [ ] Actualizar la política de privacidad (no menciona IA, Meta ni datos de salud); visto bueno del dueño
      y revisión legal.
- [ ] Comprobar que el calendario del sitio solo ofrezca lunes a sábado de 9 a 6.
- [ ] Bloqueantes de seguridad y privacidad de las secciones 6 y 8 de `crm_v2_backlog.md`.

**Por verificar antes de programar:** ID exacto de Gemini Flash-Lite y los límites de su capa gratuita;
formato `response_format` de Gemini; precios de proveedores distintos de Claude.

**Después de aprobar:** `generate()` con adaptadores de Gemini y Claude, corredor de pruebas local con los
52 casos, correrlo en los tres modelos y elegir. Luego, tablas de conversaciones, herramientas y simulador.
Claves solo en variables de entorno del servidor; la capa gratuita de Gemini puede usar lo enviado para
mejorar productos de Google, así que solo mensajes ficticios.

## 5. Seguridad del backend del dashboard (`dashboard.js`)

Leído del código, no probado contra el servidor. Es independiente del CRM y conviene hacerlo pronto.

- [ ] `PUT /api/users/:id` **sin autenticación** y acepta `password` (el más grave).
- [ ] `JWT_SECRET` escrito en el código.
- [ ] `GET /api/users` sin auth y con `SELECT *` (expone hashes).
- [ ] `register`, `DELETE`, `/apps` y rutas de subida sin protección; faltan `requireAuth` y `requireAdmin`.
- [ ] Contraseña SMTP en el código; `/api/register` manda la contraseña en texto plano.
- [ ] Del CRM: límite de envíos, roles, revocación de tokens y `trust proxy`.

## 6. Cumplimiento (rama `compliance`)

Del backlog, sin verificar contra el código actual:

- [ ] Política de privacidad y términos (hay un directorio `legal/` sin commit).
- [ ] Aviso en `packages.tsx`, `lang` dinámico en `layout.tsx` y declaración de accesibilidad (hay un
      directorio `accessibility/` sin commit).
- [ ] Chatbot: lo que escribe el visitante va a `/api/chat`; avisar.
- [ ] Etiquetas del login y de la landing; script `lint` roto en Next 16.
- [ ] Datos del CRM, registro de envíos, CAPI para clientes médicos, contrato de encargo y plan de
      respuesta ante brechas.

## 7. Más adelante

- Migrar el frontend a Vercel (en pausa; `BACKLOG.md` §2).
- Login único entre el dashboard y el CRM.
- Un VPS con una instancia por CRM, cuando haya un segundo CRM.

## Orden sugerido

1. El punto 1 de hoy (comprobación de las 5:50 PM, `touchLead`, monitor).
2. Commits por archivo en ambos repos.
3. El bloque 5 (seguridad del dashboard), por el riesgo del `PUT /api/users/:id`.
4. WhatsApp y SMS cuando el dueño entregue números y credenciales.
5. El asistente con IA, cuando se apruebe el diseño.

## Resuelto hoy (2026-10-21)

- Reinicios del proceso explicados: Apache en Shared termina la app por diseño (tickets NC-OHM-0983 y
  NC-HDA-9950). Ver `crm_validacion_2026-10-20.md` §7 y §12.
- Columna `crm_leads.effects_fired_at` aplicada en MySQL de producción (21 leads, 0 pendientes) y código
  que reprocesa los efectos de creación interrumpidos, desplegado según el usuario.
- Revisión de la mañana: `/health` ok, Settings sin error, lead de prueba con dos "Follow up again".
