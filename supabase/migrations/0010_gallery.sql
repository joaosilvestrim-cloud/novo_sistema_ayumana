-- Galeria de fotos do psicólogo (consultório, ambiente etc.). URLs públicas.
alter table psychologists
  add column if not exists gallery_urls text[] not null default '{}';
