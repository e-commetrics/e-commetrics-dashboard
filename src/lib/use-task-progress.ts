"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getApi } from "@/app/dashboard/workspace/lib/api";

export type TaskCounts = { total: number; done: number };

/**
 * Task counts of the Workspace projects, keyed by the client page they are
 * linked to (`clientProjectName` = project_name of /dashboard/[project_name]).
 *
 * Project progress is always "completed tasks / tasks" (see progressPct in
 * lib/apps.ts); the hand-typed `projects.percentage` is no longer shown.
 * Clients get it from the client summary, the team from the project list.
 */
export function useTaskProgressMap(): Map<string, TaskCounts> | null {
  const { user } = useAuth();
  const [map, setMap] = useState<Map<string, TaskCounts> | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const api = getApi(user);
    const list: Promise<{ clientProjectName: string | null; taskCounts: TaskCounts }[]> =
      user.role === "client" ? api.clientSummary() : api.listProjects();
    list
      .then((items) => {
        if (cancelled) return;
        const next = new Map<string, TaskCounts>();
        items.forEach((p) => {
          if (!p.clientProjectName) return;
          const prev = next.get(p.clientProjectName);
          next.set(p.clientProjectName, prev ? { total: prev.total + p.taskCounts.total, done: prev.done + p.taskCounts.done } : p.taskCounts);
        });
        setMap(next);
      })
      .catch(() => !cancelled && setMap(new Map()));
    return () => {
      cancelled = true;
    };
  }, [user]);

  return map;
}

/** Task counts for one client page, or null when no Workspace project is linked to it (or still loading). */
export function useTaskProgress(projectName: string | null | undefined): TaskCounts | null {
  const map = useTaskProgressMap();
  return (projectName && map?.get(projectName)) || null;
}
