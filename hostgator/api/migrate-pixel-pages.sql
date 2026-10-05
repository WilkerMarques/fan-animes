CREATE TABLE IF NOT EXISTS pixel_page_config (
  page_key VARCHAR(32) NOT NULL,
  slot TINYINT UNSIGNED NOT NULL,
  pixel_id VARCHAR(32) NOT NULL DEFAULT '',
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(64) NULL,
  PRIMARY KEY (page_key, slot),
  CONSTRAINT chk_pixel_page_slot CHECK (slot >= 1 AND slot <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO pixel_page_config (page_key, slot, pixel_id, is_active, updated_by)
SELECT 'home', 1, pixel_id, is_active, updated_by
FROM pixel_config
WHERE id = 1
  AND pixel_id <> ''
ON DUPLICATE KEY UPDATE
  pixel_id = IF(VALUES(pixel_id) <> '', VALUES(pixel_id), pixel_page_config.pixel_id),
  is_active = IF(VALUES(pixel_id) <> '', VALUES(is_active), pixel_page_config.is_active);
