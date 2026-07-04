CREATE TABLE public.group_game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  game TEXT NOT NULL CHECK (game IN ('label','memory','jigsaw','quiz')),
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (group_id, game)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_game_scores TO anon, authenticated;
GRANT ALL ON public.group_game_scores TO service_role;

ALTER TABLE public.group_game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ggs_public_read" ON public.group_game_scores FOR SELECT USING (true);
CREATE POLICY "ggs_public_insert" ON public.group_game_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "ggs_public_update" ON public.group_game_scores FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "ggs_public_delete" ON public.group_game_scores FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.ggs_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ggs_updated_at BEFORE UPDATE ON public.group_game_scores
FOR EACH ROW EXECUTE FUNCTION public.ggs_touch_updated_at();

CREATE INDEX ggs_game_score_idx ON public.group_game_scores (game, score DESC);
