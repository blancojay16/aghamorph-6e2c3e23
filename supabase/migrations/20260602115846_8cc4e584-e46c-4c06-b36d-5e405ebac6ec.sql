CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.quiz_questions TO anon;

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY quiz_questions_public_read ON public.quiz_questions FOR SELECT TO public USING (true);
CREATE POLICY quiz_questions_anon_write ON public.quiz_questions FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE INDEX idx_quiz_questions_video ON public.quiz_questions(video_id, position);