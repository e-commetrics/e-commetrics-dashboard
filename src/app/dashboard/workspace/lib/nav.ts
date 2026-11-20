"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Navegacion por query params, como el CRM: el build es un export estatico y
// los ids de proyecto/tarea no existen en el momento del build.
//   ?view=projects            lista de proyectos (por defecto)
//   ?view=project&id=P        tablero o lista de un proyecto
//   ?view=project&id=P&task=T con el detalle de una tarea abierto
//   ?view=calendar[&id=P]     calendario de todos los proyectos (o solo de P)
//   ?view=inbox               bandeja de notificaciones
//   ?view=crm[&id=P]           app CRM: lista de CRMs, o el CRM del proyecto P
//   ?view=my-tasks | wall | team

export const VIEWS = ["projects", "project", "inbox", "calendar", "my-tasks", "wall", "team", "crm"] as const;
export type WorkspaceView = (typeof VIEWS)[number];

const isView = (v: string | null): v is WorkspaceView => v !== null && (VIEWS as readonly string[]).includes(v);

export function useWorkspaceNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const raw = params.get("view");
  const view: WorkspaceView = isView(raw) ? raw : "projects";
  const projectId = view === "project" || view === "calendar" || view === "crm" ? params.get("id") : null;
  const taskId = params.get("task");

  const push = (search: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams();
    Object.entries(search).forEach(([k, v]) => v && next.set(k, v));
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return {
    view,
    projectId,
    taskId,
    go: (next: WorkspaceView) => push({ view: next }),
    goProject: (id: string) => push({ view: "project", id }),
    goCalendar: (id: string | null) => push({ view: "calendar", id }),
    goCrm: (id: string | null) => push({ view: "crm", id }),
    openTask: (id: string) => push({ view, id: projectId, task: id }),
    closeTask: () => push({ view, id: projectId }),
  };
}
