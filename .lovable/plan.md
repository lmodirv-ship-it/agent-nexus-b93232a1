# خطة إعادة هيكلة نظام نماذج الذكاء الاصطناعي

## الهدف
فصل بيانات المزودين عن النماذج، ومنع تخزين أي مفتاح API خام في قاعدة البيانات — فقط **اسم السر** المحفوظ في Lovable Cloud Secrets، مع إضافة سجلات الاستخدام والحدود.

---

## 1) تعديلات قاعدة البيانات (migration واحد)

### جدول جديد: `ai_providers`
- `code` (unique): `openai`, `google`, `anthropic`, `lovable-gateway` …
- `name`, `base_url`, `api_key_secret_name` (اسم السر فقط، مثل `OPENAI_API_KEY`)
- `is_enabled`, `metadata jsonb`
- بذر أولي: `lovable-gateway` (يستخدم `LOVABLE_API_KEY`), `openai`, `google`

### إعادة تشكيل `ai_models`
- إضافة `provider_id uuid → ai_providers(id)`
- إضافة `gateway_code text unique` (مثل `openai/gpt-5`)
- إضافة `display_name`, `description`, `category` (chat/reasoning/coding/image/audio/embedding/moderation/realtime) مع CHECK
- إضافة `modalities jsonb`, `capabilities jsonb`, `context_window`, `max_output_tokens`
- إضافة `input_price_per_million`, `output_price_per_million`, `priority`, `metadata`
- تعديل `status` بـ CHECK: active/preview/experimental/deprecated/disabled
- **حذف عمود `api_key_secret`** (السر يُقرأ من `ai_providers.api_key_secret_name`)
- الحفاظ على `model_code` (Mxxxxxx) و `is_enabled`, `is_default`, `rules`, `role`, `task`, `notes`
- UNIQUE `(provider_id, model_id)`
- Partial unique index: نموذج افتراضي واحد فقط لكل مزود

### جداول جديدة
- **`ai_usage_logs`**: `user_id`, `model_id`, `site_id?`, `input_tokens`, `output_tokens`, `cost`, `latency_ms`, `status`, `error`, `created_at` — مع فهارس على `(user_id, created_at)` و `(model_id, created_at)`
- **`user_ai_limits`**: `user_id` (unique), `monthly_token_cap`, `monthly_request_cap`, `is_active`

### RLS + GRANT
- كل الجداول: `authenticated` read؛ الكتابة/الحذف للـ `owner` عبر `has_role`
- `ai_usage_logs`: المستخدم يقرأ سجلاته فقط؛ الـ owner يقرأ الكل
- `service_role` كامل لكل الجداول

### بذر البيانات
- ترحيل النماذج الأربعة الحالية إلى مزوّد `lovable-gateway`
- إضافة كامل كتالوج Lovable AI (~19 نموذجاً: Gemini 3/2.5, GPT-5 عائلة …) عبر `INSERT … ON CONFLICT DO UPDATE`

---

## 2) طبقة الخادم

### `src/lib/queries.functions.ts`
- `listAiProviders`, `upsertAiProvider`, `toggleAiProvider`
- تحديث `listAiModels` ليعمل JOIN مع `ai_providers` (يرجع `provider_code`, `provider_name`, `api_key_secret_name`)
- تحديث `upsertAiModel` ليتطلب `provider_id` (لا `api_key_secret`)
- `listAiUsage`, `getUserAiLimits`, `upsertUserAiLimits`

### `src/lib/ai-invoke.functions.ts` (جديد)
- `invokeAiModel({ modelId, messages })` — server function محمي بـ `requireSupabaseAuth`
- يقرأ النموذج + المزود، يجلب السر عبر `process.env[provider.api_key_secret_name]`
- ينادي عبر Lovable AI Gateway (أو `base_url` المزود)
- يسجل التوكينز/التكلفة في `ai_usage_logs`
- يتحقق من `user_ai_limits`

---

## 3) واجهة `/ai-models`

- **تبويبان**: "المزودون" و "النماذج"
- **المزودون**: جدول (الكود، الاسم، base_url، اسم السر، حالة السر ✓/✗، تفعيل، إجراءات) + شارة "السر مُعرَّف" مقابل "مفقود"
- **النماذج**: 
  - تعديل النموذج: dropdown للمزود بدل حقل نصي، حقل `gateway_code`، `display_name`, `category`, `context_window`, أسعار، modalities/capabilities كـ chips
  - إزالة حقل `api_key_secret` من الفورم (يورث من المزود)
  - عمود جديد "المزود" مع badge لونية
- زر "زامن الكتالوج" لإعادة بذر نماذج Lovable Gateway

## 4) صفحة جديدة `/ai-usage` (اختياري بنفس الجلسة)
- جدول سجلات الاستخدام + بطاقات (توكينز اليوم/الشهر، التكلفة، أعلى النماذج استخداماً)
- إعدادات حدود المستخدم

---

## ملاحظات تقنية
- Lovable Cloud لا يعرض Supabase Dashboard؛ الأسرار تُدار بأداة `add_secret`. `LOVABLE_API_KEY` مُهيّأ تلقائياً — سنستخدمه لجميع نماذج البوابة دون طلب مفاتيح.
- طلب مفتاح OpenAI/Google الخارجي يتم فقط إذا أضاف المستخدم مزوّداً مباشراً (خارج البوابة) — عندها نطلب السر بـ `add_secret` باسم `api_key_secret_name`.
- المفاتيح لا تُرسل للمتصفح إطلاقاً؛ كل الاستدعاءات عبر `createServerFn`.

## الملفات المتأثرة
- migration جديد (جداول + RLS + GRANT + بذر)
- `src/lib/queries.functions.ts` (تحديث + دوال جديدة)
- `src/lib/ai-invoke.functions.ts` (جديد)
- `src/routes/_authenticated/ai-models.tsx` (إعادة كتابة مع التبويبات)
- `src/routes/_authenticated/ai-usage.tsx` (جديد)
- `src/components/dashboard/Sidebar.tsx` (رابط الاستخدام)
