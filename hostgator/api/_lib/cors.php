<?php
/**
 * CORS para dashboard (login + endpoints que usam cookie).
 * Permite requisições com credentials do mesmo domínio e de localhost (dev).
 * Incluir no topo de login.php, logout.php, dashboard-pageviews.php, dashboard-clicks.php.
 */
if (!headers_sent()) {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? (string) $_SERVER['HTTP_ORIGIN'] : '';
    $allow = false;
    if ($origin !== '') {
        $parsed = parse_url($origin);
        $host = isset($parsed['host']) ? strtolower(trim((string) $parsed['host'])) : '';
        if ($host === 'localhost' || $host === '127.0.0.1') {
            $allow = true;
        } elseif ($host !== '' && isset($_SERVER['HTTP_HOST'])) {
            $serverHost = strtolower(trim((string) $_SERVER['HTTP_HOST']));
            if (preg_match('/^[a-z0-9.-]+$/', $serverHost) && $host === $serverHost) {
                $allow = true;
            }
        }
        if ($allow) {
            header('Access-Control-Allow-Origin: ' . $origin);
        }
    }
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
}
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
