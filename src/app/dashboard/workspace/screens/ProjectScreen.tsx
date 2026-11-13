"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronDown, ChevronRight, ExternalLink, KanbanSquare, List, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { ErrorNotice, Loading } from "../../webapp/crm/components/ui";
import { CalendarView } from "../components/CalendarView";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { TaskCard } from "../components/TaskCard";
import { AvatarStack, CompleteToggle, DueDate, LabelChip, LabelList, PriorityFlag, ProgressBar, StatusDot } from "../components/shared";
import { useMutation, useResource, useWorkspace } from "../lib/hooks";
import { PROJECT_STATUS_META, TASK_STATUS_META, useT } from "../lib/i18n";
import { packageName } from "../lib/packages";
import { TASK_STATUSES, type Task, type TaskStatus } from "../lib/types";

type Mode = "board" | "list" | "calendar";

export function ProjectScreen({
  projectId,
  onBack,
  onOpenTask,
}: {
  projectId: string;
  onBack: () => void;
  onOpenTask: (id: string) => void;
}) {
  const { t, lang } = useT();
  const { isAdmin, meId, memberById } = useWorkspace();
  const detail = useResource(`project:${projectId}`, (api) => api.getProject(projectId));
  const [mode, setMode] = useState<Mode>("board");
  const [onlyMine, setOnlyMine] = useState(false);
  const [labelFilter, setLabelFilter] = useState<string>("");
  const [editing, setEditing] = useState(false);

  const move = useMutation((api, id: string, patch: { status?: TaskStatus; position?: number }) => api.updateTask(id, patch), {
    onError: (m) => toast.error(m),
  });
  const reschedule = useMutation((api, id: string, dueDate: string) => api.updateTask(id, { dueDate }), {
    onError: (m) => toast.error(m),
  });
  const create = useMutation(
    (api, input: { title: string; status: TaskStatus }) => api.createTask(projectId, { ...input, assigneeIds: [meId] }),
    { onError: (m) => toast.error(m) }
  );
  const removeProject = useMutation((api) => api.deleteProject(projectId), {
    onSuccess: () => {
      toast.success(t("Proyecto eliminado", "Project deleted"));
      onBack();
    },
    onError: (m) => toast.error(m),
  });

  const project = detail.data?.project;
  const allTasks = useMemo(() => detail.data?.tasks ?? [], [detail.data]);
  const topLevel = useMemo(
    () =>
      allTasks
        .filter((task) => task.parentId === null)
        .filter((task) => !onlyMine || task.assigneeIds.includes(meId))
        .filter((task) => !labelFilter || (task.labels ?? []).includes(labelFilter))
        .sort((a, b) => a.position - b.position),
    [allTasks, onlyMine, meId, labelFilter]
  );

  const projectLabels = Array.from(new Set(allTasks.flatMap((task) => task.labels ?? []))).sort((a, b) => a.localeCompare(b));

  if (detail.loading && !detail.data) return <Loading />;
  if (detail.error && !detail.data)
    return (
      <div style={{ padding: 28 }}>
        <ErrorNotice message={detail.error} onRetry={detail.reload} />
      </div>
    );
  if (!project) return null;

  const status = PROJECT_STATUS_META[project.status];
  const client = memberById(project.clientId);
  const owner = memberById(project.ownerId);
  const pkg = packageName(project.packageId, lang);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, flex: 1 }}>
      <div style={{ padding: "22px 28px 0" }}>
        <button
          type="button"
          onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--ec-text-muted)", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 12 }}
        >
          <ArrowLeft size={14} />
          {t("Proyectos", "Projects")}
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: project.color }} />
              <h1 className="ec-page-title" style={{ margin: 0 }}>
                {project.name}
              </h1>
              <span className={`ec-badge ${status.badge}`}>{status[lang]}</span>
              {pkg ? <span className="ec-badge ec-badge-neutral">📦 {pkg}</span> : null}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 13, color: "var(--ec-text-muted)", flexWrap: "wrap", alignItems: "center" }}>
              <span>
                {t("Cliente", "Client")}: <strong style={{ color: "var(--ec-text)", fontWeight: 500 }}>{client?.name ?? t("Interno", "Internal")}</strong>
              </span>
              {owner ? (
                <span>
                  {t("Responsable", "Owner")}: <strong style={{ color: "var(--ec-text)", fontWeight: 500 }}>{owner.name}</strong>
                </span>
              ) : null}
              {project.dueDate ? (
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  {t("Entrega", "Due")}: <DueDate date={project.dueDate} done={project.status === "completed"} />
                </span>
              ) : null}
              {project.clientProjectName ? (
                <Link href={`/dashboard/${project.clientProjectName}`} style={{ color: "var(--ec-brand)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {t("Página del cliente", "Client page")} <ExternalLink size={12} />
                </Link>
              ) : null}
            </div>
            {project.description ? (
              <p style={{ fontSize: 13.5, color: "var(--ec-text-muted)", marginTop: 8, maxWidth: "70ch" }}>{project.description}</p>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, minWidth: 220 }}>
            <AvatarStack ids={project.memberIds} max={6} size={28} />
            <div style={{ width: 220 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ec-text-muted)", marginBottom: 5 }}>
                <span>{t("Avance", "Progress")}</span>
                <span>
                  {project.taskCounts.done}/{project.taskCounts.total}
                </span>
              </div>
              <ProgressBar done={project.taskCounts.done} total={project.taskCounts.total} color={project.color} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 16px", flexWrap: "wrap" }}>
          <nav className="ec-segmented">
            <button type="button" className={mode === "board" ? "active" : ""} onClick={() => setMode("board")} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <KanbanSquare size={13} /> {t("Tablero", "Board")}
            </button>
            <button type="button" className={mode === "list" ? "active" : ""} onClick={() => setMode("list")} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <List size={13} /> {t("Lista", "List")}
            </button>
            <button type="button" className={mode === "calendar" ? "active" : ""} onClick={() => setMode("calendar")} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <CalendarDays size={13} /> {t("Calendario", "Calendar")}
            </button>
          </nav>
          <nav className="ec-segmented">
            <button type="button" className={!onlyMine ? "active" : ""} onClick={() => setOnlyMine(false)}>
              {t("Todos", "Everyone")}
            </button>
            <button type="button" className={onlyMine ? "active" : ""} onClick={() => setOnlyMine(true)}>
              {t("Asignadas a mí", "Assigned to me")}
            </button>
          </nav>
          {projectLabels.length ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <select
                className="ec-field-input"
                style={{ width: 180, padding: "6px 10px", fontSize: 12.5 }}
                value={labelFilter}
                onChange={(e) => setLabelFilter(e.target.value)}
                aria-label={t("Filtrar por etiqueta", "Filter by label")}
              >
                <option value="">{t("Todas las etiquetas", "All labels")}</option>
                {projectLabels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              {labelFilter ? <LabelChip name={labelFilter} onRemove={() => setLabelFilter("")} /> : null}
            </div>
          ) : null}
          {isAdmin ? (
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button type="button" className="ec-btn-secondary" style={{ padding: "7px 13px", fontSize: 12.5 }} onClick={() => setEditing(true)}>
                <Pencil size={13} /> {t("Editar", "Edit")}
              </button>
              <button
                type="button"
                className="ec-btn-secondary"
                style={{ padding: "7px 13px", fontSize: 12.5, color: "var(--ec-danger)" }}
                onClick={() => {
                  if (window.confirm(t("¿Eliminar el proyecto y todas sus tareas?", "Delete the project and all its tasks?"))) void removeProject.run();
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {mode === "board" ? (
        <Board tasks={topLevel} onOpenTask={onOpenTask} onMove={(id, s) => void move.run(id, { status: s })} onCreate={(title, s) => create.run({ title, status: s })} />
      ) : mode === "calendar" ? (
        <div style={{ padding: "0 28px 28px" }}>
          <CalendarView
            tasks={allTasks
              .filter((task) => !onlyMine || task.assigneeIds.includes(meId))
              .filter((task) => !labelFilter || (task.labels ?? []).includes(labelFilter))
              .map((task) => ({ ...task, projectName: project.name, projectColor: project.color }))}
            onOpenTask={onOpenTask}
            onReschedule={(id, dueDate) => void reschedule.run(id, dueDate)}
          />
        </div>
      ) : (
        <ListView
          tasks={topLevel}
          allTasks={allTasks}
          onOpenTask={onOpenTask}
          onToggle={(task) => void move.run(task.id, { status: task.status === "done" ? "todo" : "done" })}
          onCreate={(title, s) => create.run({ title, status: s })}
        />
      )}

      {editing ? <ProjectFormModal project={project} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}

function Board({
  tasks,
  onOpenTask,
  onMove,
  onCreate,
}: {
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onCreate: (title: string, status: TaskStatus) => Promise<unknown>;
}) {
  const { lang } = useT();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);

  return (
    <div style={{ flex: 1, overflowX: "auto", padding: "0 28px 28px" }}>
      <div style={{ display: "flex", gap: 14, minWidth: "min-content", alignItems: "flex-start" }}>
        {TASK_STATUSES.map((s) => {
          const meta = TASK_STATUS_META[s];
          const inCol = tasks.filter((task) => task.status === s);
          return (
            <div
              key={s}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(s);
              }}
              onDragLeave={(e) => {
                const next = e.relatedTarget;
                if (next instanceof Node && e.currentTarget.contains(next)) return;
                setOver((cur) => (cur === s ? null : cur));
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const task = tasks.find((x) => x.id === dragId);
                setDragId(null);
                if (task && task.status !== s) onMove(task.id, s);
              }}
              style={{
                width: 280,
                flexShrink: 0,
                borderRadius: 12,
                background: over === s ? "var(--ec-brand-softer)" : "var(--ec-surface-2)",
                border: `1px solid ${over === s ? "var(--ec-brand)" : "transparent"}`,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 6px" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "#fff",
                    background: meta.color,
                    padding: "3px 9px",
                    borderRadius: 6,
                  }}
                >
                  {meta[lang]}
                </span>
                <span style={{ fontSize: 12, color: "var(--ec-text-muted)" }}>{inCol.length}</span>
              </div>
              {inCol.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  dragging={dragId === task.id}
                  onOpen={() => onOpenTask(task.id)}
                  onDragStart={() => setDragId(task.id)}
                  onDragEnd={() => setDragId(null)}
                />
              ))}
              <QuickAdd onCreate={(title) => onCreate(title, s)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickAdd({ onCreate, inline }: { onCreate: (title: string) => Promise<unknown>; inline?: boolean }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "var(--ec-text-muted)",
          fontSize: 13,
          padding: inline ? "8px 12px" : "6px 6px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        <Plus size={14} /> {t("Agregar tarea", "Add task")}
      </button>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const value = title.trim();
        if (!value) return;
        await onCreate(value);
        setTitle("");
      }}
      style={{ padding: inline ? "6px 12px" : 0 }}
    >
      <input
        autoFocus
        className="ec-field-input"
        style={{ fontSize: 13, padding: "8px 10px" }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => !title && setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={t("Nombre de la tarea y Enter", "Task name, then Enter")}
      />
    </form>
  );
}

function ListView({
  tasks,
  allTasks,
  onOpenTask,
  onToggle,
  onCreate,
}: {
  tasks: Task[];
  allTasks: Task[];
  onOpenTask: (id: string) => void;
  onToggle: (task: Task) => void;
  onCreate: (title: string, status: TaskStatus) => Promise<unknown>;
}) {
  const { t, lang } = useT();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<TaskStatus>>(new Set());
  const toggleExpand = (id: string) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const row = (task: Task, depth: number) => {
    const subs = depth === 0 ? allTasks.filter((x) => x.parentId === task.id).sort((a, b) => a.position - b.position) : [];
    const isOpen = expanded.has(task.id);
    return (
      <div key={task.id}>
        <div
          onClick={() => onOpenTask(task.id)}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 120px 110px 80px",
            alignItems: "center",
            gap: 12,
            padding: "9px 14px",
            paddingLeft: 14 + depth * 28,
            borderTop: "1px solid var(--ec-hairline)",
            cursor: "pointer",
            fontSize: 13.5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ width: 16, display: "inline-flex" }}>
              {subs.length > 0 ? (
                <button
                  type="button"
                  aria-label={isOpen ? t("Ocultar subtareas", "Hide subtasks") : t("Ver subtareas", "Show subtasks")}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(task.id);
                  }}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--ec-text-muted)", lineHeight: 0 }}
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : null}
            </span>
            <CompleteToggle done={task.status === "done"} onToggle={() => onToggle(task)} size={16} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textDecoration: task.status === "done" ? "line-through" : "none",
                color: task.status === "done" ? "var(--ec-text-muted)" : "var(--ec-text)",
              }}
            >
              {task.title}
            </span>
            {task.labels?.length ? <LabelList labels={task.labels} small /> : null}
            {subs.length > 0 ? (
              <span style={{ fontSize: 11.5, color: "var(--ec-text-muted)", flexShrink: 0 }}>
                {task.subtaskCounts.done}/{task.subtaskCounts.total}
              </span>
            ) : null}
          </div>
          <AvatarStack ids={task.assigneeIds} max={3} size={22} />
          <DueDate date={task.dueDate} done={task.status === "done"} />
          <PriorityFlag priority={task.priority} />
        </div>
        {isOpen ? subs.map((s) => row(s, 1)) : null}
      </div>
    );
  };

  return (
    <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
      {TASK_STATUSES.map((s) => {
        const meta = TASK_STATUS_META[s];
        const group = tasks.filter((task) => task.status === s);
        const isCollapsed = collapsed.has(s);
        return (
          <section key={s} style={{ border: "1px solid var(--ec-hairline-strong)", borderRadius: 12, background: "var(--ec-surface-1)", overflow: "hidden" }}>
            <button
              type="button"
              onClick={() =>
                setCollapsed((cur) => {
                  const next = new Set(cur);
                  if (next.has(s)) next.delete(s);
                  else next.add(s);
                  return next;
                })
              }
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", width: "100%", background: "none", border: "none", cursor: "pointer", color: "var(--ec-text)" }}
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <StatusDot status={s} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: meta.color }}>{meta[lang]}</span>
              <span style={{ fontSize: 12, color: "var(--ec-text-muted)" }}>{group.length}</span>
            </button>
            {!isCollapsed ? (
              <>
                {group.map((task) => row(task, 0))}
                <div style={{ borderTop: "1px solid var(--ec-hairline)" }}>
                  <QuickAdd inline onCreate={(title) => onCreate(title, s)} />
                </div>
              </>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
