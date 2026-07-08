
CREATE TABLE public.agent_site_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents_catalog(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'linked',
  last_sync_at timestamptz,
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, site_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_site_links TO authenticated;
GRANT ALL ON public.agent_site_links TO service_role;

ALTER TABLE public.agent_site_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_links" ON public.agent_site_links
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "staff_write_links" ON public.agent_site_links
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE INDEX idx_asl_agent ON public.agent_site_links(agent_id);
CREATE INDEX idx_asl_site ON public.agent_site_links(site_id);

CREATE TRIGGER trg_asl_updated BEFORE UPDATE ON public.agent_site_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
