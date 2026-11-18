-- Clientes fijados en el sidebar, por usuario (2026-11-17). Tabla nueva; no toca nada existente.
CREATE TABLE user_sidebar_pins (
  user_id INT NOT NULL,
  client_key VARCHAR(64) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, client_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
