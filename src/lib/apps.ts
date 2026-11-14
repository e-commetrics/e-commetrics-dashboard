/**
 * Single source of truth for the gated web apps: which route belongs to which
 * permission `component` id. The `component` strings must match the ones stored
 * in the DB and listed in `access-app/page.tsx`.
 */
export const APP_ROUTES: Record<string, string> = {
  qr: "QR",
  vcard: "Vcard",
  blogs: "blogs",
  "calendar-reforma": "Reforma",
  "calendar-monge": "Monge",
  "promo-palmas": "PromoPalmas",
  "calendario-palmas": "CalendarioPalmas",
  "scan-eat": "ScanEat",
  crm: "CRM",
};

/** Dashboard sections only admins may open. */
export const ADMIN_ONLY_ROUTES = [
  "/dashboard/access-app",
  "/dashboard/clients",
  "/dashboard/create-project",
  "/dashboard/update-project",
  "/dashboard/create-project-content",
  "/dashboard/update-project-content",
];

/** Returns the permission component required for a path, or null if none. */
export function appComponentForPath(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/webapp\/([^/]+)/);
  if (!match) return null;
  // Unknown webapp routes require a permission nobody has, so only admins get in.
  return APP_ROUTES[match[1]] ?? `__unknown:${match[1]}`;
}

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/** Sections for the internal team only (admins and employees, never clients). */
export const TEAM_ONLY_ROUTES = ["/dashboard/workspace", "/dashboard/team", "/dashboard/client-page"];

export function isTeamOnlyPath(pathname: string): boolean {
  return TEAM_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

// ─── App catalog and client grouping (sidebar, breadcrumbs, client home) ─────

export type AppDef = {
  /** Route slug under /dashboard/webapp/. */
  slug: string;
  es: string;
  en: string;
  /** Permission component id (same as APP_ROUTES[slug]). */
  component: string;
};

export const APPS: AppDef[] = [
  { slug: "calendario-palmas", es: "Reservas", en: "Bookings", component: "CalendarioPalmas" },
  { slug: "promo-palmas", es: "Códigos promo", en: "Promo codes", component: "PromoPalmas" },
  { slug: "calendar-reforma", es: "Citas", en: "Appointments", component: "Reforma" },
  { slug: "crm", es: "CRM", en: "CRM", component: "CRM" },
  { slug: "calendar-monge", es: "Citas", en: "Appointments", component: "Monge" },
  { slug: "blogs", es: "Blog y comentarios", en: "Blog and comments", component: "blogs" },
  { slug: "scan-eat", es: "Solicitudes de demo", en: "Demo requests", component: "ScanEat" },
  { slug: "qr", es: "Códigos QR", en: "QR codes", component: "QR" },
  { slug: "vcard", es: "vCards", en: "vCards", component: "Vcard" },
];

export const appUrl = (slug: string) => `/dashboard/webapp/${slug}`;
export const appBySlug = (slug: string) => APPS.find((a) => a.slug === slug);

/**
 * Which apps belong to which client. The sidebar shows one entry per client
 * holding its page and its apps, instead of flat "Apps" and "Calendars" menus.
 * `match` links the client to its project (project_name or title) by name,
 * because the backend has no client↔app relation yet.
 */
export type ClientGroup = { id: string; name: string; color: string; match: RegExp; apps: string[] };

export const CLIENT_GROUPS: ClientGroup[] = [
  { id: "palmas", name: "Palmas Recovery", color: "#D97706", match: /palmas/i, apps: ["calendario-palmas", "promo-palmas"] },
  { id: "reforma", name: "Reforma Dental", color: "#2563EB", match: /reforma/i, apps: ["calendar-reforma", "crm"] },
  { id: "monge", name: "Monge Ortopedia", color: "#059669", match: /monge/i, apps: ["calendar-monge", "blogs"] },
  { id: "scaneat", name: "Scan & Eat", color: "#7C3AED", match: /scan\s*&?\s*-?\s*eat|scaneat/i, apps: ["scan-eat"] },
];

/** Apps that belong to no client in particular. */
export const TOOL_APPS = ["qr", "vcard"];

export function clientGroupFor(...texts: (string | null | undefined)[]): ClientGroup | undefined {
  return CLIENT_GROUPS.find((g) => texts.some((t) => t && g.match.test(t)));
}

/** Share of completed tasks, 0–100. This is THE project progress figure. */
export function progressPct(counts: { total: number; done: number } | null | undefined): number {
  if (!counts || counts.total <= 0) return 0;
  return Math.round((counts.done / counts.total) * 100);
}
