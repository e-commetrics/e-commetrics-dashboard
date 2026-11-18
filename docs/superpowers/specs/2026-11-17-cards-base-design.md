# Cards base en las páginas de cliente — diseño corto

Fecha: 2026-11-17.

## Intención

Todos los clientes llevan las mismas 11 cards de contenido (las de Dr. Ricardo Monge). Hoy se crean a
mano una por una. Al crear la página de un cliente deben existir ya, con fase, título y descripción;
el admin solo agrega link, imagen o ajusta textos con el modal que ya existe.

## Enfoques

- **A (elegido): plantilla fija en `backend-actual.js`** e insertada en `clientPageInsert`, que es por
  donde pasan todas las altas de página (crear cliente, agregar página, crear proyecto en Workspace).
  Simple; cambiar la plantilla = editar y subir el backend (el usuario dice que no cambia).
- B: página "plantilla" editable que se copia. Descartado: página falsa que esconder y más lógica, sin
  necesidad porque la plantilla no cambia.

## Plantilla

`{cliente}` = `projects.title` de la página. Sin link ni imagen. Orden = orden de inserción.

| # | type | content_1 | content_2 | content_3 | href |
|---|---|---|---|---|---|
| 1 | Business and Objectives | Bank of files, content and more of {cliente} | Acceso a todos los archivos generados para {cliente}. | | Drive |
| 2 | Business and Objectives | List of requirements for {cliente} | Lista de los requerimientos recopilados de {cliente} incluye accesos, datos oficiales y más. | | Lista de requerimientos |
| 3 | Business and Objectives | Benchmarking | Benchmarking of {cliente}. | Analice the performance and comparison with different competitors | Benchmark |
| 4 | MVP + IDEA | Develop/Improve the design and functionality of the webpage. | Webpage | | |
| 5 | MVP + IDEA | Implement SEO BASICS to drive growth for the company. | Estructura del SEO Schema\nPalabras clave para indexación en Google | | SEO Schema |
| 6 | Business strategy | Develop Customer Journey Map | Describe the plan for utilizing multiple marketing channels to reach potential customers and show customer's journey map | | |
| 7 | Growth Hacking strategy | META Campaign | | | Presentación de contenido |
| 8 | Apps | Run Functionalities. | | | |
| 9 | Apps | integrate with Doctoralia | | | |
| 10 | Growth Hacking strategy | SEO Campaign | | | |
| 11 | Business strategy | Develop a growth hacking strategy using META-Ads | | | |

Textos copiados de Monge (ids 22–50 de `projects_content`), con el nombre reemplazado por `{cliente}`.
Las etiquetas `href` que eran del cliente ("Dr.RicardoMonge-Drive", "Mongeortopedia.com") quedan
genéricas o vacías.

## Botón "Agregar cards base" (clientes existentes)

- En `/dashboard/[project_name]`, solo admin, junto a "Crear contenido".
- `GET /api/client-pages/:id/base-cards` (admin) → `{ missing: Card[] }`: las de la plantilla cuyo
  `type` + `content_1` (normalizado: minúsculas, sin acentos, puntos ni espacios dobles, con `{cliente}`
  resuelto) no existen en la página.
- Al hacer clic se abre un modal con esas cards marcadas; el admin desmarca las que no quiere y confirma.
- `POST /api/client-pages/:id/base-cards { indexes: number[] }` (admin) → inserta esas, en una
  transacción → `{ added: number }`. Recarga el contenido.
- Si no falta ninguna: el modal lo dice y no ofrece agregar.

## Restricciones

- No se modifica ni borra contenido existente; solo se insertan filas nuevas.
- Rutas nuevas con `requireAdmin`; no se tocan rutas existentes.
- La ruta vieja `POST` de la pantalla `create-project` (línea ~467) no recibe la plantilla; el botón
  cubre esos casos.
- Sin migración SQL.

## Fuera de alcance

Editar la plantilla desde la UI, plantillas por paquete o tipo de cliente.

## Cards ocultas para el cliente (agregado 2026-11-17)

Pedido: el cliente no ve las cards base mientras estén incompletas; solo el admin.

- Columna `projects_content.hidden` TINYINT: 0 visible (default; todas las existentes), 1 oculta hasta
  completarla, 2 oculta a mano. Migración: `docs/migrations/2026-11-17-cards-ocultas.sql`.
- Las cards base nacen con `hidden = 1`. Al editar una card con `hidden = 1` y dejarle link o imagen, el
  `PUT /api/project_content/:id` la pone en 0 (publicación automática). Las de `hidden = 2` no se publican solas.
- `PATCH /api/project_content/:id/visibility { hidden: boolean }` (admin) → 2 u 0: botones
  "Publicar al cliente" / "Ocultar" en cada card (solo admin).
- Filtro real en la API (decisión del usuario): `GET /api/project_content` y `GET /api/project_content/:id`
  siguen abiertas, pero si la cookie no es de un admin excluyen `hidden <> 0`.
- Orden de despliegue: SQL → backend → frontend (el backend nuevo usa la columna).
