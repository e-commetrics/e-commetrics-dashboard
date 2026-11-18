// Tipos del espacio de trabajo (gestion de proyectos estilo ClickUp).
//
// Este archivo ES el contrato con el backend: cada tipo es la forma JSON que
// devuelve /api/pm/*. El detalle de rutas y la tabla SQL sugerida viven en
// docs/workspace-api.md. Si cambias un campo aqui, cambialo tambien alli.
//
// Fechas: strings ISO 8601 (UTC). Ids: strings, aunque en MySQL sean INT, para
// no depender del tipo de columna.

/** Rol de una persona en el dashboard. "employee" es nuevo: el backend lo necesita en users.role. */
export type Role = "admin" | "employee" | "client";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Puesto visible en tarjetas y en el equipo, p. ej. "Diseñadora". */
  title: string | null;
  avatarUrl: string | null;
};

/** Ids de pricing.ts (plans[].id y customPlan.id). */
export type PackageId = "simple" | "advanced" | "grower" | "high-profile" | "custom";

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type WorkProject = {
  id: string;
  name: string;
  description: string | null;
  packageId: PackageId | null;
  /** Usuario con rol client para quien se hace el proyecto. */
  clientId: string | null;
  /** project_name del proyecto de cliente existente (/dashboard/[project_name]), si lo hay. */
  clientProjectName: string | null;
  status: ProjectStatus;
  /** Color de la tarjeta, hex. */
  color: string;
  ownerId: string | null;
  memberIds: string[];
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  /** Solo tareas de primer nivel (no subtareas). Calculado por el backend. */
  taskCounts: { total: number; done: number; /** Abiertas con fecha pasada. Opcional: sin el, la tarjeta no muestra vencidas. */ overdue?: number };
  /** Proxima tarea abierta con fecha (la mas cercana). Opcional; alimenta "Proxima entrega" en la tarjeta. */
  nextDue?: { title: string; dueDate: string } | null;
};

/**
 * Estados estilo ClickUp, en orden de columna. Los valores viejos se conservan
 * (no se migran filas): todo = Open, done = Completed, review = In review.
 */
export const TASK_STATUSES = ["todo", "pending", "in_progress", "done", "review", "accepted", "rejected", "blocked"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Cuentan como terminadas para avance, vencidas y la regla de subtareas. */
export const DONE_STATUSES: readonly TaskStatus[] = ["done", "review", "accepted"];
export const isDone = (status: TaskStatus) => DONE_STATUSES.includes(status);
export const openSubtaskCount = (subtasks: Pick<Task, "status">[]) => subtasks.filter((s) => !isDone(s.status)).length;

export const PRIORITIES = ["urgent", "high", "normal", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export type Task = {
  id: string;
  projectId: string;
  /** null = tarea; id de otra tarea = subtarea. Solo un nivel de anidado. */
  parentId: string | null;
  title: string;
  description: string | null;
  /** Enlace externo relacionado con la tarea (documento, diseño, referencia...). */
  linkUrl?: string | null;
  status: TaskStatus;
  priority: Priority;
  assigneeIds: string[];
  dueDate: string | null;
  /** Etiquetas libres ("Diseño", "Cliente espera"...). Compartidas por todo el espacio de trabajo. */
  labels: string[];
  /** Orden dentro de su columna/lista. Menor = arriba. */
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  subtaskCounts: { total: number; done: number };
  commentCount: number;
};

/** Tarea con el nombre del proyecto, para "Mis tareas". */
export type TaskWithProject = Task & { projectName: string; projectColor: string };

export type TaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type WallComment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type WallPost = {
  id: string;
  authorId: string;
  body: string;
  /** Proyecto mencionado, opcional. */
  projectId: string | null;
  pinned: boolean;
  /** Ids de quienes dieron "me gusta". */
  likedBy: string[];
  comments: WallComment[];
  createdAt: string;
};

// ─── Payloads ────────────────────────────────────────────────────────────────

export type ProjectDetail = { project: WorkProject; tasks: Task[] };
export type TaskDetail = { task: Task; subtasks: Task[]; comments: TaskComment[] };

export type ProjectInput = {
  name: string;
  description?: string | null;
  packageId?: PackageId | null;
  clientId?: string | null;
  clientProjectName?: string | null;
  status?: ProjectStatus;
  color?: string;
  ownerId?: string | null;
  memberIds?: string[];
  startDate?: string | null;
  dueDate?: string | null;
  /**
   * Solo al crear: tareas iniciales. El frontend las arma con las
   * inclusiones del paquete (pricing.ts), asi el backend no necesita conocer
   * los paquetes.
   */
  templateTasks?: { title: string; description?: string | null }[];
  /** Alta rapida del cliente desde el mismo formulario (solo crear proyecto). */
  newClient?: {
    email: string;
    userName?: string;
    password: string;
    jobTitle?: string | null;
  } | null;
  /** Pagina de entregables que se crea junto con el cliente o se suma a uno existente. */
  newClientPage?: {
    title: string;
    projectName?: string;
    content?: string | null;
  } | null;
};

export type TaskInput = {
  title: string;
  parentId?: string | null;
  description?: string | null;
  linkUrl?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  assigneeIds?: string[];
  dueDate?: string | null;
  labels?: string[];
};

export type TaskPatch = Partial<Omit<TaskInput, "parentId">> & { position?: number };

// ─── Resumen para el cliente (inicio del cliente) ───────────────────────────

/**
 * Lo unico del espacio de trabajo que ve un cliente: el avance de SU proyecto.
 * Sin comentarios, etiquetas, asignados ni tareas internas mas alla del titulo
 * y la fecha de entrega. El backend lo arma en GET /api/pm/client/summary
 * filtrando por projects.client_id = usuario conectado.
 */
export type ClientDeliverable = { title: string; status: TaskStatus; dueDate: string | null; completedAt: string | null };

export type ClientProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  packageId: PackageId | null;
  status: ProjectStatus;
  dueDate: string | null;
  /** project_name de la pagina de entregables (/dashboard/[project_name]). */
  clientProjectName: string | null;
  /** Tareas de primer nivel. El avance es done / total. */
  taskCounts: { total: number; done: number };
  /** En curso o en revision, mas proximas primero (max 5). */
  inProgress: ClientDeliverable[];
  /** Proxima por empezar (max 3). */
  upNext: ClientDeliverable[];
  /** Terminadas, mas recientes primero (max 5). */
  delivered: ClientDeliverable[];
};

// ─── Bandeja de entrada (notificaciones de tareas) ──────────────────────────

/** Que cambio en una tarea. Cada cambio guardado genera una fila de actividad. */
export const ACTIVITY_KINDS = [
  "created",    // tarea creada
  "assigned",   // `to` = id de la persona asignada
  "unassigned", // `to` = id de la persona quitada
  "status",     // from/to = TaskStatus
  "priority",   // from/to = Priority
  "due_date",   // from/to = "YYYY-MM-DD" | null
  "title",      // from/to = titulo
  "description",
  "labels",     // from/to = etiquetas separadas por coma
  "comment",    // to = extracto del comentario
  "subtask",    // en la tarea padre; to = titulo de la subtarea
  "deleted",
  "mention",    // muro: from = extracto del texto, to = id de la persona mencionada
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/**
 * Una notificacion de la bandeja.
 *
 * Quien la ve (lo filtra el backend en GET /inbox):
 * - admin: toda la actividad.
 * - employee: solo la de tareas asignadas a el (o a la tarea padre de una
 *   subtarea), mas las que lo asignan o lo quitan a el.
 */
export type InboxItem = {
  id: string;
  /** null en las menciones del muro (kind "mention"). */
  taskId: string | null;
  /** Publicacion del muro, solo en kind "mention". Opcional: las filas viejas no lo traen. */
  postId?: string | null;
  /** Tarea padre si `taskId` es una subtarea. */
  parentTaskId: string | null;
  /** null en una mencion de un post sin proyecto. */
  projectId: string | null;
  /** Copias al momento del cambio, para que se lean aunque la tarea se borre. */
  taskTitle: string;
  projectName: string;
  projectColor: string;
  actorId: string;
  kind: ActivityKind;
  from: string | null;
  to: string | null;
  createdAt: string;
  /** Leida por quien consulta. */
  read: boolean;
};
