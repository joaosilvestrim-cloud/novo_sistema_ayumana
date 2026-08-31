-- ============================================================
-- Área de Comunidades (Ayumana nas Comunidades).
-- Nova camada de parceria/aquisição: cada comunidade brasileira no exterior
-- parceira ganha uma landing própria, eventos e um código de rastreio, usando
-- o mesmo catálogo de psicólogos. Não substitui as páginas de país.
-- ============================================================

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  country_code text not null,
  city_region text,
  type text not null default 'associacao',   -- associacao|grupo|centro_cultural|rede|conselho|outro
  status text not null default 'prospect',    -- prospect|negotiating|active|paused|closed
  logo_url text,
  cover_image_url text,
  website_url text,
  instagram_url text,
  contact_email text,
  contact_name text,
  headline text,
  intro_text text,
  partner_since date,
  utm_source text,
  tracking_code text,
  is_public boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_communities_public on public.communities (is_public);
create index if not exists idx_communities_country on public.communities (country_code);

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  title text not null,
  theme text,
  starts_at timestamptz,
  timezone text default 'America/Sao_Paulo',
  description text,
  speaker text,
  signup_url text,
  recording_url text,
  status text not null default 'proximo',      -- proximo|realizado|cancelado
  created_at timestamptz not null default now()
);

create index if not exists idx_community_events_community on public.community_events (community_id);

-- Atribuição no analytics: liga o evento à comunidade (slug) de origem.
alter table public.analytics_events
  add column if not exists community text;
create index if not exists idx_ae_community on public.analytics_events (community);

-- RLS: leitura pública só do que está publicado; escrita só admin/serviço.
alter table public.communities enable row level security;
drop policy if exists communities_public_read on public.communities;
create policy communities_public_read on public.communities
  for select using (is_public = true or public.is_service_or_admin());
drop policy if exists communities_admin_all on public.communities;
create policy communities_admin_all on public.communities
  for all using (public.is_service_or_admin()) with check (public.is_service_or_admin());

alter table public.community_events enable row level security;
drop policy if exists community_events_public_read on public.community_events;
create policy community_events_public_read on public.community_events
  for select using (
    exists (select 1 from public.communities c where c.id = community_id and c.is_public)
    or public.is_service_or_admin()
  );
drop policy if exists community_events_admin_all on public.community_events;
create policy community_events_admin_all on public.community_events
  for all using (public.is_service_or_admin()) with check (public.is_service_or_admin());
