// تشغيل: node test.js  (بعد تشغيل الخادم)
const cases=[['جود','بنت'],['ريم','بنت'],['سلمان','ولد'],['محمد','ولد'],['نور','بنت']];
const F=/\b(ذهب|قال|شعر|كان|أصبح|هو)\b/, M=/\b(ذهبت|قالت|شعرت|كانت|أصبحت|هي)\b/;
for(const [name,gender] of cases){
  const r=await fetch('http://localhost:3000/api/story',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,gender,age:'7-9',region:'عسير',category:'مغامرة'})});
  const d=await r.json(), t=d.paragraphs.join(' ');
  const bad=(gender==='بنت'?F:M).test(t);
  console.log(name,gender,bad?'⚠️ راجعي النص يدويًا (قد يكون فعلًا لشخصية ثانية)':'✅',' — ',d.title);
}
