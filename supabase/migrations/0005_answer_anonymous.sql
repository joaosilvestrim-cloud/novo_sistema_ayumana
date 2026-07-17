-- ============================================================
-- Ayumana — Migration 0005 (respostas anônimas no fórum)
-- Respostas de exemplo aparecem como "Psicólogo(a) anônimo(a)".
-- Respostas reais (de psicólogos logados) mostram nome e CRP.
-- Idempotente. Rodar após a 0004.
-- ============================================================

alter table public.forum_answers
  add column if not exists anonymous boolean not null default false;

-- Marca as respostas de exemplo já existentes como anônimas.
-- (No momento, as únicas respostas são as semeadas.)
update public.forum_answers set anonymous = true where anonymous = false;

-- Fim da migration 0005.
