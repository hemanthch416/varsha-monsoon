CREATE TABLE public.preparedness_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_hash TEXT NOT NULL,
  language TEXT NOT NULL,
  plan JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, profile_hash, language)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preparedness_plans TO authenticated;
GRANT ALL ON public.preparedness_plans TO service_role;
ALTER TABLE public.preparedness_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plans" ON public.preparedness_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER plans_updated BEFORE UPDATE ON public.preparedness_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_plans_lookup ON public.preparedness_plans (user_id, profile_hash, language);