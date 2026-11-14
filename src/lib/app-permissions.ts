import { apiFetch } from "@/lib/api";

export const APP_COMPONENTS = [
  "QR",
  "Vcard",
  "blogs",
  "Reforma",
  "Monge",
  "PromoPalmas",
  "CalendarioPalmas",
  "ScanEat",
  "CRM",
] as const;

export type AppComponent = (typeof APP_COMPONENTS)[number];

export type AppPermission = {
  component: string;
  can_view: boolean;
};

export const APP_COMPONENT_LABELS: Record<string, string> = {
  QR: "Codigos QR",
  Vcard: "Tarjetas de visita",
  blogs: "Blogs",
  Reforma: "Cal. Reforma",
  Monge: "Cal. Monge",
  PromoPalmas: "Promo Palmas",
  CalendarioPalmas: "Cal. Palmas",
  ScanEat: "ScanEat Demos",
  CRM: "CRM",
};

/** Completa la respuesta del backend con todos los componentes, apagados por defecto. */
export function withAllComponents(permissions: AppPermission[]): AppPermission[] {
  return APP_COMPONENTS.map((component) => {
    const found = permissions.find((p) => p.component === component);
    return { component, can_view: found?.can_view === true };
  });
}

export async function fetchAppPermissions(userId: string | number): Promise<AppPermission[]> {
  const res = await apiFetch(`/api/users/${userId}/apps`);
  if (!res.ok) throw new Error("Error al obtener permisos");
  const data = (await res.json()) as AppPermission[];
  return withAllComponents(Array.isArray(data) ? data : []);
}

export async function saveAppPermissions(userId: string | number, permissions: AppPermission[]): Promise<void> {
  const res = await apiFetch(`/api/users/${userId}/apps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(permissions),
  });
  if (!res.ok) throw new Error("Error al guardar permisos");
}
