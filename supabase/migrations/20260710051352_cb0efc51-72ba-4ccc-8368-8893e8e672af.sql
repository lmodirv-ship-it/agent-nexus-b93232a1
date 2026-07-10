
CREATE TABLE public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  base_url text,
  api_key_secret_name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_providers TO authenticated;
GRANT ALL ON public.ai_providers TO service_role;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read ai_providers" ON public.ai_providers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "owners manage ai_providers" ON public.ai_providers
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'owner'::app_role));
CREATE TRIGGER ai_providers_set_updated_at BEFORE UPDATE ON public.ai_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ai_providers (code, name, base_url, api_key_secret_name) VALUES
  ('lovable-gateway', 'Lovable AI Gateway', 'https://ai.gateway.lovable.dev/v1', 'LOVABLE_API_KEY'),
  ('openai', 'OpenAI', 'https://api.openai.com/v1', 'OPENAI_API_KEY'),
  ('google', 'Google Gemini', 'https://generativelanguage.googleapis.com', 'GOOGLE_AI_API_KEY');

-- Reshape ai_models: make legacy columns nullable
ALTER TABLE public.ai_models
  ALTER COLUMN provider DROP NOT NULL,
  ALTER COLUMN name DROP NOT NULL;

ALTER TABLE public.ai_models
  ADD COLUMN provider_id uuid REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  ADD COLUMN gateway_code text,
  ADD COLUMN display_name text,
  ADD COLUMN description text,
  ADD COLUMN category text NOT NULL DEFAULT 'chat',
  ADD COLUMN modalities jsonb NOT NULL DEFAULT '["text"]'::jsonb,
  ADD COLUMN caps jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN context_window integer,
  ADD COLUMN max_output_tokens integer,
  ADD COLUMN input_price_per_million numeric(12,6),
  ADD COLUMN output_price_per_million numeric(12,6),
  ADD COLUMN priority integer NOT NULL DEFAULT 100,
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.ai_models
  ADD CONSTRAINT ai_models_category_check CHECK (category IN
    ('chat','reasoning','coding','image','audio','embedding','moderation','realtime')),
  ADD CONSTRAINT ai_models_status_check CHECK (status IN
    ('active','preview','experimental','deprecated','disabled'));

UPDATE public.ai_models m
   SET provider_id = (SELECT id FROM public.ai_providers WHERE code = 'lovable-gateway'),
       gateway_code = CASE WHEN m.model_id LIKE '%/%' THEN m.model_id
                           ELSE lower(COALESCE(m.provider,'lovable')) || '/' || m.model_id END,
       display_name = COALESCE(m.name, m.model_id),
       category = CASE WHEN 'image-generation' = ANY(m.capabilities) THEN 'image' ELSE 'chat' END,
       caps = to_jsonb(m.capabilities)
 WHERE provider_id IS NULL;

ALTER TABLE public.ai_models DROP COLUMN api_key_secret;

CREATE UNIQUE INDEX ai_models_gateway_code_uq ON public.ai_models(gateway_code) WHERE gateway_code IS NOT NULL;
CREATE UNIQUE INDEX ai_models_provider_model_uq ON public.ai_models(provider_id, model_id) WHERE provider_id IS NOT NULL;
CREATE UNIQUE INDEX ai_models_one_default_per_provider ON public.ai_models(provider_id) WHERE is_default = true;

CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  model_id uuid REFERENCES public.ai_models(id) ON DELETE SET NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost numeric(14,6) NOT NULL DEFAULT 0,
  latency_ms integer,
  status text NOT NULL DEFAULT 'ok',
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own usage" ON public.ai_usage_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "users insert own usage" ON public.ai_usage_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE INDEX ai_usage_logs_user_created ON public.ai_usage_logs(user_id, created_at DESC);
CREATE INDEX ai_usage_logs_model_created ON public.ai_usage_logs(model_id, created_at DESC);

CREATE TABLE public.user_ai_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_token_cap integer,
  monthly_request_cap integer,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ai_limits TO authenticated;
GRANT ALL ON public.user_ai_limits TO service_role;
ALTER TABLE public.user_ai_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own limits" ON public.user_ai_limits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "owners manage limits" ON public.user_ai_limits
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'owner'::app_role));
CREATE TRIGGER user_ai_limits_set_updated_at BEFORE UPDATE ON public.user_ai_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed Lovable AI catalog
INSERT INTO public.ai_models
  (provider_id, provider, model_id, gateway_code, name, display_name, description, category, modalities, caps, capabilities, status, is_enabled, priority)
SELECT p.id, 'Lovable AI Gateway', m.model_id, m.gateway_code, m.display_name, m.display_name, m.description, m.category,
       m.modalities::jsonb, m.caps::jsonb, ARRAY[]::text[], 'active', true, m.priority
FROM public.ai_providers p,
(VALUES
  ('google/gemini-3-flash-preview', 'google/gemini-3-flash-preview', 'Gemini 3 Flash (Preview)', 'Fast default model, multimodal.', 'chat', '["text","image","audio","video"]', '{"tools":true,"vision":true,"streaming":true}', 10),
  ('google/gemini-3.1-flash-lite', 'google/gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite', 'Cost-efficient high-volume chat.', 'chat', '["text","image"]', '{"tools":true,"streaming":true}', 20),
  ('google/gemini-3.5-flash', 'google/gemini-3.5-flash', 'Gemini 3.5 Flash', 'Efficient coding + agentic workflows.', 'chat', '["text","image","audio","video"]', '{"tools":true,"vision":true,"streaming":true}', 15),
  ('google/gemini-3.1-pro-preview', 'google/gemini-3.1-pro-preview', 'Gemini 3.1 Pro (Preview)', 'Next-gen reasoning.', 'reasoning', '["text","image","audio","video"]', '{"tools":true,"vision":true,"reasoning":true,"streaming":true}', 30),
  ('google/gemini-2.5-flash', 'google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'Balanced Gemini.', 'chat', '["text","image","audio","video"]', '{"tools":true,"vision":true,"streaming":true}', 45),
  ('google/gemini-2.5-flash-lite', 'google/gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'Cheapest/fastest Gemini.', 'chat', '["text"]', '{"streaming":true}', 50),
  ('google/gemini-3-pro-image', 'google/gemini-3-pro-image', 'Gemini 3 Pro Image', 'High-quality image generation.', 'image', '["text","image"]', '{"image_generation":true}', 60),
  ('google/gemini-3.1-flash-image', 'google/gemini-3.1-flash-image', 'Gemini 3.1 Flash Image', 'Fast image generation/editing.', 'image', '["text","image"]', '{"image_generation":true,"image_editing":true}', 65),
  ('openai/gpt-5', 'openai/gpt-5', 'GPT-5', 'Powerful all-rounder.', 'reasoning', '["text","image"]', '{"tools":true,"vision":true,"streaming":true,"fast_mode":true}', 80),
  ('openai/gpt-5-nano', 'openai/gpt-5-nano', 'GPT-5 Nano', 'Fast, low-cost.', 'chat', '["text","image"]', '{"tools":true,"streaming":true}', 90),
  ('openai/gpt-5.2', 'openai/gpt-5.2', 'GPT-5.2', 'Enhanced reasoning.', 'reasoning', '["text","image"]', '{"tools":true,"reasoning":true,"streaming":true,"fast_mode":true}', 95),
  ('openai/gpt-5.4', 'openai/gpt-5.4', 'GPT-5.4', 'Advanced reasoning + code.', 'reasoning', '["text","image"]', '{"tools":true,"reasoning":true,"streaming":true,"fast_mode":true}', 100),
  ('openai/gpt-5.4-mini', 'openai/gpt-5.4-mini', 'GPT-5.4 Mini', 'Balanced reasoning + cost.', 'chat', '["text","image"]', '{"tools":true,"streaming":true,"fast_mode":true}', 105),
  ('openai/gpt-5.4-nano', 'openai/gpt-5.4-nano', 'GPT-5.4 Nano', 'Fastest/cheapest GPT-5.4.', 'chat', '["text","image"]', '{"tools":true,"streaming":true}', 110),
  ('openai/gpt-5.4-pro', 'openai/gpt-5.4-pro', 'GPT-5.4 Pro', 'Premium reasoning.', 'reasoning', '["text","image"]', '{"tools":true,"reasoning":true,"streaming":true}', 115),
  ('openai/gpt-5.5', 'openai/gpt-5.5', 'GPT-5.5', 'Most capable OpenAI.', 'reasoning', '["text","image"]', '{"tools":true,"reasoning":true,"streaming":true,"fast_mode":true}', 120),
  ('openai/gpt-5.5-pro', 'openai/gpt-5.5-pro', 'GPT-5.5 Pro', 'Premium GPT-5.5.', 'reasoning', '["text","image"]', '{"tools":true,"reasoning":true,"streaming":true}', 125)
) AS m(model_id, gateway_code, display_name, description, category, modalities, caps, priority)
WHERE p.code = 'lovable-gateway'
  AND NOT EXISTS (SELECT 1 FROM public.ai_models am WHERE am.gateway_code = m.gateway_code);
