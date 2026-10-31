ALTER TABLE pixel_page_config
  ADD COLUMN provider VARCHAR(16) NOT NULL DEFAULT 'meta' AFTER page_key;

ALTER TABLE pixel_page_config
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (page_key, provider, slot);
