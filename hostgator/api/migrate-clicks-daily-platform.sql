-- Migração: agregados diários por plataforma (clicks) e por página (pageviews).
-- Rodar em bancos que já têm as tabelas no formato antigo (sem platform/page).
-- Em bancos novos, o schema-local.sql já cria as tabelas corretas.
-- Se já migrou uma das tabelas, rode só o bloco da outra.

-- ----- clicks_daily: adicionar platform e source (agregação por rede social e origem) -----
-- Se a tabela só tem (date, total_count), rode estes 4:
ALTER TABLE clicks_daily ADD COLUMN platform VARCHAR(20) NOT NULL DEFAULT '' AFTER date;
ALTER TABLE clicks_daily ADD COLUMN source VARCHAR(255) NOT NULL DEFAULT '' AFTER platform;
ALTER TABLE clicks_daily DROP INDEX uk_date;
ALTER TABLE clicks_daily ADD UNIQUE KEY uk_date_platform_source (date, platform, source);

-- Se clicks_daily já tem platform mas não tem source, rode estes 3:
-- ALTER TABLE clicks_daily ADD COLUMN source VARCHAR(255) NOT NULL DEFAULT '' AFTER platform;
-- ALTER TABLE clicks_daily DROP INDEX uk_date_platform;
-- ALTER TABLE clicks_daily ADD UNIQUE KEY uk_date_platform_source (date, platform, source);

-- ----- pageviews_daily: agregação por source (facebook, tiktok, etc.) -----
-- Opção A: tabela antiga só com (date, total_count) — rode estes 3 comandos:
ALTER TABLE pageviews_daily ADD COLUMN source VARCHAR(255) NOT NULL DEFAULT '' AFTER date;
ALTER TABLE pageviews_daily DROP INDEX uk_date;
ALTER TABLE pageviews_daily ADD UNIQUE KEY uk_date_source (date, source);

-- Opção B: se você já tinha coluna "page" (migração anterior) — rode estes em vez dos de cima:
-- ALTER TABLE pageviews_daily CHANGE COLUMN page source VARCHAR(255) NOT NULL DEFAULT '';
-- ALTER TABLE pageviews_daily DROP INDEX uk_date_page;
-- ALTER TABLE pageviews_daily ADD UNIQUE KEY uk_date_source (date, source);
