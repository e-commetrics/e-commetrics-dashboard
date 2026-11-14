"use client";

// The project card is a signal, not a small page. It always answers, in this
// order: which project, is it on track, how far along, what is next, who is on it.
// Colour: the client's logo tile and rail (identity) and the health pill (status).

import { ClientDot, ClientTile } from "@/components/client-identity";
import { projectHealth, todayYMD, type ProjectHealth } from "@/components/home/stats";
import { progressPct } from "@/lib/apps";
import { clientIdentity, identityVars, initialsOf } from "@/lib/client-identity";
import { useWorkspace } from "../lib/hooks";
import { useT } from "../lib/i18n";
import { packageName } from "../lib/packages";
import type { WorkProject } from "../lib/types";
import { AvatarStack } from "./shared";

const GLYPH: Record<ProjectHealth["kind"], string> = { ok: "ec-glyph-ok", warn: "ec-glyph-warn", bad: "ec-glyph-bad", plain: "ec-glyph-idle" };

export function HealthPill({ health }: { health: ProjectHealth }) {
  const { t } = useT();
  return (
    <span className={`ec-pill ec-pill-${health.kind}`}>
      <span className={`ec-glyph ${GLYPH[health.kind]}`} aria-hidden />
      {t(health.es, health.en)}
    </span>
  );
}

/** Identity of a project: its client's logo and colour, or a readable step of the project colour. */
export function useProjectIdentity(project: Pick<WorkProject, "name" | "color" | "clientId">) {
  const { memberById } = useWorkspace();
  const client = project.clientId ? memberById(project.clientId) : undefined;
  const identity = clientIdentity(`${client?.name ?? ""} ${project.name}`.trim(), { color: project.color, logoUrl: client?.avatarUrl });
  return { client, identity: { ...identity, initials: initialsOf(client?.name ?? project.name) } };
}

export function healthOf(project: WorkProject): ProjectHealth {
  return projectHealth(project, project.taskCounts.overdue ?? 0, todayYMD());
}

function shortDay(date: string, lang: "es" | "en") {
  return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { day: "numeric", month: "short" });
}

export function ProjectCard({ project, onOpen }: { project: WorkProject; onOpen: () => void }) {
  const { t, lang } = useT();
  const { client, identity } = useProjectIdentity(project);
  const { done, total, overdue } = project.taskCounts;
  const pct = progressPct(project.taskCounts);
  const pkg = packageName(project.packageId, lang);
  const health = healthOf(project);
  const finished = project.status === "completed";

  return (
    <button type="button" onClick={onOpen} className="ec-pcard ec-client" style={identityVars(identity)}>
      <div className="ec-pcard-top">
        <ClientTile identity={identity} size={40} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="ec-pcard-name">{project.name}</div>
          <div className="ec-pcard-client">{client ? client.name : t("Interno", "Internal")}</div>
        </div>
        <HealthPill health={health} />
      </div>

      <div>
        <div className="ec-pcard-prog">
          <span>{t("Avance", "Progress")}</span>
          <b>
            {done} / {total} {t("tareas", "tasks")} · {pct}%
          </b>
        </div>
        <div className="ec-bar" role="img" aria-label={`${pct}%`} style={{ minWidth: 0 }}>
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="ec-pcard-next">
        {finished ? (
          <b>{t("Proyecto entregado", "Project delivered")}</b>
        ) : project.nextDue ? (
          <>
            {t("Próxima entrega", "Next delivery")}: <b>{project.nextDue.title}</b>, {shortDay(project.nextDue.dueDate, lang)}
          </>
        ) : project.dueDate ? (
          <>
            {t("Entrega del proyecto", "Project due")}: <b>{shortDay(project.dueDate, lang)}</b>
          </>
        ) : (
          t("Sin entregas con fecha", "No dated deliveries")
        )}
      </div>

      <div className="ec-pcard-foot">
        <AvatarStack ids={project.memberIds} max={4} />
        {pkg ? <span className="ec-badge ec-badge-neutral">{pkg}</span> : null}
        {overdue === undefined ? null : overdue > 0 ? (
          <span className="is-late">
            {overdue} {overdue === 1 ? t("vencida", "overdue") : t("vencidas", "overdue")}
          </span>
        ) : (
          <span>{t("Sin vencidas", "None overdue")}</span>
        )}
      </div>
    </button>
  );
}

/** Compact version for the board grouped by status. */
export function ProjectMini({ project, onOpen }: { project: WorkProject; onOpen: () => void }) {
  const { client } = useProjectIdentity(project);
  const pct = progressPct(project.taskCounts);
  return (
    <button type="button" className="ec-pmini" onClick={onOpen}>
      <span className="ec-pmini-name">
        <ClientDot name={`${client?.name ?? ""} ${project.name}`.trim()} color={project.color} size={10} square />
        {project.name}
      </span>
      <span className="ec-bar" role="img" aria-label={`${pct}%`} style={{ minWidth: 0, flex: "none" }}>
        <i style={{ width: `${pct}%` }} />
      </span>
      <span className="ec-pmini-meta">
        <span>
          {project.taskCounts.done} / {project.taskCounts.total}
        </span>
        <HealthPill health={healthOf(project)} />
      </span>
    </button>
  );
}
