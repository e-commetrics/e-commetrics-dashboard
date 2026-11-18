"use client";

import { clientIdentity, identityVars } from "@/lib/client-identity";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CornerDownRight } from "lucide-react";
import { TASK_STATUS_META, useT } from "../lib/i18n";
import { isDone, type Task } from "../lib/types";

/** Tarea que el calendario sabe pintar: con el color y nombre de su proyecto. */
export type CalendarTask = Task & { projectName: string; projectColor: string };

const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" en hora local, sin desfases de zona horaria. */
function ymd(d: Date) {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Semanas (lunes a domingo) que cubren el mes de `month`. */
function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const start = new Date(first.getTime() - offset * DAY_MS);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const weeks = Math.ceil((offset + last.getDate()) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

const MAX_PER_DAY = 4;

/**
 * Calendario mensual de tareas por fecha de entrega.
 * - Clic en una tarea: abre el detalle.
 * - Arrastrar una tarea a otro dia: cambia su fecha (onReschedule).
 * - Las tareas sin fecha se listan aparte, y tambien se pueden arrastrar al calendario.
 */
export function CalendarView({
  tasks,
  onOpenTask,
  onReschedule,
  showProject,
}: {
  tasks: CalendarTask[];
  onOpenTask: (id: string) => void;
  onReschedule: (id: string, dueDate: string) => void;
  /** Mostrar el nombre del proyecto en cada tarea (vista de todos los proyectos). */
  showProject?: boolean;
}) {
  const { t, lang } = useT();
  const locale = lang === "es" ? "es-MX" : "en-US";
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = ymd(new Date());
  const days = useMemo(() => monthGrid(month), [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const key = task.dueDate.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    });
    map.forEach((list) => list.sort((a, b) => Number(isDone(a.status)) - Number(isDone(b.status)) || a.title.localeCompare(b.title)));
    return map;
  }, [tasks]);

  const undated = useMemo(() => tasks.filter((task) => !task.dueDate && !isDone(task.status)), [tasks]);
  const inMonth = useMemo(
    () => tasks.filter((task) => task.dueDate && task.dueDate.slice(0, 7) === ymd(month).slice(0, 7)).length,
    [tasks, month]
  );

  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "short" })),
    [locale]
  );
  const rawTitle = month.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  const drop = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/task-id");
    const from = e.dataTransfer.getData("text/task-date");
    if (id && from !== key) onReschedule(id, key);
  };

  const chip = (task: CalendarTask) => {
    const done = isDone(task.status);
    return (
      <button
        key={task.id}
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/task-id", task.id);
          e.dataTransfer.setData("text/task-date", task.dueDate?.slice(0, 10) ?? "");
          e.dataTransfer.effectAllowed = "move";
        }}
        onClick={() => onOpenTask(task.id)}
        className="ec-client"
        title={`${task.title}${showProject ? ` · ${task.projectName}` : ""} · ${TASK_STATUS_META[task.status][lang]}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          width: "100%",
          padding: "3px 6px",
          border: "none",
          ...identityVars(clientIdentity(task.projectName, { color: task.projectColor })),
          borderLeft: "3px solid var(--client)",
          borderRadius: 5,
          background: "var(--ec-surface-2)",
          color: done ? "var(--ec-text-faint)" : "var(--ec-text)",
          textDecoration: done ? "line-through" : "none",
          fontSize: 11.5,
          lineHeight: 1.3,
          textAlign: "left",
          cursor: "grab",
          minWidth: 0,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 99, flexShrink: 0, background: TASK_STATUS_META[task.status].color }} />
        {task.parentId ? <CornerDownRight size={10} style={{ flexShrink: 0, opacity: 0.6 }} /> : null}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
          {task.title}
          {showProject ? <span style={{ color: "var(--ec-text-faint)" }}> · {task.projectName}</span> : null}
        </span>
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="ec-btn-secondary" style={{ padding: "6px 10px" }} onClick={() => shift(-1)} aria-label={t("Mes anterior", "Previous month")}>
          <ChevronLeft size={15} />
        </button>
        <button type="button" className="ec-btn-secondary" style={{ padding: "6px 12px", fontSize: 12.5 }} onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
          {t("Hoy", "Today")}
        </button>
        <button type="button" className="ec-btn-secondary" style={{ padding: "6px 10px" }} onClick={() => shift(1)} aria-label={t("Mes siguiente", "Next month")}>
          <ChevronRight size={15} />
        </button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ec-text)" }}>{title}</h2>
        <span style={{ fontSize: 12.5, color: "var(--ec-text-muted)" }}>
          {t(`${inMonth} tareas este mes`, `${inMonth} tasks this month`)}
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(110px, 1fr))",
            border: "1px solid var(--ec-hairline)",
            borderRadius: 12,
            overflow: "hidden",
            background: "var(--ec-surface-1)",
            minWidth: 770,
          }}
        >
          {weekdays.map((w) => (
            <div
              key={w}
              style={{
                padding: "8px 10px",
                fontSize: 11,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: "var(--ec-text-muted)",
                borderBottom: "1px solid var(--ec-hairline)",
              }}
            >
              {w}
            </div>
          ))}
          {days.map((d, i) => {
            const key = ymd(d);
            const list = byDay.get(key) ?? [];
            const outside = d.getMonth() !== month.getMonth();
            const isToday = key === today;
            const open = expanded === key;
            const visible = open ? list : list.slice(0, MAX_PER_DAY);
            return (
              <div
                key={key}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOver !== key) setDragOver(key);
                }}
                onDragLeave={() => setDragOver((k) => (k === key ? null : k))}
                onDrop={(e) => drop(e, key)}
                style={{
                  minHeight: 112,
                  padding: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  borderTop: i >= 7 ? "1px solid var(--ec-hairline)" : undefined,
                  borderLeft: i % 7 ? "1px solid var(--ec-hairline)" : undefined,
                  background: dragOver === key ? "var(--ec-brand-softer)" : outside ? "var(--ec-bg)" : undefined,
                  minWidth: 0,
                }}
              >
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
                  <span
                    style={{
                      fontSize: 12,
                      width: 22,
                      height: 22,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 99,
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? "var(--ec-brand-on)" : outside ? "var(--ec-text-faint)" : "var(--ec-text-muted)",
                      background: isToday ? "var(--ec-brand)" : undefined,
                    }}
                  >
                    {d.getDate()}
                  </span>
                </div>
                {visible.map(chip)}
                {list.length > MAX_PER_DAY ? (
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : key)}
                    style={{ border: "none", background: "none", padding: "2px 4px", fontSize: 11, color: "var(--ec-brand)", cursor: "pointer", textAlign: "left" }}
                  >
                    {open ? t("Ver menos", "Show less") : t(`+${list.length - MAX_PER_DAY} más`, `+${list.length - MAX_PER_DAY} more`)}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {undated.length ? (
        <section>
          <div className="h-eyebrow" style={{ marginBottom: 8 }}>
            {t("Sin fecha", "No due date")} · {undated.length}
            <span style={{ textTransform: "none", letterSpacing: 0, marginLeft: 8, color: "var(--ec-text-faint)" }}>
              {t("arrástralas a un día para asignarles fecha", "drag them onto a day to schedule")}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>{undated.map(chip)}</div>
        </section>
      ) : null}
    </div>
  );
}
