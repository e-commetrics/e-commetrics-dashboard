"use client";

import { ClientDot } from "@/components/client-identity";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { ErrorNotice, Loading, PageHeader } from "../../webapp/crm/components/ui";
import { CalendarView, type CalendarTask } from "../components/CalendarView";
import { useMutation, useResource, useWorkspace } from "../lib/hooks";
import { useT } from "../lib/i18n";
import { isDone } from "../lib/types";

/**
 * Calendario de todos los proyectos, con filtro por proyecto.
 * Usa listProjects + getProject, asi no necesita rutas nuevas en el backend.
 */
export function CalendarScreen({
  projectId,
  onSelectProject,
  onOpenTask,
}: {
  /** Proyecto filtrado (desde la URL), o null = todos. */
  projectId: string | null;
  onSelectProject: (id: string | null) => void;
  onOpenTask: (id: string) => void;
}) {
  const { t } = useT();
  const { meId } = useWorkspace();
  const [onlyMine, setOnlyMine] = useState(false);
  const [showDone, setShowDone] = useState(true);

  const data = useResource("calendar:all", async (api) => {
    const projects = (await api.listProjects()).filter((p) => p.status !== "archived");
    const details = await Promise.all(projects.map((p) => api.getProject(p.id)));
    return { projects, details };
  });

  const reschedule = useMutation((api, id: string, dueDate: string) => api.updateTask(id, { dueDate }), {
    onSuccess: () => toast.success(t("Fecha actualizada", "Due date updated")),
    onError: (m) => toast.error(m),
  });

  const projects = useMemo(() => data.data?.projects ?? [], [data.data]);
  const tasks = useMemo<CalendarTask[]>(() => {
    const all: CalendarTask[] = [];
    (data.data?.details ?? []).forEach(({ project, tasks: list }) => {
      if (projectId && project.id !== projectId) return;
      list.forEach((task) => all.push({ ...task, projectName: project.name, projectColor: project.color }));
    });
    return all
      .filter((task) => !onlyMine || task.assigneeIds.includes(meId))
      .filter((task) => showDone || !isDone(task.status));
  }, [data.data, projectId, onlyMine, showDone, meId]);

  const selected = projects.find((p) => p.id === projectId);

  return (
    <div style={{ padding: 28, minWidth: 0 }}>
      <PageHeader
        eyebrow={`⎯⎯⎯  ${t("ESPACIO DE TRABAJO", "WORKSPACE")}`}
        title={t("Calendario", "Calendar")}
        subtitle={selected ? selected.name : t("Todas las tareas de todos los proyectos, por fecha de entrega", "Every task across all projects, by due date")}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 18px", flexWrap: "wrap" }}>
        <select
          className="ec-field-input"
          style={{ width: 260, padding: "7px 12px", fontSize: 13 }}
          value={projectId ?? ""}
          onChange={(e) => onSelectProject(e.target.value || null)}
          aria-label={t("Proyecto", "Project")}
        >
          <option value="">{t("Todos los proyectos", "All projects")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <nav className="ec-segmented">
          <button type="button" className={!onlyMine ? "active" : ""} onClick={() => setOnlyMine(false)}>
            {t("Todos", "Everyone")}
          </button>
          <button type="button" className={onlyMine ? "active" : ""} onClick={() => setOnlyMine(true)}>
            {t("Asignadas a mí", "Assigned to me")}
          </button>
        </nav>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ec-text-muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          {t("Mostrar completadas", "Show done")}
        </label>
        {!projectId && projects.length ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginLeft: "auto" }}>
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProject(p.id)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "none", padding: 0, fontSize: 12, color: "var(--ec-text-muted)", cursor: "pointer" }}
              >
                <ClientDot name={p.name} color={p.color} size={9} square />
                {p.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {data.loading && !data.data ? <Loading /> : null}
      {data.error ? <ErrorNotice message={data.error} onRetry={data.reload} /> : null}
      {data.data ? (
        <CalendarView tasks={tasks} onOpenTask={onOpenTask} onReschedule={(id, d) => void reschedule.run(id, d)} showProject={!projectId} />
      ) : null}
    </div>
  );
}
