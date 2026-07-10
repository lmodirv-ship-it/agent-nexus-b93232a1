CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.sites_provisioning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  api_key text NOT NULL,
  webhook_secret text NOT NULL,
  exported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites_provisioning TO authenticated;
GRANT ALL ON public.sites_provisioning TO service_role;

ALTER TABLE public.sites_provisioning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read provisioning" ON public.sites_provisioning
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'owner'::public.app_role) OR private.has_role(auth.uid(),'admin'::public.app_role));

CREATE POLICY "owners write provisioning" ON public.sites_provisioning
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'owner'::public.app_role) OR private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'owner'::public.app_role) OR private.has_role(auth.uid(),'admin'::public.app_role));

INSERT INTO public.clients (id, name, company, status, notes)
VALUES ('11111111-2222-3333-4444-555566667777','HN Group','HN Group','active','مجموعة hn-group الرسمية - قلب الشبكة')
ON CONFLICT (id) DO NOTHING;

DELETE FROM public.sites WHERE domain LIKE 'site%.hn.com';

DO $$
DECLARE
  rec record;
  new_site_id uuid;
  raw_key text;
  raw_secret text;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
('adkhar.hn-groupe.net','Content','yellow'),
('admin.hn-db.fun','Backend/DB','cyan'),
('admin.hn-driver.com','Backend/DB','cyan'),
('admin.hndriver.company','Backend/DB','cyan'),
('ai.hn-db.fun','Backend/DB','cyan'),
('ai.hn-groupe.org','AI','violet'),
('api.hn-db.fun','Backend/DB','cyan'),
('api.hn-dbpro.com','Backend/DB','cyan'),
('api.slavacall-hiba.online','Backend/DB','cyan'),
('audit.hn-groupe.net','Finance/Ops','amber'),
('auth.hn-db.fun','Backend/DB','cyan'),
('blog.hn-groupe.org','Content','yellow'),
('build.hn-createur.com','Core','blue'),
('build.hn-groupe.net','Core','blue'),
('buildcv-ai.online','AI','violet'),
('call.hndriver.company','Driver/Call','orange'),
('callcentre.hn-driver.com','Driver/Call','orange'),
('carwashpro.com','Carwash','teal'),
('cinema.hn-groupe.org','Media','pink'),
('client.hn-driver.com','Driver/Call','orange'),
('client.hndriver.company','Driver/Call','orange'),
('cloud.hn-createur.com','Core','blue'),
('createur.hn-groupe.net','Core','blue'),
('cv.hn-groupe.org','Content','yellow'),
('db.hn-createur.com','Backend/DB','cyan'),
('delivery.hn-driver.com','Driver/Call','orange'),
('delivery.hndriver.company','Driver/Call','orange'),
('driver.hn-driver.com','Driver/Call','orange'),
('driver.hndriver.company','Driver/Call','orange'),
('facturation.hn-createur.com','Finance/Ops','amber'),
('files.hn-db.fun','Backend/DB','cyan'),
('film.hn-createur.com','Media','pink'),
('film.hn-groupe.net','Media','pink'),
('generatin.hn-groupe.org','AI','violet'),
('goupe-hn.com','Core','blue'),
('goupe-hn.fun','Core','blue'),
('goupe-hn.online','Core','blue'),
('goupe-hn.site','Core','blue'),
('groupe-hn.com','Core','blue'),
('hiba-eco.com','Commerce','green'),
('hn-adkhar.life','Content','yellow'),
('hn-ai.online','AI','violet'),
('hn-ai.pro','AI','violet'),
('hn-ai.site','AI','violet'),
('hn-ai.store','AI','violet'),
('hn-bd.online','Backend/DB','cyan'),
('hn-carwash.online','Carwash','teal'),
('hn-carwash.site','Carwash','teal'),
('hn-chat.com','AI','violet'),
('hn-createur.com','Core','blue'),
('hn-db.fun','Backend/DB','cyan'),
('hn-db.hn-groupe.net','Backend/DB','cyan'),
('hn-dbpro.com','Backend/DB','cyan'),
('hn-driver.com','Driver/Call','orange'),
('hn-driver.online','Driver/Call','orange'),
('hn-driver.site','Driver/Call','orange'),
('hn-finance.online','Finance/Ops','amber'),
('hn-finance.site','Finance/Ops','amber'),
('hn-groupe.fun','Core','blue'),
('hn-groupe.net','Core','blue'),
('hn-groupe.org','Core','blue'),
('hn-groupe.pro','Core','blue'),
('hn-groupe.site','Core','blue'),
('hn-groupe.tech','Core','blue'),
('hn-immo.com','Commerce','green'),
('hnapps.store','Commerce','green'),
('hnchat.net','AI','violet'),
('hnclinik-ai.com','AI','violet'),
('hnclinik.hn-groupe.net','Finance/Ops','amber'),
('hndriver.company','Driver/Call','orange'),
('hndriver.hn-driver.com','Driver/Call','orange'),
('imm.hn-groupe.net','Core','blue'),
('lavagenizar.com','Carwash','teal'),
('learn.hn-createur.com','Content','yellow'),
('learn.hn-groupe.tech','Content','yellow'),
('nawat.hn-groupe.net','Content','yellow'),
('owner.hn-db.fun','Backend/DB','cyan'),
('rfp.hn-groupe.net','Finance/Ops','amber'),
('ride.hn-driver.com','Driver/Call','orange'),
('rule.hn-db.fun','Backend/DB','cyan'),
('search.hn-groupe.net','Core','blue'),
('site.hn-groupe.tech','Core','blue'),
('slavacall-hiba.com','Driver/Call','orange'),
('slavacall-hiba.online','Driver/Call','orange'),
('status.hn-db.fun','Backend/DB','cyan'),
('store.hn-groupe.net','Commerce','green'),
('stouk.hn-driver.com','Driver/Call','orange'),
('studio.hn-createur.com','Media','pink'),
('studio.hn-groupe.org','Media','pink'),
('super.hn-driver.com','Backend/DB','cyan'),
('tanjaprint.com','Media','pink'),
('tanjaprint.online','Media','pink'),
('tender.hn-groupe.org','Finance/Ops','amber'),
('users.hn-db.fun','Backend/DB','cyan'),
('video.hn-createur.com','Media','pink'),
('video.hn-groupe.net','Media','pink'),
('video.hn-groupe.org','Media','pink'),
('video.hn-groupe.tech','Media','pink'),
('ws.hn-db.fun','Backend/DB','cyan')
    ) AS t(domain, category, color)
  LOOP
    IF EXISTS (SELECT 1 FROM public.sites WHERE domain = rec.domain) THEN
      UPDATE public.sites
        SET client_id = '11111111-2222-3333-4444-555566667777',
            icon_color = rec.color
        WHERE domain = rec.domain;
      CONTINUE;
    END IF;

    raw_key := 'hn_' || encode(gen_random_bytes(24), 'hex');
    raw_secret := encode(gen_random_bytes(32), 'hex');

    INSERT INTO public.sites (
      domain, client_id, status, health, icon_color, email,
      api_key_hash, webhook_secret
    ) VALUES (
      rec.domain,
      '11111111-2222-3333-4444-555566667777',
      'unknown','unknown', rec.color,
      'ops@' || rec.domain,
      encode(digest(raw_key,'sha256'),'hex'),
      raw_secret
    )
    RETURNING id INTO new_site_id;

    INSERT INTO public.sites_provisioning (site_id, api_key, webhook_secret)
    VALUES (new_site_id, raw_key, raw_secret);
  END LOOP;
END $$;