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
  Home,
  Inbox,
  LayoutGrid,
  Megaphone,
  Pin,
  QrCode,
  CreditCard,
  Shield,
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
  SidebarMenuAction,
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
import { APPS, CLIENT_GROUPS, TOOL_APPS, appBySlug, appUrl, clientGroupFor, type AppDef, type ClientGroup } from "@/lib/apps";
import { getApi } from "@/app/dashboard/workspace/lib/api";
import { apiFetch } from "@/lib/api";
import { ClientDot, ClientTile } from "@/components/client-identity";
import { clientIdentity } from "@/lib/client-identity";
import type { ClientAccount } from "@/lib/clients";

const CLIENT_COLORS = ["#EB6834", "#EDA100", "#C2185B", "#6250D6", "#1BAF7A", "#2A78D6"];

// Sidebar organised around how people work, not around the code:
//   team   → Inicio / Bandeja / Mis tareas / Calendario, then Workspace,
//            then one entry per client (its page + its apps), tools, admin.
//   client → Mi proyecto, its deliverables page(s) and its apps.

type Item = { key: string; href: string; es: string; en: string; icon: LucideIcon; badge?: number };

type SidebarPage = { id: string; title: string; projectName: string };
/** `pinKey` es estable (no cambia si la cuenta del cliente tarda en cargar): "group-<id>" o "client-<id>". */
type SidebarClient = { key: string; pinKey: string; name: string; color: string; apps: AppDef[]; pages: SidebarPage[] };

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
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const t = (es: string, en: string) => (lang === "es" ? es : en);
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isAdmin = user?.role === "admin";
  const isTeam = isAdmin || user?.role === "employee";
  const unread = useUnreadInbox(isTeam);

  const [clients, setClients] = React.useState<ClientAccount[]>([]);
  React.useEffect(() => {
    if (!isTeam) return;
    let cancelled = false;
    apiFetch("/api/clients")
      .then(async (res) => {
        if (!res.ok) throw new Error("clients");
        // El backend responde { clients: [...] }; antes se esperaba la lista directa y nunca cargaba.
        const data = (await res.json()) as ClientAccount[] | { clients?: ClientAccount[] };
        return Array.isArray(data) ? data : data.clients ?? [];
      })
      .then((rows) => !cancelled && setClients(rows))
      .catch(() => !cancelled && setClients([]));
    return () => {
      cancelled = true;
    };
  }, [isTeam, pathname]);

  // Clientes fijados: preferencia de la cuenta (GET/PUT /api/me/sidebar-pins), te sigue en cualquier equipo.
  const [pins, setPins] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiFetch("/api/me/sidebar-pins")
      .then(async (res) => (res.ok ? ((await res.json()) as { pins?: string[] }).pins ?? [] : []))
      .then((rows) => !cancelled && setPins(rows))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const togglePin = (pinKey: string) => {
    const prev = pins;
    const next = prev.includes(pinKey) ? prev.filter((k) => k !== pinKey) : [...prev, pinKey];
    setPins(next);
    apiFetch("/api/me/sidebar-pins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pins: next }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("pins");
      })
      .catch(() => setPins(prev)); // si falla, regresa como estaba
  };

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
          style={{ background: "var(--ec-brand-fill)", color: "var(--ec-brand-on)", borderRadius: 99, fontSize: 11 }}
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
    [{ key: "team", href: "/dashboard/team", es: "Equipo", en: "Team", icon: Users }, pathname.startsWith("/dashboard/team")],
  ];
  const workspace: [Item, boolean][] = [
    [{ key: "projects", href: ws("projects"), es: "Proyectos", en: "Projects", icon: FolderKanban }, wsActive("projects")],
    [{ key: "wall", href: ws("wall"), es: "Muro", en: "Wall", icon: Megaphone }, wsActive("wall")],
  ];

  const appsFromComponents = (components: string[]) =>
    components
      .map((component) => APPS.find((app) => app.component === component))
      .filter((app): app is AppDef => Boolean(app))
      .filter(canOpen);

  const appsFromSlugs = (slugs: string[]) =>
    slugs.map(appBySlug).filter((app): app is AppDef => Boolean(app)).filter(canOpen);

  const pagesOf = (group: ClientGroup, client?: ClientAccount): SidebarPage[] => {
    const real = client
      ? client.pages.map((page) => ({ id: page.id, title: page.title, projectName: page.projectName }))
      : [];
    const legacy = projects
      .filter((project) => group.match.test(project.project_name) || group.match.test(project.title ?? ""))
      .map((project) => ({ id: String(project.id), title: project.title, projectName: project.project_name }));
    const seen = new Set(real.map((page) => page.projectName));
    return [...real, ...legacy.filter((page) => !seen.has(page.projectName))];
  };

  // Match real client accounts to the known client groups, so their colour and
  // fallback apps survive while permissions are being assigned in the DB.
  const clientsByGroup = new Map<string, ClientAccount>();
  const usedClientIds = new Set<string>();
  for (const group of CLIENT_GROUPS) {
    const match = clients.find(
      (client) =>
        !usedClientIds.has(client.id) &&
        clientGroupFor(client.name, client.email, ...client.pages.flatMap((page) => [page.title, page.projectName])) === group
    );
    if (match) {
      clientsByGroup.set(group.id, match);
      usedClientIds.add(match.id);
    }
  }

  const knownClients: SidebarClient[] = CLIENT_GROUPS.map((group) => {
    const client = clientsByGroup.get(group.id);
    const realApps = client ? appsFromComponents(client.apps.filter((app) => app.canView).map((app) => app.component)) : [];
    return {
      key: client ? `client-${client.id}` : `group-${group.id}`,
      pinKey: `group-${group.id}`,
      name: group.name,
      color: group.color,
      apps: realApps.length ? realApps : appsFromSlugs(group.apps),
      pages: pagesOf(group, client),
    };
  });

  const extraClients: SidebarClient[] = clients
    .filter((client) => !usedClientIds.has(client.id))
    .map((client, index) => ({
      key: `client-${client.id}`,
      pinKey: `client-${client.id}`,
      // Nombre del proyecto (pagina del cliente o proyecto de Workspace): se reconoce mejor que la cuenta.
      name: client.pages[0]?.title?.trim() || client.projects[0]?.name?.trim() || client.name,
      color: CLIENT_COLORS[(CLIENT_GROUPS.length + index) % CLIENT_COLORS.length],
      apps: appsFromComponents(client.apps.filter((app) => app.canView).map((app) => app.component)),
      pages: client.pages.map((page) => ({ id: page.id, title: page.title, projectName: page.projectName })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Fijados primero (en el orden en que se fijaron), luego el resto en su orden de siempre.
  const pinRank = (c: SidebarClient) => {
    const i = pins.indexOf(c.pinKey);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const clientGroups: SidebarClient[] = [...knownClients, ...extraClients]
    .map((c, order) => ({ c, order }))
    .sort((a, b) => pinRank(a.c) - pinRank(b.c) || a.order - b.order)
    .map(({ c }) => c);

  // Legacy pages that do not belong to any client shown above.
  const shownPages = new Set(clientGroups.flatMap((group) => group.pages.map((page) => page.projectName)));
  const otherPages = projects
    .filter((project) => !shownPages.has(project.project_name))
    .map((project) => ({ id: String(project.id), title: project.title, projectName: project.project_name }));

  const tools = TOOL_APPS.map(appBySlug).filter((a): a is AppDef => Boolean(a)).filter(canOpen);

  const admin: [Item, boolean][] = [
    [{ key: "clients", href: "/dashboard/clients", es: "Gestionar clientes", en: "Manage clients", icon: Users }, pathname.startsWith("/dashboard/clients")],
    [{ key: "perms", href: "/dashboard/access-app", es: "Permisos", en: "Permissions", icon: Shield }, pathname.startsWith("/dashboard/access-app")],
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

      {clientGroups.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>{t("Clientes", "Clients")}</SidebarGroupLabel>
          <SidebarMenu>
            {clientGroups.map(({ key, pinKey, name, apps, pages, color }) => {
              const pageUrls = pages.map((page) => `/dashboard/${page.projectName}`);
              const urls = [...apps.map((a) => appUrl(a.slug)), ...pageUrls];
              const pinned = pins.includes(pinKey);
              return (
                <ClientEntry
                  key={key}
                  name={name}
                  color={color}
                  active={urls.includes(pathname)}
                  emptyLabel={t("Sin apps asignadas", "No apps assigned")}
                  pinned={pinned}
                  onTogglePin={() => togglePin(pinKey)}
                  pinLabel={pinned ? t(`Desfijar ${name}`, `Unpin ${name}`) : t(`Fijar ${name} arriba`, `Pin ${name} to top`)}
                >
                  {pages.map((p) => (
                    <SubLink key={`p-${p.id}`} href={`/dashboard/${p.projectName}`} active={pathname === `/dashboard/${p.projectName}`} onClick={closeMobile}>
                      {t("Página del cliente", "Client page")}
                    </SubLink>
                  ))}
                  {apps.map((a) => (
                    <SubLink key={a.slug} href={appUrl(a.slug)} active={pathname === appUrl(a.slug)} onClick={closeMobile}>
                      {t(a.es, a.en)}
                    </SubLink>
                  ))}
                  {isAdmin && pages.length === 0 && apps.length === 0 ? (
                    <SubLink href="/dashboard/clients" active={pathname.startsWith("/dashboard/clients")} onClick={closeMobile}>
                      {t("Gestionar cliente", "Manage client")}
                    </SubLink>
                  ) : null}
                </ClientEntry>
              );
            })}
            {isAdmin && otherPages.length > 0 ? (
              <ClientEntry
                name={t("Otros clientes", "Other clients")}
                color="var(--ec-text-faint)"
                active={otherPages.some((page) => pathname === `/dashboard/${page.projectName}`)}
              >
                {otherPages.map((page) => (
                  <SubLink
                    key={page.id}
                    href={`/dashboard/${page.projectName}`}
                    active={pathname === `/dashboard/${page.projectName}`}
                    onClick={closeMobile}
                  >
                    {page.title ?? page.projectName}
                  </SubLink>
                ))}
              </ClientEntry>
            ) : null}
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
function ClientEntry({
  name,
  color,
  active,
  emptyLabel,
  children,
  pinned,
  onTogglePin,
  pinLabel,
}: {
  name: string;
  color: string;
  active: boolean;
  emptyLabel?: string;
  children: React.ReactNode;
  pinned?: boolean;
  onTogglePin?: () => void;
  pinLabel?: string;
}) {
  const [open, setOpen] = React.useState(active);
  const [wasActive, setWasActive] = React.useState(active);
  const hasChildren = React.Children.toArray(children).length > 0;
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
              {clientIdentity(name, { color }).logo ? (
                <ClientTile identity={clientIdentity(name, { color })} size={16} radius={4} />
              ) : (
                <ClientDot name={name} color={color} />
              )}
            </span>
            <span>{name}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {onTogglePin ? (
          // Fijado: el pin se ve siempre. Sin fijar: aparece al pasar el mouse (o con el teclado).
          <SidebarMenuAction
            showOnHover={!pinned}
            onClick={onTogglePin}
            aria-label={pinLabel}
            aria-pressed={!!pinned}
            title={pinLabel}
          >
            {pinned ? <Pin fill="currentColor" /> : <Pin />}
          </SidebarMenuAction>
        ) : null}
        <CollapsibleContent>
          <SidebarMenuSub>
            {hasChildren ? (
              children
            ) : (
              <SidebarMenuSubItem>
                <span style={{ display: "block", padding: "6px 8px", fontSize: 12, color: "var(--ec-text-muted)" }}>
                  {emptyLabel ?? "—"}
                </span>
              </SidebarMenuSubItem>
            )}
          </SidebarMenuSub>
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
