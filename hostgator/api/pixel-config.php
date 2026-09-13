<?php
require_once __DIR__ . '/_lib/cors.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_lib/pixel_config.php';

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

global $pdo;
if (!$pdo) {
    echo json_encode(['pixelId' => '', 'active' => false]);
    exit;
}

try {
    if (pixelConfigTableMissing($pdo)) {
        echo json_encode(['pixelId' => '', 'active' => false]);
        exit;
    }
    $config = readPixelConfig($pdo);
    echo json_encode([
        'pixelId' => $config['pixelId'],
        'active' => $config['active'],
    ]);
} catch (Throwable $e) {
    echo json_encode(['pixelId' => '', 'active' => false]);
}
