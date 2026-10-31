"use client";

import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { BarChart3, KanbanSquare, LogOut, Settings } from "lucide-react";
import { CrmDataProvider } from "./lib/hooks";
import { CrmSessionProvider, useCrmSession } from "./lib/session";
import { useCrmNav, type CrmView } from "./lib/nav";
import { LoginForm } from "./components/LoginForm";
import { NotificationBell } from "./components/NotificationBell";
import { Loading } from "./components/ui";
import { DashboardScreen } from "./screens/DashboardScreen";
import { LeadDetailScreen } from "./screens/LeadDetailScreen";
import { PipelineScreen } from "./screens/PipelineScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import "./crm.css";

// useSearchParams necesita un <Suspense> por encima o el build estatico falla:
// en un export estatico no hay request durante el prerender.
export default function CrmPage() {
  return (
    <CrmSessionProvider>
      <CrmDataProvider>
        <div className="crm-app">
          <Suspense fallback={<Loading label="Loading CRM…" />}>
            <CrmApp />
          </Suspense>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--ec-surface-1)",
                color: "var(--ec-text)",
                border: "1px solid var(--ec-hairline-strong)",
                fontSize: 13,
              },
            }}
          />
        </div>
      </CrmDataProvider>
    </CrmSessionProvider>
  );
}

function CrmApp() {
  const { status, user, logout } = useCrmSession();
  const nav = useCrmNav();

  if (status === "restoring") return <Loading label="Restoring session…" />;
  if (status === "anonymous") return <LoginForm />;

  return (
    <div className="crm-shell">
      <CrmTopbar
        view={nav.view}
        onNavigate={(next) => (next === "pipeline" ? nav.goPipeline() : next === "dashboard" ? nav.goDashboard() : nav.goSettings())}
        userName={user?.name ?? ""}
        onLogout={logout}
        onOpenLead={nav.goLead}
        onOpenBookings={nav.goBookings}
      />
      <main className="crm-main">
        {nav.view === "pipeline" ? (
          // El key reinicia la pestana cuando la campana lleva a Web bookings.
          <PipelineScreen key={nav.pipelineTab} initialTab={nav.pipelineTab} onOpenLead={nav.goLead} />
        ) : null}
        {nav.view === "dashboard" ? <DashboardScreen /> : null}
        {nav.view === "settings" ? <SettingsScreen /> : null}
        {nav.view === "lead" ? (
          nav.leadId ? (
            <LeadDetailScreen leadId={nav.leadId} onBack={nav.goPipeline} onOpenLead={nav.goLead} />
          ) : (
            <div className="crm-page">
              <p className="crm-muted">
                No lead selected.{" "}
                <button type="button" onClick={nav.goPipeline} className="crm-text-btn crm-link">
                  Back to pipeline
                </button>
              </p>
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}

const NAV_ITEMS: { view: CrmView; label: string; icon: typeof KanbanSquare }[] = [
  { view: "pipeline", label: "Pipeline", icon: KanbanSquare },
  { view: "dashboard", label: "Dashboard", icon: BarChart3 },
  { view: "settings", label: "Settings", icon: Settings },
];

function CrmTopbar({
  view,
  onNavigate,
  userName,
  onLogout,
  onOpenLead,
  onOpenBookings,
}: {
  view: CrmView;
  onNavigate: (next: CrmView) => void;
  userName: string;
  onLogout: () => void;
  onOpenLead: (id: string) => void;
  onOpenBookings: () => void;
}) {
  return (
    <header className="crm-topbar">
      <div className="crm-brand">
        <span className="crm-brand-name font-serif">CRM</span>
        <span className="crm-small">Reforma Dental</span>
      </div>

      <nav className="ec-segmented crm-nav" aria-label="CRM sections">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // En la ficha de un lead se mantiene "Pipeline" encendido, porque es la
          // pantalla de la que se salio. Marcar las cuatro a la vez seria raro.
          const active = view === item.view || (view === "lead" && item.view === "pipeline");
          return (
            <button
              key={item.view}
              type="button"
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(item.view)}
            >
              <Icon size={14} aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="crm-topbar-user">
        <NotificationBell onOpenLead={onOpenLead} onOpenBookings={onOpenBookings} />
        {userName ? <span className="crm-muted">{userName}</span> : null}
        <button type="button" className="crm-icon-btn" onClick={onLogout} aria-label="Sign out" title="Sign out">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
