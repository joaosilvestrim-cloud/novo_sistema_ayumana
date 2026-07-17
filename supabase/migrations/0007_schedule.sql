-- ============================================================
-- Ayumana — Migration 0007 (horário, fuso, formação, serviços)
-- Idempotente. Rodar após a 0006.
-- ============================================================

alter table public.psychologists
  add column if not exists timezone text not null default 'America/Sao_Paulo',
  add column if not exists schedule jsonb,
  add column if not exists accepting_patients boolean not null default true,
  add column if not exists formation text,
  add column if not exists services text[] not null default '{}',
  add column if not exists style jsonb;

-- Fim da migration 0007.
