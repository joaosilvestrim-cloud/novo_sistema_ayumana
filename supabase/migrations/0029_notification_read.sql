-- Marca quando um pedido foi "lido" pela equipe no admin. Serve para destacar os
-- pedidos de atendimento humano ainda não vistos.
alter table public.notifications
  add column if not exists read_at timestamptz;
