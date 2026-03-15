# Cron – agregação diária

## Script

- **`aggregate_daily.php`** – Agrega clicks **por plataforma** (Spotify, YouTube, etc.) e pageviews **por source** (Facebook, TikTok, etc.) do dia anterior em `clicks_daily` e `pageviews_daily`, depois apaga os registros antigos. No dashboard, os totais por rede social e por origem do tráfego batem com o total (histórico + dia atual).

**Se as tabelas foram criadas antes** (sem colunas `platform` / `page`), rode uma vez no banco: `api/migrate-clicks-daily-platform.sql`.

## Agendamento no cPanel

- **Horário:** todo dia à 1h da manhã  
- **Cron:** `0 1 * * *`
- **Comando:**  
  `/usr/local/bin/php /home2/kelfer09/public_html/cron/aggregate_daily.php >/dev/null 2>&1`

O script usa o `config.php` da API (`../api/config.php`), então as credenciais do banco já vêm do `config.local.php` do servidor.
