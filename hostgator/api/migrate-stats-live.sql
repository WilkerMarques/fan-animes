-- =============================================================================
-- MIGRAÇÃO HOSTGATOR / PRODUÇÃO — modelo só com clicks_live + pageviews_live
-- =============================================================================
--
-- RESUMO RÁPIDO
--   • ADICIONAR: só a PARTE 1 abaixo (duas tabelas novas). É obrigatório.
--   • APAGAR:     nada é obrigatório. A API funciona com as tabelas antigas
--                 `clicks` e `pageviews` ainda no banco (o código não usa mais).
--   • OPCIONAL:   PARTE 2 remove só `clicks` e `pageviews` para liberar espaço,
--                 depois de você testar site + dashboard. NÃO rode em cópia se
--                 quiser manter histórico bruto antigo.
--
-- NÃO APAGUE: clicks_daily, clicks_daily_by_link, pageviews_daily — é o histórico
--             do dashboard (preenchido pelo cron).
--
-- Banco NOVO do zero: use schema-recreate.sql (já sem clicks/pageviews legadas).
--
-- =============================================================================

-- PARTE 1 — ADICIONAR (rode isto no phpMyAdmin; pode rodar várias vezes)

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

-- PARTE 2 — APAGAR (opcional; só depois de testar cliques, pageviews e dashboard)

-- DROP TABLE IF EXISTS clicks;
-- DROP TABLE IF EXISTS pageviews;
