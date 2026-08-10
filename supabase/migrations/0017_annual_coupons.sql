-- ============================================================
-- Plano anual (com desconto) + cupons de desconto por código
-- ============================================================

-- 1) Período de cobrança e cupom aplicado no psicólogo -------------------
alter table public.psychologists
  add column if not exists billing_period text not null default 'monthly', -- monthly | yearly
  add column if not exists coupon_code text,          -- cupom em vigor (maiúsculo)
  add column if not exists coupon_pct int,            -- desconto do cupom, ex.: 50
  add column if not exists coupon_ends_at timestamptz, -- quando o desconto expira e volta ao cheio
  -- escolhas do checkout que só valem quando o pagamento confirmar
  add column if not exists pending_billing_period text,
  add column if not exists pending_coupon_code text;

-- 2) Cupons ---------------------------------------------------------------
create table if not exists public.coupons (
  code text primary key,                 -- guardado em MAIÚSCULO
  percent int not null,                  -- 1..100
  -- por quanto tempo o desconto dura na assinatura:
  --   first_payment = só a primeira cobrança
  --   first_year    = 12 meses, depois preço cheio
  --   forever       = enquanto a assinatura durar
  duration text not null default 'first_year',
  description text,
  active boolean not null default true,
  max_uses int,                          -- null = ilimitado
  used_count int not null default 0,
  expires_at timestamptz,                -- validade do código para novos usos
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;
-- Sem policy: só o service role (admin/checkout no servidor) acessa.

create index if not exists idx_psy_coupon_ends on public.psychologists (coupon_ends_at);
