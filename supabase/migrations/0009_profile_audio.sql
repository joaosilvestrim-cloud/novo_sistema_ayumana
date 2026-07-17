-- Áudio de apresentação do psicólogo (URL pública no bucket perfil-audio).
alter table psychologists
  add column if not exists audio_url text;
