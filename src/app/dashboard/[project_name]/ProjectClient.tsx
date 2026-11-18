/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { useAuth } from "@/app/context/AuthContext";
import { useLang } from "@/app/context/LangContext";
import { Target, Sparkles, Layers, TrendingUp, Zap, ExternalLink, Plus, MoreHorizontal, Eye, EyeOff, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ContentModal from "@/components/ContentModal";
import { BaseCardsModal } from "@/components/BaseCardsModal";
import { clientGroupFor, progressPct } from "@/lib/apps";
import { Chart } from "@/components/charts";
import { ClientTile } from "@/components/client-identity";
import { useClientResults } from "@/components/home/ClientResults";
import { clientIdentity } from "@/lib/client-identity";
import { useTaskProgress } from "@/lib/use-task-progress";

type Project = {
  id: number;
  id_user: number;
  title: string;
  percentage: number | null;
  content: string;
  project_name: string;
  created_at: string;
  next_review?: string;
};

type ProjectContentItem = {
  id: number;
  project_id: number;
  content_1: string;
  content_2: string;
  content_3: string;
  link: string;
  href: string;
  id_user: number;
  source: string;
  type: string;
  created_at: string;
  /** 0 visible; 1 oculta hasta completarla; 2 oculta a mano. Solo llega != 0 a un admin. */
  hidden?: number;
};

const CONTENT_TYPES_ES = [
  "Todos",
  "Business and Objectives",
  "MVP + IDEA",
  "Business strategy",
  "Growth Hacking strategy",
  "Apps",
];

const CONTENT_TYPES_EN = [
  "All",
  "Business and Objectives",
  "MVP + IDEA",
  "Business strategy",
  "Growth Hacking strategy",
  "Apps",
];

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const formatDate = (dateStr: string, lang: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = lang === "es" ? MONTHS_ES : MONTHS_EN;
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const PHASE_CONFIG = [
  {
    type: "Business and Objectives",
    icon: Target,
    accent: "var(--ec-d5)",
    label_es: "Business & Objectives",
    label_en: "Business & Objectives",
    desc_es: "Objetivos, KPIs y posicionamiento estratégico.",
    desc_en: "Goals, KPIs and strategic positioning.",
  },
  {
    type: "MVP + IDEA",
    icon: Sparkles,
    accent: "var(--ec-info)",
    label_es: "MVP + Idea",
    label_en: "MVP + Idea",
    desc_es: "Concepto inicial, hipótesis, alcance del MVP.",
    desc_en: "Initial concept, hypotheses, MVP scope.",
  },
  {
    type: "Business strategy",
    icon: Layers,
    accent: "var(--ec-success)",
    label_es: "Business Strategy",
    label_en: "Business Strategy",
    desc_es: "Plan de mercado, pricing y diferenciación.",
    desc_en: "Market plan, pricing and differentiation.",
  },
  {
    type: "Growth Hacking strategy",
    icon: TrendingUp,
    accent: "var(--ec-warning)",
    label_es: "Growth Hacking",
    label_en: "Growth Hacking",
    desc_es: "Experimentos, embudo y canales de adquisición.",
    desc_en: "Experiments, funnel and acquisition channels.",
  },
  {
    type: "Apps",
    icon: Zap,
    accent: "var(--ec-danger)",
    label_es: "Apps",
    label_en: "Apps",
    desc_es: "Aplicaciones especializadas conectadas al proyecto.",
    desc_en: "Specialized apps connected to the project.",
  },
];

export default function ProjectContent({ project: initialProject }: { project: Project[] }) {
  const { user } = useAuth();
  const { lang } = useLang();

  const [currentProject, setCurrentProject] = useState<Project | null>(initialProject[0] ?? null);
  const [contents, setContents] = useState<ProjectContentItem[]>([]);
  const [ownerEmailFromAdminLookup, setOwnerEmailFromAdminLookup] = useState<string>("");
  const [activeType, setActiveType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editContent, setEditContent] = useState<ProjectContentItem | null>(null);
  const [baseCardsOpen, setBaseCardsOpen] = useState(false);
  // Cambiarlo vuelve a pedir el contenido (despues de agregar cards base).
  const [reloadKey, setReloadKey] = useState(0);
  const [visibilityBusy, setVisibilityBusy] = useState<number | null>(null);
  const [visibilityError, setVisibilityError] = useState("");

  const removeContent = async (item: ProjectContentItem) => {
    const name = item.content_1 || item.type;
    const ok = window.confirm(
      lang === "es"
        ? `¿Eliminar la card "${name}"? Se borra para siempre, con su link e imagen.`
        : `Delete the card "${name}"? It is removed for good, with its link and image.`
    );
    if (!ok) return;
    setVisibilityBusy(item.id);
    setVisibilityError("");
    try {
      const res = await apiFetch(`/api/project_content/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(data?.error ?? data?.message ?? `${res.status}`);
      }
      setContents((prev) => prev.filter((c) => c.id !== item.id));
    } catch (e) {
      setVisibilityError(e instanceof Error ? e.message : "Error");
    } finally {
      setVisibilityBusy(null);
    }
  };

  const setVisibility = async (item: ProjectContentItem, hidden: boolean) => {
    setVisibilityBusy(item.id);
    setVisibilityError("");
    try {
      const res = await apiFetch(`/api/project_content/${item.id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden }),
      });
      const data = (await res.json().catch(() => null)) as { hidden?: number; error?: string; message?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? data?.message ?? `${res.status}`);
      setContents((prev) => prev.map((c) => (c.id === item.id ? { ...c, hidden: data?.hidden ?? (hidden ? 2 : 0) } : c)));
    } catch (e) {
      setVisibilityError(e instanceof Error ? e.message : "Error");
    } finally {
      setVisibilityBusy(null);
    }
  };

  const types = lang === "es" ? CONTENT_TYPES_ES : CONTENT_TYPES_EN;

  // Re-fetch project from API so id_user is always fresh
  useEffect(() => {
    if (!initialProject[0]?.project_name) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_URL}/api/project/${initialProject[0].project_name}`, { withCredentials: true })
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) setCurrentProject(res.data[0]);
      })
      .catch(() => {});
  }, [initialProject[0]?.project_name]);

  // Owner email shown in the header. A client viewing their own project already
  // has it; only admins (who may list users) ask the backend for the owner.
  // Previously every viewer downloaded the full user list for this.
  const viewerIsOwner = !!user && Number(user.id) === Number(currentProject?.id_user);
  const clientEmail = viewerIsOwner
    ? user?.email || user?.userName || ""
    : ownerEmailFromAdminLookup;

  useEffect(() => {
    if (!currentProject?.id_user || !user || viewerIsOwner) return;
    if (user.role !== "admin") return;
    axios
      .get(`${process.env.NEXT_PUBLIC_URL}/api/users`, { withCredentials: true })
      .then((res) => {
        const users: { id: number | string; email?: string; userName?: string }[] =
          Array.isArray(res.data) ? res.data : [];
        const owner = users.find((u) => Number(u.id) === Number(currentProject.id_user));
        setOwnerEmailFromAdminLookup(owner?.email || owner?.userName || "");
      })
      .catch(() => {});
  }, [currentProject?.id_user, user, viewerIsOwner]);

  useEffect(() => {
    if (user !== undefined) setAuthLoading(false);
  }, [user]);

  const isOwner = Number(user?.id) === currentProject?.id_user;
  const isAdmin = user?.role === "admin";
  const canAccess = isOwner || isAdmin;

  useEffect(() => {
    const fetchContents = async () => {
      if (!currentProject?.id || !canAccess) return;
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/api/project_content/${currentProject.id}`,
          { withCredentials: true }
        );
        setContents(Array.isArray(res.data) ? res.data : []);
      } catch {
        setContents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, [currentProject?.id, canAccess, reloadKey]);

  // Avance = tareas completadas del proyecto vinculado en Workspace (ya no el porcentaje escrito a mano).
  const taskProgress = useTaskProgress(currentProject?.project_name);
  const clientGroup = clientGroupFor(currentProject?.title, currentProject?.project_name);
  const results = useClientResults(clientGroup?.id);
  const identity = clientIdentity(currentProject?.title ?? "", { color: clientGroup?.color });
  const pct = progressPct(taskProgress);
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const step = 16;
    const increment = pct / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= pct) {
        setDisplayPct(pct);
        clearInterval(timer);
      } else {
        setDisplayPct(Math.round(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [pct]);

  const filteredContents = activeType
    ? contents.filter((item) => item.type === activeType)
    : contents;

  if (authLoading || !currentProject) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            width: 48, height: 48,
            borderRadius: "50%",
            border: "3px solid var(--ec-hairline-strong)",
            borderTopColor: "var(--ec-brand)",
            animation: "spin 700ms linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div
        style={{
          padding: "80px 40px",
          textAlign: "center",
        }}
      >
        <div className="h-eyebrow" style={{ marginBottom: 14 }}>⎯⎯⎯  ACCESS DENIED</div>
        <h1
          className="ec-page-title"
          style={{ fontSize: 36, marginBottom: 12 }}
        >
          {lang === "es" ? "Acceso denegado" : "Access Denied"}
        </h1>
        <p style={{ color: "var(--ec-text-muted)" }}>
          {lang === "es"
            ? "No tienes permiso para ver este contenido."
            : "You do not have permission to view this content."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="circuit-bg"
      style={{
        minHeight: "100vh",
        padding: "32px 40px 80px",
        background: "var(--ec-bg)",
      }}
    >
      {/* Client page = a report. The one screen that carries the brand gradient; results come before work. */}
      <div className="ec-chero fade-in-up">
        <div className="ec-chero-top">
          <span>
            {lang === "es" ? "Clientes" : "Clients"} / <b>{currentProject.project_name}</b>
          </span>
          {!taskProgress ? (
            <span className="ec-chero-pill">{lang === "es" ? "Sin plan de trabajo vinculado" : "No work plan linked"}</span>
          ) : taskProgress.total > 0 && taskProgress.done === taskProgress.total ? (
            <span className="ec-chero-pill">
              <span className="ec-glyph ec-glyph-ok" aria-hidden />
              {lang === "es" ? "Completado" : "Completed"}
            </span>
          ) : (
            <span className="ec-chero-pill">
              <span className="ec-glyph ec-glyph-ok" aria-hidden />
              {lang === "es" ? "En progreso" : "In progress"}
            </span>
          )}
        </div>

        <div className="ec-chero-id">
          <ClientTile identity={identity} size={60} radius={15} />
          <div style={{ minWidth: 0 }}>
            <h1 className="ec-display">{currentProject.title}</h1>
            {currentProject.content ? <p>{currentProject.content}</p> : null}
            <div className="ec-chero-meta">
              {clientEmail ? <span>{clientEmail}</span> : null}
              {currentProject.created_at ? (
                <span>
                  {lang === "es" ? "Desde" : "Since"} {formatDate(currentProject.created_at, lang)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="ec-chero-kpis">
          {(results.data?.metrics ?? []).map((m) => (
            <div key={m.key}>
              <b className="ec-num">{m.value}</b>
              <span>{lang === "es" ? m.es : m.en}</span>
              {m.prev !== undefined ? (
                <small>
                  {m.prev} {lang === "es" ? "el mes anterior" : "last month"}
                </small>
              ) : null}
            </div>
          ))}
          <div>
            <b className="ec-num">{taskProgress ? `${taskProgress.done} / ${taskProgress.total}` : "—"}</b>
            <span>{lang === "es" ? "Tareas del proyecto hechas" : "Project tasks done"}</span>
            {taskProgress ? <small>{displayPct}%</small> : null}
          </div>
          <div>
            <b className="ec-num">{contents.length}</b>
            <span>{lang === "es" ? "Entregables publicados" : "Published deliverables"}</span>
          </div>
        </div>
      </div>

      <div className="ec-creport fade-in-up">
        {results.data?.series ? (
          <section className="ec-hcard">
            <header>
              <h2>{lang === "es" ? results.data.series.es : results.data.series.en}</h2>
              <span>{lang === "es" ? "Últimas 12 semanas" : "Last 12 weeks"}</span>
            </header>
            <div style={{ padding: "12px 16px 10px" }}>
              <Chart
                type="bar"
                labels={results.data.series.labels}
                unit={lang === "es" ? results.data.series.unitEs : results.data.series.unitEn}
                ariaLabel={lang === "es" ? results.data.series.es : results.data.series.en}
                series={[{ name: lang === "es" ? results.data.series.es : results.data.series.en, values: results.data.series.values, color: "var(--ec-d2)" }]}
              />
            </div>
          </section>
        ) : results.failed ? (
          <section className="ec-hcard">
            <div className="ec-hempty">
              {lang === "es" ? "No se pudieron cargar los resultados del cliente. Intenta de nuevo más tarde." : "Could not load the client results. Try again later."}
            </div>
          </section>
        ) : null}
        <section className="ec-hcard">
          <header>
            <h2>{lang === "es" ? "Avance del proyecto" : "Project progress"}</h2>
            <span className="ec-num">{taskProgress ? `${pct}%` : ""}</span>
          </header>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="ec-bar ec-bar-lg" role="img" aria-label={`${pct}%`} style={{ flex: "none" }}>
              <i style={{ width: `${pct}%` }} />
            </div>
            <div style={{ fontSize: 13, color: "var(--ec-text-muted)" }}>
              {taskProgress
                ? lang === "es"
                  ? `${taskProgress.done} de ${taskProgress.total} tareas completadas`
                  : `${taskProgress.done} of ${taskProgress.total} tasks completed`
                : lang === "es" ? "Este cliente aún no tiene un proyecto vinculado en Workspace." : "This client has no linked Workspace project yet."}
            </div>
            <button
              onClick={() => { setModalMode("create"); setEditContent(null); setModalOpen(true); }}
              className="ec-btn-primary"
              style={{ alignSelf: "flex-start", padding: "8px 14px", fontSize: 12.5 }}
            >
              <Plus size={14} /> {lang === "es" ? "Crear contenido" : "Create content"}
            </button>
            {isAdmin ? (
              <button
                onClick={() => setBaseCardsOpen(true)}
                className="ec-btn-secondary"
                style={{ alignSelf: "flex-start", padding: "8px 14px", fontSize: 12.5 }}
              >
                <Layers size={14} /> {lang === "es" ? "Agregar cards base" : "Add base cards"}
              </button>
            ) : null}
          </div>
        </section>
      </div>

      {/* Phase filter strip */}
      <div className="fade-in-up" style={{ marginBottom: 32 }}>
        <div className="h-eyebrow" style={{ marginBottom: 14 }}>
          ⎯⎯⎯ {lang === "es" ? "FASES DEL PROYECTO" : "PROJECT PHASES"}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {PHASE_CONFIG.map((phase) => {
            const Ico = phase.icon;
            const count = contents.filter((c) => c.type === phase.type).length;
            const isActive = activeType === phase.type;
            return (
              <button
                key={phase.type}
                className="ec-phase-card"
                onClick={() => setActiveType(isActive ? "" : phase.type)}
                style={{
                  border: isActive
                    ? `1px solid ${phase.accent}`
                    : "1px solid var(--ec-hairline)",
                  boxShadow: isActive ? `0 0 0 4px color-mix(in srgb, ${phase.accent} 15%, transparent)` : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 32, height: 32,
                      borderRadius: 8,
                      background: `color-mix(in srgb, ${phase.accent} 10%, transparent)`,
                      color: phase.accent,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Ico size={16} />
                  </div>
                  <span
                    className="ec-badge ec-badge-mono"
                    style={{
                      background: `color-mix(in srgb, ${phase.accent} 8%, transparent)`,
                      color: phase.accent,
                      fontSize: 10,
                    }}
                  >
                    {count}
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      marginBottom: 2,
                      color: "var(--ec-text)",
                    }}
                  >
                    {lang === "es" ? phase.label_es : phase.label_en}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--ec-text-dim)",
                    }}
                  >
                    {lang === "es" ? phase.desc_es : phase.desc_en}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active filter label */}
        {activeType && (
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              className="h-eyebrow"
              style={{ fontSize: 9.5 }}
            >
              {lang === "es" ? "Filtro activo:" : "Active filter:"}
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: "var(--ec-brand)",
                fontWeight: 500,
              }}
            >
              {activeType}
            </span>
            <button
              onClick={() => setActiveType("")}
              style={{
                fontSize: 11,
                color: "var(--ec-text-dim)",
                background: "var(--ec-surface-1)",
                border: "1px solid var(--ec-hairline)",
                borderRadius: 6,
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              {lang === "es" ? "Limpiar" : "Clear"}
            </button>
          </div>
        )}
      </div>

      {/* Content section */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div className="h-eyebrow">
            ⎯⎯⎯ {lang === "es" ? "CONTENIDO" : "CONTENT"}{" "}
            <span className="font-mono-ec" style={{ fontSize: 10, marginLeft: 6 }}>
              ({filteredContents.length})
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "48px 0",
            }}
          >
            <div
              style={{
                width: 40, height: 40,
                borderRadius: "50%",
                border: "3px solid var(--ec-hairline-strong)",
                borderTopColor: "var(--ec-brand)",
                animation: "spin 700ms linear infinite",
              }}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredContents.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "64px 0",
            }}
          >
            <div className="h-eyebrow" style={{ marginBottom: 14 }}>
              {lang === "es" ? "SIN CONTENIDO" : "NO CONTENT"}
            </div>
            <h3
              className="font-serif"
              style={{
                fontSize: 28,
                fontWeight: 400,
                color: "var(--ec-text)",
                marginBottom: 8,
              }}
            >
              {lang === "es" ? "Sin elementos en esta fase" : "No items in this phase"}
            </h3>
            <p style={{ color: "var(--ec-text-muted)", fontSize: 14 }}>
              {lang === "es"
                ? "No hay contenido disponible para este filtro."
                : "No content available for this filter."}
            </p>
          </div>
        )}

        {visibilityError ? (
          <div role="alert" style={{ fontSize: 13, color: "var(--ec-danger)", marginBottom: 12 }}>
            {lang === "es" ? "No se pudo completar la acción: " : "Could not complete the action: "}
            {visibilityError}
          </div>
        ) : null}

        {/* Content cards grid */}
        {!loading && filteredContents.length > 0 && (
          <div
            className="stagger-children"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 18,
            }}
          >
            {filteredContents.map((item) => {
              const phase = PHASE_CONFIG.find((p) => p.type === item.type);
              const accent = phase?.accent ?? "var(--ec-brand)";

              return (
                <div
                  key={item.id}
                  style={{
                    background: "var(--ec-surface-1)",
                    border: "1px solid var(--ec-hairline-strong)",
                    borderRadius: 16,
                    overflow: "hidden",
                    transition: "all 220ms cubic-bezier(.2,.7,.2,1)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  className="ec-content-card"
                >
                  {/* Image */}
                  {item.source ? (
                    <div style={{ position: "relative", overflow: "hidden", height: 160 }}>
                      <img
                        src={`${process.env.NEXT_PUBLIC_URL}/${item.source}`}
                        alt={item.type}
                        style={{
                          width: "100%", height: "100%",
                          objectFit: "cover",
                          transition: "transform 300ms",
                        }}
                        loading="lazy"
                        className="ec-content-img"
                      />
                      <div style={{ position: "absolute", top: 8, right: 8 }}>
                        <button
                          onClick={() => { setEditContent(item); setModalMode("edit"); setModalOpen(true); }}
                          style={{
                            background: "rgba(0,0,0,0.5)",
                            border: "none",
                            borderRadius: 6,
                            width: 28, height: 28,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            color: "#fff",
                          }}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 80,
                        background: `color-mix(in srgb, ${accent} 6%, transparent)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderBottom: `1px solid color-mix(in srgb, ${accent} 15%, transparent)`,
                        position: "relative",
                      }}
                    >
                      {phase && (
                        <phase.icon
                          size={28}
                          style={{ color: accent, opacity: 0.7 }}
                        />
                      )}
                      <div style={{ position: "absolute", top: 8, right: 8 }}>
                        <button
                          onClick={() => { setEditContent(item); setModalMode("edit"); setModalOpen(true); }}
                          style={{
                            background: `color-mix(in srgb, ${accent} 13%, transparent)`,
                            border: "none",
                            borderRadius: 6,
                            width: 28, height: 28,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            color: accent,
                          }}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Solo admin: visibilidad para el cliente. La API ya no le manda al cliente las ocultas. */}
                  {isAdmin ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 20px",
                        borderBottom: "1px solid var(--ec-hairline)",
                        background: item.hidden ? "var(--ec-surface-2)" : "transparent",
                      }}
                    >
                      {item.hidden ? (
                        <span className="ec-badge ec-badge-warning" style={{ fontSize: 10.5 }}>
                          <EyeOff size={11} />{" "}
                          {item.hidden === 1
                            ? lang === "es" ? "Oculta hasta completarla" : "Hidden until complete"
                            : lang === "es" ? "Oculta para el cliente" : "Hidden from client"}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--ec-text-dim)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Eye size={11} /> {lang === "es" ? "Visible para el cliente" : "Visible to client"}
                        </span>
                      )}
                      <span style={{ flex: 1 }} />
                      <button
                        type="button"
                        className={item.hidden ? "ec-btn-primary" : "ec-btn-secondary"}
                        style={{ padding: "4px 10px", fontSize: 11.5 }}
                        disabled={visibilityBusy === item.id}
                        onClick={() => void setVisibility(item, !item.hidden)}
                      >
                        {item.hidden
                          ? lang === "es" ? "Publicar al cliente" : "Publish to client"
                          : lang === "es" ? "Ocultar" : "Hide"}
                      </button>
                      <button
                        type="button"
                        className="ec-btn-secondary"
                        style={{ padding: "4px 8px", fontSize: 11.5, color: "var(--ec-danger)" }}
                        disabled={visibilityBusy === item.id}
                        onClick={() => void removeContent(item)}
                        aria-label={lang === "es" ? `Eliminar la card "${item.content_1}"` : `Delete card "${item.content_1}"`}
                        title={lang === "es" ? "Eliminar card" : "Delete card"}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : null}

                  {/* Card body */}
                  <div
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      flex: 1,
                    }}
                  >
                    {/* Type badge */}
                    <span
                      className="ec-badge ec-badge-mono"
                      style={{ background: `color-mix(in srgb, ${accent} 8%, transparent)`, color: accent, alignSelf: "flex-start" }}
                    >
                      {item.type}
                    </span>

                    {/* Content */}
                    {item.content_1 && (
                      <h3
                        className="font-serif"
                        style={{
                          fontSize: 20,
                          fontWeight: 400,
                          color: "var(--ec-text)",
                          lineHeight: 1.25,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {item.content_1}
                      </h3>
                    )}

                    {item.content_2 && (
                      <p
                        style={{
                          fontSize: 13.5,
                          color: "var(--ec-text-muted)",
                          lineHeight: 1.55,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.content_2}
                      </p>
                    )}

                    {item.content_3 && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--ec-text-dim)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.content_3}
                      </p>
                    )}

                    {/* Link */}
                    {item.link && (
                      <div
                        style={{
                          marginTop: "auto",
                          paddingTop: 12,
                          borderTop: "1px solid var(--ec-hairline)",
                        }}
                      >
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: accent,
                            textDecoration: "none",
                            transition: "opacity 160ms",
                          }}
                        >
                          <ExternalLink size={13} />
                          <span>{item.href || (lang === "es" ? "Ver enlace" : "View link")}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && filteredContents.length > 0 && (
        <div
          className="font-mono-ec"
          style={{
            marginTop: 28,
            textAlign: "center",
            fontSize: 10.5,
            color: "var(--ec-text-dim)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {lang === "es" ? "Mostrando" : "Showing"} {filteredContents.length}{" "}
          {lang === "es" ? "de" : "of"} {contents.length}{" "}
          {lang === "es" ? "elementos" : "items"}
        </div>
      )}

      <ContentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        projectId={currentProject.id}
        content={editContent}
        onSaved={() => {
          const fetchContents = async () => {
            if (!currentProject?.id) return;
            setLoading(true);
            try {
              const res = await axios.get(
                `${process.env.NEXT_PUBLIC_URL}/api/project_content/${currentProject.id}`,
                { withCredentials: true }
              );
              setContents(Array.isArray(res.data) ? res.data : []);
            } catch {
              setContents([]);
            } finally {
              setLoading(false);
            }
          };
          fetchContents();
        }}
      />

      {isAdmin ? (
        <BaseCardsModal
          open={baseCardsOpen}
          onClose={() => setBaseCardsOpen(false)}
          pageId={currentProject.id}
          lang={lang}
          onAdded={() => setReloadKey((k) => k + 1)}
        />
      ) : null}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ec-content-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--ec-shadow-md);
        }
        .ec-content-card:hover .ec-content-img {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}
