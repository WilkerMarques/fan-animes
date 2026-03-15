<?php
/**
 * Agregação diária de clicks e pageviews.
 * Deve rodar todo dia à 1h da manhã (cron: 0 1 * * *).
 *
 * 1) Conta registros de clicks e pageviews do DIA ANTERIOR.
 * 2) Soma esses valores às tabelas clicks_daily e pageviews_daily (por data).
 * 3) Remove de clicks e pageviews todos os registros com data < hoje.
 */

// Carrega config e PDO da API (path para quando o script está em public_html/cron/)
$configPath = __DIR__ . '/../api/config.php';
if (!is_file($configPath)) {
    fwrite(STDERR, "aggregate_daily: config não encontrado em {$configPath}\n");
    exit(1);
}
require_once $configPath;

if (!isset($pdo) || !$pdo) {
    fwrite(STDERR, "aggregate_daily: conexão com o banco não disponível\n");
    exit(1);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Dia a agregar: ontem (ao rodar à 1h, fechamos o dia anterior)
$yesterday = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))
    ->modify('-1 day')
    ->format('Y-m-d');

try {
    $pdo->beginTransaction();

    // 1) Contar clicks do dia anterior
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS cnt
        FROM clicks
        WHERE DATE(clicked_at) = :date
    ");
    $stmt->execute(['date' => $yesterday]);
    $clicksCount = (int) $stmt->fetchColumn();

    // 2) Somar ao clicks_daily (INSERT ou soma se já existir linha daquela data)
    if ($clicksCount > 0) {
        $pdo->prepare("
            INSERT INTO clicks_daily (date, total_count)
            VALUES (:date, :total)
            ON DUPLICATE KEY UPDATE total_count = total_count + :total2
        ")->execute([
            'date'   => $yesterday,
            'total'  => $clicksCount,
            'total2' => $clicksCount,
        ]);
    }

    // 3) Contar pageviews do dia anterior
    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS cnt
        FROM pageviews
        WHERE DATE(viewed_at) = :date
    ");
    $stmt->execute(['date' => $yesterday]);
    $pageviewsCount = (int) $stmt->fetchColumn();

    // 4) Somar ao pageviews_daily
    if ($pageviewsCount > 0) {
        $pdo->prepare("
            INSERT INTO pageviews_daily (date, total_count)
            VALUES (:date, :total)
            ON DUPLICATE KEY UPDATE total_count = total_count + :total2
        ")->execute([
            'date'   => $yesterday,
            'total'  => $pageviewsCount,
            'total2' => $pageviewsCount,
        ]);
    }

    // 5) Deletar de clicks e pageviews todos os registros com data < hoje (mantém só hoje)
    $today = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d');
    $stmtC = $pdo->prepare("DELETE FROM clicks WHERE DATE(clicked_at) < :today");
    $stmtC->execute(['today' => $today]);
    $deletedClicks = $stmtC->rowCount();
    $stmtP = $pdo->prepare("DELETE FROM pageviews WHERE DATE(viewed_at) < :today");
    $stmtP->execute(['today' => $today]);
    $deletedPageviews = $stmtP->rowCount();

    $pdo->commit();

    // Log opcional (no cron costuma ir para /dev/null; pode redirecionar para arquivo se quiser)
    echo date('Y-m-d H:i:s') . " aggregate_daily: date={$yesterday} clicks={$clicksCount} pageviews={$pageviewsCount} | deleted clicks={$deletedClicks} pageviews={$deletedPageviews}\n";
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    fwrite(STDERR, "aggregate_daily: erro - " . $e->getMessage() . "\n");
    exit(1);
}
