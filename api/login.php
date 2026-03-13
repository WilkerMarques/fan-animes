<?php
header('Content-Type: application/json; charset=utf-8');
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

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

$expected = getConfig('dashboard_password');
if (empty($expected)) {
    http_response_code(500);
    echo json_encode(['error' => 'Senha do dashboard não configurada']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$password = isset($input['password']) ? $input['password'] : '';

if ($password === '' || $password !== $expected) {
    http_response_code(401);
    echo json_encode(['error' => 'Senha inválida']);
    exit;
}

$token = createSessionToken();
header('Set-Cookie: ' . buildSessionCookie($token));
echo json_encode(['ok' => true]);
