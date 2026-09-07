-- Quem gerou a cobrança do Presença e quando, para o registro ficar na tela.
alter table public.presenca_waitlist
  add column if not exists charge_created_by uuid,
  add column if not exists charge_created_at timestamptz;
