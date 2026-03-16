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
    $stmt = $pdo->query("SELECT label, platform, device, source, clicked_at FROM clicks ORDER BY clicked_at DESC LIMIT 100000");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        if (isset($r['clicked_at'])) {
            $r['clicked_at'] = date('c', strtotime($r['clicked_at']));
        }
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
                // tabela não existe
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
        // tabela clicks_daily_by_link pode não existir (rodar migrate-clicks-daily-by-link.sql)
    }

    echo json_encode(['rows' => $rows, 'daily' => $daily, 'dailyByLink' => $dailyByLink]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao consultar cliques']);
}
