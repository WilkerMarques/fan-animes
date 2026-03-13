<?php
/**
 * Teste de conexão com o banco – rode na pasta do projeto: php test-db-connection.php
 */
$configFile = __DIR__ . '/hostgator/api/config.local.php';
if (!is_file($configFile)) {
    echo "Erro: config.local.php não encontrado em hostgator/api/\n";
    exit(1);
}
$config = require $configFile;
$dsn = 'mysql:host=' . $config['db_host'] . ';dbname=' . $config['db_name'] . ';charset=utf8mb4';

echo "Tentando conectar: {$config['db_host']} / {$config['db_name']} / {$config['db_user']}\n";

try {
    $pdo = new PDO($dsn, $config['db_user'], $config['db_password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $pdo->exec("SET time_zone = '-03:00'");
    echo "OK: Conexão com o banco funcionou.\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tabelas no banco: " . (count($tables) ? implode(', ', $tables) : '(nenhuma)') . "\n";
} catch (PDOException $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
    exit(1);
}
