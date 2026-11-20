-- App CRM (2026-11-20, BACKLOG «Pendiente por aplicar: app CRM»). Paso 1 de 2: tabla nueva, no toca datos.
-- Un CRM es un proyecto con etapas (pm_project_stages); sus leads viven aquí, fuera de las tareas.
-- Correr ANTES de subir backend-actual.js. El paso 2 (mover las tareas de ClickUp) es
-- 2026-11-20-crm-leads-migrar.sql.
CREATE TABLE pm_crm_leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  stage_id INT NULL,
  name VARCHAR(300) NOT NULL,
  description TEXT NULL,
  link_url VARCHAR(2048) NULL,
  priority ENUM('urgent','high','normal','low') NOT NULL DEFAULT 'normal',
  due_date DATE NULL,
  owner_id INT NULL,
  position INT NOT NULL DEFAULT 0,
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (project_id, stage_id, position),
  FOREIGN KEY (project_id) REFERENCES pm_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES pm_project_stages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
