-- ============================================================
-- Estúdio de conteúdo (plano Presença)
-- Novo papel "conteudo" (funcionária que produz as artes) +
-- tabela do ciclo de vida das peças.
-- ============================================================

-- 1) Novo papel. Usamos role::text nas policies para não depender do
--    valor recém-criado dentro da mesma transação.
alter type user_role add value if not exists 'conteudo';

-- 2) Itens de conteúdo (uma peça = um card no painel)
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologists(id) on delete cascade,
  cycle text not null,                       -- competência 'YYYY-MM'
  title text not null,
  format text not null default 'post',       -- post | story | reel | carrossel | outro
  status text not null default 'briefing',   -- briefing|producao|revisao|ajustes|aprovado|entregue
  brief text,
  asset_url text,
  feedback text,
  assigned_to uuid references public.profiles(id) on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_psy on public.content_items (psychologist_id, cycle);
create index if not exists idx_content_status on public.content_items (status);

alter table public.content_items enable row level security;

-- Admin e conteúdo têm acesso total. Psicólogos e público, nada.
drop policy if exists content_all on public.content_items;
create policy content_all on public.content_items
  for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text in ('admin', 'conteudo')
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text in ('admin', 'conteudo')
  ));
