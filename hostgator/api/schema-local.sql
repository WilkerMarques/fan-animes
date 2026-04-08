-- Banco local: importar em um MySQL vazio (ex.: fan_animes_local).

CREATE TABLE IF NOT EXISTS clicks_live (
  stat_date DATE NOT NULL,
  label VARCHAR(255) NOT NULL,
  platform VARCHAR(20) NOT NULL DEFAULT '',
  source VARCHAR(255) NOT NULL DEFAULT '',
  hit_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_device ENUM('mobile', 'desktop') NOT NULL DEFAULT 'desktop',
  last_clicked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stat_date, label(120), platform, source(120)),
  INDEX idx_stat_last (stat_date, last_clicked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pageviews_live (
  stat_date DATE NOT NULL,
  page VARCHAR(255) NOT NULL DEFAULT 'home',
  device ENUM('mobile', 'desktop') NOT NULL DEFAULT 'desktop',
  source VARCHAR(255) NOT NULL DEFAULT '',
  hit_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stat_date, page(120), device, source(120)),
  INDEX idx_pv_stat_last (stat_date, last_viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clicks_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  platform VARCHAR(20) NOT NULL DEFAULT '',
  source VARCHAR(255) NOT NULL DEFAULT '',
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_platform_source (date, platform, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clicks_daily_by_link (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  label VARCHAR(255) NOT NULL DEFAULT '',
  platform VARCHAR(20) NOT NULL DEFAULT '',
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_label_platform (date, label(100), platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pageviews_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  source VARCHAR(255) NOT NULL DEFAULT '',
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_source (date, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
