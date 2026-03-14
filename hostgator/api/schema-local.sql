-- Schema do banco para desenvolvimento local (compatível com a API PHP)
-- Criar um banco (ex: fan_animes_local) e importar este arquivo.

CREATE TABLE IF NOT EXISTS clicks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  platform ENUM('spotify', 'youtube', 'instagram', 'tiktok', '') NOT NULL DEFAULT '',
  device ENUM('mobile', 'desktop') NOT NULL DEFAULT 'desktop',
  source VARCHAR(255) NULL,
  clicked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_clicked_at (clicked_at),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pageviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page VARCHAR(255) NOT NULL DEFAULT 'home',
  device ENUM('mobile', 'desktop') NOT NULL DEFAULT 'desktop',
  source VARCHAR(255) NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_viewed_at (viewed_at),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabelas opcionais (agregados diários, se usar cron no futuro)
CREATE TABLE IF NOT EXISTS clicks_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pageviews_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
