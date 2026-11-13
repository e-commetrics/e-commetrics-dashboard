"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useLang } from "@/app/context/LangContext";
import { appComponentForPath, isAdminOnlyPath, isTeamOnlyPath } from "@/lib/apps";

/**
 * Client-side gate for every /dashboard page.
 *
 * - Not logged in → back to "/".
 * - Admin-only sections → admins only.
 * - /dashboard/workspace → admins and employees only.
 * - /dashboard/webapp/* → admins, or users with `can_view` on that app.
 *
 * This is a UX guard: the site is a static export, so the real protection must
 * live in the backends. It stops the UI from showing pages a user cannot use.
 */
export default function RouteGuard({ children }: { children: ReactNode }) {
  const { user, permissions, permissionsLoaded } = useAuth();
  const { lang } = useLang();
  const pathname = usePathname() ?? "";
  const router = useRouter();

  useEffect(() => {
    if (user === null) router.replace("/");
  }, [user, router]);

  // Still restoring the session (or redirecting away).
  if (user === undefined || user === null) return <GuardLoading />;

  if (user.role === "admin") return <>{children}</>;

  if (isAdminOnlyPath(pathname)) return <NoAccess lang={lang} />;

  // Workspace (projects, tasks, wall): internal team only.
  if (isTeamOnlyPath(pathname) && user.role !== "employee") return <NoAccess lang={lang} />;

  const component = appComponentForPath(pathname);
  if (component) {
    if (!permissionsLoaded) return <GuardLoading />;
    const allowed = permissions.some(
      (p) => p.component === component && p.can_view
    );
    if (!allowed) return <NoAccess lang={lang} />;
  }

  return <>{children}</>;
}

function GuardLoading() {
  return (
    <div
      style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}
      aria-busy="true"
    >
      <div
        className="animate-spin"
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "3px solid var(--ec-hairline)",
          borderTopColor: "var(--ec-brand)",
        }}
      />
    </div>
  );
}

function NoAccess({ lang }: { lang: string }) {
  const es = lang === "es";
  return (
    <div
      role="alert"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        textAlign: "center",
        padding: 24,
      }}
    >
      <ShieldAlert size={36} color="var(--ec-brand)" />
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>
        {es ? "No tienes acceso a esta sección" : "You don't have access to this section"}
      </h1>
      <p style={{ color: "var(--ec-text-muted)", maxWidth: 420 }}>
        {es
          ? "Pide a un administrador que te dé permiso si lo necesitas."
          : "Ask an administrator for permission if you need it."}
      </p>
      <Link href="/dashboard" style={{ color: "var(--ec-brand)", fontWeight: 500 }}>
        {es ? "Volver al dashboard" : "Back to dashboard"}
      </Link>
    </div>
  );
}
