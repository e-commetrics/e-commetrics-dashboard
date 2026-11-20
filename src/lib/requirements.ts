import { apiFetch } from "@/lib/api";

/**
 * Tarjeta de resguardo: la hoja "Requerimientos" (Requerimientos TEMPLATE.xlsx) dentro del dashboard.
 * Registra qué accesos y datos dio el cliente; nunca guarda contraseñas.
 * Las claves (`key`) deben coincidir con REQUIREMENT_KEYS en backend-actual.js.
 */

/** Datos que el admin configura desde la tarjeta (tabla app_settings); iguales para todos los clientes. */
export type VaultSettings = {
  metaBusinessId: string;
  googleEmail: string;
  /** Mensaje opcional para el cliente, visible en la tarjeta y arriba de la hoja. */
  clientNote: string;
};

// Respaldo mientras carga o si nunca se configuró; el backend usa los mismos valores.
export const DEFAULT_VAULT_SETTINGS: VaultSettings = {
  metaBusinessId: "140581703333742",
  googleEmail: "ecommetrica@gmail.com",
  clientNote: "",
};

/** Mismas reglas que el backend. Devuelve el campo con error, o null si todo está bien. */
export function vaultSettingsError(s: VaultSettings): keyof VaultSettings | null {
  if (!/^\d{5,30}$/.test(s.metaBusinessId.trim())) return "metaBusinessId";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.googleEmail.trim()) || s.googleEmail.trim().length > 160) return "googleEmail";
  if (s.clientNote.trim().length > 300) return "clientNote";
  return null;
}

export type RequirementStatus = "pending" | "sent" | "verified";

export type RequirementItem = {
  key: string;
  es: string;
  en: string;
  /** Placeholders de las dos columnas de Información (sin ellos se usan DEFAULT_INFO y DEFAULT_INFO2). */
  info?: { es: string; en: string };
  info2?: { es: string; en: string };
  priority?: boolean;
  /** Agregado por el admin o el cliente en esta página; no es parte de la plantilla. */
  custom?: boolean;
};

export type RequirementSection = {
  id: string;
  es: string;
  en: string;
  /** Instrucción bajo el título de la sección (a quién dar el acceso). */
  note?: { es: string; en: string };
  /** Dato configurable que se muestra después de la nota (ID de Meta o correo de Google). */
  setting?: "metaBusinessId" | "googleEmail";
  optional?: boolean;
  items: RequirementItem[];
};

const ACCOUNT = { es: "Usuario o correo de la cuenta (sin contraseña)", en: "Account user or email (no password)" };
const LINK = { es: "Link del perfil", en: "Profile link" };
export const DEFAULT_INFO = { es: "Usuario, correo o link", en: "User, email or link" };
export const DEFAULT_INFO2 = { es: "Dato adicional", en: "Additional info" };

export const REQUIREMENT_SECTIONS: RequirementSection[] = [
  {
    id: "business",
    es: "Datos del Negocio",
    en: "Business details",
    items: [
      { key: "address", es: "Dirección completa del local", en: "Full store address", info: { es: "Calle, número, colonia, ciudad, CP", en: "Street, number, city, ZIP" } },
      { key: "tax_data", es: "Datos fiscales", en: "Tax details", info: { es: "Razón social", en: "Legal name" }, info2: { es: "RFC", en: "Tax ID" } },
      { key: "official_phone", es: "Teléfono oficial", en: "Official phone", info: { es: "Teléfono con lada", en: "Phone with area code" } },
      { key: "bank_clabe", es: "CLABE banco", en: "Bank CLABE", info: { es: "CLABE interbancaria (18 dígitos)", en: "CLABE (18 digits)" }, info2: { es: "Banco y titular", en: "Bank and account holder" } },
    ],
  },
  {
    id: "tech",
    es: "Requisitos Técnicos",
    en: "Technical requirements",
    items: [
      { key: "official_email", es: "Email oficial", en: "Official email", info: { es: "correo@tuempresa.com", en: "name@yourcompany.com" } },
      { key: "dns_domains", es: "DNS-Dominios", en: "DNS / domains", info: ACCOUNT },
      { key: "paypal", es: "PayPal (accesos para configuración)", en: "PayPal (setup access)", info: ACCOUNT },
      { key: "fedex", es: "FedEx", en: "FedEx", info: ACCOUNT },
    ],
  },
  {
    id: "meta",
    es: "Agregar como Partner en Meta",
    en: "Add as Partner on Meta",
    note: {
      es: "Comparte estos activos con el Business portfolio ID de Ecommetrica:",
      en: "Share these assets with the Ecommetrica business portfolio ID:",
    },
    setting: "metaBusinessId",
    items: [
      { key: "meta_ad_account", es: "Cuenta publicitaria (Ad Account)", en: "Ad Account", priority: true },
      { key: "meta_page", es: "Página de Facebook", en: "Facebook Page" },
      { key: "meta_instagram", es: "Instagram", en: "Instagram" },
      { key: "meta_whatsapp", es: "WhatsApp", en: "WhatsApp" },
      { key: "meta_whatsapp_catalog", es: "Catálogo de WhatsApp", en: "WhatsApp catalog" },
      { key: "meta_pixel", es: "Pixel / Dataset", en: "Pixel / Dataset" },
    ],
  },
  {
    id: "google",
    es: "Accesos de Google",
    en: "Google access",
    note: {
      es: "Agrega este correo como usuario en cada herramienta:",
      en: "Add this email as a user in each tool:",
    },
    setting: "googleEmail",
    items: [
      { key: "google_business", es: "Google Business Profile", en: "Google Business Profile" },
      { key: "google_analytics", es: "Google Analytics", en: "Google Analytics" },
      { key: "google_search_console", es: "Google Search Console", en: "Google Search Console" },
      { key: "google_ads", es: "Google Ads", en: "Google Ads" },
      { key: "google_merchant_center", es: "Merchant Center", en: "Merchant Center" },
      { key: "google_youtube", es: "YouTube", en: "YouTube" },
    ],
  },
  {
    id: "social",
    es: "Links de Social Media",
    en: "Social media links",
    items: [
      { key: "facebook", es: "Facebook (accesos)", en: "Facebook (access)", info: LINK },
      { key: "instagram", es: "Instagram (accesos)", en: "Instagram (access)", info: LINK },
      { key: "youtube", es: "Cuenta de YouTube (crear y accesos)", en: "YouTube account (create and access)", info: LINK },
    ],
  },
  {
    id: "optional",
    es: "Opcionales",
    en: "Optional",
    note: { es: "Solo si tu sitio usa estas plataformas.", en: "Only if your site uses these platforms." },
    optional: true,
    items: [
      { key: "wix", es: "Accesos Wix", en: "Wix access", info: ACCOUNT },
      { key: "hostinger", es: "Accesos Hostinger", en: "Hostinger access", info: ACCOUNT },
      { key: "wordpress", es: "Accesos WordPress", en: "WordPress access", info: ACCOUNT },
    ],
  },
  {
    id: "catalog",
    es: "Requisitos de Catálogo",
    en: "Catalog requirements",
    note: {
      es: "Por producto: título, descripción, imágenes, precio, precio a comparar, impuestos, colección/catálogo, SKU, código de barras, política, cantidad. Para envío: peso, origen, HS, servicio de logística y variantes.",
      en: "Per product: title, description, images, price, compare-at price, taxes, collection/catalog, SKU, barcode, policy, quantity. For shipping: weight, origin, HS code, logistics service and variants.",
    },
    items: [
      { key: "product_info", es: "Información de productos", en: "Product information", info: { es: "Link al archivo con los productos", en: "Link to the product file" } },
    ],
  },
];

/** Requisito que el admin o el cliente agregó a una sección de su página. Clave: `custom_<id>`. */
export type CustomRequirement = { key: string; section: string; label: string };

/** Plantilla más los requisitos propios de la página, cada uno al final de su sección. */
export function withCustom(custom: CustomRequirement[]): RequirementSection[] {
  return REQUIREMENT_SECTIONS.map((s) => ({
    ...s,
    items: [
      ...s.items,
      ...custom.filter((c) => c.section === s.id).map((c) => ({ key: c.key, es: c.label, en: c.label, custom: true })),
    ],
  }));
}

export const requiredKeys = (sections: RequirementSection[]) =>
  sections.filter((s) => !s.optional).flatMap((s) => s.items.map((i) => i.key));

export const REQUIRED_KEYS = requiredKeys(REQUIREMENT_SECTIONS);

export type RequirementRow = {
  key: string;
  status: RequirementStatus;
  info: string | null;
  info2: string | null;
  comment: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
};

/** Pendiente y Enviado los decide la información: con algún dato pasa a Enviado. Verificado no cambia. */
export function statusAfterInfo(current: RequirementStatus, hasInfo: boolean): RequirementStatus {
  if (current === "verified") return current;
  return hasInfo ? "sent" : "pending";
}

/** Solo el equipo cambia el estado a mano: Enviado → Verificado, o Verificado → Enviado para deshacer. */
export function canSetStatus(isTeam: boolean, current: RequirementStatus, next: RequirementStatus): boolean {
  return isTeam && ((current === "sent" && next === "verified") || (current === "verified" && next === "sent"));
}

export function requirementProgress(rows: Record<string, RequirementRow>, keys: string[] = REQUIRED_KEYS) {
  let sent = 0;
  let verified = 0;
  for (const key of keys) {
    const s = rows[key]?.status;
    if (s === "verified") verified++;
    else if (s === "sent") sent++;
  }
  return { total: keys.length, sent, verified };
}

async function readError(res: Response): Promise<never> {
  const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
  throw new Error(data?.error ?? data?.message ?? `${res.status}`);
}

export async function listRequirements(
  projectId: number
): Promise<{ rows: Record<string, RequirementRow>; custom: CustomRequirement[] }> {
  const res = await apiFetch(`/api/projects/${projectId}/requirements`);
  if (!res.ok) await readError(res);
  const data = (await res.json()) as { requirements: RequirementRow[]; custom?: CustomRequirement[] };
  return { rows: Object.fromEntries(data.requirements.map((r) => [r.key, r])), custom: data.custom ?? [] };
}

export async function saveRequirement(
  projectId: number,
  key: string,
  patch: Partial<Pick<RequirementRow, "status" | "info" | "info2" | "comment">>
): Promise<RequirementRow> {
  const res = await apiFetch(`/api/projects/${projectId}/requirements/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) await readError(res);
  return ((await res.json()) as { requirement: RequirementRow }).requirement;
}

export async function addCustomRequirement(projectId: number, section: string, label: string): Promise<CustomRequirement> {
  const res = await apiFetch(`/api/projects/${projectId}/requirements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, label }),
  });
  if (!res.ok) await readError(res);
  return ((await res.json()) as { item: CustomRequirement }).item;
}

/** Solo admin. Borra el requisito propio y lo que se haya llenado en él. */
export async function deleteCustomRequirement(projectId: number, key: string): Promise<void> {
  const res = await apiFetch(`/api/projects/${projectId}/requirements/${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!res.ok) await readError(res);
}

export async function getVaultSettings(): Promise<VaultSettings> {
  const res = await apiFetch("/api/requirements-settings");
  if (!res.ok) await readError(res);
  return { ...DEFAULT_VAULT_SETTINGS, ...((await res.json()) as { settings: Partial<VaultSettings> }).settings };
}

export async function saveVaultSettings(settings: VaultSettings): Promise<VaultSettings> {
  const res = await apiFetch("/api/requirements-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) await readError(res);
  return ((await res.json()) as { settings: VaultSettings }).settings;
}
