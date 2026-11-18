-- Briefs del formulario /book del sitio público (2026-11-18). Tabla nueva; no toca nada existente.
-- ip_hash: SHA-256 de la IP (no se guarda la IP), usado solo para el límite de 5 envíos por hora.
CREATE TABLE site_briefs (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  company VARCHAR(160) NULL,
  website VARCHAR(200) NULL,
  need VARCHAR(40) NOT NULL DEFAULT 'not-sure',
  timeline VARCHAR(20) NOT NULL DEFAULT 'exploring',
  message TEXT NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_site_briefs_ip_created (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
