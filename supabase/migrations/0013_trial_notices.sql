-- Marcas de aviso do fim do teste gratuito, para não enviar e-mail duplicado.
-- São zeradas sempre que um novo teste é concedido.
alter table public.psychologists
  add column if not exists trial_notified_7 boolean not null default false,
  add column if not exists trial_notified_1 boolean not null default false;
