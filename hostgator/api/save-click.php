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
$label = isset($body['label']) ? trim((string) $body['label']) : '';
$platform = isset($body['platform']) ? trim((string) $body['platform']) : '';
$device = isset($body['device']) ? trim((string) $body['device']) : 'desktop';
$source = isset($body['source']) ? trim((string) $body['source']) : null;
if ($source === '') {
    $source = null;
}

if ($label === '') {
    http_response_code(400);
    echo json_encode(['error' => 'label obrigatório']);
    exit;
}

$sourceNorm = $source === null || $source === '' ? '' : $source;

try {
    $stmt = $pdo->prepare(
        'INSERT INTO clicks_live (stat_date, label, platform, source, hit_count, last_device, last_clicked_at)
         VALUES (?, ?, ?, ?, 1, ?, NOW())
         ON DUPLICATE KEY UPDATE
           hit_count = hit_count + 1,
           last_device = VALUES(last_device),
           last_clicked_at = NOW()'
    );
    $stmt->execute([todayStatDate(), $label, $platform, $sourceNorm, $device]);
    http_response_code(200);
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao salvar clique', 'message' => $e->getMessage()]);
}
