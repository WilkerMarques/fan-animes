<?php
require_once __DIR__ . '/_lib/cors.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_lib/session.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$expected = getConfig('dashboard_password');
if (empty($expected)) {
    http_response_code(500);
    echo json_encode(['error' => 'Senha do dashboard não configurada']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$password = isset($body['password']) ? $body['password'] : '';

if ($password === '' || $password !== $expected) {
    http_response_code(401);
    echo json_encode(['error' => 'Senha inválida']);
    exit;
}

try {
    $token = createSessionToken();
    header('Set-Cookie: ' . buildSessionCookie($token), false);
    http_response_code(200);
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno no login']);
}
