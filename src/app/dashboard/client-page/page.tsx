"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, Loader2, Pencil, Shield } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useLang } from "@/app/context/LangContext";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { progressPct } from "@/lib/apps";
import { useTaskProgress } from "@/lib/use-task-progress";
import { Modal } from "@/app/dashboard/webapp/crm/components/ui";
import { AppPermissionsEditor } from "@/components/app-permissions-editor";
import {
  clientForPage,
  listClients,
  updateClientPage,
  type ClientAccount,
  type ClientPage,
} from "@/lib/clients";

type ProjectRow = {
  id: number;
  id_user: number;
  title: string;
  project_name: string;
  content: string | null;
  created_at: string;
};

type PageForm = { title: string; projectName: string; content: string };

function ClientPageView() {
  const params = useSearchParams();
  const projectName = params.get("p");
  const { lang } = useLang();
  const { user } = useAuth();
  const es = lang === "es";
  const isAdmin = user?.role === "admin";

  const [project, setProject] = useState<ProjectRow | null>(null);
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [permissions, setPermissions] = useState(false);
  const [form, setForm] = useState<PageForm>({ title: "", projectName: "", content: "" });
  const [saving, setSaving] = useState(false);

  const client = useMemo(() => clientForPage(clients, projectName), [clients, projectName]);
  const page = client?.pages.find((item) => item.projectName === projectName) ?? null;
  const linkedProject = client?.projects.find((item) => item.clientProjectName === projectName);
  const taskProgress = useTaskProgress(projectName);

  useEffect(() => {
    if (!projectName) {
      setLoading(false);
      setError(es ? "Falta el parametro ?p=<pagina>" : "Missing ?p=<page> parameter");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([
      apiFetch(`/api/project/${encodeURIComponent(projectName)}`).then(async (res) => {
        if (!res.ok) throw new Error(es ? "Pagina no encontrada" : "Page not found");
        const rows = (await res.json()) as ProjectRow[];
        return rows[0] ?? null;
      }),
      listClients(),
    ])
      .then(([row, list]) => {
        if (cancelled) return;
        if (!row) throw new Error(es ? "Pagina no encontrada" : "Page not found");
        setProject(row);
        setClients(list);
        setForm({ title: row.title, projectName: row.project_name, content: row.content ?? "" });
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Error"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectName, es]);

  const save = async () => {
    if (!client || !page) return;
    setSaving(true);
    try {
      await updateClientPage(client.id, page.id, {
        title: form.title.trim(),
        projectName: form.projectName.trim(),
        content: form.content.trim() || null,
      });
      toast.success(es ? "Pagina actualizada" : "Page updated");
      setEditing(false);
      if (form.projectName !== projectName) {
        window.location.href = `/dashboard/client-page?p=${encodeURIComponent(form.projectName)}`;
      } else {
        window.location.reload();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 28, display: "flex", alignItems: "center", gap: 8, color: "var(--ec-text-muted)" }}>
        <Loader2 size={16} className="animate-spin" /> {es ? "Cargando pagina..." : "Loading page..."}
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ padding: 40 }}>
        <p style={{ color: "var(--ec-danger)", fontSize: 14 }}>{error}</p>
        <Link href="/dashboard/clients" style={{ color: "var(--ec-brand)", fontSize: 13 }}>
          {es ? "Volver a clientes" : "Back to clients"}
        </Link>
      </div>
    );
  }

  const pct = progressPct(taskProgress);

  return (
    <div style={{ padding: "28px 24px 60px" }}>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Link href="/dashboard/clients" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ec-text-muted)", fontSize: 13, textDecoration: "none", marginBottom: 18 }}>
        <ArrowLeft size={14} /> {es ? "Clientes" : "Clients"}
      </Link>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <div className="h-eyebrow" style={{ marginBottom: 8 }}>{es ? "PAGINA DE ENTREGABLES" : "DELIVERABLES PAGE"}</div>
          <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.025em", color: "var(--ec-text)" }}>
            {project.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9, flexWrap: "wrap", fontSize: 13, color: "var(--ec-text-muted)" }}>
            <span className="font-mono-ec">/dashboard/{project.project_name}</span>
            {client ? <span>· {client.name} ({client.email})</span> : <span>· {es ? "Sin cliente asignado" : "No client assigned"}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isAdmin && client ? (
            <button type="button" className="ec-btn-secondary" onClick={() => setPermissions(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", fontSize: 12.5 }}>
              <Shield size={13} /> {es ? "Permisos" : "Permissions"}
            </button>
          ) : null}
          {isAdmin && client && page ? (
            <button type="button" className="ec-btn-secondary" onClick={() => setEditing(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", fontSize: 12.5 }}>
              <Pencil size={13} /> {es ? "Editar pagina" : "Edit page"}
            </button>
          ) : null}
          <Link href={`/dashboard/${encodeURIComponent(project.project_name)}`} className="ec-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", fontSize: 12.5, textDecoration: "none" }}>
            <ExternalLink size={13} /> {es ? "Ver pagina" : "View page"}
          </Link>
          {linkedProject ? (
            <Link href={`/dashboard/workspace?view=project&id=${linkedProject.id}`} className="ec-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", fontSize: 12.5, textDecoration: "none" }}>
              <FileText size={13} /> {es ? "Proyecto en Workspace" : "Workspace project"}
            </Link>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 1fr)", gap: 16 }}>
        <section className="ec-project-card" style={{ borderRadius: 14, padding: 20 }}>
          <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, marginBottom: 8 }}>{es ? "Descripcion" : "Description"}</h2>
          <p style={{ fontSize: 13.5, color: "var(--ec-text-muted)", lineHeight: 1.6, margin: 0 }}>
            {project.content || (es ? "Sin descripcion." : "No description.")}
          </p>
          <div className="h-eyebrow" style={{ marginTop: 20, marginBottom: 8 }}>{es ? "ENTREGABLES" : "DELIVERABLES"}</div>
          <div style={{ fontSize: 13, color: "var(--ec-text-muted)" }}>
            {page ? `${page.deliverableCount} ${es ? "elementos publicados" : "published items"}` : "—"}
          </div>
          <Link href={`/dashboard/${encodeURIComponent(project.project_name)}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 12.5, color: "var(--ec-brand)" }}>
            {es ? "Administrar entregables" : "Manage deliverables"} <ExternalLink size={11} />
          </Link>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section className="ec-project-card" style={{ borderRadius: 14, padding: 20 }}>
            <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, marginBottom: 12 }}>{es ? "Cliente" : "Client"}</h2>
            {client ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13 }}>
                <strong style={{ color: "var(--ec-text)" }}>{client.name}</strong>
                <span style={{ color: "var(--ec-text-muted)" }}>{client.email}</span>
                {client.jobTitle ? <span className="font-mono-ec" style={{ fontSize: 10.5, color: "var(--ec-text-dim)" }}>{client.jobTitle}</span> : null}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--ec-text-muted)", margin: 0 }}>{es ? "Esta pagina no pertenece a un cliente." : "This page has no client."}</p>
            )}
          </section>

          <section className="ec-project-card" style={{ borderRadius: 14, padding: 20 }}>
            <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, marginBottom: 12 }}>{es ? "Avance" : "Progress"}</h2>
            {taskProgress ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ec-text-muted)", marginBottom: 6 }}>
                  <span>{pct}%</span>
                  <span>{taskProgress.done}/{taskProgress.total}</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: "var(--ec-surface-2)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "var(--ec-brand)" }} />
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: "var(--ec-text-muted)", margin: 0 }}>{es ? "Sin proyecto de Workspace vinculado." : "No Workspace project linked."}</p>
            )}
          </section>

          {client && page ? (
            <section className="ec-project-card" style={{ borderRadius: 14, padding: 20 }}>
              <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, marginBottom: 10 }}>{es ? "Apps activas" : "Active apps"}</h2>
              {client.apps.filter((app) => app.canView).length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ec-text-muted)", margin: 0 }}>{es ? "Sin apps activas." : "No active apps."}</p>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {client.apps.filter((app) => app.canView).map((app) => (
                    <span key={app.component} className="ec-badge ec-badge-neutral">{app.component}</span>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>

      <Modal
        open={editing}
        onOpenChange={setEditing}
        title={es ? "Editar pagina" : "Edit page"}
        width={520}
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setEditing(false)}>{es ? "Cancelar" : "Cancel"}</button>
            <button type="button" className="ec-btn-primary" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} {es ? "Guardar" : "Save"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <Field label={es ? "Titulo" : "Title"}>
            <input className="ec-field-input" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </Field>
          <Field label="URL /dashboard/...">
            <input className="ec-field-input" value={form.projectName} onChange={(event) => setForm((current) => ({ ...current, projectName: event.target.value }))} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5 }} />
          </Field>
          <Field label={es ? "Descripcion" : "Description"}>
            <textarea className="ec-field-input" rows={3} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={permissions}
        onOpenChange={setPermissions}
        title={client ? `${es ? "Permisos" : "Permissions"} · ${client.name}` : ""}
        width={620}
        footer={<button type="button" className="ec-btn-secondary" onClick={() => setPermissions(false)}>{es ? "Cerrar" : "Close"}</button>}
      >
        {client ? (
          <AppPermissionsEditor
            userId={client.id}
            onSaved={(next) => {
              setClients((current) =>
                current.map((item) =>
                  item.id === client.id
                    ? { ...item, apps: next.map((permission) => ({ component: permission.component, canView: permission.can_view })) }
                    : item
                )
              );
            }}
          />
        ) : null}
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

export default function ClientPage() {
  return (
    <Suspense fallback={<div style={{ padding: 28 }}>Cargando...</div>}>
      <ClientPageView />
    </Suspense>
  );
}
