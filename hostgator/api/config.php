<?php
date_default_timezone_set('America/Sao_Paulo');

$config = [
    'db_host'     => 'localhost',
    'db_name'     => '',
    'db_user'     => '',
    'db_password' => '',
    'dashboard_password' => '',
    'cookie_secret' => '',
];

if (is_file(__DIR__ . '/config.local.php')) {
    $local = require __DIR__ . '/config.local.php';
    $config = array_merge($config, $local);
}

function getConfig($key) {
    global $config;
    return isset($config[$key]) ? $config[$key] : null;
}

try {
    $dsn = 'mysql:host=' . getConfig('db_host') . ';dbname=' . getConfig('db_name') . ';charset=utf8mb4';
    $pdo = new PDO($dsn, getConfig('db_user'), getConfig('db_password'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $pdo->exec("SET time_zone = '-03:00'");
} catch (PDOException $e) {
    $pdo = null;
}
