-- Guarda o texto completo da notificação (hoje só salvamos um preview de 300
-- caracteres). Assim o admin consegue ver o detalhe inteiro de cada pedido de
-- atendimento humano, não só o começo.
alter table public.notifications
  add column if not exists body text;
