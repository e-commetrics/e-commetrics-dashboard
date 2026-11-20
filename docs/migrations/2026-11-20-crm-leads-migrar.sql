-- App CRM, paso 2 de 2 (2026-11-20): mover las 91 tareas importadas de ClickUp del proyecto 5
-- «CRM Leads&Negotiate» a leads del CRM, y quitar las labels de etapa que trajo la importación.
--
-- ⚠ BORRA DATOS. Antes: respaldo de pm_tasks y pm_task_labels (phpMyAdmin → Exportar), y correr
--   2026-11-20-crm-leads.sql y subir el backend nuevo.
-- Correr bloque por bloque y revisar los conteos antes de seguir.

-- 1) Revisión (solo lectura). Esperado: 91 tareas, 0 subtareas, 6 labels de etapa.
SELECT COUNT(*) AS tareas, SUM(parent_id IS NOT NULL) AS subtareas FROM pm_tasks WHERE project_id = 5;
SELECT l.label, COUNT(*) AS n FROM pm_task_labels l JOIN pm_tasks t ON t.id = l.task_id
 WHERE t.project_id = 5 GROUP BY l.label;

-- 2) Copiar las tareas como leads (conserva etapa, prioridad, fecha, link, descripción y orden).
START TRANSACTION;
INSERT INTO pm_crm_leads (project_id, stage_id, name, description, link_url, priority, due_date, position, created_by, created_at)
SELECT project_id, stage_id, title, description, link_url, priority, due_date, position, created_by, created_at
  FROM pm_tasks WHERE project_id = 5 AND parent_id IS NULL;
-- Esperado: 91.
SELECT COUNT(*) AS leads FROM pm_crm_leads WHERE project_id = 5;
COMMIT;

-- 3) Borrar las tareas del proyecto 5. Sus labels, responsables y comentarios se borran solos (FK en cascada).
--    El proyecto y sus etapas se quedan: son el CRM.
DELETE FROM pm_tasks WHERE project_id = 5;

-- 4) Comprobación. Esperado: 0 tareas, 91 leads.
SELECT (SELECT COUNT(*) FROM pm_tasks WHERE project_id = 5) AS tareas,
       (SELECT COUNT(*) FROM pm_crm_leads WHERE project_id = 5) AS leads;
