## خطة تحسينات صفحة /clients

### 1) أزرار إجراءات سريعة لكل صف
في عمود "الإجراءات" الحالي نضيف/نوضّح:
- 🔗 **فتح مواقع العميل** → ينتقل إلى `/sites?client={id}` (موجود، سنكبّره ونضيف tooltip واضح).
- ✏️ **تعديل بيانات العميل** → يفتح نفس المودال الحالي.
- 📜 **سجل التغييرات** → زر جديد يفتح Drawer/Modal يعرض تاريخ التعديلات على هذا العميل من جدول `audit_log` (فلترة حسب `target_type='client'` و `target_id=c.id`).
- 🗑️ **حذف** (موجود).

### 2) فرز وتصفية متقدمة
شريط فلاتر جديد فوق الجدول (بجانب البحث والحالة الحالية):
- **فلتر النشاط `activity_rate`**: أزرار سريعة (كل النِسَب / >70% نشط / 30–70% متوسط / <30% خامل) + Slider من 0–100.
- **فلتر الحالة `status`** (موجود، سيبقى).
- **فلتر نطاق التخزين (GB)**: `min`–`max` (0, 1–10, 10–100, +100).
- **فلتر نطاق DB (GB)**: نفس الفكرة.
- **فرز أعمدة**: النقر على رأس العمود يقلب الترتيب (اسم، مواقع، مستخدمون، DB، تخزين، نشاط، آخر ظهور). تحديث `DataTable` ليدعم `sortable` اختياريًا لكل عمود.

### 3) تحديث تلقائي مبني على heartbeat
- استعلام `listClients` موجود ويحسب `last_seen = MAX(last_heartbeat_at)`.
- في الواجهة نستخدم React Query مع `refetchInterval: 15s` + `refetchOnWindowFocus: true` للاستعلام `["clients"]`.
- **مؤشر آخر تحديث** في الهيدر: "آخر تحديث: منذ X ثانية" مع نقطة نبض cyan، ويُحدَّث من `dataUpdatedAt` الذي يعطيه `useQuery`.
- زر **تحديث يدوي** بجانب المؤشر (يستدعي `invalidateQueries`).
- إشارة "قديم" (يتحول للأصفر) إذا مضى >60 ثانية على آخر heartbeat لأي موقع نشط.

### 4) سجل تغييرات العميل
- إعادة استخدام جدول `audit_log` الموجود.
- سنكتب `serverFn` جديدة: `listClientAudit(clientId)` تعيد آخر 50 حدث (`action`, `changed_at`, `changed_by`, `diff/details`, `ip`).
- Drawer يمين الشاشة يعرضهم كـ timeline مع ألوان الحدث (create/update/delete) — نفس أسلوب `audit.tsx`.
- كل عملية save/delete في الواجهة تُسجّل تلقائيًا سطرًا في `audit_log` عبر `upsertClient`/`deleteClient` (سنضيف الكتابة داخل الـ serverFn إن لم تكن موجودة).

### 5) سؤال التصنيف "فيديو واستوديو"
داخل الرد النهائي بعد التنفيذ، سأسألك:  
> هل تريد نقل مواقع `hn-groupe.*/video/studio/reels` من "نواة وذكاء" إلى تصنيف "فيديو واستوديو" (V) لملء الـ 22 المستهدفة، أم أُبقيها كما هي؟

---

### الملفات المتأثرة
- `src/lib/queries.functions.ts` — إضافة `listClientAudit`, تسجيل audit داخل `upsertClient`/`deleteClient`.
- `src/routes/_authenticated/clients.tsx` — الفلاتر المتقدمة، الفرز، مؤشر التحديث، Drawer السجل، أزرار الإجراءات.
- `src/components/dashboard/DataTable.tsx` — دعم `sortable` بسيط لكل عمود.
- (اختياري) `src/components/dashboard/ClientAuditDrawer.tsx` — مكوّن جديد للـ timeline.

### ملاحظات تقنية
- refetch كل 15s على جدول العملاء فقط (خفيف — استعلام مجمّع واحد).
- نستخدم `useMemo` لكل عمليات الفرز/التصفية لتفادي إعادة الحساب.
- الفرز يتم client-side (عدد العملاء صغير: ~20).
- audit_log له RLS موجود مسبقًا — سنقرأ بواسطة `requireSupabaseAuth`.
