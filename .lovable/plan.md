
# خطة: تحويل الموقع إلى "قلب" مجموعة HN

الهدف: يصبح هذا الموقع مركز قيادة (Command Hub) يتحكم بمجموعة مواقع HN، يرسل ويستقبل منها، يوزع المهام على الوكلاء، ويعرض حالة كل شيء لحظياً.

المكونات الحالية: كتالوج وكلاء + جدول مواقع + ربط وكيل↔موقع + بريد لكل موقع + HUD مختبر.
الفجوات: لا يوجد ناقل رسائل فعلي، لا Webhooks، لا مفاتيح API لكل موقع، لا صندوق وارد موحد، لا صحة لحظية، لا سجل تنفيذ للأوامر.

---

## 1) ناقل الأحداث الموحد (Event Bus)

جدول `hub_events` مركزي يستقبل ويصدر:
- `direction`: inbound (من موقع إلى الهب) / outbound (من الهب إلى موقع)
- `site_id`, `agent_id` (اختياري), `type` (order, alert, sync, mail, task, heartbeat...), `payload jsonb`, `status` (queued/processing/delivered/failed), `attempts`, `error`, `created_at`, `delivered_at`
- Realtime مُفعّل → لوحة الأحداث تتحدث لحظياً

## 2) واجهة استقبال عامة (Ingress)

مسار `/api/public/hub/ingest` (server route):
- يستقبل POST من كل موقع بمفتاح API + توقيع HMAC
- يتحقق من المفتاح ويُدرج الحدث في `hub_events` كـ inbound
- يعيد `event_id` للمصدر

## 3) موزّع الأوامر (Dispatcher)

مسار `/api/public/hub/dispatch` مجدول عبر pg_cron كل دقيقة:
- يسحب الأحداث outbound بحالة queued
- يرسلها إلى `site.webhook_url` مع توقيع HMAC
- يحدث الحالة delivered/failed مع محاولات retry تصاعدية

## 4) مفاتيح API + أسرار HMAC لكل موقع

توسيع جدول `sites`:
- `api_key` (مولّد تلقائياً، يُعرض مرة واحدة)
- `webhook_secret` (لتوقيع الطلبات الصادرة)
- `webhook_url` (endpoint الموقع لاستقبال أوامر الهب)
- `last_heartbeat_at`, `health` (online/degraded/offline يُحسب من آخر نبضة)

## 5) صندوق وارد موحد للبريد

صفحة `/inbox`: كل الرسائل الواردة عبر عناوين مواقع المجموعة في مكان واحد
- جدول `mail_messages` (site_id, from, to, subject, body, direction, read_at)
- زر "رد" يرسل عبر بريد الموقع المستقبِل

## 6) لوحة "قلب المجموعة" (Hub Overview)

صفحة `/hub` جديدة كصفحة رئيسية:
- خريطة/شبكة مرئية للمواقع مع خط نابض لكل موقع نشط
- عدّاد أحداث/دقيقة (in/out)
- آخر 20 حدث Live Stream
- حالة كل موقع (heartbeat < 60s = online)

## 7) موزّع المهام على الوكلاء

عند وصول حدث inbound من نوع `task`:
- يبحث عن وكلاء نشطين ومربوطين بذلك الموقع
- يُنشئ سجلاً في `agent_tasks` ويعيّنه للوكيل الأنسب (حسب role)
- عند اكتمال المهمة يُصدر حدثاً outbound للموقع الأصلي

## 8) مراقبة الصحة (Heartbeat)

- كل موقع يرسل `POST /api/public/hub/heartbeat` كل 30 ثانية
- عمود `sites.last_heartbeat_at` يُحدَّث
- View يحسب الحالة الحية → HUD العلوي يعرض "MESH: 12/15 ONLINE"

## 9) سجل قابل للتدقيق

كل حدث ودخول ومهمة يُسجَّل في `audit_log` مع actor/target للتحقيق لاحقاً.

## 10) واجهة إعدادات التكامل لكل موقع

في صفحة `/sites` → زر "تكامل" لكل موقع يفتح:
- عرض api_key (مع Copy)
- تدوير المفتاح
- إدخال webhook_url
- زر "اختبار الاتصال" يرسل حدث ping ويعرض النتيجة

---

## البنية التقنية

```text
       ┌─────────────────────────────────┐
       │      HN HUB (هذا الموقع)         │
       │                                 │
  ┌────┤  /api/public/hub/ingest  ◀──────┼── مواقع HN
  │    │  /api/public/hub/heartbeat ◀────┼── (POST + HMAC)
  │    │                                 │
  │    │  hub_events (Realtime)          │
  │    │  ├─ Dispatcher (pg_cron/1m)     │
  │    │  ├─ Agent Router                │
  │    │  └─ Mail Aggregator             │
  │    │                                 │
  │    │  /api/public/hub/dispatch ──────┼─▶ webhook_url لكل موقع
  │    └─────────────────────────────────┘
  │
  └─ لوحات: /hub /inbox /agents /sites /events
```

## الجداول الجديدة

- `hub_events` (ناقل الأحداث + Realtime)
- `mail_messages` (البريد الموحد)
- توسيع `sites` بـ: api_key, webhook_secret, webhook_url, last_heartbeat_at

## الأمن

- كل الجداول RLS مقيّدة لـ staff فقط
- مسارات `/api/public/hub/*` تتحقق من `x-api-key` + توقيع `x-signature` (HMAC-SHA256)
- المفاتيح تُخزَّن كـ hash؛ تُعرض القيمة الخام مرة واحدة عند الإنشاء

## ترتيب التنفيذ المقترح

1. توسيع sites + جدول hub_events + سياسات + Realtime
2. مسارات ingest/heartbeat/dispatch
3. صفحة /hub الرئيسية + Live Stream
4. تكامل الوكلاء (توجيه المهام)
5. البريد الموحد /inbox
6. واجهة الإعدادات لكل موقع + اختبار الاتصال
7. pg_cron للموزع

هل نبدأ بالكامل، أم أُقسّمها لمراحل نُنفّذها واحدة تلو الأخرى؟
