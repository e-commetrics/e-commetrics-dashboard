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
  "/dashboard/create-client",
  "/dashboard/update-client",
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
export const TEAM_ONLY_ROUTES = ["/dashboard/workspace"];

export function isTeamOnlyPath(pathname: string): boolean {
  return TEAM_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
