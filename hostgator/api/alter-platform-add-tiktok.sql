-- Adiciona 'tiktok' ao ENUM da coluna platform (cliques no link do TikTok)
-- Rodar no mesmo banco que a API usa (local ou HostGator).

ALTER TABLE clicks
  MODIFY COLUMN platform ENUM('spotify', 'youtube', 'instagram', 'tiktok', '') NOT NULL DEFAULT '';
