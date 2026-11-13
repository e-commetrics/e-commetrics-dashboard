"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";
import { Modal } from "../../webapp/crm/components/ui";
import { useMutation, useWorkspace } from "../lib/hooks";
import { PROJECT_COLORS, PROJECT_STATUS_META, useT } from "../lib/i18n";
import { packageOptions, packageTemplateTasks } from "../lib/packages";
import { PROJECT_STATUSES, type PackageId, type ProjectInput, type WorkProject } from "../lib/types";
import { MemberPicker, clientsOf, employeesOf } from "./shared";

/** Alta y edicion de proyecto. Solo admins. */
export function ProjectFormModal({
  project,
  onClose,
  onSaved,
}: {
  project?: WorkProject;
  onClose: () => void;
  onSaved?: (project: WorkProject) => void;
}) {
  const { t, lang } = useT();
  const { members, meId } = useWorkspace();
  const { projects: clientProjects } = useAuth();
  const editing = Boolean(project);

  const [form, setForm] = useState<ProjectInput>(() => ({
    name: project?.name ?? "",
    description: project?.description ?? "",
    packageId: project?.packageId ?? "simple",
    clientId: project?.clientId ?? null,
    clientProjectName: project?.clientProjectName ?? null,
    status: project?.status ?? "planning",
    color: project?.color ?? PROJECT_COLORS[0],
    ownerId: project?.ownerId ?? meId,
    memberIds: project?.memberIds ?? [],
    startDate: project?.startDate ?? null,
    dueDate: project?.dueDate ?? null,
  }));
  const [seedTasks, setSeedTasks] = useState(true);
  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const template = useMemo(
    () => (form.packageId ? packageTemplateTasks(form.packageId, lang) : []),
    [form.packageId, lang]
  );

  const save = useMutation(
    (api, input: ProjectInput) => (project ? api.updateProject(project.id, input) : api.createProject(input)),
    {
      onSuccess: (saved) => {
        toast.success(editing ? t("Proyecto actualizado", "Project updated") : t("Proyecto creado", "Project created"));
        onSaved?.(saved);
        onClose();
      },
      onError: (m) => toast.error(m),
    }
  );

  const submit = () => {
    if (!form.name.trim()) {
      toast.error(t("Ponle un nombre al proyecto", "Give the project a name"));
      return;
    }
    void save.run({
      ...form,
      name: form.name.trim(),
      description: form.description || null,
      templateTasks: !editing && seedTasks ? template : undefined,
    });
  };

  const staff = employeesOf(members);

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={editing ? t("Editar proyecto", "Edit project") : t("Nuevo proyecto", "New project")}
      width={640}
      footer={
        <>
          <button type="button" className="ec-btn-secondary" onClick={onClose}>
            {t("Cancelar", "Cancel")}
          </button>
          <button type="button" className="ec-btn-primary" onClick={submit} disabled={save.loading}>
            {save.loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {editing ? t("Guardar", "Save") : t("Crear proyecto", "Create project")}
          </button>
        </>
      }
    >
      <Field label={t("Nombre", "Name") + " *"}>
        <input className="ec-field-input" autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Reforma Dental · Tracción" />
      </Field>

      <Grid>
        <Field label={t("Paquete Ecommetrica", "Ecommetrica package")}>
          <select className="ec-field-input" value={form.packageId ?? ""} onChange={(e) => set("packageId", (e.target.value || null) as PackageId | null)}>
            <option value="">{t("Sin paquete", "No package")}</option>
            {packageOptions(lang).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.months ? ` · ${p.months} ${t("meses", "months")}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Estado", "Status")}>
          <select className="ec-field-input" value={form.status} onChange={(e) => set("status", e.target.value as ProjectInput["status"])}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_META[s][lang]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Cliente", "Client")}>
          <select className="ec-field-input" value={form.clientId ?? ""} onChange={(e) => set("clientId", e.target.value || null)}>
            <option value="">{t("Interno / sin cliente", "Internal / no client")}</option>
            {clientsOf(members).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Página del cliente", "Client project page")}>
          <select
            className="ec-field-input"
            value={form.clientProjectName ?? ""}
            onChange={(e) => set("clientProjectName", e.target.value || null)}
          >
            <option value="">{t("Ninguna", "None")}</option>
            {clientProjects.map((p) => (
              <option key={p.id} value={p.project_name}>
                {p.title || p.project_name}
              </option>
            ))}
            {form.clientProjectName && !clientProjects.some((p) => p.project_name === form.clientProjectName) ? (
              <option value={form.clientProjectName}>{form.clientProjectName}</option>
            ) : null}
          </select>
        </Field>
        <Field label={t("Responsable", "Owner")}>
          <select className="ec-field-input" value={form.ownerId ?? ""} onChange={(e) => set("ownerId", e.target.value || null)}>
            {staff.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Equipo", "Team")}>
          <MemberPicker value={form.memberIds ?? []} onChange={(ids) => set("memberIds", ids)} pool={staff} label={t("Agregar personas", "Add people")} />
        </Field>
        <Field label={t("Inicio", "Start")}>
          <input type="date" className="ec-field-input" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value || null)} />
        </Field>
        <Field label={t("Entrega", "Due")}>
          <input type="date" className="ec-field-input" value={form.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value || null)} />
        </Field>
      </Grid>

      <Field label={t("Color", "Color")}>
        <div style={{ display: "flex", gap: 8 }}>
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => set("color", c)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                background: c,
                border: form.color === c ? "2px solid var(--ec-text)" : "2px solid transparent",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </Field>

      <Field label={t("Descripción", "Description")}>
        <textarea className="ec-field-input" rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </Field>

      {!editing && template.length > 0 ? (
        <div style={{ border: "1px solid var(--ec-hairline)", borderRadius: 10, padding: 14, background: "var(--ec-surface-2)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
            <input type="checkbox" checked={seedTasks} onChange={(e) => setSeedTasks(e.target.checked)} />
            {t(
              `Crear ${template.length} tareas con las inclusiones del paquete`,
              `Create ${template.length} tasks from the package inclusions`
            )}
          </label>
          {seedTasks ? (
            <ul style={{ margin: "10px 0 0 26px", fontSize: 12.5, color: "var(--ec-text-muted)", listStyle: "disc", columns: 2 }}>
              {template.map((tpl) => (
                <li key={tpl.title}>{tpl.title}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="ec-field-label">{label}</span>
      {children}
    </div>
  );
}
