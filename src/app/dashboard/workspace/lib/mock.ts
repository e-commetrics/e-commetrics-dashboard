"use client";

// Implementacion de ejemplo de WorkspaceApi, guardada en localStorage.
//
// Sirve para usar y revisar la UI mientras el backend no tiene /api/pm/*.
// Imita las reglas que el backend debe aplicar (contadores, completedAt,
// permisos basicos) para que la UI no dependa de atajos del mock.
// Para empezar de cero: localStorage.removeItem("ec-workspace-mock-v1").

import { packageTemplateTasks } from "./packages";
import type { WorkspaceApi } from "./api";
import type {
  ActivityKind,
  ClientDeliverable,
  ClientProjectSummary,
  InboxItem,
  Member,
  PackageId,
  Priority,
  ProjectInput,
  Task,
  TaskComment,
  TaskStatus,
  WallComment,
  WallPost,
  WorkProject,
} from "./types";

const KEY = "ec-workspace-mock-v1";
const VIEWER_ID = "me";

type StoredProject = Omit<WorkProject, "taskCounts">;
type StoredTask = Omit<Task, "subtaskCounts" | "commentCount">;
/** Actividad guardada: `audience` = quienes la ven siendo employee (asignados al momento del cambio). */
type StoredActivity = Omit<InboxItem, "read"> & { audience: string[]; readBy: string[] };
type Db = {
  activity?: StoredActivity[];
  members: Member[];
  projects: StoredProject[];
  tasks: StoredTask[];
  comments: TaskComment[];
  posts: WallPost[];
  seq: number;
};

const day = 86_400_000;
const SAMPLE_LABELS: string[][] = [["Diseño"], ["Desarrollo"], ["SEO"], [], ["Contenido", "Cliente espera"], ["Desarrollo", "Bloqueado"], [], ["Diseño", "Cliente espera"]];
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString();
const dateOnly = (offsetDays: number) => iso(offsetDays).slice(0, 10);

function seed(): Db {
  const members: Member[] = [
    { id: VIEWER_ID, name: "Ecommetrica", email: "admin@e-commetrics.com", role: "admin", title: "Director", avatarUrl: null },
    { id: "u-ana", name: "Ana López", email: "ana@e-commetrics.com", role: "employee", title: "Diseñadora UI", avatarUrl: null },
    { id: "u-carlos", name: "Carlos Ruiz", email: "carlos@e-commetrics.com", role: "employee", title: "Desarrollador", avatarUrl: null },
    { id: "u-sofia", name: "Sofía Méndez", email: "sofia@e-commetrics.com", role: "employee", title: "SEO y contenido", avatarUrl: null },
    { id: "u-diego", name: "Diego Torres", email: "diego@e-commetrics.com", role: "employee", title: "Project manager", avatarUrl: null },
    { id: "c-reforma", name: "Reforma Dental", email: "contacto@reformadental.com", role: "client", title: null, avatarUrl: null },
    { id: "c-palmas", name: "Las Palmas", email: "hola@laspalmas.mx", role: "client", title: null, avatarUrl: null },
    { id: "c-monge", name: "Monge", email: "info@monge.mx", role: "client", title: null, avatarUrl: null },
  ];

  const db: Db = { members, projects: [], tasks: [], comments: [], posts: [], seq: 1 };
  const id = (p: string) => `${p}-${db.seq++}`;

  const projects: {
    name: string; pkg: PackageId; client: string; clientProject: string | null; status: StoredProject["status"];
    color: string; owner: string; members: string[]; start: number; due: number; description: string;
  }[] = [
    { name: "Reforma Dental · Tracción", pkg: "advanced", client: "c-reforma", clientProject: "reforma-dental", status: "active", color: "#BD155C", owner: "u-diego", members: ["u-ana", "u-carlos", "u-sofia", "u-diego", VIEWER_ID], start: -40, due: 80, description: "Sitio nuevo, CRM y campañas de captación para la clínica." },
    { name: "Las Palmas · Arranque", pkg: "simple", client: "c-palmas", clientProject: "palmas", status: "active", color: "#22c55e", owner: "u-diego", members: ["u-ana", "u-carlos", "u-diego", VIEWER_ID], start: -20, due: 70, description: "Presencia digital completa y calendario de reservas." },
    { name: "Monge · Escala", pkg: "grower", client: "c-monge", clientProject: "monge", status: "planning", color: "#3b82f6", owner: "u-sofia", members: ["u-sofia", "u-carlos"], start: 7, due: 160, description: "Crecimiento orgánico y automatización." },
  ];

  const statuses: TaskStatus[] = ["done", "done", "in_progress", "review", "in_progress", "todo", "todo", "todo", "todo", "todo", "todo", "todo", "todo", "todo", "todo", "todo"];
  const priorities: Priority[] = ["high", "normal", "urgent", "normal", "low", "normal", "high", "normal"];

  projects.forEach((p, pi) => {
    const pid = id("p");
    db.projects.push({
      id: pid, name: p.name, description: p.description, packageId: p.pkg, clientId: p.client,
      clientProjectName: p.clientProject, status: p.status, color: p.color, ownerId: p.owner, memberIds: p.members,
      startDate: dateOnly(p.start), dueDate: dateOnly(p.due), createdAt: iso(p.start), updatedAt: iso(-1),
    });
    packageTemplateTasks(p.pkg, "es").forEach((tpl, i) => {
      const status = p.status === "planning" ? "todo" : statuses[i] ?? "todo";
      const assignee = p.members[(i + pi) % p.members.length];
      const tid = id("t");
      db.tasks.push({
        id: tid, projectId: pid, parentId: null, title: tpl.title, description: tpl.description, status,
        priority: priorities[(i + pi) % priorities.length], assigneeIds: [assignee],
        labels: SAMPLE_LABELS[(i + pi) % SAMPLE_LABELS.length],
        dueDate: dateOnly(p.start + 14 + i * 7), position: i, createdBy: p.owner, createdAt: iso(p.start),
        updatedAt: iso(-i), completedAt: status === "done" ? iso(-3 - i) : null,
      });
      // Subtareas en algunas tareas, para que se vean en las tarjetas.
      if (i % 3 === 0) {
        const subs = i === 0
          ? ["Wireframes", "Diseño en Figma", "Maquetación", "Revisión con cliente"]
          : ["Investigación", "Primer borrador", "Aprobación"];
        subs.forEach((title, si) => {
          const done = status === "done" || (status !== "todo" && si < 2);
          db.tasks.push({
            id: id("t"), projectId: pid, parentId: tid, title, description: null, status: done ? "done" : "todo",
            priority: "normal", assigneeIds: [p.members[(si + i) % p.members.length]], labels: [], dueDate: null, position: si,
            createdBy: p.owner, createdAt: iso(p.start), updatedAt: iso(-1), completedAt: done ? iso(-2) : null,
          });
        });
      }
      if (i === 2) {
        db.comments.push(
          { id: id("c"), taskId: tid, authorId: "u-diego", body: "El cliente pidió revisar esto antes del viernes.", createdAt: iso(-2) },
          { id: id("c"), taskId: tid, authorId: assignee, body: "Va. Subo avance mañana.", createdAt: iso(-1.5) },
        );
      }
    });
  });

  db.posts.push(
    { id: id("w"), authorId: VIEWER_ID, body: "Bienvenidos al nuevo espacio de trabajo 🎉 A partir de hoy los proyectos y tareas viven aquí en vez de ClickUp. Cualquier duda, en este muro.", projectId: null, pinned: true, likedBy: ["u-ana", "u-carlos", "u-sofia"], comments: [
      { id: id("wc"), postId: "", authorId: "u-ana", body: "¡Por fin todo en un solo lugar!", createdAt: iso(-0.9) },
    ], createdAt: iso(-1) },
    { id: id("w"), authorId: "u-carlos", body: "Subí la nueva versión del sitio de Reforma a staging. Falta revisar formularios.", projectId: db.projects[0].id, pinned: false, likedBy: ["u-diego"], comments: [], createdAt: iso(-0.3) },
    { id: id("w"), authorId: "u-sofia", body: "Recordatorio: reunión de planeación de Monge el lunes a las 10:00.", projectId: db.projects[2].id, pinned: false, likedBy: [], comments: [], createdAt: iso(-0.1) },
  );
  db.posts.forEach((p) => p.comments.forEach((c) => (c.postId = p.id)));
  return db;
}

/**
 * Actividad de ejemplo: cambios hechos por otras personas en las ultimas horas,
 * algunos en tareas tuyas y otros en tareas de otros (solo los ve un admin).
 */
function seedActivity(db: Db): StoredActivity[] {
  const out: StoredActivity[] = [];
  const mine = db.tasks.filter((t) => t.parentId === null && t.assigneeIds.includes(VIEWER_ID));
  const others = db.tasks.filter((t) => t.parentId === null && !t.assigneeIds.includes(VIEWER_ID));
  const hours = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const add = (task: StoredTask | undefined, actorId: string, kind: ActivityKind, from: string | null, to: string | null, h: number, read = false) => {
    if (!task) return;
    const p = db.projects.find((x) => x.id === task.projectId);
    out.push({
      id: `a-${db.seq++}`, taskId: task.id, parentTaskId: task.parentId, projectId: task.projectId,
      taskTitle: task.title, projectName: p?.name ?? "—", projectColor: p?.color ?? "#888",
      actorId, kind, from, to, createdAt: hours(h),
      audience: Array.from(new Set([...task.assigneeIds, ...(kind === "assigned" && to ? [to] : [])])),
      readBy: read ? [VIEWER_ID] : [],
    });
  };
  add(mine[0], "u-diego", "assigned", null, VIEWER_ID, 0.4);
  const earlier = (d: string | null | undefined, days: number) =>
    d ? new Date(new Date(`${d.slice(0, 10)}T12:00:00`).getTime() - days * day).toISOString().slice(0, 10) : null;
  add(mine[0], "u-diego", "due_date", earlier(mine[0]?.dueDate, 3), mine[0]?.dueDate ?? null, 0.35);
  add(mine[1], "u-ana", "comment", null, "Ya subí los ajustes que pediste, ¿lo revisas?", 1.2);
  add(mine[1], "u-ana", "status", "in_progress", "review", 1.3);
  add(mine[2], "u-carlos", "priority", "normal", "urgent", 3);
  add(mine[2], "u-carlos", "subtask", null, "Revisar formularios", 5, true);
  add(mine[3], "u-sofia", "description", null, null, 26, true);
  add(others[0], "u-carlos", "status", "todo", "in_progress", 0.8);
  add(others[1], "u-sofia", "comment", null, "Necesito los accesos de Search Console.", 2);
  add(others[2], "u-ana", "due_date", earlier(others[2]?.dueDate, 5), others[2]?.dueDate ?? null, 30);
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), 120));

function notFound(what: string): never {
  throw new Error(`${what} not found`);
}

export function createMockApi(): WorkspaceApi & { setViewer: (v: { id: string; name: string; email: string; role: string } | null) => void } {
  let viewer: Member | null = null;

  function load(): Db {
    if (typeof window === "undefined") return seed();
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      try {
        const db = JSON.parse(raw) as Db;
        // Datos guardados antes de que existiera la bandeja: se le agrega actividad de ejemplo.
        if (!db.activity) {
          db.activity = seedActivity(db);
          save(db);
        }
        // Datos guardados antes de las etiquetas: se agregan etiquetas de ejemplo.
        if (db.tasks.some((t) => !Array.isArray(t.labels))) {
          let n = 0;
          db.tasks.forEach((t) => {
            if (!Array.isArray(t.labels)) t.labels = t.parentId ? [] : SAMPLE_LABELS[n++ % SAMPLE_LABELS.length];
          });
          save(db);
        }
        return db;
      } catch {
        // datos corruptos: se vuelve a sembrar
      }
    }
    const db = seed();
    db.activity = seedActivity(db);
    save(db);
    return db;
  }
  function save(db: Db) {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(db));
  }
  function meId() {
    return viewer?.id ?? VIEWER_ID;
  }

  function withCounts(db: Db, p: StoredProject): WorkProject {
    const top = db.tasks.filter((t) => t.projectId === p.id && t.parentId === null);
    return { ...p, taskCounts: { total: top.length, done: top.filter((t) => t.status === "done").length } };
  }
  function taskOut(db: Db, t: StoredTask): Task {
    const subs = db.tasks.filter((s) => s.parentId === t.id);
    return {
      ...t,
      labels: t.labels ?? [],
      subtaskCounts: { total: subs.length, done: subs.filter((s) => s.status === "done").length },
      commentCount: db.comments.filter((c) => c.taskId === t.id).length,
    };
  }
  function requireAdmin() {
    if (viewer && viewer.role !== "admin") throw new Error("Only admins can do this.");
  }
  const now = () => new Date().toISOString();

  /** Guarda un cambio de tarea en la actividad (lo que alimenta la bandeja). */
  function log(db: Db, task: StoredTask, kind: ActivityKind, from: string | null = null, to: string | null = null) {
    const p = db.projects.find((x) => x.id === task.projectId);
    const parent = task.parentId ? db.tasks.find((t) => t.id === task.parentId) : undefined;
    const audience = new Set([...task.assigneeIds, ...(parent?.assigneeIds ?? [])]);
    if ((kind === "assigned" || kind === "unassigned") && to) audience.add(to);
    (db.activity ??= []).unshift({
      id: `a-${db.seq++}`, taskId: task.id, parentTaskId: task.parentId, projectId: task.projectId,
      taskTitle: task.title, projectName: p?.name ?? "—", projectColor: p?.color ?? "#888",
      actorId: meId(), kind, from, to, createdAt: now(), audience: Array.from(audience), readBy: [meId()],
    });
  }
  /** Admin: toda la actividad. Employee: solo la de sus tareas. */
  function visibleActivity(db: Db) {
    const me = meId();
    const isAdmin = !viewer || viewer.role === "admin";
    return (db.activity ?? []).filter((a) => isAdmin || a.audience.includes(me));
  }

  const api = {
    setViewer(v: { id: string; name: string; email: string; role: string } | null) {
      if (!v) return;
      // El usuario conectado ocupa el lugar del "me" sembrado, con su nombre real.
      viewer = { id: VIEWER_ID, name: v.name || "You", email: v.email, role: v.role === "admin" ? "admin" : "employee", title: null, avatarUrl: null };
      const db = load();
      const me = db.members.find((m) => m.id === VIEWER_ID);
      if (me && (me.name !== viewer.name || me.role !== viewer.role)) {
        me.name = viewer.name;
        me.email = viewer.email;
        me.role = viewer.role;
        save(db);
      }
    },

    async me() {
      const db = load();
      return delay(db.members.find((m) => m.id === meId()) ?? notFound("Member"));
    },
    async listMembers() {
      return delay(load().members);
    },

    async listProjects() {
      const db = load();
      return delay(db.projects.map((p) => withCounts(db, p)));
    },
    async getProject(id: string) {
      const db = load();
      const project = db.projects.find((p) => p.id === id) ?? notFound("Project");
      return delay({
        project: withCounts(db, project),
        tasks: db.tasks.filter((t) => t.projectId === id).map((t) => taskOut(db, t)),
      });
    },
    async createProject(input: ProjectInput) {
      requireAdmin();
      const db = load();
      const pid = `p-${db.seq++}`;
      const project: StoredProject = {
        id: pid, name: input.name, description: input.description ?? null, packageId: input.packageId ?? null,
        clientId: input.clientId ?? null, clientProjectName: input.clientProjectName ?? null,
        status: input.status ?? "planning", color: input.color ?? "#BD155C", ownerId: input.ownerId ?? meId(),
        memberIds: input.memberIds ?? [], startDate: input.startDate ?? null, dueDate: input.dueDate ?? null,
        createdAt: now(), updatedAt: now(),
      };
      db.projects.unshift(project);
      (input.templateTasks ?? []).forEach((tpl, i) => {
        db.tasks.push({
          id: `t-${db.seq++}`, projectId: pid, parentId: null, title: tpl.title, description: tpl.description ?? null,
          status: "todo", priority: "normal", assigneeIds: [], labels: [], dueDate: null, position: i, createdBy: meId(),
          createdAt: now(), updatedAt: now(), completedAt: null,
        });
      });
      save(db);
      return delay(withCounts(db, project));
    },
    async updateProject(id: string, patch: Partial<ProjectInput>) {
      requireAdmin();
      const db = load();
      const project = db.projects.find((p) => p.id === id) ?? notFound("Project");
      const { templateTasks: _ignored, ...rest } = patch;
      void _ignored;
      Object.assign(project, rest, { updatedAt: now() });
      save(db);
      return delay(withCounts(db, project));
    },
    async deleteProject(id: string) {
      requireAdmin();
      const db = load();
      const taskIds = new Set(db.tasks.filter((t) => t.projectId === id).map((t) => t.id));
      db.projects = db.projects.filter((p) => p.id !== id);
      db.tasks = db.tasks.filter((t) => t.projectId !== id);
      db.comments = db.comments.filter((c) => !taskIds.has(c.taskId));
      save(db);
      return delay(undefined);
    },

    async listMyTasks() {
      const db = load();
      return delay(
        db.tasks
          .filter((t) => t.assigneeIds.includes(meId()))
          .map((t) => {
            const p = db.projects.find((pr) => pr.id === t.projectId);
            return { ...taskOut(db, t), projectName: p?.name ?? "—", projectColor: p?.color ?? "#888" };
          })
      );
    },
    async listTasks() {
      const db = load();
      return delay(
        db.tasks
          .filter((t) => t.parentId === null)
          .map((t) => {
            const p = db.projects.find((pr) => pr.id === t.projectId);
            return { ...taskOut(db, t), projectName: p?.name ?? "—", projectColor: p?.color ?? "#888" };
          })
      );
    },
    async clientSummary() {
      const db = load();
      // En el mock no hay relacion real cliente↔usuario: se muestra el primer
      // proyecto activo como ejemplo. El backend filtra por client_id.
      const project = db.projects.find((p) => p.status === "active") ?? db.projects[0];
      if (!project) return delay([] as ClientProjectSummary[]);
      const top = db.tasks.filter((t) => t.projectId === project.id && t.parentId === null);
      const out = (t: StoredTask): ClientDeliverable => ({ title: t.title, status: t.status, dueDate: t.dueDate, completedAt: t.completedAt });
      const byDue = (a: StoredTask, b: StoredTask) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9");
      const summary: ClientProjectSummary = {
        id: project.id, name: project.name, description: project.description, packageId: project.packageId,
        status: project.status, dueDate: project.dueDate, clientProjectName: project.clientProjectName,
        taskCounts: withCounts(db, project).taskCounts,
        inProgress: top.filter((t) => t.status === "in_progress" || t.status === "review").sort(byDue).slice(0, 5).map(out),
        upNext: top.filter((t) => t.status === "todo").sort(byDue).slice(0, 3).map(out),
        delivered: top.filter((t) => t.status === "done").sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")).slice(0, 5).map(out),
      };
      return delay([summary]);
    },
    async getTask(id: string) {
      const db = load();
      const task = db.tasks.find((t) => t.id === id) ?? notFound("Task");
      return delay({
        task: taskOut(db, task),
        subtasks: db.tasks.filter((t) => t.parentId === id).sort((a, b) => a.position - b.position).map((t) => taskOut(db, t)),
        comments: db.comments.filter((c) => c.taskId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      });
    },
    async createTask(projectId: string, input: Parameters<WorkspaceApi["createTask"]>[1]) {
      const db = load();
      if (!db.projects.some((p) => p.id === projectId)) notFound("Project");
      const siblings = db.tasks.filter((t) => t.projectId === projectId && t.parentId === (input.parentId ?? null));
      const status = input.status ?? "todo";
      const task: StoredTask = {
        id: `t-${db.seq++}`, projectId, parentId: input.parentId ?? null, title: input.title,
        description: input.description ?? null, status, priority: input.priority ?? "normal",
        assigneeIds: input.assigneeIds ?? [], labels: input.labels ?? [], dueDate: input.dueDate ?? null,
        position: siblings.reduce((max, t) => Math.max(max, t.position), -1) + 1,
        createdBy: meId(), createdAt: now(), updatedAt: now(), completedAt: status === "done" ? now() : null,
      };
      db.tasks.push(task);
      const parent = task.parentId ? db.tasks.find((t) => t.id === task.parentId) : undefined;
      if (parent) log(db, parent, "subtask", null, task.title);
      else log(db, task, "created");
      task.assigneeIds.filter((a) => a !== meId()).forEach((a) => log(db, task, "assigned", null, a));
      save(db);
      return delay(taskOut(db, task));
    },
    async updateTask(id: string, patch: Parameters<WorkspaceApi["updateTask"]>[1]) {
      const db = load();
      const task = db.tasks.find((t) => t.id === id) ?? notFound("Task");
      if (patch.status && patch.status !== task.status) {
        task.completedAt = patch.status === "done" ? now() : null;
      }
      const before = { ...task, assigneeIds: [...task.assigneeIds] };
      Object.assign(task, patch, { updatedAt: now() });
      if (patch.status !== undefined && patch.status !== before.status) log(db, task, "status", before.status, task.status);
      if (patch.priority !== undefined && patch.priority !== before.priority) log(db, task, "priority", before.priority, task.priority);
      if (patch.dueDate !== undefined && (patch.dueDate ?? null) !== (before.dueDate ?? null)) log(db, task, "due_date", before.dueDate, task.dueDate);
      if (patch.title !== undefined && patch.title !== before.title) log(db, task, "title", before.title, task.title);
      if (patch.description !== undefined && (patch.description ?? "") !== (before.description ?? "")) log(db, task, "description");
      if (patch.labels !== undefined && patch.labels.join("|") !== (before.labels ?? []).join("|")) {
        log(db, task, "labels", (before.labels ?? []).join(", ") || null, patch.labels.join(", ") || null);
      }
      const nextAssignees = patch.assigneeIds;
      if (nextAssignees) {
        nextAssignees.filter((a) => !before.assigneeIds.includes(a)).forEach((a) => log(db, task, "assigned", null, a));
        // Quien es quitado se entera aunque ya no este asignado.
        before.assigneeIds.filter((a) => !nextAssignees.includes(a)).forEach((a) => log(db, task, "unassigned", null, a));
      }
      save(db);
      return delay(taskOut(db, task));
    },
    async deleteTask(id: string) {
      const db = load();
      const target = db.tasks.find((t) => t.id === id);
      if (target) log(db, target, "deleted");
      const ids = new Set([id, ...db.tasks.filter((t) => t.parentId === id).map((t) => t.id)]);
      db.tasks = db.tasks.filter((t) => !ids.has(t.id));
      db.comments = db.comments.filter((c) => !ids.has(c.taskId));
      save(db);
      return delay(undefined);
    },
    async addTaskComment(taskId: string, body: string) {
      const db = load();
      const comment: TaskComment = { id: `c-${db.seq++}`, taskId, authorId: meId(), body, createdAt: now() };
      db.comments.push(comment);
      const commented = db.tasks.find((t) => t.id === taskId);
      if (commented) log(db, commented, "comment", null, body.length > 140 ? `${body.slice(0, 140)}…` : body);
      save(db);
      return delay(comment);
    },

    async listLabels() {
      const db = load();
      const set = new Set<string>();
      db.tasks.forEach((t) => (t.labels ?? []).forEach((l) => set.add(l)));
      return delay(Array.from(set).sort((a, b) => a.localeCompare(b)));
    },
    async listInbox() {
      const db = load();
      const me = meId();
      return delay(
        visibleActivity(db).map(({ audience: _audience, readBy, ...item }): InboxItem => {
          void _audience;
          return { ...item, read: readBy.includes(me) };
        })
      );
    },
    async markInboxRead(ids: string[] | "all") {
      const db = load();
      const me = meId();
      const wanted = ids === "all" ? null : new Set(ids);
      visibleActivity(db).forEach((a) => {
        if ((!wanted || wanted.has(a.id)) && !a.readBy.includes(me)) a.readBy.push(me);
      });
      save(db);
      return delay(undefined);
    },

    async listWall() {
      const db = load();
      return delay(
        db.posts.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
      );
    },
    async createPost(input: { body: string; projectId?: string | null }) {
      const db = load();
      const post: WallPost = {
        id: `w-${db.seq++}`, authorId: meId(), body: input.body, projectId: input.projectId ?? null,
        pinned: false, likedBy: [], comments: [], createdAt: now(),
      };
      db.posts.push(post);
      save(db);
      return delay(post);
    },
    async deletePost(id: string) {
      const db = load();
      const post = db.posts.find((p) => p.id === id) ?? notFound("Post");
      if (post.authorId !== meId()) requireAdmin();
      db.posts = db.posts.filter((p) => p.id !== id);
      save(db);
      return delay(undefined);
    },
    async setPinned(id: string, pinned: boolean) {
      requireAdmin();
      const db = load();
      const post = db.posts.find((p) => p.id === id) ?? notFound("Post");
      post.pinned = pinned;
      save(db);
      return delay(post);
    },
    async toggleLike(id: string) {
      const db = load();
      const post = db.posts.find((p) => p.id === id) ?? notFound("Post");
      const me = meId();
      post.likedBy = post.likedBy.includes(me) ? post.likedBy.filter((x) => x !== me) : [...post.likedBy, me];
      save(db);
      return delay(post);
    },
    async addPostComment(postId: string, body: string) {
      const db = load();
      const post = db.posts.find((p) => p.id === postId) ?? notFound("Post");
      const comment: WallComment = { id: `wc-${db.seq++}`, postId, authorId: meId(), body, createdAt: now() };
      post.comments.push(comment);
      save(db);
      return delay(comment);
    },
  };
  return api;
}
