<?php
date_default_timezone_set('America/Sao_Paulo');
header('Content-Type: application/json; charset=utf-8');
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/_lib/session.php';

if (!isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado']);
    exit;
}

$pdo = getDb();
if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao consultar pageviews']);
    exit;
}

$today = date('Y-m-d');

// Totais por dia (histórico)
$daily = [];
$st = $pdo->query("SELECT date, total_count FROM pageviews_daily ORDER BY date DESC LIMIT 365");
while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
    $daily[] = ['date' => $row['date'], 'total_count' => (int) $row['total_count']];
}

// Total acumulado dos dias
$totalDaily = 0;
foreach ($daily as $d) {
    $totalDaily += $d['total_count'];
}

// Hoje: linhas ainda na tabela pageviews (antes do cron)
$todayRows = [];
$st = $pdo->prepare("SELECT page, device, viewed_at, source FROM pageviews WHERE viewed_at >= ? ORDER BY viewed_at DESC LIMIT 500");
$st->execute([$today . ' 00:00:00']);
while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
    $todayRows[] = [
        'page' => $row['page'],
        'device' => $row['device'],
        'viewed_at' => $row['viewed_at'],
        'source' => isset($row['source']) ? $row['source'] : null,
    ];
}

$todayCount = count($todayRows);
$total = $totalDaily + $todayCount;

echo json_encode([
    'daily' => $daily,
    'total' => $total,
    'todayCount' => $todayCount,
    'todayRows' => $todayRows,
]);
