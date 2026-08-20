-- ============================================================
-- Log da assistente Aya. Cada pergunta do usuário vira uma linha, com a
-- resposta, se foi escalada para a equipe e se a pessoa estava logada.
-- Alimenta o monitor da Aya no admin.
-- ============================================================

create table if not exists public.assistant_log (
  id uuid primary key default gen_random_uuid(),
  question text,
  reply text,
  escalated boolean not null default false,
  logged_in boolean not null default false,
  psychologist_id uuid references public.psychologists(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_assistant_log_created on public.assistant_log (created_at desc);
create index if not exists idx_assistant_log_escalated on public.assistant_log (created_at desc) where escalated;

alter table public.assistant_log enable row level security;

-- Escrita pelo servidor (service role). Leitura só admin/serviço.
drop policy if exists al_admin_read on public.assistant_log;
create policy al_admin_read on public.assistant_log
  for select using (public.is_service_or_admin());
