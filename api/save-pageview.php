<?php
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
$page = isset($body['page']) ? (string) $body['page'] : 'home';
$device = isset($body['device']) ? (string) $body['device'] : 'desktop';
$source = isset($body['source']) ? (string) $body['source'] : null;

try {
    $stmt = $pdo->prepare("INSERT INTO pageviews (page, device, source) VALUES (?, ?, ?)");
    $stmt->execute([$page, $device, $source]);
    http_response_code(200);
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    $msg = $e->getMessage();
    $code = $e->getCode();
    // Tabela antiga sem coluna source?
    if ($code === '42S22' || stripos($msg, 'Unknown column') !== false && stripos($msg, 'source') !== false) {
        try {
            $stmt = $pdo->prepare("INSERT INTO pageviews (page, device) VALUES (?, ?)");
            $stmt->execute([$page, $device]);
            http_response_code(200);
            echo json_encode(['ok' => true]);
        } catch (Throwable $e2) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao salvar pageview']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao salvar pageview']);
    }
}
