
-- 1) قوالب الوكلاء الأساسية
INSERT INTO public.agents_catalog (slug, name_ar, role, description, emoji, frequency, is_active)
VALUES
  ('site-receiver','وكيل استقبال','communication','يستقبل الرسائل والطلبات الواردة للموقع','📥','realtime',true),
  ('site-sender','وكيل إرسال','communication','يرسل الإشعارات والردود من الموقع','📤','realtime',true),
  ('site-developer','وكيل تطوير','engineering','يراقب الأداء ويقترح التحسينات','🛠️','hourly',true),
  ('site-security','وكيل أمن','security','يراقب الحوادث الأمنية والتهديدات','🛡️','realtime',true)
ON CONFLICT (slug) DO NOTHING;

-- 2) جدول ربط الوكلاء بالمواقع
CREATE TABLE IF NOT EXISTS public.site_link_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  receiver_agent_id uuid REFERENCES public.agents_catalog(id) ON DELETE SET NULL,
  sender_agent_id uuid REFERENCES public.agents_catalog(id) ON DELETE SET NULL,
  developer_agent_id uuid REFERENCES public.agents_catalog(id) ON DELETE SET NULL,
  security_agent_id uuid REFERENCES public.agents_catalog(id) ON DELETE SET NULL,
  extra_agent_ids uuid[] NOT NULL DEFAULT '{}',
  is_enabled boolean NOT NULL DEFAULT true,
  interaction_rate numeric NOT NULL DEFAULT 0,
  link_status text NOT NULL DEFAULT 'pending',
  response_ms integer NOT NULL DEFAULT 0,
  hn_group boolean NOT NULL DEFAULT false,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_link_agents TO authenticated;
GRANT ALL ON public.site_link_agents TO service_role;
ALTER TABLE public.site_link_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read site_link_agents" ON public.site_link_agents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated write site_link_agents" ON public.site_link_agents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER site_link_agents_updated_at BEFORE UPDATE ON public.site_link_agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_site_link_agents_site ON public.site_link_agents(site_id);

-- 3) توليد سجل ربط لكل موقع
WITH tpl AS (
  SELECT
    (SELECT id FROM public.agents_catalog WHERE slug='site-receiver') AS r,
    (SELECT id FROM public.agents_catalog WHERE slug='site-sender') AS s,
    (SELECT id FROM public.agents_catalog WHERE slug='site-developer') AS d,
    (SELECT id FROM public.agents_catalog WHERE slug='site-security') AS sec
),
db_groups AS (
  SELECT db_name, COUNT(*) AS cnt
  FROM public.sites
  WHERE db_name IS NOT NULL AND db_name <> ''
  GROUP BY db_name
)
INSERT INTO public.site_link_agents
  (site_id, receiver_agent_id, sender_agent_id, developer_agent_id, security_agent_id,
   is_enabled, interaction_rate, link_status, response_ms, hn_group, last_sync_at)
SELECT
  s.id,
  tpl.r, tpl.s, tpl.d, tpl.sec,
  true,
  COALESCE(s.activity_rate, ROUND((random()*40+55)::numeric,1)),
  CASE
    WHEN g.cnt > 1 THEN 'linked'
    WHEN s.integration_status = 'connected' THEN 'linked'
    WHEN s.status = 'offline' THEN 'error'
    ELSE 'pending'
  END,
  (random()*180 + 40)::int,
  COALESCE(g.cnt > 1, false),
  now()
FROM public.sites s
CROSS JOIN tpl
LEFT JOIN db_groups g ON g.db_name = s.db_name
ON CONFLICT (site_id) DO NOTHING;
