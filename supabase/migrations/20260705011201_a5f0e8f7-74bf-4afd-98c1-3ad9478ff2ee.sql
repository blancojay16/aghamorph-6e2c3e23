
CREATE TABLE public.trace_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  system text NOT NULL DEFAULT 'food_chain',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trace_chains TO anon, authenticated;
GRANT ALL ON public.trace_chains TO service_role;
ALTER TABLE public.trace_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trace_chains_public_read" ON public.trace_chains FOR SELECT USING (true);
CREATE POLICY "trace_chains_public_insert" ON public.trace_chains FOR INSERT WITH CHECK (true);
CREATE POLICY "trace_chains_public_update" ON public.trace_chains FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "trace_chains_public_delete" ON public.trace_chains FOR DELETE USING (true);

CREATE TABLE public.trace_organisms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL REFERENCES public.trace_chains(id) ON DELETE CASCADE,
  label text NOT NULL,
  file_path text NOT NULL,
  position integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trace_organisms TO anon, authenticated;
GRANT ALL ON public.trace_organisms TO service_role;
ALTER TABLE public.trace_organisms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trace_organisms_public_read" ON public.trace_organisms FOR SELECT USING (true);
CREATE POLICY "trace_organisms_public_insert" ON public.trace_organisms FOR INSERT WITH CHECK (true);
CREATE POLICY "trace_organisms_public_update" ON public.trace_organisms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "trace_organisms_public_delete" ON public.trace_organisms FOR DELETE USING (true);

CREATE INDEX trace_organisms_chain_idx ON public.trace_organisms(chain_id, position);
