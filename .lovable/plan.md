# مراجعة شاملة + خطة الإنجاز النهائي

## الوضع الحالي (بعد كل الطلبات السابقة)

**الواجهة (كامل ✅):** 16 صفحة جاهزة — الرئيسية، المواقع، قواعد البيانات، الأداء، التخزين، المجلدات، الحماية (+attempts +api-keys)، الوكلاء (+تفاصيل)، AI Command، الإعدادات، النسخ الاحتياطي، سجل التعديلات، شبكة الخدمات.

**قاعدة البيانات (موجود جزئياً):** 10 جداول — `sites`, `databases_registry`, `backups`, `storage_folders`, `security_events`, `notifications`, `activity_log`, `agents_catalog`, `agent_sessions`, `agent_tasks` — كلها بسياسات `USING (true)` مفتوحة.

**ناقص كلياً ❌:**
- لا يوجد **نظام دخول** (auth) للمالك.
- لا يوجد **جدول أدوار** (owner/admin/agent) — كل الجداول مفتوحة للعامة.
- لا يوجد **جدول عملاء** (clients) ولا ربط بينهم وبين المواقع.
- كل الصفحات تقرأ من `src/lib/mock-data.ts` بدل قاعدة البيانات الفعلية.
- لا يوجد جداول `services`, `service_dependencies`, `service_call_logs`, `api_keys`, `audit_log`.

---

## خطة الإنجاز (3 مراحل — تُنفَّذ متتالية دون توقف)

### المرحلة 1 — قاعدة البيانات + المصادقة + الأدوار

**Migration واحدة تُنشئ:**

```text
public.profiles          (id → auth.users, display_name, avatar_url, phone)
public.app_role          ENUM ('owner','admin','agent','viewer')
public.user_roles        (user_id, role) + has_role() security definer
public.clients           (id, name, email, phone, company, status, notes)
public.services          (site_id, name, endpoint_url, health, version, rate_limit, is_public)
public.service_dependencies  (consumer_site_id, provider_service_id)
public.service_call_logs (provider_service_id, endpoint, response_code, response_time_ms, status)
public.api_keys          (label, prefix, hashed_secret, scopes[], active, created_by)
public.audit_log         (actor_id, action, target, details, ip, created_at)
public.attack_attempts   (ip, country, kind, target, blocked)
```

- إضافة `client_id` إلى `sites` (ربط الموقع بعميله).
- إحكام RLS على **كل** الجداول العشرة القديمة + الجديدة:
  - `owner`/`admin` → صلاحية كاملة.
  - `agent` → قراءة + كتابة على السجلات فقط.
  - `viewer` → قراءة فقط.
- Trigger `handle_new_user` يُنشئ profile + role تلقائياً.
- أول مستخدم يُسجّل يحصل على دور `owner` تلقائياً.
- كل جدول جديد يحصل على GRANT statements صحيحة.

**نظام الدخول:**
- تفعيل Email/Password + Google في Lovable Cloud.
- صفحة `/auth` عامة (تبويبان: دخول / تسجيل).
- طبقة `_authenticated/route.tsx` (يديرها التكامل) تحمي كل الصفحات ما عدا `/auth`.
- نقل كل الصفحات الحالية تحت `_authenticated/`.
- زر تسجيل خروج + قائمة مستخدم في `TopBar`.

### المرحلة 2 — ربط الواجهة بالقاعدة الحقيقية

- إنشاء `src/lib/data.functions.ts` — server functions محمية بـ `requireSupabaseAuth` لكل قراءة/كتابة (sites, clients, databases, backups, folders, services, agents, audit, security).
- استبدال `mock-data.ts` بـ `useSuspenseQuery` + loaders في كل صفحة.
- إبقاء نفس التصميم والـ UX بالحرف — فقط تبديل مصدر البيانات.
- إضافة عمليات CRUD حقيقية (إضافة موقع، تعديل، حذف، تشغيل نسخة احتياطية، إبطال مفتاح، حظر IP…).
- كل عملية تكتب سطراً في `audit_log` تلقائياً عبر trigger.

### المرحلة 3 — صفحة "إدارة العملاء" + Seed + إصلاحات

- صفحة جديدة `/_authenticated/clients` (سايدبار جديد): جدول عملاء + بحث + إضافة/تعديل/حذف + عدّاد المواقع لكل عميل.
- ربط `/sites` بجدول العملاء (فلترة حسب العميل، إسناد موقع لعميل).
- Seed script (migration ثانية) تعبّئ ~15 عميل و30 موقع تجريبي و10 خدمات لكي تكون اللوحة "حية" منذ أول دخول.
- إصلاح خطأ hydration في `ActivityFeed` (تحويل `toLocaleString` إلى `useEffect` بعد mount).
- تحديث `head()` في `__root.tsx` بعنوان ووصف حقيقيين للمنصة.

---

## القرارات التقنية (مُتخذة تلقائياً حسب البست براكتس)

- **الأدوار:** جدول منفصل `user_roles` + `has_role()` security definer (يمنع privilege escalation و infinite recursion).
- **الخادم:** كل عمليات القراءة/الكتابة عبر `createServerFn` + `requireSupabaseAuth` (لا queries مباشرة من المتصفح للجداول الحساسة).
- **OAuth:** Google عبر `lovable.auth.signInWithOAuth` (المسار المُوصى به).
- **التصميم:** يبقى كما هو — نفس ثيم النيون، RTL، Cairo/Tajawal.
- **صلاحيات:** أول مستخدم = owner، الباقي = viewer افتراضياً (owner يرقّيهم من `/settings`).

---

## ما لن يُبنى (يحتاج سيرفر خارجي)
Python Orchestrator، Rust Engine، Docker-in-Docker، Prometheus/Grafana، Cloudflare API، JWT SSO الفعلي بين نطاقات مختلفة — هذه بنية VPS منفصلة، والواجهة هنا ستستدعيها لاحقاً عبر REST من `services` table (المكان جاهز).

---

**بعد الموافقة سأنفّذ المراحل الثلاث دفعة واحدة، ابتداءً بالـ migration ثم Auth ثم ربط الصفحات، دون توقف بينها.**
