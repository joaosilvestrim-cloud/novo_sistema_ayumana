-- ============================================================
-- Conserta a trava de plano. A versão anterior dependia de
-- is_service_or_admin(), que em alguns contextos não reconhece a chave de
-- serviço e acabava revertendo trocas legítimas do admin e do webhook.
--
-- Nova regra: só bloqueia quando o PRÓPRIO psicólogo tenta mudar o seu plano
-- (auth.uid() = profile_id). Servidor (service role, auth.uid nulo) e admin
-- passam sempre. Isso mantém a defesa e não atrapalha admin nem webhook.
-- ============================================================

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

  -- Plano pago: bloqueia apenas o dono do perfil mudando o próprio plano.
  -- Servidor e admin (auth.uid nulo ou diferente do dono) passam.
  if new.plan_tier <> 'essencial'
     and (old.plan_tier is distinct from new.plan_tier)
     and auth.uid() is not null
     and auth.uid() = new.profile_id then
    new.plan_tier := coalesce(old.plan_tier, 'essencial');
  end if;

  return new;
end;
$$;
