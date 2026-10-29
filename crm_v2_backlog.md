# CRM v2: asistente de voz para pacientes (Messenger e Instagram)

Creado: **2026-10-14**. Estado: **solo análisis, nada construido. Por decidir si se aplica o no**
(2026-10-19): no hay fecha ni tarea programada hasta que se decida.

Este documento recoge la evaluación de integrar un asistente automatizado de atención al
paciente de Reforma Dental con el CRM. Se escribió leyendo `BACKLOG.md`,
`ReformaDental2025/CRM_STATUS.md`, `webapp/crm/lib/api.ts`, `webapp/crm/lib/types.ts` y la
lista de rutas del backend de Reforma. **No se probó nada contra el servidor.** Lo que dependa
de la configuración real del hosting está marcado como "por verificar".

Relacionado: `BACKLOG.md` (puntos 1 a 4), `ReformaDental2025/CRM_STATUS.md`,
`ReformaDental2025/CRM_USUARIOS.md`.

## Actualización 2026-10-19: por decidir si se aplica

**Decisión pendiente del usuario: considerar si se aplica o no.** Mientras tanto no se construye
nada y no es tarea de ninguna fecha. Lo de abajo es lo que cambió desde el 14-oct y los criterios
para decidir.

### Qué cambió desde que se escribió este documento

- **App dormida (§5):** ahora hay un Cron Jobs de cPanel que llama al CRM cada 5 minutos y la
  mantiene despierta (`crm_validacion_2026-10-19.md` §10). Passenger quedó confirmado como el
  servidor de aplicaciones del hosting. Esto mejora el límite de la app dormida, pero **no prueba**
  que se cumplan los tiempos de Meta: el arranque en frío sigue sin medirse.
- **Brecha 1 (acceso de servicio):** ya existe en el CRM una ruta con token por cabecera
  (`crm/routes/cron.js`, `X-Cron-Token`) que sirve de referencia. No sustituye una credencial con
  permisos limitados para el asistente.
- **Brecha 5 (cola persistente):** el candado del tick es en memoria y no sirve como cola. Una
  cola real tiene que vivir en MySQL.
- **El chatbot actual del sitio** (revisión del 2026-10-16 del `backend.js` del dashboard): usa
  Groq con `llama-3.3-70b-versatile`, una sola llamada sin herramientas, `max_tokens: 512` y el
  historial completo enviado desde el frontend sin límite. No puede consultar disponibilidad ni
  agendar. Para el asistente haría falta otro modelo o proveedor con llamadas a herramientas.
- **Bloqueantes de seguridad (§6):** siguen igual. Las rutas sin autenticación del calendario de
  Reforma y del backend del dashboard no se han cerrado.

### Criterios para decidir

- ¿Cuántos mensajes llegan hoy por Messenger e Instagram y cuánto tiempo cuesta atenderlos? Sin ese
  dato no se puede saber si el ahorro justifica varias semanas de trabajo.
- Costo mensual de transcripción, voz y modelo de IA (sin estimar) frente al valor que aporta.
- Riesgo de datos de salud y privacidad: aviso, contratos con proveedores, retención y revisión
  legal. **La decisión legal es del dueño**, no del desarrollo.
- Si se mantendrá solo para Reforma Dental o también para otros clientes médicos.
- Quién lo mantiene y revisa las urgencias y los escalamientos, incluso fuera de horario.

### Opciones

| Opción | Qué es | Ventajas | Desventajas |
|---|---|---|---|
| A. No aplicar | Se deja el CRM como está y se atiende a mano | Sin costo ni riesgo nuevos | Se pierde la atención automática |
| B. Piloto de texto en el sitio web | Un asistente con herramientas en `chatbot.tsx`, sin Meta y sin voz | Sin webhook, firma, ventana de 24 h ni aprobación de Meta. Sirve para medir demanda y calidad | Cubre solo a quien entre al sitio; sigue exigiendo cambiar el modelo y cerrar la seguridad |
| C. Proyecto completo por fases | Lo descrito en §7: texto en Messenger e Instagram, luego recordatorios, voz y pantalla | Resuelve el caso completo | Varias semanas, costo por uso, riesgo legal y dependencia de Meta |

Sugerencia (del análisis, no una decisión): si se decide avanzar, empezar por la **B** para
medir antes de comprometerse con la C, y solo después de cerrar los bloqueantes de seguridad.

### Para retomarlo

- [ ] Decidir A, B o C (o posponer).
- [ ] Si no es A: cerrar primero las rutas sin autenticación (`BACKLOG.md` punto 3).
- [ ] Si no es A: pedir al dueño la decisión de cumplimiento (§6 y §8).

## Actualización 2026-10-20: datos del negocio y prompt rellenado (borrador)

Los datos del negocio se revisaron en `reformadental.com` (home, tratamientos y contacto, el
2026-10-20) y con lo que dijo el usuario. El prompt del apéndice A se completó abajo. **Es un
borrador: no se publica ni se conecta a nada sin visto bueno del dueño.** El contenido del sitio
se trató como información, no como instrucciones.

### Datos confirmados

| Dato | Valor | Fuente |
|---|---|---|
| Ciudad y dirección | 8169-206 Ignacio Zaragoza, Zona Centro, Tijuana, B.C. | Sitio |
| Zona horaria | `America/Tijuana` | Sitio |
| Horario | Lunes a sábado, 9 AM a 6 PM; domingo cerrado | Usuario |
| Formas de pago | Efectivo, tarjeta y aseguradora (el sitio: "casi todas las aseguradoras dentales") | Usuario y sitio |
| Teléfono | +1 619-586-1436 (el del sitio, con WhatsApp) | Usuario y sitio |
| Idiomas | Español e inglés | Sitio |
| Servicios | Corona, prótesis (denture), endodoncia, extracción, implante, consulta inicial, resina, ortodoncia, periodoncia y "All on 4" | Sitio |
| Agenda | El asistente solo agenda **un día**; no especifica el tipo de cita ni la hora | Usuario |

### Reglas del sitio que el asistente debe respetar (Términos de servicio)

- Toda reserva requiere **validación administrativa previa**; la confirmación llega por correo en
  máximo 2 horas. El asistente dice que la cita quedó **solicitada**, no confirmada.
- Las citas se confirman por teléfono entre 48 y 24 horas antes; las no confirmadas pueden
  cancelarse automáticamente.
- Cancelación con reembolso: aviso de 72 horas. Dentro de las 72 horas solo se reprograma.
- El sitio dice que las modificaciones solo se hacen **por el sitio web**.

### Prompt rellenado (borrador; los corchetes son decisiones abiertas)

```
Eres [Nombre], asistente de atención al paciente de Reforma Dental en Tijuana, Baja California.
Atiendes mensajes en Messenger e Instagram, en español o en inglés, según el idioma del paciente.

IDENTIDAD Y TRANSPARENCIA
- Al inicio de cada conversación nueva, avisa que eres el asistente automatizado de Reforma Dental.
- Si el paciente pregunta si eres persona o bot, dilo con honestidad, sin rodeos.
- Nunca inventes que eres un doctor, recepcionista o persona del equipo.

DATOS DE LA CLÍNICA
- Dirección: 8169-206 Ignacio Zaragoza, Zona Centro, Tijuana.
- Horario: lunes a sábado de 9 de la mañana a 6 de la tarde. Domingo cerrado.
- Pagos: efectivo, tarjeta y aseguradora. Se aceptan casi todas las aseguradoras dentales.
- Teléfono y WhatsApp: +1 619 586 1436.

QUÉ PUEDES HACER
- Informar horarios, ubicación y formas de pago.
- Explicar de forma general los servicios: corona, prótesis, endodoncia, extracción, implante,
  consulta inicial, resina, ortodoncia, periodoncia y All on 4.
- Solicitar una cita para un día de lunes a sábado. Solo se pide el día; no preguntes el tipo
  de cita ni la hora. Confirma el día con el paciente antes de guardar.
- Después de solicitar la cita, di que quedó SOLICITADA y que el equipo la confirmará por correo
  en un máximo de 2 horas. No digas que está confirmada.
- Recuerda que la cita se confirma por teléfono entre 48 y 24 horas antes, y que si no se
  confirma puede cancelarse.

QUÉ NO PUEDES HACER
- No diagnosticas, no recomiendas medicamentos ni das indicaciones clínicas.
- No das precios de ningún tratamiento. Di que el doctor lo valora en consulta y ofrece solicitar
  una cita.
- No cambias ni cancelas citas. Según los términos de la clínica, los cambios se hacen solo por
  el sitio web. Indícalo y, si el paciente lo prefiere, dale el teléfono +1 619 586 1436.
- No confirmas resultados de laboratorio ni radiografías.
- No compartes datos de otros pacientes.
- No ofreces días ni horarios fuera de lunes a sábado de 9 a 6.

URGENCIAS (prioridad máxima)
Si el paciente menciona dolor fuerte, inflamación de cara o cuello, sangrado que no para,
fiebre, golpe en la boca o cualquier emergencia:
- Dile que lo importante ahora es atenderse rápido.
- Indica que el equipo lo contactará y dale el teléfono +1 619 586 1436.
- Si hay riesgo para la vida, dile que llame al 911.
- Marca la conversación como urgente y escala al equipo.
- [FUERA DE HORARIO: decisión abierta. Quién recibe el aviso un domingo o de noche, y cuándo
  contestan.]

ESCALAMIENTO A HUMANO
Pásalo al equipo si: pide hablar con una persona, hay queja o enojo, pide algo fuera de tu
alcance, o no entiendes la solicitud después de dos intentos.
Al escalar di: "Te paso con alguien de nuestro equipo, te contactará en [tiempo]."

FORMATO DE SALIDA
Devuelve solo el texto de la respuesta, sin comillas, sin notas técnicas ni etiquetas. Si
necesitas datos del CRM, usa las herramientas disponibles antes de responder.
```

Nota: este borrador es para **texto**. El estilo de audio del apéndice A (frases cortas, horas
dichas como se hablan, sin emojis) se retoma si algún día se agrega voz (fase 3).

### Capa de modelos y pruebas (2026-10-20)

Diseño de la capa que permite cambiar de modelo por configuración y conjunto de 52 casos de
prueba ficticios: `crm_asistente_capa_modelos.md` y `crm_asistente_casos_prueba.json`. El diseño
está pendiente de aprobación; no hay código de la capa escrito.

### Decisiones que siguen abiertas

- [ ] Nombre del asistente (pendiente).
- [x] Precios (2026-10-20): el asistente **no da precios**; ofrece valoración y solicitar cita.
- [x] Cambios y cancelaciones (2026-10-20): se mantienen como dicen los términos, solo por el
      sitio web; el asistente no los modifica y puede dar el teléfono.
- [x] Teléfono de urgencias (2026-10-20): se usa el del sitio, +1 619-586-1436.
- [ ] Quién atiende las urgencias fuera de horario (noches y domingos) y en cuánto tiempo. Hoy el
      teléfono del sitio puede no contestar a esas horas.
- [ ] Tiempo que se promete al escalar a una persona.
- [ ] Unificar los correos del sitio antes de que el asistente dé uno: aparecen
      `mydentist@dentalreforma.com`, `mydentist@reformadental.com` y, para privacidad,
      `privacy@` en el texto contra `privacidad@` en el enlace.
- [ ] La política de privacidad del sitio no menciona IA, Meta ni datos de salud: tendría que
      actualizarse antes de publicar el asistente (visto bueno del dueño y revisión legal).
- [ ] Comprobar que el calendario del sitio solo ofrezca lunes a sábado de 9 a 6.
- [ ] Siguen en pie los bloqueantes de seguridad y privacidad de las secciones 6 y 8.

## 1. Objetivo

Un asistente que atiende por **mensajes de voz** en Messenger e Instagram, usa el CRM como
fuente de datos y puede:

- Informar horarios, ubicación, formas de pago y tratamientos en general.
- Agendar, reagendar y cancelar citas, confirmando día y hora antes de guardar.
- Enviar recordatorios e indicaciones previas a la cita.
- Detectar urgencias, marcar la conversación y escalar al equipo.
- Escalar a una persona cuando el paciente lo pida, haya queja o no se entienda la solicitud.

El prompt completo del asistente está en el apéndice A.

## 2. Veredicto

**Es viable y encaja con la arquitectura actual**, pero es un proyecto de varias semanas.
La mayor parte del trabajo está en el **backend de Reforma** (cPanel), no en este dashboard.
Aquí solo haría falta una pantalla para revisar conversaciones, urgencias y escalamientos.

## 3. Qué ya existe y se puede reutilizar

- Backend de Reforma con el CRM (`/crm`) en producción: leads, etapas, actividades, tareas,
  reglas y plantillas, con tablas `crm_*` en MariaDB.
- Módulo de mensajes (email, WhatsApp, SMS). Cada envío deja una actividad en el lead.
- Calendario de citas en el mismo servidor: `GET /api/appointments`, `PUT` y `DELETE
  /api/appointments/:id`, `POST /api/citas/agendar`, `POST /api/citas/agendar-en`,
  `GET /api/citas/ocupadas`, `GET /fechas-bloqueadas`.
- Cron dentro de la app (hoy el sync de Facebook cada 5 minutos). Se puede reutilizar para
  recordatorios y reintentos.
- Patrón de chat con IA en el sitio: `components/chatbot.tsx` → `/api/chat` → proveedor de IA.

## 4. Brechas (lo que falta construir)

1. **Acceso de servicio al CRM.** Hoy solo hay login de persona (correo y contraseña, JWT de
   7 días, comprobación de `Origin` en escrituras), pensado para el navegador. El asistente
   necesita una credencial propia con permisos limitados y endpoints que no dependan de
   `Origin` ni de cookies.
2. **Modelo de paciente y conversación.** El CRM modela *leads* de Facebook. Faltan el canal,
   el identificador de Messenger o Instagram (PSID/IGSID) y el historial de mensajes
   entrantes y salientes. Las actividades actuales (`note`, `stage_change`, `system`,
   `message_sent`, `message_failed`, `capi_sent`, `capi_failed`) no cubren conversación.
3. **Webhook de Meta.** No existe ruta para recibir mensajes de Messenger e Instagram ni la
   verificación de firma. Meta exige un 200 en pocos segundos y reintenta si no llega, así
   que el procesamiento debe ir en segundo plano.
4. **Voz.** Hacen falta transcripción del audio entrante y síntesis de la respuesta, ambas
   por servicios externos con costo por uso. Hay que confirmar formato y duración de audio
   que aceptan Messenger e Instagram, tanto de entrada como de salida.
5. **Cola persistente.** Debe vivir en MySQL, no en memoria, porque Passenger puede reiniciar
   o dormir la app y cortar un trabajo a medias.
6. **Herramientas del asistente.** El prompt asume herramientas del CRM que no existen:
   consultar disponibilidad, agendar, reagendar, cancelar, marcar urgente, escalar y
   programar recordatorios. Cada una necesita un endpoint con validación.
7. **Urgencia y escalamiento.** No hay etapa o etiqueta de "urgente" ni notificación al equipo
   (tarea, correo o WhatsApp interno). Hay que definirlo.
8. **Recordatorios.** Las reglas `scheduled_reminder_message` y
   `new_lead_confirmation_message` están **deshabilitadas** y sus canales sin validar. Además,
   Meta no permite iniciar conversación fuera de la ventana de 24 horas salvo con etiquetas o
   plantillas específicas: los recordatorios proactivos por Messenger e Instagram tienen
   límites (por verificar el detalle vigente).
9. **Pantalla en el dashboard** para ver conversaciones, urgencias y escalamientos
   (`webapp/crm/`).

## 5. Dónde correrlo: cPanel o VPS

**Respuesta: se puede hacer en cPanel. No hace falta migrar a un VPS para empezar.**

A favor de cPanel:

- Un webhook es una ruta HTTPS más en la app Node, igual que `/crm` y el calendario. Ya hay
  Node 22, MariaDB, HTTPS y dominio.
- No se necesita un proceso propio siempre activo: cada mensaje llega, se procesa y se
  responde.
- Lo pesado (transcribir, razonar, generar voz) son APIs externas; el servidor solo coordina.
- La decisión de arquitectura del backlog sigue válida: frontend en Vercel, backend, bases de
  datos y cron en cPanel.

Límites de cPanel (todos **por verificar**):

| Límite | Efecto | Mitigación |
|---|---|---|
| Meta pide 200 rápido | Un procesamiento largo provoca reintentos y duplicados | Guardar el mensaje, responder 200 y procesar después; deduplicar por id de mensaje |
| App dormida por Passenger | El primer mensaje tarda; el cron no corre mientras duerme (ya afecta al sync de Facebook) | Medir el tiempo de arranque; llamada periódica de despertar si hace falta |
| Conversión de audio | Sin `ffmpeg` instalable, un formato no aceptado por Meta bloquea la voz | Elegir proveedor de voz que entregue un formato aceptado, o usar un paquete de ffmpeg de npm y probarlo |
| Sin terminal | Instalar paquetes y ver logs es incómodo | "Run NPM Install" de cPanel; registro de errores en base de datos |
| Memoria, procesos y tiempo por plan | Varias llamadas a IA en paralelo pueden toparse con límites | Limitar concurrencia; medir en la prueba |

**Cuándo sí conviene un VPS:** si falla la conversión de audio, si la app duerme demasiado
para cumplir los tiempos de Meta, o si la concurrencia supera el plan. Sería un VPS pequeño
(unos 5 a 10 USD al mes, **estimado, sin cotizar**) solo para el asistente, hablando con el
backend de Reforma por API. No hace falta mover el CRM ni la base de datos.

### Pruebas previas en el servidor actual

- [ ] Montar un webhook de prueba que reciba un mensaje de Meta y responda 200.
- [ ] Probar un paquete de ffmpeg de npm: convertir un audio de ejemplo al formato que acepte
      Meta.
- [ ] Dejar la app sin tráfico un rato y medir cuánto tarda en despertar.
- [ ] Confirmar memoria, procesos y límite de tiempo del plan de cPanel.
- [ ] Confirmar formatos y duración de audio aceptados por Messenger e Instagram (entrada y
      salida) en la documentación vigente de Meta.

Criterio: si las tres primeras pasan, se sigue en cPanel. Si falla la conversión o el
despertar, se evalúa el VPS solo para el asistente.

## 6. Riesgos

- **Seguridad del backend primero.** `BACKLOG.md` punto 3 lista rutas del dashboard sin
  autenticación que cambian contraseñas y exponen hashes de contraseña. Conectar un asistente
  con datos de pacientes antes de cerrar eso es mala idea. **Bloqueante.**
- **Datos de salud.** El asistente recibe síntomas y urgencias, que pasan por Meta, el
  proveedor de transcripción, el de voz y el de IA. `BACKLOG.md` punto 4 ya establece que para
  clientes médicos no deben viajar datos de salud a Meta (tema CAPI). Esto lo agrava. Exige
  aviso de privacidad, contrato con proveedores, definir retención y revisión legal.
- **Canales sin validar.** El CRM nunca ha enviado un correo real; WhatsApp usa el número de
  pruebas; SMS no está configurado (`CRM_STATUS.md` §5 y §5b).
- **Agenda sin humano.** El asistente escribe directo en el calendario real: hay que evitar
  dobles reservas y validar disponibilidad en el servidor, no solo en el frontend.
- **Respuestas médicas por IA.** El prompt prohíbe diagnosticar y manda escalar urgencias.
  Probar con casos adversos antes de usarlo con pacientes.
- **Costos por uso** de transcripción, voz e IA: sin estimar.

## 7. Ruta propuesta por fases

**Fase 0: prerrequisitos**
- [ ] Cerrar el CRM actual (`BACKLOG.md` punto 1).
- [ ] Endurecer el backend del dashboard (`BACKLOG.md` punto 3).
- [ ] Decidir cumplimiento: aviso de privacidad, contratos y retención (ver §8).
- [ ] Correr las pruebas de la sección 5.

**Fase 1: texto en Messenger e Instagram (sin voz)**
- [ ] Webhook de Meta con verificación de firma, respuesta 200 y deduplicación.
- [ ] Cola persistente en MySQL.
- [ ] Credencial de servicio y endpoints de máquina en el CRM.
- [ ] Canal e identificador por paciente, e historial de conversación.
- [ ] Estado de urgencia y notificación al equipo; escalamiento a humano.
- [ ] Herramientas de agenda (disponibilidad, agendar, reagendar, cancelar), con
      confirmación de día y hora antes de guardar.
- [ ] Aviso de "asistente automatizado" al inicio de cada conversación.
- [ ] Pruebas con casos de urgencia, queja, fuera de alcance y petición de precios.

**Fase 2: recordatorios**
- [ ] Revisar qué permite Meta fuera de la ventana de 24 horas.
- [ ] Validar el canal de recordatorio y activar las reglas correspondientes.

**Fase 3: voz**
- [ ] Transcripción del audio entrante.
- [ ] Síntesis de la respuesta en un formato aceptado por Meta.
- [ ] Ajustes de estilo para audio (ver apéndice A).

**Fase 4: pantalla en el dashboard**
- [ ] Vista de conversaciones, urgencias y escalamientos en `webapp/crm/`.
- [ ] Permiso `"CRM"` para usuarios no admin, si aplica (`BACKLOG.md` punto 1).

## 8. Decisiones abiertas

- [ ] ¿Empezar solo con texto (recomendado) o con voz desde el inicio?
- [ ] Proveedor de transcripción, de voz y de IA, y su costo mensual estimado.
- [ ] Datos que faltan en el prompt: nombre del asistente, ciudad, horarios, ubicación,
      formas de pago, lista de servicios, teléfono de urgencias y tiempo de respuesta al
      escalar.
- [ ] Qué hace el asistente con una urgencia fuera de horario y quién recibe el aviso.
- [ ] Dónde se guarda la conversación, cuánto tiempo y cómo se atiende una solicitud ARCO.
- [ ] Texto del aviso de privacidad para pacientes (necesita visto bueno explícito y revisión
      legal antes de publicarse).
- [ ] Si el asistente atenderá a pacientes de otros clientes médicos o solo a Reforma Dental.
- [ ] Si se necesita un VPS (depende de las pruebas de la sección 5).

## Apéndice A: prompt del asistente (borrador del usuario)

Con marcadores sin completar: `[Nombre]`, `[Tijuana/ciudad]`, `[datos]`, `[lista de
servicios]`, `[número]`, `[tiempo]`.

```
Eres [Nombre], asistente de atención al paciente de Reforma Dental en [Tijuana/ciudad].
Atiendes por mensajes de voz en Messenger e Instagram.

IDENTIDAD Y TRANSPARENCIA
- Al inicio de cada conversación nueva, avisa que eres el asistente automatizado de Reforma
  Dental. Ejemplo: "Hola, soy el asistente de Reforma Dental".
- Si el paciente pregunta si eres persona o bot, dilo con honestidad, sin rodeos.
- Nunca inventes que eres un doctor, recepcionista o persona del equipo.

TONO Y ESTILO (para audio)
- Habla como una persona cálida y clara de la clínica: frases cortas, lenguaje cotidiano,
  "tú" de confianza.
- Evita listas, viñetas, siglas y textos largos. Máximo 3 a 4 ideas por nota.
- No empieces con "¡Claro que sí!" ni con fórmulas de call center. Responde directo.
- Usa el nombre del paciente si lo conoces.
- Escribe los números y horas como se dicen: "a las tres y media", no "15:30".
- Nada de emojis en el texto que se convierte a voz.

QUÉ PUEDES HACER
- Informar horarios, ubicación y formas de pago: [datos].
- Explicar tratamientos de forma general: [lista de servicios].
- Agendar, reagendar o cancelar citas usando las herramientas del CRM, confirmando día y hora
  antes de guardar.
- Enviar recordatorios e indicaciones previas a la cita.

QUÉ NO PUEDES HACER
- No diagnosticas, no recomiendas medicamentos ni das indicaciones clínicas.
- No das precios exactos de tratamientos complejos. Di que el doctor lo valora en consulta y
  ofrece agendar valoración.
- No confirmas resultados de laboratorio ni radiografías.
- No compartes datos de otros pacientes.

URGENCIAS (prioridad máxima)
Si el paciente menciona dolor fuerte, inflamación de cara o cuello, sangrado que no para,
fiebre, golpe en la boca o cualquier emergencia:
- Dile que lo importante ahora es atenderse rápido.
- Indica que el equipo lo contactará de inmediato y dale el teléfono de urgencias: [número].
- Si hay riesgo para la vida, dile que llame al 911.
- Marca la conversación como urgente y escala al equipo.

ESCALAMIENTO A HUMANO
Pásalo al equipo si: pide hablar con una persona, hay queja o enojo, pide algo fuera de tu
alcance, o no entiendes la solicitud después de dos intentos.
Al escalar di: "Te paso con alguien de nuestro equipo, te contactará en [tiempo]."

FORMATO DE SALIDA
Devuelve solo el texto que se convertirá en audio, sin comillas, sin notas técnicas ni
etiquetas. Si necesitas datos del CRM, usa las herramientas disponibles antes de responder.
```

Notas sobre el prompt:

- El ejemplo original llevaba un emoji en el saludo; se quitó aquí porque la misma regla
  prohíbe emojis en el texto que se convierte a voz.
- "Marca la conversación como urgente" y "usa las herramientas del CRM" suponen herramientas
  que hoy no existen (brecha 6 y 7).
- El prompt está escrito para voz. En la fase 1 (texto) hay que decidir si se conserva el
  estilo de frases cortas y la regla de escribir las horas como se dicen.
