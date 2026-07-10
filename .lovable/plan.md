# استيراد شبكة hn-group الكاملة إلى قلب المجموعة

## المدخلات
- 155 رابطاً أرسلته → بعد إزالة `https://` وتوحيد `www.` مع الأصل → **~95 دومين فريد**.
- الباقي مكرّرات (نفس النطاق مع/بدون `www`).

## 1. تنظيف قاعدة البيانات
- حذف المواقع التجريبية `site1..site10` من جدول `sites`.
- الإبقاء على المواقع الست الأصلية إن أردت (سؤال ضمن التنفيذ: سأدمجها تلقائياً إن طابق دومينها اللائحة، وإلا سأحذفها).
- إنشاء عميل واحد اسمه **HN Group** في جدول `clients` وربط كل المواقع الجديدة بـ `client_id` الخاص به.

## 2. إدراج المواقع (Migration + Insert)
لكل دومين فريد سيُدرج صف في `sites`:
- `domain` = الشكل القانوني بدون `https://` وبدون `www.`
- `client_id` = HN Group
- `status` = `unknown` (سيتحول إلى `online` عند أول heartbeat)
- `health` = `unknown`
- `icon_color` = يُشتق تلقائياً من فئة الدومين (انظر التصنيف أدناه)
- `email` = `ops@<root-domain>` كقيمة افتراضية قابلة للتعديل لاحقاً
- `api_key_hash` + `webhook_secret` = يُولَّدان تلقائياً في نفس الـ migration عبر `gen_random_uuid()` + `digest(...,'sha256')`

### التصنيف التلقائي حسب الـ subdomain / الغرض
| النمط | الفئة | اللون |
|---|---|---|
| `api.*`, `ws.*`, `auth.*`, `owner.*`, `rule.*`, `users.*`, `status.*`, `files.*`, `db.*`, `hn-db.*`, `hn-dbpro.*` | Backend / DB | cyan |
| `ai.*`, `hn-ai.*`, `hnclinik-ai.*`, `buildcv-ai.*`, `generatin.*`, `hn-chat.*`, `hnchat.*` | AI | violet |
| `driver.*`, `hn-driver.*`, `hndriver.*`, `ride.*`, `delivery.*`, `call*.*`, `slavacall-hiba.*` | Driver / Call | orange |
| `store.*`, `stouk.*`, `souk-hn.*`, `hn-immo.*`, `hnapps.*`, `hiba-eco.*` | Commerce | green |
| `video.*`, `film.*`, `cinema.*`, `studio.*`, `tanjaprint.*` | Media | pink |
| `learn.*`, `cv.*`, `blog.*`, `nawat.*`, `adkhar.*`, `hn-adkhar.*` | Content / Edu | yellow |
| `hn-carwash.*`, `carwashpro.*`, `lavagenizar.*` | Carwash | teal |
| `hn-finance.*`, `facturation.*`, `rfp.*`, `tender.*`, `audit.*` | Finance / Ops | amber |
| `hn-groupe.*`, `groupe-hn.*`, `goupe-hn.*`, `createur.*`, `hn-createur.*` | Core Group | blue |
| كل ما تبقى | Other | slate |

## 3. توليد المفاتيح
- الـ migration يستخدم `pgcrypto` (متاح) لتوليد:
  - `webhook_secret = encode(gen_random_bytes(32), 'hex')`
  - `api_key_raw = 'hn_' || encode(gen_random_bytes(24), 'hex')` (يُحفظ مؤقتاً في جدول جانبي `sites_provisioning` ثم يُصدَّر مرة واحدة)
  - `api_key_hash = encode(digest(api_key_raw, 'sha256'), 'hex')` في `sites`
- جدول `sites_provisioning` يُقرأ فقط عبر server function `exportProvisioningCsv` (Owner فقط)، ثم يُحذف تلقائياً بعد التصدير الأول.

## 4. صفحة تصدير المفاتيح (`/sites` → زر «Export HN Group Keys»)
- تظهر مرة واحدة فقط.
- تُنزّل ملف CSV: `domain, api_key, webhook_secret, ingest_url, heartbeat_url`.
- بعد التنزيل: تسجيل `audit_log` + تفريغ `sites_provisioning`.

## 5. خريطة الشبكة (`/hub` تحديث)
- تحويل عرض المواقع من قائمة إلى **خريطة نصف دائرية** حول أيقونة القلب المركزية.
- تجميع تلقائي حسب الفئة (ألوان الجدول أعلاه) — كل فئة قوس مستقل.
- خطوط نابضة حية عند وصول `hub_events` (يوجد بالفعل Realtime على الجدول).
- عدّاد لكل فئة: `online / total`.

## 6. SDK جاهز للنسخ (يُضاف كصفحة `/hub/sdk`)
- تبويبان: **PHP** و **Node.js**.
- كل تبويب يحوي كود جاهز للصق يحتاج فقط ملء `HN_HUB_API_KEY` و `HN_HUB_SECRET` من CSV.
- الوظائف: `sendHeartbeat()`, `emit(type,payload)`, `verifyIncoming(req)`.

## ملاحظات تقنية (لك)
- كل الإدراجات ستُنفَّذ عبر أداة insert (بيانات، لا سكيمة) — لن أضيف أعمدة جديدة إلا `sites_provisioning` (جدول جديد) الذي يحتاج migration.
- لن أمس المواقع الست الأصلية (`souk-hn.com`, `islamiat.net`, إلخ) — سأعيد تصنيف ألوانها فقط لتنسجم مع الجدول.
- المواقع التي تحتوي `www.` في اللائحة تُطبَّع تلقائياً؛ لن تُدرَج كصفوف مكرّرة.
- `carwashpro.com` و `hnclinik-ai.com` و `slavacall-hiba.com` وغيرها ليست تحت `hn-*` لكنها في لائحتك → ستُدرَج ضمن نفس عميل HN Group.

## ما ستراه بعد التنفيذ
- جدول `/sites` يعرض ~95 موقعاً موزّعة على 10 فئات ملوّنة.
- زر «Export HN Group Keys» يظهر مرة واحدة → تنزيل CSV.
- `/hub` يعرض خريطة القلب مع 10 مجرّات فرعية.
- `/hub/sdk` جاهز للصق في كل موقع.

اضغط **Implement plan** لأبدأ التنفيذ فوراً.
