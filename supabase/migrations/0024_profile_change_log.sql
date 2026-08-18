-- ============================================================
-- Auditoria de alterações do perfil. Uma linha por salvamento, com o que
-- mudou e quando. Alimenta o histórico por pessoa no admin.
-- ============================================================

create table if not exists public.profile_change_log (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references public.psychologists(id) on delete cascade,
  changed_fields text[] not null default '{}',
  intent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_change_log_psy
  on public.profile_change_log (psychologist_id, created_at desc);

alter table public.profile_change_log enable row level security;

-- Inserção é feita pelo servidor (service role, no server action de onboarding),
-- que ignora RLS. A leitura é restrita a admin/serviço.
drop policy if exists pcl_admin_read on public.profile_change_log;
create policy pcl_admin_read on public.profile_change_log
  for select using (public.is_service_or_admin());
