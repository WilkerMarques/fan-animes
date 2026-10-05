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
$pageKey = normalizePixelPageKey($_GET['page'] ?? 'home');

if (!$pdo) {
    echo json_encode(['page' => $pageKey, 'pixelIds' => []]);
    exit;
}

try {
    if (pixelConfigTableMissing($pdo)) {
        echo json_encode(['page' => $pageKey, 'pixelIds' => []]);
        exit;
    }
    echo json_encode(readPublicPagePixelConfig($pdo, $pageKey));
} catch (Throwable $e) {
    echo json_encode(['page' => $pageKey, 'pixelIds' => []]);
}
