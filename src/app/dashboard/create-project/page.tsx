"use client";

import { useAuth } from "@/app/context/AuthContext";
import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Briefcase, Users, FileText, Hash, Plus } from "lucide-react";
import { motion } from "motion/react";
import { apiFetch } from "@/lib/api";

type Client = {
  id: string;
  name: string;
  email: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CreateProject() {
  const { fetchProjects } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [clientId, setClientId] = useState("");
  const [newClient, setNewClient] = useState({ userName: "", email: "", jobTitle: "", password: "" });
  const [form, setForm] = useState({
    title: "",
    content: "",
    project_name: "",
    nameManual: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/api/clients")
      .then(async (res) => {
        if (!res.ok) throw new Error("Error cargando clientes");
        const data = (await res.json()) as { clients?: Client[] };
        const rows = Array.isArray(data.clients) ? data.clients : [];
        setClients(rows);
        if (rows.length === 0) setClientMode("new");
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Error cargando clientes"));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "title") {
      setForm((f) => ({
        ...f,
        title: value,
        project_name: f.nameManual ? f.project_name : slugify(value),
      }));
    } else if (name === "project_name") {
      setForm((f) => ({ ...f, project_name: slugify(value), nameManual: true }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!clientId && clientMode === "existing") || !form.title.trim() || !form.project_name.trim()) {
      toast.error("Selecciona un cliente y completa los campos obligatorios");
      return;
    }
    if (clientMode === "new") {
      if (!newClient.email.trim()) {
        toast.error("El email del cliente es obligatorio");
        return;
      }
      if (newClient.password.length < 6) {
        toast.error("La contraseña necesita al menos 6 caracteres");
        return;
      }
    }

    if (!slugify(form.project_name)) {
      toast.error("El nombre de la página debe incluir letras o números");
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch(`/api/pm/projects/with-dashboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(clientMode === "new"
            ? {
                newClient: {
                  userName: newClient.userName.trim(),
                  email: newClient.email.trim(),
                  jobTitle: newClient.jobTitle.trim() || null,
                  password: newClient.password,
                },
              }
            : { id_user: Number(clientId) }),
          title: form.title.trim(),
          content: form.content,
          project_name: form.project_name.trim(),
        }),
      });

      if (!res.ok) {
        const error = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(error?.error ?? error?.message ?? "Error al crear el proyecto");
      }

      toast.success("Página del cliente y proyecto de Workspace creados correctamente");
      setForm({ title: "", content: "", project_name: "", nameManual: false });
      setClientId("");
      setNewClient({ userName: "", email: "", jobTitle: "", password: "" });
      await fetchProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear el proyecto");
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    (clientMode === "existing" ? !!clientId : !!newClient.email.trim() && newClient.password.length >= 6) &&
    !!form.title.trim() &&
    !!form.project_name.trim();

  return (
    <div className="circuit-bg fade-in-up" style={{ padding: "32px 24px", minHeight: "100%" }}>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Centered icon header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg, var(--ec-brand), #7A0E3B)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
            color: "white",
            boxShadow: "0 12px 32px -8px rgba(189,21,92,0.5), 0 0 0 1px rgba(189,21,92,0.3)",
          }}>
            <Briefcase size={26} />
          </div>
          <div className="h-eyebrow" style={{ marginBottom: 10 }}>⎯⎯⎯  NUEVO PROYECTO</div>
          <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.025em", color: "var(--ec-text)", marginBottom: 10 }}>
            Crear Proyecto
          </h1>
          <p style={{ fontSize: 14, color: "var(--ec-text-muted)", maxWidth: 440, margin: "0 auto" }}>
            Se creará la página del cliente y su proyecto en Workspace en una sola acción.
          </p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          className="ec-project-card"
          style={{ padding: "28px 32px", borderRadius: 16 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
            <div>
              <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 400, color: "var(--ec-text)", display: "flex", alignItems: "center", gap: 8 }}>
                Configuración del Proyecto
              </h2>
              <p style={{ color: "var(--ec-text-muted)", fontSize: 13, marginTop: 4 }}>
                Completa la información básica del proyecto.
              </p>
            </div>
            <span className="ec-badge ec-badge-neutral ec-badge-mono">DRAFT</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Client selection and optional simplified client registration */}
            <div>
              <label className="ec-field-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <Users size={11} /> Cliente <span style={{ color: "var(--ec-danger)" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <button
                  type="button"
                  aria-pressed={clientMode === "existing"}
                  onClick={() => setClientMode("existing")}
                  className={clientMode === "existing" ? "ec-btn-primary" : "ec-btn-secondary"}
                  style={{ minHeight: 40 }}
                >
                  Elegir cliente existente
                </button>
                <button
                  type="button"
                  aria-pressed={clientMode === "new"}
                  onClick={() => {
                    setClientMode("new");
                    setClientId("");
                  }}
                  className={clientMode === "new" ? "ec-btn-primary" : "ec-btn-secondary"}
                  style={{ minHeight: 40 }}
                >
                  <Plus size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
                  Registrar cliente nuevo
                </button>
              </div>
              {clientMode === "existing" ? (
                <select
                  className="ec-field-input"
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name} · {client.email}</option>
                  ))}
                </select>
              ) : null}
            </div>

            {clientMode === "new" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 14, borderRadius: 10, border: "1px solid var(--ec-hairline)", background: "var(--ec-surface-2)" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong style={{ display: "block", fontSize: 14, color: "var(--ec-text)" }}>Datos del cliente nuevo</strong>
                  <span style={{ fontSize: 12, color: "var(--ec-text-muted)" }}>La cuenta y la página del cliente se crearán junto con el proyecto de Workspace.</span>
                </div>
                <label className="ec-field-label">
                  Nombre (opcional)
                  <input
                    className="ec-field-input"
                    value={newClient.userName}
                    onChange={(event) => setNewClient((current) => ({ ...current, userName: event.target.value }))}
                    placeholder="Nombre del cliente"
                    style={{ marginTop: 6 }}
                  />
                </label>
                <label className="ec-field-label">
                  Email *
                  <input
                    className="ec-field-input"
                    type="email"
                    value={newClient.email}
                    onChange={(event) => setNewClient((current) => ({ ...current, email: event.target.value }))}
                    required
                    style={{ marginTop: 6 }}
                  />
                </label>
                <label className="ec-field-label">
                  Empresa / puesto
                  <input
                    className="ec-field-input"
                    value={newClient.jobTitle}
                    onChange={(event) => setNewClient((current) => ({ ...current, jobTitle: event.target.value }))}
                    style={{ marginTop: 6 }}
                  />
                </label>
                <label className="ec-field-label">
                  Contraseña inicial *
                  <input
                    className="ec-field-input"
                    type="password"
                    minLength={6}
                    value={newClient.password}
                    onChange={(event) => setNewClient((current) => ({ ...current, password: event.target.value }))}
                    required
                    style={{ marginTop: 6 }}
                  />
                </label>
              </div>
            ) : null}

            {/* Title */}
            <div>
              <label className="ec-field-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <FileText size={11} /> Título del Proyecto <span style={{ color: "var(--ec-danger)" }}>*</span>
              </label>
              <input
                className="ec-field-input"
                type="text"
                name="title"
                placeholder="Ej. Desarrollo de aplicación web"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Slug with /dashboard/ prefix */}
            <div>
              <label className="ec-field-label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <Hash size={11} /> Nombre del Proyecto <span style={{ color: "var(--ec-danger)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--ec-text-dim)",
                  pointerEvents: "none", whiteSpace: "nowrap",
                }}>
                  /dashboard/
                </span>
                <input
                  className="ec-field-input"
                  type="text"
                  name="project_name"
                  placeholder="proyecto-web-2026"
                  value={form.project_name}
                  onChange={handleChange}
                  style={{ paddingLeft: 100, fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}
                  required
                />
              </div>
              <p className="font-mono-ec" style={{ fontSize: 11, color: "var(--ec-text-muted)", marginTop: 5 }}>
                Identificador único sin espacios (se generan guiones automáticamente).
              </p>
            </div>

            {/* El avance ya no se escribe a mano: son las tareas completadas del proyecto en Workspace. */}
            <div style={{ fontSize: 12.5, color: "var(--ec-text-muted)" }}>
              El progreso se calcula solo, con las tareas completadas del proyecto en Workspace.
            </div>

            {/* Description */}
            <div>
              <label className="ec-field-label" style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <FileText size={11} /> Descripción del Proyecto
                </span>
                <span className="font-mono-ec" style={{ fontSize: 10, color: "var(--ec-text-dim)" }}>
                  {form.content.length}/500
                </span>
              </label>
              <textarea
                className="ec-field-input"
                name="content"
                placeholder="Describe los objetivos, alcance y detalles importantes…"
                value={form.content}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="ec-btn-secondary"
                onClick={() => {
                  setForm({ title: "", content: "", project_name: "", nameManual: false });
                  setClientId("");
                  setNewClient({ userName: "", email: "", jobTitle: "", password: "" });
                }}
              >
                Limpiar
              </button>
              <button
                type="submit"
                disabled={loading || !isValid}
                className="ec-btn-primary"
                style={{ flex: 1, height: 44, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                    Creando proyecto…
                  </>
                ) : (
                  <><Plus size={15} /> Crear Proyecto</>
                )}
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--ec-text-dim)" }}>
              Los campos marcados con <span style={{ color: "var(--ec-danger)" }}>*</span> son obligatorios.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
