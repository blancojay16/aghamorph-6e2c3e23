CREATE TYPE public.body_system AS ENUM ('skeletal','muscular','digestive','circulatory','respiratory');

CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  system public.body_system NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_public_read" ON public.videos FOR SELECT USING (true);
CREATE POLICY "videos_owner_insert" ON public.videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "videos_owner_update" ON public.videos FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "videos_owner_delete" ON public.videos FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  ts_seconds numeric NOT NULL CHECK (ts_seconds >= 0),
  prompt text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL CHECK (correct_index >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
CREATE INDEX checkpoints_video_idx ON public.checkpoints(video_id, ts_seconds);
CREATE POLICY "checkpoints_public_read" ON public.checkpoints FOR SELECT USING (true);
CREATE POLICY "checkpoints_owner_write" ON public.checkpoints FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = checkpoints.video_id AND v.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = checkpoints.video_id AND v.owner_id = auth.uid()));

INSERT INTO storage.buckets (id, name, public) VALUES ('videos','videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "videos_bucket_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "videos_bucket_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos');
CREATE POLICY "videos_bucket_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'videos' AND owner = auth.uid());
CREATE POLICY "videos_bucket_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos' AND owner = auth.uid());