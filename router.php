<?php
/**
 * Roteador para rodar a API PHP localmente (php -S localhost:8080 router.php).
 * Simula o .htaccess do HostGator: /api/save-click -> hostgator/api/save-click.php
 */
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
if (preg_match('#^/api/([a-z0-9-]+)$#', $uri, $m)) {
    $file = __DIR__ . '/hostgator/api/' . $m[1] . '.php';
    if (file_exists($file)) {
        include $file;
        return true;
    }
}
return false;
