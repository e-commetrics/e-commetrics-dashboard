import { customPlan, plans, type Locale } from "@/lib/pricing";
import type { PackageId } from "./types";

export type PackageOption = { id: PackageId; name: string; months: number | null };

/** Paquetes de Ecommetrica (pricing.ts) en el idioma activo. */
export function packageOptions(lang: Locale): PackageOption[] {
  return [
    ...plans.map((p) => ({ id: p.id as PackageId, name: p.name[lang], months: p.durationMonths })),
    { id: customPlan.id, name: customPlan.name[lang], months: 8 },
  ];
}

export function packageName(id: PackageId | null, lang: Locale): string | null {
  if (!id) return null;
  return packageOptions(lang).find((p) => p.id === id)?.name ?? id;
}

/**
 * Tareas iniciales de un proyecto: una por cada inclusion del paquete.
 * Las de solo EUA se incluyen marcadas, porque el paquete no sabe la region
 * del cliente; se pueden borrar al crear.
 */
export function packageTemplateTasks(id: PackageId, lang: Locale): { title: string; description: string | null }[] {
  if (id === "custom") {
    return customPlan.modules.map((m) => ({ title: m.title[lang], description: m.description[lang] }));
  }
  const plan = plans.find((p) => p.id === id);
  if (!plan) return [];
  return plan.features.map((f) => ({
    title: f.usOnly ? `${f.text[lang]} (${lang === "es" ? "solo EUA" : "US only"})` : f.text[lang],
    description: f.description?.[lang] ?? null,
  }));
}
