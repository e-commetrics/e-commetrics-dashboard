import { apiFetch } from "@/lib/api";

/**
 * Tarjeta de resguardo: la hoja "Requerimientos" (Requerimientos TEMPLATE.xlsx) dentro del dashboard.
 * Solo registra qué accesos dio el cliente; nunca guarda contraseñas ni datos bancarios.
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
  /** Placeholder de la columna Información. Sin `info` la fila no lleva texto, solo estado. */
  info?: { es: string; en: string };
  priority?: boolean;
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

export const REQUIREMENT_SECTIONS: RequirementSection[] = [
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
    ],
  },
  {
    id: "tech",
    es: "Requisitos Técnicos",
    en: "Technical requirements",
    items: [
      { key: "official_email", es: "Email oficial", en: "Official email", info: { es: "correo@tuempresa.com", en: "name@yourcompany.com" } },
      { key: "dns_domains", es: "DNS-Dominios (accesos a GoDaddy)", en: "DNS / domains (GoDaddy access)", info: ACCOUNT },
      { key: "paypal", es: "PayPal (accesos para configuración)", en: "PayPal (setup access)", info: ACCOUNT },
      { key: "fedex", es: "FedEx", en: "FedEx", info: ACCOUNT },
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
    id: "business",
    es: "Datos del Negocio",
    en: "Business details",
    items: [
      { key: "address", es: "Dirección completa del local", en: "Full store address", info: { es: "Calle, número, colonia, ciudad, CP", en: "Street, number, city, ZIP" } },
      { key: "tax_data", es: "Datos fiscales", en: "Tax details", info: { es: "Razón social y RFC", en: "Legal name and tax ID" } },
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
];

export const REQUIRED_KEYS = REQUIREMENT_SECTIONS.filter((s) => !s.optional).flatMap((s) => s.items.map((i) => i.key));

export type RequirementRow = {
  key: string;
  status: RequirementStatus;
  info: string | null;
  comment: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
};

/** El equipo pone cualquier estado; el cliente solo marca o desmarca "enviado", y no toca lo ya verificado. */
export function canSetStatus(isTeam: boolean, current: RequirementStatus, next: RequirementStatus): boolean {
  if (isTeam) return true;
  return current !== "verified" && next !== "verified";
}

export function requirementProgress(rows: Record<string, RequirementRow>) {
  let sent = 0;
  let verified = 0;
  for (const key of REQUIRED_KEYS) {
    const s = rows[key]?.status;
    if (s === "verified") verified++;
    else if (s === "sent") sent++;
  }
  return { total: REQUIRED_KEYS.length, sent, verified };
}

async function readError(res: Response): Promise<never> {
  const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
  throw new Error(data?.error ?? data?.message ?? `${res.status}`);
}

export async function listRequirements(projectId: number): Promise<Record<string, RequirementRow>> {
  const res = await apiFetch(`/api/projects/${projectId}/requirements`);
  if (!res.ok) await readError(res);
  const data = (await res.json()) as { requirements: RequirementRow[] };
  return Object.fromEntries(data.requirements.map((r) => [r.key, r]));
}

export async function saveRequirement(
  projectId: number,
  key: string,
  patch: Partial<Pick<RequirementRow, "status" | "info" | "comment">>
): Promise<RequirementRow> {
  const res = await apiFetch(`/api/projects/${projectId}/requirements/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) await readError(res);
  return ((await res.json()) as { requirement: RequirementRow }).requirement;
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
