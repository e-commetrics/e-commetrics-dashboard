-- Etapas propias por proyecto (columnas del tablero estilo ClickUp), 2026-11-18.
-- Tabla nueva + columna nullable en pm_tasks: los proyectos sin etapas siguen igual (tablero por estado).
CREATE TABLE pm_project_stages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(80) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  INDEX (project_id, position),
  FOREIGN KEY (project_id) REFERENCES pm_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE pm_tasks
  ADD COLUMN stage_id INT NULL,
  ADD CONSTRAINT fk_pm_tasks_stage FOREIGN KEY (stage_id) REFERENCES pm_project_stages(id) ON DELETE SET NULL;
