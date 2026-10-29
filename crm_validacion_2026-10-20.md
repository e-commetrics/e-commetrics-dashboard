# CRM: revisión de la mañana, cron corregido y reinicios del proceso (2026-10-20)

Continuación de `crm_validacion_2026-10-19.md`. Alcance: **solo correo**; WhatsApp y SMS siguen en
pendiente a propósito. El CRM v2 sigue en pausa: ver `crm_v2_backlog.md`.

> No se guardan aquí contraseñas, tokens ni correos de pacientes.

Horas en UTC; Tijuana = UTC−7 (hasta el 2026-11-01).

## Resumen

- El bloque A de la revisión de la mañana **falló**: la app llevaba 1 segundo de vida y `lastTick`
  era `null`. Es decir, el cron de cPanel **no estaba llamando** y la app pasó la noche parada.
- **Causa encontrada:** el comando de Cron Jobs estaba mal escrito (sección 1). Se corrigió y desde
  entonces el cron funciona.
- Hallazgo nuevo: aunque el cron llame cada 5 minutos, el **proceso de Node se reinicia seguido y
  sin patrón fijo** (vidas medidas de ~65, ~35, ~22 y ~12 minutos; sección 3). Los ticks continúan,
  así que no hay pérdida de datos, pero el "la app ya no se detiene" del documento de ayer era
  demasiado optimista. Conclusión completa en la sección 7.
- **No se cambió código** en el dashboard ni en Reforma. Solo se cambió la línea de Cron Jobs (a mano,
  por el usuario) y se resolvió el conflicto de `BACKLOG.md`.

## 1. Causa del cron roto: comando mezclado

El comando guardado en Cron Jobs terminaba así:

```
... https://reformadental.com/crm/cron/tick >> /home/clinicareforma/crm/tick>/dev/null
```

Mezclaba la versión que guardaba un log con la versión final. Había dos redirecciones de la salida:
`>> .../crm/tick` abre un archivo y `>/dev/null` va después y gana. El problema real era la primera:
la carpeta `/home/clinicareforma/crm/` **no existe**, y cuando el shell no puede abrir el archivo de
una redirección falla **antes de ejecutar `curl`**. El cron nunca llamaba al endpoint.

**Comando correcto** (el final del 2026-10-19, sin ruta de log y sin `-i`):

```
curl -fsS --max-time 90 --retry 2 -X POST -H "X-Cron-Token: <token>" https://reformadental.com/crm/cron/tick >/dev/null
```

Horario: `*/5 * * * *`. No poner `%` sin escapar. No hace falta crear ninguna carpeta.

## 2. Verificación después de corregirlo

| Hora | Qué se vio |
|---|---|
| 16:56 | `/health` antes del arreglo: `uptimeSeconds: 1`, `lastTick: null`. La consulta misma despertó la app |
| ~17:08 | Comando corregido y guardado |
| 17:10:44 | `lastTick` con `source: http` (lo hizo el `curl` de cPanel), 1.78 s, `ok`. Last token check 10:10:43 AM coincide con el arranque del proceso |
| 17:12:37 | `/health`: `uptimeSeconds: 115`, sin `warnings` |
| 10:20:01 AM Tijuana | Last sync en Settings, múltiplo de 5 min: lo hizo un cron |
| — | **Last error:** no hay. En la pantalla se muestra pegado a la línea de Last sync, en rojo, como `— error: ...`; solo aparece si existe. Last CAPI event sin cambios (14-oct) |
| — | Tareas del lead de prueba: las tres de siempre ("Call within 1 hour" y las dos "Follow up again"); **no hay una tercera** |

## 3. Hallazgo: el proceso se reinicia aunque el cron llame

Consultas únicas a `/health`, cada una con su `uptimeSeconds`:

| Consulta | `uptimeSeconds` | Arranque del proceso |
|---|---|---|
| 17:12:37 | 115 | ~17:10:42 |
| 18:24:01 | 492 | ~18:15:49 (**65 min** después del anterior) |
| 19:01:10 | 621 | ~18:50:49 (**35 min exactos** después del anterior) |

Lectura:

- El proceso no vive de forma continua: se reinicia cada 35 a 65 minutos.
- Los arranques caen en el segundo `:49`, no en un múltiplo de 5 minutos, así que no los provoca el
  cron: algo reinicia el proceso.
- Aun así, `lastTick` siempre estaba reciente (de hace 1 a 4 minutos) y de fuente `cron interno`, y
  el cron de cPanel levanta la app tras cada reinicio. No se vio pérdida de leads. Riesgo: un tick
  retrasado hasta 5 minutos si un reinicio cae justo antes.
- `startedAt` en `/health` sale siempre igual a `time`: es cosmético, no usarlo. Fiarse de
  `uptimeSeconds`.

### Registro de `/health` cada 3 minutos (tarde del 2026-10-20)

Un script local (en segundo plano, solo mientras la sesión esté abierta) consultó `/health` cada
3 minutos y guardó hora, código, `uptimeSeconds` y `lastTick`. Un `uptimeSeconds` de 1 significa que
la consulta encontró la app **parada** y la arrancó. Muestras hasta las 23:05 UTC:

| Hora (UTC) | `uptimeSeconds` | `lastTick` (hora y fuente) |
|---|---|---|
| 22:34:43 | 259 | 22:30:27, `http` |
| 22:37:44 | 441 | 22:35:02, cron interno |
| 22:40:45 | 622 | 22:40:03, cron interno |
| 22:43:47 | 804 | 22:40:03, cron interno |
| 22:46:48 | 985 | 22:45:01, cron interno |
| 22:49:50 | 1167 | 22:45:01, cron interno |
| 22:52:51 | **1** | — (app recién arrancada) |
| 22:55:55 | 183 | 22:55:02, cron interno |
| 22:58:56 | 364 | 22:55:02, cron interno |
| 23:01:58 | 546 | 23:00:01, cron interno |
| 23:04:59 | **1** | — (app recién arrancada) |

| Proceso | Arrancó (UTC) | Murió entre | Vida aprox. |
|---|---|---|---|
| A | ~22:30:24 (lo levantó el cron de cPanel) | 22:49:50 y 22:52:50 | ~20–22 min |
| B | ~22:52:52 (lo levantó la consulta del script) | 23:02:00 y 23:04:58 | ~10–12 min |
| C | ~23:05 (lo levantó la consulta del script) | 23:44:22 y 23:45:37 | ~39–40 min |
| D | ~23:45:37 (lo levantó el cron de cPanel, `source: http`) | 00:20:40 y 00:23:42 | ~35–38 min |
| E | ~00:23:42 (lo levantó la consulta del script) | sigue vivo en la última muestra (00:29:46) | — |

Muestras posteriores (hasta las 00:29 UTC del 21-oct, todas con código 200 y sin `warnings`):
`uptimeSeconds` creció normal de 183 a 2361 (proceso C), cayó a 106 a las 23:47 (cron de cPanel
había levantado D), creció hasta 2103 a las 00:20 y cayó a 1 a las 00:23 (lo levantó el script).
Cuando el cron de cPanel levantó el proceso, la caída duró alrededor de un minuto o menos.
El registro sigue corriendo hasta ~01:36 UTC y vive en la carpeta temporal de la sesión; si se
pierde, estas tablas son el respaldo.

Lectura:

- **No es inactividad:** la app recibía una petición cada ~3 min (el script) más el cron de cPanel
  cada 5, y aun así se detuvo.
- **No es un ciclo fijo:** las vidas medidas hoy son ~65, ~35, ~22 y ~12 minutos en la primera parte de la
  tarde, y ~40 y ~37 minutos después; no hay tendencia ni patrón de reloj. Corrige el "35 a 65 minutos" del resumen: es un rango de la primera
  medición, no un límite.
- **El cron de cPanel levanta la app, pero a veces la consulta del script llegó primero.** Un tick
  puede perderse si el proceso muere antes de terminarlo (posible tick de las 22:50). El sync de
  leads se retrasa como máximo unos 5 minutos; no se vieron `warnings` ni pérdida de datos.
- **Sesgo de la medición:** las consultas cada 3 min levantan la app antes de que lo haga el cron,
  así que no se ve cuánto tiempo estaría caída sin ellas.
- La causa sigue sin conocerse. Con memoria y procesos al 1–5% apunta a algo externo (hosting),
  pero es una hipótesis. Estas horas se pueden pasar a Namecheap.

### Resource Usage y estado del servidor (capturas del usuario)

| Límite de la cuenta | Uso |
|---|---|
| Memoria física | 31.24 MB / 2 GB (1.5%) |
| Procesos | 11 / 200 |
| CPU | 0 / 200 |
| Procesos entrantes | 0 / 20 |
| IOPS / I/O | 0 |

- Estos valores son una **foto del momento**, no el historial de faults. Falta revisar las gráficas
  de 24 horas en Resource Usage.
- Estado del servidor (compartido, no de la cuenta): `litespeed_exporter` en rojo ("unknown"), discos
  `/tmp`, `/var` y `/var/tmp` al 86–88% con warnings, carga 42 con 40 CPU. Nada de esto prueba
  una causa.
- **Hipótesis (sin verificar):** el hosting recicla el proceso de Node por tiempo de vida o por su
  gestor de aplicaciones (Passenger o LiteSpeed), no por los límites de la cuenta.

## 4. Correo de aviso del cron

En **cPanel → Cron Jobs → Correo electrónico cron** no hay ninguna dirección. Por eso los errores de
`curl` de la noche anterior no llegaron a nadie. Con `>/dev/null` y `curl -fsS` solo se manda correo
si `curl` falla, así que no llena el buzón. Debe ser una dirección externa a `reformadental.com`.

## 5. Monitor externo a `/health` (análisis, sin crear)

Lectura de `ReformaDental2025/server/crm/health.js`:

| Situación | Respuesta |
|---|---|
| Todo bien | 200, `"status":"ok"` |
| Falla algo imprescindible (base, tablas, JWT, siembra, usuarios) | **503** |
| Cron de cPanel muerto (sin ticks en 15 min, con la app viva más de 15 min) | **200** con `"warnings"` |

Un monitor que solo mire el código HTTP no vería el último caso: hace falta uno de **palabra clave**
que alerte si la respuesta contiene `warnings`.

Opciones gratis (de comparativas de 2026, **sin confirmar en las páginas oficiales**): Better Stack
(3 min, 10 monitores) y UptimeRobot (5 min, 50 monitores; plan gratis de uso no comercial). Las
fuentes no coinciden sobre si la palabra clave está en el plan gratis. Recomendación: Better Stack,
y confirmar la palabra clave en su página de precios. **No se creó ninguna cuenta.**

## 6. Git

`BACKLOG.md` figuraba como `UU`, pero el archivo ya no tenía marcadores de conflicto (alguien lo mezcló
a mano y contiene lo más reciente de ambas versiones). Se hizo `git add BACKLOG.md` y quedó como `M `.
**No se hizo commit.** Siguen sin commit los demás cambios de la rama `compliance` y el trabajo en
`ReformaDental2025`.

## 7. Conclusión del día

**El CRM funciona, pero el hosting actual no mantiene vivo el proceso. Hoy el cron lo compensa y, por
ahora, no hay pérdida de datos.**

Establecido:

1. El cron estaba roto por un comando mal escrito (ruta de log inexistente que impedía ejecutar
   `curl`). Corregido; funciona desde entonces.
2. El sync de leads corre: Last sync avanza cada 5 minutos, Last error está vacío y no hay tareas
   duplicadas.
3. El proceso de Node se reinicia seguido y de forma irregular (vidas de ~12 a ~65 min: ~65, ~35,
   ~22, ~12, ~40 y ~37). Cuando lo levanta el cron de cPanel, la caída dura cerca de un minuto.
4. No es inactividad (la app recibía tráfico cada pocos minutos) ni los límites de la cuenta
   (memoria 1.5%, procesos 11/200, CPU 0). Esa foto no descarta faults pasados: falta el historial
   de 24 h de Resource Usage.

No se sabe: **quién mata el proceso ni por qué**. La hipótesis es el hosting (Passenger o
LiteSpeed); no está verificada. Es la pregunta abierta con Namecheap.

Efecto práctico:

- El cron de cPanel levanta la app tras cada caída: retraso máximo de unos 5 minutos en el sync, y
  un tick en curso puede perderse si el proceso muere. Los reinicios no borran leads ni tareas
  (todo vive en MySQL).
- La Ruta 1 (estabilizar en el backend actual) sigue funcionando, pero es frágil. Alcanza con un
  CRM de volumen bajo; con un segundo CRM o si se vuelve crítico, es razón para la Ruta 2 (VPS,
  `crm_validacion_2026-10-19.md` §8).
- **Decisión pendiente:** si Namecheap confirma que no se puede evitar, pasar a un VPS o mantener la
  Ruta 1 con monitor externo y correo de aviso. No hay nada que decidir antes de su respuesta.

## 8. Pendientes

- [x] **Guardar un correo externo en Cron Email** de cPanel (hecho por el usuario el 2026-10-20).
- [ ] Revisar las gráficas de 24 h de **Resource Usage** (faults de memoria, procesos, CPU).
- [ ] **Namecheap (live chat, 2026-10-20 ~1:51 PM Tijuana):** se abrió el caso por los reinicios
      (arranques 17:10, 18:15 y 18:50 UTC del 20-oct con memoria y procesos al 1–5%). El agente no
      dio plazo y dijo que responderá por correo. Falta anotar el número de ticket. Pidió no cambiar
      nada en cPanel mientras investigan. Nota: el resumen del bot decía que los reinicios ocurrían
      "antes del cron", lo cual no está probado; se pidió corregirlo. Al llegar su respuesta,
      anotarla aquí y decidir si la Ruta 1 sigue alcanzando.
      **Actualización 2026-10-21:** ticket **NC-OHM-0983**. El correo de seguimiento fue a otra
      dirección (no la de `ecommetrica@gmail.com`), asunto "Namecheap Chat Follow-Up: issue with the
      Node.js application". Su hipótesis: Apache reiniciándose, o un `process.exit()` en `server.js`.
      Revisión del código: los `process.exit` del bundle solo están en los comandos CLI
      (`--crm-seed`, `--crm-create-user`, `--crm-migrate`); el arranque normal no sale si falla la
      DB (solo registra). No hay handlers de `uncaughtException`/`unhandledRejection`: una excepción
      no capturada sí tumbaría el proceso. Pendiente revisar `stderr.log` y el log de Passenger.
      Segundo correo (2026-10-21): Engagement ID **NC-HDA-9950** (el del chat de hoy, tras la
      calificación negativa); dicen que los técnicos están revisando, sin plazo ni hallazgos.
      Hay dos referencias abiertas: NC-OHM-0983 y NC-HDA-9950. No cambiar nada en cPanel mientras tanto.
      **Respuesta final por live chat (2026-10-21):** según sus técnicos, Apache se reinicia en todos
      los servidores Shared (Stellar y Reseller incluidos) **por diseño, como medida de seguridad, y no
      se puede desactivar**. Del lado del servidor **no hay logs** que expliquen cada reinicio. Con esto
      los reinicios dejan de ser un fallo a corregir en Namecheap: son una condición del plan. Queda
      decidir entre Ruta 1 (aguantar con cron + monitor externo + correo de aviso) y Ruta 2 (VPS).
      **Confirmación (mismo chat):** cuando Apache se reinicia **termina la app** y "debería"
      reiniciarla sola (explica el `uptimeSeconds` que se reinicia). Pasa en todos los planes Shared
      (incluido Stellar); en **VPS o servidor dedicado no debería ocurrir**, y con gestión Basic o
      User-Responsible se tiene root completo.
- [ ] Crear el **monitor externo** a `/health` con palabra clave `warnings`.
- [ ] **2026-10-21, ~5:50 PM Tijuana:** comprobar que "Follow up again" vuelve **una sola vez**. Hasta
      entonces no completar tareas ni enviar mensajes en el lead de prueba.
- [ ] Solo después: probar `touchLead` enviando una plantilla al lead de prueba.
- [ ] Reportar disparador y estado de las otras tres reglas de automatización.
- [ ] Paso 13: segundo usuario del CRM (`ReformaDental2025/CRM_USUARIOS.md`).
- [ ] Confirmar si el CRM viejo de Next.js sigue sincronizando Facebook en paralelo.
- [ ] Commits por archivo en `ReformaDental2025` (`feature/crm-module`) y en este repo (`compliance`),
      sin `git add .`.
- [ ] Los puntos D y E de `crm_validacion_2026-10-19.md` siguen igual.

## 9. Lecciones

- Si una redirección de salida apunta a una ruta que no existe, el comando completo **no se ejecuta**.
  Al cambiar un comando de Cron Jobs, copiar la versión final entera y no mezclar con versiones
  anteriores.
- `lastTick.source` no dice si el cron de cPanel funciona; sirven `uptimeSeconds` y la hora de
  `lastTick`.
- Un `uptimeSeconds` pequeño tras horas sin tráfico **no** prueba que el cron falle: puede ser el
  reciclaje del proceso. Para saberlo, mirar `lastTick` y comparar varias consultas separadas.
- Cada consulta a `/health` despierta la app si estaba parada.

## 10. Para retomar mañana (2026-10-21)

Estado al cierre del 2026-10-20:

- **Cron de cPanel:** corregido y funcionando; correo de aviso guardado en Cron Email.
- **Reinicios del proceso:** documentados (§3 y §7). Caso abierto con Namecheap por live chat
  (~1:51 PM Tijuana); responderán por correo, sin plazo. **No hay número de ticket anotado.**
- **Asistente con IA:** en diseño, sin código. Hay 4 documentos nuevos o ampliados: ver más abajo.
- **Nada tiene commit.**

### Orden sugerido

1. **Revisión corta (5 min, antes de tocar nada):** una sola consulta a `/health` (leer
   `uptimeSeconds` y `lastTick`); en Settings anotar Last sync y Last error; en la ficha del lead
   de prueba, pestaña Tasks, confirmar que no hay una tercera "Follow up again". No completar tareas
   ni enviar mensajes en ese lead hasta la comprobación de las 5:50 PM.
2. **Correo de Namecheap:** buscar su respuesta y el número de ticket; pegar el texto sin datos
   sensibles. Con eso actualizar §7 y decidir si la Ruta 1 alcanza o hay que ir al VPS. Mientras
   tanto no cambiar el cron ni la app.
3. **Resource Usage de 24 h:** revisar si hay faults de memoria, procesos o CPU (las capturas de hoy
   fueron una foto del momento).
4. **~5:50 PM Tijuana:** comprobar que "Follow up again" vuelve **una sola vez**. Después, probar
   `touchLead` enviando una plantilla al lead de prueba.
5. **Monitor externo** a `/health` con palabra clave `warnings` (Better Stack candidato; confirmar
   que su plan gratis incluye palabra clave), reglas de automatización pendientes y paso 13
   (segundo usuario).
6. **Commits por archivo,** sin `git add .`, en este repo (`compliance`) y en `ReformaDental2025`.

### Asistente con IA: dónde nos quedamos

Archivos creados el 2026-10-20 (sin commit):

| Archivo | Qué es |
|---|---|
| `crm_asistente_casos_prueba.json` | 52 casos ficticios (26 críticos) para comparar modelos |
| `crm_asistente_capa_modelos.md` | Diseño de la capa que cambia de modelo por configuración, guardas en código y criterios de aceptación |
| `crm_v2_backlog.md` | Sección "Actualización 2026-10-20" con los datos del negocio, el prompt rellenado y las decisiones abiertas |

Decisiones tomadas hoy: el asistente va dentro del CRM de Reforma, avanza por capas y empieza con
datos ficticios; horario lunes a sábado 9 a 6; pagos efectivo, tarjeta y aseguradora; teléfono del
sitio (+1 619-586-1436); no da precios; no cambia ni cancela citas (eso es por el sitio web);
solo agenda un día y la cita queda "solicitada". Modelo candidato: Gemini Flash-Lite (capa
gratuita) contra Gemini Flash y Claude Haiku 5.5, decidido con las pruebas.

**Pendiente de tu aprobación para seguir con código:**

- [ ] Ubicación del código: `ReformaDental2025/server/crm/assistant/llm/`.
- [ ] Umbrales (100% en críticos, ≥90% intención y herramienta, ≥85% en el resto).
- [ ] Quién actúa como juez: otro modelo o una persona.
- [ ] Nombre del asistente.
- [ ] Quién atiende las urgencias fuera de horario y el tiempo que se promete al escalar.

**Por verificar antes de programar:** el ID exacto del modelo Flash-Lite y los límites de la capa
gratuita (ambos en Google AI Studio); el formato de `response_format` de Gemini (el
`responseSchema` figura como obsoleto); los precios de proveedores distintos de Claude (venían
de terceros y se contradecían).

**Siguiente trabajo, cuando se apruebe:** `generate()` con adaptadores de Gemini y Claude y pruebas
con respuestas simuladas; corredor de pruebas local; correrlo en los tres modelos; elegir.
Recién después: tablas de conversaciones, herramientas y la pantalla del simulador en el CRM.

### Cuidados (asistente)

- Las claves (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`) solo en variables de entorno del servidor,
  nunca en el chat, el repo ni el frontend.
- La capa gratuita de Gemini puede usar lo enviado para mejorar los productos de Google: solo
  mensajes ficticios.
- No cambiar etapas de leads reales ni activar reglas de mensaje: CAPI está en modo real.
- `/health` despierta la app si estaba parada: consultarlo una vez y leer `uptimeSeconds`.

## 11. WhatsApp y SMS (Twilio) desactivados en la interfaz (2026-10-20)

### Por qué
- La validación es **solo con correo** (ver el alcance al inicio). WhatsApp y SMS nunca se han
  validado en producción: WhatsApp usa el número de pruebas de Meta y SMS no está configurado
  (`ReformaDental2025/CRM_STATUS.md` §5 y §5b; `crm_v2_backlog.md` §6).
- CAPI está en modo real y hay un lead de prueba con tareas en curso: un envío accidental por un
  canal sin validar sería lo que más cuesta deshacer (un SMS a quien no lo pidió "quema" la cuenta
  de Twilio, como ya dice el comentario de `SendMessageModal.tsx`).
- Decisión del usuario: en vez de esconder los canales, **mostrarlos desactivados**, para que quien
  entre al CRM vea que existen pero que están apagados a propósito. El usuario avisará cuándo
  reactivar cada uno.

### Qué se hizo (solo frontend, sin commit)
| Archivo | Cambio |
|---|---|
| `webapp/crm/lib/channels.ts` (nuevo) | Lista `DISABLED_CHANNELS = ["sms", "whatsapp"]` y `isChannelDisabled()`. Único lugar a tocar para reactivar |
| `components/SendMessageModal.tsx` | Botón de WhatsApp atenuado, con etiqueta "Disabled" y no seleccionable; el botón Send también se bloquea |
| `screens/SettingsScreen.tsx` | Chips "SMS (Twilio): disabled" y "WhatsApp (Meta): disabled"; en Test de mensajería las dos opciones salen "(disabled)" y "Send test" se bloquea |
| `components/ui.tsx` | `SelectOption` acepta `disabled` (lo usa el selector de canal) |

Verificación: `tsc --noEmit` sin errores. **No se probó en el navegador ni se hizo build.**

### Límites
- Solo bloquea la interfaz. El backend de Reforma sigue aceptando el envío si alguien lo llama
  directo, y una regla de automatización de mensaje podría enviar por WhatsApp si se activa. Las
  reglas de mensaje están deshabilitadas según `CRM_STATUS.md`, pero no se volvió a comprobar hoy.
- Para producción falta build y subida a `public_html`.

### Para reactivar
Quitar el canal de `DISABLED_CHANNELS` en `lib/channels.ts`, build y subida. Antes, validar ese
canal con el lead de prueba.

## 12. Registro del 2026-10-21

### Revisión corta (mañana, ~10:30 AM Tijuana)
- `/health` ok: DB, calendario, CRM, scheduler y `cronEndpoint` en ok; último tick 17:25:03 UTC (2.9 s);
  `uptimeSeconds` 1622. `startedAt` salió igual que `time`, lo cual no cuadra con 27 min de uptime:
  comparar en otra consulta antes de interpretarlo.
- Settings: Last sync 10:45:03 AM, token válido (check 10:47:40 AM), SMS y WhatsApp "disabled".
  Last error no se pegó; no se vio ninguno.
- Lead de prueba, Tasks: solo **dos** "Follow up again" (10/16 6:05 PM y 10/19 10:25 AM) más "Call
  within 1 hour" vencida desde el 9/29. Activity sin cambios desde el 10/16. Último CAPI 10/14.
- `bun run build` compila sin errores (33 páginas), incluido `/dashboard/webapp/crm`. No se probó en
  navegador ni se subió a producción.

### Namecheap (cerrado)
Ver §7: tickets NC-OHM-0983 y NC-HDA-9950; Apache termina la app por diseño en Shared; sin logs del
servidor; en VPS o dedicado no debería ocurrir. El correo de seguimiento llegó a otra dirección que
la de `ecommetrica@gmail.com`.

### Ruta 1 (Shared) vs Ruta 2 (VPS)
| | Ventajas | Desventajas |
|---|---|---|
| Ruta 1: quedarse | Sin costo extra ni migración; todo ya funciona; cPanel (SSL, correo, MySQL) hecho; el cron amortigua los reinicios | Reinicios inevitables cada 35 a 65 min; "debería" levantar sola, sin garantía; una petición a medias puede perderse; ticks pueden retrasarse; sin logs ni root; difícil escalar |
| Ruta 2: VPS | Sin esos reinicios; root completo; logs propios; espacio para segundo CRM y asistente | Cuesta más (precio sin verificar); se administra el servidor; migrar da trabajo y riesgo (Node, MySQL, SMTP, cron, dominio, cookies SameSite=None); sin cPanel salvo licencia |

**Recomendación (pendiente de confirmar por el usuario):** quedarse en Ruta 1 con monitor externo a
`/health` (palabra clave `warnings`) y correo de aviso. Pasar a VPS si el CRM atiende pacientes a diario,
se notan eventos o ticks perdidos, o se monta el asistente con IA en producción.

### Qué está comprobado y qué falta (CRM solo correo, sin asistente)
- **Comprobado:** entrada de leads de Facebook, envío de la plantilla `new-lead-confirmation` por
  correo (10/16, **manual desde el lead**; la regla automática de ese correo está deshabilitada, ver §13),
  tareas automáticas y su repetición, cambio de etapa, CAPI, scheduler y sync, login.
- **Falta:** `touchLead` (enviar plantilla a mano; el correo automático de lead nuevo está deshabilitado), que "Follow up again" salga una sola vez (hoy ~5:50 PM),
  las otras tres reglas de automatización, un lead real de anuncio de punta a punta, segundo usuario
  y la estabilidad del proceso.

### Revisión de seguridad ante reinicios (código del backend, 2026-10-21)
Archivos leídos en `ReformaDental2025/server/crm/`: `scheduler.js`, `services/tick.js`, `routes/cron.js`,
`services/automation.js`, `services/leads.js`, `services/facebook/sync.js`, `services/messaging/index.js`,
`services/facebook/capi.js`, `services/repo/tasks.js` y `syncState.js`. Solo lectura, sin cambios.

- **Seguro ante reinicios:** el sync de Facebook (deduplica por `fb_leadgen_id`, con índice UNIQUE); las
  tareas (la comprobación "no repetir tarea abierta" lee de la base, no de memoria, así que un reinicio
  **no** crea un "Follow up again" duplicado); el candado del tick y `lastTick` (en memoria, se pierden
  sin daño); los errores de tick (envueltos en try/catch, no tumban el proceso).
- **Riesgo real: efectos de un lead nuevo perdidos para siempre.** `createLead` inserta el lead y su
  actividad y **después** dispara CAPI + reglas (tarea "Call within 1 hour" y, **solo si su regla está
  habilitada**, el correo `new-lead-confirmation`; en el seed está deshabilitada). Si el proceso muere en
  ese intervalo (segundos), el lead queda guardado, el siguiente sync lo ve como existente y **nunca** se
  ejecutan CAPI ni tarea. El comentario del código solo reconoce la pérdida de CAPI; también se pierde la
  tarea.
- **Riesgo menor: crear tarea no es atómico** (comprobar y luego insertar, sin índice UNIQUE). Solo
  duplicaría si dos procesos corren un tick a la vez (el candado es por proceso).
- **Riesgo menor: `send_message` no tiene protección contra repetición** (solo `create_task` la tiene).
  Se corrige solo si el envío sale bien (`touchLead`); si el envío sale y `touchLead` falla, una regla
  `stale_contacted` repetiría el envío cada 5 min. Las reglas de mensaje están deshabilitadas.
- **No revisado:** el calendario de citas (comparte el proceso) y qué pasa con peticiones HTTP a medias.
- **Arreglo propuesto (requiere cambio en producción, sin hacer):** columna `effects_fired_at` en
  `crm_leads`; marcarla tras los efectos; en cada tick, reprocesar leads con esa columna nula y más de 2
  min de antigüedad. Opcional: `event_id` en CAPI para que Meta deduplique.

### Corrección: leads en `crm_leads` (2026-10-21)
Contra lo que decían notas anteriores ("solo hay un lead conocido"), la tabla tiene **21 leads**: 18 que
entraron en bloque el 2026-09-29 ~22:45 UTC (primer sync de Facebook, aparentemente reales; 2 en
`scheduled`, 1 en `consultation`, el resto `new`), el lead de prueba con tareas (Kevin Okhuysen,
`contacted`, 9/30 00:55 UTC), `Reforma Dental Test` (10/14) y `<test lead: dummy data for full_name>`.
Hay datos de pacientes reales en la base. Antes de subir el código de `effects_fired_at` hay que
rellenar los 21 con `UPDATE crm_leads SET effects_fired_at = created_at`, o el tick los reprocesaría.

### `effects_fired_at`: columna aplicada, código preparado (2026-10-21)
- **Base de producción:** el usuario aplicó `ALTER TABLE crm_leads ADD COLUMN effects_fired_at DATETIME(3) NULL`
  y `UPDATE ... SET effects_fired_at = created_at`. Verificado: columna existe, 21 leads, 0 pendientes.
- **Código (sin commit, sin subir) en `ReformaDental2025/server/`:** `crm/services/repo/leads.js`
  (`markEffectsFired`, `listLeadsPendingEffects`), `crm/services/leads.js` (`createLead` marca al terminar
  los efectos; `recoverPendingLeadEffects` da una segunda oportunidad, una sola vez por lead, a los leads
  sin marca con más de 2 min), `crm/services/tick.js` (llama la recuperación en cada tick) y `schema.sql`.
- **Límite:** solo cubre los efectos de **creación**; los de un cambio de etapa no se recuperan.
- **Probado:** carga de módulos y la lógica con dobles (marca tras éxito; en la recuperación marca aun si
  falla). **No probado contra MySQL real** ni en producción.
- **Despliegue (según el usuario, 2026-10-21):** `out/server.js` se construyó ~13:07 (hora local) y contiene el
  código nuevo; se indica que se subió y reinició. `/health` no expone versión: no verificable desde fuera.
  Falta probarlo con un lead nuevo real y commitear.

## 13. Reglas de automatización y paginación (2026-10-21)

### Las cinco reglas (según `crm-seed.sql`; el estado de producción puede diferir)
| Regla | Disparador | Acción | Seed |
|---|---|---|---|
| `new_lead_call_task` | Lead nuevo | Tarea "Call within 1 hour" (vence en 1 h) | **Habilitada** |
| `new_lead_confirmation_message` | Lead nuevo | Correo `new-lead-confirmation` | **Deshabilitada** |
| `stale_contacted_followup_task` | Lead en `contacted` sin actividad 48 h | Tarea "Follow up again" | **Habilitada** |
| `scheduled_reminder_task` | Cambio de etapa a `scheduled` | Tarea "Appointment reminder (1 day before)" (vence al crearse, `delayHours` 0) | **Habilitada** |
| `scheduled_reminder_message` | Cambio de etapa a `scheduled` | SMS `appointment-reminder` | **Deshabilitada** |

- Con las dos de mensaje apagadas, el CRM **no manda correos ni SMS por su cuenta**: todo envío es manual.
- Un cambio a `scheduled` crea la tarea de recordatorio **y** dispara el evento CAPI "Scheduled" real.
- `crm-seed.sql` y `--crm-seed` hacen `ON DUPLICATE KEY UPDATE ... enabled`: volver a correrlos **pisa**
  cualquier cambio de habilitación hecho a mano.
- **Para confirmar el estado real en producción:** ``SELECT `key`, enabled FROM crm_automation_rules;``
  (debe dar 1, 0, 1, 1, 0 en ese orden).

### Paginación del sync de Facebook (código local, sin desplegar)
`server/crm/services/facebook/sync.js` ahora pide `limit=100`, sigue `paging.next` hasta 30 páginas por
lista y corta cada petición a los 30 s. Antes leía solo la primera página (~25). Probado con respuestas
simuladas (3 páginas, 4 leads); no contra Facebook. **Desplegado el 2026-10-21 ~2:40 PM Tijuana (según el usuario; primer tick con el código nuevo `ok`, 2.8 s, y el CRM sigue en 21 leads, o sea que no importó leads antiguos).** Antes se había advertido: un ciclo con muchas páginas tarda más y el candado del tick sigue en 10 min.

## 14. Prueba de las 5:50 PM y touchLead (2026-10-21)

Resultados (lead de prueba Kevin Okhuysen, solo lectura salvo el envío de la plantilla):

- **"Follow up again" a las 48 h: OK.** El tick interno de las 5:55:02 PM Tijuana creó **una sola** tarea nueva
  (vence 10/21 5:55:02 PM). El tick de las 5:50:28 PM (cron http) no la creó. Sin duplicados.
- **Envío de plantilla: OK.** `new-lead-confirmation` por correo a las 5:56:42 PM; Activity registró
  `message_sent`; el usuario confirmó que el correo llegó. Sin `message_failed`, `capi_failed` ni cambios de etapa.
- **touchLead: aún no concluyente.** El tick de las 6:00:15 PM (source http) terminó con `ok: false` en
  293 ms, justo tras otro reinicio del proceso (uptime 119 s en `/health` a las 6:02). `/health` no
  muestra el error, así que la causa **no está verificada** (hipótesis: tick lanzado a los 2 s de arrancar).
  Tras ese tick sigue **una sola** "Follow up again", pero esa regla pudo no evaluarse. Falta un tick `ok: true`
  posterior al envío (chequeo programado ~6:08 PM).
- Otros reinicios hoy: ~5:50 PM y ~6:00 PM (Apache, ver §7 y §12). `startedAt` en `/health` salió igual a `time`
  en la primera consulta (posible error de cálculo; revisar).

**Resultado definitivo (6:08 PM Tijuana):** el tick de las 6:05:02 PM (cron interno) terminó `ok: true` en 2.8 s,
posterior al envío de las 5:56:42 PM. Tras él sigue **una sola** "Follow up again" abierta (5:55:02 PM) y Activity
solo agrega `message_sent` (sin `message_failed`, `capi_failed` ni cambios de etapa). **touchLead: OK** (enviar la
plantilla no generó una segunda tarea). El tick fallido de las 6:00 queda sin causa conocida; si se repite con
el proceso ya levantado, investigar. No se verificó el conteo de 21 leads en esta ronda (`/health` no lo expone).
