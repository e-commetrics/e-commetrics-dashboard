-- Tarjeta de resguardo (2026-11-19): estado de cada requisito/acceso por página de cliente (tabla projects).
-- Tabla nueva; no toca nada existente. Nunca guarda contraseñas ni datos bancarios: info es usuario, link o dato público.
-- Sin FK a projects (su tipo de id no está en las migraciones); una fila huérfana no se muestra en ningún lado.
CREATE TABLE project_requirements (
  project_id INT NOT NULL,
  item_key VARCHAR(40) NOT NULL,
  status ENUM('pending', 'sent', 'verified') NOT NULL DEFAULT 'pending',
  info VARCHAR(255) NULL,
  comment VARCHAR(500) NULL,
  updated_by INT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, item_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
