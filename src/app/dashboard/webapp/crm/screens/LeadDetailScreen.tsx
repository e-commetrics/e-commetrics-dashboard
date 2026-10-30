"use client";

import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Loader2, Plus, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiCompleteTask, apiCreateTask, apiGetLead, apiPatchLead, apiSetLeadArchived, apiSettings } from "../lib/api";
import { useMutation, useResource } from "../lib/hooks";
import {
  ACTIVITY_LABEL,
  HIDDEN_FIELD_KEYS,
  SOURCE_LABEL,
  contactLine,
  formatDateTime,
  formatFieldLabel,
  formatFieldValue,
  isOverdue,
} from "../lib/format";
import { DeleteLeadModal } from "../components/DeleteLeadModal";
import { EditLeadModal } from "../components/EditLeadModal";
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

/** Ficha del lead: cabecera, respuestas del formulario, tareas, notas y actividad. */
export function LeadDetailScreen({ leadId, onBack }: { leadId: string; onBack: () => void }) {
  const detail = useResource(`lead:${leadId}`, () => apiGetLead(leadId));
  const settings = useResource("settings", apiSettings);
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
      <div style={{ padding: 28 }}>
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
  const contact = contactLine([lead.email, lead.phone]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 28 }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "var(--ec-text-muted)",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
          marginBottom: 18,
        }}
      >
        <ArrowLeft size={13} />
        Back to pipeline
      </button>

      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
          paddingBottom: 22,
          borderBottom: "1px solid var(--ec-hairline)",
          marginBottom: 26,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="h-eyebrow" style={{ marginBottom: 8 }}>
            Lead
          </div>
          <h1 className="font-serif" style={{ fontSize: 36, fontWeight: 400, lineHeight: 1, margin: 0 }}>
            {lead.name}
          </h1>
          {contact ? (
            <p style={{ fontSize: 13.5, color: "var(--ec-text-muted)", marginTop: 8 }}>{contact}</p>
          ) : (
            <p style={{ fontSize: 13.5, color: "var(--ec-text-faint)", marginTop: 8 }}>No contact details on file</p>
          )}
          <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
            {lead.archivedAt ? <Badge tone="warning">Archived {formatDateTime(lead.archivedAt)}</Badge> : null}
            <Badge>source: {SOURCE_LABEL[lead.source]}</Badge>
            {lead.campaignName ? <Badge tone="brand">{lead.campaignName}</Badge> : null}
            {lead.adName ? <Badge>{lead.adName}</Badge> : null}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 240 }}>
          <SelectField
            label="Stage"
            value={lead.stage}
            onChange={(next) => {
              if (next && next !== lead.stage) void changeStage.run(next);
            }}
            options={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
            disabled={changeStage.loading || stages.length === 0}
          />
          <SendMessageModal
            lead={lead}
            templates={settings.data?.templates ?? []}
            onSent={detail.reload}
          />
          <EditLeadModal lead={lead} />
          <button
            type="button"
            className="ec-btn-secondary"
            style={{ padding: "8px 14px", fontSize: 13 }}
            disabled={setArchived.loading}
            onClick={() => void setArchived.run(!lead.archivedAt)}
          >
            {setArchived.loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : lead.archivedAt ? (
              <ArchiveRestore size={13} />
            ) : (
              <Archive size={13} />
            )}
            {lead.archivedAt ? "Restore" : "Archive"}
          </button>
          <DeleteLeadModal lead={lead} onDeleted={onBack} />
          {lead.archivedAt ? null : (
            <p style={{ fontSize: 11, color: "var(--ec-text-dim)", margin: 0 }}>
              Archiving hides the lead from the pipeline, tasks and dashboard. Nothing is deleted.
            </p>
          )}
        </div>
      </header>

      {formEntries.length > 0 ? (
        <Section title="Form answers">
          <dl style={{ display: "flex", flexDirection: "column", gap: 12, margin: 0 }}>
            {formEntries.map(([key, value]) => (
              <div key={key}>
                <dt className="ec-field-label" style={{ marginBottom: 3 }}>
                  {formatFieldLabel(key)}
                </dt>
                <dd style={{ margin: 0, fontSize: 13.5, whiteSpace: "pre-wrap" }}>{formatFieldValue(value)}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      <Section title="Tasks">
        {(detail.data?.tasks ?? []).length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--ec-text-muted)" }}>
            No tasks yet. Add one below, or let the automation rules in Settings create them.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            {(detail.data?.tasks ?? []).map((task) => {
              const overdue = !task.done && isOverdue(task.dueAt);
              return (
                <li key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    disabled={completeTask.loading}
                    onChange={() => !task.done && void completeTask.run(task.id)}
                    aria-label={`Mark "${task.description}" as done`}
                    style={{ cursor: "pointer", accentColor: "var(--ec-brand)" }}
                  />
                  <span
                    style={{
                      color: task.done ? "var(--ec-text-faint)" : overdue ? "var(--ec-danger)" : "var(--ec-text)",
                      textDecoration: task.done ? "line-through" : "none",
                    }}
                  >
                    {task.description}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11.5,
                      color: overdue ? "var(--ec-danger)" : "var(--ec-text-dim)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {overdue ? "Overdue — " : ""}
                    {formatDateTime(task.dueAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <AddTaskForm leadId={lead.id} />
      </Section>

      <Section title="Notes">
        {lead.notes ? (
          <p style={{ fontSize: 13.5, whiteSpace: "pre-wrap", margin: "0 0 14px", color: "var(--ec-text-muted)" }}>
            {lead.notes}
          </p>
        ) : null}
        <TextAreaField
          value={notesDraft}
          onChange={setNotesDraft}
          placeholder="What happened on this lead?"
          rows={3}
        />
        <button
          type="button"
          className="ec-btn-primary"
          style={{ marginTop: 10, padding: "8px 16px", fontSize: 13 }}
          disabled={!notesDraft.trim() || saveNotes.loading}
          onClick={() => void saveNotes.run(notesDraft.trim())}
        >
          {saveNotes.loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save note
        </button>
      </Section>

      <Section title="Activity">
        {(detail.data?.activities ?? []).length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--ec-text-muted)" }}>Nothing logged yet.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {(detail.data?.activities ?? []).map((activity) => (
              <li
                key={activity.id}
                style={{ borderLeft: "2px solid var(--ec-hairline-strong)", paddingLeft: 14 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{ACTIVITY_LABEL[activity.type]}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ec-text-dim)" }}>
                    {formatDateTime(activity.createdAt)}
                  </span>
                </div>
                {activity.content ? (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ec-text-muted)", whiteSpace: "pre-wrap" }}>
                    {activity.content}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/** "YYYY-MM-DDTHH:mm" en hora local, el formato de <input type="datetime-local">. Por defecto: mañana a las 10. */
function tomorrowAtTen(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
      style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginTop: 14 }}
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
      <button
        type="submit"
        className="ec-btn-primary"
        style={{ padding: "10px 16px", fontSize: 13 }}
        disabled={create.loading || !description.trim() || !dueAt}
      >
        {create.loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        Add task
      </button>
    </form>
  );
}
