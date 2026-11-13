"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/app/context/LangContext";
import { appUrl, type ClientGroup } from "@/lib/apps";
import { hasClientResults, loadClientResults, type ClientResults as Results, type ResultMetric } from "@/lib/client-results";

function Delta({ metric, lang }: { metric: ResultMetric; lang: string }) {
  if (metric.prev === undefined) return <span>&nbsp;</span>;
  return <span>{metric.prev} {lang === "es" ? "el mes anterior" : "last month"}</span>;
}

/**
 * "Resultados" card of one client: bookings, income, appointments... read
 * from that client's own app. Lives inside the project (client home and the
 * Workspace project), not on the team home.
 */
export function ClientResults({ group, linkToApp = true }: { group: ClientGroup; linkToApp?: boolean }) {
  const { lang } = useLang();
  const es = lang === "es";
  const [state, setState] = useState<{ data: Results | null; failed: boolean }>({ data: null, failed: false });

  useEffect(() => {
    if (!hasClientResults(group.id)) return;
    let cancelled = false;
    loadClientResults(group.id)
      .then((data) => !cancelled && setState({ data, failed: false }))
      .catch(() => !cancelled && setState({ data: null, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [group.id]);

  if (!hasClientResults(group.id)) return null;

  return (
    <section className="ec-hcard" aria-label={es ? "Resultados" : "Results"}>
      <header>
        <h2>{es ? "Resultados" : "Results"} · {group.name}</h2>
        {linkToApp && state.data ? <Link href={appUrl(state.data.appSlug)}>{es ? "Ver detalle" : "See details"}</Link> : null}
      </header>
      {state.failed ? (
        <div className="ec-hempty">{es ? "No se pudieron cargar los resultados. Intenta de nuevo más tarde." : "Could not load the results. Try again later."}</div>
      ) : (
        <div className="ec-kpis">
          {(state.data?.metrics ?? PLACEHOLDER).map((m) => (
            <div className="ec-kpi" key={m.key}>
              <small>{es ? m.es : m.en}</small>
              <b>{m.value}</b>
              <Delta metric={m} lang={lang} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const PLACEHOLDER: ResultMetric[] = ["a", "b", "c"].map((key) => ({ key, es: "Cargando…", en: "Loading…", value: "—" }));
