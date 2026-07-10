
-- Add site identity + integration fields
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS site_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS services jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS integration_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS activity_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS db_name text,
  ADD COLUMN IF NOT EXISTS storage_backend text;

-- Map icon_color category -> letter prefix
CREATE OR REPLACE FUNCTION public._site_code_prefix(color text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE color
    WHEN 'cyan' THEN 'B'
    WHEN 'violet' THEN 'A'
    WHEN 'orange' THEN 'D'
    WHEN 'green' THEN 'C'
    WHEN 'pink' THEN 'M'
    WHEN 'yellow' THEN 'E'
    WHEN 'teal' THEN 'W'
    WHEN 'amber' THEN 'F'
    WHEN 'blue' THEN 'G'
    ELSE 'S'
  END;
$$;

-- Backfill site_code for existing rows: <letter><6-digit sequence>
WITH ordered AS (
  SELECT id, icon_color,
         ROW_NUMBER() OVER (PARTITION BY icon_color ORDER BY created_at, id) AS rn
  FROM public.sites
  WHERE site_code IS NULL
)
UPDATE public.sites s
SET site_code = public._site_code_prefix(o.icon_color) || LPAD(o.rn::text, 6, '0')
FROM ordered o
WHERE s.id = o.id;

-- Trigger: auto-assign site_code on insert
CREATE OR REPLACE FUNCTION public.assign_site_code()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  prefix text;
  next_num int;
BEGIN
  IF NEW.site_code IS NOT NULL THEN RETURN NEW; END IF;
  prefix := public._site_code_prefix(COALESCE(NEW.icon_color, 'blue'));
  SELECT COALESCE(MAX((RIGHT(site_code, 6))::int), 0) + 1
    INTO next_num
    FROM public.sites
    WHERE site_code LIKE prefix || '%';
  NEW.site_code := prefix || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_site_code ON public.sites;
CREATE TRIGGER trg_assign_site_code
BEFORE INSERT ON public.sites
FOR EACH ROW EXECUTE FUNCTION public.assign_site_code();

-- Backfill role / services / integration_status / activity from category
UPDATE public.sites SET
  role = COALESCE(role, CASE icon_color
    WHEN 'cyan' THEN 'قاعدة بيانات / API'
    WHEN 'violet' THEN 'ذكاء اصطناعي'
    WHEN 'orange' THEN 'سائقون / اتصال'
    WHEN 'green' THEN 'تجارة إلكترونية'
    WHEN 'pink' THEN 'وسائط / فيديو'
    WHEN 'yellow' THEN 'محتوى / تعليم'
    WHEN 'teal' THEN 'غسيل السيارات'
    WHEN 'amber' THEN 'مالية / عمليات'
    WHEN 'blue' THEN 'نواة المجموعة'
    ELSE 'خدمة عامة' END),
  services = CASE icon_color
    WHEN 'cyan' THEN '["db","api","auth"]'::jsonb
    WHEN 'violet' THEN '["ai","chat","embeddings"]'::jsonb
    WHEN 'orange' THEN '["dispatch","call","tracking"]'::jsonb
    WHEN 'green' THEN '["store","payments","orders"]'::jsonb
    WHEN 'pink' THEN '["video","streaming","media"]'::jsonb
    WHEN 'yellow' THEN '["blog","learn","cv"]'::jsonb
    WHEN 'teal' THEN '["booking","payments"]'::jsonb
    WHEN 'amber' THEN '["finance","invoicing"]'::jsonb
    WHEN 'blue' THEN '["hub","admin","routing"]'::jsonb
    ELSE '[]'::jsonb END,
  integration_status = CASE
    WHEN last_heartbeat_at IS NOT NULL AND last_heartbeat_at > now() - interval '5 minutes' THEN 'connected'
    WHEN api_key_hash IS NOT NULL THEN 'provisioned'
    ELSE 'pending' END,
  activity_rate = CASE
    WHEN last_heartbeat_at IS NOT NULL AND last_heartbeat_at > now() - interval '5 minutes' THEN 100
    WHEN last_heartbeat_at IS NOT NULL AND last_heartbeat_at > now() - interval '1 hour' THEN 60
    WHEN last_heartbeat_at IS NOT NULL AND last_heartbeat_at > now() - interval '1 day' THEN 25
    ELSE 0 END,
  db_name = COALESCE(db_name, 'db_' || regexp_replace(split_part(domain,'.',1), '[^a-z0-9]', '_', 'g')),
  storage_backend = COALESCE(storage_backend, 'lovable-cloud');
