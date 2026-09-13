<?php

function normalizeMetaPixelId($value) {
    if (is_int($value) || is_float($value)) {
        $value = (string) $value;
    }
    if (!is_string($value)) {
        return '';
    }
    return trim($value);
}

function isValidMetaPixelId($value) {
    $id = normalizeMetaPixelId($value);
    if ($id === '') {
        return false;
    }
    if (preg_match('/[<>]|script|fbq|function|javascript:/i', $id)) {
        return false;
    }
    return (bool) preg_match('/^\d{10,20}$/', $id);
}

function pixelConfigTableMissing(PDO $pdo) {
    try {
        $pdo->query('SELECT 1 FROM pixel_config LIMIT 1');
        return false;
    } catch (Throwable $e) {
        return true;
    }
}

function emptyPixelConfig() {
    return [
        'pixelId' => '',
        'active' => false,
        'updatedAt' => null,
        'updatedBy' => null,
    ];
}

function readPixelConfig(PDO $pdo) {
    $stmt = $pdo->query(
        'SELECT pixel_id, is_active, updated_at, updated_by FROM pixel_config WHERE id = 1 LIMIT 1'
    );
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return emptyPixelConfig();
    }
    $pixelId = normalizeMetaPixelId($row['pixel_id'] ?? '');
    return [
        'pixelId' => isValidMetaPixelId($pixelId) ? $pixelId : '',
        'active' => ((int) ($row['is_active'] ?? 0)) === 1 && isValidMetaPixelId($pixelId),
        'updatedAt' => isset($row['updated_at']) && $row['updated_at'] !== ''
            ? date('c', strtotime((string) $row['updated_at']))
            : null,
        'updatedBy' => isset($row['updated_by']) && $row['updated_by'] !== ''
            ? (string) $row['updated_by']
            : null,
    ];
}

function savePixelConfig(PDO $pdo, $pixelId, $active, $updatedBy) {
    $id = normalizeMetaPixelId($pixelId);
    $isActive = $active ? 1 : 0;

    if ($isActive === 1 && !isValidMetaPixelId($id)) {
        throw new InvalidArgumentException('ID do Pixel inválido');
    }
    if ($id !== '' && !isValidMetaPixelId($id)) {
        throw new InvalidArgumentException('ID do Pixel inválido');
    }

    $stmt = $pdo->prepare(
        'INSERT INTO pixel_config (id, pixel_id, is_active, updated_at, updated_by)
         VALUES (1, ?, ?, NOW(), ?)
         ON DUPLICATE KEY UPDATE
           pixel_id = VALUES(pixel_id),
           is_active = VALUES(is_active),
           updated_at = NOW(),
           updated_by = VALUES(updated_by)'
    );
    $stmt->execute([$id, $isActive, $updatedBy]);
    return readPixelConfig($pdo);
}
