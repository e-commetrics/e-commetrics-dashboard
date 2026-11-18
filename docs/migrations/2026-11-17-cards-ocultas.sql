-- Cards ocultas para el cliente (2026-11-17). Solo agrega una columna; las filas existentes quedan visibles.
-- 0 = visible, 1 = oculta hasta completarla (se publica sola al agregar link o imagen), 2 = oculta a mano.
ALTER TABLE projects_content
  ADD COLUMN hidden TINYINT(1) NOT NULL DEFAULT 0;
