"use client";

import { ClientDot } from "@/components/client-identity";
import { Mail } from "lucide-react";
import { ErrorNotice, Loading, PageHeader } from "../../webapp/crm/components/ui";
import { Avatar, employeesOf } from "../components/shared";
import { useResource, useWorkspace } from "../lib/hooks";
import { useT } from "../lib/i18n";

/**
 * El equipo: admins y empleados, con los proyectos en que participa cada uno.
 * Las altas se hacen en /dashboard/team, con rol employee o admin.
 */
export function TeamScreen({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const { t } = useT();
  const { members } = useWorkspace();
  const projects = useResource("projects", (api) => api.listProjects());
  const staff = employeesOf(members);

  return (
    <div style={{ padding: 28 }}>
      <PageHeader
        eyebrow={`⎯⎯⎯  ${t("ESPACIO DE TRABAJO", "WORKSPACE")}`}
        title={t("Equipo", "Team")}
        subtitle={t(`${staff.length} personas`, `${staff.length} people`)}
      />
      {projects.loading && !projects.data ? <Loading /> : null}
      {projects.error ? <ErrorNotice message={projects.error} onRetry={projects.reload} /> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {staff.map((m) => {
          const theirs = (projects.data ?? []).filter((p) => p.memberIds.includes(m.id) || p.ownerId === m.id);
          return (
            <div key={m.id} style={{ border: "1px solid var(--ec-hairline-strong)", borderRadius: 14, background: "var(--ec-surface-1)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar member={m} size={42} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{m.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ec-text-muted)" }}>{m.title ?? "—"}</div>
                </div>
                <span className={`ec-badge ${m.role === "admin" ? "ec-badge-brand" : "ec-badge-neutral"}`} style={{ marginLeft: "auto" }}>
                  {m.role === "admin" ? "Admin" : t("Empleado", "Employee")}
                </span>
              </div>
              <a href={`mailto:${m.email}`} style={{ fontSize: 12.5, color: "var(--ec-text-muted)", display: "inline-flex", gap: 6, alignItems: "center" }}>
                <Mail size={13} /> {m.email}
              </a>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {theirs.length === 0 ? <span style={{ fontSize: 12, color: "var(--ec-text-muted)" }}>{t("Sin proyectos", "No projects")}</span> : null}
                {theirs.map((p) => (
                  <button key={p.id} type="button" onClick={() => onOpenProject(p.id)} className="ec-badge ec-badge-neutral" style={{ border: "none", cursor: "pointer" }}>
                    <ClientDot name={p.name} color={p.color} size={8} square />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
