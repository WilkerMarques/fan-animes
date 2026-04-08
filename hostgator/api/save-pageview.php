<?php
require_once __DIR__ . '/_lib/cors.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_lib/stats_live.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

global $pdo;
if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'Banco não configurado']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$page = isset($body['page']) ? trim((string) $body['page']) : 'home';
if ($page === '') {
    $page = 'home';
}
$device = isset($body['device']) ? trim((string) $body['device']) : 'desktop';
$source = isset($body['source']) ? trim((string) $body['source']) : null;
if ($source === '') {
    $source = null;
}

$sourceNorm = $source === null || $source === '' ? '' : $source;

try {
    $stmt = $pdo->prepare(
        'INSERT INTO pageviews_live (stat_date, page, device, source, hit_count, last_viewed_at)
         VALUES (?, ?, ?, ?, 1, NOW())
         ON DUPLICATE KEY UPDATE
           hit_count = hit_count + 1,
           last_viewed_at = NOW()'
    );
    $stmt->execute([todayStatDate(), $page, $device, $sourceNorm]);
    http_response_code(200);
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao salvar pageview', 'message' => $e->getMessage()]);
}
