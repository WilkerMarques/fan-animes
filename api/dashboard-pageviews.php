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
    $stmt = $pdo->query("SELECT page, device, source, viewed_at FROM pageviews ORDER BY viewed_at DESC LIMIT 100000");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        if (isset($r['viewed_at'])) {
            $r['viewed_at'] = date('c', strtotime($r['viewed_at']));
        }
    }

    $daily = [];
    try {
        $stmtDaily = $pdo->query("SELECT date, total_count FROM pageviews_daily ORDER BY date ASC");
        $daily = $stmtDaily->fetchAll(PDO::FETCH_ASSOC);
        foreach ($daily as &$d) {
            $d['date'] = $d['date'] ?? null;
            $d['total_count'] = (int) ($d['total_count'] ?? 0);
        }
    } catch (Throwable $e) {
        // pageviews_daily pode não existir em ambientes antigos
    }

    echo json_encode(['rows' => $rows, 'daily' => $daily]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao consultar pageviews']);
}
