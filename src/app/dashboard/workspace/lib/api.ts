"use client";

import { apiFetch } from "@/lib/api";
import { createMockApi } from "./mock";
import type {
  ClientProjectSummary,
  InboxItem,
  Member,
  ProjectDetail,
  ProjectInput,
  Task,
  TaskComment,
  TaskDetail,
  TaskInput,
  TaskPatch,
  TaskWithProject,
  WallComment,
  WallPost,
  WorkProject,
} from "./types";

/**
 * Todo lo que la UI le pide al backend del espacio de trabajo.
 *
 * Hay dos implementaciones con la misma forma:
 * - `httpApi`: llama a /api/pm/* en el backend Express del dashboard
 *   (NEXT_PUBLIC_URL, cookie de sesion). Ver docs/workspace-api.md.
 * - `createMockApi()`: datos de ejemplo en localStorage, para usar la UI antes
 *   de que existan las rutas.
 *
 * Se elige con NEXT_PUBLIC_PM_API: "live" usa el backend; cualquier otro valor
 * (o ninguno) usa el mock. Cuando el backend este listo basta con definir
 * NEXT_PUBLIC_PM_API=live en el .env y volver a compilar.
 */
export interface WorkspaceApi {
  me(): Promise<Member>;
  listMembers(): Promise<Member[]>;

  listProjects(): Promise<WorkProject[]>;
  getProject(id: string): Promise<ProjectDetail>;
  createProject(input: ProjectInput): Promise<WorkProject>;
  updateProject(id: string, patch: Partial<ProjectInput>): Promise<WorkProject>;
  deleteProject(id: string): Promise<void>;

  listMyTasks(): Promise<TaskWithProject[]>;
  /** Todas las tareas de primer nivel visibles para el usuario (inicio del equipo: vencidas, en revision, avance del mes). */
  listTasks(): Promise<TaskWithProject[]>;
  /** Avance de los proyectos del cliente conectado. Unica ruta del espacio de trabajo abierta a clientes. */
  clientSummary(): Promise<ClientProjectSummary[]>;
  getTask(id: string): Promise<TaskDetail>;
  createTask(projectId: string, input: TaskInput): Promise<Task>;
  updateTask(id: string, patch: TaskPatch): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  addTaskComment(taskId: string, body: string): Promise<TaskComment>;
  /** Todas las etiquetas usadas en el espacio de trabajo, para sugerirlas. */
  listLabels(): Promise<string[]>;

  /** Notificaciones del usuario conectado, mas nuevas primero (admin: todas; employee: las suyas). */
  listInbox(): Promise<InboxItem[]>;
  /** Marca como leidas; "all" = todas las visibles para el usuario. */
  markInboxRead(ids: string[] | "all"): Promise<void>;

  listWall(): Promise<WallPost[]>;
  createPost(input: { body: string; projectId?: string | null }): Promise<WallPost>;
  deletePost(id: string): Promise<void>;
  setPinned(id: string, pinned: boolean): Promise<WallPost>;
  toggleLike(id: string): Promise<WallPost>;
  addPostComment(postId: string, body: string): Promise<WallComment>;
}

export const IS_MOCK = process.env.NEXT_PUBLIC_PM_API !== "live";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(`/api/pm${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    // El backend responde { error } en los fallos, igual que el CRM.
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new HttpError(res.status, data?.error ?? `${res.status} ${res.statusText || "error"}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const enc = encodeURIComponent;

export const httpApi: WorkspaceApi = {
  me: () => call<{ member: Member }>("GET", "/me").then((d) => d.member),
  listMembers: () => call<{ members: Member[] }>("GET", "/members").then((d) => d.members),

  listProjects: () => call<{ projects: WorkProject[] }>("GET", "/projects").then((d) => d.projects),
  getProject: (id) => call<ProjectDetail>("GET", `/projects/${enc(id)}`),
  createProject: (input) => call<{ project: WorkProject }>("POST", "/projects", input).then((d) => d.project),
  updateProject: (id, patch) =>
    call<{ project: WorkProject }>("PATCH", `/projects/${enc(id)}`, patch).then((d) => d.project),
  deleteProject: (id) => call<void>("DELETE", `/projects/${enc(id)}`),

  listMyTasks: () => call<{ tasks: TaskWithProject[] }>("GET", "/tasks?assignee=me").then((d) => d.tasks),
  listTasks: () => call<{ tasks: TaskWithProject[] }>("GET", "/tasks").then((d) => d.tasks),
  clientSummary: () => call<{ projects: ClientProjectSummary[] }>("GET", "/client/summary").then((d) => d.projects),
  getTask: (id) => call<TaskDetail>("GET", `/tasks/${enc(id)}`),
  createTask: (projectId, input) =>
    call<{ task: Task }>("POST", `/projects/${enc(projectId)}/tasks`, input).then((d) => d.task),
  updateTask: (id, patch) => call<{ task: Task }>("PATCH", `/tasks/${enc(id)}`, patch).then((d) => d.task),
  deleteTask: (id) => call<void>("DELETE", `/tasks/${enc(id)}`),
  addTaskComment: (taskId, body) =>
    call<{ comment: TaskComment }>("POST", `/tasks/${enc(taskId)}/comments`, { body }).then((d) => d.comment),

  listLabels: () => call<{ labels: string[] }>("GET", "/labels").then((d) => d.labels),
  listInbox: () => call<{ items: InboxItem[] }>("GET", "/inbox").then((d) => d.items),
  markInboxRead: (ids) => call<void>("POST", "/inbox/read", ids === "all" ? { all: true } : { ids }),

  listWall: () => call<{ posts: WallPost[] }>("GET", "/wall").then((d) => d.posts),
  createPost: (input) => call<{ post: WallPost }>("POST", "/wall", input).then((d) => d.post),
  deletePost: (id) => call<void>("DELETE", `/wall/${enc(id)}`),
  setPinned: (id, pinned) =>
    call<{ post: WallPost }>("PATCH", `/wall/${enc(id)}`, { pinned }).then((d) => d.post),
  toggleLike: (id) => call<{ post: WallPost }>("POST", `/wall/${enc(id)}/like`).then((d) => d.post),
  addPostComment: (postId, body) =>
    call<{ comment: WallComment }>("POST", `/wall/${enc(postId)}/comments`, { body }).then((d) => d.comment),
};

let mockSingleton: WorkspaceApi | null = null;

/** La implementacion activa. El mock necesita saber quien esta conectado. */
export function getApi(viewer: { id: string; name: string; email: string; role: string } | null): WorkspaceApi {
  if (!IS_MOCK) return httpApi;
  if (!mockSingleton) mockSingleton = createMockApi();
  (mockSingleton as WorkspaceApi & { setViewer: (v: typeof viewer) => void }).setViewer(viewer);
  return mockSingleton;
}

export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  return error instanceof Error ? error.message : fallback;
}
