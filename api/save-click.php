<?php
require_once __DIR__ . '/_lib/cors.php';
require_once __DIR__ . '/config.php';

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

try {
    $stmt = $pdo->prepare("INSERT INTO clicks (label, platform, device, source) VALUES (?, ?, ?, ?)");
    $stmt->execute([$label, $platform, $device, $source]);
    http_response_code(200);
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    $msg = $e->getMessage();
    $code = $e->getCode();
    // Tabela antiga sem coluna source? (MySQL 42S22 = Unknown column)
    if ($code === '42S22' || stripos($msg, 'Unknown column') !== false && stripos($msg, 'source') !== false) {
        try {
            $stmt = $pdo->prepare("INSERT INTO clicks (label, platform, device) VALUES (?, ?, ?)");
            $stmt->execute([$label, $platform, $device]);
            http_response_code(200);
            echo json_encode(['ok' => true]);
        } catch (Throwable $e2) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao salvar clique']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao salvar clique']);
    }
}
