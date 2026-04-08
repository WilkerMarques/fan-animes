<?php

$configPath = __DIR__ . '/../api/config.php';
if (!is_file($configPath)) {
    fwrite(STDERR, "aggregate_daily: config não encontrado em {$configPath}\n");
    exit(1);
}
require_once $configPath;
require_once dirname($configPath) . '/_lib/stats_live.php';

if (!isset($pdo) || !$pdo) {
    fwrite(STDERR, "aggregate_daily: conexão com o banco não disponível\n");
    exit(1);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$yesterday = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))
    ->modify('-1 day')
    ->format('Y-m-d');

try {
    $pdo->beginTransaction();

    $stmtLiveC = $pdo->prepare(
        "SELECT platform, COALESCE(source, '') AS source, SUM(hit_count) AS cnt
         FROM clicks_live WHERE stat_date = :d GROUP BY platform, source"
    );
    $stmtLiveC->execute(['d' => $yesterday]);
    $clicksMap = [];
    foreach ($stmtLiveC->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $platform = $row['platform'] ?? '';
        $source = $row['source'] ?? '';
        $cnt = (int) ($row['cnt'] ?? 0);
        if ($cnt > 0) {
            $k = $platform . "\0" . $source;
            $clicksMap[$k] = ($clicksMap[$k] ?? 0) + $cnt;
        }
    }
    $clicksCount = 0;

    $insertClick = $pdo->prepare("
        INSERT INTO clicks_daily (date, platform, source, total_count)
        VALUES (:date, :platform, :source, :total)
        ON DUPLICATE KEY UPDATE total_count = total_count + :total2
    ");
    foreach ($clicksMap as $k => $cnt) {
        if ($cnt <= 0) {
            continue;
        }
        [$platform, $source] = array_pad(explode("\0", $k, 2), 2, '');
        $insertClick->execute([
            'date'     => $yesterday,
            'platform' => $platform,
            'source'   => $source,
            'total'    => $cnt,
            'total2'   => $cnt,
        ]);
        $clicksCount += $cnt;
    }

    $stmtLiveBl = $pdo->prepare(
        "SELECT COALESCE(label, '') AS label, COALESCE(platform, '') AS platform, SUM(hit_count) AS cnt
         FROM clicks_live WHERE stat_date = :d GROUP BY label, platform"
    );
    $stmtLiveBl->execute(['d' => $yesterday]);
    $byLinkMap = [];
    foreach ($stmtLiveBl->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $label = $row['label'] ?? '';
        $platform = $row['platform'] ?? '';
        $cnt = (int) ($row['cnt'] ?? 0);
        if ($cnt > 0) {
            $k = $label . "\0" . $platform;
            $byLinkMap[$k] = ($byLinkMap[$k] ?? 0) + $cnt;
        }
    }
    try {
        $insertByLink = $pdo->prepare("
            INSERT INTO clicks_daily_by_link (date, label, platform, total_count)
            VALUES (:date, :label, :platform, :total)
            ON DUPLICATE KEY UPDATE total_count = total_count + :total2
        ");
        foreach ($byLinkMap as $k => $cnt) {
            if ($cnt <= 0) {
                continue;
            }
            [$label, $platform] = array_pad(explode("\0", $k, 2), 2, '');
            $insertByLink->execute([
                'date'     => $yesterday,
                'label'    => $label,
                'platform' => $platform,
                'total'    => $cnt,
                'total2'   => $cnt,
            ]);
        }
    } catch (Throwable $e) {
    }

    $stmtLivePv = $pdo->prepare(
        "SELECT COALESCE(source, '') AS source, SUM(hit_count) AS cnt
         FROM pageviews_live WHERE stat_date = :d GROUP BY source"
    );
    $stmtLivePv->execute(['d' => $yesterday]);
    $pvMap = [];
    foreach ($stmtLivePv->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $source = $row['source'] ?? '';
        $cnt = (int) ($row['cnt'] ?? 0);
        if ($cnt > 0) {
            $pvMap[$source] = ($pvMap[$source] ?? 0) + $cnt;
        }
    }
    $pageviewsCount = 0;

    $insertPv = $pdo->prepare("
        INSERT INTO pageviews_daily (date, source, total_count)
        VALUES (:date, :source, :total)
        ON DUPLICATE KEY UPDATE total_count = total_count + :total2
    ");
    foreach ($pvMap as $source => $cnt) {
        if ($cnt <= 0) {
            continue;
        }
        $insertPv->execute([
            'date'   => $yesterday,
            'source' => $source,
            'total'  => $cnt,
            'total2' => $cnt,
        ]);
        $pageviewsCount += $cnt;
    }

    $today = todayStatDate();
    $stmtLc = $pdo->prepare('DELETE FROM clicks_live WHERE stat_date < :today');
    $stmtLc->execute(['today' => $today]);
    $deletedLiveClicks = $stmtLc->rowCount();
    $stmtLp = $pdo->prepare('DELETE FROM pageviews_live WHERE stat_date < :today');
    $stmtLp->execute(['today' => $today]);
    $deletedLivePv = $stmtLp->rowCount();

    $pdo->commit();

    echo date('Y-m-d H:i:s') . " aggregate_daily: date={$yesterday} clicks={$clicksCount} pageviews={$pageviewsCount} | deleted live_clicks={$deletedLiveClicks} live_pv={$deletedLivePv}\n";
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    fwrite(STDERR, "aggregate_daily: erro - " . $e->getMessage() . "\n");
    exit(1);
}
