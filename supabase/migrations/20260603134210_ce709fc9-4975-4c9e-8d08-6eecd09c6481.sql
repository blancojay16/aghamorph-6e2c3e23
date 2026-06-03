CREATE TABLE public.game_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system public.body_system NOT NULL,
  label text NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.game_assets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_assets TO authenticated;
GRANT ALL ON public.game_assets TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.game_assets TO anon;

ALTER TABLE public.game_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_assets_public_read" ON public.game_assets FOR SELECT USING (true);
CREATE POLICY "game_assets_anon_write" ON public.game_assets FOR ALL USING (true) WITH CHECK (true);
