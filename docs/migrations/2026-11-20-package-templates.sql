-- Ajustes del dashboard (2026-11-20): tareas precargadas por paquete, editables por admin.
-- Una fila por paquete con la lista completa en JSON ([{ "title", "description" }]).
-- Sin fila, el paquete usa las tareas de siempre (inclusiones de src/lib/pricing.ts).
-- Solo afecta a proyectos nuevos. Tabla nueva; no toca nada existente.
-- Correr ANTES de subir backend-actual.js.
CREATE TABLE pm_package_templates (
  package_id VARCHAR(40) NOT NULL,
  tasks MEDIUMTEXT NOT NULL,
  updated_by INT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (package_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
