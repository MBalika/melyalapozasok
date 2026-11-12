#!/usr/bin/env python3
"""Összeállítja a ../index.html-t (magyar) és a ../en.html-t (angol, Vercel cleanUrls → /en):
src/index.src.html + src/chapters/*.html (névsorrendben) + beágyazott CSS + esbuild-del csomagolt JS (three.js is benne).
Használat:  cd _src && npm install && (cd i18n && npm install) && python3 build.py
            python3 build.py catalog  → a fordítandó szövegek munkalapja (i18n/ws.tsv)

Fejlesztői (részleges) build – nem írja felül az index.html-t, csak magyar:
  BUILD_ID=furt MODULES=ch_furt CHAPTERS=05 python3 build.py   →  ../dev-furt.html
  (MODULES: a betöltendő fejezetmodulok vesszővel; CHAPTERS: a chapters/ fájlnév-előtagjai)

Az angol változat a magyar forrásból készül: az i18n/apply.mjs a fordítási egységeket (HTML-szövegek, attribútumok,
JS-karakterláncok) az i18n/en_*.tsv párjai szerint cseréli (.en/), a BME-videók adatait (src/js/yt_meta.json) az
i18n/en_yt.tsv szerint, és abból épül az en.html. Ha a magyar szöveg változik és nincs hozzá fordítás, az angol build
leáll (a hiányzók: i18n/missing.tsv). A magyar forrásba az angolhoz szükséges kapcsokat (EN jelző, nyelvváltó, angol
tördelési szabályok) az i18n/prep_hu.py teszi bele.
"""
import os, subprocess, sys, pathlib, re, shutil, glob, json
os.environ['ATTRS'] = 'data-sub,data-title,data-kick,data-tag,data-caps'   # a widgetek/ábrák címei, alcímei és képaláírásai is fordítandók

R = pathlib.Path(__file__).resolve().parent
os.chdir(R)
SRC = R / 'src'
I18N = R / 'i18n'
BID = os.environ.get('BUILD_ID', '')
MODS = [m for m in os.environ.get('MODULES', '').split(',') if m]
CHS = [c for c in os.environ.get('CHAPTERS', '').split(',') if c]
SITE = 'https://melyalapozasok.vercel.app'
ALT = f'<link rel="alternate" hreflang="hu" href="{SITE}/">\n<link rel="alternate" hreflang="en" href="{SITE}/en">\n<link rel="alternate" hreflang="x-default" href="{SITE}/">\n'
REDIR = "<script>/*nyelv*/try{if(localStorage.getItem('alap-lang')==='en'&&!/[?&]hu\\b/.test(location.search))location.replace('en'+location.hash)}catch(e){}</script>\n"
# az angolul is elérhető tananyagok: az angol oldal ezek /en változatára mutat
EN_SITES = ['bme-alapozas', 'talajfelderites', 'sikalapoktervezese', 'sikalapok-teherbirasszamitasa', 'sikalapokallekonysagvizsgalata',
            'sikalapok-sullyedesszamitasa', 'vedekezesakarossullyedesekellen', 'kedvezotlen-altalaj', 'sikalapokaterohatasok']
POST = []   # (részlet, csere) a kész angol HTML-ben – ahol a fordítókészlet nem elég
META = {
  'hu': ('Mélyalapozások',
         'Interaktív tananyag a mélyalapozásokról: cölöpök csoportosítása, előregyártott, Franki-, csavart, CFA-, béléscsöves és zagyos cölöpök, '
         'mikrocölöp, jet-grouting, résfal, kút- és szekrényalapozás – 3D cölöpépítővel, laborokkal, kvízekkel és a BME valós felvételeivel.',
         'interaktív tananyag', 'hu'),
  'en-GB': ('Deep foundations',
            'Interactive learning module on deep foundations: classification of piles, precast, Franki, screw, CFA, cased and slurry-supported bored piles, '
            'micropiles, jet grouting, diaphragm walls, well and box foundations – with a 3D pile builder, labs, quizzes and real BME footage.',
            'interactive learning module', 'en-gb'),
}


def build(src, lang, outname):
    entry = f'{src}/js/main.js'
    if BID:
        main = (src / 'js' / 'main.js').read_text(encoding='utf-8')
        keep = []
        for l in main.splitlines():
            if l.startswith("import './") and l.split("'")[1][2:].split('.js')[0] not in MODS and l.split("'")[1][2:].split('.js')[0] not in ('core', 'ui', 'data', 'hero'):
                continue
            keep.append(l)
        (src / 'js' / f'_dev_{BID}.js').write_text('\n'.join(keep) + '\n', encoding='utf-8')
        entry = f'{src}/js/_dev_{BID}.js'
    outjs = f'dist/app{"-" + BID if BID else ""}{"-en" if lang != "hu" else ""}.js'
    r = subprocess.run(['npx', 'esbuild', entry, '--bundle', '--format=iife', '--minify', '--target=es2019', '--loader:.json=json',
                        '--outfile=' + outjs, '--log-level=warning', '--legal-comments=none'], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr); sys.exit(1)
    if r.stderr.strip():
        print(r.stderr)

    css = (R / 'src' / 'fonts.css').read_text(encoding='utf-8') + (src / 'style.css').read_text(encoding='utf-8') + ''.join('\n/* ' + p.name + ' */\n' + p.read_text(encoding='utf-8') for p in sorted((src / 'css').glob('*.css')))
    body = (src / 'index.src.html').read_text(encoding='utf-8')
    chapters = ''.join((p.read_text(encoding='utf-8') + '\n') for p in sorted((src / 'chapters').glob('*.html')) if not CHS or any(p.name.startswith(c) for c in CHS))
    body = body.replace('<!--CHAPTERS-->', chapters)
    if lang != 'hu':   # a nyelvváltó a magyar oldalra mutat
        a = 'id="langSw" href="en" hreflang="en" lang="en"'; assert body.count(a) == 1
        body = body.replace(a, 'id="langSw" href="./" hreflang="hu" lang="hu"')
    js = (R / outjs).read_text(encoding='utf-8').replace('</script', '<\\/script')

    TITLE, DESC, OGS, HY = META[lang]
    fonts = ('<link rel="preload" href="fonts/big-shoulders-display-latin-900-normal.woff2" as="font" type="font/woff2" crossorigin>'
             '<link rel="preload" href="fonts/public-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>')
    icon = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Crect width='36' height='36' rx='9' fill='%2316212c'/%3E"
            "%3Ccircle cx='18' cy='18' r='10.5' fill='none' stroke='%23f0864a' stroke-width='2.6'/%3E%3Ccircle cx='18' cy='18' r='5' fill='%23f0864a'/%3E"
            "%3Cpath d='M18 3v5M18 28v5M3 18h5M28 18h5' stroke='%23c9d3dc' stroke-width='2'/%3E%3C/svg%3E")
    theme_boot = "<script>try{var t=localStorage.getItem('mz-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}</script>"
    hyph = ('<script src="vendor/hyphenopoly/Hyphenopoly_Loader.js"></script>\n'
            '<script>Hyphenopoly.config({ require: { "' + HY + '": "FORCEHYPHENOPOLY" }, setup: { hide: "none", selectors: { ".hyphenate": { minWordLength: 6, compound: "auto" } } } });</script>')
    html = f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#16212c">
<meta property="og:title" content="{TITLE} – {OGS}">
<meta property="og:description" content="{DESC}">
<meta property="og:image" content="img/og.jpg">
<link rel="icon" href="{icon}">
{ALT if not BID else ''}{REDIR if lang == 'hu' and not BID else ''}{theme_boot}
{fonts}
{hyph}
<style>
{css}
</style>
</head>
<body>
{body}
<script>{js}</script>
</body>
</html>
'''
    if lang != 'hu':
        for x, y in POST: assert html.count(x) == 1, x; html = html.replace(x, y)
        for s in EN_SITES: html = re.sub(rf'https://{s}\.vercel\.app/?(#[\w-]+)?(?=["\'`])', lambda m, s=s: f'https://{s}.vercel.app/en' + (m.group(1) or ''), html)
    (R.parent / outname).write_text(html, encoding='utf-8')
    print(outname, len(html) // 1024, 'KB')


FILES = ['index.src.html', *[f'chapters/{p.name}' for p in sorted((SRC / 'chapters').glob('*.html'))], *[f'js/{p.name}' for p in sorted((SRC / 'js').glob('*.js')) if not p.name.startswith('_dev_')]]
if sys.argv[1:2] == ['catalog']:
    r = subprocess.run(['node', str(I18N / 'worksheet.mjs'), str(SRC), *FILES], capture_output=True, text=True)
    (I18N / 'ws.tsv').write_text(r.stdout, encoding='utf-8'); print(r.stdout.count('\n'), 'egység → i18n/ws.tsv', r.stderr[-500:]); sys.exit(0)

build(SRC, 'hu', f'dev-{BID}.html' if BID else 'index.html')
if BID: sys.exit(0)

# ---- angol változat ----
EN = R / '.en'; shutil.rmtree(EN, ignore_errors=True); (EN / 'js').mkdir(parents=True); (EN / 'chapters').mkdir()
shutil.copy(SRC / 'style.css', EN / 'style.css'); (EN / 'css').mkdir()
for p in (SRC / 'css').glob('*.css'): shutil.copy(p, EN / 'css' / p.name)
# a BME-videók adatai (cím, lejátszási lista, képaláírások) angolul – i18n/en_yt.tsv: magyar ⇥ angol
YT = dict(l.split('\t', 1) for l in (I18N / 'en_yt.tsv').read_text(encoding='utf-8').splitlines() if '\t' in l and not l.startswith('#'))
meta = json.loads((SRC / 'js' / 'yt_meta.json').read_text(encoding='utf-8')); miss = []
def tr(s):
    if s is None or s == '' or not re.search(r'[A-Za-zÁ-ű]', s): return s
    if s not in YT: miss.append(s); return s
    return YT[s]
for v in meta.values():
    v['title'] = tr(v['title']); v['playlist'] = tr(v.get('playlist')); v['caps'] = [tr(c) for c in v['caps']]
if miss: sys.exit('Hiányzó videóadat-fordítás (i18n/en_yt.tsv): ' + ' | '.join(miss))
(EN / 'js' / 'yt_meta.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding='utf-8')
tsv = ','.join(sorted(glob.glob(str(I18N / 'en_*.tsv'))))
tsv = ','.join(p for p in tsv.split(',') if not p.endswith('en_yt.tsv'))
if not tsv: sys.exit('nincs fordítás (i18n/en_*.tsv)')
r = subprocess.run(['node', str(I18N / 'apply.mjs'), str(SRC), str(EN), tsv, *FILES], capture_output=True, text=True, cwd=I18N,
                   env={**os.environ, 'STRICT': '1', 'NUMFIX': '1'})
print(r.stdout.strip())
if r.returncode:
    print(r.stderr[-2500:]); sys.exit('Az angol változat nem készült el (a hiányzók: i18n/missing.tsv).')
if (I18N / 'missing.tsv').exists(): (I18N / 'missing.tsv').unlink()
# tizedesvessző → pont: a HTML-szövegben (címkék között) és a JS-literálokban (acorn); tg → tan
for f in FILES:
    p = EN / f; t = p.read_text(encoding='utf-8')
    if f.endswith('.html'):
        t = re.sub(r'>([^<]*)<', lambda m: '>' + re.sub(r'(?<=\d),(?=\d)', '.', re.sub(r'\btg(?=[  ][αδφ\d(]|²)', 'tan', m.group(1))) + '<', t)
        p.write_text(t, encoding='utf-8')
r = subprocess.run(['node', str(I18N / 'numfix_js.mjs'), *[str(EN / f) for f in FILES if f.endswith('.js')]], capture_output=True, text=True, env={**os.environ, 'MODULE': '1'})
print(r.stdout.strip().replace('\n', ' · '))
if r.returncode: print(r.stderr); sys.exit(1)
for f in FILES:
    if f.endswith('.js'):
        p = EN / f; t = p.read_text(encoding='utf-8'); t = re.sub(r'\btg(?=[  ][αδφ$\d(]|²)', 'tan', t); t = re.sub(r'\bctg(?=[  ][αδφ$\d(]|²)', 'cot', t); p.write_text(t, encoding='utf-8')
build(EN, 'en-GB', 'en.html')
