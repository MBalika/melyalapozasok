// Ékezet nélküli, ezért „code”/„maybe” osztályba sorolt magyar szövegek keresése, amelyeknek nincs angol párjuk.
// Futtatás az _src/src mappából: node ../qa/hucheck.mjs ../i18n . index.src.html chapters/*.html js/*.js
import fs from 'fs'; import path from 'path';
const I = process.argv[2]; const root = process.argv[3]; const files = process.argv.slice(4);
const { collect } = await import(path.join(I, 'catalog.mjs'));
const U = collect(root, files);
// a sima és a kényszerített (!) kulcs mindenhol érvényes, a sorhoz kötött (id@fájl:sor) csak azon a soron
const T = new Set(); for (const f of fs.readdirSync(I)) if (/^en_.*\.tsv$/.test(f)) for (const l of fs.readFileSync(path.join(I, f), 'utf8').split('\n')) { const k = l.split('\t')[0]; if (k) T.add(k.replace(/!$/, '').replace(/#\d+$/, '')); }
const W = /\b(a|az|es|vagy|nem|talaj|agyag|iszap|homok|kavics|puha|nagyon|alatt|felett|szerves|laza|tomor|cm|melyen|melyseg|szint|fal|rud|cso|kut|teher|viz|ki|be|le|fel|meg|igen|van|nincs|lesz|mint|minden|csak|kell|ha|hogy|egy|ket|harom)\b/i;
const seen = new Set();
for (const u of U) { const lk = `${u.id}@${u.file}:${u.line}`; if (u.cls === 'hu' || seen.has(lk) || T.has(u.id) || T.has(lk)) continue; seen.add(lk);
  const s = u.t.replace(/<[^>]*>|\$\{[^}]*\}/g, ' ');
  const words = s.match(/[A-Za-z]{2,}/g) || [];
  if (words.length >= 2 && W.test(s) && !/[{}=;]\s*$|=>|\bfunction\b|\.js\b|px|var\(|rgba|translate|stroke|class|font|^\s*[#.\[]/.test(u.t)) console.log(u.id + '\t' + u.cls + '\t' + u.file + ':' + u.line + '\t' + u.t.slice(0, 140));
}
