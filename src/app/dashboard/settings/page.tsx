"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { ErrorNotice, Loading, Modal } from "@/app/dashboard/webapp/crm/components/ui";
import { useMutation, useResource, useWorkspace, WorkspaceProvider } from "@/app/dashboard/workspace/lib/hooks";
import { PROJECT_STATUS_META, useT } from "@/app/dashboard/workspace/lib/i18n";
import { packageOptions, packageTemplateTasks } from "@/app/dashboard/workspace/lib/packages";
import type { LabelUsage, PackageId, ProjectStatus, TemplateTask } from "@/app/dashboard/workspace/lib/types";
import TeamPage from "../team/page";
import AccessAppPage from "../access-app/page";

type Tab = "statuses" | "labels" | "packages" | "team" | "perms";

/**
 * Ajustes del dashboard (solo admin, ADMIN_ONLY_ROUTES). Reúne lo que antes estaba suelto en el
 * menú lateral (Equipo, Permisos) y lo que no se podía editar (estados, labels, tareas por paquete).
 */
export default function SettingsPage() {
  return (
    <WorkspaceProvider>
      <Settings />
    </WorkspaceProvider>
  );
}

function Settings() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>("statuses");
  const tabs: { id: Tab; label: string }[] = [
    { id: "statuses", label: t("Estados de proyecto", "Project statuses") },
    { id: "labels", label: "Labels" },
    { id: "packages", label: t("Tareas por paquete", "Tasks per package") },
    { id: "team", label: t("Equipo", "Team") },
    { id: "perms", label: t("Permisos", "Permissions") },
  ];
  // Equipo y Permisos son las páginas de siempre y traen su propio encabezado y Toaster.
  const embedded = tab === "team" || tab === "perms";

  return (
    <div className="fade-in-up">
      <div style={{ padding: "28px 24px 0" }}>
        <div className="h-eyebrow" style={{ marginBottom: 8 }}>{t("ADMINISTRACIÓN", "ADMINISTRATION")}</div>
        <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.025em", color: "var(--ec-text)" }}>
          {t("Ajustes", "Settings")}
        </h1>
        <nav className="ec-segmented" style={{ marginTop: 18, flexWrap: "wrap" }} aria-label={t("Secciones de ajustes", "Settings sections")}>
          {tabs.map((x) => (
            <button key={x.id} type="button" className={tab === x.id ? "active" : ""} aria-pressed={tab === x.id} onClick={() => setTab(x.id)}>
              {x.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "team" ? <TeamPage /> : null}
      {tab === "perms" ? <AccessAppPage /> : null}
      {!embedded ? (
        <div style={{ padding: "22px 24px 28px", maxWidth: 860 }}>
          <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
          {tab === "statuses" ? <StatusesTab /> : null}
          {tab === "labels" ? <LabelsTab /> : null}
          {tab === "packages" ? <PackagesTab /> : null}
        </div>
      ) : null}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ec-text-muted)", lineHeight: 1.5 }}>{children}</p>;
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="ec-btn-secondary"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{ padding: "6px 8px", color: danger ? "var(--ec-danger)" : undefined }}
    >
      {children}
    </button>
  );
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

// ── Estados de proyecto ──────────────────────────────────────────────────────

function StatusesTab() {
  const { t, lang } = useT();
  const { statusOrder, statusName } = useWorkspace();
  // Borrador local: se guarda todo junto con "Guardar".
  const [draft, setDraft] = useState<{ id: ProjectStatus; name: string }[] | null>(null);
  const rows = draft ?? statusOrder.map((id) => ({ id, name: statusName(id, lang) === PROJECT_STATUS_META[id][lang] ? "" : statusName(id, lang) }));
  const save = useMutation((api, list: { id: ProjectStatus; name: string }[]) => api.setProjectStatuses(list), {
    onSuccess: () => {
      setDraft(null);
      toast.success(t("Estados guardados", "Statuses saved"));
    },
    onError: (m) => toast.error(m),
  });

  return (
    <section>
      <Hint>
        {t(
          "Cambia el nombre y el orden de los estados de proyecto. Son los mismos 5 de siempre: no se agregan ni se borran, porque «Archivado» y «Completado» tienen efectos (por ejemplo, los archivados no salen en el calendario). Deja el nombre vacío para usar el de siempre.",
          "Rename and reorder the project statuses. They are the same 5 as always: none are added or removed, because “Archived” and “Completed” have effects (archived projects leave the calendar, for example). Leave a name empty to use the default."
        )}
      </Hint>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`ec-badge ${PROJECT_STATUS_META[s.id].badge}`} style={{ minWidth: 110, justifyContent: "center" }}>
              {PROJECT_STATUS_META[s.id][lang]}
            </span>
            <input
              className="ec-field-input"
              style={{ padding: "7px 10px", fontSize: 13 }}
              maxLength={40}
              value={s.name}
              placeholder={PROJECT_STATUS_META[s.id][lang]}
              aria-label={t(`Nombre para ${PROJECT_STATUS_META[s.id].es}`, `Name for ${PROJECT_STATUS_META[s.id].en}`)}
              onChange={(e) => setDraft(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
            <IconBtn label={t("Subir", "Move up")} disabled={i === 0} onClick={() => setDraft(move(rows, i, i - 1))}>
              <ArrowUp size={13} />
            </IconBtn>
            <IconBtn label={t("Bajar", "Move down")} disabled={i === rows.length - 1} onClick={() => setDraft(move(rows, i, i + 1))}>
              <ArrowDown size={13} />
            </IconBtn>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button type="button" className="ec-btn-primary" disabled={!draft || save.loading} onClick={() => draft && void save.run(draft.map((s) => ({ ...s, name: s.name.trim() })))}>
          {save.loading ? <Loader2 size={14} className="animate-spin" /> : null} {t("Guardar", "Save")}
        </button>
        {draft ? (
          <button type="button" className="ec-btn-secondary" onClick={() => setDraft(null)}>
            {t("Descartar cambios", "Discard changes")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

// ── Labels ───────────────────────────────────────────────────────────────────

function LabelsTab() {
  const { t } = useT();
  const usage = useResource("settings:labels", (api) => api.labelUsage());
  const [editing, setEditing] = useState<{ from: string; to: string } | null>(null);
  const [toDelete, setToDelete] = useState<LabelUsage | null>(null);
  const rename = useMutation((api, from: string, to: string) => api.renameLabel(from, to), {
    onSuccess: () => {
      setEditing(null);
      toast.success(t("Label renombrada", "Label renamed"));
    },
    onError: (m) => toast.error(m),
  });
  const remove = useMutation((api, label: string) => api.deleteLabel(label), {
    onSuccess: () => {
      setToDelete(null);
      toast.success(t("Label quitada", "Label removed"));
    },
    onError: (m) => toast.error(m),
  });
  const labels = usage.data ?? [];
  const merges = editing && labels.some((l) => l.label !== editing.from && l.label.toLowerCase() === editing.to.trim().toLowerCase());

  return (
    <section>
      <Hint>
        {t(
          "Labels de todas las tareas. Renombrar cambia la label en cada tarea; si el nombre nuevo ya existe, las dos se juntan. Borrar la quita de las tareas, pero no borra las tareas.",
          "Labels across all tasks. Renaming changes the label on every task; if the new name already exists, both merge. Deleting removes it from the tasks, but does not delete any task."
        )}
      </Hint>
      {usage.error ? <ErrorNotice message={usage.error} onRetry={usage.reload} /> : null}
      {usage.loading && !usage.data ? <Loading /> : null}
      {usage.data && !labels.length ? <p style={{ fontSize: 13, color: "var(--ec-text-muted)" }}>{t("Todavía no hay labels.", "No labels yet.")}</p> : null}
      <div style={{ display: "flex", flexDirection: "column", border: labels.length ? "1px solid var(--ec-hairline)" : undefined, borderRadius: 10 }}>
        {labels.map((l, i) => {
          const isEditing = editing?.from === l.label;
          return (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderTop: i ? "1px solid var(--ec-hairline)" : undefined }}>
              {isEditing ? (
                <form
                  style={{ display: "flex", gap: 6, flex: 1, alignItems: "center" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const to = editing.to.trim();
                    if (to && to !== l.label) void rename.run(l.label, to);
                  }}
                >
                  <input
                    className="ec-field-input"
                    style={{ padding: "6px 10px", fontSize: 13 }}
                    autoFocus
                    maxLength={60}
                    value={editing.to}
                    aria-label={t(`Nuevo nombre para ${l.label}`, `New name for ${l.label}`)}
                    onChange={(e) => setEditing({ from: l.label, to: e.target.value })}
                    onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                  />
                  <button type="submit" className="ec-btn-primary" style={{ fontSize: 12.5, whiteSpace: "nowrap" }} disabled={rename.loading || !editing.to.trim() || editing.to.trim() === l.label}>
                    {rename.loading ? <Loader2 size={13} className="animate-spin" /> : null} {merges ? t("Juntar", "Merge") : t("Guardar", "Save")}
                  </button>
                  <IconBtn label={t("Cancelar", "Cancel")} onClick={() => setEditing(null)}>
                    <X size={13} />
                  </IconBtn>
                </form>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 13.5, color: "var(--ec-text)", fontWeight: 500 }}>{l.label}</span>
                  <span className="font-mono-ec" style={{ fontSize: 11, color: "var(--ec-text-dim)" }}>
                    {l.count} {t(l.count === 1 ? "tarea" : "tareas", l.count === 1 ? "task" : "tasks")}
                  </span>
                  <button type="button" className="ec-btn-secondary" style={{ fontSize: 12.5, padding: "5px 10px" }} onClick={() => setEditing({ from: l.label, to: l.label })}>
                    {t("Renombrar", "Rename")}
                  </button>
                  <IconBtn label={t(`Borrar ${l.label}`, `Delete ${l.label}`)} danger onClick={() => setToDelete(l)}>
                    <Trash2 size={13} />
                  </IconBtn>
                </>
              )}
            </div>
          );
        })}
      </div>
      {merges ? (
        <p style={{ fontSize: 12.5, color: "var(--ec-text)", marginTop: 8 }}>
          {t("Ya existe una label con ese nombre: al guardar se juntan en una sola.", "A label with that name already exists: saving merges them into one.")}
        </p>
      ) : null}

      <Modal
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("Borrar label", "Delete label")}
        width={440}
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setToDelete(null)}>
              {t("Cancelar", "Cancel")}
            </button>
            <button type="button" className="ec-btn-primary" style={{ background: "var(--ec-danger)" }} disabled={remove.loading} onClick={() => toDelete && void remove.run(toDelete.label)}>
              {remove.loading ? <Loader2 size={14} className="animate-spin" /> : null} {t("Borrar", "Delete")}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13.5, color: "var(--ec-text-muted)", margin: 0 }}>
          {t(
            `Se quita «${toDelete?.label}» de ${toDelete?.count} tareas. Las tareas no se borran. No se puede deshacer.`,
            `“${toDelete?.label}” will be removed from ${toDelete?.count} tasks. The tasks are not deleted. This cannot be undone.`
          )}
        </p>
      </Modal>
    </section>
  );
}

// ── Tareas por paquete ───────────────────────────────────────────────────────

function PackagesTab() {
  const { t, lang } = useT();
  const options = packageOptions(lang);
  const [pkg, setPkg] = useState<PackageId>(options[0].id);
  const templates = useResource("package-templates", (api) => api.getPackageTemplates());
  // Borrador por paquete; se descarta al cambiar de paquete.
  const [draft, setDraft] = useState<TemplateTask[] | null>(null);
  const custom = templates.data?.[pkg];
  const rows = draft ?? custom ?? packageTemplateTasks(pkg, lang);
  const set = (next: TemplateTask[]) => setDraft(next);
  const save = useMutation((api, tasks: TemplateTask[]) => api.setPackageTemplate(pkg, tasks), {
    onSuccess: () => {
      setDraft(null);
      toast.success(t("Tareas del paquete guardadas", "Package tasks saved"));
    },
    onError: (m) => toast.error(m),
  });
  const reset = useMutation((api) => api.resetPackageTemplate(pkg), {
    onSuccess: () => {
      setDraft(null);
      toast.success(t("Se volvió a las tareas de siempre", "Back to the default tasks"));
    },
    onError: (m) => toast.error(m),
  });
  const invalid = rows.some((r) => !r.title.trim());

  return (
    <section>
      <Hint>
        {t(
          "Tareas que se crean al hacer un proyecto nuevo con este paquete. Solo cambia los proyectos nuevos; los que ya existen no se tocan. No cambia la página de precios del sitio.",
          "Tasks created when a new project uses this package. Only new projects change; existing ones are not touched. The site's pricing page does not change."
        )}
      </Hint>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <select
          className="ec-field-input"
          style={{ width: 280, padding: "7px 12px", fontSize: 13 }}
          value={pkg}
          aria-label={t("Paquete", "Package")}
          onChange={(e) => {
            setPkg(e.target.value as PackageId);
            setDraft(null);
          }}
        >
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.months ? ` · ${p.months} ${t("meses", "months")}` : ""}
            </option>
          ))}
        </select>
        <span className="font-mono-ec" style={{ fontSize: 11, color: "var(--ec-text-dim)" }}>
          {custom ? t("EDITADO", "EDITED") : t("TAREAS DE SIEMPRE", "DEFAULT TASKS")} · {rows.length}
        </span>
      </div>

      {templates.error ? <ErrorNotice message={templates.error} onRetry={templates.reload} /> : null}
      {templates.loading && !templates.data ? (
        <Loading />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", border: "1px solid var(--ec-hairline)", borderRadius: 10, padding: 10 }}>
              <span className="font-mono-ec" style={{ fontSize: 11, color: "var(--ec-text-dim)", paddingTop: 8, minWidth: 20 }}>{i + 1}</span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  className="ec-field-input"
                  style={{ padding: "6px 10px", fontSize: 13 }}
                  maxLength={300}
                  value={r.title}
                  placeholder={t("Título de la tarea", "Task title")}
                  aria-label={t(`Título de la tarea ${i + 1}`, `Task ${i + 1} title`)}
                  aria-invalid={!r.title.trim() || undefined}
                  onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                />
                <textarea
                  className="ec-field-input"
                  style={{ padding: "6px 10px", fontSize: 12.5 }}
                  rows={2}
                  maxLength={10000}
                  value={r.description ?? ""}
                  placeholder={t("Descripción (opcional)", "Description (optional)")}
                  aria-label={t(`Descripción de la tarea ${i + 1}`, `Task ${i + 1} description`)}
                  onChange={(e) => set(rows.map((x, j) => (j === i ? { ...x, description: e.target.value || null } : x)))}
                />
              </div>
              <IconBtn label={t("Subir", "Move up")} disabled={i === 0} onClick={() => set(move(rows, i, i - 1))}>
                <ArrowUp size={13} />
              </IconBtn>
              <IconBtn label={t("Bajar", "Move down")} disabled={i === rows.length - 1} onClick={() => set(move(rows, i, i + 1))}>
                <ArrowDown size={13} />
              </IconBtn>
              <IconBtn label={t(`Quitar tarea ${i + 1}`, `Remove task ${i + 1}`)} danger onClick={() => set(rows.filter((_, j) => j !== i))}>
                <Trash2 size={13} />
              </IconBtn>
            </div>
          ))}
          <button
            type="button"
            className="ec-btn-secondary"
            style={{ alignSelf: "flex-start", padding: "6px 12px", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }}
            disabled={rows.length >= 200}
            onClick={() => set([...rows, { title: "", description: null }])}
          >
            <Plus size={13} /> {t("Agregar tarea", "Add task")}
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          className="ec-btn-primary"
          disabled={!draft || invalid || save.loading}
          onClick={() => draft && void save.run(draft.map((r) => ({ title: r.title.trim(), description: r.description?.trim() || null })))}
        >
          {save.loading ? <Loader2 size={14} className="animate-spin" /> : null} {t("Guardar", "Save")}
        </button>
        {draft ? (
          <button type="button" className="ec-btn-secondary" onClick={() => setDraft(null)}>
            {t("Descartar cambios", "Discard changes")}
          </button>
        ) : null}
        {custom && !draft ? (
          <button type="button" className="ec-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} disabled={reset.loading} onClick={() => void reset.run()}>
            <RotateCcw size={13} /> {t("Volver a las tareas de siempre", "Back to default tasks")}
          </button>
        ) : null}
        {invalid ? (
          <span style={{ fontSize: 12.5, color: "var(--ec-danger)" }}>{t("Cada tarea necesita título.", "Every task needs a title.")}</span>
        ) : null}
      </div>
    </section>
  );
}
