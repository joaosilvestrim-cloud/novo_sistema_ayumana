-- ============================================================
-- Carimbo de quando o PSICÓLOGO editou o próprio perfil (onboarding).
-- Diferente de updated_at, que muda em qualquer alteração da linha (webhook,
-- troca de plano pelo admin, concessão de Voz). Este só é setado quando a
-- pessoa salva o perfil, para o admin rastrear atividade real da base.
-- ============================================================

alter table public.psychologists
  add column if not exists profile_updated_at timestamptz;

comment on column public.psychologists.profile_updated_at is
  'Quando o próprio psicólogo salvou o perfil pela última vez (onboarding).';
