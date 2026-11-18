"use client";

import { useLang } from "@/app/context/LangContext";
import type { Priority, ProjectStatus, TaskStatus } from "./types";

/** `t("Hola", "Hello")`: misma convencion de ternarios del resto del dashboard, en una funcion. */
export function useT() {
  const { lang } = useLang();
  const l = lang === "en" ? "en" : "es";
  const t = (es: string, en: string) => (l === "es" ? es : en);
  return { t, lang: l as "es" | "en" };
}

/** `color` is for dots and stripes only. Text uses `badge` (ink on a soft surface) plus a `glyph`, so it reads without colour. */
export const TASK_STATUS_META: Record<TaskStatus, { es: string; en: string; color: string; badge: string; glyph: string }> = {
  todo: { es: "Abierta", en: "Open", color: "var(--ec-text-dim)", badge: "ec-badge-neutral", glyph: "ec-glyph-idle" },
  pending: { es: "Pendiente", en: "Pending", color: "var(--ec-border)", badge: "ec-badge-neutral", glyph: "ec-glyph-idle" },
  in_progress: { es: "En curso", en: "In progress", color: "var(--ec-info)", badge: "ec-badge-info", glyph: "ec-glyph-ok" },
  done: { es: "Completada", en: "Completed", color: "var(--ec-success)", badge: "ec-badge-success", glyph: "ec-glyph-ok" },
  review: { es: "En revisión", en: "In review", color: "var(--ec-warning)", badge: "ec-badge-warning", glyph: "ec-glyph-warn" },
  accepted: { es: "Aceptada", en: "Accepted", color: "var(--ec-success)", badge: "ec-badge-success", glyph: "ec-glyph-ok" },
  rejected: { es: "Rechazada", en: "Rejected", color: "var(--ec-danger)", badge: "ec-badge-danger", glyph: "ec-glyph-bad" },
  blocked: { es: "Bloqueada", en: "Blocked", color: "var(--ec-danger)", badge: "ec-badge-danger", glyph: "ec-glyph-bad" },
};

export const PROJECT_STATUS_META: Record<ProjectStatus, { es: string; en: string; badge: string }> = {
  planning: { es: "Planeación", en: "Planning", badge: "ec-badge-neutral" },
  active: { es: "Activo", en: "Active", badge: "ec-badge-info" },
  on_hold: { es: "En pausa", en: "On hold", badge: "ec-badge-warning" },
  completed: { es: "Completado", en: "Completed", badge: "ec-badge-success" },
  archived: { es: "Archivado", en: "Archived", badge: "ec-badge-neutral" },
};

export const PRIORITY_META: Record<Priority, { es: string; en: string; color: string }> = {
  urgent: { es: "Urgente", en: "Urgent", color: "var(--ec-danger)" },
  high: { es: "Alta", en: "High", color: "var(--ec-warning)" },
  normal: { es: "Normal", en: "Normal", color: "var(--ec-border)" },
  low: { es: "Baja", en: "Low", color: "var(--ec-border)" },
};

/** Distinction set (light steps). Only used when the client has no logo; the card shows a readable step of it. */
export const PROJECT_COLORS = ["#2A78D6", "#1BAF7A", "#6250D6", "#EB6834", "#EDA100", "#C2185B"];
