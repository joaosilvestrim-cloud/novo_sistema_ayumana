-- Preço da sessão presencial (o online continua em session_price_cents).
alter table psychologists
  add column if not exists session_price_in_person_cents integer;
