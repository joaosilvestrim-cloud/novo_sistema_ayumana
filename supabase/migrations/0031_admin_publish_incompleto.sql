-- ============================================================
-- Permite que ADMIN/SERVIÇO publiquem um perfil na vitrine mesmo sem o perfil
-- estar 100% completo. Muitas vezes o psicólogo não sabe o que falta, e a
-- equipe decide publicar mesmo assim.
--
-- Regras de publicação após esta migration:
--  - Não verificado (status <> 'aprovado'): NUNCA publica. A página pública
--    mostra o selo "CRP verificado"; publicar um não verificado exibiria selo
--    sem conferência. Vale para todos, inclusive admin.
--  - Verificado mas incompleto: só é despublicado quando o PRÓPRIO psicólogo
--    edita o perfil (auth.uid() = profile_id). Admin e servidor (auth.uid nulo
--    ou diferente do dono) podem publicar quando quiserem.
--
-- Demais regras (aprovar/reprovar só admin, carimbo de envio, trava de plano)
-- permanecem iguais à 0020.
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

  -- Publicação:
  -- 1) precisa estar aprovado (protege o selo), sempre.
  -- 2) se estiver aprovado mas incompleto, só derruba quando é o próprio
  --    psicólogo mexendo; admin/servidor podem publicar incompleto de propósito.
  if new.verification_status <> 'aprovado' then
    new.is_published := false;
  elsif new.profile_completed = false
        and auth.uid() is not null
        and auth.uid() = new.profile_id then
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
