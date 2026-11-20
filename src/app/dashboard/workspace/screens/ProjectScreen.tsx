"use client";

import { ClientTile } from "@/components/client-identity";
import { Chart } from "@/components/charts";
import { isOverdue, projectHealth, todayYMD } from "@/components/home/stats";
import { HealthPill, useProjectIdentity } from "../components/ProjectCard";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronDown, ChevronRight, ExternalLink, KanbanSquare, List, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { ErrorNotice, Loading } from "../../webapp/crm/components/ui";
import { CalendarView } from "../components/CalendarView";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { TaskCard } from "../components/TaskCard";
import { AvatarStack, CompleteToggle, DueDate, LabelChip, LabelList, PriorityFlag, StatusDot } from "../components/shared";
import { useMutation, useResource, useWorkspace } from "../lib/hooks";
import { PRIORITY_META, PROJECT_STATUS_META, TASK_STATUS_META, useT } from "../lib/i18n";
import { activeShortcut, fold, parseQuickAdd, type QuickParse } from "../lib/quickadd";
import { employeesOf } from "../components/shared";
import { packageName } from "../lib/packages";
import { TASK_STATUSES, byPriority, isDone, type Task, type TaskInput, type TaskStatus } from "../lib/types";
import { ClientResults } from "@/components/home/ClientResults";
import { clientGroupFor, progressPct } from "@/lib/apps";

type Mode = "board" | "list" | "calendar";
type SortBy = "manual" | "priority";

const byPosition = (a: Task, b: Task) => a.position - b.position;

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
  const { isAdmin, meId, memberById, statusName } = useWorkspace();
  const detail = useResource(`project:${projectId}`, (api) => api.getProject(projectId));
  const [mode, setMode] = useState<Mode>("board");
  const [onlyMine, setOnlyMine] = useState(false);
  const [labelFilter, setLabelFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("manual");
  const compare = sortBy === "priority" ? byPriority : byPosition;
  const [editing, setEditing] = useState(false);

  const move = useMutation((api, id: string, patch: { status?: TaskStatus; stageId?: string | null; position?: number }) => api.updateTask(id, patch), {
    onError: (m) => toast.error(m),
  });
  const reschedule = useMutation((api, id: string, dueDate: string) => api.updateTask(id, { dueDate }), {
    onError: (m) => toast.error(m),
  });
  // Sin "+persona" en el título, la tarea queda asignada a quien la crea.
  const create = useMutation(
    (api, input: TaskInput) =>
      api.createTask(projectId, { ...input, assigneeIds: input.assigneeIds?.length ? input.assigneeIds : [meId] }),
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
        .sort(compare),
    [allTasks, onlyMine, meId, labelFilter, compare]
  );

  // Weekly burn-up from the tasks themselves: done by that date against tasks that existed by that date.
  const burn = useMemo(() => {
    const top = allTasks.filter((task) => task.parentId === null);
    const start = project?.startDate ?? project?.createdAt ?? null;
    const labels: string[] = [];
    const done: number[] = [];
    const total: number[] = [];
    if (!start) return { labels, done, total };
    const end = new Date();
    const first = new Date(`${start.slice(0, 10)}T12:00:00`);
    const weeks = Math.max(1, Math.min(12, Math.ceil((end.getTime() - first.getTime()) / (7 * 86_400_000))));
    for (let i = weeks; i >= 0; i--) {
      const day = new Date(end.getTime() - i * 7 * 86_400_000);
      const key = day.toISOString();
      labels.push(day.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { day: "numeric", month: "short" }));
      total.push(top.filter((task) => task.createdAt <= key).length);
      done.push(top.filter((task) => task.completedAt && task.completedAt <= key).length);
    }
    return { labels, done, total };
  }, [allTasks, project?.startDate, project?.createdAt, lang]);

  const { client, identity } = useProjectIdentity(project ?? { name: "", color: "", clientId: null });

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
  const owner = memberById(project.ownerId);
  const pkg = packageName(project.packageId, lang);
  const clientGroup = clientGroupFor(project.name, project.clientProjectName, client?.name);
  const today = todayYMD();
  const openTop = allTasks.filter((task) => task.parentId === null && !isDone(task.status));
  const overdueCount = openTop.filter((task) => isOverdue(task, today)).length;
  const nextDue = openTop
    .filter((task) => task.dueDate && task.dueDate.slice(0, 10) >= today)
    .sort((x, y) => (x.dueDate as string).localeCompare(y.dueDate as string))[0];

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

        {/* Workbench header: compact on purpose. The work below is what matters here. */}
        <div className="ec-wb-head">
          <ClientTile identity={identity} size={36} />
          <div style={{ minWidth: 0, flex: "1 1 280px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 className="ec-wb-title">{project.name}</h1>
              <span className={`ec-badge ${status.badge}`}>{statusName(project.status, lang)}</span>
              {pkg ? <span className="ec-badge ec-badge-neutral">{pkg}</span> : null}
            </div>
            <div className="ec-wb-meta">
              <span>
                {t("Cliente", "Client")}: <strong>{client?.name ?? t("Interno", "Internal")}</strong>
              </span>
              {owner ? (
                <span>
                  {t("Responsable", "Owner")}: <strong>{owner.name}</strong>
                </span>
              ) : null}
              {project.dueDate ? (
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  {t("Entrega", "Due")}: <DueDate date={project.dueDate} done={project.status === "completed"} />
                </span>
              ) : null}
              {project.stages?.length ? (
                <Link href={`/dashboard/workspace?view=crm&id=${project.id}`} style={{ color: "var(--ec-brand)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                  {t("Abrir CRM", "Open CRM")} <KanbanSquare size={12} />
                </Link>
              ) : null}
              {project.clientProjectName ? (
                <Link href={`/dashboard/${project.clientProjectName}`} style={{ color: "var(--ec-brand)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                  {t("Página del cliente", "Client page")} <ExternalLink size={12} />
                </Link>
              ) : null}
            </div>
          </div>
          <div className="ec-wb-pulse">
            <span className="ec-num">
              <strong>
                {project.taskCounts.done} / {project.taskCounts.total}
              </strong>{" "}
              {t("hechas", "done")} · {progressPct(project.taskCounts)}%
            </span>
            <span className="ec-bar" role="img" aria-label={`${progressPct(project.taskCounts)}%`} style={{ width: 120, flex: "none", minWidth: 0 }}>
              <i style={{ width: `${progressPct(project.taskCounts)}%` }} />
            </span>
            <HealthPill health={projectHealth(project, overdueCount, todayYMD())} />
            {nextDue ? (
              <span>
                {t("Próxima entrega", "Next delivery")}: <strong>{nextDue.title}</strong>
              </span>
            ) : null}
            <AvatarStack ids={project.memberIds} max={5} size={26} />
          </div>
        </div>
        {project.description ? <p style={{ fontSize: 13, color: "var(--ec-text-muted)", marginTop: 8, maxWidth: "80ch" }}>{project.description}</p> : null}

        {/* Analytics stay one click away so they inform without taking room from the tasks. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          <details className="ec-wb-details">
            <summary>{t("Avance del proyecto", "Project progress")}</summary>
            <div style={{ padding: "4px 14px 12px", maxWidth: 720 }}>
              <Chart
                type="line"
                height={170}
                labels={burn.labels}
                ariaLabel={t("Tareas hechas frente al total planeado, por semana", "Tasks done against total planned, by week")}
                series={[
                  { name: t("Hechas", "Done"), values: burn.done, color: "var(--ec-d1)" },
                  { name: t("Total planeado", "Total planned"), values: burn.total, color: "var(--ec-text-dim)", dashed: true },
                ]}
              />
            </div>
          </details>
          {clientGroup ? (
            <details className="ec-wb-details">
              <summary>{t("Resultados del cliente", "Client results")}</summary>
              <div style={{ padding: "4px 14px 14px" }}>
                <ClientResults group={clientGroup} />
              </div>
            </details>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0 12px", flexWrap: "wrap" }}>
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
          {mode !== "calendar" ? (
            <select
              className="ec-field-input"
              style={{ width: 190, padding: "6px 10px", fontSize: 12.5 }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              aria-label={t("Ordenar tareas", "Sort tasks")}
            >
              <option value="manual">{t("Orden: manual", "Sort: manual")}</option>
              <option value="priority">{t("Orden: prioridad", "Sort: priority")}</option>
            </select>
          ) : null}
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
        <Board
          tasks={topLevel}
          onOpenTask={onOpenTask}
          // Todos los tableros son por estado; las etapas viven en la app CRM.
          columns={TASK_STATUSES.map((s) => ({
                  key: s,
                  name: TASK_STATUS_META[s][lang],
                  color: TASK_STATUS_META[s].color,
                  match: (task: Task) => task.status === s,
                  onDrop: (task: Task) => void move.run(task.id, { status: s }),
                  onCreate: (draft: QuickDraft) => create.run({ ...draft, status: s }),
                }))
          }
        />
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
          compare={compare}
          onOpenTask={onOpenTask}
          onToggle={(task) => void move.run(task.id, { status: isDone(task.status) ? "todo" : "done" })}
          onCreate={(draft, s) => create.run({ ...draft, status: s })}
        />
      )}

      {editing ? <ProjectFormModal project={project} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}


type BoardColumn = {
  key: string;
  name: string;
  color: string;
  match: (task: Task) => boolean;
  onDrop: (task: Task) => void;
  onCreate: (draft: QuickDraft) => Promise<unknown>;
};

/** Columnas por estado (por defecto) o por etapa del proyecto; ProjectScreen decide cuáles. */
function Board({ tasks, columns, onOpenTask }: { tasks: Task[]; columns: BoardColumn[]; onOpenTask: (id: string) => void }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  return (
    <div style={{ flex: 1, overflowX: "auto", padding: "0 28px 28px" }}>
      <div style={{ display: "flex", gap: 10, minWidth: "min-content", alignItems: "flex-start" }}>
        {columns.map((col) => {
          const s = col.key;
          const inCol = tasks.filter(col.match);
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
                if (task && !col.match(task)) col.onDrop(task);
              }}
              style={{
                width: 268,
                flexShrink: 0,
                borderRadius: 10,
                background: over === s ? "var(--ec-brand-softer)" : "var(--ec-surface-2)",
                border: `1px solid ${over === s ? "var(--ec-brand)" : "transparent"}`,
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 6px" }}>
                {/* Columnas neutras: el color queda para lo que necesita atencion (vencidas). */}
                <span style={{ width: 9, height: 9, borderRadius: 3, background: col.color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ec-text)" }}>{col.name}</span>
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
              <QuickAdd onCreate={col.onCreate} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Lo que sale de "Agregar tarea": el título ya sin atajos, más lo que estos indicaron. */
type QuickDraft = Omit<QuickParse, "dueDate"> & { dueDate?: string; linkUrl: string | null };

function QuickAdd({
  onCreate,
  inline,
}: {
  onCreate: (draft: QuickDraft) => Promise<unknown>;
  inline?: boolean;
}) {
  const { t, lang } = useT();
  const { members, memberById } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [caret, setCaret] = useState(0);
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const labelList = useResource("labels", (api) => api.listLabels());
  const staff = employeesOf(members);
  const labels = labelList.data ?? [];
  // Atajos estilo Todoist (lib/quickadd.ts): p1..p4, fechas, @label, +persona.
  const parsed = parseQuickAdd(title, { today: new Date(), labels, members: staff });
  const shortcut = activeShortcut(title, caret);
  const suggestions = !shortcut
    ? []
    : shortcut.sigil === "@"
      ? labels.filter((l) => !/\s/.test(l) && fold(l).startsWith(fold(shortcut.query))).slice(0, 5)
      : staff.filter((m) => fold(m.name).startsWith(fold(shortcut.query))).map((m) => m.name.split(/\s+/)[0]).slice(0, 5);
  const pick = (value: string) => {
    if (!shortcut) return;
    const token = `${shortcut.sigil}${value} `;
    const next = title.slice(0, shortcut.start) + token + title.slice(caret);
    setTitle(next);
    setCaret(shortcut.start + token.length);
  };
  const chips = [
    parsed.dueDate ? `📅 ${new Date(`${parsed.dueDate}T00:00:00`).toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { weekday: "short", day: "numeric", month: "short" })}` : null,
    parsed.priority ? `⚑ ${PRIORITY_META[parsed.priority][lang]}` : null,
    ...parsed.labels.map((l) => `🏷 ${l}`),
    ...parsed.assigneeIds.map((id) => `👤 ${memberById(id)?.name ?? id}`),
  ].filter(Boolean) as string[];
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
        if (!parsed.title.trim() || saving) return;
        setSaving(true);
        const created = await onCreate({ ...parsed, title: parsed.title.trim(), linkUrl: linkUrl.trim() || null });
        setSaving(false);
        // useMutation devuelve null si falló: se conserva lo escrito.
        if (created === null) return;
        setTitle("");
        setLinkUrl("");
      }}
      style={{ padding: inline ? "6px 12px" : 0, display: "flex", flexDirection: "column", gap: 6 }}
    >
      <input
        autoFocus
        className="ec-field-input"
        style={{ fontSize: 13, padding: "8px 10px" }}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setCaret(e.target.selectionStart ?? e.target.value.length);
        }}
        onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={t("Tarea · p1 mañana @label +persona", "Task · p1 tomorrow @label +person")}
        aria-describedby={chips.length ? "quickadd-preview" : undefined}
      />
      {suggestions.length ? (
        <div role="group" aria-label={t("Sugerencias", "Suggestions")} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {suggestions.map((s) => (
            <button key={s} type="button" className="ec-btn-secondary" style={{ padding: "2px 8px", fontSize: 12 }} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}>
              {shortcut?.sigil}
              {s}
            </button>
          ))}
        </div>
      ) : null}
      {chips.length ? (
        <div id="quickadd-preview" aria-live="polite" style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 12, color: "var(--ec-text)" }}>
          {chips.map((c) => (
            <span key={c} style={{ padding: "2px 8px", borderRadius: 99, background: "var(--ec-surface-2)", border: "1px solid var(--ec-hairline)" }}>
              {c}
            </span>
          ))}
        </div>
      ) : null}
      <input
        type="text"
        inputMode="url"
        className="ec-field-input"
        style={{ fontSize: 12, padding: "6px 10px" }}
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={t("Link (opcional)", "Link (optional)")}
        aria-label={t("Link de la tarea", "Task link")}
      />
      {/* Con dos campos el navegador no envía con Enter si no hay botón de envío. */}
      <div style={{ display: "flex", gap: 6 }}>
        <button type="submit" className="ec-btn-primary" style={{ padding: "6px 12px", fontSize: 12.5 }} disabled={saving || !parsed.title.trim()}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          {t("Agregar", "Add")}
        </button>
        <button type="button" className="ec-btn-secondary" style={{ padding: "6px 12px", fontSize: 12.5 }} onClick={() => setOpen(false)}>
          {t("Cancelar", "Cancel")}
        </button>
      </div>
    </form>
  );
}

function ListView({
  tasks,
  allTasks,
  compare,
  onOpenTask,
  onToggle,
  onCreate,
}: {
  tasks: Task[];
  allTasks: Task[];
  compare: (a: Task, b: Task) => number;
  onOpenTask: (id: string) => void;
  onToggle: (task: Task) => void;
  onCreate: (draft: QuickDraft, status: TaskStatus) => Promise<unknown>;
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
    const subs = depth === 0 ? allTasks.filter((x) => x.parentId === task.id).sort(compare) : [];
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
            <CompleteToggle done={isDone(task.status)} onToggle={() => onToggle(task)} size={16} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textDecoration: isDone(task.status) ? "line-through" : "none",
                color: isDone(task.status) ? "var(--ec-text-muted)" : "var(--ec-text)",
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
          <DueDate date={task.dueDate} done={isDone(task.status)} />
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
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ec-text)" }}>{meta[lang]}</span>
              <span style={{ fontSize: 12, color: "var(--ec-text-muted)" }}>{group.length}</span>
            </button>
            {!isCollapsed ? (
              <>
                {group.map((task) => row(task, 0))}
                <div style={{ borderTop: "1px solid var(--ec-hairline)" }}>
                  <QuickAdd inline onCreate={(draft) => onCreate(draft, s)} />
                </div>
              </>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
