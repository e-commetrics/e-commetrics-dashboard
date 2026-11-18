"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Loading, Modal, ErrorNotice } from "../../webapp/crm/components/ui";
import { useMutation, useResource, useWorkspace } from "../lib/hooks";
import { PRIORITY_META, TASK_STATUS_META, useT } from "../lib/i18n";
import { PRIORITIES, TASK_STATUSES, isDone, openSubtaskCount, type Member, type Task, type TaskPatch } from "../lib/types";
import { Avatar, CompleteToggle, LabelPicker, MemberPicker, StatusDot, employeesOf } from "./shared";

/**
 * Detalle de una tarea: propiedades, descripcion, subtareas y comentarios.
 * Los cambios se guardan al momento (al salir del campo en textos), como ClickUp.
 */
export function TaskDetailModal({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { t, lang } = useT();
  const { members, memberById } = useWorkspace();
  const detail = useResource(`task:${taskId}`, (api) => api.getTask(taskId));
  const labels = useResource("labels", (api) => api.listLabels());

  const update = useMutation((api, id: string, patch: TaskPatch) => api.updateTask(id, patch), {
    onError: (m) => toast.error(m),
  });
  const remove = useMutation((api, id: string) => api.deleteTask(id), {
    onSuccess: () => {
      toast.success(t("Tarea eliminada", "Task deleted"));
      onClose();
    },
    onError: (m) => toast.error(m),
  });
  const addSub = useMutation(
    (api, projectId: string, parentId: string, title: string) => api.createTask(projectId, { title, parentId }),
    { onError: (m) => toast.error(m) }
  );
  const comment = useMutation((api, id: string, body: string) => api.addTaskComment(id, body), {
    onError: (m) => toast.error(m),
  });

  const [newSub, setNewSub] = useState("");
  const [newComment, setNewComment] = useState("");

  const task = detail.data?.task;
  const pool = employeesOf(members);

  return (
    <Modal open onOpenChange={(open) => !open && onClose()} title={task?.parentId ? t("Subtarea", "Subtask") : t("Tarea", "Task")} width={760}>
      {detail.loading && !detail.data ? <Loading /> : null}
      {detail.error && !detail.data ? <ErrorNotice message={detail.error} onRetry={detail.reload} /> : null}
      {task ? (
        <TaskBody
          key={task.id}
          task={task}
          subtasks={detail.data?.subtasks ?? []}
          comments={detail.data?.comments ?? []}
          pool={pool}
          labelSuggestions={labels.data ?? []}
          memberById={memberById}
          lang={lang}
          t={t}
          onPatch={(patch) => void update.run(task.id, patch)}
          onPatchSub={(id, patch) => void update.run(id, patch)}
          onDelete={() => {
            if (window.confirm(t("¿Eliminar esta tarea y sus subtareas?", "Delete this task and its subtasks?"))) {
              void remove.run(task.id);
            }
          }}
          deleting={remove.loading}
          newSub={newSub}
          setNewSub={setNewSub}
          onAddSub={async () => {
            const title = newSub.trim();
            if (!title) return;
            const created = await addSub.run(task.projectId, task.id, title);
            if (created) setNewSub("");
          }}
          addingSub={addSub.loading}
          newComment={newComment}
          setNewComment={setNewComment}
          onComment={async () => {
            const body = newComment.trim();
            if (!body) return;
            const created = await comment.run(task.id, body);
            if (created) setNewComment("");
          }}
          commenting={comment.loading}
        />
      ) : null}
    </Modal>
  );
}

function TaskBody(props: {
  task: Task;
  subtasks: Task[];
  comments: { id: string; authorId: string; body: string; createdAt: string }[];
  pool: Member[];
  labelSuggestions: string[];
  memberById: (id: string) => Member | undefined;
  lang: "es" | "en";
  t: (es: string, en: string) => string;
  onPatch: (patch: TaskPatch) => void;
  onPatchSub: (id: string, patch: TaskPatch) => void;
  onDelete: () => void;
  deleting: boolean;
  newSub: string;
  setNewSub: (v: string) => void;
  onAddSub: () => void;
  addingSub: boolean;
  newComment: string;
  setNewComment: (v: string) => void;
  onComment: () => void;
  commenting: boolean;
}) {
  const { task, subtasks, comments, pool, memberById, lang, t, onPatch } = props;
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [linkUrl, setLinkUrl] = useState(task.linkUrl ?? "");
  const isSubtask = task.parentId !== null;
  // Con subtareas abiertas no se puede pasar a un estado terminado (el backend tambien lo rechaza).
  const openSubs = isSubtask || isDone(task.status) ? 0 : openSubtaskCount(subtasks);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <input
        className="ec-field-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== task.title && onPatch({ title: title.trim() })}
        aria-label={t("Título", "Title")}
        style={{ fontSize: 17, fontWeight: 600 }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        <Prop label={t("Estado", "Status")}>
          <select
            className="ec-field-input"
            value={task.status}
            onChange={(e) => onPatch({ status: e.target.value as Task["status"] })}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s} disabled={openSubs > 0 && isDone(s)}>
                {TASK_STATUS_META[s][lang]}
              </option>
            ))}
          </select>
          {openSubs > 0 ? (
            <div style={{ fontSize: 11.5, color: "var(--ec-text-muted)", marginTop: 4 }}>
              {t(`Termina las ${openSubs} subtareas pendientes para completarla.`, `Finish the ${openSubs} open subtasks to complete it.`)}
            </div>
          ) : null}
        </Prop>
        <Prop label={t("Prioridad", "Priority")}>
          <select
            className="ec-field-input"
            value={task.priority}
            onChange={(e) => onPatch({ priority: e.target.value as Task["priority"] })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p][lang]}
              </option>
            ))}
          </select>
        </Prop>
        <Prop label={t("Fecha límite", "Due date")}>
          <input
            type="date"
            className="ec-field-input"
            value={task.dueDate?.slice(0, 10) ?? ""}
            onChange={(e) => onPatch({ dueDate: e.target.value || null })}
          />
        </Prop>
        <Prop label={t("Asignados", "Assignees")}>
          <MemberPicker value={task.assigneeIds} onChange={(ids) => onPatch({ assigneeIds: ids })} pool={pool} />
        </Prop>
      </div>

      <Prop label={t("Etiquetas", "Labels")}>
        <LabelPicker value={task.labels ?? []} onChange={(labels) => onPatch({ labels })} suggestions={props.labelSuggestions} />
      </Prop>

      <Prop label="Link">
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            inputMode="url"
            className="ec-field-input"
            value={linkUrl}
            placeholder="https://…"
            onChange={(e) => setLinkUrl(e.target.value)}
            onBlur={() => linkUrl !== (task.linkUrl ?? "") && onPatch({ linkUrl: linkUrl.trim() || null })}
          />
          {task.linkUrl ? (
            <a
              href={task.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ec-btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", padding: "0 12px", textDecoration: "none" }}
              title={t("Abrir enlace", "Open link")}
            >
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
      </Prop>

      <Prop label={t("Descripción", "Description")}>
        <textarea
          className="ec-field-input"
          rows={3}
          value={description}
          placeholder={t("Agrega detalles…", "Add details…")}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => description !== (task.description ?? "") && onPatch({ description: description || null })}
        />
      </Prop>

      {!isSubtask ? (
        <section>
          <div className="h-eyebrow" style={{ marginBottom: 10 }}>
            {t("Subtareas", "Subtasks")} · {subtasks.filter((s) => isDone(s.status)).length}/{subtasks.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--ec-hairline)", borderRadius: 10, overflow: "hidden" }}>
            {subtasks.map((s) => (
              <div
                key={s.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: "1px solid var(--ec-hairline)" }}
              >
                <CompleteToggle
                  done={isDone(s.status)}
                  onToggle={() => props.onPatchSub(s.id, { status: isDone(s.status) ? "todo" : "done" })}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    textDecoration: isDone(s.status) ? "line-through" : "none",
                    color: isDone(s.status) ? "var(--ec-text-muted)" : "var(--ec-text)",
                  }}
                >
                  {s.title}
                </span>
                <MemberPicker compact value={s.assigneeIds} onChange={(ids) => props.onPatchSub(s.id, { assigneeIds: ids })} pool={pool} />
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                props.onAddSub();
              }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px" }}
            >
              <Plus size={14} style={{ color: "var(--ec-text-muted)", marginLeft: 4 }} />
              <input
                value={props.newSub}
                onChange={(e) => props.setNewSub(e.target.value)}
                placeholder={t("Nueva subtarea y Enter", "New subtask, then Enter")}
                aria-label={t("Nueva subtarea", "New subtask")}
                style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13.5, color: "var(--ec-text)", padding: "6px 0" }}
              />
              {props.addingSub ? <Loader2 size={14} className="animate-spin" /> : null}
            </form>
          </div>
        </section>
      ) : null}

      <section>
        <div className="h-eyebrow" style={{ marginBottom: 10 }}>
          {t("Comentarios", "Comments")} · {comments.length}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
          {comments.map((c) => {
            const author = memberById(c.authorId);
            return (
              <div key={c.id} style={{ display: "flex", gap: 10 }}>
                <Avatar member={author} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5 }}>
                    <strong>{author?.name ?? "—"}</strong>{" "}
                    <span style={{ color: "var(--ec-text-muted)" }}>
                      {new Date(c.createdAt).toLocaleString(lang === "es" ? "es-MX" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  <div style={{ fontSize: 13.5, marginTop: 2, whiteSpace: "pre-wrap" }}>{c.body}</div>
                </div>
              </div>
            );
          })}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            props.onComment();
          }}
          style={{ display: "flex", gap: 8 }}
        >
          <input
            className="ec-field-input"
            value={props.newComment}
            onChange={(e) => props.setNewComment(e.target.value)}
            placeholder={t("Escribe un comentario…", "Write a comment…")}
            aria-label={t("Comentario", "Comment")}
          />
          <button type="submit" className="ec-btn-primary" style={{ padding: "8px 14px" }} disabled={props.commenting}>
            {props.commenting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </section>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: "1px solid var(--ec-hairline)" }}>
        <span style={{ fontSize: 12, color: "var(--ec-text-muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <StatusDot status={task.status} />
          {t("Creada por", "Created by")} {memberById(task.createdBy)?.name ?? "—"} ·{" "}
          {new Date(task.createdAt).toLocaleDateString(lang === "es" ? "es-MX" : "en-US")}
        </span>
        <button type="button" className="ec-btn-secondary" style={{ padding: "6px 12px", fontSize: 12.5, color: "var(--ec-danger)" }} onClick={props.onDelete} disabled={props.deleting}>
          <Trash2 size={13} />
          {t("Eliminar", "Delete")}
        </button>
      </div>
    </div>
  );
}

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="ec-field-label">{label}</span>
      {children}
    </div>
  );
}
