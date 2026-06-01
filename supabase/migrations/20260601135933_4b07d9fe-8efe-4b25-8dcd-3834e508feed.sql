-- Drop the auth.users FK so owner_id can be any value (or null)
ALTER TABLE public.videos ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_owner_id_fkey;

-- Replace auth-only video policies with anon-friendly ones
DROP POLICY IF EXISTS "videos_owner_insert" ON public.videos;
DROP POLICY IF EXISTS "videos_owner_update" ON public.videos;
DROP POLICY IF EXISTS "videos_owner_delete" ON public.videos;

CREATE POLICY "videos_anon_insert" ON public.videos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "videos_anon_update" ON public.videos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "videos_anon_delete" ON public.videos FOR DELETE TO anon USING (true);

-- Replace auth-only checkpoint policy with anon-friendly one
DROP POLICY IF EXISTS "checkpoints_owner_write" ON public.checkpoints;
CREATE POLICY "checkpoints_anon_write" ON public.checkpoints FOR ALL TO anon USING (true) WITH CHECK (true);

-- Storage: replace auth-only policies with anon-friendly ones
DROP POLICY IF EXISTS "videos_bucket_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "videos_bucket_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "videos_bucket_auth_delete" ON storage.objects;

CREATE POLICY "videos_bucket_anon_insert" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'videos');
CREATE POLICY "videos_bucket_anon_update" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'videos');
CREATE POLICY "videos_bucket_anon_delete" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'videos');

-- Grants for anonymous users (students read, teacher writes via same client now)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkpoints TO anon;
GRANT ALL ON public.videos TO service_role;
GRANT ALL ON public.checkpoints TO service_role;