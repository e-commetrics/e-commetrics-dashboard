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

function pageSlugFromName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  const { projects: clientProjects, fetchProjects } = useAuth();
  const editing = Boolean(project);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({ userName: "", email: "", jobTitle: "", password: "" });
  const [createClientPage, setCreateClientPage] = useState(false);
  const [pageSlug, setPageSlug] = useState(() => pageSlugFromName(project?.name ?? ""));
  const [pageSlugManual, setPageSlugManual] = useState(false);

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
  const selectedClientPages = clientProjects.filter((page) => String(page.id_user) === form.clientId);
  const setProjectName = (name: string) => {
    set("name", name);
    if (!pageSlugManual) setPageSlug(pageSlugFromName(name));
  };

  const template = useMemo(
    () => (form.packageId ? packageTemplateTasks(form.packageId, lang) : []),
    [form.packageId, lang]
  );

  const save = useMutation(
    (api, input: ProjectInput) => (project ? api.updateProject(project.id, input) : api.createProject(input)),
    {
      onSuccess: (saved) => {
        toast.success(editing ? t("Proyecto actualizado", "Project updated") : t("Proyecto creado", "Project created"));
        if (!editing && (creatingClient || createClientPage)) void fetchProjects();
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
    if (creatingClient && (!newClient.email.trim() || newClient.password.length < 6)) {
      toast.error(t("Ingresa el email y una contraseña de al menos 6 caracteres", "Enter an email and a password of at least 6 characters"));
      return;
    }
    if (!creatingClient && createClientPage && !form.clientId) {
      toast.error(t("Selecciona un cliente para crear su página", "Select a client to create its page"));
      return;
    }
    const pageName = pageSlug.trim();
    if ((creatingClient || createClientPage) && !pageName) {
      toast.error(t("El nombre no genera un identificador válido para la página", "The name does not produce a valid page identifier"));
      return;
    }
    void save.run({
      ...form,
      name: form.name.trim(),
      description: form.description || null,
      templateTasks: !editing && seedTasks ? template : undefined,
      newClient: !editing && creatingClient
        ? {
            userName: newClient.userName.trim() || undefined,
            email: newClient.email.trim(),
            jobTitle: newClient.jobTitle.trim() || null,
            password: newClient.password,
          }
        : undefined,
      newClientPage: !editing && (creatingClient || createClientPage)
        ? {
            title: form.name.trim(),
            projectName: pageName,
            content: form.description?.slice(0, 500) || null,
          }
        : undefined,
      clientProjectName: !editing && (creatingClient || createClientPage) ? pageName : form.clientProjectName,
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
        <input className="ec-field-input" autoFocus value={form.name} onChange={(e) => setProjectName(e.target.value)} placeholder="Reforma Dental · Tracción" />
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
          <select
            className="ec-field-input"
            value={creatingClient ? "__new__" : form.clientId ?? ""}
            disabled={editing}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "__new__") {
                setCreatingClient(true);
                setCreateClientPage(false);
                setPageSlug(pageSlugFromName(form.name));
                setPageSlugManual(false);
                set("clientId", null);
                set("clientProjectName", null);
              } else {
                setCreatingClient(false);
                setCreateClientPage(false);
                setPageSlug(pageSlugFromName(form.name));
                setPageSlugManual(false);
                set("clientId", value || null);
                set("clientProjectName", null);
              }
            }}
          >
            <option value="">{t("Interno / sin cliente", "Internal / no client")}</option>
            {clientsOf(members).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            {!editing ? <option value="__new__">{t("+ Registrar nuevo cliente", "+ Register new client")}</option> : null}
          </select>
        </Field>
        {creatingClient ? (
          <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, border: "1px solid var(--ec-hairline)", borderRadius: 10, padding: 14, background: "var(--ec-surface-2)" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <strong style={{ display: "block", fontSize: 13.5 }}>{t("Registrar cliente nuevo", "Register a new client")}</strong>
              <span style={{ fontSize: 12, color: "var(--ec-text-muted)" }}>
                {t("También se creará su página de entregables.", "A deliverables page will also be created.")}
              </span>
            </div>
            <Field label={t("Nombre", "Name")}>
              <input className="ec-field-input" value={newClient.userName} onChange={(e) => setNewClient((c) => ({ ...c, userName: e.target.value }))} />
            </Field>
            <Field label="Email *">
              <input className="ec-field-input" type="email" required value={newClient.email} onChange={(e) => setNewClient((c) => ({ ...c, email: e.target.value }))} />
            </Field>
            <Field label={t("Empresa / puesto", "Company / job title")}>
              <input className="ec-field-input" value={newClient.jobTitle} onChange={(e) => setNewClient((c) => ({ ...c, jobTitle: e.target.value }))} />
            </Field>
            <Field label={t("Contraseña inicial *", "Initial password *")}>
              <input className="ec-field-input" type="password" minLength={6} required value={newClient.password} onChange={(e) => setNewClient((c) => ({ ...c, password: e.target.value }))} />
            </Field>
            <Field label={t("Identificador de la página *", "Page identifier *")}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span className="font-mono-ec" style={{ fontSize: 11, color: "var(--ec-text-dim)", whiteSpace: "nowrap" }}>/dashboard/</span>
                <input
                  className="ec-field-input"
                  required
                  maxLength={200}
                  value={pageSlug}
                  onChange={(e) => {
                    setPageSlug(pageSlugFromName(e.target.value));
                    setPageSlugManual(true);
                  }}
                  placeholder="nombre-del-proyecto"
                />
              </div>
            </Field>
          </div>
        ) : null}
        {!editing && !creatingClient && form.clientId ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={t("Página del cliente", "Client project page")}>
              <select
                className="ec-field-input"
                value={createClientPage ? "__new_page__" : form.clientProjectName ?? ""}
                onChange={(e) => {
                  if (e.target.value === "__new_page__") {
                    setCreateClientPage(true);
                    setPageSlug(pageSlugFromName(form.name));
                    setPageSlugManual(false);
                    set("clientProjectName", null);
                  } else {
                    setCreateClientPage(false);
                    set("clientProjectName", e.target.value || null);
                  }
                }}
              >
                <option value="">{t("Ninguna", "None")}</option>
                {selectedClientPages.map((p) => (
                  <option key={p.id} value={p.project_name}>
                    {p.title || p.project_name}
                  </option>
                ))}
                {form.clientProjectName && !selectedClientPages.some((p) => p.project_name === form.clientProjectName) ? (
                  <option value={form.clientProjectName}>{form.clientProjectName}</option>
                ) : null}
                <option value="__new_page__">{t("+ Crear página con el nombre del proyecto", "+ Create page using project name")}</option>
              </select>
            </Field>
            {createClientPage ? (
              <div style={{ marginTop: 10 }}>
                <Field label={t("Identificador de la página *", "Page identifier *")}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="font-mono-ec" style={{ fontSize: 11, color: "var(--ec-text-dim)", whiteSpace: "nowrap" }}>/dashboard/</span>
                    <input
                      className="ec-field-input"
                      required
                      maxLength={200}
                      value={pageSlug}
                      onChange={(e) => {
                        setPageSlug(pageSlugFromName(e.target.value));
                        setPageSlugManual(true);
                      }}
                      placeholder="nombre-del-proyecto"
                    />
                  </div>
                </Field>
              </div>
            ) : null}
          </div>
        ) : null}
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
