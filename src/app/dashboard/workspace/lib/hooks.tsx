"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { errorMessage, getApi, type WorkspaceApi } from "./api";
import type { Member } from "./types";

// Capa de datos del espacio de trabajo. Mismo patron que el CRM
// (webapp/crm/lib/hooks.tsx): un `revision` que las mutaciones incrementan y
// que hace que todo lo montado vuelva a pedir. Ademas lleva la API activa
// (mock o real) y la lista de miembros, que casi todas las pantallas usan.

type Ctx = {
  revision: number;
  bump: () => void;
  api: WorkspaceApi;
  members: Member[];
  memberById: (id: string | null | undefined) => Member | undefined;
  /** Id del usuario conectado tal como lo conoce la API. */
  meId: string;
  isAdmin: boolean;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((n) => n + 1), []);
  const api = useMemo(() => getApi(user ?? null), [user]);
  const [members, setMembers] = useState<Member[]>([]);
  const [meId, setMeId] = useState<string>(user?.id ?? "");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listMembers(), api.me()])
      .then(([list, me]) => {
        if (cancelled) return;
        setMembers(list);
        setMeId(me.id);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, revision]);

  const value = useMemo<Ctx>(() => {
    const map = new Map(members.map((m) => [m.id, m]));
    return {
      revision,
      bump,
      api,
      members,
      memberById: (id) => (id ? map.get(id) : undefined),
      meId,
      isAdmin: user?.role === "admin",
    };
  }, [revision, bump, api, members, meId, user?.role]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): Ctx {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace se uso fuera de <WorkspaceProvider>.");
  return value;
}

type Resource<T> = { data: T | null; error: string | null; loading: boolean; reload: () => void };

/** Igual que useResource del CRM: `key` cambia cuando cambian los datos a pedir. */
export function useResource<T>(key: string, fetcher: (api: WorkspaceApi) => Promise<T>): Resource<T> {
  const { revision, api } = useWorkspace();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [manual, setManual] = useState(0);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherRef
      .current(api)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(errorMessage(err));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, revision, manual, api]);

  const reload = useCallback(() => setManual((n) => n + 1), []);
  return { data, error, loading, reload };
}

/** Escritura con estado propio; si va bien refresca las lecturas montadas. */
export function useMutation<TArgs extends unknown[], TResult>(
  fn: (api: WorkspaceApi, ...args: TArgs) => Promise<TResult>,
  options?: { onSuccess?: (result: TResult) => void; onError?: (message: string) => void }
) {
  const { bump, api } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const fnRef = useRef(fn);
  const optionsRef = useRef(options);
  useEffect(() => {
    fnRef.current = fn;
    optionsRef.current = options;
  });

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setLoading(true);
      try {
        const result = await fnRef.current(api, ...args);
        setLoading(false);
        optionsRef.current?.onSuccess?.(result);
        bump();
        return result;
      } catch (err) {
        setLoading(false);
        optionsRef.current?.onError?.(errorMessage(err));
        return null;
      }
    },
    [api, bump]
  );
  return { run, loading };
}
