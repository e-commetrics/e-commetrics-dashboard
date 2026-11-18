# Calendario del Workspace en Google Calendar: decisión

Fecha: 2026-11-18. Para trabajar el 2026-11-19. **Todavía no hay código.**

## Decisión

Vamos por la **opción A: suscripción .ics**. La opción B (API de Google Calendar) queda
descartada por ahora. Se revisa solo si el retraso de A estorba en el uso real.

## Las dos opciones

| | A. Suscripción .ics (elegida) | B. API de Google Calendar |
|---|---|---|
| Cómo funciona | El backend publica una URL `.ics` con las fechas límite de las tareas. Google Calendar se suscribe una vez (Otros calendarios → "Desde URL"). | El backend crea o actualiza el evento en Google cada vez que cambia una tarea con fecha. |
| Retraso | Google actualiza cada 8 a 24 h | Inmediato |
| Edición | Solo lectura: mover el evento en Google no cambia la tarea | Se podría editar, invitar y agregar Meet |
| Trabajo | Poco: una ruta en el backend y un botón | Mucho: proyecto en Google Cloud, OAuth, guardar y renovar tokens, cambios en cada ruta de tareas |
| Otros calendarios | También iPhone, Outlook, etc. | Solo Google |

Si después hace falta B, lo de A se reutiliza: la parte que convierte tareas en eventos es la misma.

## Cómo hacer A (cuando se retome)

- Copiar el patrón del calendario de Palmas: `/api/calendar.ics` y el botón de
  `src/app/dashboard/webapp/calendario-palmas/components/Subscription.tsx`.
- Ruta nueva en `backend-actual.js`, por ejemplo `GET /api/pm/calendar.ics?token=…`. Debe
  responder con `Content-Type: text/calendar`.
- **Token secreto obligatorio en la URL.** La URL expone nombres de clientes y de tareas, y
  Google la consulta sin cookie de sesión, así que la cookie no sirve para proteger esta ruta.
- Un evento de día completo por tarea con `dueDate`. Título: `Tarea · Proyecto`. Link a la
  tarea en el dashboard en la descripción. `UID` estable por tarea para que Google actualice
  el evento en lugar de duplicarlo.
- Botón "Suscribirse en Google Calendar" en la vista Calendario del Workspace, con la URL
  para copiar.

## Por confirmar antes de empezar

1. **Correo de la cuenta.** Se mencionó `ecommetrica@google.com`, pero ese dominio no existe
   para cuentas de usuario. Debe ser `@gmail.com` o un dominio con Google Workspace (por
   ejemplo `@ecommetrica.com`). Para la opción A da igual: cualquier cuenta puede suscribirse.
2. **Qué tareas entran.** Solo las que tienen fecha. Falta decidir: ¿de todos los proyectos?
   ¿Las completadas también? ¿Los proyectos CRM (leads con fecha)?
3. **Para quién.** Un calendario para todo el equipo, o uno por persona con solo sus tareas
   asignadas (un token por usuario).
