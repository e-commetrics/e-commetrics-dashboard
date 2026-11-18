# Mejoras del espacio de trabajo — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arreglar "Agregar tarea", agregar los estados de ClickUp sin mover tareas existentes, bloquear el cierre con subtareas abiertas, menciones y filtro por proyecto en el muro, y una sección de páginas sin cliente.

**Architecture:** Frontend Next.js en `src/app/dashboard/workspace/` (contrato en `lib/types.ts`, implementaciones `lib/api.ts` y `lib/mock.ts`) y en `src/app/dashboard/clients/`. Backend Express en `backend-actual.js` (raíz del repo, en `.gitignore`, se sube a mano a cPanel). Migraciones SQL solo aditivas en `docs/migrations/2026-11-17-workspace.sql`.

**Tech Stack:** Next 16 + React + TypeScript, Bun (`bun test` para funciones puras), Express + mysql2, MySQL.

**Spec:** `docs/superpowers/specs/2026-11-17-workspace-mejoras-design.md`

## Global Constraints

- No modificar filas existentes: los valores `todo`, `in_progress`, `review`, `done` se conservan; las migraciones solo agregan valores/columnas.
- Orden de estados: `["todo","pending","in_progress","done","review","accepted","rejected","blocked"]`.
- Grupo terminada: `["done","review","accepted"]`.
- Etiquetas ES/EN: todo Abierta/Open, pending Pendiente/Pending, in_progress En curso/In progress, done Completada/Completed, review En revisión/In review, accepted Aceptada/Accepted, rejected Rechazada/Rejected, blocked Bloqueada/Blocked.
- Toda UI bilingüe con `t(es, en)` de `lib/i18n.ts`; colores solo con tokens `--ec-*` y clases `ec-badge-*` existentes.
- `lib/mock.ts` replica cada cambio de contrato y regla de `lib/api.ts`/backend.
- Rutas nuevas del backend con `requireAdmin` (o `pmAdmin`); no tocar rutas abiertas existentes.
- Sin commits de Claude: en cada "Commit" el ejecutor solo deja los cambios listos y avisa; el usuario hace el commit.
- Verificación base de cada tarea: `bun run lint` y `bun run build` sin errores nuevos.

## Review Focus

1. Arrastrar una tarea con subtareas abiertas a Completed / In review / Accepted: debe salir un toast con el error y la tarjeta regresa a su columna (Task 4, paso de prueba manual).
2. En el input de comentario, con la lista de menciones abierta, Enter elige la persona y no envía; Escape cierra la lista (Task 6, prueba manual).
3. Nombres con prefijo común ("Ana" y "Ana María") o con caracteres de regex ("J. (Dev)"): gana el nombre más largo y no truena (Task 6, `mentions.test.ts`).
4. Avisos de mención sin `taskId` no rompen la bandeja ni el feed de actividad de `TeamHome` (Task 6, prueba manual con mock).
5. Frontend desplegado antes que la migración: elegir "Pending" devuelve 400 del backend. El orden de despliegue (SQL → backend → frontend) va en Task 9.

---

### Task 1: Arreglar "Agregar tarea"

**Files:**
- Modify: `src/app/dashboard/workspace/screens/ProjectScreen.tsx` (función `QuickAdd`, ~línea 374)

- [ ] **Step 1: Reproducir.** `bun run dev` (sin `NEXT_PUBLIC_PM_API=live` usa el mock), abrir `/dashboard/workspace?view=project&id=<id>`, "Agregar tarea", escribir título, Enter. Esperado hoy: no pasa nada (dos inputs sin botón de envío ⇒ el navegador no envía con Enter). Si el fallo es otro (error de red/toast), detenerse y reportar antes de cambiar nada.
- [ ] **Step 2: Agregar un botón `type="submit"` visible "Agregar"/"Add"** (clase `ec-btn-primary`, compacto, `disabled` si el título está vacío) y un botón "Cancelar" (`type="button"`, `setOpen(false)`) en una fila al final del `<form>`. Durante el envío mostrar `Loader2` y deshabilitar (estado local `saving`); si `onCreate` lanza, conservar lo escrito.
- [ ] **Step 3: Verificar.** Enter en el título y en el link crea la tarea; el botón también; en vista lista (`inline`) igual. `bun run lint`.
- [ ] **Step 4: Commit** (lo hace el usuario): `fix(workspace): agregar tarea con Enter y botón`.

### Task 2: Estados nuevos y helper `isDone` (frontend + mock)

**Files:**
- Modify: `src/app/dashboard/workspace/lib/types.ts:53-54`
- Modify: `src/app/dashboard/workspace/lib/i18n.ts:15-20`
- Modify: todos los usos de `=== "done"` / `!== "done"` / `"review"` / `"todo"` listados por `grep -rn '"done"\|"todo"\|"review"\|in_progress' src --include=*.ts --include=*.tsx` fuera de `webapp/calendario-palmas` y `webapp/crm` (CalendarView, TaskCard, TaskDetailModal, MyTasksScreen, ProjectScreen, CalendarScreen, `src/components/home/{stats.ts,TeamHome.tsx,ClientHome.tsx}`, `lib/mock.ts`)
- Modify: `tsconfig.json` (`exclude` + `"**/*.test.ts"`)
- Test: `src/app/dashboard/workspace/lib/status.test.ts`

**Interfaces:**
- Produces (en `lib/types.ts`):
  - `TASK_STATUSES = ["todo","pending","in_progress","done","review","accepted","rejected","blocked"] as const`
  - `DONE_STATUSES: readonly TaskStatus[] = ["done","review","accepted"]`
  - `isDone(status: TaskStatus): boolean`
  - `openSubtaskCount(subtasks: Pick<Task,"status">[]): number` (las que no `isDone`)
  - `TASK_STATUS_META` con las 8 llaves.

- [ ] **Step 1: Excluir tests del build.** Agregar `"**/*.test.ts"` a `exclude` en `tsconfig.json` (no hay tipos de `bun:test`; `next build` fallaría).
- [ ] **Step 2: Test que falla** `lib/status.test.ts`:

```ts
import { expect, test } from "bun:test";
import { TASK_STATUSES, isDone, openSubtaskCount } from "./types";

test("orden de estados", () => {
  expect([...TASK_STATUSES]).toEqual(["todo", "pending", "in_progress", "done", "review", "accepted", "rejected", "blocked"]);
});
test("grupo terminada", () => {
  expect(TASK_STATUSES.filter(isDone)).toEqual(["done", "review", "accepted"]);
});
test("subtareas abiertas", () => {
  expect(openSubtaskCount([{ status: "done" }, { status: "rejected" }, { status: "blocked" }, { status: "review" }])).toBe(2);
  expect(openSubtaskCount([])).toBe(0);
});
```

- [ ] **Step 3:** `bun test src/app/dashboard/workspace/lib/status.test.ts` → FAIL (`isDone` no existe).
- [ ] **Step 4: Implementar** en `types.ts` las interfaces de arriba; en `i18n.ts` las 8 entradas con las etiquetas de Global Constraints (pending: neutral/idle; accepted: success/ok; rejected y blocked: `ec-badge-danger` con el glyph de alerta existente; renombrar las etiquetas de todo/done/review).
- [ ] **Step 5:** el test → PASS.
- [ ] **Step 6: Reemplazar comparaciones.** Cada `status === "done"` → `isDone(status)`, `!== "done"` → `!isDone(...)`. Las palomitas siguen: si `isDone` → `"todo"`, si no → `"done"`. `TeamHome` "en revisión" sigue con `=== "review"`. `ClientHome` mantiene la píldora de `review`.
- [ ] **Step 7: Mock** (`lib/mock.ts`): conteos con `isDone`; `completedAt` igual que el backend (Task 3 Step 3): se pone al entrar al grupo desde fuera, `null` al salir, se conserva dentro del grupo; `clientSummary` con `inProgress` = in_progress|rejected|blocked, `upNext` = todo|pending, `delivered` = `isDone`.
- [ ] **Step 8: Verificar.** `bun run lint`, `bun run build`. En mock: el tablero muestra 8 columnas con scroll horizontal, se puede arrastrar entre todas, y el % del proyecto cuenta done+review+accepted.
- [ ] **Step 9: Commit** (usuario): `feat(workspace): estados de ClickUp`.

### Task 3: Backend — estados, `completed_at`, regla de subtareas, migración SQL

**Files:**
- Create: `docs/migrations/2026-11-17-workspace.sql`
- Modify: `backend-actual.js` (líneas ~1343, 1477, 1518, 2121-2125, 2140-2163, 2204-2220)
- Modify: `docs/workspace.sql` (ENUM de `pm_tasks.status`), `docs/workspace-api.md` (estados y 409)

**Interfaces:**
- Produces: `PATCH /api/pm/tasks/:id` responde `409 { error: "Tiene N subtareas pendientes" }` (es) cuando una tarea de primer nivel entra al grupo terminada con subtareas abiertas. `POST /api/pm/projects/:id/tasks` acepta los 8 estados.

- [ ] **Step 1: Migración** (parte 1 del archivo; Task 7 agrega la parte 2):

```sql
-- 1) Estados de ClickUp. Solo agrega valores: ninguna fila cambia.
ALTER TABLE pm_tasks
  MODIFY status ENUM('todo','pending','in_progress','done','review','accepted','rejected','blocked') NOT NULL DEFAULT 'todo';
```

- [ ] **Step 2: Constantes.** `PM_TASK_STATUSES` con los 8 valores; `PM_DONE_STATUSES = ["done","review","accepted"]`; `PM_DONE_SQL = "('done','review','accepted')"`. Reemplazar `x.status = 'done'` (1477) y `s.status = 'done'` (1518) por `IN ${PM_DONE_SQL}`; en `/client/summary` usar las mismas reglas que el mock (Task 2 Step 7).
- [ ] **Step 3: `completed_at`.** Alta: `IF(? IN ('done','review','accepted'), NOW(), NULL)`. PATCH: si cambia `status`, `wasDone = PM_DONE_STATUSES.includes(before.status)`, `isDone = PM_DONE_STATUSES.includes(next.status)`; `!wasDone && isDone` → `completed_at = NOW()`; `wasDone && !isDone` → `completed_at = NULL`; si no, no tocar.
- [ ] **Step 4: Regla de subtareas.** En el PATCH, dentro de `pmTx`, antes del UPDATE: si `changed.includes("status") && !wasDone && isDone && !before.parentId`, contar `SELECT COUNT(*) AS n FROM pm_tasks WHERE parent_id = ? AND status NOT IN ${PM_DONE_SQL}`; si `n > 0` → `throw new PmError(409, \`Tiene ${n} subtareas pendientes\`)`.
- [ ] **Step 5: Verificar** con `node --check backend-actual.js`. Prueba local si el usuario tiene el backend corriendo; si no, queda para el despliegue (Task 9): PATCH de un padre con subtarea abierta a `done` → 409; a `pending` → 200.
- [ ] **Step 6: Docs** `workspace.sql` y `workspace-api.md` con los 8 estados, el grupo terminada y el 409.
- [ ] **Step 7: Commit** (usuario; `backend-actual.js` no se versiona): `feat(api): estados de ClickUp y regla de subtareas`.

### Task 4: Regla de subtareas en la UI y el mock

**Files:**
- Modify: `src/app/dashboard/workspace/lib/mock.ts` (`updateTask`, ~línea 407)
- Modify: `src/app/dashboard/workspace/components/TaskDetailModal.tsx:136-145, 213-260`

**Interfaces:**
- Consumes: `isDone`, `openSubtaskCount`, `DONE_STATUSES` (Task 2); error 409 (Task 3).

- [ ] **Step 1: Mock.** En `updateTask`, misma regla que Task 3 Step 4: lanzar `new Error(\`Tiene ${n} subtareas pendientes\`)` (ES; el backend también responde en ES).
- [ ] **Step 2: Modal.** Con `open = openSubtaskCount(subtasks)` > 0 y tarea de primer nivel: las `<option>` de estados terminados quedan `disabled`, y bajo el selector va una nota `t("Termina las N subtareas pendientes para completarla.", "Finish the N open subtasks to complete it.")`. Si la tarea ya está en el grupo, sus opciones no se deshabilitan.
- [ ] **Step 3: Verificar a mano (mock)** — Review Focus 1: arrastrar el padre a Completed → toast con el error y la tarjeta queda en su columna (`useMutation` ya muestra el error con `onError`; confirmar que el tablero recarga y no queda la tarjeta "fantasma"); la palomita de la lista hace lo mismo; con todas las subtareas terminadas se puede completar.
- [ ] **Step 4: Commit** (usuario): `feat(workspace): no completar con subtareas pendientes`.

### Task 5: Filtro del muro por proyecto

**Files:**
- Modify: `src/app/dashboard/workspace/screens/WallScreen.tsx:21-90`

- [ ] **Step 1:** Estado `filter` (`""` = todos). `<select>` arriba de la lista (mismo estilo que el selector del formulario), opciones "Todos los proyectos / All projects" + proyectos que tienen al menos un post, ordenados por nombre. Lista = `posts.filter(p => !filter || p.projectId === filter)`. Si el filtro deja 0 posts: `EmptyState` "Aún no hay publicaciones en este proyecto." / "No posts in this project yet.". Al publicar con el filtro activo, el selector del formulario arranca con ese proyecto.
- [ ] **Step 2: Verificar** en mock: filtrar, publicar, volver a "Todos". `bun run lint`.
- [ ] **Step 3: Commit** (usuario): `feat(workspace): filtro del muro por proyecto`.

### Task 6: Menciones — frontend, mock y bandeja

**Files:**
- Create: `src/app/dashboard/workspace/lib/mentions.ts`
- Create: `src/app/dashboard/workspace/lib/mentions.test.ts`
- Create: `src/app/dashboard/workspace/components/MentionField.tsx`
- Modify: `lib/types.ts` (`InboxItem`, `ACTIVITY_KINDS`), `lib/api.ts` (`createPost`, `addPostComment`), `lib/mock.ts` (`createPost`, `addPostComment`, `listInbox`), `screens/WallScreen.tsx`, `screens/InboxScreen.tsx`, `page.tsx:129`, y cualquier consumidor de `InboxItem.taskId` (`grep -rn "taskId" src/components/home src/app/dashboard/workspace`)

**Interfaces:**
- Produces (`lib/mentions.ts`):
  - `activeMentionQuery(text: string, caret: number): { start: number; query: string } | null` — hay mención en curso si el texto antes del cursor termina en `(^|\s)@<sin espacios ni @>`; `start` = índice del `@`.
  - `insertMention(text: string, start: number, caret: number, name: string): { text: string; caret: number }` — reemplaza `@query` por `@Nombre ` (con espacio).
  - `splitMentions(text: string, names: string[]): { text: string; mention: boolean }[]` — marca `@Nombre` de los nombres dados; el más largo gana; escapa regex.
  - `mentionIdsIn(text: string, members: Pick<Member,"id"|"name">[]): string[]` — ids únicos de los miembros cuyo `@Nombre` aparece (vía `splitMentions`).
- Produces (contrato):
  - `ACTIVITY_KINDS` + `"mention"`; `InboxItem.taskId: string | null`; `InboxItem.postId: string | null`. Para `mention`: `from` = extracto del texto, `to` = id de la persona mencionada.
  - `createPost(input: { body: string; projectId?: string | null; mentionIds?: string[] })`
  - `addPostComment(postId: string, body: string, mentionIds?: string[])` → POST body `{ body, mentionIds }`.
- Produces (componente): `<MentionField value onChange(value: string) members: Member[] multiline? placeholder ariaLabel onSubmit?() />`, un textarea o input con la lista debajo (`role="listbox"`, opciones `role="option"`, `aria-activedescendant`, flechas, Enter/Tab eligen, Escape cierra). Con la lista abierta, Enter no llama `onSubmit`. Máximo 6 resultados, con filtro por nombre sin acentos ni mayúsculas.

- [ ] **Step 1: Tests que fallan** `lib/mentions.test.ts`:

```ts
import { expect, test } from "bun:test";
import { activeMentionQuery, insertMention, mentionIdsIn, splitMentions } from "./mentions";

test("detecta @ en curso", () => {
  expect(activeMentionQuery("hola @an", 8)).toEqual({ start: 5, query: "an" });
  expect(activeMentionQuery("@", 1)).toEqual({ start: 0, query: "" });
  expect(activeMentionQuery("correo a@b", 10)).toBeNull();
  expect(activeMentionQuery("hola @ana ", 10)).toBeNull();
});
test("inserta la mención", () => {
  expect(insertMention("hola @an y", 5, 8, "Ana María")).toEqual({ text: "hola @Ana María  y", caret: 16 });
});
test("el nombre más largo gana y escapa regex", () => {
  const parts = splitMentions("ok @Ana María y @J. (Dev)!", ["Ana", "Ana María", "J. (Dev)"]);
  expect(parts.filter((p) => p.mention).map((p) => p.text)).toEqual(["@Ana María", "@J. (Dev)"]);
  expect(parts.map((p) => p.text).join("")).toBe("ok @Ana María y @J. (Dev)!");
});
test("ids mencionados sin duplicados", () => {
  const m = [{ id: "1", name: "Ana" }, { id: "2", name: "Ana María" }, { id: "3", name: "Luis" }];
  expect(mentionIdsIn("@Ana María y @Ana María, @Luis", m)).toEqual(["2", "3"]);
  expect(mentionIdsIn("sin menciones", m)).toEqual([]);
});
```

- [ ] **Step 2:** `bun test src/app/dashboard/workspace/lib/mentions.test.ts` → FAIL.
- [ ] **Step 3: Implementar `lib/mentions.ts`.** `splitMentions`: un solo regex `@(nombre1|nombre2…)` con los nombres ordenados de más largo a más corto y escapados (`s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`). Si no hay nombres, devolver `[{ text, mention: false }]`.
- [ ] **Step 4:** tests → PASS.
- [ ] **Step 5: `MentionField`** según la interfaz. Para la lista: `members.filter(m => m.role !== "client")`. Estilos con `ec-field-input` y tokens `--ec-surface-*` / `--ec-hairline-*`.
- [ ] **Step 6: Contrato + API + mock.** Tipos y `httpApi` según Interfaces. Mock: por cada id de `mentionIds`, sin el autor, solo team, push a `db.activity` de `{ kind: "mention", taskId: null, parentTaskId: null, postId, projectId: post.projectId, taskTitle: extracto del post (80), from: extracto del texto (120), to: id, actorId: meId(), audience: [id], readBy: [meId()] }`.
- [ ] **Step 7: Muro.** El textarea del post y el input del comentario pasan a `MentionField` (comentario: `onSubmit` envía). Al enviar: `mentionIds = mentionIdsIn(body, team)`. Al pintar el cuerpo del post y de los comentarios: `splitMentions(body, team.map(m => m.name))`, y las menciones van en `<span>` con `fontWeight: 600` y `color: var(--ec-brand)`.
- [ ] **Step 8: Bandeja.** En `InboxScreen`, para `kind === "mention"`: texto `{actor} te mencionó en el muro: "{from}"` (si `to !== meId`, entonces `mencionó a {name(to)}…`). Clic → nueva prop `onOpenWall()`. En `page.tsx`: `onOpenWall={() => nav.go("wall")}`. El filtro "Solo mis tareas" del admin incluye `kind === "mention" && i.to === meId`. Revisar con el grep de Files que ningún consumidor use `taskId` como `string`.
- [ ] **Step 9: Verificar a mano (mock)** — Review Focus 2 y 4: mencionar en un post y en un comentario, entrar como la persona mencionada (cambiar de usuario en el mock) y ver el aviso; el clic abre el muro; la bandeja y el inicio del equipo no truenan. `bun run lint`, `bun run build`.
- [ ] **Step 10: Commit** (usuario): `feat(workspace): menciones en el muro`.

### Task 7: Menciones — backend y migración

**Files:**
- Modify: `docs/migrations/2026-11-17-workspace.sql` (parte 2)
- Modify: `backend-actual.js` (`/inbox` ~2288, `/wall` POST ~2346, `/wall/:id/comments` ~2381, junto a `pmLog` ~1571)
- Modify: `docs/workspace.sql`, `docs/workspace-api.md`

**Interfaces:**
- Consumes: el contrato de Task 6 (`mentionIds`, `InboxItem.postId`, `kind: "mention"`).
- Produces: `pmMentionTargets(conn, raw, authorId): Promise<number[]>` y `pmLogMention(conn, actorId, post: { id, projectId, body }, text: string, userIds: number[]): Promise<void>`.

- [ ] **Step 1: Migración parte 2:**

```sql
-- 2) Menciones del muro en la bandeja. Las filas existentes no cambian.
ALTER TABLE pm_task_activity
  MODIFY task_id INT NULL,
  MODIFY project_id INT NULL,
  ADD COLUMN post_id INT NULL AFTER task_id,
  MODIFY kind ENUM('created','assigned','unassigned','status','priority','due_date','title',
                   'description','labels','comment','subtask','deleted','mention') NOT NULL;
```

- [ ] **Step 2: `pmMentionTargets`.** `pmIdList(raw, "mentionIds") ?? []`, sin el autor; `SELECT id FROM users WHERE id IN (?) AND role IN ('admin','employee')`; devuelve solo los que existen (los inválidos se ignoran, no dan 400).
- [ ] **Step 3: `pmLogMention`.** Por usuario: `INSERT INTO pm_task_activity (task_id, post_id, parent_task_id, project_id, task_title, actor_id, kind, from_value, to_value) VALUES (NULL, ?, NULL, ?, ?, ?, 'mention', ?, ?)` (título = extracto de 80 del post, `from` = extracto de 120 del texto, `to` = `String(userId)`), audiencia `[userId]` y lectura del actor, igual que `pmLog`.
- [ ] **Step 4: Rutas.** POST `/wall` y POST `/wall/:id/comments` pasan a `pmTx`: insertan, luego `pmLogMention` con `pmMentionTargets(conn, req.body?.mentionIds, req.user.id)`. GET `/inbox` agrega `a.post_id` y responde `postId: pmId(a.post_id)`; confirmar que `pmId(null)` devuelve `null` (si no, `a.task_id == null ? null : pmId(a.task_id)`). Revisar que `PM_AUDIENCE` no dependa de `task_id`.
- [ ] **Step 5:** `node --check backend-actual.js`; docs actualizados.
- [ ] **Step 6: Commit** (usuario): `feat(api): menciones del muro`.

### Task 8: Páginas sin cliente

**Files:**
- Modify: `backend-actual.js` (después de `app.delete("/api/clients/:id/pages/:pageId", …)` ~1944)
- Modify: `src/lib/clients.ts`
- Modify: `src/app/dashboard/clients/page.tsx`

**Interfaces:**
- Produces (backend, todas `requireAdmin` + `pmRoute`):
  - `GET /api/client-pages/unassigned` → `{ pages: UnassignedPage[] }`, filas de `projects p LEFT JOIN users u ON u.id = p.id_user WHERE u.id IS NULL OR u.role <> 'client'`, con las columnas que usa `clientPage(row)` + `u.email AS owner_email`, ordenadas por título.
  - `DELETE /api/client-pages/:id` → 204; 404 si no existe; 409 `"La pagina tiene cliente; borrala desde el cliente"` si su dueño es `client`; borra `projects_content` y luego `projects` en `pmTx`.
  - `PATCH /api/client-pages/:id` body `{ clientId }` → `{ page }`; valida el cliente con `clientTarget(conn, clientId)`; 409 si la página ya tiene cliente.
- Produces (`src/lib/clients.ts`):
  - `type UnassignedPage = ClientPage & { ownerEmail: string | null }`
  - `listUnassignedPages(): Promise<UnassignedPage[]>`, `deleteUnassignedPage(id: string): Promise<void>`, `assignPage(pageId: string, clientId: string): Promise<ClientPage>`. Se reusa `request()` con un parámetro de base (`"/api/clients"` por defecto) en lugar de duplicarla.

- [ ] **Step 1: Backend** según Interfaces; `node --check backend-actual.js`.
- [ ] **Step 2: `src/lib/clients.ts`** según Interfaces.
- [ ] **Step 3: UI.** Al final de `/dashboard/clients`, si hay páginas: sección "Páginas sin cliente" / "Unassigned pages" con contador. Cada fila muestra título, `/{projectName}`, entregables, dueño (`ownerEmail` o "Sin dueño"), un enlace a `/dashboard/client-page?name=…` (el mismo patrón que las filas de cliente), un `<select>` "Asignar a…" con los clientes (asigna al elegir y recarga clientes y páginas) y eliminar con `window.confirm` (mismo texto que `removePage`). Errores con `toast.error`.
- [ ] **Step 4: Verificar.** `bun run lint`, `bun run build`. Contra el backend real (después de Task 9): aparece la página huérfana, se asigna y pasa al cliente; otra se elimina junto con sus entregables.
- [ ] **Step 5: Commit** (usuario): `feat(clients): páginas sin cliente`.

### Task 9: Despliegue y prueba final

**Files:**
- Create: `docs/superpowers/plans/2026-11-17-workspace-mejoras-deploy.md` (checklist corto)

- [ ] **Step 1: Checklist** en este orden: (1) respaldo de `pm_tasks` y `pm_task_activity` en phpMyAdmin (Exportar); (2) correr `docs/migrations/2026-11-17-workspace.sql`; (3) confirmar con `SELECT status, COUNT(*) FROM pm_tasks GROUP BY status` que los conteos no cambiaron respecto a antes; (4) subir `backend-actual.js` a cPanel y reiniciar la app Node; (5) desplegar el frontend en Vercel; (6) prueba de humo: crear tarea con Enter, mover entre los 8 estados, 409 con subtareas abiertas, mención con aviso, filtro del muro, página sin cliente.
- [ ] **Step 2:** `bun test`, `bun run lint`, `bun run build` en verde; entregar el checklist al usuario.
