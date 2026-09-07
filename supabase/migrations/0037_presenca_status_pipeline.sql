-- Renomeia o pipeline manual da fila do Presença para acompanhar o fluxo real.
-- 'pago' NÃO é um status manual: vem automático do Asaas. As etapas manuais são:
--   novo -> contatado -> cobranca_gerada -> recusado
alter table public.presenca_waitlist alter column status set default 'novo';

update public.presenca_waitlist set status = 'novo'             where status = 'pendente';
update public.presenca_waitlist set status = 'cobranca_gerada'  where status = 'aprovado';
