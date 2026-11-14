"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Shield, Trash2, Users } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";
import { useLang } from "@/app/context/LangContext";
import { apiFetch } from "@/lib/api";
import { Modal } from "@/app/dashboard/webapp/crm/components/ui";
import type { Member, Role } from "@/app/dashboard/workspace/lib/types";

type TeamForm = {
  userName: string;
  email: string;
  jobTitle: string;
  role: Role;
  password: string;
};

const emptyForm: TeamForm = { userName: "", email: "", jobTitle: "", role: "employee", password: "" };

export default function TeamPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const es = lang === "es";
  const isAdmin = user?.role === "admin";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<TeamForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch("/api/pm/members")
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo cargar el equipo");
        const data = (await res.json()) as { members: Member[] };
        setMembers(data.members.filter((member) => member.role !== "client"));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Error al cargar el equipo"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) =>
      [member.name, member.email, member.title ?? ""].some((value) => value.toLowerCase().includes(term))
    );
  }, [members, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (member: Member) => {
    setForm({
      userName: member.name,
      email: member.email,
      jobTitle: member.title ?? "",
      role: member.role,
      password: "",
    });
    setEditing(member);
    setCreating(false);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const submit = async () => {
    if (!form.userName.trim() || !form.email.trim()) {
      toast.error(es ? "Nombre y email son obligatorios" : "Name and email are required");
      return;
    }
    if (creating && form.password.length < 6) {
      toast.error(es ? "La contrasena necesita 6 caracteres" : "Password needs 6 characters");
      return;
    }
    setSaving(true);
    try {
      if (creating) {
        const res = await apiFetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            userName: form.userName.trim(),
            password: form.password,
            role: form.role,
            jobTitle: form.jobTitle.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(data?.message ?? "Error al crear usuario");
        }
        toast.success(es ? "Persona agregada al equipo" : "Team member added");
      } else if (editing) {
        const res = await apiFetch(`/api/users/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            userName: form.userName.trim(),
            role: form.role,
            jobTitle: form.jobTitle.trim() || null,
            password: form.password || undefined,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(data?.message ?? "Error al actualizar usuario");
        }
        toast.success(es ? "Equipo actualizado" : "Team updated");
      }
      close();
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/users/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Error al eliminar usuario");
      }
      toast.success(es ? "Persona eliminada" : "Person removed");
      setConfirmDelete(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fade-in-up" style={{ padding: "28px 24px" }}>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <div className="h-eyebrow" style={{ marginBottom: 8 }}>EQUIPO</div>
          <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.025em", color: "var(--ec-text)" }}>
            Equipo
          </h1>
          <p style={{ fontSize: 14, color: "var(--ec-text-muted)", marginTop: 6 }}>
            {es ? "Administradores y empleados con acceso al dashboard." : "Administrators and employees with dashboard access."}
          </p>
        </div>
        {isAdmin ? (
          <button type="button" className="ec-btn-primary" onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", fontSize: 13 }}>
            <Plus size={15} /> {es ? "Agregar persona" : "Add person"}
          </button>
        ) : null}
      </div>

      <div className="ec-project-card" style={{ borderRadius: 14, overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ec-hairline)", display: "flex", alignItems: "center", gap: 12 }}>
          <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, color: "var(--ec-text)" }}>
            Personas <span className="font-mono-ec" style={{ fontSize: 12, color: "var(--ec-text-dim)", marginLeft: 5 }}>{filtered.length}</span>
          </h2>
          <div style={{ flex: 1 }} />
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ec-text-dim)", pointerEvents: "none" }} />
            <input
              className="ec-field-input"
              style={{ padding: "7px 12px 7px 30px", fontSize: 12.5, width: 210 }}
              placeholder={es ? "Buscar..." : "Search..."}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24, display: "flex", gap: 8, alignItems: "center", color: "var(--ec-text-muted)" }}>
            <Loader2 size={15} className="animate-spin" /> {es ? "Cargando equipo..." : "Loading team..."}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ec-text-muted)" }}>
            <Users size={34} style={{ margin: "0 auto 12px", opacity: 0.35 }} />
            <p style={{ fontSize: 14 }}>{es ? "No hay personas en el equipo." : "No team members yet."}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, padding: 16 }}>
            {filtered.map((member) => (
              <div key={member.id} style={{ border: "1px solid var(--ec-hairline)", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 12, background: "var(--ec-surface-1)" }}>
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${process.env.NEXT_PUBLIC_URL}${member.avatarUrl}`} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div className="ec-avatar" style={{ width: 38, height: 38 }}>{member.name.charAt(0).toUpperCase()}</div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <strong style={{ fontSize: 14, color: "var(--ec-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.name}</strong>
                    {member.role === "admin" ? <Shield size={12} style={{ color: "var(--ec-brand)", flexShrink: 0 }} /> : null}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ec-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.email}</div>
                  <div className="font-mono-ec" style={{ fontSize: 10.5, color: "var(--ec-text-dim)", marginTop: 3 }}>
                    {member.role === "admin" ? "ADMIN" : "EMPLOYEE"}{member.title ? ` · ${member.title}` : ""}
                  </div>
                </div>
                {isAdmin ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="ec-btn-secondary" style={{ padding: "6px 9px" }} onClick={() => openEdit(member)} title={es ? "Editar" : "Edit"}>
                      <Pencil size={13} />
                    </button>
                    {String(member.id) !== String(user?.id) ? (
                      <button
                        type="button"
                        className="ec-btn-secondary"
                        style={{ padding: "6px 9px", color: "var(--ec-danger)" }}
                        onClick={() => setConfirmDelete(member)}
                        title={es ? "Eliminar" : "Delete"}
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={creating || Boolean(editing)}
        onOpenChange={(open) => !open && close()}
        title={creating ? (es ? "Agregar persona" : "Add person") : es ? "Editar persona" : "Edit person"}
        width={520}
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={close}>{es ? "Cancelar" : "Cancel"}</button>
            <button type="button" className="ec-btn-primary" onClick={submit} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null} {es ? "Guardar" : "Save"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <Field label={es ? "Nombre" : "Name"}>
            <input className="ec-field-input" value={form.userName} onChange={(event) => setForm((current) => ({ ...current, userName: event.target.value }))} />
          </Field>
          <Field label="Email">
            <input className="ec-field-input" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={es ? "Puesto" : "Job title"}>
              <input className="ec-field-input" value={form.jobTitle} onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))} />
            </Field>
            <Field label={es ? "Rol" : "Role"}>
              <select className="ec-field-input" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}>
                <option value="employee">{es ? "Empleado" : "Employee"}</option>
                <option value="admin">{es ? "Administrador" : "Administrator"}</option>
              </select>
            </Field>
          </div>
          <Field label={creating ? (es ? "Contrasena" : "Password") : es ? "Nueva contrasena (opcional)" : "New password (optional)"}>
            <input className="ec-field-input" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="••••••" />
          </Field>
          {!creating && editing && editing.role !== form.role ? (
            <p style={{ fontSize: 12, color: "var(--ec-warning)", margin: 0 }}>
              {es ? "El cambio de rol se aplica cuando la persona vuelva a iniciar sesion." : "Role changes apply the next time the person signs in."}
            </p>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={es ? "Eliminar persona" : "Remove person"}
        width={440}
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setConfirmDelete(null)}>{es ? "Cancelar" : "Cancel"}</button>
            <button type="button" className="ec-btn-primary" onClick={remove} disabled={deleting} style={{ background: "var(--ec-danger)" }}>
              {deleting ? <Loader2 size={14} className="animate-spin" /> : null} {es ? "Eliminar" : "Delete"}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13.5, color: "var(--ec-text-muted)", margin: 0 }}>
          {es
            ? `Se eliminara la cuenta de ${confirmDelete?.name}, sus tareas asignadas y su acceso al workspace. Esta accion no se puede deshacer.`
            : `This will delete ${confirmDelete?.name}'s account, task assignments and workspace access. This cannot be undone.`}
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
