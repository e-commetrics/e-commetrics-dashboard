"use client";

import { ClientDot } from "@/components/client-identity";
import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Avatar } from "@/app/dashboard/workspace/components/shared";
import { useResource, useWorkspace, WorkspaceProvider } from "@/app/dashboard/workspace/lib/hooks";
import { PRIORITY_META, TASK_STATUS_META, useT } from "@/app/dashboard/workspace/lib/i18n";
import { packageName } from "@/app/dashboard/workspace/lib/packages";
import type { InboxItem, TaskWithProject } from "@/app/dashboard/workspace/lib/types";
import { progressPct } from "@/lib/apps";
import { completionStats, isOverdue, projectHealth, todayYMD, weeklyCompleted, workload } from "./stats";
import { Chart } from "@/components/charts";

const ws = (view: string) => `/dashboard/workspace?view=${view}`;
const taskHref = (t: { projectId: string; id: string }) => `/dashboard/workspace?view=project&id=${t.projectId}&task=${t.id}`;
const projectHref = (id: string) => `/dashboard/workspace?view=project&id=${id}`;

/** Team home: what needs me today, then how the projects are going. */
export function TeamHome() {
  return (
    <WorkspaceProvider>
      <Home />
    </WorkspaceProvider>
  );
}

function Home() {
  const { t, lang } = useT();
  const { user } = useAuth();
  const { meId, memberById } = useWorkspace();
  const locale = lang === "es" ? "es-MX" : "en-US";

  const myTasks = useResource("home:my-tasks", (api) => api.listMyTasks());
  const allTasks = useResource("home:tasks", (api) => api.listTasks());
  const inbox = useResource("home:inbox", (api) => api.listInbox());
  const wall = useResource("home:wall", (api) => api.listWall());
  const projects = useResource("home:projects", (api) => api.listProjects());

  const today = todayYMD();
  const in7 = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const mine = useMemo(() => (myTasks.data ?? []).filter((x) => x.status !== "done"), [myTasks.data]);
  const tasks = useMemo(() => allTasks.data ?? [], [allTasks.data]);
  const news = useMemo(() => (inbox.data ?? []).filter((i) => i.actorId !== meId), [inbox.data, meId]);

  const myOverdue = mine.filter((x) => isOverdue(x, today)).length;
  const dueToday = mine.filter((x) => x.dueDate?.slice(0, 10) === today).length;
  const unread = news.filter((i) => !i.read).length;
  const inReview = tasks.filter((x) => x.status === "review").length;

  const byDue = (a: TaskWithProject, b: TaskWithProject) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
  const deadlines = useMemo(
    () => tasks.filter((x) => x.status !== "done" && x.dueDate && x.dueDate.slice(0, 10) <= in7).sort(byDue).slice(0, 7),
    [tasks, in7]
  );
  const myNext = useMemo(() => [...mine].sort(byDue).slice(0, 6), [mine]);
  const stats = useMemo(() => completionStats(tasks), [tasks]);
  const weekly = useMemo(() => weeklyCompleted(tasks), [tasks]);
  const load = useMemo(() => workload(tasks, todayYMD()), [tasks]);
  const loadMax = Math.max(1, ...load.map((w) => w.open));
  const openProjects = useMemo(
    () => (projects.data ?? []).filter((p) => p.status !== "archived" && p.status !== "completed"),
    [projects.data]
  );
  const overdueByProject = useMemo(() => {
    const map = new Map<string, number>();
    tasks.filter((x) => isOverdue(x, today)).forEach((x) => map.set(x.projectId, (map.get(x.projectId) ?? 0) + 1));
    return map;
  }, [tasks, today]);
  const pinned = (wall.data ?? []).find((p) => p.pinned) ?? (wall.data ?? [])[0];

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0];
  const dateLabel = new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  const shortDay = (iso: string) => {
    const key = iso.slice(0, 10);
    if (key === today) return t("Hoy", "Today");
    return new Date(`${key}T12:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric" });
  };
  const fullDay = (iso: string | null) =>
    iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" }) : "—";

  const tiles = [
    { n: myOverdue, label: t("Mis tareas vencidas", "My overdue tasks"), hint: t("Empieza por aquí", "Start here"), zero: t("Nada vencido", "Nothing overdue"), color: "var(--ec-danger)", href: ws("my-tasks") },
    { n: dueToday, label: t("Vencen hoy", "Due today"), hint: t("Para cerrar hoy", "To close today"), zero: t("Nada para hoy", "Nothing due today"), color: "var(--ec-warning)", href: ws("my-tasks") },
    { n: unread, label: t("Sin leer en Bandeja", "Unread in Inbox"), hint: t("Cambios en tus tareas", "Changes on your tasks"), zero: t("Bandeja al día", "Inbox is clear"), color: "var(--ec-brand)", href: ws("inbox") },
    { n: inReview, label: t("En revisión", "In review"), hint: t("Esperan aprobación", "Waiting for approval"), zero: t("Nada por revisar", "Nothing to review"), color: "var(--ec-info)", href: ws("projects") },
  ];

  const describe = (i: InboxItem) => {
    const who = memberById(i.actorId)?.name.split(" ")[0] ?? "—";
    const status = (v: string | null) => (v && v in TASK_STATUS_META ? t(TASK_STATUS_META[v as keyof typeof TASK_STATUS_META].es, TASK_STATUS_META[v as keyof typeof TASK_STATUS_META].en) : "—");
    const what: Record<string, string> = {
      created: t("creó la tarea", "created the task"),
      assigned: i.to === meId ? t("te asignó", "assigned you") : t("asignó la tarea", "assigned the task"),
      unassigned: t("quitó una asignación", "removed an assignee"),
      status: `${t("movió a", "moved to")} ${status(i.to)}`,
      priority: t("cambió la prioridad", "changed the priority"),
      due_date: t("cambió la fecha de entrega", "changed the due date"),
      title: t("renombró la tarea", "renamed the task"),
      description: t("editó la descripción", "edited the description"),
      labels: t("cambió las etiquetas", "changed the labels"),
      comment: t("comentó", "commented"),
      subtask: t("agregó una subtarea", "added a subtask"),
      deleted: t("eliminó la tarea", "deleted the task"),
    };
    return `${who} ${what[i.kind] ?? i.kind}`;
  };

  return (
    <div className="ec-home">
      <div className="ec-home-head">
        <div>
          <div className="ec-home-eyebrow">{dateLabel}</div>
          <h1 className="ec-home-title">{firstName ? t(`Hola, ${firstName}`, `Hi, ${firstName}`) : t("Inicio", "Home")}</h1>
          <div className="ec-home-sub">
            {myOverdue + dueToday > 0
              ? t(`Tienes ${myOverdue + dueToday} ${myOverdue + dueToday === 1 ? "tarea que necesita" : "tareas que necesitan"} atención hoy.`, `${myOverdue + dueToday} ${myOverdue + dueToday === 1 ? "task needs" : "tasks need"} your attention today.`)
              : t("No tienes tareas vencidas ni para hoy.", "You have nothing overdue or due today.")}
          </div>
        </div>
        <div className="ec-home-actions">
          <Link className="ec-btn-secondary" href={ws("my-tasks")}>{t("Mis tareas", "My tasks")}</Link>
          <Link className="ec-btn-primary" href={ws("projects")}>{t("Abrir proyectos", "Open projects")}</Link>
        </div>
      </div>

      <div className="ec-tiles">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className={`ec-tile${tile.n === 0 ? " is-zero" : ""}`} style={{ ["--tile" as string]: tile.color }}>
            <small>{tile.label}</small>
            <b>{tile.n}</b>
            <em>{tile.n === 0 ? tile.zero : tile.hint}</em>
          </Link>
        ))}
      </div>

      <div className="ec-home-grid">
        <div className="ec-home-col">
          <section className="ec-hcard">
            <header>
              <h2>{t("Esta semana · entregas", "This week · deadlines")}</h2>
              <Link href={ws("calendar")}>{t("Abrir calendario", "Open calendar")}</Link>
            </header>
            {deadlines.length === 0 ? (
              <div className="ec-hempty">{allTasks.loading ? t("Cargando…", "Loading…") : t("Sin entregas en los próximos 7 días.", "No deadlines in the next 7 days.")}</div>
            ) : (
              deadlines.map((x) => {
                const late = isOverdue(x, today);
                return (
                  <Link key={x.id} href={taskHref(x)} className="ec-hrow">
                    <span className="ec-hrow-when" style={late ? { color: "var(--ec-danger)", fontWeight: 600 } : undefined}>{shortDay(x.dueDate as string)}</span>
                    <ClientDot name={x.projectName} color={x.projectColor} />
                    <span className="ec-hrow-main">
                      {x.title}
                      <small>{x.projectName}</small>
                    </span>
                    {late ? <span className="ec-pill ec-pill-bad">{t("Vencida", "Overdue")}</span> : x.status === "review" ? <span className="ec-pill ec-pill-info">{t("En revisión", "In review")}</span> : null}
                  </Link>
                );
              })
            )}
          </section>

          <section className="ec-hcard">
            <header>
              <h2>{t("Proyectos", "Projects")}</h2>
              <Link href={ws("projects")}>{t("Ver todos", "See all")}</Link>
            </header>
            {openProjects.length === 0 ? (
              <div className="ec-hempty">{projects.loading ? t("Cargando…", "Loading…") : t("No hay proyectos activos.", "No active projects.")}</div>
            ) : (
              <div className="ec-htable-wrap">
                <table className="ec-htable">
                  <thead>
                    <tr>
                      <th>{t("Proyecto", "Project")}</th>
                      <th>{t("Avance", "Progress")}</th>
                      <th>{t("Entrega", "Due")}</th>
                      <th>{t("Estado", "Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openProjects.map((p) => {
                      const health = projectHealth(p, overdueByProject.get(p.id) ?? 0, today);
                      const pct = progressPct(p.taskCounts);
                      return (
                        <tr key={p.id}>
                          <td>
                            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <ClientDot name={p.name} color={p.color} />
                              <span>
                                <Link href={projectHref(p.id)}>{p.name}</Link>
                                {packageName(p.packageId, lang) ? <small style={{ display: "block", color: "var(--ec-text-muted)", fontSize: 12 }}>{packageName(p.packageId, lang)}</small> : null}
                              </span>
                            </span>
                          </td>
                          <td>
                            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span className="ec-bar" role="img" aria-label={`${pct}%`}><i style={{ width: `${pct}%` }} /></span>
                              <span className="ec-num" style={{ fontSize: 12.5, color: "var(--ec-text-muted)", whiteSpace: "nowrap" }}>
                                {pct}% · {p.taskCounts.done}/{p.taskCounts.total}
                              </span>
                            </span>
                          </td>
                          <td className="ec-num" style={{ whiteSpace: "nowrap", color: "var(--ec-text-muted)" }}>{fullDay(p.dueDate)}</td>
                          <td><span className={`ec-pill ec-pill-${health.kind}`}>{t(health.es, health.en)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="ec-hcard">
            <header>
              <h2>{t("Este mes · avance de proyectos", "This month · project delivery")}</h2>
              <span>{new Date().toLocaleDateString(locale, { month: "long", year: "numeric" })}</span>
            </header>
            <div className="ec-kpis">
              <div className="ec-kpi">
                <small>{t("Tareas completadas", "Tasks completed")}</small>
                <b>{stats.completed}</b>
                <span>{stats.completedPrev} {t("el mes anterior", "last month")}</span>
                <Sparkline values={stats.series} />
              </div>
              <div className="ec-kpi">
                <small>{t("Entregadas a tiempo", "Delivered on time")}</small>
                <b>{stats.onTime === null ? "—" : `${stats.onTime}%`}</b>
                {stats.onTime !== null && stats.onTimePrev !== null ? (
                  <span>{stats.onTimePrev}% {t("el mes anterior", "last month")}</span>
                ) : (
                  <span>{t("De las tareas con fecha de entrega", "Of the tasks with a due date")}</span>
                )}
              </div>
              <div className="ec-kpi">
                <small>{t("Vencidas abiertas", "Open and overdue")}</small>
                <b>{stats.overdueOpen}</b>
                {stats.overdueOpen > 0 ? (
                  <span className="ec-pill ec-pill-bad" style={{ alignSelf: "flex-start", marginTop: 2 }}>
                    <span className="ec-glyph ec-glyph-bad" aria-hidden />
                    {t("Necesitan atención", "Need attention")}
                  </span>
                ) : (
                  <span>{t("En todos los proyectos, ahora", "Across all projects, right now")}</span>
                )}
              </div>
            </div>
            <div className="ec-analytics">
              <div>
                <h3>{t("Tareas completadas por semana", "Tasks completed per week")}</h3>
                <small>{t("Últimas 8 semanas, todos los proyectos", "Last 8 weeks, all projects")}</small>
                <Chart
                  type="bar"
                  height={170}
                  labels={weekly.starts.map((d) => d.toLocaleDateString(locale, { day: "numeric", month: "short" }))}
                  unit={t("tareas", "tasks")}
                  ariaLabel={t("Tareas completadas por semana", "Tasks completed per week")}
                  series={[{ name: t("Tareas", "Tasks"), values: weekly.values, color: "var(--ec-d2)" }]}
                />
              </div>
              <div>
                <h3>{t("Carga por persona", "Workload by person")}</h3>
                <small>{t("Tareas abiertas hoy", "Open tasks today")}</small>
                <div className="ec-legend">
                  <span><i style={{ background: "var(--ec-d2)" }} />{t("En plazo", "On time")}</span>
                  <span><i style={{ background: "var(--ec-danger)" }} />{t("Vencidas", "Overdue")}</span>
                </div>
                {load.length === 0 ? (
                  <div className="ec-hempty" style={{ padding: "18px 0" }}>{t("Nadie tiene tareas abiertas.", "Nobody has open tasks.")}</div>
                ) : (
                  <div className="ec-workload">
                    {load.slice(0, 8).map((w) => (
                      <div key={w.memberId} title={`${memberById(w.memberId)?.name ?? "—"}: ${w.open - w.overdue} ${t("en plazo", "on time")}, ${w.overdue} ${t("vencidas", "overdue")}`}>
                        <span>{memberById(w.memberId)?.name ?? "—"}</span>
                        <span className="ec-workload-track">
                          {w.open - w.overdue > 0 ? <i style={{ width: `${((w.open - w.overdue) / loadMax) * 100}%`, background: "var(--ec-d2)" }} /> : null}
                          {w.overdue > 0 ? <i style={{ width: `${(w.overdue / loadMax) * 100}%`, background: "var(--ec-danger)" }} /> : null}
                        </span>
                        <b className="ec-num">{w.open}</b>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="ec-home-col">
          <section className="ec-hcard">
            <header>
              <h2>{t("Mis tareas", "My tasks")}</h2>
              <Link href={ws("my-tasks")}>{t("Ver todas", "See all")} ({mine.length})</Link>
            </header>
            {myNext.length === 0 ? (
              <div className="ec-hempty">{myTasks.loading ? t("Cargando…", "Loading…") : t("No tienes tareas pendientes.", "You have no open tasks.")}</div>
            ) : (
              myNext.map((x) => {
                const late = isOverdue(x, today);
                return (
                  <Link key={x.id} href={taskHref(x)} className="ec-hrow">
                    <span className="ec-dot" style={{ background: PRIORITY_META[x.priority].color }} title={t(PRIORITY_META[x.priority].es, PRIORITY_META[x.priority].en)} />
                    <span className="ec-hrow-main">
                      {x.title}
                      <small>{x.projectName}</small>
                    </span>
                    {x.dueDate ? (
                      <span className={late ? "ec-pill ec-pill-bad" : "ec-num"} style={late ? undefined : { fontSize: 12, color: "var(--ec-text-muted)", whiteSpace: "nowrap" }}>
                        {late ? t("Vencida", "Overdue") : shortDay(x.dueDate)}
                      </span>
                    ) : null}
                  </Link>
                );
              })
            )}
          </section>

          <section className="ec-hcard">
            <header>
              <h2>{t("Bandeja", "Inbox")}</h2>
              <Link href={ws("inbox")}>{unread > 0 ? t(`${unread} sin leer`, `${unread} unread`) : t("Abrir", "Open")}</Link>
            </header>
            {news.length === 0 ? (
              <div className="ec-hempty">{inbox.loading ? t("Cargando…", "Loading…") : t("Sin novedades.", "Nothing new.")}</div>
            ) : (
              news.slice(0, 5).map((i) => (
                <Link key={i.id} href={i.kind === "deleted" ? ws("inbox") : taskHref({ projectId: i.projectId, id: i.parentTaskId ?? i.taskId })} className="ec-hrow">
                  {i.read ? <span style={{ width: 8, flexShrink: 0 }} /> : <span className="ec-unread" aria-label={t("Sin leer", "Unread")} />}
                  <span className="ec-hrow-main" style={i.read ? { color: "var(--ec-text-muted)" } : undefined}>
                    {describe(i)}
                    <small>{i.taskTitle} · {i.projectName}</small>
                  </span>
                </Link>
              ))
            )}
          </section>

          {pinned ? (
            <section className="ec-hcard">
              <header>
                <h2>{pinned.pinned ? t("Muro · fijado", "Wall · pinned") : t("Muro · lo último", "Wall · latest")}</h2>
                <Link href={ws("wall")}>{t("Ir al muro", "Open wall")}</Link>
              </header>
              <div className="ec-wallpost">
                <Avatar member={memberById(pinned.authorId)} size={30} />
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontWeight: 600 }}>{memberById(pinned.authorId)?.name ?? "—"}</strong>
                  <p style={{ marginTop: 3, color: "var(--ec-text-muted)", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{pinned.body}</p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  if (values.length < 2 || max === 0) return null;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(1)},${(30 - (v / max) * 26).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--ec-brand)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
