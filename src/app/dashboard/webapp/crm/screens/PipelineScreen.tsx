"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, Search, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiExportCsv, apiListLeads, apiListTasks, apiPatchLead, apiSettings } from "../lib/api";
import { useMutation, useResource } from "../lib/hooks";
import { downloadTextFile } from "../lib/format";
import type { Stage, Task } from "../lib/types";
import { AddLeadModal } from "../components/AddLeadModal";
import { LeadCard } from "../components/LeadCard";
import { TasksPanel } from "../components/TasksPanel";
import { WebBookings } from "../components/WebBookings";
import { EmptyState, ErrorNotice, Loading, Switch } from "../components/ui";

type PipelineTab = "crm" | "web";

const TABS: { id: PipelineTab; label: string }[] = [
  { id: "crm", label: "Leads" },
  { id: "web", label: "Web bookings" },
];

/** Pipeline con dos pestanas: el tablero de leads y las citas del sitio. */
export function PipelineScreen({
  initialTab = "crm",
  onOpenLead,
}: {
  initialTab?: PipelineTab;
  onOpenLead: (id: string) => void;
}) {
  const [tab, setTab] = useState<PipelineTab>(initialTab);

  return (
    <div className="crm-pipeline">
      <div className="crm-pipeline-head">
        <h1 className="crm-screen-title font-serif">Pipeline</h1>
        <div role="tablist" aria-label="Pipeline views" className="ec-segmented">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`pipeline-tab-${item.id}`}
                aria-selected={active}
                aria-controls={`pipeline-panel-${item.id}`}
                className={active ? "active" : ""}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        role="tabpanel"
        id={`pipeline-panel-${tab}`}
        aria-labelledby={`pipeline-tab-${tab}`}
        className="crm-pipeline-panel"
      >
        {tab === "crm" ? <LeadBoard onOpenLead={onOpenLead} /> : <WebBookings onOpenLead={onOpenLead} />}
      </div>
    </div>
  );
}

/**
 * Tablero kanban del pipeline.
 *
 * El drag & drop es HTML5 nativo, igual que en el CRM original: son seis lineas
 * y funciona bien con pocas tarjetas por columna. Con cientos de leads un
 * backend de arrastre casero empieza a fallar, y ahi si tocaria mirar dnd-kit.
 */
function LeadBoard({ onOpenLead }: { onOpenLead: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingOverStage, setDraggingOverStage] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const leads = useResource(showArchived ? "leads:all" : "leads", () => apiListLeads(showArchived));
  // Los stages vienen piggybacked en /settings, que es de donde los sacaba el
  // original tambien. Se piden en paralelo porque son independientes.
  const settings = useResource("settings", apiSettings);
  const tasks = useResource("tasks", apiListTasks);

  const moveLead = useMutation(
    (id: string, stage: string) => apiPatchLead(id, { stage }),
    {
      // Un cambio de etapa dispara el CAPI de Facebook y las reglas de
      // automatizacion. Si falla, el lead se queda donde estaba: por eso el
      // "bump" de useMutation lo refresca todo y el error sale como toast.
      onError: (message) => toast.error(message),
    }
  );

  const exportCsv = useMutation(async () => {
    const csv = await apiExportCsv();
    downloadTextFile(`crm-leads-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }, {
    onSuccess: () => toast.success("CSV downloaded."),
    onError: (message) => toast.error(message),
  });

  const allLeads = useMemo(() => leads.data ?? [], [leads.data]);
  const stages: Stage[] = useMemo(
    () => (settings.data?.stages ?? []).slice().sort((a, b) => a.order - b.order),
    [settings.data]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allLeads;
    return allLeads.filter((lead) =>
      [lead.name, lead.email, lead.phone, lead.campaignName]
        .filter((field): field is string => Boolean(field))
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [allLeads, search]);

  const leadNames = useMemo(() => new Map(allLeads.map((lead) => [lead.id, lead.name])), [allLeads]);

  const nextTaskByLead = useMemo(() => {
    const next = new Map<string, Task>();
    for (const task of tasks.data ?? []) {
      if (task.done) continue;
      const current = next.get(task.leadId);
      if (!current || task.dueAt < current.dueAt) next.set(task.leadId, task);
    }
    return next;
  }, [tasks.data]);

  const loading = (leads.loading && !leads.data) || (settings.loading && !settings.data);
  const error = leads.error ?? settings.error;

  return (
    <div className="crm-board-layout">
      <div className="crm-board-main">
        <div className="crm-toolbar">
          <div className="crm-search">
            <Search size={14} className="crm-search-icon" aria-hidden />
            <input
              className="ec-field-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone, campaign…"
              aria-label="Search leads"
            />
            {search ? (
              <button type="button" className="crm-icon-btn crm-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={14} />
              </button>
            ) : null}
          </div>
          <span className="crm-muted" role="status">
            {search
              ? `${filtered.length} of ${allLeads.length} leads`
              : `${allLeads.length} ${allLeads.length === 1 ? "lead" : "leads"}`}
          </span>

          <div className="crm-toolbar-end">
            <span className="crm-toggle">
              <Switch checked={showArchived} onChange={setShowArchived} label="Show archived leads" />
              Show archived
            </span>
            <button type="button" className="ec-btn-secondary" onClick={() => void exportCsv.run()} disabled={exportCsv.loading}>
              {exportCsv.loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export CSV
            </button>
            <AddLeadModal onOpenLead={onOpenLead} />
          </div>
        </div>

        <div className="crm-board-scroll">
          {loading ? <Loading label="Loading pipeline…" /> : null}
          {error ? <ErrorNotice message={error} onRetry={() => { leads.reload(); settings.reload(); }} /> : null}

          {!loading && !error && stages.length === 0 ? (
            <EmptyState
              title="No pipeline stages."
              hint="Run crm/seed.js on the server. Without stages, leads cannot be created because of the foreign key on crm_leads.stage."
            />
          ) : null}

          {!loading && !error && stages.length > 0 && allLeads.length === 0 ? (
            <EmptyState
              title="No leads yet."
              hint="Add one manually, or run Sync now in Settings to pull leads from Facebook."
            />
          ) : null}

          {stages.length > 0 && allLeads.length > 0 ? (
            <div className="crm-columns">
              {stages.map((stage) => {
                const inStage = filtered.filter((lead) => lead.stage === stage.id);
                const isTarget = draggingOverStage === stage.id;
                return (
                  <section
                    key={stage.id}
                    aria-label={`${stage.name}: ${inStage.length} leads`}
                    className={isTarget ? "crm-column is-target" : "crm-column"}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDraggingOverStage(stage.id);
                    }}
                    onDragLeave={(event) => {
                      // dragleave tambien salta al pasar por encima de una tarjeta
                      // hija. Sin mirar relatedTarget el resaltado de destino se
                      // apaga a mitad del arrastre y la columna parece que ya no
                      // acepta la tarjeta.
                      const next = event.relatedTarget;
                      if (next instanceof Node && event.currentTarget.contains(next)) return;
                      setDraggingOverStage((current) => (current === stage.id ? null : current));
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDraggingOverStage(null);
                      const id = draggingId;
                      setDraggingId(null);
                      // Ignorar el drop en la etapa actual: sin esta guarda el
                      // PATCH dispara reglas y CAPI aunque nada haya cambiado.
                      if (id) {
                        const lead = allLeads.find((item) => item.id === id);
                        if (lead && lead.stage !== stage.id) void moveLead.run(id, stage.id);
                      }
                    }}
                  >
                    <h2 className="crm-column-head">
                      <span className="crm-column-dot" style={{ background: stage.color }} aria-hidden />
                      {stage.name}
                      <span className="crm-column-count">{inStage.length}</span>
                    </h2>

                    <div className="crm-column-list">
                      {inStage.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          nextTask={nextTaskByLead.get(lead.id) ?? null}
                          stages={stages}
                          onDragStart={setDraggingId}
                          onOpen={onOpenLead}
                          onMove={(id, next) => void moveLead.run(id, next)}
                        />
                      ))}
                      {inStage.length === 0 ? (
                        <p className="crm-column-empty">{isTarget ? "Drop here" : "No leads"}</p>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <TasksPanel tasks={tasks} leadNames={leadNames} onOpenLead={onOpenLead} />
    </div>
  );
}
