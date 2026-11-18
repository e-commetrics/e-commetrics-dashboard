# Cards base — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Las páginas de cliente nuevas nacen con las 11 cards base, y un botón de admin agrega las que les falten a las existentes.

**Architecture:** Plantilla `PM_BASE_CARDS` en `backend-actual.js`; `clientPageInsert` las inserta; dos rutas admin `/api/client-pages/:id/base-cards`. Frontend: helpers en `src/lib/clients.ts` y botón + modal en `src/app/dashboard/[project_name]/ProjectClient.tsx`.

**Tech Stack:** Express + mysql2; Next 16 + React + TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-17-cards-base-design.md`

## Global Constraints

- Solo inserta filas en `projects_content`; nunca modifica ni borra. Sin SQL nuevo.
- `projects_content.id_user` = `projects.id_user` de la página (como hace el modal).
- `{cliente}` = `projects.title`. Textos exactos: tabla del spec.
- Rutas nuevas con `requireAdmin` + `pmRoute`; consultas con `?`.
- Sin commits de Claude. Backend se sube a mano (CRLF; editar con Edit, no con `sed -i`).

## Review Focus

1. Página creada con título vacío o con acentos: `{cliente}` se resuelve sin romper.
2. Doble clic en confirmar: no debe insertar dos veces (botón deshabilitado mientras guarda).
3. `indexes` con valores fuera de rango o repetidos: se ignoran.
4. Páginas de Monge: el modal lista cards que ya tiene con otro texto; el admin las desmarca.
5. Frontend desplegado antes que el backend: el botón muestra el error del backend (404) en un toast.

---

### Task 1: Backend — plantilla, alta automática y rutas

**Files:** Modify `backend-actual.js` (junto a `clientPageInsert` ~1818 y después de las rutas `/api/client-pages`).

**Interfaces (produce):**
- `PM_BASE_CARDS: { type, content_1, content_2, content_3, href }[]` (11, del spec).
- `pmBaseCardsFor(title: string)` → cards con `{cliente}` resuelto.
- `pmCardKey(type, content_1)` → string normalizado (minúsculas, sin acentos, sin `.`, espacios simples).
- `pmInsertBaseCards(conn, page: { id, id_user, title }, cards)`.
- `GET /api/client-pages/:id/base-cards` → `{ missing: { index: number; type; content_1; content_2; content_3; href }[] }` (`index` = posición en la plantilla).
- `POST /api/client-pages/:id/base-cards { indexes: number[] }` → `{ added: number }` (solo las que siguen faltando; índices inválidos/repetidos se ignoran; en `pmTx`).

- [ ] Step 1: plantilla y helpers. `clientPageInsert` llama `pmInsertBaseCards` con las 11 y su SELECT cuenta entregables reales.
- [ ] Step 2: las dos rutas; 404 si la página no existe.
- [ ] Step 3: `node --check backend-actual.js` → sin errores; archivo sigue en CRLF.

### Task 2: Frontend — helpers y botón

**Files:** Modify `src/lib/clients.ts`, `src/app/dashboard/[project_name]/ProjectClient.tsx`.

**Interfaces (produce):** `type BaseCard = { index: number; type: string; content_1: string; content_2: string; content_3: string; href: string }`; `listMissingBaseCards(pageId: string | number): Promise<BaseCard[]>`; `addBaseCards(pageId: string | number, indexes: number[]): Promise<number>` (vía `request(…, "/api/client-pages")`).

- [ ] Step 1: helpers.
- [ ] Step 2: botón "Agregar cards base" (solo `isAdmin`) junto a "Crear contenido"; abre `Modal` (de `webapp/crm/components/ui`) que carga los faltantes, lista con checkbox (fase + título, todas marcadas), "Agregar N" deshabilitado si 0 o guardando; si no falta ninguna: "Este cliente ya tiene todas las cards base."; al terminar: toast y recarga del contenido (misma función que `onSaved` del `ContentModal`).
- [ ] Step 3: `tsc --noEmit`, eslint de los archivos tocados, `bun run build`.

### Task 3: Verificación tras subir el backend

- [ ] En el navegador (Claude in Chrome), en localhost con la API real: `GET …/base-cards` de Monge responde la lista; el modal se abre y lista; no se confirma nada sin permiso del usuario.
