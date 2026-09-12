-- =========================================================
-- Phase 3: Selfie-Bingo – Storage-Bucket `selfies`
-- Im Supabase SQL-Editor ausführen (wie 0001_init.sql).
-- =========================================================

-- Öffentlich lesbar (Galerie auf dem Beamer, Thumbnails im Grid),
-- Upload nur über signierte URLs, die /api/bingo mit dem Service-Role-Key erzeugt.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('selfies', 'selfies', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lesen für alle; Schreiben nur service_role (umgeht RLS) bzw. per signierter URL.
drop policy if exists selfies_public_read on storage.objects;
create policy selfies_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'selfies');
