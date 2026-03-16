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

    // 1) Contar clicks do dia anterior POR PLATAFORMA e SOURCE (spotify+facebook, youtube+tiktok, etc.)
    $stmtClicks = $pdo->prepare("
        SELECT platform, COALESCE(source, '') AS source, COUNT(*) AS cnt
        FROM clicks
        WHERE DATE(clicked_at) = :date
        GROUP BY platform, source
    ");
    $stmtClicks->execute(['date' => $yesterday]);
    $clicksByPlatformSource = $stmtClicks->fetchAll(PDO::FETCH_ASSOC);
    $clicksCount = 0;

    // 2) Inserir/somar em clicks_daily uma linha por (date, platform, source)
    $insertClick = $pdo->prepare("
        INSERT INTO clicks_daily (date, platform, source, total_count)
        VALUES (:date, :platform, :source, :total)
        ON DUPLICATE KEY UPDATE total_count = total_count + :total2
    ");
    foreach ($clicksByPlatformSource as $row) {
        $platform = $row['platform'] ?? '';
        $source = $row['source'] ?? '';
        $cnt = (int) ($row['cnt'] ?? 0);
        if ($cnt > 0) {
            $insertClick->execute([
                'date'     => $yesterday,
                'platform' => $platform,
                'source'   => $source,
                'total'    => $cnt,
                'total2'   => $cnt,
            ]);
            $clicksCount += $cnt;
        }
    }

    // 2b) Inserir/somar em clicks_daily_by_link (por label + platform) para "Cliques por link" em 7/14/28 dias
    $stmtByLink = $pdo->prepare("
        SELECT COALESCE(label, '') AS label, COALESCE(platform, '') AS platform, COUNT(*) AS cnt
        FROM clicks
        WHERE DATE(clicked_at) = :date
        GROUP BY label, platform
    ");
    $stmtByLink->execute(['date' => $yesterday]);
    $clicksByLink = $stmtByLink->fetchAll(PDO::FETCH_ASSOC);
    try {
        $insertByLink = $pdo->prepare("
            INSERT INTO clicks_daily_by_link (date, label, platform, total_count)
            VALUES (:date, :label, :platform, :total)
            ON DUPLICATE KEY UPDATE total_count = total_count + :total2
        ");
        foreach ($clicksByLink as $row) {
            $label = $row['label'] ?? '';
            $platform = $row['platform'] ?? '';
            $cnt = (int) ($row['cnt'] ?? 0);
            if ($cnt > 0) {
                $insertByLink->execute([
                    'date'     => $yesterday,
                    'label'    => $label,
                    'platform' => $platform,
                    'total'    => $cnt,
                    'total2'   => $cnt,
                ]);
            }
        }
    } catch (Throwable $e) {
        // tabela clicks_daily_by_link pode não existir ainda (rodar migrate-clicks-daily-by-link.sql)
    }

    // 3) Contar pageviews do dia anterior POR SOURCE (facebook, tiktok, etc.)
    $stmtPv = $pdo->prepare("
        SELECT COALESCE(source, '') AS source, COUNT(*) AS cnt
        FROM pageviews
        WHERE DATE(viewed_at) = :date
        GROUP BY source
    ");
    $stmtPv->execute(['date' => $yesterday]);
    $pageviewsBySource = $stmtPv->fetchAll(PDO::FETCH_ASSOC);
    $pageviewsCount = 0;

    // 4) Inserir/somar em pageviews_daily uma linha por (date, source)
    $insertPv = $pdo->prepare("
        INSERT INTO pageviews_daily (date, source, total_count)
        VALUES (:date, :source, :total)
        ON DUPLICATE KEY UPDATE total_count = total_count + :total2
    ");
    foreach ($pageviewsBySource as $row) {
        $source = $row['source'] ?? '';
        $cnt = (int) ($row['cnt'] ?? 0);
        if ($cnt > 0) {
            $insertPv->execute([
                'date'   => $yesterday,
                'source' => $source,
                'total'  => $cnt,
                'total2' => $cnt,
            ]);
            $pageviewsCount += $cnt;
        }
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
