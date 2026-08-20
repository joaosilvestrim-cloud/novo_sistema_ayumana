-- ============================================================
-- Fila de espera do plano Presença (vagas limitadas, 15 a 20).
-- Quem quer o Presença se inscreve; a equipe vê a lista no admin com todos
-- os dados da pessoa e vai chamando conforme abre vaga.
-- ============================================================

create table if not exists public.presenca_waitlist (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid references public.psychologists(id) on delete set null,
  name text,
  email text,
  phone text,
  city text,
  crp text,
  note text,
  status text not null default 'pendente', -- pendente | contatado | aprovado | recusado
  created_at timestamptz not null default now()
);

create index if not exists idx_presenca_waitlist_created
  on public.presenca_waitlist (created_at desc);

alter table public.presenca_waitlist enable row level security;

-- Inscrição e leitura passam pelo servidor (service role, que ignora RLS).
-- A leitura direta fica restrita a admin/serviço.
drop policy if exists pw_admin_read on public.presenca_waitlist;
create policy pw_admin_read on public.presenca_waitlist
  for select using (public.is_service_or_admin());
