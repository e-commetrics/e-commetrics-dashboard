-- Mejoras del espacio de trabajo (2026-11-17).
-- Solo agrega: ninguna fila existente cambia ni se borra.
-- Correr en phpMyAdmin ANTES de subir el backend nuevo.

-- 0) Antes: anota estos conteos para compararlos despues.
SELECT status, COUNT(*) AS n FROM pm_tasks GROUP BY status;

-- 1) Estados de ClickUp: agrega pending, accepted, rejected, blocked.
ALTER TABLE pm_tasks
  MODIFY status ENUM('todo','pending','in_progress','done','review','accepted','rejected','blocked') NOT NULL DEFAULT 'todo';

-- 2) Menciones del muro en la bandeja: columna post_id, task_id/project_id opcionales, tipo 'mention'.
ALTER TABLE pm_task_activity
  MODIFY task_id INT NULL,
  MODIFY project_id INT NULL,
  ADD COLUMN post_id INT NULL AFTER task_id,
  MODIFY kind ENUM('created','assigned','unassigned','status','priority','due_date','title',
                   'description','labels','comment','subtask','deleted','mention') NOT NULL;

-- 3) Despues: los conteos deben ser iguales a los del paso 0.
SELECT status, COUNT(*) AS n FROM pm_tasks GROUP BY status;
