ALTER TABLE public.game_assets ADD COLUMN IF NOT EXISTS game text NOT NULL DEFAULT 'jigsaw';
ALTER TABLE public.game_assets ADD CONSTRAINT game_assets_game_check CHECK (game IN ('jigsaw','memory','matching'));
CREATE INDEX IF NOT EXISTS game_assets_game_idx ON public.game_assets(game);