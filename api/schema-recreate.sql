-- ============================================================
-- RECRIAR BANCO DO ZERO (local e servidor)
-- Rode este arquivo para apagar as tabelas e criar de novo.
-- Use para começar limpo e testar a partir de amanhã.
-- ============================================================

-- 1) Apagar tabelas (ordem: daily primeiro, depois as que recebem inserts)
DROP TABLE IF EXISTS pageviews_daily;
DROP TABLE IF EXISTS clicks_daily_by_link;
DROP TABLE IF EXISTS clicks_daily;
DROP TABLE IF EXISTS pageviews;
DROP TABLE IF EXISTS clicks;

-- 2) Criar tabelas na estrutura final

CREATE TABLE clicks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  platform ENUM('spotify', 'youtube', 'instagram', 'tiktok', '') NOT NULL DEFAULT '',
  device ENUM('mobile', 'desktop') NOT NULL DEFAULT 'desktop',
  source VARCHAR(255) NULL,
  clicked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_clicked_at (clicked_at),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pageviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page VARCHAR(255) NOT NULL DEFAULT 'home',
  device ENUM('mobile', 'desktop') NOT NULL DEFAULT 'desktop',
  source VARCHAR(255) NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_viewed_at (viewed_at),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE clicks_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  platform VARCHAR(20) NOT NULL DEFAULT '',
  source VARCHAR(255) NOT NULL DEFAULT '',
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_platform_source (date, platform, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE clicks_daily_by_link (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  label VARCHAR(255) NOT NULL DEFAULT '',
  platform VARCHAR(20) NOT NULL DEFAULT '',
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_label_platform (date, label(100), platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pageviews_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  source VARCHAR(255) NOT NULL DEFAULT '',
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_source (date, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
