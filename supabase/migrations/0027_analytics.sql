-- ============================================================
-- Analytics próprio (first-party). Rastreia visualizações de página e cliques,
-- sem IP e sem dado pessoal. Só um id anônimo de visitante (aleatório) para
-- contar visitantes únicos. Agregações via funções, para escalar.
-- ============================================================

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,        -- 'pageview' | 'click'
  path text,                 -- página
  label text,                -- o que foi clicado (texto/href/data-track)
  referrer text,             -- host de origem (externo)
  device text,               -- 'mobile' | 'desktop'
  visitor text,              -- id anônimo do visitante
  created_at timestamptz not null default now()
);

create index if not exists idx_ae_created on public.analytics_events (created_at desc);
create index if not exists idx_ae_type_created on public.analytics_events (type, created_at desc);
create index if not exists idx_ae_path on public.analytics_events (path);

alter table public.analytics_events enable row level security;
-- Escrita pelo servidor (service role, na rota /api/track). Leitura só admin.
drop policy if exists ae_admin_read on public.analytics_events;
create policy ae_admin_read on public.analytics_events
  for select using (public.is_service_or_admin());

-- Top de um campo (path/label/referrer/device), por tipo e período.
create or replace function public.analytics_top(_type text, _field text, _since timestamptz, _limit int default 10)
returns table(rotulo text, n bigint)
language plpgsql security definer set search_path = public as $$
begin
  if _field not in ('path', 'label', 'referrer', 'device') then
    raise exception 'campo invalido';
  end if;
  return query execute format(
    'select %I::text as rotulo, count(*)::bigint as n from public.analytics_events
     where type = $1 and created_at >= $2 and %I is not null and %I <> ''''
     group by %I order by n desc, rotulo limit $3',
    _field, _field, _field, _field
  ) using _type, _since, _limit;
end $$;

-- Série diária de pageviews e cliques.
create or replace function public.analytics_daily(_since timestamptz)
returns table(dia date, pageviews bigint, clicks bigint)
language sql security definer set search_path = public as $$
  select date_trunc('day', created_at)::date as dia,
         count(*) filter (where type = 'pageview')::bigint as pageviews,
         count(*) filter (where type = 'click')::bigint as clicks
  from public.analytics_events
  where created_at >= _since
  group by 1 order by 1;
$$;

-- Visitantes únicos no período.
create or replace function public.analytics_visitors(_since timestamptz)
returns bigint
language sql security definer set search_path = public as $$
  select count(distinct visitor) from public.analytics_events
  where created_at >= _since and visitor is not null;
$$;
