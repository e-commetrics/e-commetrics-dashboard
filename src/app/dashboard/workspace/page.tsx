"use client";

import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { useSidebar } from "@/components/ui/sidebar";
import { CalendarDays, CheckSquare, FlaskConical, Inbox, FolderKanban, Megaphone, Users } from "lucide-react";
import { Loading } from "../webapp/crm/components/ui";
import { TaskDetailModal } from "./components/TaskDetailModal";
import { IS_MOCK } from "./lib/api";
import { useResource, useWorkspace, WorkspaceProvider } from "./lib/hooks";
import { useT } from "./lib/i18n";
import { useWorkspaceNav, type WorkspaceView } from "./lib/nav";
import { CalendarScreen } from "./screens/CalendarScreen";
import { InboxScreen } from "./screens/InboxScreen";
import { MyTasksScreen } from "./screens/MyTasksScreen";
import { ProjectScreen } from "./screens/ProjectScreen";
import { ProjectsScreen } from "./screens/ProjectsScreen";
import { TeamScreen } from "./screens/TeamScreen";
import { WallScreen } from "./screens/WallScreen";

/**
 * Espacio de trabajo: proyectos, tareas con subtareas, "mis tareas", muro y
 * equipo. Solo admins y empleados (RouteGuard + TEAM_ONLY_ROUTES en lib/apps).
 */
export default function WorkspacePage() {
  return (
    <WorkspaceProvider>
      <Suspense fallback={<Loading />}>
        <Workspace />
      </Suspense>
      <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
    </WorkspaceProvider>
  );
}

function Workspace() {
  const nav = useWorkspaceNav();
  const { t } = useT();
  const { meId } = useWorkspace();
  // Contador de no leidas para la pestana (sin contar cambios propios).
  const inbox = useResource("inbox:badge", (api) => api.listInbox());
  const unread = (inbox.data ?? []).filter((i) => !i.read && i.actorId !== meId).length;
  // Las pestanas repiten el menu lateral: solo se muestran cuando ese menu esta
  // colapsado (o en movil, donde el menu lateral va oculto).
  const { state, isMobile } = useSidebar();
  const showTabs = isMobile || state === "collapsed";

  const items: { view: WorkspaceView; label: string; icon: typeof FolderKanban }[] = [
    { view: "projects", label: t("Proyectos", "Projects"), icon: FolderKanban },
    { view: "inbox", label: t("Bandeja", "Inbox"), icon: Inbox },
    { view: "calendar", label: t("Calendario", "Calendar"), icon: CalendarDays },
    { view: "my-tasks", label: t("Mis tareas", "My tasks"), icon: CheckSquare },
    { view: "wall", label: t("Muro", "Wall"), icon: Megaphone },
    { view: "team", label: t("Equipo", "Team"), icon: Users },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--ec-bg)", display: "flex", flexDirection: "column", minWidth: 0, width: "100%", overflowX: "hidden" }}>
      {showTabs ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "10px 28px",
          borderBottom: "1px solid var(--ec-hairline)",
          background: "var(--ec-surface-1)",
          flexWrap: "wrap",
        }}
      >
        <nav className="ec-segmented">
          {items.map((item) => {
            const Icon = item.icon;
            const active = nav.view === item.view || (nav.view === "project" && item.view === "projects");
            return (
              <button
                key={item.view}
                type="button"
                className={active ? "active" : ""}
                onClick={() => nav.go(item.view)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon size={13} />
                {item.label}
                {item.view === "inbox" && unread ? (
                  <span
                    style={{
                      minWidth: 18,
                      height: 18,
                      padding: "0 5px",
                      borderRadius: 99,
                      background: "var(--ec-brand)",
                      color: "var(--ec-brand-on)",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        {IS_MOCK ? (
          <span
            className="ec-badge ec-badge-warning"
            title={t(
              "Los datos se guardan solo en este navegador hasta que el backend tenga /api/pm. Ver docs/workspace-api.md.",
              "Data is saved only in this browser until the backend has /api/pm. See docs/workspace-api.md."
            )}
            style={{ marginLeft: "auto" }}
          >
            <FlaskConical size={12} />
            {t("Datos de demostración", "Demo data")}
          </span>
        ) : null}
      </div>
      ) : null}

      <main style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {nav.view === "projects" ? <ProjectsScreen onOpen={nav.goProject} /> : null}
        {nav.view === "project" && nav.projectId ? (
          <ProjectScreen projectId={nav.projectId} onBack={() => nav.go("projects")} onOpenTask={nav.openTask} />
        ) : null}
        {nav.view === "inbox" ? <InboxScreen onOpenTask={nav.openTask} /> : null}
        {nav.view === "calendar" ? (
          <CalendarScreen projectId={nav.projectId} onSelectProject={nav.goCalendar} onOpenTask={nav.openTask} />
        ) : null}
        {nav.view === "my-tasks" ? <MyTasksScreen onOpenTask={nav.openTask} onOpenProject={nav.goProject} /> : null}
        {nav.view === "wall" ? <WallScreen onOpenProject={nav.goProject} /> : null}
        {nav.view === "team" ? <TeamScreen onOpenProject={nav.goProject} /> : null}
      </main>

      {nav.taskId ? <TaskDetailModal key={nav.taskId} taskId={nav.taskId} onClose={nav.closeTask} /> : null}
    </div>
  );
}
