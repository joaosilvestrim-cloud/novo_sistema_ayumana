-- ============================================================
-- Ayumana — Migration 0004 (fotos de perfil)
-- Idempotente. Rodar após a 0003.
-- ============================================================

alter table public.psychologists
  add column if not exists avatar_url text;

-- blog_posts.cover_url já existe (migration 0003).
-- Fim da migration 0004.
