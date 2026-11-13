"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { EmptyState, ErrorNotice, Loading, PageHeader } from "../../webapp/crm/components/ui";
import { CompleteToggle, DueDate, PriorityFlag, StatusPill } from "../components/shared";
import { useMutation, useResource } from "../lib/hooks";
import { useT } from "../lib/i18n";
import type { TaskWithProject } from "../lib/types";

type Bucket = "overdue" | "today" | "week" | "later" | "none" | "done";

function bucketOf(task: TaskWithProject, today: number): Bucket {
  if (task.status === "done") return "done";
  if (!task.dueDate) return "none";
  const d = new Date(`${task.dueDate.slice(0, 10)}T00:00:00`).getTime();
  const diff = Math.round((d - today) / 86_400_000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "week";
  return "later";
}

/** "Mis tareas": todo lo asignado a mí en todos los proyectos, agrupado por fecha. */
export function MyTasksScreen({ onOpenTask, onOpenProject }: { onOpenTask: (id: string) => void; onOpenProject: (id: string) => void }) {
  const { t } = useT();
  const tasks = useResource("my-tasks", (api) => api.listMyTasks());
  const [showDone, setShowDone] = useState(false);
  const toggle = useMutation((api, task: TaskWithProject) => api.updateTask(task.id, { status: task.status === "done" ? "todo" : "done" }), {
    onError: (m) => toast.error(m),
  });

  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const groups = useMemo(() => {
    const map: Record<Bucket, TaskWithProject[]> = { overdue: [], today: [], week: [], later: [], none: [], done: [] };
    (tasks.data ?? []).forEach((task) => map[bucketOf(task, today)].push(task));
    Object.values(map).forEach((list) => list.sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9")));
    return map;
  }, [tasks.data, today]);

  const labels: Record<Bucket, string> = {
    overdue: t("Vencidas", "Overdue"),
    today: t("Hoy", "Today"),
    week: t("Próximos 7 días", "Next 7 days"),
    later: t("Más adelante", "Later"),
    none: t("Sin fecha", "No due date"),
    done: t("Completadas", "Done"),
  };
  const order: Bucket[] = showDone ? ["overdue", "today", "week", "later", "none", "done"] : ["overdue", "today", "week", "later", "none"];
  const open = (tasks.data ?? []).filter((x) => x.status !== "done").length;

  return (
    <div style={{ padding: 28, maxWidth: 1000 }}>
      <PageHeader
        eyebrow={`⎯⎯⎯  ${t("ESPACIO DE TRABAJO", "WORKSPACE")}`}
        title={t("Mis tareas", "My tasks")}
        subtitle={t(`${open} abiertas en todos tus proyectos`, `${open} open across all your projects`)}
        actions={
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ec-text-muted)", cursor: "pointer" }}>
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
            {t("Mostrar completadas", "Show done")}
          </label>
        }
      />
      {tasks.loading && !tasks.data ? <Loading /> : null}
      {tasks.error ? <ErrorNotice message={tasks.error} onRetry={tasks.reload} /> : null}
      {tasks.data && open === 0 && !showDone ? <EmptyState title={t("Nada pendiente. 🎉", "Nothing pending. 🎉")} /> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {order.map((b) =>
          groups[b].length === 0 ? null : (
            <section key={b}>
              <div className="h-eyebrow" style={{ marginBottom: 8, color: b === "overdue" ? "var(--ec-danger)" : undefined }}>
                {labels[b]} · {groups[b].length}
              </div>
              <div style={{ border: "1px solid var(--ec-hairline-strong)", borderRadius: 12, background: "var(--ec-surface-1)", overflow: "hidden" }}>
                {groups[b].map((task, i) => (
                  <div
                    key={task.id}
                    onClick={() => onOpenTask(task.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0,1fr) auto auto auto",
                      gap: 14,
                      alignItems: "center",
                      padding: "10px 14px",
                      borderTop: i === 0 ? "none" : "1px solid var(--ec-hairline)",
                      cursor: "pointer",
                    }}
                  >
                    <CompleteToggle done={task.status === "done"} onToggle={() => void toggle.run(task)} size={17} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: task.status === "done" ? "line-through" : "none" }}>
                        {task.parentId ? <span style={{ color: "var(--ec-text-muted)" }}>↳ </span> : null}
                        {task.title}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProject(task.projectId);
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, marginTop: 2, fontSize: 12, color: "var(--ec-text-muted)", cursor: "pointer" }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: task.projectColor }} />
                        {task.projectName}
                      </button>
                    </div>
                    <StatusPill status={task.status} />
                    <PriorityFlag priority={task.priority} />
                    <span style={{ width: 70, textAlign: "right" }}>
                      <DueDate date={task.dueDate} done={task.status === "done"} />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )
        )}
      </div>
    </div>
  );
}
