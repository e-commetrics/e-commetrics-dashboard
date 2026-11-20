-- Tarjeta de resguardo, segunda versión (2026-11-19).
-- 1) Segunda columna de Información en cada requisito.
-- 2) Requisitos propios por página ("Agregar requisito" en cada sección). Su clave en
--    project_requirements es `custom_<id>`. Solo un admin los borra (el backend borra también su fila).
-- Correr después de 2026-11-19-project-requirements.sql. No borra ni cambia datos existentes.
ALTER TABLE project_requirements ADD COLUMN info2 VARCHAR(255) NULL AFTER info;

CREATE TABLE project_requirement_items (
  id INT NOT NULL AUTO_INCREMENT,
  project_id INT NOT NULL,
  section_id VARCHAR(20) NOT NULL,
  label VARCHAR(120) NOT NULL,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
