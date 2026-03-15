# Cron – agregação diária

## Script

- **`aggregate_daily.php`** – Agrega clicks e pageviews do dia anterior nas tabelas `clicks_daily` e `pageviews_daily`, depois apaga os registros antigos de `clicks` e `pageviews`.

## Agendamento no cPanel

- **Horário:** todo dia à 1h da manhã  
- **Cron:** `0 1 * * *`
- **Comando:**  
  `/usr/local/bin/php /home2/kelfer09/public_html/cron/aggregate_daily.php >/dev/null 2>&1`

O script usa o `config.php` da API (`../api/config.php`), então as credenciais do banco já vêm do `config.local.php` do servidor.
