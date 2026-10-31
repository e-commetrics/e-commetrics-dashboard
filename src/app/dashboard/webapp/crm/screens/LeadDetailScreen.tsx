"use client";

import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Loader2, Mail, Phone, Plus, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiCompleteTask, apiCreateTask, apiGetLead, apiPatchLead, apiSetLeadArchived, apiSettings } from "../lib/api";
import { useMutation, useResource } from "../lib/hooks";
import {
  ACTIVITY_LABEL,
  HIDDEN_FIELD_KEYS,
  SOURCE_LABEL,
  formatDateTime,
  formatFieldLabel,
  formatFieldValue,
  isOverdue,
  toLocalInputValue,
} from "../lib/format";
import { useCrmSession } from "../lib/session";
import type { ActivityType } from "../lib/types";
import { DeleteLeadModal } from "../components/DeleteLeadModal";
import { EditLeadModal } from "../components/EditLeadModal";
import { EditTaskModal } from "../components/EditTaskModal";
import { SendMessageModal } from "../components/SendMessageModal";
import {
  Badge,
  EmptyState,
  ErrorNotice,
  Loading,
  Section,
  SelectField,
  TextAreaField,
  TextField,
} from "../components/ui";

/** Color del punto de cada evento en la actividad: los fallos deben saltar a la vista. */
const ACTIVITY_DOT: Partial<Record<ActivityType, string>> = {
  stage_change: "var(--ec-brand)",
  message_sent: "var(--ec-success)",
  capi_sent: "var(--ec-success)",
  message_failed: "var(--ec-danger)",
  capi_failed: "var(--ec-danger)",
};

/**
 * Ficha del lead. A la izquierda lo que se trabaja (tareas, notas, respuestas y
 * actividad); a la derecha la etapa, el contacto y las acciones que ocultan o
 * borran, apartadas de las de uso diario.
 */
export function LeadDetailScreen({
  leadId,
  onBack,
  onOpenLead,
}: {
  leadId: string;
  onBack: () => void;
  onOpenLead: (id: string) => void;
}) {
  const detail = useResource(`lead:${leadId}`, () => apiGetLead(leadId));
  const settings = useResource("settings", apiSettings);
  const { user } = useCrmSession();
  const [notesDraft, setNotesDraft] = useState("");

  const saveNotes = useMutation((notes: string) => apiPatchLead(leadId, { notes }), {
    onSuccess: () => {
      setNotesDraft("");
      toast.success("Note saved.");
    },
    onError: (message) => toast.error(message),
  });

  const changeStage = useMutation((stage: string) => apiPatchLead(leadId, { stage }), {
    onError: (message) => toast.error(message),
  });

  const completeTask = useMutation((id: string) => apiCompleteTask(id), {
    onError: (message) => toast.error(message),
  });

  const setArchived = useMutation((archived: boolean) => apiSetLeadArchived(leadId, archived), {
    onSuccess: (updated) => toast.success(updated.archivedAt ? "Lead archived." : "Lead restored."),
    onError: (message) => toast.error(message),
  });

  const lead = detail.data?.lead ?? null;
  const stages = useMemo(
    () => (settings.data?.stages ?? []).slice().sort((a, b) => a.order - b.order),
    [settings.data]
  );

  if (detail.loading && !detail.data) return <Loading label="Loading lead…" />;
  if (detail.error && !lead) {
    return (
      <div className="crm-page">
        <ErrorNotice message={detail.error} onRetry={detail.reload} />
      </div>
    );
  }
  if (!lead) {
    return (
      <EmptyState
        title="Lead not found."
        hint="It may have been deleted, or the link is from an older session."
        icon={<ArrowLeft size={34} style={{ margin: "0 auto 14px", opacity: 0.35 }} />}
      />
    );
  }

  const formEntries = Object.entries(lead.fieldDataRaw ?? {}).filter(([key]) => !HIDDEN_FIELD_KEYS.has(key));
  const tasks = detail.data?.tasks ?? [];
  const activities = detail.data?.activities ?? [];
  const duplicates = detail.data?.duplicates ?? [];

  return (
    <div className="crm-page crm-page-wide">
      <button type="button" className="crm-text-btn" onClick={onBack}>
        <ArrowLeft size={14} aria-hidden />
        Back to pipeline
      </button>

      <header className="crm-lead-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="crm-lead-name font-serif">{lead.name}</h1>
          <div className="crm-lead-badges">
            {lead.archivedAt ? <Badge tone="warning">Archived {formatDateTime(lead.archivedAt)}</Badge> : null}
            <Badge>{SOURCE_LABEL[lead.source]}</Badge>
            {lead.campaignName ? <Badge tone="brand">{lead.campaignName}</Badge> : null}
            {lead.adName ? <Badge>{lead.adName}</Badge> : null}
          </div>
        </div>

        <div className="crm-lead-actions">
          {lead.phone ? (
            <a href={`tel:${lead.phone}`} className="ec-btn-secondary">
              <Phone size={14} aria-hidden />
              Call
            </a>
          ) : null}
          {lead.email ? (
            <a href={`mailto:${lead.email}`} className="ec-btn-secondary">
              <Mail size={14} aria-hidden />
              Email
            </a>
          ) : null}
          <SendMessageModal lead={lead} templates={settings.data?.templates ?? []} onSent={detail.reload} />
        </div>
      </header>

      {duplicates.length > 0 ? (
        <div className="crm-notice" style={{ marginBottom: 16 }}>
          <p className="crm-row-title" style={{ margin: "0 0 2px" }}>
            Possible {duplicates.length === 1 ? "duplicate" : "duplicates"}: same phone or email
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            {duplicates.map((duplicate, index) => (
              <span key={duplicate.id}>
                {index > 0 ? ", " : ""}
                <button type="button" className="crm-text-btn crm-link" onClick={() => onOpenLead(duplicate.id)}>
                  {duplicate.name}
                  {duplicate.archivedAt ? " (archived)" : ""}
                </button>
              </span>
            ))}
          </p>
        </div>
      ) : null}

      <div className="crm-lead-grid">
        <div style={{ minWidth: 0 }}>
          <Section title="Tasks">
            {tasks.length === 0 ? (
              <p className="crm-muted" style={{ margin: 0 }}>
                No tasks yet. Add one below, or let the automation rules in Settings create them.
              </p>
            ) : (
              <ul className="crm-row-list" style={{ gap: 10 }}>
                {tasks.map((task) => {
                  const overdue = !task.done && isOverdue(task.dueAt);
                  return (
                    <li key={task.id} className="crm-lead-task">
                      <input
                        type="checkbox"
                        checked={task.done}
                        disabled={completeTask.loading}
                        onChange={() => !task.done && void completeTask.run(task.id)}
                        aria-label={`Mark "${task.description}" as done`}
                      />
                      <span className={`crm-lead-task-text${task.done ? " is-done" : ""}${overdue ? " is-overdue" : ""}`}>
                        {task.description}
                      </span>
                      <span className={overdue ? "crm-lead-task-due is-overdue" : "crm-lead-task-due"}>
                        {overdue ? "Overdue — " : ""}
                        {formatDateTime(task.dueAt)}
                      </span>
                      {task.done ? null : <EditTaskModal task={task} />}
                    </li>
                  );
                })}
              </ul>
            )}
            <AddTaskForm leadId={lead.id} />
          </Section>

          <Section title="Notes" hint="Saving replaces the latest note. Earlier notes stay in Activity.">
            {lead.notes ? <p className="crm-note-current">{lead.notes}</p> : null}
            <TextAreaField
              label="New note"
              value={notesDraft}
              onChange={setNotesDraft}
              placeholder="What happened on this lead?"
              rows={3}
            />
            <button
              type="button"
              className="ec-btn-primary"
              style={{ marginTop: 10 }}
              disabled={!notesDraft.trim() || saveNotes.loading}
              onClick={() => void saveNotes.run(notesDraft.trim())}
            >
              {saveNotes.loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save note
            </button>
          </Section>

          {formEntries.length > 0 ? (
            <Section title="Form answers">
              <dl className="crm-dl" style={{ gridTemplateColumns: "minmax(0, 1fr)", gap: 10 }}>
                {formEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt className="crm-small">{formatFieldLabel(key)}</dt>
                    <dd style={{ whiteSpace: "pre-wrap" }}>{formatFieldValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          ) : null}

          <Section title="Activity">
            {activities.length === 0 ? (
              <p className="crm-muted" style={{ margin: 0 }}>
                Nothing logged yet.
              </p>
            ) : (
              <ul className="crm-timeline">
                {activities.map((activity) => (
                  <li
                    key={activity.id}
                    style={{ "--crm-dot": ACTIVITY_DOT[activity.type] } as React.CSSProperties}
                  >
                    <div className="crm-timeline-head">
                      <span>{ACTIVITY_LABEL[activity.type]}</span>
                      <span className="crm-timeline-time">
                        {formatDateTime(activity.createdAt)}
                        {activity.actor ? ` · by ${activity.actor}` : ""}
                      </span>
                    </div>
                    {activity.content ? <p>{activity.content}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className="crm-lead-side" aria-label="Lead details">
          <section className="crm-panel">
            <SelectField
              label="Stage"
              value={lead.stage}
              onChange={(next) => {
                if (next && next !== lead.stage) void changeStage.run(next);
              }}
              options={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
              disabled={changeStage.loading || stages.length === 0}
            />
          </section>

          <section className="crm-panel">
            <h2 className="crm-panel-title font-serif">Contact</h2>
            <dl className="crm-dl">
              <dt>Phone</dt>
              <dd>
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="crm-link">
                    {lead.phone}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
              <dt>Email</dt>
              <dd>
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="crm-link">
                    {lead.email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
              <dt>Added</dt>
              <dd>{formatDateTime(lead.createdAt)}</dd>
              {lead.formName ? (
                <>
                  <dt>Form</dt>
                  <dd>{lead.formName}</dd>
                </>
              ) : null}
            </dl>
            <div style={{ marginTop: 14 }}>
              <EditLeadModal lead={lead} />
            </div>
          </section>

          <section className="crm-panel">
            <h2 className="crm-panel-title font-serif">Manage</h2>
            <div className="crm-side-stack">
              <button
                type="button"
                className="ec-btn-secondary crm-btn-block"
                disabled={setArchived.loading}
                onClick={() => void setArchived.run(!lead.archivedAt)}
              >
                {setArchived.loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : lead.archivedAt ? (
                  <ArchiveRestore size={14} />
                ) : (
                  <Archive size={14} />
                )}
                {lead.archivedAt ? "Restore" : "Archive"}
              </button>
              {lead.archivedAt ? null : (
                <p className="crm-small" style={{ margin: 0 }}>
                  Archiving hides the lead from the pipeline, tasks and dashboard. Nothing is deleted.
                </p>
              )}
              {user?.role === "admin" ? <DeleteLeadModal lead={lead} onDeleted={onBack} /> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

/** Vencimiento por defecto de una tarea nueva: mañana a las 10. */
function tomorrowAtTen(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return toLocalInputValue(date);
}

function AddTaskForm({ leadId }: { leadId: string }) {
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState(tomorrowAtTen);

  const create = useMutation(
    () => apiCreateTask({ leadId, description: description.trim(), dueAt: new Date(dueAt).toISOString() }),
    {
      onSuccess: () => {
        setDescription("");
        setDueAt(tomorrowAtTen());
        toast.success("Task added.");
      },
      onError: (message) => toast.error(message),
    }
  );

  return (
    <form
      className="crm-add-task"
      onSubmit={(event) => {
        event.preventDefault();
        if (description.trim() && dueAt) void create.run();
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <TextField label="New task" value={description} onChange={setDescription} placeholder="e.g. Send the implant quote" />
      </div>
      <div style={{ width: 210 }}>
        <TextField label="Due" type="datetime-local" value={dueAt} onChange={setDueAt} required />
      </div>
      <button type="submit" className="ec-btn-primary" disabled={create.loading || !description.trim() || !dueAt}>
        {create.loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Add task
      </button>
    </form>
  );
}
