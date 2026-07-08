
# خطة بناء "مركز التحكم الشامل" — نسخة كاملة

## لماذا هذه الخطة؟
طلباتك السابقة ضخمة (Docker, Python agents, Rust, Java, Cloudflare, Keycloak…) — هذه بنية **سيرفر خارجي** لا يمكن تشغيلها داخل مشروع Lovable (Frontend + Lovable Cloud فقط). ما يمكنني بناؤه هنا هو **الواجهة الكاملة (Command Center UI)** جاهزة للربط لاحقاً بسيرفرك الخاص عبر API.

حالياً موجود فقط: الصفحة الرئيسية `/` + صفحة `/agents`. كل الروابط الأخرى في الـ Sidebar (14 رابط) تعطي 404. سأبنيها كلها.

## ما سيُبنى (14 صفحة كاملة + منطق حي)

### 1. الصفحات المفقودة (كل رابط في السايدبار)
```text
/sites              → إدارة 127 موقع (جدول + بحث + حالة + CPU/RAM لكل موقع + أزرار)
/databases          → قواعد البيانات (Postgres/MySQL/Mongo + حجم + اتصالات)
/performance        → مراقبة الأداء (رسوم Recharts حية: CPU/RAM/RPS/Latency)
/storage            → ملفات التخزين السحابي (شجرة مجلدات + رفع/حذف)
/folders            → المجلدات العامة المشتركة
/security           → مركز الحماية (WAF + Firewall + شهادات SSL)
/security/attempts  → محاولات الاختراق (خريطة IPs + سجل + حظر)
/security/api-keys  → مفاتيح API (إنشاء/إبطال/نطاقات)
/ai-command         → AI Command Center (شات مع الذكاء + أوامر صوتية)
/settings           → إعدادات النظام (ثيم، لغة، تنبيهات، تكاملات)
/backups            → النسخ الاحتياطي (جدول + جدولة + استعادة بنقرة)
```

### 2. تطوير صفحة `/agents` الحالية
- إضافة **مودال جدولة** (تغيير interval من الواجهة)
- إضافة **مودال إعدادات** لكل وكيل (thresholds, cooldown)
- إضافة **صفحة تفاصيل الوكيل** `/agents/$agentId` (تاريخ التنفيذ + سجل مفصل + مخطط أدائه)

### 3. تحسينات على الصفحة الرئيسية `/`
- إضافة **بطاقة "AI Command"** سريعة
- إضافة **خريطة العالم** لتوزيع المواقع والزوار
- إضافة **مؤشر صحة النظام** (Health Score)

### 4. مكونات مشتركة جديدة
- `DataTable` قابل لإعادة الاستخدام (بحث + فرز + ترقيم)
- `ConfirmDialog` للعمليات الحساسة (حذف/إيقاف)
- `LiveMetric` بطاقة رقم يتحدث لحظياً
- `WorldMap` (SVG) لتوزيع IPs جغرافياً

## القرارات التقنية

- **Frontend فقط** — كل البيانات mock تفاعلية (تتحدث كل ثانية) لأن السيرفر الحقيقي (Python/Rust/Docker) سيُبنى خارج Lovable
- **جاهز للربط**: كل صفحة تستخدم layer واحد `src/lib/api.ts` — تغيّر URL واحد فقط لاحقاً لتصبح حقيقية
- **الحفاظ على التصميم الحالي**: نفس ثيم النيون (cyan/violet/rose)، RTL عربي، Cairo/Tajawal
- **نفس بنية الملفات**: TanStack Router file-based، كل صفحة `head()` خاصة بها (SEO)

## ما لن يُبنى الآن (تحتاج سيرفر خارجي)
- Docker/docker-compose، Python agents، Rust engine، Prometheus، Grafana، Qdrant، Keycloak، Cloudflare API
- ← كل هذا يُنشر على VPS خاص بك، والواجهة هنا ستستدعيه عبر REST

## بنية الملفات الجديدة
```text
src/routes/
  sites.tsx              settings.tsx
  databases.tsx          backups.tsx
  performance.tsx        agents.$agentId.tsx (تفاصيل)
  storage.tsx
  folders.tsx
  security.tsx           ai-command.tsx
  security.attempts.tsx
  security.api-keys.tsx

src/components/dashboard/
  DataTable.tsx      ConfirmDialog.tsx
  LiveMetric.tsx     WorldMap.tsx
  AgentScheduleModal.tsx

src/lib/
  api.ts             (طبقة تجريدية جاهزة للربط)
  mock-data.ts       (بيانات وهمية تفاعلية)
```

## خطوات التنفيذ
1. طبقة البيانات المشتركة (`api.ts` + `mock-data.ts` + المكونات المشتركة)
2. الصفحات الأساسية دفعة واحدة (Sites, Databases, Storage, Folders, Performance)
3. مركز الحماية بصفحاته الثلاث
4. AI Command Center + Settings + Backups
5. صفحة تفاصيل الوكيل + مودالات الجدولة
6. تحسينات الصفحة الرئيسية
7. فحص نهائي: كل رابط في السايدبار يعمل، لا 404، تصميم متسق

---

**بعد الموافقة سأنفّذ كل ما سبق دفعة واحدة دون توقف.** هل أبدأ؟
