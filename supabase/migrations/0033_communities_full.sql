-- ============================================================
-- Comunidades: escopo completo (além do MVP).
-- Curadoria de psicólogos por parceiro, temas por comunidade, eventos com
-- página/slug próprios, leads institucionais e dimensões de UTM no analytics.
-- ============================================================

-- Temas selecionáveis da comunidade (aparecem na landing).
alter table public.communities
  add column if not exists themes text[] not null default '{}';

-- Eventos com página própria: slug e visibilidade.
alter table public.community_events
  add column if not exists slug text,
  add column if not exists is_public boolean not null default true;
create unique index if not exists uq_community_events_slug
  on public.community_events (community_id, slug) where slug is not null;

-- Curadoria: psicólogos escolhidos a dedo para uma comunidade.
create table if not exists public.community_psychologists (
  community_id uuid not null references public.communities(id) on delete cascade,
  psychologist_id uuid not null references public.psychologists(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  primary key (community_id, psychologist_id)
);
create index if not exists idx_cp_community on public.community_psychologists (community_id);

-- Leads institucionais (líderes que querem levar a Ayumana). Não são pacientes.
create table if not exists public.community_leads (
  id uuid primary key default gen_random_uuid(),
  community_name text,
  country_code text,
  contact_name text,
  contact_email text,
  message text,
  source_slug text,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Dimensões de UTM e evento no analytics (seção 12.1 da especificação).
alter table public.analytics_events
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists community_event text;

-- RLS ---------------------------------------------------------
alter table public.community_psychologists enable row level security;
drop policy if exists cp_public_read on public.community_psychologists;
create policy cp_public_read on public.community_psychologists
  for select using (
    exists (select 1 from public.communities c where c.id = community_id and c.is_public)
    or public.is_service_or_admin()
  );
drop policy if exists cp_admin_all on public.community_psychologists;
create policy cp_admin_all on public.community_psychologists
  for all using (public.is_service_or_admin()) with check (public.is_service_or_admin());

alter table public.community_leads enable row level security;
-- Qualquer visitante pode enviar um lead institucional (formulário público).
drop policy if exists cl_public_insert on public.community_leads;
create policy cl_public_insert on public.community_leads
  for insert with check (true);
drop policy if exists cl_admin_read on public.community_leads;
create policy cl_admin_read on public.community_leads
  for select using (public.is_service_or_admin());
drop policy if exists cl_admin_all on public.community_leads;
create policy cl_admin_all on public.community_leads
  for all using (public.is_service_or_admin()) with check (public.is_service_or_admin());
