-- Workspace (gestion de proyectos) — tablas para las rutas /api/pm/* del backend.
-- Contrato: docs/workspace-api.md. Correr en phpMyAdmin, en la base del dashboard,
-- en este orden. Las tablas nuevas no tocan datos existentes.
--
-- Diferencia con docs/workspace-api.md: las columnas que apuntan a users NO tienen
-- FOREIGN KEY (si el tipo de users.id no coincide exacto, MySQL rechaza la tabla).
-- El backend valida que esos usuarios existan y, al borrar un usuario, lo quita de
-- miembros, asignados y likes (DELETE /api/users/:id).

-- ─── 1. Revisar la tabla users ANTES de cambiarla ────────────────────────────
--
--   SHOW COLUMNS FROM users LIKE 'role';
--   SELECT role, COUNT(*) FROM users GROUP BY role;
--
-- Si `role` es ENUM('admin','client'), corre el ALTER de abajo.
-- Si `role` es VARCHAR, sáltalo: ya acepta 'employee'.
-- Si el SELECT muestra algun valor distinto de 'admin' o 'client', corrígelo antes.

ALTER TABLE users MODIFY role ENUM('admin','employee','client') NOT NULL DEFAULT 'client';

ALTER TABLE users ADD COLUMN job_title VARCHAR(120) NULL;

-- ─── 2. Tablas nuevas ────────────────────────────────────────────────────────

CREATE TABLE pm_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  package_id ENUM('simple','advanced','grower','high-profile','custom') NULL,
  client_id INT NULL,                 -- users.id con rol client
  client_project_name VARCHAR(200) NULL, -- projects.project_name de la pagina del cliente
  status ENUM('planning','active','on_hold','completed','archived') NOT NULL DEFAULT 'planning',
  color CHAR(7) NOT NULL DEFAULT '#BD155C',
  owner_id INT NULL,                  -- users.id
  start_date DATE NULL,
  due_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (client_id),
  INDEX (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pm_project_members (
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (project_id, user_id),
  INDEX (user_id),
  FOREIGN KEY (project_id) REFERENCES pm_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pm_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  parent_id INT NULL,                 -- subtareas: un solo nivel
  title VARCHAR(300) NOT NULL,
  description TEXT NULL,
  link_url VARCHAR(2048) NULL,        -- enlace externo opcional (documento, diseño...)
  status ENUM('todo','in_progress','review','done') NOT NULL DEFAULT 'todo',
  priority ENUM('urgent','high','normal','low') NOT NULL DEFAULT 'normal',
  due_date DATE NULL,
  position INT NOT NULL DEFAULT 0,
  created_by INT NOT NULL,            -- users.id
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  INDEX (project_id, parent_id, status),
  INDEX (parent_id),
  FOREIGN KEY (project_id) REFERENCES pm_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES pm_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pm_task_assignees (
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (task_id, user_id),
  INDEX (user_id),
  FOREIGN KEY (task_id) REFERENCES pm_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pm_task_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  author_id INT NOT NULL,             -- users.id
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (task_id),
  FOREIGN KEY (task_id) REFERENCES pm_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Etiquetas libres, compartidas por todo el espacio de trabajo.
CREATE TABLE pm_task_labels (
  task_id INT NOT NULL,
  label VARCHAR(60) NOT NULL,
  PRIMARY KEY (task_id, label),
  INDEX (label),
  FOREIGN KEY (task_id) REFERENCES pm_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pm_wall_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT NOT NULL,             -- users.id
  body TEXT NOT NULL,
  project_id INT NULL,
  pinned TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES pm_projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pm_wall_likes (
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES pm_wall_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pm_wall_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  author_id INT NOT NULL,             -- users.id
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (post_id),
  FOREIGN KEY (post_id) REFERENCES pm_wall_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bandeja: una fila por cambio en una tarea. Sin FK a pm_tasks a proposito: las
-- filas sobreviven al borrado de la tarea (por eso guarda una copia del titulo).
CREATE TABLE pm_task_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  parent_task_id INT NULL,
  project_id INT NOT NULL,
  task_title VARCHAR(255) NOT NULL,
  actor_id INT NOT NULL,              -- users.id
  kind ENUM('created','assigned','unassigned','status','priority','due_date','title',
            'description','labels','comment','subtask','deleted') NOT NULL,
  from_value TEXT NULL,
  to_value TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (created_at),
  INDEX (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quien ve cada fila si es employee (los admin ven todo).
CREATE TABLE pm_task_activity_audience (
  activity_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (activity_id, user_id),
  INDEX (user_id),
  FOREIGN KEY (activity_id) REFERENCES pm_task_activity(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pm_task_activity_reads (
  activity_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (activity_id, user_id),
  FOREIGN KEY (activity_id) REFERENCES pm_task_activity(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 3. Dar de alta al equipo ────────────────────────────────────────────────
-- La pantalla de crear usuario solo ofrece "client" y "admin". Para un empleado:
-- créalo ahí como client y luego cámbialo aquí (o cambia uno existente):
--
--   UPDATE users SET role = 'employee', job_title = 'Diseñadora' WHERE email = 'persona@ejemplo.com';
--
-- Ojo: el rol va dentro de la sesión (JWT). La persona debe cerrar sesión y volver
-- a entrar para que el cambio de rol aplique.
