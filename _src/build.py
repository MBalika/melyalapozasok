#!/usr/bin/env python3
"""Összeállítja a ../index.html-t: src/index.src.html + src/chapters/*.html (névsorrendben)
+ beágyazott CSS + esbuild-del csomagolt JS (three.js is benne).
Használat:  cd _src && npm install && python3 build.py

Fejlesztői (részleges) build – nem írja felül az index.html-t:
  BUILD_ID=furt MODULES=ch_furt CHAPTERS=05 python3 build.py   →  ../dev-furt.html
  (MODULES: a betöltendő fejezetmodulok vesszővel; CHAPTERS: a chapters/ fájlnév-előtagjai)
"""
import os, subprocess, sys, pathlib

R = pathlib.Path(__file__).resolve().parent
os.chdir(R)
SRC = R / 'src'
BID = os.environ.get('BUILD_ID', '')
MODS = [m for m in os.environ.get('MODULES', '').split(',') if m]
CHS = [c for c in os.environ.get('CHAPTERS', '').split(',') if c]
entry = 'src/js/main.js'
if BID:
    main = (SRC / 'js' / 'main.js').read_text(encoding='utf-8')
    keep = []
    for l in main.splitlines():
        if l.startswith("import './") and l.split("'")[1][2:].split('.js')[0] not in MODS and l.split("'")[1][2:].split('.js')[0] not in ('core', 'ui', 'data', 'hero'):
            continue
        keep.append(l)
    (SRC / 'js' / f'_dev_{BID}.js').write_text('\n'.join(keep) + '\n', encoding='utf-8')
    entry = f'src/js/_dev_{BID}.js'
outjs = f'dist/app{"-" + BID if BID else ""}.js'
r = subprocess.run(['npx', 'esbuild', entry, '--bundle', '--format=iife', '--minify', '--target=es2019', '--loader:.json=json',
                    '--outfile=' + outjs, '--log-level=warning', '--legal-comments=none'], capture_output=True, text=True)
if r.returncode:
    print(r.stderr); sys.exit(1)
if r.stderr.strip():
    print(r.stderr)

css = (SRC / 'fonts.css').read_text(encoding='utf-8') + (SRC / 'style.css').read_text(encoding='utf-8') + ''.join('\n/* ' + p.name + ' */\n' + p.read_text(encoding='utf-8') for p in sorted((SRC / 'css').glob('*.css')))
body = (SRC / 'index.src.html').read_text(encoding='utf-8')
chapters = ''.join((p.read_text(encoding='utf-8') + '\n') for p in sorted((SRC / 'chapters').glob('*.html')) if not CHS or any(p.name.startswith(c) for c in CHS))
body = body.replace('<!--CHAPTERS-->', chapters)
js = (R / outjs).read_text(encoding='utf-8').replace('</script', '<\\/script')

TITLE = 'Mélyalapozások'
DESC = ('Interaktív tananyag a mélyalapozásokról: cölöpök csoportosítása, előregyártott, Franki-, csavart, CFA-, béléscsöves és zagyos cölöpök, '
        'mikrocölöp, jet-grouting, résfal, kút- és szekrényalapozás – 3D cölöpépítővel, laborokkal, kvízekkel és a BME valós felvételeivel.')
fonts = ('<link rel="preload" href="fonts/big-shoulders-display-latin-900-normal.woff2" as="font" type="font/woff2" crossorigin>'
         '<link rel="preload" href="fonts/public-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>')
icon = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Crect width='36' height='36' rx='9' fill='%2316212c'/%3E"
        "%3Ccircle cx='18' cy='18' r='10.5' fill='none' stroke='%23f0864a' stroke-width='2.6'/%3E%3Ccircle cx='18' cy='18' r='5' fill='%23f0864a'/%3E"
        "%3Cpath d='M18 3v5M18 28v5M3 18h5M28 18h5' stroke='%23c9d3dc' stroke-width='2'/%3E%3C/svg%3E")
theme_boot = "<script>try{var t=localStorage.getItem('mz-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}</script>"
hyph = ('<script src="vendor/hyphenopoly/Hyphenopoly_Loader.js"></script>\n'
        '<script>Hyphenopoly.config({ require: { "hu": "FORCEHYPHENOPOLY" }, setup: { hide: "none", selectors: { ".hyphenate": { minWordLength: 6, compound: "auto" } } } });</script>')
html = f'''<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#16212c">
<meta property="og:title" content="{TITLE} – interaktív tananyag">
<meta property="og:description" content="{DESC}">
<meta property="og:image" content="img/og.jpg">
<link rel="icon" href="{icon}">
{theme_boot}
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
outname = f'dev-{BID}.html' if BID else 'index.html'
(R.parent / outname).write_text(html, encoding='utf-8')
print(outname, len(html) // 1024, 'KB')
