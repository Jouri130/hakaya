import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dir = path.dirname(fileURLToPath(import.meta.url));
// تحميل .env بدون مكتبات
if (fs.existsSync('.env')) for (const l of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const E = process.env;

// المناطق: العلا تستخدم لهجة نجد. عدّلوا التفاصيل هنا.
const REGIONS = {
  'نجد':    { dialect: 'najdi',   hint: 'صحراء وكثبان، نخيل، بيوت طينية، قهوة وضيافة' },
  'القصيم': { dialect: 'qassimi', hint: 'نخيل وتمور، أسواق التمور، كليجا' },
  'الأحساء':{ dialect: 'ahsa',    hint: 'واحة نخيل، عيون ماء، مزارع، فريج' },
  'عسير':   { dialect: 'asiri',   hint: 'جبال وضباب، مدرجات زراعية، بيوت حجرية، فن القط العسيري' },
  'العلا':  { dialect: 'najdi',   hint: 'صخور وتكوينات صخرية، نخيل، واحة، بدون ادعاءات تاريخية' },
};
const loadDialect = id => { try { return JSON.parse(fs.readFileSync(path.join(__dir, 'dialects', id + '.json'), 'utf8')); } catch { return {}; } };

function buildPrompt({ name, gender, age, region, category }) {
  const girl = gender === 'بنت', d = loadDialect(REGIONS[region].dialect);
  const list = a => (a && a.length ? a.join('، ') : 'لا يوجد');
  return `أنت كاتب قصص أطفال سعودي. اكتب قصة جديدة مستوحاة من البيئة والتراث السعودي (ليست حكاية شعبية أصلية).
المدخلات (التزم بها حرفيًا):
- اسم البطل: ${name}
- الجنس: ${gender} (${girl ? 'فتاة: استخدمي المؤنث دائمًا: هي، ذهبت، قالت، شعرت' : 'ولد: استخدم المذكر دائمًا: هو، ذهب، قال، شعر'} طوال القصة، ولا تخلط بين الجنسين أبدًا ولا تستنتج الجنس من الاسم)
- العمر: ${age} سنة (مفردات وجمل مناسبة لهذا العمر)
- المنطقة: ${region} (عناصر المكان: ${REGIONS[region].hint})
- نوع القصة: ${category}
الأولويات: 1) صحة جنس البطل 2) مناسبة العمر 3) ارتباط الأحداث بالمنطقة 4) نوع القصة 5) لهجة سعودية طبيعية 6) ثقافة وعادات 7) أحداث فعلية لا وصف 8) قيمة تعليمية غير مباشرة.
البنية: بداية، مشكلة، تطور، موقف يحتاج تفكيرًا أو قرارًا، نهاية واضحة. عناصر المنطقة جزء من الأحداث نفسها.
اللهجة (${d.name || region}): كلمات مسموحة: ${list(d.allowed_words)}. ممنوعة: ${list(d.forbidden_words)}. عبارات مفضلة: ${list(d.preferred_phrases)}. أمثلة: ${list(d.style_examples)}. قواعد: ${list(d.grammar_rules)}. تجنب: ${list(d.avoid)}. ملاحظات ثقافية: ${list(d.cultural_notes)}.
قاعدة مهمة: كلمات المخاطبة الخاصة بالمؤنث (مثل الشين أو السين في آخر الكلمة) تُستخدم فقط عند مخاطبة شخصية أنثى، ولا تُستخدم أبدًا مع أي شخصية ذكر. وإذا كان البطل ولدًا فكل من يخاطبه يستخدم صيغة المذكر.
استخدم الكلمات باعتدال وبدون إقحام، ولا تخترع كلمات.
ممنوع: كتابة العبرة داخل القصة، محتوى مخيف أو مسيء، معلومات تاريخية مختلقة، صور نمطية عن أي منطقة.
أعد JSON فقط بهذا الشكل بلا أي نص آخر:
{"title":"عنوان القصة","paragraphs":["فقرة قصيرة","..."],"moral":"العبرة مستخلصة من الأحداث في جملتين كحد أقصى"}`;
}

async function story(body) {
  const { name, gender, age, region, category } = body;
  if (!name?.trim() || !['ولد', 'بنت'].includes(gender) || !age || !REGIONS[region] || !category) throw new Error('بيانات ناقصة');
  const r = await fetch(E.LLM_BASE_URL.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + E.LLM_API_KEY },
    body: JSON.stringify({ model: E.LLM_MODEL, temperature: 0.8, messages: [{ role: 'user', content: buildPrompt({ ...body, name: name.trim().slice(0, 30) }) }] }),
  });
  if (!r.ok) {
  const errorText = await r.text();
  console.error('LLM ERROR:', errorText);
  throw new Error('LLM ' + r.status + ': ' + errorText);
}
  const txt = (await r.json()).choices[0].message.content.replace(/```json|```/g, '').trim();
  const out = JSON.parse(txt);
  out.glossary = loadDialect(REGIONS[region].dialect).vocabulary_dictionary || {};
  return out;
}

async function tts(text) {
  const esc = text.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const ssml = `<speak version="1.0" xml:lang="ar-SA"><voice name="${E.AZURE_VOICE || 'ar-SA-ZariyahNeural'}"><prosody rate="-12%" pitch="+2%">${esc.replace(/\n+/g, '<break time="700ms"/>')}</prosody></voice></speak>`;
  const r = await fetch(`https://${E.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': E.AZURE_SPEECH_KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3' },
    body: ssml,
  });
  if (!r.ok) throw new Error('TTS ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.js': 'text/javascript', '.css': 'text/css' };
const readBody = req => new Promise(res => { let b = ''; req.on('data', c => (b += c)); req.on('end', () => res(JSON.parse(b || '{}'))); });

http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/story') {
      const o = await story(await readBody(req)); res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(o));
    }
    if (req.method === 'POST' && req.url === '/api/tts') {
      const { text } = await readBody(req); const mp3 = await tts(String(text).slice(0, 5000));
      res.setHeader('Content-Type', 'audio/mpeg'); return res.end(mp3);
    }
    const f = path.join(__dir, 'public', req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(path.join(__dir, 'public')) || !fs.existsSync(f)) { res.statusCode = 404; return res.end('404'); }
    res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f));
  } catch (e) { console.error(e.message); res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
}).listen(E.PORT || 3000, () => console.log('حكايا تعمل على http://localhost:' + (E.PORT || 3000)));
