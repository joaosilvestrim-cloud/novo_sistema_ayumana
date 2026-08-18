-- ============================================================
-- Quais campos o psicólogo mudou no último salvamento do perfil.
-- Alimenta a tela de atividade do admin ("Quem atualizou o perfil"), para
-- saber exatamente o que cada pessoa mexeu, não só quando.
-- ============================================================

alter table public.psychologists
  add column if not exists last_changed_fields text[];

comment on column public.psychologists.last_changed_fields is
  'Lista de campos alterados no último salvamento do perfil (ex.: foto, apresentação, WhatsApp).';
