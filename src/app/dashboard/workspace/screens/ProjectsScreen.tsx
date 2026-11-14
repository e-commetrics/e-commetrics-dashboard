"use client";

import { useMemo, useState } from "react";
import { Columns3, LayoutGrid, Plus, Search } from "lucide-react";
import { EmptyState, ErrorNotice, Loading, PageHeader, StatTile } from "../../webapp/crm/components/ui";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { ProjectCard, ProjectMini } from "../components/ProjectCard";
import { useResource, useWorkspace } from "../lib/hooks";
import { PROJECT_STATUS_META, useT } from "../lib/i18n";
import { packageOptions } from "../lib/packages";
import type { ProjectStatus } from "../lib/types";

type Filter = "all" | "mine" | ProjectStatus;

export function ProjectsScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const { t, lang } = useT();
  const { isAdmin, meId } = useWorkspace();
  const projects = useResource("projects", (api) => api.listProjects());
  const [filter, setFilter] = useState<Filter>("all");
  const [pkg, setPkg] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [layout, setLayout] = useState<"cards" | "board">("cards");

  const all = useMemo(() => projects.data ?? [], [projects.data]);
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((p) => {
      if (filter === "mine" && !(p.memberIds.includes(meId) || p.ownerId === meId)) return false;
      if (filter !== "all" && filter !== "mine" && p.status !== filter) return false;
      if (filter === "all" && p.status === "archived") return false;
      if (pkg && p.packageId !== pkg) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [all, filter, pkg, search, meId]);

  const openTasks = all.reduce((n, p) => n + (p.taskCounts.total - p.taskCounts.done), 0);
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("Todos", "All") },
    { id: "mine", label: t("Míos", "Mine") },
    { id: "active", label: PROJECT_STATUS_META.active[lang] },
    { id: "planning", label: PROJECT_STATUS_META.planning[lang] },
    { id: "on_hold", label: PROJECT_STATUS_META.on_hold[lang] },
    { id: "completed", label: PROJECT_STATUS_META.completed[lang] },
    { id: "archived", label: PROJECT_STATUS_META.archived[lang] },
  ];

  return (
    <div style={{ padding: 28 }}>
      <PageHeader
        eyebrow={`⎯⎯⎯  ${t("ESPACIO DE TRABAJO", "WORKSPACE")}`}
        title={t("Proyectos", "Projects")}
        subtitle={t("Cada proyecto atiende un paquete de Ecommetrica.", "Every project delivers an Ecommetrica package.")}
        actions={
          isAdmin ? (
            <button type="button" className="ec-btn-primary" onClick={() => setCreating(true)}>
              <Plus size={15} />
              {t("Nuevo proyecto", "New project")}
            </button>
          ) : null
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 22 }}>
        <StatTile label={t("Activos", "Active")} value={all.filter((p) => p.status === "active").length} tone="success" />
        <StatTile label={t("En planeación", "Planning")} value={all.filter((p) => p.status === "planning").length} />
        <StatTile label={t("En pausa", "On hold")} value={all.filter((p) => p.status === "on_hold").length} tone="warning" />
        <StatTile label={t("Tareas abiertas", "Open tasks")} value={openTasks} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <nav className="ec-segmented">
          {filters.map((f) => (
            <button key={f.id} type="button" className={filter === f.id ? "active" : ""} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </nav>
        <select className="ec-field-input" style={{ width: 200, padding: "7px 12px", fontSize: 13 }} value={pkg} onChange={(e) => setPkg(e.target.value)} aria-label={t("Paquete", "Package")}>
          <option value="">{t("Todos los paquetes", "All packages")}</option>
          {packageOptions(lang).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <nav className="ec-segmented" aria-label={t("Vista", "Layout")}>
          <button type="button" className={layout === "cards" ? "active" : ""} onClick={() => setLayout("cards")} aria-pressed={layout === "cards"}>
            <LayoutGrid size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 5 }} />
            {t("Tarjetas", "Cards")}
          </button>
          <button type="button" className={layout === "board" ? "active" : ""} onClick={() => setLayout("board")} aria-pressed={layout === "board"}>
            <Columns3 size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 5 }} />
            {t("Tablero", "Board")}
          </button>
        </nav>
        <div style={{ position: "relative", width: 240 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--ec-text-dim)" }} />
          <input className="ec-field-input" style={{ paddingLeft: 32, padding: "7px 12px 7px 32px", fontSize: 13 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("Buscar proyecto…", "Search projects…")} />
        </div>
      </div>

      {projects.loading && !projects.data ? <Loading /> : null}
      {projects.error ? <ErrorNotice message={projects.error} onRetry={projects.reload} /> : null}
      {projects.data && visible.length === 0 ? (
        <EmptyState
          title={t("No hay proyectos aquí.", "No projects here.")}
          hint={isAdmin ? t("Crea uno y elige su paquete: las tareas se generan solas.", "Create one and pick its package: tasks are generated for you.") : undefined}
        />
      ) : null}

      {layout === "cards" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} onOpen={() => onOpen(p.id)} />
          ))}
        </div>
      ) : (
        <div className="ec-pboard">
          {(["planning", "active", "on_hold", "completed"] as ProjectStatus[]).map((status) => {
            const list = visible.filter((p) => p.status === status);
            return (
              <section key={status} className="ec-pboard-col">
                <h3>
                  <span>{PROJECT_STATUS_META[status][lang]}</span>
                  <span className="ec-num">{list.length}</span>
                </h3>
                {list.map((p) => (
                  <ProjectMini key={p.id} project={p} onOpen={() => onOpen(p.id)} />
                ))}
              </section>
            );
          })}
        </div>
      )}

      {creating ? <ProjectFormModal onClose={() => setCreating(false)} onSaved={(p) => onOpen(p.id)} /> : null}
    </div>
  );
}
