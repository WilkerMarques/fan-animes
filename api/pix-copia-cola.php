<?php
/**
 * Gera código Pix "copia e cola" dinâmico por valor.
 * Banco Inter, chave aleatória, recebedor: Fan Animes.
 *
 * Config em config.local.php:
 *   'pix_chave_aleatoria' => 'sua-chave-pix-aleatoria-aqui',  // obrigatório
 *   'pix_receiver_name'   => 'Fan Animes',                     // opcional
 *   'pix_receiver_city'   => 'Sao Paulo',                       // opcional (mínimo 2 caracteres)
 *
 * Só o TIPO da chave (ex: chave aleatória) não basta: é preciso a chave real
 * para gerar o código. A chave fica só no servidor (config), nunca no front.
 */
require_once __DIR__ . '/_lib/cors.php';
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Use GET com ?valor=10']);
    exit;
}

$valor = isset($_GET['valor']) ? trim((string) $_GET['valor']) : '';
$valor = str_replace(',', '.', $valor);
if ($valor === '' || !is_numeric($valor)) {
    http_response_code(400);
    echo json_encode(['error' => 'Valor inválido. Use ?valor=5 ou ?valor=10.50']);
    exit;
}

$valorFloat = (float) $valor;
if ($valorFloat <= 0 || $valorFloat > 999999.99) {
    http_response_code(400);
    echo json_encode(['error' => 'Valor deve ser maior que 0 e até 999999.99']);
    exit;
}

$chave = getConfig('pix_chave_aleatoria');
$chave = is_string($chave) ? trim($chave) : '';
if ($chave === '') {
    http_response_code(503);
    echo json_encode([
        'error' => 'Pix não configurado. Adicione pix_chave_aleatoria em config.local.php com sua chave Pix (Inter).',
    ]);
    exit;
}

$nome = getConfig('pix_receiver_name');
$nome = is_string($nome) ? trim($nome) : 'Fan Animes';
if ($nome === '') {
    $nome = 'Fan Animes';
}

$cidade = getConfig('pix_receiver_city');
$cidade = is_string($cidade) ? trim($cidade) : 'Sao Paulo';
if (strlen($cidade) < 2) {
    $cidade = 'Sao Paulo';
}

// Formato valor: 2 decimais, ponto como separador
$valorStr = number_format($valorFloat, 2, '.', '');

// Gera payload BR Code (padrão BCB) e CRC16
$payload = buildPixPayload($chave, $nome, $cidade, $valorStr);
if ($payload === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao gerar código Pix. Verifique a chave.']);
    exit;
}

echo json_encode(['copiaCola' => $payload]);

/**
 * Monta o payload Pix no formato EMV (BR Code).
 * Chave no subcampo 26: ID 01 + tamanho + valor (igual ao gerado pelo Inter).
 * BCB: nome até 25 caracteres, cidade até 15. CRC em hexadecimal (4 dígitos).
 */
function buildPixPayload($chave, $merchantName, $merchantCity, $transactionAmount)
{
    $merchantName = substr($merchantName, 0, 25);
    $merchantCity = substr($merchantCity, 0, 15);

    // 00 = GUI br.gov.bcb.pix, 01 = chave (padrão Inter/BCB no BR Code)
    $merchantAccount = '0014br.gov.bcb.pix' . '01' . str_pad(strlen($chave), 2, '0', STR_PAD_LEFT) . $chave;
    $merchantAccountTag = '26' . str_pad(strlen($merchantAccount), 2, '0', STR_PAD_LEFT) . $merchantAccount;

    $payload = '000201' . $merchantAccountTag
        . '52040000530398654' . str_pad(strlen($transactionAmount), 2, '0', STR_PAD_LEFT) . $transactionAmount
        . '5802BR59' . str_pad(strlen($merchantName), 2, '0', STR_PAD_LEFT) . $merchantName
        . '60' . str_pad(strlen($merchantCity), 2, '0', STR_PAD_LEFT) . $merchantCity
        . '62070503***';

    $payload .= '6304';
    $crc = crc16ccitt($payload);
    // BCB exige CRC em 4 dígitos hexadecimal (não decimal)
    $payload .= strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));

    return $payload;
}

/**
 * CRC-16/CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF).
 * Usado no padrão Pix BR Code. Calcular sobre o payload já incluindo "6304".
 */
function crc16ccitt($str)
{
    $crc = 0xFFFF;
    $len = strlen($str);
    for ($i = 0; $i < $len; $i++) {
        $crc ^= (ord($str[$i]) & 0xFF) << 8;
        for ($j = 0; $j < 8; $j++) {
            $crc = ($crc & 0x8000) ? (($crc << 1) ^ 0x1021) : ($crc << 1);
            $crc &= 0xFFFF;
        }
    }
    return $crc;
}
