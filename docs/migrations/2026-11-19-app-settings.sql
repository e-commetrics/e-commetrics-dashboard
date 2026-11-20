-- Ajustes globales editables por admin (2026-11-19). Primer uso: datos de la tarjeta de resguardo
-- (vault.meta_business_id, vault.google_email, vault.client_note). Tabla nueva; no toca nada existente.
-- Sin filas, el backend responde los valores por defecto, así que no hace falta sembrar nada.
CREATE TABLE app_settings (
  setting_key VARCHAR(60) NOT NULL,
  value VARCHAR(500) NULL,
  updated_by INT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
