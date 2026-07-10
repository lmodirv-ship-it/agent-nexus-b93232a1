
CREATE TABLE public.ai_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_code text NOT NULL UNIQUE,
  name text NOT NULL,
  provider text NOT NULL,
  source text,
  model_id text NOT NULL,
  api_key_secret text,
  role text,
  task text,
  capabilities text[] NOT NULL DEFAULT '{}',
  rules text,
  status text NOT NULL DEFAULT 'active',
  is_enabled boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_models TO authenticated;
GRANT ALL ON public.ai_models TO service_role;

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage ai_models" ON public.ai_models FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'owner'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'owner'::public.app_role));

CREATE POLICY "authenticated read ai_models" ON public.ai_models FOR SELECT TO authenticated USING (true);

CREATE TRIGGER ai_models_set_updated_at BEFORE UPDATE ON public.ai_models
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.assign_ai_model_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE next_num int;
BEGIN
  IF NEW.model_code IS NOT NULL AND NEW.model_code <> '' THEN RETURN NEW; END IF;
  SELECT COALESCE(MAX((RIGHT(model_code, 6))::int), 0) + 1 INTO next_num
    FROM public.ai_models WHERE model_code LIKE 'M%';
  NEW.model_code := 'M' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END $$;

CREATE TRIGGER ai_models_assign_code BEFORE INSERT ON public.ai_models
  FOR EACH ROW EXECUTE FUNCTION public.assign_ai_model_code();

INSERT INTO public.ai_models (name, provider, source, model_id, role, task, capabilities, rules, status, is_enabled, is_default) VALUES
  ('Gemini 3 Flash', 'Google', 'Lovable AI Gateway', 'google/gemini-3-flash-preview', 'assistant', 'chat-general', ARRAY['text','vision','tools'], 'الافتراضي للدردشة والتحليل', 'active', true, true),
  ('Gemini 2.5 Pro', 'Google', 'Lovable AI Gateway', 'google/gemini-2.5-pro', 'reasoner', 'deep-analysis', ARRAY['text','vision','long-context'], 'للتحليل العميق والسياق الطويل', 'active', true, false),
  ('GPT-5 Mini', 'OpenAI', 'Lovable AI Gateway', 'openai/gpt-5-mini', 'assistant', 'balanced', ARRAY['text','tools','reasoning'], 'توازن جودة/كلفة', 'active', true, false),
  ('Nano Banana', 'Google', 'Lovable AI Gateway', 'google/gemini-2.5-flash-image', 'image-generator', 'image-gen', ARRAY['image-generation'], 'توليد الصور', 'active', true, false);
