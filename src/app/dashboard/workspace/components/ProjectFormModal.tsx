"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, X } from "lucide-react";
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
  initialClientId,
  onClose,
  onSaved,
}: {
  project?: WorkProject;
  /** Cliente preseleccionado al crear (p. ej. desde la página Clientes). */
  initialClientId?: string;
  onClose: () => void;
  onSaved?: (project: WorkProject) => void;
}) {
  const { t, lang } = useT();
  const { members, meId } = useWorkspace();
  const { projects: clientProjects, fetchProjects } = useAuth();
  const editing = Boolean(project);
  // Las páginas de AuthContext se cargan al iniciar sesión; se recargan para ver las creadas después en Clientes.
  useEffect(() => {
    void fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({ userName: "", email: "", jobTitle: "", password: "" });
  const [createClientPage, setCreateClientPage] = useState(false);
  const [pageSlug, setPageSlug] = useState(() => pageSlugFromName(project?.name ?? ""));
  const [pageSlugManual, setPageSlugManual] = useState(false);

  const [form, setForm] = useState<ProjectInput>(() => ({
    name: project?.name ?? "",
    description: project?.description ?? "",
    packageId: project?.packageId ?? "simple",
    clientId: project?.clientId ?? initialClientId ?? null,
    clientProjectName: project?.clientProjectName ?? null,
    status: project?.status ?? "planning",
    color: project?.color ?? PROJECT_COLORS[0],
    ownerId: project?.ownerId ?? meId,
    memberIds: project?.memberIds ?? [],
    startDate: project?.startDate ?? null,
    dueDate: project?.dueDate ?? null,
  }));
  const [seedTasks, setSeedTasks] = useState(true);
  const [stages, setStages] = useState<{ id?: string; name: string }[]>(() => project?.stages ?? []);
  // Tipo solo al crear: un proyecto CRM es simplemente uno con etapas.
  const [kind, setKind] = useState<"normal" | "crm">("normal");
  const showStages = editing || kind === "crm";
  const stagesChanged = JSON.stringify(stages) !== JSON.stringify(project?.stages ?? []);
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
    async (api, input: ProjectInput) => {
      if (!project) {
        const created = await api.createProject(input);
        return kind === "crm" && stages.length ? api.setProjectStages(created.id, stages) : created;
      }
      const saved = await api.updateProject(project.id, input);
      return stagesChanged ? api.setProjectStages(project.id, stages) : saved;
    },
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
    if (!editing && kind === "crm" && !stages.length) {
      toast.error(t("Un CRM necesita al menos una etapa", "A CRM needs at least one stage"));
      return;
    }
    if (showStages && stages.some((s) => !s.name.trim())) {
      toast.error(t("Ponle nombre a todas las etapas o quita las vacías", "Name every stage or remove the empty ones"));
      return;
    }
    if ((creatingClient || createClientPage) && !pageName) {
      toast.error(t("El nombre no genera un identificador válido para la página", "The name does not produce a valid page identifier"));
      return;
    }
    void save.run({
      ...form,
      name: form.name.trim(),
      description: form.description || null,
      templateTasks: !editing && kind === "normal" && seedTasks ? template : undefined,
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

      {!editing ? (
        <Field label={t("Tipo de tablero", "Board type")}>
          <nav className="ec-segmented">
            <button type="button" className={kind === "normal" ? "active" : ""} onClick={() => setKind("normal")}>
              {t("Normal · por estado", "Normal · by status")}
            </button>
            <button
              type="button"
              className={kind === "crm" ? "active" : ""}
              onClick={() => {
                setKind("crm");
                if (!stages.length) setStages(CRM_STAGES.map((name) => ({ name })));
              }}
            >
              {t("CRM · por etapas", "CRM · by stages")}
            </button>
          </nav>
        </Field>
      ) : null}

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
        {!creatingClient && form.clientId ? (
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
                {/* El PATCH no crea páginas: al editar, la página nueva se crea en Clientes. */}
                {!editing ? (
                  <option value="__new_page__">{t("+ Crear página con el nombre del proyecto", "+ Create page using project name")}</option>
                ) : null}
              </select>
            </Field>
            {editing && selectedClientPages.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--ec-text-muted)", marginTop: 6 }}>
                {t("Este cliente no tiene páginas. Créala en Clientes con «Agregar página».", "This client has no pages. Create one in Clients with “Add page”.")}
              </div>
            ) : null}
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

      <Field label={t("Color (solo si el cliente no tiene logo)", "Color (only when the client has no logo)")}>
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

      {showStages ? (
        <Field label={t("Etapas del tablero", "Board stages")}>
          <div style={{ fontSize: 12, color: "var(--ec-text-muted)", marginBottom: 8 }}>
            {t(
              "Columnas propias, como en ClickUp. Sin etapas, el tablero usa los estados de tarea. Si quitas una etapa, sus tareas quedan en «Sin etapa».",
              "Custom columns, like ClickUp. With no stages the board uses task statuses. Removing a stage moves its tasks to “No stage”."
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {stages.map((s, i) => (
              <div key={s.id ?? `new-${i}`} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  className="ec-field-input"
                  style={{ padding: "6px 10px", fontSize: 13 }}
                  maxLength={80}
                  value={s.name}
                  aria-label={t(`Etapa ${i + 1}`, `Stage ${i + 1}`)}
                  onChange={(e) => setStages((cur) => cur.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
                <StageBtn label={t("Subir", "Move up")} disabled={i === 0} onClick={() => setStages((cur) => swap(cur, i, i - 1))}>
                  <ArrowUp size={13} />
                </StageBtn>
                <StageBtn label={t("Bajar", "Move down")} disabled={i === stages.length - 1} onClick={() => setStages((cur) => swap(cur, i, i + 1))}>
                  <ArrowDown size={13} />
                </StageBtn>
                <StageBtn label={t("Quitar etapa", "Remove stage")} onClick={() => setStages((cur) => cur.filter((_, j) => j !== i))}>
                  <X size={13} />
                </StageBtn>
              </div>
            ))}
            <button
              type="button"
              className="ec-btn-secondary"
              style={{ alignSelf: "flex-start", padding: "6px 12px", fontSize: 12.5 }}
              onClick={() => setStages((cur) => [...cur, { name: "" }])}
              disabled={stages.length >= 30}
            >
              <Plus size={13} /> {t("Agregar etapa", "Add stage")}
            </button>
          </div>
        </Field>
      ) : null}

      {!editing && kind === "normal" && template.length > 0 ? (
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

/** Etapas iniciales de un CRM (las del CRM de ventas en ClickUp); se pueden editar antes de crear. */
const CRM_STAGES = ["Open Lead", "Presentation/Quotation", "Negotiation", "Client", "Partner (<1yr)", "Complete Old CX (>1yr)"];

function swap<T>(list: T[], a: number, b: number) {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

function StageBtn({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="ec-btn-secondary" style={{ padding: "6px 8px" }} aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
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
