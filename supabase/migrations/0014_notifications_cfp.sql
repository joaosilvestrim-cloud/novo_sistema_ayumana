-- ---------------------------------------------------------------------------
-- 1) Log de notificações enviadas (e-mails da plataforma + pedidos de suporte)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                         -- crp_aprovado | trial_7 | suporte | broadcast | ...
  to_email text not null,
  subject text not null,
  preview text,                               -- resumo em texto puro, para a listagem
  profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'enviado',     -- enviado | falhou
  error text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_created on public.notifications (created_at desc);
create index if not exists idx_notifications_kind on public.notifications (kind);
create index if not exists idx_notifications_email on public.notifications (to_email);

-- Só o service role (admin) lê e escreve. Sem policy = ninguém mais acessa.
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------------
-- 2) Validação automática do CRP no Cadastro Nacional do CFP
-- ---------------------------------------------------------------------------
alter table public.psychologists
  add column if not exists crp_auto_status text,        -- ativo | irregular | nao_encontrado | erro | nao_configurado
  add column if not exists crp_auto_nome text,          -- nome como consta no conselho
  add column if not exists crp_auto_situacao text,      -- texto original devolvido pelo CFP
  add column if not exists crp_auto_checked_at timestamptz,
  add column if not exists crp_auto_payload jsonb;      -- resposta crua, para auditoria

create index if not exists idx_psy_crp_auto on public.psychologists (crp_auto_status);
