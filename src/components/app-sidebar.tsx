"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  ChevronRight,
  FileText,
  FolderKanban,
  FolderOpen,
  Home,
  Inbox,
  LayoutGrid,
  Megaphone,
  QrCode,
  CreditCard,
  Shield,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TeamSwitcher } from "./team-switcher";
import { useAuth } from "@/app/context/AuthContext";
import { useLang } from "@/app/context/LangContext";
import { APPS, CLIENT_GROUPS, TOOL_APPS, appBySlug, appUrl, clientGroupFor, type AppDef } from "@/lib/apps";
import { getApi } from "@/app/dashboard/workspace/lib/api";

// Sidebar organised around how people work, not around the code:
//   team   → Inicio / Bandeja / Mis tareas / Calendario, then Workspace,
//            then one entry per client (its page + its apps), tools, admin.
//   client → Mi proyecto, its deliverables page(s) and its apps.

type Item = { key: string; href: string; es: string; en: string; icon: LucideIcon; badge?: number };

const TOOL_ICONS: Record<string, LucideIcon> = { qr: QrCode, vcard: CreditCard };

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar(props: AppSidebarProps) {
  const { user } = useAuth();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>{user && <TeamSwitcher user={user} />}</SidebarHeader>
      <SidebarContent>
        {/* useSearchParams needs a Suspense boundary in a static export. */}
        <React.Suspense fallback={null}>
          <SidebarNav />
        </React.Suspense>
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <NavUser
            user={{
              ...user,
              avatar: user.profileImage ? `${process.env.NEXT_PUBLIC_URL}${user.profileImage}` : undefined,
            }}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function SidebarNav() {
  const { user, projects = [], permissions = [] } = useAuth();
  const { lang } = useLang();
  const { setOpenMobile, isMobile } = useSidebar();
  const pathname = usePathname() ?? "";
  const view = useSearchParams().get("view");
  const t = (es: string, en: string) => (lang === "es" ? es : en);
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isAdmin = user?.role === "admin";
  const isTeam = isAdmin || user?.role === "employee";
  const unread = useUnreadInbox(isTeam);

  const canOpen = (app: AppDef) =>
    isAdmin || permissions.some((p) => p.component === app.component && p.can_view);

  const inWorkspace = pathname.startsWith("/dashboard/workspace");
  const wsActive = (v: string) => inWorkspace && ((view ?? "projects") === v || (v === "projects" && view === "project"));
  const ws = (v: string) => `/dashboard/workspace?view=${v}`;

  const link = (item: Item, active: boolean) => (
    <SidebarMenuItem key={item.key}>
      <SidebarMenuButton asChild isActive={active} tooltip={t(item.es, item.en)}>
        <Link href={item.href} onClick={closeMobile}>
          <item.icon />
          <span>{t(item.es, item.en)}</span>
        </Link>
      </SidebarMenuButton>
      {item.badge ? (
        <SidebarMenuBadge
          style={{ background: "var(--ec-brand)", color: "var(--ec-brand-on)", borderRadius: 99, fontSize: 11 }}
        >
          {item.badge > 99 ? "99+" : item.badge}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );

  // ── Client ────────────────────────────────────────────────────────────────
  if (!isTeam) {
    const mine = projects.filter((p) => p.id_user === Number(user?.id));
    const myApps = APPS.filter(canOpen);
    return (
      <>
        <SidebarGroup>
          <SidebarMenu>
            {link({ key: "home", href: "/dashboard", es: "Mi proyecto", en: "My project", icon: Home }, pathname === "/dashboard")}
            {mine.map((p) =>
              link(
                {
                  key: `p-${p.id}`,
                  href: `/dashboard/${p.project_name}`,
                  es: mine.length > 1 ? `Entregables · ${p.title ?? p.project_name}` : "Entregables",
                  en: mine.length > 1 ? `Deliverables · ${p.title ?? p.project_name}` : "Deliverables",
                  icon: FileText,
                },
                pathname === `/dashboard/${p.project_name}`
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
        {myApps.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("Mis apps", "My apps")}</SidebarGroupLabel>
            <SidebarMenu>
              {myApps.map((app) =>
                link(
                  { key: app.slug, href: appUrl(app.slug), es: app.es, en: app.en, icon: TOOL_ICONS[app.slug] ?? LayoutGrid },
                  pathname === appUrl(app.slug)
                )
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </>
    );
  }

  // ── Team (admin and employee) ─────────────────────────────────────────────
  const top: [Item, boolean][] = [
    [{ key: "home", href: "/dashboard", es: "Inicio", en: "Home", icon: Home }, pathname === "/dashboard"],
    [{ key: "inbox", href: ws("inbox"), es: "Bandeja", en: "Inbox", icon: Inbox, badge: unread }, wsActive("inbox")],
    [{ key: "my-tasks", href: ws("my-tasks"), es: "Mis tareas", en: "My tasks", icon: CheckSquare }, wsActive("my-tasks")],
    [{ key: "calendar", href: ws("calendar"), es: "Calendario", en: "Calendar", icon: CalendarDays }, wsActive("calendar")],
  ];
  const workspace: [Item, boolean][] = [
    [{ key: "projects", href: ws("projects"), es: "Proyectos", en: "Projects", icon: FolderKanban }, wsActive("projects")],
    [{ key: "wall", href: ws("wall"), es: "Muro", en: "Wall", icon: Megaphone }, wsActive("wall")],
    [{ key: "team", href: ws("team"), es: "Equipo", en: "Team", icon: Users }, wsActive("team")],
  ];

  // Client pages (the deliverables page each client sees), matched to a client by name.
  const pageOf = new Map<string, (typeof projects)[number][]>();
  const otherPages: typeof projects = [];
  projects.forEach((p) => {
    const g = clientGroupFor(p.project_name, p.title);
    if (g) pageOf.set(g.id, [...(pageOf.get(g.id) ?? []), p]);
    else otherPages.push(p);
  });

  const groups = CLIENT_GROUPS.map((g) => {
    const apps = g.apps.map(appBySlug).filter((a): a is AppDef => Boolean(a)).filter(canOpen);
    const pages = isAdmin ? pageOf.get(g.id) ?? [] : [];
    return { g, apps, pages };
  }).filter((x) => x.apps.length > 0 || x.pages.length > 0);

  const tools = TOOL_APPS.map(appBySlug).filter((a): a is AppDef => Boolean(a)).filter(canOpen);

  const admin: [Item, boolean][] = [
    [{ key: "users", href: "/dashboard/update-client", es: "Usuarios", en: "Users", icon: UserCog }, pathname.startsWith("/dashboard/update-client") || pathname.startsWith("/dashboard/create-client")],
    [{ key: "perms", href: "/dashboard/access-app", es: "Permisos", en: "Permissions", icon: Shield }, pathname.startsWith("/dashboard/access-app")],
    [{ key: "pages", href: "/dashboard/update-project", es: "Páginas de cliente", en: "Client pages", icon: FolderOpen }, pathname === "/dashboard/update-project" || pathname === "/dashboard/create-project"],
    [{ key: "content", href: "/dashboard/update-project-content", es: "Entregables", en: "Deliverables", icon: FileText }, pathname.includes("project-content")],
  ];

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>{top.map(([item, active]) => link(item, active))}</SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarMenu>{workspace.map(([item, active]) => link(item, active))}</SidebarMenu>
      </SidebarGroup>

      {(groups.length > 0 || (isAdmin && otherPages.length > 0)) && (
        <SidebarGroup>
          <SidebarGroupLabel>{t("Clientes", "Clients")}</SidebarGroupLabel>
          <SidebarMenu>
            {groups.map(({ g, apps, pages }) => {
              const urls = [...apps.map((a) => appUrl(a.slug)), ...pages.map((p) => `/dashboard/${p.project_name}`)];
              return (
                <ClientEntry key={g.id} name={g.name} color={g.color} active={urls.includes(pathname)}>
                  {pages.map((p) => (
                    <SubLink key={`p-${p.id}`} href={`/dashboard/${p.project_name}`} active={pathname === `/dashboard/${p.project_name}`} onClick={closeMobile}>
                      {t("Página del cliente", "Client page")}
                    </SubLink>
                  ))}
                  {apps.map((a) => (
                    <SubLink key={a.slug} href={appUrl(a.slug)} active={pathname === appUrl(a.slug)} onClick={closeMobile}>
                      {t(a.es, a.en)}
                    </SubLink>
                  ))}
                </ClientEntry>
              );
            })}
            {isAdmin && otherPages.length > 0 && (
              <ClientEntry
                name={t("Otros clientes", "Other clients")}
                color="var(--ec-text-faint)"
                active={otherPages.some((p) => pathname === `/dashboard/${p.project_name}`)}
              >
                {otherPages.map((p) => (
                  <SubLink key={p.id} href={`/dashboard/${p.project_name}`} active={pathname === `/dashboard/${p.project_name}`} onClick={closeMobile}>
                    {p.title ?? p.project_name}
                  </SubLink>
                ))}
              </ClientEntry>
            )}
          </SidebarMenu>
        </SidebarGroup>
      )}

      {tools.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>{t("Herramientas", "Tools")}</SidebarGroupLabel>
          <SidebarMenu>
            {tools.map((app) =>
              link(
                { key: app.slug, href: appUrl(app.slug), es: app.es, en: app.en, icon: TOOL_ICONS[app.slug] ?? LayoutGrid },
                pathname === appUrl(app.slug)
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      )}

      {isAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel>{t("Administración", "Administration")}</SidebarGroupLabel>
          <SidebarMenu>{admin.map(([item, active]) => link(item, active))}</SidebarMenu>
        </SidebarGroup>
      )}
    </>
  );
}

/** One client: a collapsible row with a colour dot, open when one of its pages is active. */
function ClientEntry({ name, color, active, children }: { name: string; color: string; active: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(active);
  const [wasActive, setWasActive] = React.useState(active);
  // Open the client whose page was just navigated to (state adjusted during render, no effect needed).
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setOpen(true);
  }
  return (
    <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={name}>
            <span
              aria-hidden
              style={{ width: 16, display: "inline-flex", justifyContent: "center", flexShrink: 0 }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            </span>
            <span>{name}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>{children}</SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function SubLink({ href, active, onClick, children }: { href: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={active}>
        <Link href={href} onClick={onClick}>
          <span>{children}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

/** Unread inbox count for the badge. Re-read on navigation and every minute. */
function useUnreadInbox(enabled: boolean): number {
  const { user } = useAuth();
  const pathname = usePathname();
  const view = useSearchParams().get("view");
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!enabled || !user) return;
    let cancelled = false;
    const api = getApi(user);
    const load = () =>
      Promise.all([api.listInbox(), api.me()])
        .then(([items, me]) => {
          if (!cancelled) setCount(items.filter((i) => !i.read && i.actorId !== me.id).length);
        })
        .catch(() => undefined);
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, user, pathname, view]);

  return enabled ? count : 0;
}
