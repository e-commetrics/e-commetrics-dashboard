"use client";

import { apiDashboard } from "../lib/api";
import { useResource } from "../lib/hooks";
import { ErrorNotice, Loading, PageHeader, Section, StatTile } from "../components/ui";

/**
 * Metricas del CRM. Mismos nueve numeros que el endpoint devuelve, sin mas: lo
 * que pide accion arriba y el estado general debajo.
 *
 * El "grafico de leads por etapa" son divs con el color de cada etapa, igual
 * que en el original. No hay libreria de charts en este dashboard y para seis
 * barras horizontales no hace falta una.
 */
export function DashboardScreen() {
  const dashboard = useResource("dashboard", apiDashboard);
  const data = dashboard.data;

  if (dashboard.loading && !data) return <Loading label="Loading metrics…" />;
  if (dashboard.error && !data) {
    return (
      <div className="crm-page">
        <ErrorNotice message={dashboard.error} onRetry={dashboard.reload} />
      </div>
    );
  }
  if (!data) return <Loading />;

  const maxStageCount = Math.max(1, ...data.leadsByStage.map((stage) => stage.count));
  const stageTotal = data.leadsByStage.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <div className="crm-page crm-page-wide">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle="Where the pipeline stands right now."
      />

      <div className="crm-tile-grid crm-attention">
        <StatTile
          label="Overdue tasks"
          value={data.tasksOverdue}
          tone={data.tasksOverdue > 0 ? "danger" : "default"}
        />
        <StatTile label="Open tasks" value={data.tasksOpen} />
        <StatTile
          label="Messages failed"
          value={data.messagesFailed}
          tone={data.messagesFailed > 0 ? "danger" : "default"}
        />
      </div>

      <div className="crm-dashboard-grid">
        <Section title="Leads by stage">
          <div className="crm-stage-rows">
            {data.leadsByStage.map((stage) => (
              <div key={stage.id} className="crm-stage-row">
                <span className="crm-muted">{stage.name}</span>
                <div className="ec-progress">
                  <div
                    className="ec-progress-bar"
                    style={{ width: `${(stage.count / maxStageCount) * 100}%`, background: stage.color }}
                  />
                </div>
                <span className="crm-stage-value">
                  {stage.count}
                  {stageTotal > 0 ? ` · ${Math.round((stage.count / stageTotal) * 100)}%` : ""}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Totals">
          <dl className="crm-stat-list">
            <div>
              <dt>Total leads</dt>
              <dd>{data.totalLeads}</dd>
            </div>
            <div>
              <dt>{data.conversionStageName ? `Conversion (${data.conversionStageName})` : "Conversion"}</dt>
              <dd style={data.conversionRate > 0 ? { color: "var(--ec-success)" } : undefined}>
                {data.conversionRate}%
              </dd>
            </div>
            <div>
              <dt>Facebook leads</dt>
              <dd>{data.leadsBySource.facebook}</dd>
            </div>
            <div>
              <dt>Manual + CSV leads</dt>
              <dd>{data.leadsBySource.manual + data.leadsBySource.csv}</dd>
            </div>
            <div>
              <dt>Messages sent</dt>
              <dd>{data.messagesSent}</dd>
            </div>
          </dl>
        </Section>
      </div>
    </div>
  );
}
