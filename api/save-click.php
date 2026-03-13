<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_lib/session.php';

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$label = isset($input['label']) ? trim(mb_substr($input['label'], 0, 120)) : '';
$platform = isset($input['platform']) ? $input['platform'] : '';
$device = isset($input['device']) ? $input['device'] : '';
$source = isset($input['source']) && in_array($input['source'], ['facebook', 'tiktok'], true) ? $input['source'] : null;

$allowedPlatforms = ['spotify', 'youtube', 'instagram'];
$allowedDevices = ['mobile', 'desktop'];
if ($label === '' || !in_array($platform, $allowedPlatforms, true) || !in_array($device, $allowedDevices, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Payload inválido']);
    exit;
}

$pdo = getDb();
if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao salvar clique']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO clicks (label, platform, device, clicked_at, source) VALUES (?, ?, ?, NOW(), ?)");
try {
    $stmt->execute([$label, $platform, $device, $source]);
    echo json_encode(['ok' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao salvar clique']);
}
