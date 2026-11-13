import type { TaskWithProject, WorkProject } from "@/app/dashboard/workspace/lib/types";

// Pure helpers behind the team home. No React, no fetching: easy to unit test.

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Local "YYYY-MM-DD" of an ISO timestamp (or of a date-only string). */
export function localDay(iso: string): string {
  return iso.length <= 10 ? iso : ymd(new Date(iso));
}

export function isOverdue(task: { status: string; dueDate: string | null }, today: string): boolean {
  return task.status !== "done" && !!task.dueDate && task.dueDate.slice(0, 10) < today;
}

export type CompletionStats = {
  /** Tasks completed since the 1st of this month. */
  completed: number;
  /** Tasks completed in the whole previous month. */
  completedPrev: number;
  /** % of this month's completed tasks finished on or before their due date; null if none had a due date. */
  onTime: number | null;
  onTimePrev: number | null;
  /** Open tasks past their due date, right now. */
  overdueOpen: number;
  /** Cumulative completed per day of this month, up to today (for the sparkline). */
  series: number[];
};

function onTimeRate(tasks: TaskWithProject[]): number | null {
  const dated = tasks.filter((t) => t.dueDate && t.completedAt);
  if (dated.length === 0) return null;
  const ok = dated.filter((t) => localDay(t.completedAt as string) <= (t.dueDate as string).slice(0, 10)).length;
  return Math.round((ok / dated.length) * 100);
}

export function completionStats(tasks: TaskWithProject[], now: Date = new Date()): CompletionStats {
  const today = ymd(now);
  const monthStart = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
  const prevStart = ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const done = tasks.filter((t) => t.status === "done" && t.completedAt);
  const thisMonth = done.filter((t) => localDay(t.completedAt as string) >= monthStart);
  const prevMonth = done.filter((t) => {
    const d = localDay(t.completedAt as string);
    return d >= prevStart && d < monthStart;
  });

  const series: number[] = [];
  let running = 0;
  for (let day = 1; day <= now.getDate(); day++) {
    const key = ymd(new Date(now.getFullYear(), now.getMonth(), day));
    running += thisMonth.filter((t) => localDay(t.completedAt as string) === key).length;
    series.push(running);
  }

  return {
    completed: thisMonth.length,
    completedPrev: prevMonth.length,
    onTime: onTimeRate(thisMonth),
    onTimePrev: onTimeRate(prevMonth),
    overdueOpen: tasks.filter((t) => isOverdue(t, today)).length,
    series,
  };
}

export type ProjectHealth = { kind: "ok" | "warn" | "bad" | "plain"; es: string; en: string };

/** One status per project, from its own tasks and due date. */
export function projectHealth(project: WorkProject, overdueTasks: number, today: string): ProjectHealth {
  if (project.status === "completed") return { kind: "ok", es: "Completado", en: "Completed" };
  if (project.status === "archived") return { kind: "plain", es: "Archivado", en: "Archived" };
  if (project.status === "on_hold") return { kind: "plain", es: "En pausa", en: "On hold" };
  if (project.status === "planning") return { kind: "plain", es: "Planeación", en: "Planning" };
  if (project.dueDate && project.dueDate.slice(0, 10) < today) {
    const days = Math.round((Date.parse(`${today}T12:00:00`) - Date.parse(`${project.dueDate.slice(0, 10)}T12:00:00`)) / 86_400_000);
    return { kind: "bad", es: `Atrasado ${days} ${days === 1 ? "día" : "días"}`, en: `${days} ${days === 1 ? "day" : "days"} late` };
  }
  if (overdueTasks > 0) {
    return { kind: "warn", es: `${overdueTasks} ${overdueTasks === 1 ? "tarea vencida" : "tareas vencidas"}`, en: `${overdueTasks} overdue ${overdueTasks === 1 ? "task" : "tasks"}` };
  }
  return { kind: "ok", es: "En tiempo", en: "On time" };
}

export const todayYMD = () => ymd(new Date());
