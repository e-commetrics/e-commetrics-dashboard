"use client";

import { CheckSquare, Link2, MessageSquare } from "lucide-react";
import type { Task } from "../lib/types";
import { PRIORITY_META, useT } from "../lib/i18n";
import { AvatarStack, DueDate, LabelList } from "./shared";

/** Tarjeta de tarea del tablero. Arrastrable con HTML5, como el pipeline del CRM. */
export function TaskCard({
  task,
  onOpen,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  task: Task;
  onOpen: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  dragging?: boolean;
}) {
  const { lang } = useT();
  const done = task.status === "done";
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const overdue = !done && !!task.dueDate && task.dueDate.slice(0, 10) < todayKey;
  // Franja lateral: rojo solo si esta vencida; si no, la prioridad (urgente/alta) o neutro.
  const stripe = overdue
    ? "var(--ec-danger)"
    : done
      ? "var(--ec-hairline-strong)"
      : task.priority === "urgent"
        ? "var(--ec-warning)"
        : task.priority === "high"
          ? "var(--ec-info)"
          : "var(--ec-hairline-strong)";
  const priority = PRIORITY_META[task.priority];
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={Boolean(onDragStart)}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{
        background: "var(--ec-surface-1)",
        border: "1px solid var(--ec-hairline-strong)",
        borderLeft: `3px solid ${stripe}`,
        borderRadius: 10,
        padding: "11px 12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 9,
        opacity: dragging ? 0.4 : 1,
        boxShadow: "var(--ec-shadow-sm)",
      }}
    >
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 500,
          lineHeight: 1.35,
          color: done ? "var(--ec-text-muted)" : "var(--ec-text)",
          textDecoration: done ? "line-through" : "none",
        }}
      >
        {task.title}
      </div>
      {task.labels?.length ? <LabelList labels={task.labels} small /> : null}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {!done && (task.priority === "urgent" || task.priority === "high") ? (
          <span style={{ fontSize: 12, color: "var(--ec-text-muted)", fontWeight: 500 }}>{priority[lang]}</span>
        ) : null}
        <DueDate date={task.dueDate} done={done} />
        {task.subtaskCounts.total > 0 ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ec-text-muted)" }}>
            <CheckSquare size={12} />
            {task.subtaskCounts.done}/{task.subtaskCounts.total}
          </span>
        ) : null}
        {task.commentCount > 0 ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ec-text-muted)" }}>
            <MessageSquare size={12} />
            {task.commentCount}
          </span>
        ) : null}
        {task.linkUrl ? (
          <a
            href={task.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={task.linkUrl}
            style={{ display: "inline-flex", alignItems: "center", color: "var(--ec-brand)" }}
          >
            <Link2 size={12} />
          </a>
        ) : null}
        <span style={{ marginLeft: "auto" }}>
          <AvatarStack ids={task.assigneeIds} max={3} size={22} />
        </span>
      </div>
    </div>
  );
}
