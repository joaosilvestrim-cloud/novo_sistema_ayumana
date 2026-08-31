-- ============================================================
-- Acesso do responsável pela comunidade (área logada de leitura).
-- Liga um usuário (profile) a uma ou mais comunidades. O líder entra e vê o
-- relatório da comunidade dele, sem poder editar.
-- ============================================================

create table if not exists public.community_managers (
  community_id uuid not null references public.communities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (community_id, profile_id)
);
create index if not exists idx_cm_profile on public.community_managers (profile_id);

alter table public.community_managers enable row level security;
drop policy if exists cm_self_read on public.community_managers;
create policy cm_self_read on public.community_managers
  for select using (profile_id = auth.uid() or public.is_service_or_admin());
drop policy if exists cm_admin_all on public.community_managers;
create policy cm_admin_all on public.community_managers
  for all using (public.is_service_or_admin()) with check (public.is_service_or_admin());
