-- ============================================================
-- Campanha de reativação: concessão automática de 90 dias do Voz.
-- Marca quando a cortesia foi dada, para garantir que cada psicólogo
-- receba os 90 dias UMA vez só, não a cada vez que salva o perfil.
-- ============================================================

alter table public.psychologists
  add column if not exists campaign_voz_granted_at timestamptz;

comment on column public.psychologists.campaign_voz_granted_at is
  'Quando os 90 dias de Voz da campanha de reativação foram concedidos. Nulo = ainda não recebeu.';
