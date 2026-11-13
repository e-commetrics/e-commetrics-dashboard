"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getApi } from "@/app/dashboard/workspace/lib/api";
import { useT } from "@/app/dashboard/workspace/lib/i18n";
import { packageName } from "@/app/dashboard/workspace/lib/packages";
import type { ClientDeliverable, ClientProjectSummary } from "@/app/dashboard/workspace/lib/types";
import { APPS, appUrl, clientGroupFor, CLIENT_GROUPS, progressPct } from "@/lib/apps";
import { ClientResults } from "./ClientResults";

/**
 * Client home: one page about THEIR project. Progress (completed tasks),
 * what is being worked on, what was delivered, the results of their apps and
 * shortcuts to those apps. No team tools.
 */
export function ClientHome() {
  const { t, lang } = useT();
  const { user, projects, permissions } = useAuth();
  const locale = lang === "es" ? "es-MX" : "en-US";
  const [summary, setSummary] = useState<ClientProjectSummary[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getApi(user)
      .clientSummary()
      .then((list) => !cancelled && setSummary(list))
      .catch(() => !cancelled && setSummary([]));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const pages = useMemo(() => projects.filter((p) => p.id_user === Number(user?.id)), [projects, user?.id]);
  const myApps = useMemo(() => APPS.filter((a) => permissions.some((p) => p.component === a.component && p.can_view)), [permissions]);
  // The client is recognised by its apps first, then by the name of its project or page.
  const group = useMemo(
    () =>
      CLIENT_GROUPS.find((g) => myApps.some((a) => g.apps.includes(a.slug))) ??
      clientGroupFor(...(summary ?? []).flatMap((s) => [s.name, s.clientProjectName]), ...pages.flatMap((p) => [p.title, p.project_name])),
    [myApps, summary, pages]
  );

  const fmt = (iso: string | null) =>
    iso ? new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(locale, { day: "numeric", month: "short" }) : null;
  const firstName = (user?.name ?? "").trim().split(/\s+/)[0];
  const loading = summary === null;

  const row = (d: ClientDeliverable, kind: "progress" | "next" | "done") => (
    <div className="ec-hrow" key={`${kind}:${d.title}`}>
      {kind === "done" ? <CheckCircle2 size={15} style={{ color: "var(--ec-success)", flexShrink: 0 }} aria-hidden /> : <span className="ec-dot" style={{ background: kind === "progress" ? "var(--ec-brand)" : "var(--ec-border)" }} aria-hidden />}
      <span className="ec-hrow-main">{d.title}</span>
      {kind === "done" ? (
        <span className="ec-num" style={{ fontSize: 12, color: "var(--ec-text-muted)", whiteSpace: "nowrap" }}>{fmt(d.completedAt) ?? ""}</span>
      ) : d.status === "review" ? (
        <span className="ec-pill ec-pill-info">{t("En revisión", "In review")}</span>
      ) : d.dueDate ? (
        <span className="ec-num" style={{ fontSize: 12, color: "var(--ec-text-muted)", whiteSpace: "nowrap" }}>{t("Entrega", "Due")} {fmt(d.dueDate)}</span>
      ) : null}
    </div>
  );

  return (
    <div className="ec-home ec-home-narrow">
      <div className="ec-home-head">
        <div>
          <div className="ec-home-eyebrow">{t("Mi proyecto", "My project")}</div>
          <h1 className="ec-home-title">{firstName ? t(`Hola, ${firstName}`, `Hi, ${firstName}`) : t("Mi proyecto", "My project")}</h1>
          <div className="ec-home-sub">{t("Así va tu proyecto con Ecommetrica.", "Here is how your project with Ecommetrica is going.")}</div>
        </div>
      </div>

      {loading ? <section className="ec-hcard"><div className="ec-hempty">{t("Cargando tu proyecto…", "Loading your project…")}</div></section> : null}

      {!loading && summary.length === 0 ? (
        <section className="ec-hcard">
          <div className="ec-hempty">
            {pages.length > 0
              ? t("Tu plan de trabajo aún no está publicado aquí. Mientras tanto puedes revisar tus entregables abajo.", "Your work plan is not published here yet. Meanwhile, your deliverables are below.")
              : t("Tu proyecto aún no está publicado aquí. Tu equipo de Ecommetrica te avisará cuando lo esté.", "Your project is not published here yet. Your Ecommetrica team will let you know when it is.")}
          </div>
        </section>
      ) : null}

      {(summary ?? []).map((p) => {
        const pct = progressPct(p.taskCounts);
        const left = p.taskCounts.total - p.taskCounts.done;
        return (
          <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section className="ec-hcard">
              <header>
                <h2>{p.name}</h2>
                <span>{[packageName(p.packageId, lang), p.dueDate ? `${t("Entrega", "Due")} ${fmt(p.dueDate)}` : null].filter(Boolean).join(" · ")}</span>
              </header>
              <div className="ec-progress-hero">
                <b>{pct}%</b>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div className="ec-bar ec-bar-lg" role="img" aria-label={`${pct}%`}><i style={{ width: `${pct}%` }} /></div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--ec-text-muted)" }}>
                    {p.taskCounts.total === 0
                      ? t("Estamos armando el plan de trabajo.", "We are putting the work plan together.")
                      : left === 0
                        ? t(`Las ${p.taskCounts.total} tareas del proyecto están completas.`, `All ${p.taskCounts.total} project tasks are complete.`)
                        : t(`${p.taskCounts.done} de ${p.taskCounts.total} tareas completadas. Faltan ${left}.`, `${p.taskCounts.done} of ${p.taskCounts.total} tasks completed. ${left} to go.`)}
                  </div>
                </div>
              </div>
            </section>

            <div className="ec-home-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
              <section className="ec-hcard">
                <header><h2>{t("En lo que estamos trabajando", "What we are working on")}</h2></header>
                {p.inProgress.length + p.upNext.length === 0 ? (
                  <div className="ec-hempty">{t("Nada en curso por ahora.", "Nothing in progress right now.")}</div>
                ) : (
                  <>
                    {p.inProgress.map((d) => row(d, "progress"))}
                    {p.upNext.length > 0 ? <div className="ec-home-eyebrow" style={{ padding: "10px 16px 4px" }}>{t("Sigue", "Up next")}</div> : null}
                    {p.upNext.map((d) => row(d, "next"))}
                  </>
                )}
              </section>
              <section className="ec-hcard">
                <header>
                  <h2>{t("Entregado", "Delivered")}</h2>
                  {p.clientProjectName ? <Link href={`/dashboard/${p.clientProjectName}`}>{t("Ver entregables", "See deliverables")}</Link> : null}
                </header>
                {p.delivered.length === 0 ? <div className="ec-hempty">{t("Aún no hay entregas.", "No deliveries yet.")}</div> : p.delivered.map((d) => row(d, "done"))}
              </section>
            </div>
          </div>
        );
      })}

      {group ? <ClientResults group={group} linkToApp={myApps.length > 0} /> : null}

      {pages.length > 0 ? (
        <section className="ec-hcard">
          <header><h2>{t("Entregables", "Deliverables")}</h2></header>
          {pages.map((p) => (
            <Link key={p.id} href={`/dashboard/${p.project_name}`} className="ec-hrow">
              <span className="ec-hrow-main">{p.title}</span>
              <ArrowRight size={15} style={{ color: "var(--ec-text-muted)" }} aria-hidden />
            </Link>
          ))}
        </section>
      ) : null}

      {myApps.length > 0 ? (
        <section className="ec-hcard">
          <header><h2>{t("Mis apps", "My apps")}</h2></header>
          <div className="ec-apptiles">
            {myApps.map((a) => (
              <Link key={a.slug} href={appUrl(a.slug)} className="ec-apptile">
                <b>{t(a.es, a.en)}</b>
                <small>{t("Abrir", "Open")} →</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
