"use client";

import { useAuth } from "@/app/context/AuthContext";
import { ClientHome } from "@/components/home/ClientHome";
import { TeamHome } from "@/components/home/TeamHome";

/**
 * Home. The team (admin, employee) sees what needs them today and how the
 * projects are going; a client sees a simpler page about their own project.
 * The redirect for logged-out visitors lives in RouteGuard (dashboard layout).
 */
export default function Page() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "client" ? <ClientHome /> : <TeamHome />;
}
