-- Igual ao analytics_top, mas conta VISITANTES DISTINTOS (não visualizações).
-- Usado em "De onde vêm": quantos navegadores diferentes chegaram de cada site,
-- em vez de somar todas as visualizações daquela origem.
create or replace function public.analytics_top_visitors(_type text, _field text, _since timestamptz, _limit int default 10)
returns table(rotulo text, n bigint)
language plpgsql security definer set search_path = public as $$
begin
  if _field not in ('path', 'label', 'referrer', 'device') then
    raise exception 'campo invalido';
  end if;
  return query execute format(
    'select %I::text as rotulo, count(distinct visitor)::bigint as n from public.analytics_events
     where type = $1 and created_at >= $2 and %I is not null and %I <> '''' and visitor is not null
     group by %I order by n desc, rotulo limit $3',
    _field, _field, _field, _field
  ) using _type, _since, _limit;
end $$;
