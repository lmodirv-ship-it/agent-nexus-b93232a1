
CREATE TABLE IF NOT EXISTS public.site_categories (
  id smallint PRIMARY KEY,
  name text NOT NULL UNIQUE,
  target_count int NOT NULL DEFAULT 0,
  color text NOT NULL,
  icon text NOT NULL,
  code_prefix char(1) NOT NULL UNIQUE
);
GRANT SELECT ON public.site_categories TO authenticated, anon;
GRANT ALL ON public.site_categories TO service_role;
ALTER TABLE public.site_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read categories" ON public.site_categories;
CREATE POLICY "Everyone can read categories" ON public.site_categories FOR SELECT USING (true);

INSERT INTO public.site_categories (id, name, target_count, color, icon, code_prefix) VALUES
  (1, 'مراكز التحكم',                     20, '#22d3ee', 'Shield',       'X'),
  (2, 'نواة وذكاء',                       30, '#a78bfa', 'Brain',        'N'),
  (3, 'بناء وإبداع',                      12, '#f59e0b', 'Hammer',       'K'),
  (4, 'فيديو واستوديو',                   22, '#ec4899', 'Film',         'V'),
  (5, 'HN Driver — توصيل وسائق',          20, '#fb923c', 'Car',          'R'),
  (6, 'قواعد البيانات HN-DB',             25, '#06b6d4', 'Database',     'Q'),
  (7, 'تطبيقات ودردشة',                   8,  '#8b5cf6', 'MessageSquare','T'),
  (8, 'مالية وعقار وصحة وتجارة',          18, '#10b981', 'Wallet',       'P'),
  (9, 'مغسلة وطباعة وخدمات',              19, '#14b8a6', 'Sparkles',     'H')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, target_count = EXCLUDED.target_count,
  color = EXCLUDED.color, icon = EXCLUDED.icon, code_prefix = EXCLUDED.code_prefix;

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS category_id smallint REFERENCES public.site_categories(id);

UPDATE public.sites SET category_id = CASE
  WHEN domain ~ '^(admin|owner|audit)\.'                                     THEN 1
  WHEN domain ~ 'hub'                                                        THEN 1
  WHEN domain ~ 'hn-ai|hnclinik-ai|buildcv-ai|(^|\.)ai\.'                    THEN 2
  WHEN domain ~ 'hn-groupe|groupe-hn|goupe-hn'                               THEN 2
  WHEN domain ~ '(^|\.)build\.|hn-createur|(^|\.)cv\.|createur'              THEN 3
  WHEN domain ~ '(^|\.)video\.|film|studio'                                  THEN 4
  WHEN domain ~ 'driver|call|slavacall'                                      THEN 5
  WHEN domain ~ 'hn-db|hn-dbpro|(^|\.)api\.|(^|\.)auth\.|(^|\.)ws\.|hn-bd'   THEN 6
  WHEN domain ~ 'hn-chat|hnchat|(^|\.)chat'                                  THEN 7
  WHEN domain ~ 'hn-finance|hn-immo|hnapps|hiba-eco|(^|\.)store\.|stouk|clinik' THEN 8
  ELSE 9
END;

-- Rewrite site_codes: clear first (avoids uniqueness collision with old prefixes),
-- then reassign using the new per-category prefix.
UPDATE public.sites SET site_code = NULL;

WITH ordered AS (
  SELECT s.id, sc.code_prefix,
         ROW_NUMBER() OVER (PARTITION BY s.category_id ORDER BY s.created_at, s.id) AS rn
  FROM public.sites s JOIN public.site_categories sc ON sc.id = s.category_id
)
UPDATE public.sites s
SET site_code = o.code_prefix || LPAD(o.rn::text, 6, '0')
FROM ordered o WHERE s.id = o.id;

-- New inserts derive the prefix from category_id
CREATE OR REPLACE FUNCTION public.assign_site_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE prefix text; next_num int;
BEGIN
  IF NEW.site_code IS NOT NULL THEN RETURN NEW; END IF;
  SELECT code_prefix INTO prefix FROM public.site_categories WHERE id = NEW.category_id;
  IF prefix IS NULL THEN prefix := 'S'; END IF;
  SELECT COALESCE(MAX((RIGHT(site_code, 6))::int), 0) + 1 INTO next_num
    FROM public.sites WHERE site_code LIKE prefix || '%';
  NEW.site_code := prefix || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END; $$;
