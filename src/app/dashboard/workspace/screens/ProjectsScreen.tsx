"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { EmptyState, ErrorNotice, Loading, PageHeader, StatTile } from "../../webapp/crm/components/ui";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { AvatarStack, DueDate, ProgressBar } from "../components/shared";
import { useResource, useWorkspace } from "../lib/hooks";
import { PROJECT_STATUS_META, useT } from "../lib/i18n";
import { packageName, packageOptions } from "../lib/packages";
import type { ProjectStatus, WorkProject } from "../lib/types";

type Filter = "all" | "mine" | ProjectStatus;

export function ProjectsScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const { t, lang } = useT();
  const { isAdmin, meId } = useWorkspace();
  const projects = useResource("projects", (api) => api.listProjects());
  const [filter, setFilter] = useState<Filter>("all");
  const [pkg, setPkg] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {visible.map((p) => (
          <ProjectCard key={p.id} project={p} onOpen={() => onOpen(p.id)} />
        ))}
      </div>

      {creating ? <ProjectFormModal onClose={() => setCreating(false)} onSaved={(p) => onOpen(p.id)} /> : null}
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: WorkProject; onOpen: () => void }) {
  const { t, lang } = useT();
  const { memberById } = useWorkspace();
  const status = PROJECT_STATUS_META[project.status];
  const client = memberById(project.clientId);
  const { done, total } = project.taskCounts;
  const pkg = packageName(project.packageId, lang);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="ec-project-card"
      style={{ textAlign: "left", color: "inherit", font: "inherit", borderTop: `3px solid ${project.color}` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.25 }}>{project.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--ec-text-muted)", marginTop: 3 }}>
            {client ? client.name : t("Interno", "Internal")}
          </div>
        </div>
        <span className={`ec-badge ${status.badge}`}>{status[lang]}</span>
      </div>
      {pkg ? (
        <div>
          <span className="ec-badge ec-badge-neutral">📦 {pkg}</span>
        </div>
      ) : null}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ec-text-muted)", marginBottom: 6 }}>
          <span>
            {done}/{total} {t("tareas", "tasks")}
          </span>
          <span>{total ? Math.round((done / total) * 100) : 0}%</span>
        </div>
        <ProgressBar done={done} total={total} color={project.color} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <AvatarStack ids={project.memberIds} max={5} />
        <DueDate date={project.dueDate} done={project.status === "completed"} />
      </div>
    </button>
  );
}
