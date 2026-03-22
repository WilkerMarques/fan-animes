<?php
require_once __DIR__ . '/_lib/cors.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_lib/session.php';

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
    $today = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d');

    $stmtRecent = $pdo->prepare(
        'SELECT page, device, source, viewed_at FROM pageviews WHERE DATE(viewed_at) = :today ORDER BY viewed_at DESC LIMIT 40'
    );
    $stmtRecent->execute(['today' => $today]);
    $recent = $stmtRecent->fetchAll(PDO::FETCH_ASSOC);
    foreach ($recent as &$r) {
        if (isset($r['viewed_at'])) {
            $r['viewed_at'] = date('c', strtotime($r['viewed_at']));
        }
    }
    unset($r);

    $stmtTodayPv = $pdo->prepare(
        'SELECT COALESCE(source, \'\') AS source, COUNT(*) AS cnt FROM pageviews WHERE DATE(viewed_at) = :today GROUP BY source'
    );
    $stmtTodayPv->execute(['today' => $today]);
    $today_breakdown = $stmtTodayPv->fetchAll(PDO::FETCH_ASSOC);
    foreach ($today_breakdown as &$b) {
        $b['cnt'] = (int) ($b['cnt'] ?? 0);
        $b['source'] = isset($b['source']) ? (string) $b['source'] : '';
    }
    unset($b);

    $daily = [];
    try {
        $stmtDaily = $pdo->query("SELECT date, source, total_count FROM pageviews_daily ORDER BY date ASC, source");
        $daily = $stmtDaily->fetchAll(PDO::FETCH_ASSOC);
        foreach ($daily as &$d) {
            $d['date'] = $d['date'] ?? null;
            $d['source'] = isset($d['source']) ? (string) $d['source'] : '';
            $d['total_count'] = (int) ($d['total_count'] ?? 0);
        }
    } catch (Throwable $e) {
        try {
            $stmtDaily = $pdo->query("SELECT date, total_count FROM pageviews_daily ORDER BY date ASC");
            $rows = $stmtDaily->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $r) {
                $daily[] = ['date' => $r['date'] ?? null, 'source' => '', 'total_count' => (int) ($r['total_count'] ?? 0)];
            }
        } catch (Throwable $e2) {
            // tabela não existe
        }
    }

    echo json_encode([
        'rows' => [],
        'recent' => $recent,
        'today_breakdown' => $today_breakdown,
        'daily' => $daily,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao consultar pageviews']);
}
