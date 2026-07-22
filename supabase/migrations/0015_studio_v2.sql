-- ============================================================
-- Estúdio v2: conversa por peça, versões da arte e acesso do psicólogo
-- ============================================================

-- 1) Campos novos na peça -------------------------------------------------
alter table public.content_items
  add column if not exists due_date date,                    -- prazo combinado
  add column if not exists caption text,                     -- legenda pronta do post
  add column if not exists hashtags text,
  add column if not exists requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists psy_seen_at timestamptz,           -- última visita do psicólogo
  add column if not exists studio_seen_at timestamptz,        -- última visita do estúdio
  add column if not exists last_touch_by text;                -- 'psicologo' | 'estudio'

create index if not exists idx_content_due on public.content_items (due_date);

-- 2) Conversa dentro da peça ---------------------------------------------
create table if not exists public.content_comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.content_items(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text,                       -- congelado, para não sumir se a conta for apagada
  author_side text not null,              -- 'psicologo' | 'estudio'
  body text not null,
  kind text not null default 'mensagem',  -- mensagem | aprovacao | ajuste | sistema
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_item on public.content_comments (item_id, created_at);

-- 3) Versões da arte (nunca sobrescreve, sempre soma) ---------------------
create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.content_items(id) on delete cascade,
  version int not null default 1,
  url text not null,
  mime text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_versions_item on public.content_versions (item_id, version desc);

-- 4) Segurança -------------------------------------------------------------
alter table public.content_comments enable row level security;
alter table public.content_versions enable row level security;

-- Equipe (admin + conteúdo) enxerga tudo.
drop policy if exists comments_staff on public.content_comments;
create policy comments_staff on public.content_comments for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('admin','conteudo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('admin','conteudo')));

drop policy if exists versions_staff on public.content_versions;
create policy versions_staff on public.content_versions for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('admin','conteudo')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text in ('admin','conteudo')));

-- O psicólogo enxerga as próprias peças, a conversa delas e as versões.
drop policy if exists content_own_read on public.content_items;
create policy content_own_read on public.content_items for select
  using (exists (
    select 1 from public.psychologists ps
    where ps.id = content_items.psychologist_id and ps.profile_id = auth.uid()
  ));

drop policy if exists comments_own_read on public.content_comments;
create policy comments_own_read on public.content_comments for select
  using (exists (
    select 1 from public.content_items ci
    join public.psychologists ps on ps.id = ci.psychologist_id
    where ci.id = content_comments.item_id and ps.profile_id = auth.uid()
  ));

drop policy if exists versions_own_read on public.content_versions;
create policy versions_own_read on public.content_versions for select
  using (exists (
    select 1 from public.content_items ci
    join public.psychologists ps on ps.id = ci.psychologist_id
    where ci.id = content_versions.item_id and ps.profile_id = auth.uid()
  ));

-- 5) Migra a arte que já existe para a primeira versão --------------------
insert into public.content_versions (item_id, version, url, created_at)
select ci.id, 1, ci.asset_url, ci.created_at
from public.content_items ci
where ci.asset_url is not null
  and not exists (select 1 from public.content_versions v where v.item_id = ci.id);
