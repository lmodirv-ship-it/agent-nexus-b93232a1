
-- Sites
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  status text not null default 'online',
  users_count int default 0,
  db_size_gb numeric default 0,
  storage_gb numeric default 0,
  icon_color text default 'cyan',
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.sites to anon, authenticated;
grant all on public.sites to service_role;
alter table public.sites enable row level security;
create policy "public sites all" on public.sites for all using (true) with check (true);

create table public.databases_registry (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  site_id uuid references public.sites(id) on delete set null,
  engine text default 'postgres',
  size_gb numeric default 0,
  status text default 'healthy',
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.databases_registry to anon, authenticated;
grant all on public.databases_registry to service_role;
alter table public.databases_registry enable row level security;
create policy "public db all" on public.databases_registry for all using (true) with check (true);

create table public.storage_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_count int default 0,
  size_gb numeric default 0,
  icon text default 'folder',
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.storage_folders to anon, authenticated;
grant all on public.storage_folders to service_role;
alter table public.storage_folders enable row level security;
create policy "public folders all" on public.storage_folders for all using (true) with check (true);

create table public.backups (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade,
  status text default 'success',
  size_gb numeric default 0,
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.backups to anon, authenticated;
grant all on public.backups to service_role;
alter table public.backups enable row level security;
create policy "public backups all" on public.backups for all using (true) with check (true);

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  severity text default 'info',
  message text,
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.security_events to anon, authenticated;
grant all on public.security_events to service_role;
alter table public.security_events enable row level security;
create policy "public sec all" on public.security_events for all using (true) with check (true);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  severity text default 'info',
  message text,
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.notifications to anon, authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "public notif all" on public.notifications for all using (true) with check (true);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  action text,
  target text,
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.activity_log to anon, authenticated;
grant all on public.activity_log to service_role;
alter table public.activity_log enable row level security;
create policy "public act all" on public.activity_log for all using (true) with check (true);

create table public.agents_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  role text not null,
  description text,
  emoji text,
  frequency text
);
grant select, insert, update, delete on public.agents_catalog to anon, authenticated;
grant all on public.agents_catalog to service_role;
alter table public.agents_catalog enable row level security;
create policy "public cat all" on public.agents_catalog for all using (true) with check (true);

create table public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  goal text not null,
  status text default 'running',
  scale text default 'small',
  current_cycle int default 0,
  total_cycles int default 6,
  result_summary text,
  created_at timestamptz default now(),
  completed_at timestamptz
);
grant select, insert, update, delete on public.agent_sessions to anon, authenticated;
grant all on public.agent_sessions to service_role;
alter table public.agent_sessions enable row level security;
create policy "public sessions all" on public.agent_sessions for all using (true) with check (true);

create table public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.agent_sessions(id) on delete cascade,
  parent_id uuid references public.agent_tasks(id) on delete cascade,
  cycle int default 1,
  level text not null,
  role text not null,
  status text default 'pending',
  input text,
  output text,
  created_at timestamptz default now(),
  completed_at timestamptz
);
grant select, insert, update, delete on public.agent_tasks to anon, authenticated;
grant all on public.agent_tasks to service_role;
alter table public.agent_tasks enable row level security;
create policy "public tasks all" on public.agent_tasks for all using (true) with check (true);

-- Seed data
insert into public.sites (domain, status, users_count, db_size_gb, storage_gb, icon_color) values
  ('souk-hn.com', 'online', 12421, 3.2, 1800, 'cyan'),
  ('islamiat.net', 'online', 7821, 1.3, 780, 'cyan'),
  ('adkar-app.com', 'online', 8752, 1.7, 890, 'emerald'),
  ('news-hn.com', 'warning', 5421, 2.8, 1500, 'amber'),
  ('tv-maroc.com', 'online', 6245, 2.1, 1200, 'violet'),
  ('forum-hn.com', 'online', 3591, 0.95, 650, 'cyan');

insert into public.storage_folders (name, file_count, size_gb, icon) values
  ('images/', 2451, 2700, 'image'),
  ('videos/', 842, 5800, 'video'),
  ('documents/', 1245, 1300, 'file'),
  ('backups/', 312, 2900, 'archive'),
  ('temp/', 124, 320, 'clock');

insert into public.notifications (severity, message) values
  ('warning', 'استخدام التخزين وصل إلى 85% في news-hn.com'),
  ('danger', 'استهلاك CPU مرتفع في قاعدة بيانات forum-hn.com'),
  ('info', 'انتهاء صلاحية شهادة SSL لموقع islamiat.net خلال 5 أيام');

insert into public.activity_log (action, target) values
  ('تم إنشاء نسخة احتياطية شاملة للنظام', 'souk-hn.com'),
  ('تم تسجيل دخول جديد من 192.168.1.101', 'admin'),
  ('تم إضافة موقع جديد', 'tech-hn.com');

insert into public.security_events (kind, severity, message) values
  ('login', 'info', 'تسجيل دخول ناجح'),
  ('breach_attempt', 'warning', 'محاولة اختراق مصدودة'),
  ('api_key', 'info', 'مفتاح API جديد');

insert into public.agents_catalog (slug, name_ar, role, description, emoji, frequency) values
  ('site-monitor', 'مراقب المواقع', 'Site Monitor Agent', 'مراقبة حالة المواقع (Online/Offline) والتنبيه', '🛰️', 'كل 5 دقائق'),
  ('security', 'وكيل الأمن', 'Security Agent', 'فحص الثغرات ومراقبة محاولات الاختراق', '🛡️', 'كل ساعة'),
  ('backup', 'وكيل النسخ الاحتياطي', 'Backup Agent', 'إنشاء نسخ احتياطية تلقائية للمواقع وقواعد البيانات', '💾', 'يومياً'),
  ('performance', 'وكيل الأداء', 'Performance Agent', 'تحليل استهلاك CPU/RAM/Disk وتقديم توصيات', '⚡', 'كل 10 دقائق'),
  ('ai-developer', 'المطور الذكي', 'AI Developer Agent', 'كتابة كود تحسينات تلقائية للموقع', '🤖', 'عند الطلب'),
  ('seo', 'وكيل SEO', 'SEO Agent', 'تحليل محتوى الموقع واقتراح تحسينات لمحركات البحث', '📈', 'أسبوعياً'),
  ('db-optimizer', 'محسن قاعدة البيانات', 'Database Optimizer Agent', 'تحسين استعلامات قاعدة البيانات وفهرستها', '🗄️', 'شهرياً'),
  ('user-behavior', 'محلل سلوك المستخدمين', 'User Behavior Agent', 'تحليل سلوك المستخدمين واقتراح تحسينات', '👥', 'أسبوعياً');
