-- Abre a plataforma para a neuropsicologia. Antes só havia temas de
-- psicoterapia. Estes entram num grupo próprio (category = 'neuro'), que a UI
-- mostra separado dos temas gerais e do foco no exterior.
insert into public.specialties (slug, name, category, sort_order) values
  ('avaliacao-neuropsicologica', 'Avaliação neuropsicológica', 'neuro', 100),
  ('tdah',                       'TDAH',                        'neuro', 101),
  ('autismo-tea',               'Autismo (TEA)',               'neuro', 102),
  ('neurodivergencia',          'Neurodivergência (adultos)',  'neuro', 103),
  ('reabilitacao-cognitiva',    'Reabilitação cognitiva',      'neuro', 104)
on conflict (slug) do nothing;
