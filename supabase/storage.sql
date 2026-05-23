-- ============================================================
-- Supabase Storage Setup
-- Run AFTER schema.sql, in the SQL Editor
-- ============================================================

-- 1. Create the storage bucket via Dashboard:
--    Storage > New Bucket > Name: "wedding-photos"
--    ✓ Public bucket (so image URLs are publicly accessible)
--    Max file size: 6 MB
--    Allowed MIME types: image/jpeg, image/png, image/webp, image/heic

-- 2. Or create it via SQL:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-photos',
  'wedding-photos',
  true,
  6291456,   -- 6 MB in bytes
  array['image/jpeg','image/png','image/webp','image/heic','image/gif']
)
on conflict (id) do nothing;

-- 3. Storage RLS policies
-- Allow anyone to upload (guests upload directly from browser)
create policy "Public upload to wedding-photos"
  on storage.objects for insert
  with check (bucket_id = 'wedding-photos');

-- Allow anyone to read/view photos
create policy "Public read wedding-photos"
  on storage.objects for select
  using (bucket_id = 'wedding-photos');

-- Only service role can delete (admin)
create policy "Service role delete wedding-photos"
  on storage.objects for delete
  using (
    bucket_id = 'wedding-photos'
    and auth.role() = 'service_role'
  );
