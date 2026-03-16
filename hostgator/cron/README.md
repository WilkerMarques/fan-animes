# Cron – agregação diária

## Script

- **`aggregate_daily.php`** – Agrega clicks **por plataforma** (Spotify, YouTube, etc.) e **por link** (label + platform) do dia anterior em `clicks_daily` e `clicks_daily_by_link`, e pageviews **por source** em `pageviews_daily`; depois apaga os registros antigos. No dashboard, os totais e **cliques por link** (7/14/28 dias) batem com o banco.

**Se as tabelas foram criadas antes** (sem colunas `platform` / `page`), rode uma vez no banco: `api/migrate-clicks-daily-platform.sql`.  
**Para "Cliques por link" em 7/14/28 dias**, crie a tabela com: `api/migrate-clicks-daily-by-link.sql`.

## Agendamento no cPanel

- **Horário:** todo dia à 1h da manhã  
- **Cron:** `0 1 * * *`
- **Comando:**  
  `/usr/local/bin/php /home2/kelfer09/public_html/cron/aggregate_daily.php >/dev/null 2>&1`

O script usa o `config.php` da API (`../api/config.php`), então as credenciais do banco já vêm do `config.local.php` do servidor.
