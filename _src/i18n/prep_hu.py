# A magyar forrás (_src/src) előkészítése az angol változathoz – a magyar oldal szövege és működése nem változik:
# EN jelző, nyelvfüggő számformátum, a formázás-őr angol szabályai, en-gb elválasztás, HU | EN nyelvváltó, angol videók útvonala.
# Idempotens. Használat: python3 _src/i18n/prep_hu.py
import os
SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')
def load(f): return open(os.path.join(SRC, f), encoding='utf-8').read()
def save(f, t): open(os.path.join(SRC, f), 'w', encoding='utf-8').write(t)
def rep(t, a, b, n=1):
    c = t.count(a); assert c == n, (a[:90], c); return t.replace(a, b)

t = load('js/core.js')
if 'export const EN =' not in t:
    t = rep(t, "export const $ = (s, r = document) => r.querySelector(s);",
            "export const EN = (document.documentElement.lang || '').toLowerCase().startsWith('en');   // angol oldal (en.html)\nexport const $ = (s, r = document) => r.querySelector(s);")
    t = rep(t, "  return Number(x).toLocaleString('hu-HU', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/\u00a0/g, '\u202f');",
            "  if (EN) return Number(x).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/,/g, '\u202f');   // angolul: tizedespont, ezres tagolás keskeny szóközzel\n  return Number(x).toLocaleString('hu-HU', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/\u00a0/g, '\u202f');")
    t = rep(t, "  const TERMS = ['talajkiszorításos cölöp',", "  const TERMS = EN ? ['displacement pile', 'replacement pile', 'non-displacement pile', 'shaft resistance', 'base resistance', 'bearing stratum', 'end-bearing pile', 'friction pile', 'tension pile', 'continuous flight auger', 'bored pile', 'driven pile', 'precast pile', 'Franki pile', 'screw pile', 'cased pile', 'large-diameter bored pile', 'micropile', 'jet grouting', 'deep mixing', 'diaphragm wall', 'secant pile wall', 'contiguous pile wall', 'pile group', 'pile cap', 'negative skin friction', 'temporary casing', 'support fluid', 'guide wall', 'open caisson', 'pneumatic caisson', 'well foundation', 'box foundation', 'according to'] : ['talajkiszorításos cölöp',")
    t = rep(t, "  const NUMW = /(^|[\\s(\\u00A0\\u2060„])((?:[Kk]ét|", "  const NUMW = EN ? /(^|[\\s(\\u00A0\\u2060“])((?:[Tt]wo|[Tt]hree|[Ff]our|[Ff]ive|[Ss]ix|[Ss]even|[Ee]ight|[Nn]ine|[Tt]en|[Ff]irst|[Ss]econd|[Tt]hird|[Ff]ourth|[Ff]ifth|[Bb]oth|[Aa]ll|[Ss]everal))(?=\\s\\S)\\s/g : /(^|[\\s(\\u00A0\\u2060„])((?:[Kk]ét|")
    t = rep(t, "(pl\\.|kb\\.|ill\\.|ún\\.|max\\.|min\\.|ld\\.|vö\\.|cca\\.|átl\\.|ill|ún|kb) (?=\\S)", "(pl\\.|kb\\.|ill\\.|ún\\.|max\\.|min\\.|ld\\.|vö\\.|cca\\.|átl\\.|ill|ún|kb|e\\.g\\.|i\\.e\\.|approx\\.|cf\\.|No\\.|Fig\\.) (?=\\S)")
    t = rep(t, "    for (let i = 0; i < 2; i++) s = s.replace(/(^|[\\s(\\u00A0\\u2060„])(a|az|A|Az|s|e|egy|Egy|és|És) (?=\\S)/g, '$1$2' + NB);",
            "    for (let i = 0; i < 2; i++) s = s.replace(EN ? /(^|[\\s(\\u00A0\\u2060“‘])(a|an|the|A|An|The|&) (?=\\S)/g : /(^|[\\s(\\u00A0\\u2060„])(a|az|A|Az|s|e|egy|Egy|és|És) (?=\\S)/g, '$1$2' + NB);")
    t = rep(t, "  const SHORTEND = new RegExp('(^|[\\\\s(\\u00A0\\u2060„])(a|az|A|Az|s|e|egy|Egy|és|És|pl\\\\.|kb\\\\.|ill\\\\.|ún\\\\.|max\\\\.|min\\\\.|",
            "  const SHORTEND = new RegExp(EN ? '(^|[\\\\s(\\u00A0\\u2060“‘])(a|an|the|A|An|The|e\\\\.g\\\\.|i\\\\.e\\\\.|approx\\\\.|\\\\d+(?:[,.]\\\\d+)?\\\\.?%?|' + NUMW.source.match(/\\(\\?:([^)]*)\\)/)[1] + ') $' : '(^|[\\\\s(\\u00A0\\u2060„])(a|az|A|Az|s|e|egy|Egy|és|És|pl\\\\.|kb\\\\.|ill\\\\.|ún\\\\.|max\\\\.|min\\\\.|")
    t = rep(t, "    if (H && H.hyphenators && H.hyphenators.hu) {\n      H.hyphenators.hu.then(", "    if (H && H.hyphenators && H.hyphenators[EN ? 'en-gb' : 'hu']) {\n      H.hyphenators[EN ? 'en-gb' : 'hu'].then(")
    save('js/core.js', t)

t = load('js/ui.js')
if 'function initLang' not in t:
    t = rep(t, "$('#vmFrame', m).src = `video/${n}.html#autoplay`;", "$('#vmFrame', m).src = `video/${EN ? 'en/' : ''}${n}.html#autoplay`;")
    t = rep(t, "import { $, $$, h, fireTheme, GUARD } from './core.js';", "import { $, $$, h, fireTheme, GUARD, EN } from './core.js';")
    t = rep(t, "  initTheme(); initChapterPiles();", "  initTheme(); initLang(); initChapterPiles();")
    t += """
// nyelvváltó: a választás megmarad (alap-lang), a másik nyelvű oldal ugyanott nyílik meg (alap-pos)
function initLang() {
  const sw = $('#langSw'), KEY = 'alap-pos'; const hh = () => { const tb = $('.topbar'); return tb ? tb.offsetHeight : 0; };
  if (sw) sw.addEventListener('click', () => {
    try { localStorage.setItem('alap-lang', EN ? 'hu' : 'en'); } catch (e) { }
    const H0 = hh(); let best = null; document.querySelectorAll('main [id]').forEach((n) => { if (n.closest('svg')) return; const r = n.getBoundingClientRect(); if (r.height && r.top <= H0 + 1 && r.bottom > H0) best = n; });
    try { sessionStorage.setItem(KEY, JSON.stringify({ id: best ? best.id : '', off: best ? H0 - best.getBoundingClientRect().top : 0, y: scrollY, t: Date.now() })); } catch (e) { }
    sw.setAttribute('href', (EN ? './' : 'en') + (best ? '#' + best.id : ''));
  });
  let p = null; try { p = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) { }
  if (p && Date.now() - p.t < 20000) { if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const go = () => { const n = p.id && document.getElementById(p.id); const y = n ? n.getBoundingClientRect().top + scrollY - hh() + p.off : p.y; scrollTo({ top: Math.max(0, y), behavior: 'instant' }); };
    requestAnimationFrame(go); addEventListener('load', () => { go(); setTimeout(go, 600); }, { once: true }); }
}
"""
    save('js/ui.js', t)

t = load('index.src.html')
if 'id="langSw"' not in t:
    t = rep(t, '    <button class="iconbtn" id="themeBtn" type="button" aria-label="Téma váltása"></button>\n',
            '    <a class="langbtn" id="langSw" href="en" hreflang="en" lang="en" aria-label="English version"><b>HU</b><span>EN</span></a>\n    <button class="iconbtn" id="themeBtn" type="button" aria-label="Téma váltása"></button>\n')
    save('index.src.html', t)

t = load('style.css')
if '.langbtn' not in t:
    t += """
/* nyelvváltó (HU | EN): a kitöltött az aktuális nyelv; mobilon csak a másik nyelv kódja */
.langbtn { flex: none; display: inline-flex; align-items: center; gap: 2px; padding: 3px; border: 1px solid var(--line2, var(--line)); background: var(--surface); border-radius: 999px; text-decoration: none; font-family: var(--f-mono); font-size: 12.5px; font-weight: 500; letter-spacing: .04em; }
.langbtn b, .langbtn span { display: inline-grid; place-items: center; min-width: 30px; padding: 4px 8px; border-radius: 999px; }
.langbtn b { background: var(--ink); color: var(--surface); font-weight: 500; }
.langbtn span { color: var(--muted); }
.langbtn:hover span { background: var(--surface2, var(--surface)); color: var(--ink); }
@media (max-width: 560px) { .langbtn b { display: none; } .langbtn span { min-width: 0; padding: 5px 9px; color: var(--ink); } }
"""
    save('style.css', t)

# --- formázási javítás (mindkét nyelven): a gondolatjel (–, —) nem kezdhet sort
t = load('js/core.js')
if "/* gondolatjel */" not in t:
    t = rep(t, "    // rövidítések\n", "    // rövidítések\n    s = s.replace(/(\\S) ([–—]) /g, '$1' + NB + '$2 ');   /* gondolatjel */\n")
    t = rep(t, "      const ms = /^ ([=≤≥≈→←×±<>⇒+−/]) /.exec(b.nodeValue);", "      if (/^ [–—] /.test(b.nodeValue) && /\\S$/.test(a.nodeValue)) b.nodeValue = NB + b.nodeValue.slice(1);   /* gondolatjel a csomóponthatáron */\n      const ms = /^ ([=≤≥≈→←×±<>⇒+−/]) /.exec(b.nodeValue);")
    save('js/core.js', t)
# --- angol többes szám: „1 technology is / 3 technologies are possible” (a magyar szöveg változatlan)
t = load('js/ch_dontes.js')
if "'technologies are possible'" not in t:
    t = rep(t, "`<b>${ok}</b> technológia jöhet szóba${ex ?", "`<b>${ok}</b> ${EN ? (ok === 1 ? 'technology is possible' : 'technologies are possible') : 'technológia jöhet szóba'}${ex ?")
    if 'EN }' not in t.split('\n', 30)[0] and ', EN } from' not in t:
        import re as _re
        m = _re.search(r"import \{([^}]*)\} from './core.js';", t); assert m, 'core import'
        t = t.replace(m.group(0), "import {" + m.group(1).rstrip() + ", EN } from './core.js';", 1)
    save('js/ch_dontes.js', t)
# --- a magyar névelő (a/az) angolul „the” (a magyar szöveg változatlan)
import re as _re2
for f, var in [('js/ch_elore.js', 'lt.n'), ('js/sim3d.js', 'toeA.n')]:
    t = load(f)
    a = "${/^[aáeéiíoóöőuúüű]/i.test(" + var + ") ? 'az' : 'a'}"
    if a in t:
        t = t.replace(a, "${EN ? 'the' : (/^[aáeéiíoóöőuúüű]/i.test(" + var + ") ? 'az' : 'a')}")
        if ', EN } from' not in t and ' EN,' not in t.split('\n', 8)[1] + t.split('\n', 8)[2]:
            m = _re2.search(r"import \{([^}]*)\} from './core.js';", t); assert m, 'core import ' + f
            t = t.replace(m.group(0), "import {" + m.group(1).rstrip() + ", EN } from './core.js';", 1)
        save(f, t)
# --- angol többes szám: „1 storey / 8 storeys” (a magyar szöveg változatlan)
t = load('js/ch_alapok.js')
if "'storeys'" not in t:
    t = rep(t, "`${m.n} szint`", "`${m.n} ${EN ? (m.n === 1 ? 'storey' : 'storeys') : 'szint'}`")
    if ', EN } from' not in t:
        import re as _re3
        m_ = _re3.search(r"import \{([^}]*)\} from './core.js';", t); assert m_, 'core import'
        t = t.replace(m_.group(0), "import {" + m_.group(1).rstrip() + ", EN } from './core.js';", 1)
    save('js/ch_alapok.js', t)
# --- ékezet nélküli magyar címkék, amelyek kulcsként is szerepelnek: angolul külön ág (a magyar oldal változatlan)
import re as _re4
def _en_import(t, f):
    if ', EN } from' in t: return t
    m_ = _re4.search(r"import \{([^}]*)\} from './core.js';", t); assert m_, 'core import ' + f
    return t.replace(m_.group(0), "import {" + m_.group(1).rstrip() + ", EN } from './core.js';", 1)
t = load('js/kut_figs.js')
if "EN ? 'gravel' : 'kavics'" not in t:
    t = rep(t, "lead(s, VW - XO + 5, 150, VW - 6, 22, 'kavics', 'end', 'kf-s');", "lead(s, VW - XO + 5, 150, VW - 6, 22, EN ? 'gravel' : 'kavics', 'end', 'kf-s');")
    save('js/kut_figs.js', _en_import(t, 'kut_figs'))
t = load('js/ch_dontes.js')
if "EN ? 'gravel' : 'kavics'" not in t:
    t = rep(t, "[null, 'f-soilD', 'pat-gravel', 'kavics']", "[null, 'f-soilD', 'pat-gravel', EN ? 'gravel' : 'kavics']")
    save('js/ch_dontes.js', _en_import(t, 'ch_dontes'))
# --- formázási javítás (mindkét nyelven): a két-/háromhasábos sorban álló videókártya keskeny kijelzőn egymás alá teszi a képet és a szöveget (különben ~80 px-es szöveghasáb maradt)
t = load('style.css')
if '/* keskeny videókártya */' not in t:
    t += "/* keskeny videókártya */\n@media (max-width: 960px) { .rf-row.c2 .vcard, .rf-row.c3 .vcard, .rf-row.c2-wide .vcard, .grid2 .vcard { grid-template-columns: minmax(0, 1fr); } }\n"
    save('style.css', t)
# --- angol márkanév: az alcím („BME · Foundation Engineering”) egy sorban marad
t = load('style.css')
if '/* angol márka-alcím */' not in t:
    t += "/* angol márka-alcím */\nhtml[lang^=en] .brand small { white-space: nowrap; }\n"
    save('style.css', t)
print('kész')
