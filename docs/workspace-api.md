# Workspace (project management) — backend contract

The frontend lives in `src/app/dashboard/workspace/`. Until the backend exposes these
routes it runs on demo data kept in the browser (`lib/mock.ts`). To switch to the real
backend, add `NEXT_PUBLIC_PM_API=live` to `.env` and rebuild.

The TypeScript types in `src/app/dashboard/workspace/lib/types.ts` are the exact JSON
shapes. Keep both files in sync.

## Who can do what

| | admin | employee | client |
|---|---|---|---|
| Open the workspace | ✓ | ✓ | ✗ (decided 2026-11-13: team only) |
| See all projects | ✓ | ✓ | ✗ |
| Create / edit / delete projects | ✓ | ✗ | ✗ |
| Create / edit / delete tasks, subtasks, comments | ✓ | ✓ | ✗ |
| Post, like and comment on the wall | ✓ | ✓ | ✗ |
| Pin posts, delete anyone's post | ✓ | ✗ | ✗ |
| Delete own post | ✓ | ✓ | ✗ |

All `/api/pm/*` routes need the session cookie (`requireAuth`) and must reject
`role = 'client'` with 403, **except `GET /api/pm/client/summary`**, which is for clients and
returns only their own projects' progress (added 2026-11-13). Project writes need `requireAdmin`. The frontend guard
is UX only; the backend must enforce this.

## Changes to existing tables

```sql
-- New role. Employees are created where clients are created today, with role 'employee'.
ALTER TABLE users MODIFY role ENUM('admin','employee','client') NOT NULL DEFAULT 'client';
ALTER TABLE users ADD COLUMN job_title VARCHAR(120) NULL;
```

`AuthContext` now loads `/api/users/:id/apps` for employees too, so `can_view`
grants work for them on the web apps.

## New tables (MySQL)

```sql
CREATE TABLE pm_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  package_id ENUM('simple','advanced','grower','high-profile','custom') NULL, -- ids from src/lib/pricing.ts
  client_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
  client_project_name VARCHAR(200) NULL, -- projects.project_name of the client page
  status ENUM('planning','active','on_hold','completed','archived') NOT NULL DEFAULT 'planning',
  color CHAR(7) NOT NULL DEFAULT '#BD155C',
  owner_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE NULL,
  due_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE pm_project_members (
  project_id INT NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE pm_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
  parent_id INT NULL REFERENCES pm_tasks(id) ON DELETE CASCADE, -- subtasks: one level only
  title VARCHAR(300) NOT NULL,
  description TEXT NULL,
  link_url VARCHAR(2048) NULL, -- optional external link
  status ENUM('todo','pending','in_progress','done','review','accepted','rejected','blocked') NOT NULL DEFAULT 'todo',
  priority ENUM('urgent','high','normal','low') NOT NULL DEFAULT 'normal',
  due_date DATE NULL,
  position INT NOT NULL DEFAULT 0,
  created_by INT NOT NULL REFERENCES users(id),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  INDEX (project_id, parent_id, status)
);

CREATE TABLE pm_task_assignees (
  task_id INT NOT NULL REFERENCES pm_tasks(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id),
  INDEX (user_id)
);

CREATE TABLE pm_task_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL REFERENCES pm_tasks(id) ON DELETE CASCADE,
  author_id INT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pm_wall_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  project_id INT NULL REFERENCES pm_projects(id) ON DELETE SET NULL,
  pinned TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pm_wall_likes (
  post_id INT NOT NULL REFERENCES pm_wall_posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE pm_wall_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL REFERENCES pm_wall_posts(id) ON DELETE CASCADE,
  author_id INT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Labels (etiquetas): free text, shared across the workspace. `labels` in Task JSON
-- is the list of names for that task. PATCH /tasks/:id with `labels` replaces the list.
CREATE TABLE pm_task_labels (
  task_id INT NOT NULL REFERENCES pm_tasks(id) ON DELETE CASCADE,
  label VARCHAR(60) NOT NULL,
  PRIMARY KEY (task_id, label),
  INDEX (label)
);

-- Inbox: one row per change to a task. Written by the task/comment routes in the
-- same transaction as the change.
CREATE TABLE pm_task_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NULL,                  -- no FK; NULL for wall mentions
  post_id INT NULL,                  -- wall post, mentions only
  parent_task_id INT NULL,
  project_id INT NULL,
  task_title VARCHAR(255) NOT NULL,  -- snapshot at the time of the change
  actor_id INT NOT NULL REFERENCES users(id),
  kind ENUM('created','assigned','unassigned','status','priority','due_date','title',
            'description','labels','comment','subtask','deleted','mention') NOT NULL,
  from_value TEXT NULL,
  to_value TEXT NULL,               -- user id for assigned/unassigned; comment excerpt for comment
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (created_at), INDEX (task_id)
);

-- Who should see a row when they are an employee: the task's assignees (and the
-- parent task's, for a subtask) at the time of the change, plus the person
-- assigned/unassigned. Admins see every row and don't need entries here.
CREATE TABLE pm_task_activity_audience (
  activity_id INT NOT NULL REFERENCES pm_task_activity(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, user_id)
);

CREATE TABLE pm_task_activity_reads (
  activity_id INT NOT NULL REFERENCES pm_task_activity(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (activity_id, user_id)
);
```

Existing databases created before the task link field need:

```sql
ALTER TABLE pm_tasks ADD COLUMN link_url VARCHAR(2048) NULL AFTER description;
```

### What writes activity

| Route | Kinds written |
| --- | --- |
| `POST /projects/:id/tasks` | `created` (or `subtask` on the parent when `parentId` is set), plus `assigned` per assignee other than the caller |
| `PATCH /tasks/:id` | one row per field that really changed: `status`, `priority`, `due_date`, `title`, `description`, `labels` (from/to = comma-separated names); `assigned` / `unassigned` per person added or removed |
| `POST /tasks/:id/comments` | `comment` (`to` = first 140 characters) |
| `DELETE /tasks/:id` | `deleted` |

Insert the caller's own read row with each activity so their own changes never count as unread.

## Routes

Base: `${NEXT_PUBLIC_URL}/api/pm`. JSON in and out. Errors: `{ "error": "message" }` with
a 4xx/5xx status. Ids go out as strings, dates as ISO strings (`YYYY-MM-DD` for
`startDate`, `dueDate`). Field names are camelCase in JSON.

`TaskInput` = `title`, `parentId?`, `description?`, `linkUrl?`, `status?`, `priority?`, `assigneeIds?`, `dueDate?`, `labels?`. `linkUrl` is an optional external link; the API accepts it with or without scheme and stores it as `http(s)://…` (max 2048 chars).

| Method & path | Body | Response |
|---|---|---|
| `GET /me` | | `{ member: Member }` |
| `GET /members` | | `{ members: Member[] }` — admins, employees and clients (clients are needed to link projects). Never send password hashes. |
| `GET /projects` | | `{ projects: WorkProject[] }` with `memberIds` and `taskCounts` (top-level tasks only). Optional, used by the project card: `taskCounts.overdue` (open top-level tasks past their due date) and `nextDue: { title, dueDate } \| null` (the nearest open top-level task with a due date today or later). Without them the card hides the overdue count and the next delivery. |
| `POST /projects` (admin) | `ProjectInput` | `{ project }`. If `templateTasks` is present, insert one `todo` task per item in the same transaction. |
| `POST /projects/with-dashboard` (admin) | `{ id_user, title, project_name, content? }` for an existing client, or `{ newClient: { email, password, userName?, jobTitle? }, title, project_name, content? }` | Creates the client account when requested, its legacy client page and a linked Workspace project atomically. Response is `{ clientId, legacyProjectId, project }`. |
| `GET /projects/:id` | | `{ project, tasks: Task[] }` — all tasks and subtasks of the project |
| `PATCH /projects/:id` (admin) | `Partial<ProjectInput>` | `{ project }`. `memberIds` replaces the member list. |
| `DELETE /projects/:id` (admin) | | 204 |
| `PUT /projects/:id/stages` (admin) | `{ stages: [{ id?, name }] }` (in order, max 30) | `{ project }` — replaces the project's board columns. With `id` = rename/reorder; without = new; missing ones are deleted and their tasks get `stageId: null`. `project.stages` empty = board by task status. Tasks take `stageId` on create/PATCH (must belong to the project). Migration: `docs/migrations/2026-11-18-project-stages.sql`. |
| `GET /tasks?assignee=me` | | `{ tasks: TaskWithProject[] }` — tasks and subtasks assigned to the caller, with `projectName`, `projectColor` |
| `GET /tasks` | | `{ tasks: TaskWithProject[] }` — every **top-level** task the caller can see (same visibility as `GET /projects`), with `projectName`, `projectColor`. Feeds the team home: overdue, in review, and tasks completed this month vs last month (`completedAt`). |
| `GET /client/summary` | | `{ projects: ClientProjectSummary[] }` — **the only route clients may call.** Projects where `client_id` = caller. Per project: `taskCounts`, and three short lists of top-level tasks reduced to `{ title, status, dueDate, completedAt }`: `inProgress` (in_progress, rejected or blocked, max 5), `upNext` (todo or pending, max 3), `delivered` (done group: done, review, accepted; newest first, max 5). Never include comments, labels, assignees, descriptions or subtasks. |
| `POST /projects/:id/tasks` | `TaskInput` | `{ task }`. `position` = last in its group. Reject `parentId` that is itself a subtask. |
| `GET /tasks/:id` | | `{ task, subtasks: Task[], comments: TaskComment[] }` |
| `PATCH /tasks/:id` | `TaskPatch` | `{ task }`. Done group = `done`, `review`, `accepted`. Set `completedAt` when status enters the done group, clear it when it leaves, keep it when moving inside the group. **409** `{ error: "Tiene N subtareas pendientes" }` if a top-level task enters the done group with open subtasks. `assigneeIds` replaces the list. |
| `DELETE /tasks/:id` | | 204 (cascades subtasks and comments) |
| `POST /tasks/:id/comments` | `{ body }` | `{ comment }` |
| `GET /labels` | | `{ labels: string[] }` — distinct labels in use, sorted. Used to suggest labels in the task picker. |
| `GET /inbox` | | `{ items: InboxItem[] }` newest first, max 200. **Admin: all rows. Employee: only rows where they are in `pm_task_activity_audience`.** `read` = a row exists in `pm_task_activity_reads` for the caller. Join `pm_projects` for `projectName`, `projectColor`. |
| `POST /inbox/read` | `{ ids: string[] }` or `{ all: true }` | 204. Insert read rows for the caller, only for rows they are allowed to see. |
| `GET /wall` | | `{ posts: WallPost[] }` — pinned first, then newest; include `likedBy` and `comments`. Paginate later with `?before=<iso>`. |
| `POST /wall` | `{ body, projectId?, mentionIds? }` | `{ post }`. One `mention` activity row per mentioned admin/employee (author excluded, invalid ids ignored): `task_id` NULL, `post_id`, `from_value` = text excerpt, `to_value` = mentioned user id, audience = that user. |
| `PATCH /wall/:id` (admin) | `{ pinned }` | `{ post }` |
| `DELETE /wall/:id` | | 204 — author or admin |
| `POST /wall/:id/like` | | `{ post }` — toggles the caller's like |
| `POST /wall/:id/comments` | `{ body, mentionIds? }` | `{ comment }`. Same mention rows as `POST /wall`. |

Every task returns `subtaskCounts: { total, done }` and `commentCount` (subqueries or
`LEFT JOIN … GROUP BY`).

## Project progress

Progress is **always** `taskCounts.done / taskCounts.total` (top-level tasks). The hand-typed `projects.percentage` column of the old client pages is no longer shown anywhere; it can be dropped once nothing else reads it. A project with no linked workspace project shows no percentage.

## CORS

No change: same origin list and cookie as the rest of `/api`. `PATCH` and `DELETE`
must be in the allowed methods.

## Not built yet (ClickUp features to consider later)

email/push for inbox items (the inbox itself is built), time tracking,
file attachments, custom statuses per project, task dependencies, recurring tasks, a
timeline/Gantt view, and a read-only client view if that decision changes.
