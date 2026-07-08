
-- Daemon / specialized agents (idempotent)
INSERT INTO public.agents_catalog (slug, name_ar, role, description, emoji, frequency) VALUES
('uptime-monitor','وكيل مراقبة التشغيل','monitoring','يراقب حالة المواقع والخدمات على مدار الساعة','📡','1m'),
('performance-optimizer','وكيل تحسين الأداء','monitoring','يحلل ويحسّن أداء المواقع تلقائياً','⚡','5m'),
('waf-agent','وكيل جدار الحماية WAF','security','يفحص ويصد الهجمات على مستوى التطبيق','🧱','realtime'),
('security-sentinel','الحارس الأمني','security','رصد التهديدات والاستجابة للحوادث','🛡️','realtime'),
('cloudflare-blocker','وكيل حظر Cloudflare','security','يحظر عناوين IP المشبوهة عبر Cloudflare','🚫','realtime'),
('ai-debugger','وكيل التصحيح الذكي','debugging','يكتشف الأخطاء ويقترح الإصلاحات تلقائياً','🐞','on-demand'),
('auto-scaler','وكيل التوسع التلقائي','infrastructure','يوسّع الموارد حسب الحمل','📈','1m'),
('core-backup','وكيل النسخ الاحتياطي المركزي','infrastructure','ينفذ النسخ الاحتياطية للأنظمة الحرجة','💾','hourly'),
('mesh-agent','وكيل الشبكة Mesh','mesh','ينسق الاتصال بين الوكلاء عبر الشبكة','🕸️','realtime'),
('supervisor','الوكيل المشرف','supervisor','يراقب أداء وصحة باقي الوكلاء','👁️','1m'),
('site-agent','وكيل الموقع','site-specific','وكيل مخصص لكل موقع لإدارته','🌐','5m'),
('site-orchestrator','منسق المواقع','site-specific','ينسق عمل وكلاء المواقع المتعددة','🎼','5m'),
('self-coordinating','وكيل التنسيق الذاتي','coordination','يتجاوز الأعطال تلقائياً بين الوكلاء','🔄','realtime'),
('service-discovery','وكيل اكتشاف الخدمات','infrastructure','يكتشف الخدمات الجديدة ويسجلها','🔎','5m'),
('weekly-report','وكيل التقارير الأسبوعية','reporting','يولّد تقارير أسبوعية شاملة','📊','weekly'),
('core-hub','مركز تنسيق الوكلاء','coordination','الذاكرة والتنسيق المركزي لجميع الوكلاء','🧠','realtime')
ON CONFLICT (slug) DO NOTHING;

-- Hierarchical structure: 10 GMs
INSERT INTO public.agents_catalog (slug, name_ar, role, description, emoji, frequency)
SELECT
  'gm-' || lpad(i::text, 2, '0'),
  'المدير العام رقم ' || i,
  'general-manager',
  'تحليل استراتيجي للمشاريع الكبيرة - قطاع ' || i,
  '👔',
  'on-demand'
FROM generate_series(1, 10) i
ON CONFLICT (slug) DO NOTHING;

-- 500 Managers
INSERT INTO public.agents_catalog (slug, name_ar, role, description, emoji, frequency)
SELECT
  'mgr-' || lpad(i::text, 3, '0'),
  'المدير رقم ' || i,
  'manager',
  'تحليل تفصيلي (مالي/تقني/تسويقي) - وحدة ' || i,
  '📋',
  'on-demand'
FROM generate_series(1, 500) i
ON CONFLICT (slug) DO NOTHING;

-- 1000 Employees
INSERT INTO public.agents_catalog (slug, name_ar, role, description, emoji, frequency)
SELECT
  'emp-' || lpad(i::text, 4, '0'),
  'الموظف رقم ' || i,
  'employee',
  'تنفيذ المهام الفرعية (بحث/تحليل/تنفيذ) - رقم ' || i,
  '👷',
  'on-demand'
FROM generate_series(1, 1000) i
ON CONFLICT (slug) DO NOTHING;
