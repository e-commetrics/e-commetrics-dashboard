import type { CSSProperties } from "react";
import type { CalendarLang } from "./dates";

/** Label for where an appointment was created. */
export function getOriginText(origen: string | undefined | null, lang: CalendarLang): string {
  if (origen === "dashboard") return "Dashboard";
  return lang === "es" ? "Página Web" : "Web Page";
}

const base: CSSProperties = { fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "1px solid" };
const green: CSSProperties = { ...base, background: "rgba(34,197,94,0.12)", color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" };
const slate: CSSProperties = { ...base, background: "rgba(100,116,139,0.12)", color: "#94a3b8", borderColor: "rgba(100,116,139,0.3)" };

const ORIGIN_STYLES: Record<string, CSSProperties> = {
  dashboard: { ...base, background: "rgba(168,85,247,0.12)", color: "#a855f7", borderColor: "rgba(168,85,247,0.3)" },
  web: green,
  paginaweb: green,
  sitio: green,
  telefono: { ...base, background: "rgba(249,115,22,0.12)", color: "#f97316", borderColor: "rgba(249,115,22,0.3)" },
  app: { ...base, background: "rgba(99,102,241,0.12)", color: "#6366f1", borderColor: "rgba(99,102,241,0.3)" },
  otro: slate,
};

/** Badge colours per origin; missing origin counts as the website. */
export function getOriginBadgeStyles(origen: string | undefined | null): CSSProperties {
  if (!origen || origen === "null" || origen === "undefined") return green;
  return ORIGIN_STYLES[String(origen).trim().toLowerCase()] || slate;
}
