<?php
require_once __DIR__ . '/_lib/cors.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_lib/session.php';
require_once __DIR__ . '/_lib/pixel_config.php';

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
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

if (pixelConfigTableMissing($pdo)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Tabela pixel_page_config não existe. Rode hostgator/api/migrate-pixel-pages.sql no banco.',
    ]);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(readAdminAllPagePixelConfigs($pdo));
        exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON inválido']);
        exit;
    }

    if (isset($body['pages']) && is_array($body['pages'])) {
        $saved = saveAllPagePixelConfigs($pdo, $body['pages'], 'admin');
        echo json_encode($saved);
        exit;
    }

    if (isset($body['pixelId'])) {
        $pixelId = isset($body['pixelId']) ? $body['pixelId'] : '';
        $active = !empty($body['active']);
        savePixelConfig($pdo, $pixelId, $active, 'admin');
        echo json_encode(readAdminAllPagePixelConfigs($pdo));
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Envie pages com slots ou pixelId legado.']);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao salvar configuração do Pixel']);
}
