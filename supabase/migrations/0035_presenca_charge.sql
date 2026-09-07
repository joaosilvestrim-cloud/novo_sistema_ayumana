-- Guarda o link de pagamento gerado para o inscrito do Presença, e a assinatura
-- Asaas criada, para não gerar duas vezes e poder reenviar o mesmo link.
alter table public.presenca_waitlist
  add column if not exists checkout_url text,
  add column if not exists asaas_subscription_id text;
