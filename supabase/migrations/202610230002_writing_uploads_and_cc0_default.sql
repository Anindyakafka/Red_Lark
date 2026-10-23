-- Team decision: quick contributions default to the public domain (CC0).
alter table public.works alter column licence_id set default 'CC0-1.0';

-- Writing arrives in the private quarantine bucket and is converted server-side to
-- sanitized plain text. DOCX is never rendered as browser HTML or published raw.
alter table public.uploads drop constraint if exists uploads_mime_check;
alter table public.uploads add constraint uploads_mime_check check (mime in (
  'image/jpeg', 'image/png', 'text/plain', 'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
));
