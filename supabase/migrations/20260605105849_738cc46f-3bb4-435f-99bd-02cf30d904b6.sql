CREATE TABLE public.student_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  video_id uuid NOT NULL,
  video_title text NOT NULL,
  source text NOT NULL CHECK (source IN ('checkpoint','quiz')),
  question_id uuid,
  prompt text NOT NULL,
  options jsonb NOT NULL,
  picked_index integer NOT NULL,
  correct_index integer NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX student_answers_student_idx ON public.student_answers(student_id);
CREATE INDEX student_answers_video_idx ON public.student_answers(student_id, video_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_answers TO anon, authenticated;
GRANT ALL ON public.student_answers TO service_role;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_answers_public_read" ON public.student_answers FOR SELECT USING (true);
CREATE POLICY "student_answers_public_insert" ON public.student_answers FOR INSERT WITH CHECK (true);

CREATE POLICY "students_public_delete" ON public.students FOR DELETE USING (true);