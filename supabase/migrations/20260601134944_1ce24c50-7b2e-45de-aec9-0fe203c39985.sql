CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.students TO anon;
GRANT SELECT, INSERT, UPDATE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_public_read" ON public.students FOR SELECT USING (true);
CREATE POLICY "students_public_insert" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "students_public_update" ON public.students FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX students_score_idx ON public.students (score DESC);