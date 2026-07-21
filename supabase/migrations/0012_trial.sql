-- ============================================================
-- Teste gratuito de plano (ex.: 30 dias de "Voz" para todos)
-- O plano efetivo é calculado na leitura: se o teste está no prazo,
-- vale o trial_tier; senão, vale o plan_tier contratado.
-- Assim a expiração acontece sozinha, sem depender de rotina agendada.
-- ============================================================

alter table public.psychologists
  add column if not exists trial_tier plan_tier,
  add column if not exists trial_ends_at timestamptz;

create index if not exists idx_psy_trial on public.psychologists (trial_ends_at);
