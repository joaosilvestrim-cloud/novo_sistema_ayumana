-- ============================================================
-- Cobrança: o plano pago só passa a valer depois do pagamento confirmado
-- ============================================================

-- Plano escolhido no checkout, aguardando a confirmação do Asaas.
-- Enquanto está aqui, o psicólogo continua no plano anterior.
alter table public.psychologists
  add column if not exists pending_plan_tier plan_tier,
  add column if not exists pending_since timestamptz;

create index if not exists idx_psy_pending_plan on public.psychologists (pending_plan_tier);

-- Rastro do webhook: a quem o evento se aplicou e se foi processado.
alter table public.payment_events
  add column if not exists psychologist_id uuid references public.psychologists(id) on delete set null,
  add column if not exists handled boolean not null default false,
  add column if not exists note text;

create index if not exists idx_payment_events_created on public.payment_events (created_at desc);
create index if not exists idx_payment_events_handled on public.payment_events (handled);
