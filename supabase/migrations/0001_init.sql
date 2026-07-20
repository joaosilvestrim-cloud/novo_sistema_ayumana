-- ============================================================
-- Ayumana — Migration 0001 (Fase 1: fundação)
-- Modelo de dados: perfis, planos, psicólogos, lookups, verificação de CRP.
-- Idempotente: pode rodar novamente sem quebrar.
-- Rodar no Supabase → SQL Editor (ou via CLI).
-- ============================================================

create extension if not exists "pgcrypto";

-- Permite que funções referenciem tabelas criadas mais abaixo (forward refs).
set check_function_bodies = off;

-- ------------------------------------------------------------
-- ENUMs
-- ------------------------------------------------------------
do $$ begin
  create type user_role as enum ('psicologo', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_tier as enum ('essencial', 'destaque', 'ideal', 'presenca');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('nao_enviado', 'pendente', 'aprovado', 'reprovado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_type as enum ('feminino', 'masculino', 'nao_binario', 'outro', 'prefiro_nao_dizer');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------
create or replace function public.is_service_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((auth.jwt() ->> 'role') = 'service_role', false)
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles (1:1 com auth.users) — psicólogos e admins
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'psicologo',
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o profile automaticamente quando um usuário se registra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- plans (tabela de referência — 4 planos)
-- ------------------------------------------------------------
create table if not exists public.plans (
  id plan_tier primary key,
  name text not null,
  price_cents integer not null default 0,
  price_label text,
  search_priority integer not null default 0,
  features jsonb not null default '[]'::jsonb,
  is_selfservice boolean not null default true,
  sort_order integer not null default 0
);

insert into public.plans (id, name, price_cents, price_label, search_priority, is_selfservice, sort_order, features) values
  ('essencial', 'Essencial', 0, 'Grátis', 0, true, 1,
    '["Perfil completo","Verificação de CRP","Contato via WhatsApp","Aparece na busca"]'::jsonb),
  ('destaque', 'Destaque', 2490, 'R$ 24,90/mês', 10, true, 2,
    '["Prioridade na busca","Exibição do valor da sessão","Indicador de agenda aberta","Campos extras no perfil"]'::jsonb),
  ('ideal', 'Ideal', 3990, 'R$ 39,90/mês', 20, true, 3,
    '["Prioridade máxima","Vídeo de apresentação","Selo atende no exterior em destaque","Participação no fórum"]'::jsonb),
  ('presenca', 'Presença', 29700, 'R$ 297/mês', 30, false, 4,
    '["Tudo do Ideal","Presença digital gerida pela Ayumana","8 peças/mês + 1 revisão","Capacidade limitada (15 a 20 vagas)"]'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  price_label = excluded.price_label,
  search_priority = excluded.search_priority,
  is_selfservice = excluded.is_selfservice,
  sort_order = excluded.sort_order,
  features = excluded.features;

-- ------------------------------------------------------------
-- Lookups: abordagens e especialidades (queixas/temas)
-- ------------------------------------------------------------
create table if not exists public.approaches (
  id serial primary key,
  slug text unique not null,
  name text not null,
  sort_order integer not null default 0
);

insert into public.approaches (slug, name, sort_order) values
  ('tcc', 'Terapia Cognitivo-Comportamental (TCC)', 1),
  ('psicanalise', 'Psicanálise', 2),
  ('psicodinamica', 'Psicoterapia Psicodinâmica', 3),
  ('humanista', 'Abordagem Humanista', 4),
  ('gestalt', 'Gestalt-terapia', 5),
  ('sistemica', 'Terapia Sistêmica / Familiar', 6),
  ('act', 'Terapia de Aceitação e Compromisso (ACT)', 7),
  ('analitico-comportamental', 'Análise do Comportamento', 8),
  ('junguiana', 'Psicologia Analítica (Junguiana)', 9),
  ('emdr', 'EMDR', 10)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

create table if not exists public.specialties (
  id serial primary key,
  slug text unique not null,
  name text not null,
  category text not null default 'geral',
  sort_order integer not null default 0
);

insert into public.specialties (slug, name, category, sort_order) values
  ('ansiedade', 'Ansiedade', 'geral', 1),
  ('depressao', 'Depressão', 'geral', 2),
  ('estresse', 'Estresse e burnout', 'geral', 3),
  ('autoestima', 'Autoestima', 'geral', 4),
  ('relacionamentos', 'Relacionamentos', 'geral', 5),
  ('luto', 'Luto', 'geral', 6),
  ('panico', 'Síndrome do pânico', 'geral', 7),
  ('trauma', 'Trauma', 'geral', 8),
  ('sexualidade', 'Sexualidade', 'geral', 9),
  ('vicios', 'Dependências e vícios', 'geral', 10),
  ('carreira', 'Carreira e trabalho', 'geral', 11),
  ('maternidade', 'Maternidade e parentalidade', 'geral', 12),
  -- Foco exterior (diferencial Ayumana):
  ('saudade', 'Saudade e adaptação no exterior', 'exterior', 20),
  ('adaptacao-cultural', 'Choque e adaptação cultural', 'exterior', 21),
  ('identidade', 'Identidade e pertencimento', 'exterior', 22),
  ('maternidade-exterior', 'Maternidade longe da rede de apoio', 'exterior', 23),
  ('filhos-bilingues', 'Filhos bilíngues e criação no exterior', 'exterior', 24),
  ('relacionamento-distancia', 'Relacionamento à distância', 'exterior', 25),
  ('solidao-exterior', 'Solidão e isolamento no exterior', 'exterior', 26)
on conflict (slug) do update set name = excluded.name, category = excluded.category, sort_order = excluded.sort_order;

-- ------------------------------------------------------------
-- psychologists (perfil profissional)
-- ------------------------------------------------------------
create table if not exists public.psychologists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  slug text unique,
  display_name text,
  headline text,
  bio text,
  gender gender_type,

  -- CRP / verificação
  crp_number text,
  crp_uf text,
  crp_document_path text,
  verification_status verification_status not null default 'nao_enviado',
  verification_notes text,
  verification_submitted_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),

  -- Plano
  plan_tier plan_tier not null default 'essencial' references public.plans(id),

  -- Localização e contato
  city text,
  state text,
  country text not null default 'BR',
  phone_whatsapp text,
  whatsapp_message text default 'Olá! Encontrei seu perfil na Ayumana e gostaria de saber mais sobre seus atendimentos.',

  -- Atendimento
  session_price_cents integer,
  video_url text,
  accepts_online boolean not null default true,
  accepts_in_person boolean not null default false,
  attends_abroad boolean not null default false,
  audiences text[] not null default '{adulto}',
  languages text[] not null default '{pt}',
  timezones text[] not null default '{}',

  -- Estado
  profile_completed boolean not null default false,
  is_published boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_psychologists_published on public.psychologists (is_published);
create index if not exists idx_psychologists_plan on public.psychologists (plan_tier);
create index if not exists idx_psychologists_verification on public.psychologists (verification_status);
create index if not exists idx_psychologists_abroad on public.psychologists (attends_abroad);

drop trigger if exists trg_psychologists_updated on public.psychologists;
create trigger trg_psychologists_updated before update on public.psychologists
  for each row execute function public.set_updated_at();

-- Regras de negócio (segurança): impede autoaprovação e autopublicação.
create or replace function public.enforce_psychologist_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  privileged boolean := public.is_service_or_admin();
begin
  -- Só admin/service pode aprovar ou reprovar.
  if new.verification_status in ('aprovado', 'reprovado') then
    if not privileged then
      new.verification_status := coalesce(old.verification_status, 'nao_enviado');
    end if;
  end if;

  -- Carimba data de envio para revisão.
  if new.verification_status = 'pendente'
     and (old.verification_status is distinct from 'pendente') then
    new.verification_submitted_at := now();
  end if;

  -- Publicação derivada: só publica se aprovado e perfil completo.
  if new.verification_status <> 'aprovado' or new.profile_completed = false then
    new.is_published := false;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_psychologists_rules on public.psychologists;
create trigger trg_psychologists_rules
  before insert or update on public.psychologists
  for each row execute function public.enforce_psychologist_rules();

-- ------------------------------------------------------------
-- Joins: abordagens, especialidades, países atendidos
-- ------------------------------------------------------------
create table if not exists public.psychologist_approaches (
  psychologist_id uuid not null references public.psychologists(id) on delete cascade,
  approach_id integer not null references public.approaches(id) on delete cascade,
  primary key (psychologist_id, approach_id)
);

create table if not exists public.psychologist_specialties (
  psychologist_id uuid not null references public.psychologists(id) on delete cascade,
  specialty_id integer not null references public.specialties(id) on delete cascade,
  primary key (psychologist_id, specialty_id)
);

create table if not exists public.psychologist_countries (
  psychologist_id uuid not null references public.psychologists(id) on delete cascade,
  country_code text not null,
  primary key (psychologist_id, country_code)
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.approaches enable row level security;
alter table public.specialties enable row level security;
alter table public.psychologists enable row level security;
alter table public.psychologist_approaches enable row level security;
alter table public.psychologist_specialties enable row level security;
alter table public.psychologist_countries enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_service_or_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    -- impede autoescalonamento de privilégio: o papel não pode mudar.
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Referência pública (leitura livre)
drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select using (true);

drop policy if exists approaches_read on public.approaches;
create policy approaches_read on public.approaches for select using (true);

drop policy if exists specialties_read on public.specialties;
create policy specialties_read on public.specialties for select using (true);

-- psychologists
drop policy if exists psy_select_public on public.psychologists;
create policy psy_select_public on public.psychologists
  for select using (
    is_published = true
    or profile_id = auth.uid()
    or public.is_service_or_admin()
  );

drop policy if exists psy_insert_own on public.psychologists;
create policy psy_insert_own on public.psychologists
  for insert with check (profile_id = auth.uid());

drop policy if exists psy_update_own on public.psychologists;
create policy psy_update_own on public.psychologists
  for update using (profile_id = auth.uid() or public.is_service_or_admin())
  with check (profile_id = auth.uid() or public.is_service_or_admin());

-- Joins: dono gerencia; leitura pública quando o perfil está publicado.
do $$
declare t text;
begin
  foreach t in array array['psychologist_approaches','psychologist_specialties','psychologist_countries']
  loop
    execute format('drop policy if exists %I_select on public.%I;', t, t);
    execute format($f$
      create policy %1$I_select on public.%1$I for select using (
        exists (select 1 from public.psychologists p
                where p.id = %1$I.psychologist_id
                  and (p.is_published = true or p.profile_id = auth.uid() or public.is_service_or_admin()))
      );$f$, t);

    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format($f$
      create policy %1$I_write on public.%1$I for all using (
        exists (select 1 from public.psychologists p
                where p.id = %1$I.psychologist_id
                  and (p.profile_id = auth.uid() or public.is_service_or_admin()))
      ) with check (
        exists (select 1 from public.psychologists p
                where p.id = %1$I.psychologist_id
                  and (p.profile_id = auth.uid() or public.is_service_or_admin()))
      );$f$, t);
  end loop;
end $$;

-- ============================================================
-- Storage: bucket privado para documentos de CRP
-- ============================================================
insert into storage.buckets (id, name, public)
values ('crp-documentos', 'crp-documentos', false)
on conflict (id) do nothing;

-- O dono envia/lê arquivos dentro da pasta com o seu user id: <uid>/arquivo
drop policy if exists crp_insert_own on storage.objects;
create policy crp_insert_own on storage.objects
  for insert with check (
    bucket_id = 'crp-documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists crp_select_own on storage.objects;
create policy crp_select_own on storage.objects
  for select using (
    bucket_id = 'crp-documentos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_service_or_admin())
  );

drop policy if exists crp_update_own on storage.objects;
create policy crp_update_own on storage.objects
  for update using (
    bucket_id = 'crp-documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists crp_delete_own on storage.objects;
create policy crp_delete_own on storage.objects
  for delete using (
    bucket_id = 'crp-documentos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_service_or_admin())
  );

-- Fim da migration 0001.
