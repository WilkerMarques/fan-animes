<?php

const PIXEL_SLOTS_PER_PAGE = 5;

function pixelPageKeys() {
    return ['home', 'rap', 'rock', 'sad', 'sertanejo', 'fananimes'];
}

function normalizePixelPageKey($value) {
    $key = strtolower(trim((string) $value));
    if ($key === '') {
        return 'home';
    }
    return in_array($key, pixelPageKeys(), true) ? $key : 'home';
}

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

function pixelPageConfigTableMissing(PDO $pdo) {
    try {
        $pdo->query('SELECT 1 FROM pixel_page_config LIMIT 1');
        return false;
    } catch (Throwable $e) {
        return true;
    }
}

function legacyPixelConfigTableExists(PDO $pdo) {
    try {
        $pdo->query('SELECT 1 FROM pixel_config LIMIT 1');
        return true;
    } catch (Throwable $e) {
        return false;
    }
}

function emptyPixelSlot($slot) {
    return [
        'slot' => (int) $slot,
        'pixelId' => '',
        'active' => false,
    ];
}

function emptyPixelSlotsArray() {
    $slots = [];
    for ($slot = 1; $slot <= PIXEL_SLOTS_PER_PAGE; $slot++) {
        $slots[] = emptyPixelSlot($slot);
    }
    return $slots;
}

function readLegacyHomePixelIds(PDO $pdo) {
    if (!legacyPixelConfigTableExists($pdo)) {
        return [];
    }
    $stmt = $pdo->query(
        'SELECT pixel_id, is_active FROM pixel_config WHERE id = 1 LIMIT 1'
    );
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return [];
    }
    $pixelId = normalizeMetaPixelId($row['pixel_id'] ?? '');
    $active = ((int) ($row['is_active'] ?? 0)) === 1;
    if ($active && isValidMetaPixelId($pixelId)) {
        return [$pixelId];
    }
    return [];
}

function readPagePixelSlots(PDO $pdo, $pageKey) {
    $pageKey = normalizePixelPageKey($pageKey);
    $slots = emptyPixelSlotsArray();
    if (pixelPageConfigTableMissing($pdo)) {
        if ($pageKey === 'home') {
            $legacyIds = readLegacyHomePixelIds($pdo);
            if (count($legacyIds) > 0) {
                $slots[0]['pixelId'] = $legacyIds[0];
                $slots[0]['active'] = true;
            }
        }
        return $slots;
    }

    $stmt = $pdo->prepare(
        'SELECT slot, pixel_id, is_active FROM pixel_page_config
         WHERE page_key = ? ORDER BY slot ASC'
    );
    $stmt->execute([$pageKey]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        $slot = (int) ($row['slot'] ?? 0);
        if ($slot < 1 || $slot > PIXEL_SLOTS_PER_PAGE) {
            continue;
        }
        $pixelId = normalizeMetaPixelId($row['pixel_id'] ?? '');
        $valid = isValidMetaPixelId($pixelId);
        $slots[$slot - 1] = [
            'slot' => $slot,
            'pixelId' => $valid ? $pixelId : '',
            'active' => $valid && ((int) ($row['is_active'] ?? 0)) === 1,
        ];
    }
    return $slots;
}

function activePixelIdsFromSlots($slots) {
    $ids = [];
    foreach ($slots as $slot) {
        if (empty($slot['active'])) {
            continue;
        }
        $pixelId = normalizeMetaPixelId($slot['pixelId'] ?? '');
        if (!isValidMetaPixelId($pixelId)) {
            continue;
        }
        if (!in_array($pixelId, $ids, true)) {
            $ids[] = $pixelId;
        }
    }
    return $ids;
}

function readPublicPagePixelConfig(PDO $pdo, $pageKey) {
    $pageKey = normalizePixelPageKey($pageKey);
    $slots = readPagePixelSlots($pdo, $pageKey);
    return [
        'page' => $pageKey,
        'pixelIds' => activePixelIdsFromSlots($slots),
    ];
}

function readAdminPagePixelMeta(PDO $pdo, $pageKey) {
    if (pixelPageConfigTableMissing($pdo)) {
        return ['updatedAt' => null, 'updatedBy' => null];
    }
    $stmt = $pdo->prepare(
        'SELECT MAX(updated_at) AS updated_at,
                SUBSTRING_INDEX(GROUP_CONCAT(updated_by ORDER BY updated_at DESC), ",", 1) AS updated_by
         FROM pixel_page_config WHERE page_key = ?'
    );
    $stmt->execute([normalizePixelPageKey($pageKey)]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || empty($row['updated_at'])) {
        return ['updatedAt' => null, 'updatedBy' => null];
    }
    return [
        'updatedAt' => date('c', strtotime((string) $row['updated_at'])),
        'updatedBy' => isset($row['updated_by']) && $row['updated_by'] !== ''
            ? (string) $row['updated_by']
            : null,
    ];
}

function readAdminAllPagePixelConfigs(PDO $pdo) {
    $pages = [];
    foreach (pixelPageKeys() as $pageKey) {
        $meta = readAdminPagePixelMeta($pdo, $pageKey);
        $pages[$pageKey] = [
            'slots' => readPagePixelSlots($pdo, $pageKey),
            'updatedAt' => $meta['updatedAt'],
            'updatedBy' => $meta['updatedBy'],
        ];
    }
    return ['pages' => $pages];
}

function normalizeIncomingPixelSlot($slotData, $slotNumber) {
    $pixelId = normalizeMetaPixelId($slotData['pixelId'] ?? '');
    $active = !empty($slotData['active']);
    if ($active && !isValidMetaPixelId($pixelId)) {
        throw new InvalidArgumentException('Slot ' . $slotNumber . ': informe um ID válido para ativar.');
    }
    if ($pixelId !== '' && !isValidMetaPixelId($pixelId)) {
        throw new InvalidArgumentException('Slot ' . $slotNumber . ': ID do Pixel inválido.');
    }
    return [
        'slot' => $slotNumber,
        'pixelId' => $pixelId,
        'active' => $active && isValidMetaPixelId($pixelId),
    ];
}

function normalizeIncomingPageSlots($slots) {
    if (!is_array($slots)) {
        throw new InvalidArgumentException('Cada página precisa de ' . PIXEL_SLOTS_PER_PAGE . ' slots.');
    }
    if (count($slots) !== PIXEL_SLOTS_PER_PAGE) {
        throw new InvalidArgumentException('Cada página precisa de ' . PIXEL_SLOTS_PER_PAGE . ' slots.');
    }
    $normalized = [];
    for ($i = 0; $i < PIXEL_SLOTS_PER_PAGE; $i++) {
        $normalized[] = normalizeIncomingPixelSlot($slots[$i], $i + 1);
    }
    return $normalized;
}

function savePagePixelSlots(PDO $pdo, $pageKey, $slots, $updatedBy) {
    $pageKey = normalizePixelPageKey($pageKey);
    if (pixelPageConfigTableMissing($pdo)) {
        throw new RuntimeException('Tabela pixel_page_config não existe. Rode hostgator/api/migrate-pixel-pages.sql no banco.');
    }
    $normalized = normalizeIncomingPageSlots($slots);
    $stmt = $pdo->prepare(
        'INSERT INTO pixel_page_config (page_key, slot, pixel_id, is_active, updated_at, updated_by)
         VALUES (?, ?, ?, ?, NOW(), ?)
         ON DUPLICATE KEY UPDATE
           pixel_id = VALUES(pixel_id),
           is_active = VALUES(is_active),
           updated_at = NOW(),
           updated_by = VALUES(updated_by)'
    );
    foreach ($normalized as $slot) {
        $stmt->execute([
            $pageKey,
            $slot['slot'],
            $slot['pixelId'],
            $slot['active'] ? 1 : 0,
            $updatedBy,
        ]);
    }
    $meta = readAdminPagePixelMeta($pdo, $pageKey);
    return [
        'page' => $pageKey,
        'slots' => readPagePixelSlots($pdo, $pageKey),
        'updatedAt' => $meta['updatedAt'],
        'updatedBy' => $meta['updatedBy'],
    ];
}

function saveAllPagePixelConfigs(PDO $pdo, $pagesInput, $updatedBy) {
    if (!is_array($pagesInput)) {
        throw new InvalidArgumentException('Envie a configuração de todas as páginas.');
    }
    $saved = [];
    foreach (pixelPageKeys() as $pageKey) {
        if (!isset($pagesInput[$pageKey])) {
            throw new InvalidArgumentException('Faltou a página: ' . $pageKey);
        }
        $saved[$pageKey] = savePagePixelSlots($pdo, $pageKey, $pagesInput[$pageKey]['slots'] ?? $pagesInput[$pageKey], $updatedBy);
    }
    return ['pages' => $saved];
}

function pixelConfigTableMissing(PDO $pdo) {
    return pixelPageConfigTableMissing($pdo) && !legacyPixelConfigTableExists($pdo);
}

function readPixelConfig(PDO $pdo) {
    $home = readPagePixelSlots($pdo, 'home');
    $first = $home[0];
    $meta = readAdminPagePixelMeta($pdo, 'home');
    return [
        'pixelId' => $first['pixelId'],
        'active' => !empty($first['active']),
        'updatedAt' => $meta['updatedAt'],
        'updatedBy' => $meta['updatedBy'],
    ];
}

function savePixelConfig(PDO $pdo, $pixelId, $active, $updatedBy) {
    $slots = emptyPixelSlotsArray();
    $slots[0] = normalizeIncomingPixelSlot(
        ['pixelId' => $pixelId, 'active' => $active],
        1
    );
    savePagePixelSlots($pdo, 'home', $slots, $updatedBy);
    return readPixConfigLegacyShape($pdo);
}

function readPixConfigLegacyShape(PDO $pdo) {
    $home = readPagePixelSlots($pdo, 'home');
    $first = $home[0];
    $meta = readAdminPagePixelMeta($pdo, 'home');
    return [
        'pixelId' => $first['pixelId'],
        'active' => !empty($first['active']),
        'updatedAt' => $meta['updatedAt'],
        'updatedBy' => $meta['updatedBy'],
    ];
}
