# حكايا — Demo

## التشغيل محليًا
1. ثبّتوا Node.js 18 أو أحدث.
2. انسخوا `.env.example` إلى `.env` وعبّوه بالمفاتيح.
3. `node server.js` ثم افتحوا http://localhost:3000

## الرابط (غير مرتبط بكلود)
ارفعوا المجلد كامل على Render أو Railway أو أي VPS:
Build: (لا شيء) — Start: `node server.js` — ضعوا متغيرات `.env` في Environment Variables. المنفذ ياخذ PORT تلقائيًا.

## توليد القصة
`server.js` ← دالة `buildPrompt` و `story`. تستدعي أي خدمة متوافقة مع OpenAI (`LLM_BASE_URL`, `LLM_MODEL`).
موديلكم المضبوط (LoRA) إذا كان خلف vLLM أو Ollama يشتغل بنفس الطريقة: غيّروا الرابط واسم الموديل فقط.

## الصوت (خطوات Azure)
1. portal.azure.com ← Create resource ← "Speech" ← أنشئوها (الطبقة المجانية F0 تكفي للتجربة).
2. من Keys and Endpoint خذوا Key 1 والـ Region (مثل uaenorth) وضعوهما في `.env`.
3. الصوت الافتراضي `ar-SA-ZariyahNeural`. السرعة والنبرة من `prosody` داخل دالة `tts`.
4. إذا فشل الصوت: النص يبقى ظاهرًا، ويحاول المتصفح القراءة بصوته، وإلا تظهر رسالة لطيفة.
لا تضعوا المفاتيح في `index.html` أبدًا؛ المتصفح يكلم `/api/tts` والمفتاح يبقى في الخادم.

## اللهجات
ضعوا لكل لهجة ملف JSON **صالح** في `dialects/`: `najdi.json` `qassimi.json` `ahsa.json` `asiri.json`
(العلا تستخدم najdi). الحقول: name, vocabulary_dictionary, allowed_words, forbidden_words, preferred_phrases, style_examples, grammar_rules, cultural_notes, avoid.
انتبهوا: النصوص الطويلة في cultural_notes لازم تكون داخل علامات اقتباس "..." في ملفاتكم الحالية، وإلا الملف ما يُقرأ.
القاموس يظهر كذلك كلمات قابلة للضغط في القصة.

## المسابقة
منفصلة تمامًا: داخل `index.html` قسم `POOL` (قائمة الأسئلة). كل زائرة تحصل على 5 أسئلة عشوائية + سؤال المنطقة بدون نقاط.
