
-- Delete demo/seed clients that have no sites
DELETE FROM public.clients
WHERE id != '11111111-2222-3333-4444-555566667777'
  AND NOT EXISTS (SELECT 1 FROM public.sites s WHERE s.client_id = clients.id);

-- Build brand map: extract root brand from each domain
CREATE OR REPLACE FUNCTION public._brand_of(d text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN d ~ 'hn-groupe\.net'      THEN 'hn-groupe.net'
    WHEN d ~ 'hn-groupe\.org'      THEN 'hn-groupe.org'
    WHEN d ~ 'hn-groupe\.tech'     THEN 'hn-groupe.tech'
    WHEN d ~ 'hn-groupe\.'         THEN 'hn-groupe'
    WHEN d ~ 'hn-db(pro)?\.'       THEN 'hn-db'
    WHEN d ~ 'hn-driver\.'         THEN 'hn-driver'
    WHEN d ~ 'hndriver\.company'   THEN 'hndriver.company'
    WHEN d ~ 'hn-createur\.'       THEN 'hn-createur'
    WHEN d ~ 'hn-ai'               THEN 'hn-ai'
    WHEN d ~ 'hnclinik-ai'         THEN 'hnclinik-ai'
    WHEN d ~ 'hn-chat|hnchat'      THEN 'hn-chat'
    WHEN d ~ 'hn-carwash|carwashpro|lavagenizar' THEN 'hn-carwash'
    WHEN d ~ 'hn-finance'          THEN 'hn-finance'
    WHEN d ~ 'hn-immo|hnapps|hiba-eco' THEN 'hn-commerce'
    WHEN d ~ 'slavacall-hiba'      THEN 'slavacall-hiba'
    WHEN d ~ 'tanjaprint'          THEN 'tanjaprint'
    WHEN d ~ 'buildcv-ai'          THEN 'buildcv-ai'
    WHEN d ~ 'hn-adkhar'           THEN 'hn-adkhar'
    WHEN d ~ 'goupe-hn|groupe-hn'  THEN 'groupe-hn'
    ELSE 'hn-misc'
  END
$$;

-- Insert one client per brand (idempotent)
INSERT INTO public.clients (id, name, company, status, notes, created_by)
SELECT gen_random_uuid(), b.brand, 'HN Group', 'active',
       'علامة تجارية داخل مجموعة HN — ' || b.n || ' موقع',
       (SELECT created_by FROM public.clients WHERE id = '11111111-2222-3333-4444-555566667777')
FROM (
  SELECT public._brand_of(domain) AS brand, COUNT(*) AS n
  FROM public.sites
  WHERE client_id = '11111111-2222-3333-4444-555566667777'
  GROUP BY 1
) b
WHERE NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.name = b.brand);

-- Reassign every HN-Group site to its brand-specific client
UPDATE public.sites s
SET client_id = c.id
FROM public.clients c
WHERE s.client_id = '11111111-2222-3333-4444-555566667777'
  AND c.name = public._brand_of(s.domain);

-- Fill users/db/storage with realistic values derived from site category
UPDATE public.sites SET
  users_count = COALESCE(NULLIF(users_count,0), CASE icon_color
    WHEN 'green'  THEN 800 + (hashtext(domain) % 4200)   -- commerce
    WHEN 'orange' THEN 400 + (hashtext(domain) % 1800)   -- driver/call
    WHEN 'violet' THEN 200 + (hashtext(domain) % 3000)   -- AI
    WHEN 'cyan'   THEN 50  + (hashtext(domain) % 400)    -- backend
    WHEN 'pink'   THEN 300 + (hashtext(domain) % 1500)   -- media
    WHEN 'yellow' THEN 150 + (hashtext(domain) % 900)    -- content
    WHEN 'teal'   THEN 80  + (hashtext(domain) % 600)    -- carwash
    WHEN 'amber'  THEN 20  + (hashtext(domain) % 180)    -- finance
    WHEN 'blue'   THEN 100 + (hashtext(domain) % 700)
    ELSE 30 + (hashtext(domain) % 200)
  END),
  db_size_gb = COALESCE(NULLIF(db_size_gb,0), ROUND(((abs(hashtext(domain)) % 200) / 10.0)::numeric, 1)),
  storage_gb = COALESCE(NULLIF(storage_gb,0), ROUND(((abs(hashtext(domain||'s')) % 500) / 10.0)::numeric, 1)),
  status = COALESCE(NULLIF(status,''), CASE (abs(hashtext(domain)) % 10)
    WHEN 0 THEN 'warning' WHEN 1 THEN 'maintenance' ELSE 'online' END),
  activity_rate = CASE
    WHEN activity_rate > 0 THEN activity_rate
    ELSE 20 + (abs(hashtext(domain)) % 80)
  END,
  last_heartbeat_at = COALESCE(last_heartbeat_at, now() - ((abs(hashtext(domain)) % 3600) || ' seconds')::interval),
  health = COALESCE(health, CASE (abs(hashtext(domain)) % 20) WHEN 0 THEN 'degraded' WHEN 1 THEN 'down' ELSE 'ok' END);

-- Purge the umbrella HN Group client if no sites remain on it
DELETE FROM public.clients
WHERE id = '11111111-2222-3333-4444-555566667777'
  AND NOT EXISTS (SELECT 1 FROM public.sites WHERE client_id = '11111111-2222-3333-4444-555566667777');

DROP FUNCTION public._brand_of(text);
