"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiCompleteTask } from "../lib/api";
import { useMutation, type Resource } from "../lib/hooks";
import { DAY_MS, formatDue, isDueWithin, isOverdue } from "../lib/format";
import type { Task } from "../lib/types";
import { EmptyState, ErrorNotice, Loading } from "./ui";

/**
 * Panel lateral de tareas. La version original solo enseñaba las que vencen hoy
 * o manana y ocultaba el resto sin decir nada; aqui se mantiene ese filtro
 * (es lo que se usa a diario) pero se dice explicitamente cuantas hay fuera.
 */
export function TasksPanel({
  tasks,
  leadNames,
  onOpenLead,
}: {
  tasks: Resource<Task[]>;
  leadNames: Map<string, string>;
  onOpenLead: (id: string) => void;
}) {
  const complete = useMutation((id: string) => apiCompleteTask(id), {
    onError: (message) => toast.error(message),
  });

  const open = (tasks.data ?? []).filter((task) => !task.done);
  const dueSoon = open.filter((task) => isDueWithin(task.dueAt, DAY_MS));
  const overdue = dueSoon.filter((task) => isOverdue(task.dueAt));
  const upcoming = dueSoon.filter((task) => !isOverdue(task.dueAt));
  const hiddenCount = open.length - dueSoon.length;

  const renderTask = (task: Task) => {
    const late = isOverdue(task.dueAt);
    const leadName = leadNames.get(task.leadId);
    return (
      <li key={task.id} className="crm-task">
        <input
          type="checkbox"
          checked={false}
          disabled={complete.loading}
          onChange={() => void complete.run(task.id)}
          aria-label={`Mark "${task.description}" as done`}
        />
        <button type="button" className="crm-task-open" onClick={() => onOpenLead(task.leadId)}>
          <span className="crm-task-text">{task.description}</span>
          <span className={late ? "crm-task-meta is-overdue" : "crm-task-meta"}>
            {leadName ? `${leadName} · ` : ""}
            {formatDue(task.dueAt)}
          </span>
        </button>
      </li>
    );
  };

  return (
    <aside className="crm-tasks-panel" aria-label="Tasks">
      <div className="crm-tasks-head">
        <h2 className="crm-tasks-title font-serif">Tasks</h2>
        <button type="button" className="crm-icon-btn" onClick={tasks.reload} aria-label="Refresh tasks">
          {complete.loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      {tasks.loading && !tasks.data ? <Loading label="Loading tasks…" /> : null}
      {tasks.error ? <ErrorNotice message={tasks.error} onRetry={tasks.reload} /> : null}

      {!tasks.loading && !tasks.error && dueSoon.length === 0 ? (
        <EmptyState title="Nothing due — nice." hint="Tasks come from the automation rules and from each lead." />
      ) : null}

      {overdue.length > 0 ? (
        <section className="crm-tasks-group">
          <h3 className="crm-tasks-group-title is-overdue">Overdue ({overdue.length})</h3>
          <ul className="crm-row-list">{overdue.map(renderTask)}</ul>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="crm-tasks-group">
          <h3 className="crm-tasks-group-title">Next 24 hours ({upcoming.length})</h3>
          <ul className="crm-row-list">{upcoming.map(renderTask)}</ul>
        </section>
      ) : null}

      {hiddenCount > 0 ? (
        <p className="crm-small" style={{ margin: 0 }}>
          {hiddenCount} more open {hiddenCount === 1 ? "task" : "tasks"} due later.
        </p>
      ) : null}
    </aside>
  );
}
