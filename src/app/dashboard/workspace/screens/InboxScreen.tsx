"use client";

import { ClientDot } from "@/components/client-identity";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { CheckCheck, CornerDownRight } from "lucide-react";
import { EmptyState, ErrorNotice, Loading, PageHeader } from "../../webapp/crm/components/ui";
import { Avatar } from "../components/shared";
import { useMutation, useResource, useWorkspace } from "../lib/hooks";
import { PRIORITY_META, TASK_STATUS_META, useT } from "../lib/i18n";
import type { InboxItem, Priority, TaskStatus } from "../lib/types";

type Filter = "unread" | "all";

/**
 * Bandeja: que cambio en las tareas.
 * - Admin: ve la actividad de todo el equipo (y puede limitarla a sus tareas).
 * - Employee: solo cambios en tareas asignadas a el. El backend aplica la regla;
 *   esta pantalla solo la explica.
 * Por defecto oculta los cambios que hiciste tu.
 */
export function InboxScreen({ onOpenTask, onOpenWall }: { onOpenTask: (id: string) => void; onOpenWall: () => void }) {
  const { t, lang } = useT();
  const { isAdmin, meId, memberById } = useWorkspace();
  const inbox = useResource("inbox", (api) => api.listInbox());
  const [filter, setFilter] = useState<Filter>("unread");
  const [includeMine, setIncludeMine] = useState(false);
  const [scope, setScope] = useState<"team" | "mine">("team");
  const [now] = useState(() => Date.now());
  // Tareas asignadas a mi, para el filtro "Solo mis tareas" del admin.
  const myTasks = useResource(isAdmin ? "inbox:my-tasks" : "inbox:none", (api) => (isAdmin ? api.listMyTasks() : Promise.resolve([])));

  const markRead = useMutation((api, ids: string[] | "all") => api.markInboxRead(ids), { onError: (m) => toast.error(m) });

  const mineIds = useMemo(() => new Set((myTasks.data ?? []).map((x) => x.id)), [myTasks.data]);

  const items = useMemo(() => {
    return (inbox.data ?? [])
      .filter((i) => includeMine || i.actorId !== meId)
      .filter((i) => !isAdmin || scope === "team" || (i.taskId !== null && mineIds.has(i.taskId)) || ((i.kind.endsWith("assigned") || i.kind === "mention") && i.to === meId))
      .filter((i) => filter === "all" || !i.read);
  }, [inbox.data, includeMine, meId, isAdmin, scope, mineIds, filter]);

  const unread = useMemo(() => (inbox.data ?? []).filter((i) => !i.read && i.actorId !== meId).length, [inbox.data, meId]);

  const groups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = new Map<string, InboxItem[]>();
    items.forEach((i) => {
      const d = new Date(i.createdAt);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
      const label =
        diff === 0
          ? t("Hoy", "Today")
          : diff === 1
            ? t("Ayer", "Yesterday")
            : d.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { weekday: "long", day: "numeric", month: "long" });
      const list = map.get(label) ?? [];
      list.push(i);
      map.set(label, list);
    });
    return Array.from(map.entries());
  }, [items, t, lang]);

  const name = (id: string | null) => (id === meId ? t("ti", "you") : memberById(id)?.name ?? t("alguien", "someone"));
  const fmtDate = (v: string | null) =>
    v ? new Date(`${v.slice(0, 10)}T12:00:00`).toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { day: "numeric", month: "short" }) : t("sin fecha", "no date");
  const status = (v: string | null) => (v ? TASK_STATUS_META[v as TaskStatus]?.[lang] ?? v : "—");
  const prio = (v: string | null) => (v ? PRIORITY_META[v as Priority]?.[lang] ?? v : "—");

  /** Frase de la notificacion, sin el nombre de quien la hizo. */
  function describe(i: InboxItem): React.ReactNode {
    const b = (x: React.ReactNode) => <strong style={{ fontWeight: 600, color: "var(--ec-text)" }}>{x}</strong>;
    switch (i.kind) {
      case "created":
        return t("creó la tarea", "created the task");
      case "assigned":
        return i.to === meId ? b(t("te asignó", "assigned you")) : <>{t("asignó a", "assigned")} {b(name(i.to))}</>;
      case "unassigned":
        return i.to === meId ? b(t("te quitó de la tarea", "removed you")) : <>{t("quitó a", "removed")} {b(name(i.to))}</>;
      case "status":
        return <>{t("cambió el estado", "changed status")}: {status(i.from)} → {b(status(i.to))}</>;
      case "priority":
        return <>{t("cambió la prioridad", "changed priority")}: {prio(i.from)} → {b(prio(i.to))}</>;
      case "due_date":
        return <>{t("cambió la fecha de entrega", "changed the due date")}: {fmtDate(i.from)} → {b(fmtDate(i.to))}</>;
      case "title":
        return <>{t("renombró la tarea", "renamed the task")} {i.from ? <>({t("antes", "was")} “{i.from}”)</> : null}</>;
      case "description":
        return t("editó la descripción", "edited the description");
      case "labels":
        return <>{t("cambió las etiquetas", "changed labels")}: {i.from || "—"} → {b(i.to || "—")}</>;
      case "comment":
        return <>{t("comentó", "commented")}: “{i.to}”</>;
      case "subtask":
        return <>{t("agregó la subtarea", "added the subtask")} {b(i.to)}</>;
      case "deleted":
        return b(t("eliminó la tarea", "deleted the task"));
      case "mention":
        return <>{i.to === meId ? b(t("te mencionó en el muro", "mentioned you on the wall")) : <>{t("mencionó a", "mentioned")} {b(name(i.to))} {t("en el muro", "on the wall")}</>}: “{i.from}”</>;
      default:
        return i.kind;
    }
  }

  const ago = (iso: string) => {
    const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
    if (mins < 1) return t("ahora", "now");
    if (mins < 60) return `${mins} min`;
    const h = Math.round(mins / 60);
    if (h < 24) return `${h} h`;
    return new Date(iso).toLocaleTimeString(lang === "es" ? "es-MX" : "en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const open = (i: InboxItem) => {
    if (!i.read) void markRead.run([i.id]);
    if (i.kind === "mention") onOpenWall();
    else if (i.kind !== "deleted" && i.taskId) onOpenTask(i.taskId);
  };

  return (
    <div style={{ padding: 28, maxWidth: 1000 }}>
      <PageHeader
        eyebrow={`⎯⎯⎯  ${t("ESPACIO DE TRABAJO", "WORKSPACE")}`}
        title={t("Bandeja", "Inbox")}
        subtitle={
          isAdmin
            ? t(`Como admin ves los cambios de todo el equipo · ${unread} sin leer`, `As an admin you see changes across the team · ${unread} unread`)
            : t(`Cambios en las tareas asignadas a ti · ${unread} sin leer`, `Changes to tasks assigned to you · ${unread} unread`)
        }
        actions={
          <button
            type="button"
            className="ec-btn-secondary"
            style={{ padding: "7px 13px", fontSize: 12.5 }}
            disabled={unread === 0 || markRead.loading}
            onClick={() => void markRead.run("all")}
          >
            <CheckCheck size={14} /> {t("Marcar todo como leído", "Mark all as read")}
          </button>
        }
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 18px", flexWrap: "wrap" }}>
        <nav className="ec-segmented">
          <button type="button" className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>
            {t("Sin leer", "Unread")}
            {unread ? ` · ${unread}` : ""}
          </button>
          <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            {t("Todas", "All")}
          </button>
        </nav>
        {isAdmin ? (
          <nav className="ec-segmented">
            <button type="button" className={scope === "team" ? "active" : ""} onClick={() => setScope("team")}>
              {t("Todo el equipo", "Whole team")}
            </button>
            <button type="button" className={scope === "mine" ? "active" : ""} onClick={() => setScope("mine")}>
              {t("Solo mis tareas", "Only my tasks")}
            </button>
          </nav>
        ) : null}
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ec-text-muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={includeMine} onChange={(e) => setIncludeMine(e.target.checked)} />
          {t("Incluir mis cambios", "Include my changes")}
        </label>
      </div>

      {inbox.loading && !inbox.data ? <Loading /> : null}
      {inbox.error ? <ErrorNotice message={inbox.error} onRetry={inbox.reload} /> : null}
      {inbox.data && items.length === 0 ? (
        <EmptyState title={filter === "unread" ? t("Estás al día. 🎉", "You're all caught up. 🎉") : t("Sin actividad todavía.", "No activity yet.")} />
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {groups.map(([label, list]) => (
          <section key={label}>
            <div className="h-eyebrow" style={{ marginBottom: 8, textTransform: "capitalize" }}>
              {label} · {list.length}
            </div>
            <div style={{ border: "1px solid var(--ec-hairline)", borderRadius: 12, background: "var(--ec-surface-1)", overflow: "hidden" }}>
              {list.map((i, idx) => {
                const openable = { cursor: i.kind === "deleted" ? "default" : "pointer" } as const;
                return (
                <button
                  key={i.id}
                  type="button"
                  // Clic sobre texto ([data-open]) o teclado (detail 0) abre; clic en espacio vacio solo marca como leida.
                  onClick={(e) =>
                    e.detail === 0 || (e.target as HTMLElement).closest("[data-open]") ? open(i) : !i.read && void markRead.run([i.id])
                  }
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    width: "100%",
                    padding: "12px 14px",
                    border: "none",
                    borderTop: idx ? "1px solid var(--ec-hairline)" : "none",
                    background: i.read ? "transparent" : "var(--ec-brand-softer)",
                    textAlign: "left",
                    cursor: "default",
                    color: "var(--ec-text-muted)",
                  }}
                >
                  <span style={{ width: 8, paddingTop: 10, flexShrink: 0 }}>
                    {!i.read ? <span style={{ display: "block", width: 8, height: 8, borderRadius: 99, background: "var(--ec-brand-fill)" }} /> : null}
                  </span>
                  <Avatar member={memberById(i.actorId)} size={30} />
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                    <span data-open style={{ ...openable, display: "flex", alignItems: "center", gap: 6, minWidth: 0, maxWidth: "100%", color: "var(--ec-text)", fontWeight: 600, fontSize: 13.5 }}>
                      {i.parentTaskId ? <CornerDownRight size={12} style={{ flexShrink: 0, opacity: 0.6 }} /> : null}
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: i.kind === "deleted" ? "line-through" : "none" }}>
                        {i.taskTitle}
                      </span>
                    </span>
                    <span data-open style={{ ...openable, fontSize: 13, lineHeight: 1.45 }}>
                      <strong style={{ fontWeight: 600, color: "var(--ec-text)" }}>{memberById(i.actorId)?.name ?? "—"}</strong>{" "}
                      {describe(i)}
                    </span>
                    {i.projectName ? (
                      <span data-open style={{ ...openable, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <ClientDot name={i.projectName} color={i.projectColor} size={8} square />
                        {i.projectName}
                      </span>
                    ) : null}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ec-text-faint)", whiteSpace: "nowrap", paddingTop: 2 }}>{ago(i.createdAt)}</span>
                </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
