
-- Quiz Match
CREATE TABLE public.quiz_match_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_image_path text NOT NULL,
  question_text text NOT NULL DEFAULT 'What do I eat?',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_match_questions TO anon, authenticated;
GRANT ALL ON public.quiz_match_questions TO service_role;
ALTER TABLE public.quiz_match_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY qmq_r ON public.quiz_match_questions FOR SELECT USING (true);
CREATE POLICY qmq_i ON public.quiz_match_questions FOR INSERT WITH CHECK (true);
CREATE POLICY qmq_u ON public.quiz_match_questions FOR UPDATE USING (true);
CREATE POLICY qmq_d ON public.quiz_match_questions FOR DELETE USING (true);

CREATE TABLE public.quiz_match_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_match_questions(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_match_choices TO anon, authenticated;
GRANT ALL ON public.quiz_match_choices TO service_role;
ALTER TABLE public.quiz_match_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY qmc_r ON public.quiz_match_choices FOR SELECT USING (true);
CREATE POLICY qmc_i ON public.quiz_match_choices FOR INSERT WITH CHECK (true);
CREATE POLICY qmc_u ON public.quiz_match_choices FOR UPDATE USING (true);
CREATE POLICY qmc_d ON public.quiz_match_choices FOR DELETE USING (true);

-- Arrange
CREATE TABLE public.arrange_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arrange_chains TO anon, authenticated;
GRANT ALL ON public.arrange_chains TO service_role;
ALTER TABLE public.arrange_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY ac_r ON public.arrange_chains FOR SELECT USING (true);
CREATE POLICY ac_i ON public.arrange_chains FOR INSERT WITH CHECK (true);
CREATE POLICY ac_u ON public.arrange_chains FOR UPDATE USING (true);
CREATE POLICY ac_d ON public.arrange_chains FOR DELETE USING (true);

CREATE TABLE public.arrange_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL REFERENCES public.arrange_chains(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  label text NOT NULL DEFAULT '',
  position int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arrange_items TO anon, authenticated;
GRANT ALL ON public.arrange_items TO service_role;
ALTER TABLE public.arrange_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_r ON public.arrange_items FOR SELECT USING (true);
CREATE POLICY ai_i ON public.arrange_items FOR INSERT WITH CHECK (true);
CREATE POLICY ai_u ON public.arrange_items FOR UPDATE USING (true);
CREATE POLICY ai_d ON public.arrange_items FOR DELETE USING (true);

-- Trace Animals
CREATE TABLE public.trace_animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  image_path text NOT NULL,
  category text NOT NULL CHECK (category IN ('herbivore','carnivore','omnivore')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trace_animals TO anon, authenticated;
GRANT ALL ON public.trace_animals TO service_role;
ALTER TABLE public.trace_animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY ta_r ON public.trace_animals FOR SELECT USING (true);
CREATE POLICY ta_i ON public.trace_animals FOR INSERT WITH CHECK (true);
CREATE POLICY ta_u ON public.trace_animals FOR UPDATE USING (true);
CREATE POLICY ta_d ON public.trace_animals FOR DELETE USING (true);

-- Connect Pairs
CREATE TABLE public.connect_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connect_sets TO anon, authenticated;
GRANT ALL ON public.connect_sets TO service_role;
ALTER TABLE public.connect_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY cs_r ON public.connect_sets FOR SELECT USING (true);
CREATE POLICY cs_i ON public.connect_sets FOR INSERT WITH CHECK (true);
CREATE POLICY cs_u ON public.connect_sets FOR UPDATE USING (true);
CREATE POLICY cs_d ON public.connect_sets FOR DELETE USING (true);

CREATE TABLE public.connect_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL REFERENCES public.connect_sets(id) ON DELETE CASCADE,
  left_image_path text NOT NULL,
  right_image_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connect_pairs TO anon, authenticated;
GRANT ALL ON public.connect_pairs TO service_role;
ALTER TABLE public.connect_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_r ON public.connect_pairs FOR SELECT USING (true);
CREATE POLICY cp_i ON public.connect_pairs FOR INSERT WITH CHECK (true);
CREATE POLICY cp_u ON public.connect_pairs FOR UPDATE USING (true);
CREATE POLICY cp_d ON public.connect_pairs FOR DELETE USING (true);
