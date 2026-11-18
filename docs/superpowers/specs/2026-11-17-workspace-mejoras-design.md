# Mejoras del espacio de trabajo — diseño

Fecha: 2026-11-17. Origen: lista de bugs/features del equipo.

## Intención

El equipo usa el espacio de trabajo (`/dashboard/workspace`) en lugar de ClickUp. Faltan piezas para
que funcione como lo usaban: crear tareas sin fallas, el flujo de estados de ClickUp, que una tarea
no se cierre con subtareas abiertas, etiquetar personas en el muro y filtrar el muro por proyecto.
Aparte, en Clientes hay páginas de cliente que no están asignadas a nadie y no se pueden borrar.

## Alcance (seis cambios)

1. **Bug: "Agregar tarea" no funciona.** Causa encontrada: el formulario rápido (`QuickAdd`,
   `screens/ProjectScreen.tsx`) tiene dos inputs y ningún botón de envío; con más de un campo, el
   navegador no envía el formulario con Enter. Arreglo: botón visible "Agregar". Confirmar en el
   navegador antes de dar por cerrado.
2. **No completar una tarea con subtareas pendientes.**
3. **Etiquetar (@persona) en publicaciones y comentarios del muro**, con aviso en la bandeja.
4. **Filtro del muro por proyecto.**
5. **Estados de ClickUp** para las tareas.
6. **Clientes → sección "Páginas sin cliente"** con eliminar y asignar a un cliente.

## Restricciones

- **No mover las tareas existentes.** Ninguna migración modifica filas; solo se agregan valores al
  ENUM y columnas nuevas.
- El backend es `backend-actual.js` (en `.gitignore`), desplegado a mano en cPanel. El SQL se corre
  a mano (phpMyAdmin). El frontend despliega en Vercel.
- No se tocan las rutas abiertas existentes (decisión del 2026-10-30): las rutas nuevas son aparte y
  con `requireAdmin`.
- El mock (`lib/mock.ts`) tiene la misma forma que la API; cada cambio de contrato se refleja ahí.
- Sin commits de Claude: el usuario hace los suyos.
- No hay framework de pruebas; verificación con `bun run lint`, `bun run build` y prueba manual.

## Estados (5)

Se conservan los valores guardados y se agregan cuatro. Orden (columnas del tablero):

| valor | etiqueta | grupo |
|---|---|---|
| `todo` | Open / Abierta | abierta |
| `pending` (nuevo) | Pending / Pendiente | abierta |
| `in_progress` | In progress / En curso | abierta |
| `done` | Completed / Completada | terminada |
| `review` | In review / En revisión | terminada |
| `accepted` (nuevo) | Accepted / Aceptada | terminada |
| `rejected` (nuevo) | Rejected / Rechazada | abierta |
| `blocked` (nuevo) | Blocked / Bloqueada | abierta |

Flujo: open → pending → in progress → completed → in review → accepted | rejected (regresa a in
progress). Blocked en cualquier momento.

**Terminada = `done`, `review`, `accepted`** (decisión del usuario, opción A). Un helper único
`isDone(status)` en `lib/types.ts` (y `PM_DONE_STATUSES` en el backend) reemplaza todas las
comparaciones `=== "done"`. Consecuencias:

- `% avance`, `taskCounts.done`, `subtaskCounts.done`, vencidas, "Mis tareas" y estadísticas usan
  el grupo.
- `completed_at`: se pone al entrar al grupo terminada desde uno abierto, se borra al salir, y se
  conserva al moverse dentro del grupo (completed → in review → accepted).
- Resumen del cliente: `inProgress` = in_progress, rejected, blocked; `upNext` = todo, pending;
  `delivered` = grupo terminada.
- Palomita de completar (listas): marca `done`; desmarcar regresa a `todo` (como hoy).
- Tareas que hoy están en `review` pasan visualmente a "In review" (después de Completed) y cuentan
  como terminadas. Aceptado como efecto del orden de ClickUp.

Tablero: 8 columnas con scroll horizontal.

## Regla de subtareas (2)

Una tarea de primer nivel no puede entrar al grupo terminada si tiene subtareas fuera de ese grupo.

- Backend (`PATCH /api/pm/tasks/:id`): si el estado nuevo es terminada y el anterior no, cuenta
  subtareas abiertas; si hay, `409 { error: "Tiene N subtareas pendientes" }`.
- Frontend: el modal de tarea deshabilita los estados terminados en el selector cuando hay
  subtareas abiertas, con nota explicativa; tablero y palomitas muestran el error del backend como
  toast (el mock aplica la misma regla).
- No se reabre la tarea padre si una subtarea se reabre después (no pedido).

## Etiquetado en el muro (3) — enfoque elegido: A

Enfoques considerados:
- **A (elegido):** texto plano + lista `mentionIds` aparte; aviso en la bandeja. Texto limpio,
  aviso confiable.
- B: tokens `@[Nombre](id)` dentro del texto. Sin columna nueva, pero texto sucio y frágil.
- C: solo resaltar, sin aviso. Barato, pero la persona no se entera.

Diseño:
- Al escribir `@` en el textarea del post o el input del comentario, aparece una lista del equipo
  (`listMembers`, roles admin/employee) filtrada por lo escrito; elegir inserta `@Nombre `.
- Al enviar: `mentionIds` = elegidos cuyo `@Nombre` sigue en el texto.
- API: `createPost({ body, projectId, mentionIds })`, `addPostComment(postId, body, mentionIds)`.
- Backend: valida ids (deben ser admin/employee, se quita al autor), inserta una fila en
  `pm_task_activity` por persona mencionada con `kind = 'mention'`, `task_id = NULL`,
  `post_id`, `project_id` del post (o NULL), `task_title` = extracto del post, `from_value` =
  extracto del texto, `to_value` = id de la persona (como "assigned"), audiencia = esa persona.
- Esquema: `pm_task_activity.task_id` y `project_id` pasan a NULL-ables, columna `post_id INT NULL`,
  ENUM `kind` + `'mention'`. Filas existentes intactas.
- Bandeja: `InboxItem.taskId` pasa a `string | null`, nuevo `postId: string | null`. Texto
  "te mencionó en el muro: …"; clic abre el muro.
- Resaltado: en el post y comentarios, `@Nombre` de miembros actuales se pinta como mención
  (marca visual, sin guardar ids). Shortcut: si alguien cambia de nombre, sus menciones viejas
  dejan de resaltarse.
- Los admin ven todas las menciones en la bandeja (ya ven toda la actividad).

## Filtro del muro (4)

Selector "Todos los proyectos / <proyecto>" arriba del muro; filtra en el navegador por
`post.projectId`. El badge de proyecto en cada post sigue abriendo el proyecto (como hoy). Shortcut: el backend
solo manda los 100 posts más recientes.

## Páginas sin cliente (6)

"Sin cliente" = fila de `projects` cuyo `id_user` no existe o no es de rol `client`.

- Rutas nuevas (`requireAdmin`):
  - `GET /api/client-pages/unassigned` → `{ pages: (ClientPage & { ownerEmail: string | null })[] }`
  - `DELETE /api/client-pages/:id` → borra entregables (`projects_content`) y la página; 409 si la
    página sí tiene cliente.
  - `PATCH /api/client-pages/:id { clientId }` → asigna a un cliente existente.
- Frontend (`/dashboard/clients`): sección al final, solo si hay páginas; cada fila con título,
  `project_name`, entregables, enlace, selector "Asignar a…" y botón eliminar con confirmación.

## Lo que queda al implementador

- Estilo exacto de la lista de menciones y del resaltado (usar tokens `--ec-*`).
- Colores/badges de los estados nuevos con las clases `ec-badge-*` existentes.
- Texto exacto de los mensajes.

## Fuera de alcance

Reapertura automática del padre, menciones en comentarios de tareas, paginación del muro,
cambios en las apps de calendario, cambios de seguridad en rutas existentes.
