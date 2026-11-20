-- Notas privadas del equipo en Workspace (2026-11-19). Tablas nuevas; no toca nada existente.
-- Cada nota es de una sola persona (owner_id = users.id); el backend nunca devuelve notas ajenas.
-- kind: 'links' (lista de links) o 'text' (texto libre en body).
CREATE TABLE pm_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  kind ENUM('links', 'text') NOT NULL,
  title VARCHAR(120) NOT NULL,
  body MEDIUMTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (owner_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pm_note_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  description VARCHAR(300) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (note_id),
  FOREIGN KEY (note_id) REFERENCES pm_notes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
