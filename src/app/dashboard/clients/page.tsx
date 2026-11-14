"use client";

import { ClientTile } from "@/components/client-identity";
import { clientIdentity } from "@/lib/client-identity";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Loader2, Pencil, Plus, Search, Shield, Trash2, UserRound } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useLang } from "@/app/context/LangContext";
import { Modal } from "@/app/dashboard/webapp/crm/components/ui";
import { AppPermissionsEditor } from "@/components/app-permissions-editor";
import {
  clientInitials,
  createClient,
  createClientPage,
  deleteClient,
  deleteClientPage,
  listClients,
  updateClient,
  updateClientPage,
  type ClientAccount,
  type ClientPage,
} from "@/lib/clients";

type ClientForm = {
  userName: string;
  email: string;
  jobTitle: string;
  password: string;
  pageTitle: string;
};

type PageForm = {
  pageId: string | null;
  title: string;
  projectName: string;
  content: string;
};

const emptyClient: ClientForm = { userName: "", email: "", jobTitle: "", password: "", pageTitle: "" };
const emptyPage: PageForm = { pageId: null, title: "", projectName: "", content: "" };

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ClientsPage() {
  const { lang } = useLang();
  const es = lang === "es";

  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clientModal, setClientModal] = useState<{ mode: "create" | "edit"; client: ClientAccount | null } | null>(null);
  const [clientForm, setClientForm] = useState<ClientForm>(emptyClient);
  const [pageModal, setPageModal] = useState<{ client: ClientAccount; page: ClientPage | null } | null>(null);
  const [pageForm, setPageForm] = useState<PageForm>(emptyPage);
  const [permissionsFor, setPermissionsFor] = useState<ClientAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ClientAccount | null>(null);

  const load = () => {
    setLoading(true);
    listClients()
      .then(setClients)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Error al cargar clientes"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) =>
      [client.name, client.email, client.jobTitle ?? "", ...client.pages.map((page) => page.title)].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [clients, search]);

  const openCreate = () => {
    setClientForm(emptyClient);
    setClientModal({ mode: "create", client: null });
  };

  const openEdit = (client: ClientAccount) => {
    setClientForm({
      userName: client.name,
      email: client.email,
      jobTitle: client.jobTitle ?? "",
      password: "",
      pageTitle: "",
    });
    setClientModal({ mode: "edit", client });
  };

  const openPage = (client: ClientAccount, page: ClientPage | null) => {
    setPageForm(
      page
        ? { pageId: page.id, title: page.title, projectName: page.projectName, content: page.content ?? "" }
        : emptyPage
    );
    setPageModal({ client, page });
  };

  const saveClient = async () => {
    if (!clientForm.userName.trim() || !clientForm.email.trim()) {
      toast.error(es ? "Nombre y email son obligatorios" : "Name and email are required");
      return;
    }
    if (clientModal?.mode === "create" && clientForm.password.length < 6) {
      toast.error(es ? "La contrasena necesita 6 caracteres" : "Password needs 6 characters");
      return;
    }
    setSaving(true);
    try {
      if (clientModal?.mode === "create") {
        await createClient({
          email: clientForm.email.trim(),
          userName: clientForm.userName.trim(),
          password: clientForm.password,
          jobTitle: clientForm.jobTitle.trim() || null,
          page: clientForm.pageTitle.trim()
            ? { title: clientForm.pageTitle.trim(), projectName: slugify(clientForm.pageTitle), content: null }
            : null,
        });
        toast.success(es ? "Cliente creado" : "Client created");
      } else if (clientModal?.client) {
        await updateClient(clientModal.client.id, {
          email: clientForm.email.trim(),
          userName: clientForm.userName.trim(),
          jobTitle: clientForm.jobTitle.trim() || null,
          password: clientForm.password || undefined,
        });
        toast.success(es ? "Cliente actualizado" : "Client updated");
      }
      setClientModal(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar cliente");
    } finally {
      setSaving(false);
    }
  };

  const savePage = async () => {
    if (!pageModal) return;
    if (!pageForm.title.trim()) {
      toast.error(es ? "El titulo es obligatorio" : "Title is required");
      return;
    }
    setSaving(true);
    try {
      const input = {
        title: pageForm.title.trim(),
        projectName: slugify(pageForm.projectName || pageForm.title),
        content: pageForm.content.trim() || null,
      };
      if (pageForm.pageId) {
        await updateClientPage(pageModal.client.id, pageForm.pageId, input);
        toast.success(es ? "Pagina actualizada" : "Page updated");
      } else {
        await createClientPage(pageModal.client.id, input);
        toast.success(es ? "Pagina creada" : "Page created");
      }
      setPageModal(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar pagina");
    } finally {
      setSaving(false);
    }
  };

  const removeClient = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await deleteClient(confirmDelete.id);
      toast.success(es ? "Cliente eliminado" : "Client deleted");
      setConfirmDelete(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar cliente");
    } finally {
      setSaving(false);
    }
  };

  const removePage = async (client: ClientAccount, page: ClientPage) => {
    const ok = window.confirm(es ? `Eliminar la pagina "${page.title}" y sus entregables?` : `Delete the page "${page.title}" and its deliverables?`);
    if (!ok) return;
    try {
      await deleteClientPage(client.id, page.id);
      toast.success(es ? "Pagina eliminada" : "Page deleted");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar pagina");
    }
  };

  return (
    <div className="fade-in-up" style={{ padding: "28px 24px" }}>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <div className="h-eyebrow" style={{ marginBottom: 8 }}>CLIENTES</div>
          <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.025em", color: "var(--ec-text)" }}>
            Clientes
          </h1>
          <p style={{ fontSize: 14, color: "var(--ec-text-muted)", marginTop: 6 }}>
            {es ? "Cuentas, paginas de entregables y apps de cada cliente." : "Accounts, deliverable pages and apps for each client."}
          </p>
        </div>
        <button type="button" className="ec-btn-primary" onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", fontSize: 13 }}>
          <Plus size={15} /> {es ? "Nuevo cliente" : "New client"}
        </button>
      </div>

      <div style={{ position: "relative", maxWidth: 320, marginBottom: 18 }}>
        <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--ec-text-dim)", pointerEvents: "none" }} />
        <input
          className="ec-field-input"
          style={{ paddingLeft: 32, fontSize: 13 }}
          placeholder={es ? "Buscar cliente o pagina..." : "Search client or page..."}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ padding: 24, display: "flex", alignItems: "center", gap: 8, color: "var(--ec-text-muted)" }}>
          <Loader2 size={15} className="animate-spin" /> {es ? "Cargando clientes..." : "Loading clients..."}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ec-project-card" style={{ textAlign: "center", padding: "64px 20px", color: "var(--ec-text-muted)" }}>
          <UserRound size={38} style={{ margin: "0 auto 14px", opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>{es ? "Todavia no hay clientes." : "No clients yet."}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {filtered.map((client) => {
            const activeApps = client.apps.filter((app) => app.canView).length;
            return (
              <div key={client.id} className="ec-project-card" style={{ borderRadius: 14, overflow: "hidden", padding: 0 }}>
                <div style={{ padding: "16px 18px", display: "flex", gap: 12, alignItems: "center", borderBottom: "1px solid var(--ec-hairline)" }}>
                  <ClientTile identity={clientIdentity(client.name, { logoUrl: client.avatarUrl })} size={40} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ec-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ec-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.email}</div>
                    {client.jobTitle ? <div className="font-mono-ec" style={{ fontSize: 10.5, color: "var(--ec-text-dim)", marginTop: 2 }}>{client.jobTitle}</div> : null}
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <IconButton title={es ? "Permisos" : "Permissions"} onClick={() => setPermissionsFor(client)}><Shield size={13} /></IconButton>
                    <IconButton title={es ? "Editar" : "Edit"} onClick={() => openEdit(client)}><Pencil size={13} /></IconButton>
                    <IconButton title={es ? "Eliminar" : "Delete"} danger onClick={() => setConfirmDelete(client)}><Trash2 size={13} /></IconButton>
                  </div>
                </div>

                <div style={{ padding: "13px 18px" }}>
                  <div className="h-eyebrow" style={{ marginBottom: 8 }}>
                    {es ? "Paginas" : "Pages"} <span className="font-mono-ec" style={{ color: "var(--ec-text-dim)" }}>{client.pages.length}</span>
                  </div>
                  {client.pages.length === 0 ? (
                    <div style={{ fontSize: 12.5, color: "var(--ec-text-muted)", marginBottom: 10 }}>{es ? "Sin paginas de entregables." : "No deliverable pages yet."}</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                      {client.pages.map((page) => (
                        <div key={page.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <FileText size={13} style={{ color: "var(--ec-text-dim)", flexShrink: 0 }} />
                          <Link href={`/dashboard/client-page?p=${encodeURIComponent(page.projectName)}`} style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--ec-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {page.title}
                          </Link>
                          <span className="font-mono-ec" style={{ fontSize: 10, color: "var(--ec-text-dim)" }}>{page.deliverableCount} ent.</span>
                          <IconButton title={es ? "Editar pagina" : "Edit page"} onClick={() => openPage(client, page)}><Pencil size={11} /></IconButton>
                          <IconButton title={es ? "Eliminar pagina" : "Delete page"} danger onClick={() => removePage(client, page)}><Trash2 size={11} /></IconButton>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" className="ec-btn-secondary" onClick={() => openPage(client, null)} style={{ padding: "6px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Plus size={12} /> {es ? "Agregar pagina" : "Add page"}
                  </button>
                </div>

                <div style={{ padding: "11px 18px", borderTop: "1px solid var(--ec-hairline)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="font-mono-ec" style={{ fontSize: 10.5, color: "var(--ec-text-muted)" }}>{activeApps} APPS</span>
                  {client.projects.length ? (
                    <span className="font-mono-ec" style={{ fontSize: 10.5, color: "var(--ec-text-dim)" }}>{client.projects.length} PROYECTOS</span>
                  ) : null}
                  <span style={{ flex: 1 }} />
                  {client.projects.map((project) => (
                    <Link key={project.id} href={`/dashboard/workspace?view=project&id=${project.id}`} title={project.name} style={{ color: "var(--ec-brand)", display: "inline-flex" }}>
                      <ExternalLink size={12} />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(clientModal)}
        onOpenChange={(open) => !open && setClientModal(null)}
        title={clientModal?.mode === "create" ? (es ? "Nuevo cliente" : "New client") : es ? "Editar cliente" : "Edit client"}
        width={520}
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setClientModal(null)}>{es ? "Cancelar" : "Cancel"}</button>
            <button type="button" className="ec-btn-primary" onClick={saveClient} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} {es ? "Guardar" : "Save"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <Field label={es ? "Nombre" : "Name"}>
            <input className="ec-field-input" value={clientForm.userName} onChange={(event) => setClientForm((current) => ({ ...current, userName: event.target.value }))} />
          </Field>
          <Field label="Email">
            <input className="ec-field-input" type="email" value={clientForm.email} onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))} />
          </Field>
          <Field label={es ? "Puesto / empresa" : "Job title / company"}>
            <input className="ec-field-input" value={clientForm.jobTitle} onChange={(event) => setClientForm((current) => ({ ...current, jobTitle: event.target.value }))} />
          </Field>
          <Field label={clientModal?.mode === "create" ? (es ? "Contrasena" : "Password") : es ? "Nueva contrasena (opcional)" : "New password (optional)"}>
            <input className="ec-field-input" type="password" value={clientForm.password} onChange={(event) => setClientForm((current) => ({ ...current, password: event.target.value }))} placeholder="••••••" />
          </Field>
          {clientModal?.mode === "create" ? (
            <Field label={es ? "Primera pagina de entregables (opcional)" : "First deliverable page (optional)"}>
              <input className="ec-field-input" value={clientForm.pageTitle} onChange={(event) => setClientForm((current) => ({ ...current, pageTitle: event.target.value }))} placeholder={es ? "Ej. Proyecto Palmas" : "e.g. Palmas project"} />
            </Field>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(pageModal)}
        onOpenChange={(open) => !open && setPageModal(null)}
        title={pageForm.pageId ? (es ? "Editar pagina" : "Edit page") : es ? "Nueva pagina" : "New page"}
        width={540}
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setPageModal(null)}>{es ? "Cancelar" : "Cancel"}</button>
            <button type="button" className="ec-btn-primary" onClick={savePage} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} {es ? "Guardar" : "Save"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <Field label={es ? "Titulo" : "Title"}>
            <input className="ec-field-input" value={pageForm.title} onChange={(event) => setPageForm((current) => ({ ...current, title: event.target.value }))} />
          </Field>
          <Field label="URL /dashboard/...">
            <input
              className="ec-field-input"
              value={pageForm.projectName}
              onChange={(event) => setPageForm((current) => ({ ...current, projectName: event.target.value }))}
              placeholder={pageForm.title ? slugify(pageForm.title) : "proyecto-cliente"}
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5 }}
            />
          </Field>
          <Field label={es ? "Descripcion" : "Description"}>
            <textarea className="ec-field-input" rows={3} value={pageForm.content} onChange={(event) => setPageForm((current) => ({ ...current, content: event.target.value }))} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(permissionsFor)}
        onOpenChange={(open) => !open && setPermissionsFor(null)}
        title={permissionsFor ? `${es ? "Permisos" : "Permissions"} · ${permissionsFor.name}` : ""}
        width={620}
        footer={<button type="button" className="ec-btn-secondary" onClick={() => setPermissionsFor(null)}>{es ? "Cerrar" : "Close"}</button>}
      >
        {permissionsFor ? <AppPermissionsEditor userId={permissionsFor.id} onSaved={load} /> : null}
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={es ? "Eliminar cliente" : "Delete client"}
        width={440}
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setConfirmDelete(null)}>{es ? "Cancelar" : "Cancel"}</button>
            <button type="button" className="ec-btn-primary" onClick={removeClient} disabled={saving} style={{ background: "var(--ec-danger)" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} {es ? "Eliminar" : "Delete"}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13.5, color: "var(--ec-text-muted)", margin: 0 }}>
          {es
            ? `Se eliminara la cuenta de ${confirmDelete?.name}, sus paginas, entregables y permisos. Esta accion no se puede deshacer.`
            : `This will delete ${confirmDelete?.name}'s account, pages, deliverables and permissions. This cannot be undone.`}
        </p>
      </Modal>
    </div>
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

function IconButton({
  children,
  title,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid var(--ec-hairline)",
        background: "var(--ec-surface-1)",
        color: danger ? "var(--ec-danger)" : "var(--ec-text-muted)",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
