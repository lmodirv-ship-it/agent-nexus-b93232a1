
-- 1) Extend sites
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS api_key_hash text,
  ADD COLUMN IF NOT EXISTS webhook_url text,
  ADD COLUMN IF NOT EXISTS webhook_secret text,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS health text NOT NULL DEFAULT 'unknown';

-- 2) hub_events
CREATE TABLE IF NOT EXISTS public.hub_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES public.agents_catalog(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','delivered','failed')),
  attempts int NOT NULL DEFAULT 0,
  error text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hub_events_site ON public.hub_events(site_id);
CREATE INDEX IF NOT EXISTS idx_hub_events_status ON public.hub_events(status);
CREATE INDEX IF NOT EXISTS idx_hub_events_created ON public.hub_events(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_events TO authenticated;
GRANT ALL ON public.hub_events TO service_role;
ALTER TABLE public.hub_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_read_hub_events ON public.hub_events FOR SELECT
  TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY staff_write_hub_events ON public.hub_events FOR ALL
  TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE TRIGGER hub_events_updated_at BEFORE UPDATE ON public.hub_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) mail_messages
CREATE TABLE IF NOT EXISTS public.mail_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  from_addr text NOT NULL,
  to_addr text NOT NULL,
  subject text,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mail_site ON public.mail_messages(site_id);
CREATE INDEX IF NOT EXISTS idx_mail_created ON public.mail_messages(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mail_messages TO authenticated;
GRANT ALL ON public.mail_messages TO service_role;
ALTER TABLE public.mail_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_read_mail ON public.mail_messages FOR SELECT
  TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY staff_write_mail ON public.mail_messages FOR ALL
  TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE TRIGGER mail_messages_updated_at BEFORE UPDATE ON public.mail_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Realtime
ALTER TABLE public.hub_events REPLICA IDENTITY FULL;
ALTER TABLE public.mail_messages REPLICA IDENTITY FULL;
ALTER TABLE public.sites REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.hub_events; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.mail_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.sites; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
