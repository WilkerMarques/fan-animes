ALTER TABLE pixel_page_config
  MODIFY pixel_id VARCHAR(128) NOT NULL DEFAULT '';

ALTER TABLE pixel_config
  MODIFY pixel_id VARCHAR(128) NOT NULL DEFAULT '';
