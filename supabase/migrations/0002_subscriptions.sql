-- ============================================================
-- Ayumana — Migration 0002 (Fase 3: assinaturas / Asaas)
-- Idempotente. Rodar após a 0001.
-- ============================================================

set check_function_bodies = off;

do $$ begin
  create type subscription_status as enum ('nenhuma', 'ativa', 'atrasada', 'cancelada');
exception when duplicate_object then null; end $$;

alter table public.psychologists
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_subscription_id text,
  add column if not exists subscription_status subscription_status not null default 'nenhuma',
  add column if not exists subscription_period_end timestamptz;

create index if not exists idx_psy_asaas_customer on public.psychologists (asaas_customer_id);
create index if not exists idx_psy_asaas_subscription on public.psychologists (asaas_subscription_id);

-- Log de eventos de pagamento (idempotência dos webhooks).
create table if not exists public.payment_events (
  id text primary key,          -- <evento>:<payment_id>
  event text not null,
  raw jsonb,
  created_at timestamptz not null default now()
);
alter table public.payment_events enable row level security;
-- Sem políticas: acessível somente via service_role (webhook).

-- Regras de negócio: impede autoaprovação/autopublicação E autoupgrade de plano.
create or replace function public.enforce_psychologist_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  privileged boolean := public.is_service_or_admin();
begin
  -- Só admin/service pode aprovar ou reprovar.
  if new.verification_status in ('aprovado', 'reprovado') then
    if not privileged then
      new.verification_status := coalesce(old.verification_status, 'nao_enviado');
    end if;
  end if;

  -- Carimba data de envio para revisão.
  if new.verification_status = 'pendente'
     and (old.verification_status is distinct from 'pendente') then
    new.verification_submitted_at := now();
  end if;

  -- Publicação derivada: só publica se aprovado e perfil completo.
  if new.verification_status <> 'aprovado' or new.profile_completed = false then
    new.is_published := false;
  end if;

  -- Plano pago só pode ser definido pelo servidor (checkout) ou webhook.
  -- O dono pode, no máximo, voltar para o Essencial por conta própria.
  if new.plan_tier <> 'essencial'
     and (old.plan_tier is distinct from new.plan_tier)
     and not privileged then
    new.plan_tier := coalesce(old.plan_tier, 'essencial');
  end if;

  return new;
end;
$$;

-- Fim da migration 0002.
