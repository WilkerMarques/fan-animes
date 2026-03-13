<?php
/**
 * Configuração para APIs (HostGator / MySQL).
 * Copie para config.local.php e preencha com seus dados (não commitar config.local.php).
 */

$config = [
    'db_host'     => 'localhost',
    'db_name'     => 'seu_banco',
    'db_user'     => 'seu_usuario',
    'db_password' => 'sua_senha',
    'dashboard_password' => '', // senha do dashboard
    'cookie_secret'      => '', // string aleatória longa para assinar o cookie de sessão
];

if (file_exists(__DIR__ . '/config.local.php')) {
    $local = require __DIR__ . '/config.local.php';
    $config = array_merge($config, $local);
}

function getDb() {
    global $config;
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        $config['db_host'],
        $config['db_name']
    );
    try {
        $pdo = new PDO($dsn, $config['db_user'], $config['db_password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        $pdo->exec("SET time_zone = '-03:00'"); // Brasil (evita divergência com date('Y-m-d') no PHP)
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}

function getConfig($key) {
    global $config;
    return $config[$key] ?? null;
}
