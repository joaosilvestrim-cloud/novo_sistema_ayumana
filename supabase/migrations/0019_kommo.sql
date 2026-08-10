-- ============================================================
-- Integração com o Kommo (CRM): guarda o vínculo do psicólogo com o lead.
-- ============================================================

alter table public.psychologists
  add column if not exists kommo_lead_id text,
  add column if not exists kommo_contact_id text;

create index if not exists idx_psy_kommo_lead on public.psychologists (kommo_lead_id);
