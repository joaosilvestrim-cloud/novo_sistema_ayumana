-- ============================================================
-- Ayumana — Migration 0003 (Fase 4: blog e fórum)
-- Idempotente. Rodar após a 0002.
-- ============================================================

set check_function_bodies = off;

do $$ begin
  create type content_status as enum ('pendente', 'publicada', 'reprovada');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- blog_posts
-- ------------------------------------------------------------
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_url text,
  category text not null default 'geral',
  author_name text not null default 'Equipe Ayumana',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_published on public.blog_posts (published, published_at desc);

drop trigger if exists trg_blog_updated on public.blog_posts;
create trigger trg_blog_updated before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- forum_questions (pergunta anônima do paciente)
-- ------------------------------------------------------------
create table if not exists public.forum_questions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  body text,
  author_alias text not null default 'Anônimo',
  country_code text,
  specialty_id integer references public.specialties(id) on delete set null,
  status content_status not null default 'pendente',
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_fq_status on public.forum_questions (status, published_at desc);

-- ------------------------------------------------------------
-- forum_answers (resposta do psicólogo Ideal+)
-- ------------------------------------------------------------
create table if not exists public.forum_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.forum_questions(id) on delete cascade,
  psychologist_id uuid not null references public.psychologists(id) on delete cascade,
  body text not null,
  status content_status not null default 'pendente',
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_fa_question on public.forum_answers (question_id, status);
create index if not exists idx_fa_psy on public.forum_answers (psychologist_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.blog_posts enable row level security;
alter table public.forum_questions enable row level security;
alter table public.forum_answers enable row level security;

-- blog: leitura pública do publicado; escrita só admin.
drop policy if exists blog_select on public.blog_posts;
create policy blog_select on public.blog_posts
  for select using (published = true or public.is_service_or_admin());

drop policy if exists blog_write on public.blog_posts;
create policy blog_write on public.blog_posts
  for all using (public.is_service_or_admin())
  with check (public.is_service_or_admin());

-- perguntas: leitura pública das publicadas; qualquer um pode enviar (pendente);
-- moderação (update/delete) só admin.
drop policy if exists fq_select on public.forum_questions;
create policy fq_select on public.forum_questions
  for select using (status = 'publicada' or public.is_service_or_admin());

drop policy if exists fq_insert on public.forum_questions;
create policy fq_insert on public.forum_questions
  for insert with check (status = 'pendente');

drop policy if exists fq_update on public.forum_questions;
create policy fq_update on public.forum_questions
  for update using (public.is_service_or_admin())
  with check (public.is_service_or_admin());

drop policy if exists fq_delete on public.forum_questions;
create policy fq_delete on public.forum_questions
  for delete using (public.is_service_or_admin());

-- respostas: leitura pública das publicadas (ou do próprio autor / admin);
-- insere só psicólogo Ideal+ como pendente; moderação só admin.
drop policy if exists fa_select on public.forum_answers;
create policy fa_select on public.forum_answers
  for select using (
    status = 'publicada'
    or public.is_service_or_admin()
    or exists (
      select 1 from public.psychologists p
      where p.id = forum_answers.psychologist_id and p.profile_id = auth.uid()
    )
  );

drop policy if exists fa_insert on public.forum_answers;
create policy fa_insert on public.forum_answers
  for insert with check (
    status = 'pendente'
    and exists (
      select 1 from public.psychologists p
      where p.id = forum_answers.psychologist_id
        and p.profile_id = auth.uid()
        and p.plan_tier in ('ideal', 'presenca')
    )
  );

drop policy if exists fa_update on public.forum_answers;
create policy fa_update on public.forum_answers
  for update using (public.is_service_or_admin())
  with check (public.is_service_or_admin());

drop policy if exists fa_delete on public.forum_answers;
create policy fa_delete on public.forum_answers
  for delete using (public.is_service_or_admin());

-- Fim da migration 0003.
