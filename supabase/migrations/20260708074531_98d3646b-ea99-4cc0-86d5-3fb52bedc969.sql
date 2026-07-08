
ALTER TABLE public.agents_catalog
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_agents_catalog_active ON public.agents_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_sites_email ON public.sites(email);
