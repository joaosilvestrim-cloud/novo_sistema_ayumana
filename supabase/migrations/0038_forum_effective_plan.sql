-- Acesso ao fórum pelo plano efetivo: contratado OU cortesia/teste ainda ativo.
-- A interface e a Server Action já usam essa regra; a policy precisa concordar
-- para o Postgres não bloquear a resposta de quem está no Voz de cortesia.

drop policy if exists fa_insert on public.forum_answers;
create policy fa_insert on public.forum_answers
  for insert with check (
    status = 'pendente'
    and exists (
      select 1
      from public.psychologists p
      where p.id = forum_answers.psychologist_id
        and p.profile_id = auth.uid()
        and p.verification_status = 'aprovado'
        and (
          p.plan_tier in ('ideal', 'presenca')
          or (
            p.trial_tier in ('ideal', 'presenca')
            and p.trial_ends_at > now()
          )
        )
    )
  );
