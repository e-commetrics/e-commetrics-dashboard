-- Tarjeta de resguardo, tercera versión (2026-11-20).
-- 1) Estado `skipped`: un admin quita de la hoja un requisito que no se usará (se puede restaurar).
-- 2) Orden de los requisitos propios dentro de su sección (se reacomodan arrastrando).
-- Correr después de 2026-11-19-requirements-custom.sql y ANTES de subir backend-actual.js.
-- No borra datos. Los requisitos propios conservan su orden actual (position = id).
ALTER TABLE project_requirements
  MODIFY status ENUM('pending', 'sent', 'verified', 'skipped') NOT NULL DEFAULT 'pending';

ALTER TABLE project_requirement_items ADD COLUMN position INT NOT NULL DEFAULT 0 AFTER label;
UPDATE project_requirement_items SET position = id;
