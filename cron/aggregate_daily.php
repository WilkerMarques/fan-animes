<?php
/**
 * Agregação diária: conta pageviews e clicks do dia anterior,
 * grava em pageviews_daily e clicks_daily, e apaga as linhas antigas.
 * Executar todo dia via cron (ex: 1h da manhã).
 *
 * No HostGator: Cron job → 0 1 * * * php /home/USUARIO/public_html/cron/aggregate_daily.php
 */

// Ajuste o caminho se config.php estiver em outro lugar (ex: public_html/api/config.php)
$base = dirname(__DIR__);
$configPath = $base . '/api/config.php';
if (!file_exists($configPath)) {
    fwrite(STDERR, "config.php não encontrado em: $configPath\n");
    exit(1);
}
require_once $configPath;

$pdo = getDb();
if (!$pdo) {
    fwrite(STDERR, "Erro ao conectar ao banco\n");
    exit(1);
}

// Data de ontem (agregar tudo que for anterior a hoje)
$today = date('Y-m-d');
$yesterday = date('Y-m-d', strtotime('-1 day'));

// --- PAGEVIEWS: agregar por data e inserir em pageviews_daily, depois apagar
$stmt = $pdo->query("
    SELECT DATE(viewed_at) AS d, COUNT(*) AS c
    FROM pageviews
    WHERE viewed_at < '$today 00:00:00'
    GROUP BY DATE(viewed_at)
");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $date = $row['d'];
    $count = (int) $row['c'];
    $pdo->exec("
        INSERT INTO pageviews_daily (date, total_count)
        VALUES ('$date', $count)
        ON DUPLICATE KEY UPDATE total_count = total_count + $count
    ");
}
$pdo->exec("DELETE FROM pageviews WHERE viewed_at < '$today 00:00:00'");

// --- CLICKS: mesmo processo
$stmt = $pdo->query("
    SELECT DATE(clicked_at) AS d, COUNT(*) AS c
    FROM clicks
    WHERE clicked_at < '$today 00:00:00'
    GROUP BY DATE(clicked_at)
");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $date = $row['d'];
    $count = (int) $row['c'];
    $pdo->exec("
        INSERT INTO clicks_daily (date, total_count)
        VALUES ('$date', $count)
        ON DUPLICATE KEY UPDATE total_count = total_count + $count
    ");
}
$pdo->exec("DELETE FROM clicks WHERE clicked_at < '$today 00:00:00'");

echo "Agregação concluída para dados antes de $today\n";
