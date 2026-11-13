"use client";

import { CheckSquare, MessageSquare } from "lucide-react";
import type { Task } from "../lib/types";
import { AvatarStack, DueDate, LabelList, PriorityFlag } from "./shared";

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
  const done = task.status === "done";
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
        <PriorityFlag priority={task.priority} />
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
        <span style={{ marginLeft: "auto" }}>
          <AvatarStack ids={task.assigneeIds} max={3} size={22} />
        </span>
      </div>
    </div>
  );
}
