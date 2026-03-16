-- Migração: tabela de agregados diários por link (label + platform).
-- Usada para que "Cliques por link" no dashboard bata com os totais quando o período é 7/14/28 dias
-- (os registros antigos de clicks são apagados pelo cron; só as somas por link ficam aqui).

CREATE TABLE IF NOT EXISTS clicks_daily_by_link (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  label VARCHAR(255) NOT NULL DEFAULT '',
  platform VARCHAR(20) NOT NULL DEFAULT '',
  total_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_label_platform (date, label(100), platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
