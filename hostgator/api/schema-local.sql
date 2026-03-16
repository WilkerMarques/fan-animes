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

-- Tabelas opcionais (agregados diários por plataforma e origem; cron preenche)
CREATE TABLE IF NOT EXISTS clicks_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  platform VARCHAR(20) NOT NULL DEFAULT '',
  source VARCHAR(255) NOT NULL DEFAULT '',
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_platform_source (date, platform, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agregados diários por link (label + platform); cron preenche; usado em "Cliques por link" para 7/14/28 dias
CREATE TABLE IF NOT EXISTS clicks_daily_by_link (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  label VARCHAR(255) NOT NULL DEFAULT '',
  platform VARCHAR(20) NOT NULL DEFAULT '',
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_label_platform (date, label(100), platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agregados diários por origem do tráfego (facebook, tiktok, etc.); cron preenche
CREATE TABLE IF NOT EXISTS pageviews_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  source VARCHAR(255) NOT NULL DEFAULT '',
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_source (date, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
