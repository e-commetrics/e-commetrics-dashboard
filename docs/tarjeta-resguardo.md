# Tarjeta de resguardo en la página del cliente

Fecha: 2026-11-18. Para trabajar el 2026-11-19. **Todavía no hay código.**

## Lo que se pidió (texto original)

> Que la "tarjeta de resguardo" esté en la carátula inicial de la página del cliente hasta
> arriba a la derecha, compartiendo espacio con el dashboard.
>
> Debe incluir además del documento:
>
> Agregar como Partner en Meta:
> Business portfolio ID ECOMMETRICA: 140581703333742
>
> Activos:
> - Página de FB
> - Instagram
> - WhatsApp, WhatsApp catalog
> - Ad Account (prioritario)
>
> Acceso a esta cuenta por favor: ecommetrica@gmail.com
> - Google Business
> - Google Analytics
> - Google Search Console
> - G-Ads
>
> Opcionales:
> - Accesos Wix
> - Accesos Hostinger
> - Accesos WordPress
> - Accesos GoDaddy

## Qué es, en resumen

Una tarjeta fija en la página del cliente (`/dashboard/[project_name]`,
`src/app/dashboard/[project_name]/ProjectClient.tsx`), arriba a la derecha y junto al bloque
del dashboard. Le dice al cliente **qué accesos debe darle a Ecommetrica**:

1. **Meta.** Agregar a Ecommetrica como Partner con el Business portfolio ID
   `140581703333742`, compartiendo: Página de Facebook, Instagram, WhatsApp y su catálogo, y
   la cuenta publicitaria (marcada como **prioritaria**).
2. **Google.** Dar acceso a `ecommetrica@gmail.com` en Google Business Profile, Google
   Analytics, Google Search Console y Google Ads.
3. **Opcionales.** Accesos a Wix, Hostinger, WordPress y GoDaddy, solo si el cliente los usa.

Además debe incluir "el documento", que todavía no está identificado (ver dudas abajo).

## Lo que encontré en el código

- **No existe nada llamado "tarjeta de resguardo".** No aparece ni en el frontend ni en el
  backend.
- **Lo más parecido es la card base 2,** "List of requirements for {cliente}" ("incluye
  accesos, datos oficiales y más"), en `docs/superpowers/specs/2026-11-17-cards-base-design.md`.
  Esa vive en la lista de entregables, no arriba a la derecha.

## Propuesta para mañana (por confirmar)

- **Solo frontend, sin SQL:** el ID de Meta, el correo y la lista de accesos son iguales para
  todos los clientes, así que pueden ir fijos en el código, bilingües (ES/EN) como el resto.
- **Sin seguimiento por ahora:** la tarjeta solo informa, sin casillas por cliente para marcar
  qué ya se entregó. Guardar ese avance por cliente sí necesitaría una tabla nueva y cambios
  en el backend.
- **Para copiar:** botón para copiar el Business ID y el correo.
- **En celular** la tarjeta va debajo del dashboard, no a la derecha.

## Por confirmar antes de empezar

1. **¿Qué es "el documento"?** ¿Un PDF o carta de resguardo, de dónde sale, y es igual para
   todos los clientes o uno por cliente?
2. **¿Quién la ve?** ¿Solo el cliente, o también el equipo cuando entra a esa página?
3. **¿Seguimiento?** ¿Hace falta marcar por cliente qué accesos ya se dieron? Si sí, hay que
   tocar el backend.
4. **"Compartiendo espacio con el dashboard":** confirmar a qué bloque de la página se refiere
   (resumen o avance del proyecto), para ubicar bien la tarjeta.

## Decisiones del 2026-11-19 (implementado, sin commit)

- **"El documento"** es la pestaña *Requerimientos* de `Requerimientos TEMPLATE.xlsx` (OneDrive). Se replica
  su retícula (secciones centradas; columnas Requisito, Información, Comentarios) y se agrega la columna Estado.
- **Solo se registran accesos.** No hay campo de contraseña; las filas `U: P:` guardan solo usuario o correo.
- **Sin datos bancarios por ahora:** se quitaron Info tarjeta bancaria, Santander y BBVA. PayPal y FedEx se
  quedan como accesos de configuración.
- **Fusiones:** SEO-Google (Analytics, Ads, Merchant Center) entra en la sección de Google; "Accesos GoDaddy"
  de los opcionales es la fila DNS-Dominios de Requisitos Técnicos.
- **Flujo (opción A):** el cliente marca *Enviado*; el equipo (admin/employee) marca *Verificado* o regresa a
  *Pendiente*. Un acceso verificado queda fijo para el cliente (solo puede comentar). Los opcionales no cuentan
  en el avance.
- **Guardado:** una fila por requisito en `project_requirements`
  (`docs/migrations/2026-11-19-project-requirements.sql`); rutas `GET/PUT /api/projects/:id/requirements[/:key]`
  en `backend-actual.js`. Catálogo de filas en `src/lib/requirements.ts`; UI en `src/components/RequirementsVault.tsx`.
- **Ubicación:** a la derecha del resumen del cliente (`.ec-chero-row`); debajo en pantallas de menos de 1100px.
  La tarjeta muestra el avance, el Business ID y el correo para copiar, el aviso de Ad Account prioritaria y los
  siguientes pendientes; el botón abre la hoja completa.

## Ajustes configurables (2026-11-19)

- Global, solo datos, solo admin: Business ID de Meta, correo para accesos de Google y un mensaje opcional
  para el cliente. Botón "Configurar" en la tarjeta (solo admin). Tabla `app_settings`
  (`docs/migrations/2026-11-19-app-settings.sql`); rutas `GET` (cualquier sesión) y `PUT` (admin)
  `/api/requirements-settings`. Sin filas guardadas se usan los valores por defecto.
- Etiquetas nuevas: "Agréganos como Partner en Meta con este Business ID" y "Agrega este correo como usuario en Google".
- Filas sin campo de información (Meta y Google) muestran "Solo dar acceso" en vez de una celda vacía.
