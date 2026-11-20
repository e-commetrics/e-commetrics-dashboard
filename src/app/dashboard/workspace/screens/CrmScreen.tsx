"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, KanbanSquare, Loader2, Plus, Settings2, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { ErrorNotice, Loading, Modal, PageHeader } from "../../webapp/crm/components/ui";
import { Avatar, DueDate, PriorityFlag, employeesOf } from "../components/shared";
import { useMutation, useResource, useWorkspace } from "../lib/hooks";
import { PRIORITY_META, useT } from "../lib/i18n";
import { PRIORITIES, type CrmLead, type CrmLeadInput, type Priority, type ProjectStage } from "../lib/types";

/** Etapas con las que nace un CRM nuevo: las del CRM de ventas que estaba en ClickUp. Se editan después. */
const DEFAULT_STAGES = ["Open Lead", "Presentation/Quotation", "Negotiation", "Client", "Partner (<1yr)", "Complete Old CX (>1yr)"];
const STAGE_COLORS = ["var(--ec-d1)", "var(--ec-d2)", "var(--ec-d3)", "var(--ec-d4)", "var(--ec-d5)", "var(--ec-d6)"];

/**
 * App CRM: cada CRM es un proyecto con etapas propias (2, 5, 7…). El proyecto lo liga a su cliente.
 * Los leads no son tareas: no cuentan en avance, Mis tareas ni calendario.
 */
export function CrmScreen({ projectId, onOpen }: { projectId: string | null; onOpen: (id: string | null) => void }) {
  return projectId ? <CrmBoard key={projectId} projectId={projectId} onBack={() => onOpen(null)} /> : <CrmList onOpen={onOpen} />;
}

// ── Lista de CRMs ────────────────────────────────────────────────────────────

function CrmList({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useT();
  const { isAdmin } = useWorkspace();
  const crms = useResource("crm:list", (api) => api.listCrms());
  const [creating, setCreating] = useState(false);

  return (
    <div style={{ padding: 28 }}>
      <PageHeader
        eyebrow={`⎯⎯⎯  ${t("ESPACIO DE TRABAJO", "WORKSPACE")}`}
        title="CRM"
        subtitle={t("Pipelines de leads. Cada CRM pertenece a un proyecto y a su cliente, con sus propias etapas.", "Lead pipelines. Each CRM belongs to a project and its client, with its own stages.")}
        actions={
          isAdmin ? (
            <button type="button" className="ec-btn-primary" onClick={() => setCreating(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> {t("Nuevo CRM", "New CRM")}
            </button>
          ) : null
        }
      />
      {crms.loading && !crms.data ? <Loading /> : null}
      {crms.error ? <ErrorNotice message={crms.error} onRetry={crms.reload} /> : null}
      {crms.data && !crms.data.length ? (
        <p style={{ fontSize: 13.5, color: "var(--ec-text-muted)" }}>{t("Todavía no hay CRMs.", "No CRMs yet.")}</p>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {(crms.data ?? []).map((c) => (
          <button
            key={c.projectId}
            type="button"
            className="ec-project-card"
            onClick={() => onOpen(c.projectId)}
            style={{ textAlign: "left", padding: 16, borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: "var(--ec-text)" }}>
              <KanbanSquare size={15} aria-hidden /> {c.name}
            </span>
            <span style={{ fontSize: 12.5, color: "var(--ec-text-muted)" }}>
              {c.clientName ? `${t("Cliente", "Client")}: ${c.clientName}` : t("Interno · sin cliente", "Internal · no client")}
            </span>
            <span className="font-mono-ec" style={{ fontSize: 11, color: "var(--ec-text-dim)" }}>
              {c.leadCount} LEADS · {c.stageCount} {t("ETAPAS", "STAGES")}
            </span>
          </button>
        ))}
      </div>
      {creating ? <NewCrmModal onClose={() => setCreating(false)} onCreated={onOpen} /> : null}
    </div>
  );
}

/** Admin: convierte un proyecto sin etapas en CRM, con las etapas de ClickUp como punto de partida. */
function NewCrmModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { t } = useT();
  const projects = useResource("crm:projects", (api) => api.listProjects());
  const candidates = (projects.data ?? []).filter((p) => !p.stages?.length && p.status !== "archived");
  const [projectId, setProjectId] = useState("");
  const create = useMutation((api, id: string) => api.setProjectStages(id, DEFAULT_STAGES.map((name) => ({ name }))), {
    onSuccess: (p) => {
      toast.success(t("CRM creado", "CRM created"));
      onClose();
      onCreated(p.id);
    },
    onError: (m) => toast.error(m),
  });

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={t("Nuevo CRM", "New CRM")}
      width={480}
      footer={
        <>
          <button type="button" className="ec-btn-secondary" onClick={onClose}>
            {t("Cancelar", "Cancel")}
          </button>
          <button type="button" className="ec-btn-primary" disabled={!projectId || create.loading} onClick={() => void create.run(projectId)}>
            {create.loading ? <Loader2 size={14} className="animate-spin" /> : null} {t("Crear CRM", "Create CRM")}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: "var(--ec-text-muted)", margin: "0 0 12px" }}>
        {t(
          "Elige el proyecto (y con él, su cliente). El CRM nace con las etapas de ClickUp; después las cambias, quitas o agregas.",
          "Pick the project (and with it, its client). The CRM starts with the ClickUp stages; change, remove or add them afterwards."
        )}
      </p>
      <span className="ec-field-label">{t("Proyecto", "Project")}</span>
      <select className="ec-field-input" value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label={t("Proyecto", "Project")}>
        <option value="">{t("Selecciona…", "Select…")}</option>
        {candidates.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </Modal>
  );
}

// ── Tablero de un CRM ────────────────────────────────────────────────────────

function CrmBoard({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const { t } = useT();
  const { isAdmin, memberById } = useWorkspace();
  const data = useResource(`crm:${projectId}`, (api) => api.getCrm(projectId));
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [openLead, setOpenLead] = useState<CrmLead | null>(null);
  const [editingStages, setEditingStages] = useState(false);

  const move = useMutation((api, id: string, stageId: string | null) => api.updateLead(id, { stageId }), {
    onError: (m) => toast.error(m),
  });
  const create = useMutation((api, stageId: string | null, name: string) => api.createLead(projectId, { name, stageId }), {
    onError: (m) => toast.error(m),
  });

  const project = data.data?.project;
  const leads = useMemo(() => [...(data.data?.leads ?? [])].sort((a, b) => a.position - b.position), [data.data]);
  const stages = project?.stages ?? [];
  // "Sin etapa": leads de una etapa borrada. Solo aparece si hay alguno.
  const columns: { key: string; name: string; color: string; stageId: string | null }[] = [
    ...stages.map((s, i) => ({ key: s.id, name: s.name, color: STAGE_COLORS[i % STAGE_COLORS.length], stageId: s.id as string | null })),
    ...(leads.some((l) => !stages.some((s) => s.id === l.stageId))
      ? [{ key: "none", name: t("Sin etapa", "No stage"), color: "var(--ec-text-faint)", stageId: null }]
      : []),
  ];
  const inColumn = (c: { stageId: string | null }, l: CrmLead) =>
    c.stageId ? l.stageId === c.stageId : !stages.some((s) => s.id === l.stageId);

  if (data.loading && !data.data) return <Loading />;
  if (data.error) return <div style={{ padding: 28 }}><ErrorNotice message={data.error} onRetry={data.reload} /></div>;
  if (!project) return null;
  const client = memberById(project.clientId);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div style={{ padding: "22px 28px 14px", display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <button type="button" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, color: "var(--ec-text-muted)", fontSize: 12.5, cursor: "pointer" }}>
            <ArrowLeft size={13} /> CRM
          </button>
          <h1 className="font-serif" style={{ fontSize: 30, fontWeight: 400, margin: "6px 0 4px", color: "var(--ec-text)" }}>{project.name}</h1>
          <div style={{ fontSize: 12.5, color: "var(--ec-text-muted)" }}>
            {client ? `${t("Cliente", "Client")}: ${client.name}` : t("Interno · sin cliente", "Internal · no client")} · {leads.length} leads
          </div>
        </div>
        {isAdmin ? (
          <button type="button" className="ec-btn-secondary" onClick={() => setEditingStages(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Settings2 size={14} /> {t("Etapas", "Stages")}
          </button>
        ) : null}
      </div>

      <div style={{ flex: 1, overflowX: "auto", padding: "0 28px 28px" }}>
        <div style={{ display: "flex", gap: 10, minWidth: "min-content", alignItems: "flex-start" }}>
          {columns.map((c) => {
            const list = leads.filter((l) => inColumn(c, l));
            return (
              <div
                key={c.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(c.key);
                }}
                onDragLeave={(e) => {
                  const next = e.relatedTarget;
                  if (next instanceof Node && e.currentTarget.contains(next)) return;
                  setOver((cur) => (cur === c.key ? null : cur));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  const lead = leads.find((l) => l.id === dragId);
                  setDragId(null);
                  if (lead && !inColumn(c, lead)) void move.run(lead.id, c.stageId);
                }}
                style={{
                  width: 268,
                  flexShrink: 0,
                  borderRadius: 10,
                  background: over === c.key ? "var(--ec-brand-softer)" : "var(--ec-surface-2)",
                  border: `1px solid ${over === c.key ? "var(--ec-brand)" : "transparent"}`,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 6px" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ec-text)" }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: "var(--ec-text-muted)" }}>{list.length}</span>
                </div>
                {list.map((l) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    dragging={dragId === l.id}
                    onOpen={() => setOpenLead(l)}
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => setDragId(null)}
                  />
                ))}
                <AddLead onAdd={(name) => create.run(c.stageId, name)} />
              </div>
            );
          })}
        </div>
      </div>

      {openLead ? <LeadModal lead={openLead} stages={stages} onClose={() => setOpenLead(null)} /> : null}
      {editingStages ? <StagesModal projectId={projectId} stages={stages} onClose={() => setEditingStages(false)} /> : null}
    </div>
  );
}

function LeadCard({
  lead,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  lead: CrmLead;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const { memberById } = useWorkspace();
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      className="ec-project-card"
      style={{ padding: "10px 12px", borderRadius: 8, cursor: "grab", opacity: dragging ? 0.4 : 1, display: "flex", flexDirection: "column", gap: 6 }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ec-text)", lineHeight: 1.35 }}>{lead.name}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <PriorityFlag priority={lead.priority} />
        <DueDate date={lead.dueDate} />
        {lead.linkUrl ? <ExternalLink size={12} aria-label="Link" style={{ color: "var(--ec-text-dim)" }} /> : null}
        <span style={{ flex: 1 }} />
        <Avatar member={memberById(lead.ownerId)} size={20} />
      </span>
    </div>
  );
}

function AddLead({ onAdd }: { onAdd: (name: string) => Promise<unknown> }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--ec-text-muted)", fontSize: 13, padding: "6px 6px", cursor: "pointer" }}>
        <Plus size={14} /> {t("Agregar lead", "Add lead")}
      </button>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || saving) return;
        setSaving(true);
        const created = await onAdd(name.trim());
        setSaving(false);
        if (created !== null) setName("");
      }}
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
    >
      <input
        autoFocus
        className="ec-field-input"
        style={{ fontSize: 13, padding: "8px 10px" }}
        value={name}
        maxLength={300}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={t("Nombre del lead y Enter", "Lead name, then Enter")}
        aria-label={t("Nombre del lead", "Lead name")}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button type="submit" className="ec-btn-primary" style={{ padding: "6px 12px", fontSize: 12.5 }} disabled={saving || !name.trim()}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} {t("Agregar", "Add")}
        </button>
        <button type="button" className="ec-btn-secondary" style={{ padding: "6px 12px", fontSize: 12.5 }} onClick={() => setOpen(false)}>
          {t("Cancelar", "Cancel")}
        </button>
      </div>
    </form>
  );
}

function LeadModal({ lead, stages, onClose }: { lead: CrmLead; stages: ProjectStage[]; onClose: () => void }) {
  const { t, lang } = useT();
  const { members } = useWorkspace();
  const [form, setForm] = useState({
    name: lead.name,
    description: lead.description ?? "",
    linkUrl: lead.linkUrl ?? "",
    priority: lead.priority,
    dueDate: lead.dueDate ?? "",
    ownerId: lead.ownerId ?? "",
    stageId: lead.stageId ?? "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useMutation((api, patch: CrmLeadInput) => api.updateLead(lead.id, patch), {
    onSuccess: () => {
      toast.success(t("Lead guardado", "Lead saved"));
      onClose();
    },
    onError: (m) => toast.error(m),
  });
  const remove = useMutation((api) => api.deleteLead(lead.id), {
    onSuccess: () => {
      toast.success(t("Lead borrado", "Lead deleted"));
      onClose();
    },
    onError: (m) => toast.error(m),
  });

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="Lead"
      width={560}
      footer={
        confirmDelete ? (
          <>
            <span style={{ fontSize: 12.5, color: "var(--ec-text)", marginRight: "auto" }}>{t("¿Borrar este lead? No se puede deshacer.", "Delete this lead? This cannot be undone.")}</span>
            <button type="button" className="ec-btn-secondary" onClick={() => setConfirmDelete(false)}>
              {t("Cancelar", "Cancel")}
            </button>
            <button type="button" className="ec-btn-primary" style={{ background: "var(--ec-danger)" }} disabled={remove.loading} onClick={() => void remove.run()}>
              {remove.loading ? <Loader2 size={14} className="animate-spin" /> : null} {t("Borrar", "Delete")}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="ec-btn-secondary" style={{ marginRight: "auto", color: "var(--ec-danger)", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} /> {t("Borrar", "Delete")}
            </button>
            <button type="button" className="ec-btn-secondary" onClick={onClose}>
              {t("Cancelar", "Cancel")}
            </button>
            <button
              type="button"
              className="ec-btn-primary"
              disabled={!form.name.trim() || save.loading}
              onClick={() =>
                void save.run({
                  name: form.name.trim(),
                  description: form.description.trim() || null,
                  linkUrl: form.linkUrl.trim() || null,
                  priority: form.priority,
                  dueDate: form.dueDate || null,
                  ownerId: form.ownerId || null,
                  stageId: form.stageId || null,
                })
              }
            >
              {save.loading ? <Loader2 size={14} className="animate-spin" /> : null} {t("Guardar", "Save")}
            </button>
          </>
        )
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label={t("Nombre", "Name")}>
          <input className="ec-field-input" maxLength={300} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={t("Etapa", "Stage")}>
            <select className="ec-field-input" value={form.stageId} onChange={(e) => set("stageId", e.target.value)}>
              <option value="">{t("Sin etapa", "No stage")}</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Prioridad", "Priority")}>
            <select className="ec-field-input" value={form.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p][lang]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Responsable", "Owner")}>
            <select className="ec-field-input" value={form.ownerId} onChange={(e) => set("ownerId", e.target.value)}>
              <option value="">{t("Sin asignar", "Unassigned")}</option>
              {employeesOf(members).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Fecha de seguimiento", "Follow-up date")}>
            <input type="date" className="ec-field-input" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </Field>
        </div>
        <Field label="Link">
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input className="ec-field-input" inputMode="url" value={form.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} placeholder="https://" />
            {lead.linkUrl ? (
              <a href={lead.linkUrl} target="_blank" rel="noreferrer" aria-label={t("Abrir link", "Open link")} style={{ color: "var(--ec-brand)" }}>
                <ExternalLink size={15} />
              </a>
            ) : null}
          </div>
        </Field>
        <Field label={t("Descripción", "Description")}>
          <textarea className="ec-field-input" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/** Admin: etapas del CRM. Borrar una deja sus leads en «Sin etapa». */
function StagesModal({ projectId, stages, onClose }: { projectId: string; stages: ProjectStage[]; onClose: () => void }) {
  const { t } = useT();
  const [draft, setDraft] = useState<{ id?: string; name: string }[]>(() => stages.map((s) => ({ id: s.id, name: s.name })));
  const save = useMutation((api, list: { id?: string; name: string }[]) => api.setProjectStages(projectId, list), {
    onSuccess: () => {
      toast.success(t("Etapas guardadas", "Stages saved"));
      onClose();
    },
    onError: (m) => toast.error(m),
  });
  const swap = (a: number, b: number) =>
    setDraft((cur) => {
      const next = [...cur];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  const invalid = !draft.length || draft.some((s) => !s.name.trim());

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={t("Etapas del CRM", "CRM stages")}
      width={520}
      footer={
        <>
          <button type="button" className="ec-btn-secondary" onClick={onClose}>
            {t("Cancelar", "Cancel")}
          </button>
          <button type="button" className="ec-btn-primary" disabled={invalid || save.loading} onClick={() => void save.run(draft.map((s) => ({ ...s, name: s.name.trim() })))}>
            {save.loading ? <Loader2 size={14} className="animate-spin" /> : null} {t("Guardar", "Save")}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 12.5, color: "var(--ec-text-muted)", margin: "0 0 10px" }}>
        {t(
          "Cada cliente puede tener las etapas que quiera. Si quitas una etapa, sus leads quedan en «Sin etapa».",
          "Each client can have as many stages as they want. Removing a stage moves its leads to “No stage”."
        )}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {draft.map((s, i) => (
          <div key={s.id ?? `new-${i}`} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              className="ec-field-input"
              style={{ padding: "6px 10px", fontSize: 13 }}
              maxLength={80}
              value={s.name}
              aria-label={t(`Etapa ${i + 1}`, `Stage ${i + 1}`)}
              onChange={(e) => setDraft((cur) => cur.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
            <IconBtn label={t("Subir", "Move up")} disabled={i === 0} onClick={() => swap(i, i - 1)}>
              <ArrowUp size={13} />
            </IconBtn>
            <IconBtn label={t("Bajar", "Move down")} disabled={i === draft.length - 1} onClick={() => swap(i, i + 1)}>
              <ArrowDown size={13} />
            </IconBtn>
            <IconBtn label={t("Quitar etapa", "Remove stage")} onClick={() => setDraft((cur) => cur.filter((_, j) => j !== i))}>
              <X size={13} />
            </IconBtn>
          </div>
        ))}
        <button
          type="button"
          className="ec-btn-secondary"
          style={{ alignSelf: "flex-start", padding: "6px 12px", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }}
          disabled={draft.length >= 30}
          onClick={() => setDraft((cur) => [...cur, { name: "" }])}
        >
          <Plus size={13} /> {t("Agregar etapa", "Add stage")}
        </button>
        {!draft.length ? <span style={{ fontSize: 12.5, color: "var(--ec-danger)" }}>{t("Un CRM necesita al menos una etapa.", "A CRM needs at least one stage.")}</span> : null}
      </div>
    </Modal>
  );
}

function IconBtn({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="ec-btn-secondary" style={{ padding: "6px 8px" }} aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="ec-field-label">{label}</span>
      {children}
    </div>
  );
}
