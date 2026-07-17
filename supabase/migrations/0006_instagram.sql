-- ============================================================
-- Ayumana — Migration 0006 (Instagram do psicólogo)
-- Idempotente. Rodar após a 0005.
-- ============================================================

alter table public.psychologists
  add column if not exists instagram text;

-- Fim da migration 0006.
