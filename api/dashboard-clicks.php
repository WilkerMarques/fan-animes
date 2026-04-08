<?php
require_once __DIR__ . '/_lib/cors.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_lib/session.php';
require_once __DIR__ . '/_lib/stats_live.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

if (!isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado']);
    exit;
}

global $pdo;
if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'Banco não configurado']);
    exit;
}

try {
    $today = todayStatDate();

    $stmtRecent = $pdo->prepare(
        'SELECT label, platform, last_device, source, last_clicked_at, hit_count
         FROM clicks_live WHERE stat_date = :today
         ORDER BY last_clicked_at DESC LIMIT 40'
    );
    $stmtRecent->execute(['today' => $today]);
    $recentRaw = $stmtRecent->fetchAll(PDO::FETCH_ASSOC);
    $recent = [];
    foreach ($recentRaw as $r) {
        $recent[] = [
            'label' => $r['label'] ?? '',
            'platform' => $r['platform'] ?? '',
            'device' => $r['last_device'] ?? 'desktop',
            'source' => isset($r['source']) && $r['source'] !== '' ? $r['source'] : null,
            'clicked_at' => isset($r['last_clicked_at']) ? date('c', strtotime((string) $r['last_clicked_at'])) : null,
            'hit_count' => max(1, (int) ($r['hit_count'] ?? 1)),
        ];
    }

    $stmtTodayBreakdown = $pdo->prepare(
        'SELECT platform, COALESCE(source, \'\') AS source, SUM(hit_count) AS cnt
         FROM clicks_live WHERE stat_date = :today GROUP BY platform, source'
    );
    $stmtTodayBreakdown->execute(['today' => $today]);
    $today_breakdown = $stmtTodayBreakdown->fetchAll(PDO::FETCH_ASSOC);
    foreach ($today_breakdown as &$b) {
        $b['cnt'] = (int) ($b['cnt'] ?? 0);
        $b['platform'] = isset($b['platform']) ? (string) $b['platform'] : '';
        $b['source'] = isset($b['source']) ? (string) $b['source'] : '';
    }
    unset($b);

    $today_by_link = [];
    try {
        $stmtByLinkToday = $pdo->prepare(
            'SELECT COALESCE(label, \'\') AS label, COALESCE(platform, \'\') AS platform, COALESCE(source, \'\') AS source, SUM(hit_count) AS cnt
             FROM clicks_live WHERE stat_date = :today GROUP BY label, platform, source'
        );
        $stmtByLinkToday->execute(['today' => $today]);
        $today_by_link = $stmtByLinkToday->fetchAll(PDO::FETCH_ASSOC);
        foreach ($today_by_link as &$t) {
            $t['cnt'] = (int) ($t['cnt'] ?? 0);
            $t['label'] = isset($t['label']) ? (string) $t['label'] : '';
            $t['platform'] = isset($t['platform']) ? (string) $t['platform'] : '';
            $t['source'] = isset($t['source']) ? (string) $t['source'] : '';
        }
        unset($t);
    } catch (Throwable $e) {
        $today_by_link = [];
    }

    $daily = [];
    try {
        $stmtDaily = $pdo->query("SELECT date, platform, source, total_count FROM clicks_daily ORDER BY date ASC, platform, source");
        $daily = $stmtDaily->fetchAll(PDO::FETCH_ASSOC);
        foreach ($daily as &$d) {
            $d['date'] = $d['date'] ?? null;
            $d['platform'] = isset($d['platform']) ? (string) $d['platform'] : '';
            $d['source'] = isset($d['source']) ? (string) $d['source'] : '';
            $d['total_count'] = (int) ($d['total_count'] ?? 0);
        }
    } catch (Throwable $e) {
        try {
            $stmtDaily = $pdo->query("SELECT date, platform, total_count FROM clicks_daily ORDER BY date ASC, platform");
            $rows = $stmtDaily->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) {
                $daily[] = ['date' => $r['date'] ?? null, 'platform' => (string) ($r['platform'] ?? ''), 'source' => '', 'total_count' => (int) ($r['total_count'] ?? 0)];
            }
        } catch (Throwable $e2) {
            try {
                $stmtDaily = $pdo->query("SELECT date, total_count FROM clicks_daily ORDER BY date ASC");
                $rows = $stmtDaily->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $r) {
                    $daily[] = ['date' => $r['date'] ?? null, 'platform' => '', 'source' => '', 'total_count' => (int) ($r['total_count'] ?? 0)];
                }
            } catch (Throwable $e3) {
            }
        }
    }

    $dailyByLink = [];
    try {
        $stmtByLink = $pdo->query("SELECT date, label, platform, total_count FROM clicks_daily_by_link ORDER BY date ASC, label, platform");
        $dailyByLink = $stmtByLink->fetchAll(PDO::FETCH_ASSOC);
        foreach ($dailyByLink as &$d) {
            $d['date'] = $d['date'] ?? null;
            $d['label'] = isset($d['label']) ? (string) $d['label'] : '';
            $d['platform'] = isset($d['platform']) ? (string) $d['platform'] : '';
            $d['total_count'] = (int) ($d['total_count'] ?? 0);
        }
    } catch (Throwable $e) {
    }

    echo json_encode([
        'rows' => [],
        'recent' => $recent,
        'today_breakdown' => $today_breakdown,
        'today_by_link' => $today_by_link,
        'daily' => $daily,
        'dailyByLink' => $dailyByLink,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao consultar cliques']);
}
