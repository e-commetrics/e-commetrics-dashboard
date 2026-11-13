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

export const TASK_STATUS_META: Record<TaskStatus, { es: string; en: string; color: string }> = {
  todo: { es: "Por hacer", en: "To do", color: "#8b8b93" },
  in_progress: { es: "En curso", en: "In progress", color: "#3b82f6" },
  review: { es: "En revisión", en: "Review", color: "#f59e0b" },
  done: { es: "Hecho", en: "Done", color: "#22c55e" },
};

export const PROJECT_STATUS_META: Record<ProjectStatus, { es: string; en: string; badge: string }> = {
  planning: { es: "Planeación", en: "Planning", badge: "ec-badge-neutral" },
  active: { es: "Activo", en: "Active", badge: "ec-badge-brand" },
  on_hold: { es: "En pausa", en: "On hold", badge: "ec-badge-warning" },
  completed: { es: "Completado", en: "Completed", badge: "ec-badge-success" },
  archived: { es: "Archivado", en: "Archived", badge: "ec-badge-neutral" },
};

export const PRIORITY_META: Record<Priority, { es: string; en: string; color: string }> = {
  urgent: { es: "Urgente", en: "Urgent", color: "#ef4444" },
  high: { es: "Alta", en: "High", color: "#f59e0b" },
  normal: { es: "Normal", en: "Normal", color: "#3b82f6" },
  low: { es: "Baja", en: "Low", color: "#8b8b93" },
};

export const PROJECT_COLORS = ["#BD155C", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#64748b"];
