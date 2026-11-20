import asyncio, sys, os, json
from playwright.async_api import async_playwright
# batch.py url outdir "parts" [theme]   parts: comma list of sim,simm,hero,herom,misc,miscm
url, out = sys.argv[1], sys.argv[2]
parts = sys.argv[3].split(','); theme = sys.argv[4] if len(sys.argv) > 4 else ''
os.makedirs(out, exist_ok=True)
ARGS = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
SIM = [('cfa','A','0','k',8),('cfa','A','0','t',1),('cfa','A','0','c',1),('cfa','C','1','k',5),('franki','A','0','k',6),('driven','D','0','k',5),('driven','A','0','k',3),('casing','A','1','k',6),('slurry','A','1','k',7),('dry','A','0','k',5),('dry','D','0','t',1),('screw','B','0','k',5),('micro','C','0','k',4),('casing','B','0','t',1),('slurry','C','0','t',1),('franki','B','0','t',1),('screw','C','0','c',1)]
SIMM = [('cfa','A','0','k',5),('franki','A','0','k',3),('slurry','A','1','k',3),('cfa','A','0','t',1)]
import os as _o
if _o.environ.get('SIMSET'): SIM = SIMM = [tuple(x.split(':')[:4]) + (int(x.split(':')[4]),) for x in _o.environ['SIMSET'].split(',')]
errs = []
async def page(b, W, H=1000):
    pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1 if W > 500 else 2)
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)[:300]))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text[:300]) if m.type == 'error' else None)
    await pg.goto(url, wait_until='networkidle'); await pg.wait_for_timeout(1500)
    if theme: await pg.evaluate(f"document.documentElement.setAttribute('data-theme','{theme}')")
    return pg
async def sim(pg, combos, tag):
    s = pg.locator('.w.sim'); await s.scroll_into_view_if_needed(); await pg.wait_for_timeout(2500)
    await pg.evaluate("document.querySelector('.sim-playbtn').click()")
    for tech, prof, fault, view, NP in combos:
        sels = s.locator('select')
        await sels.nth(0).select_option(prof); await sels.nth(1).select_option(tech); await pg.wait_for_timeout(400)
        if fault == '1':
            await pg.evaluate("""()=>{const hs=[...document.querySelectorAll('.w.sim .sim-ctl-h')];const h=hs[2];let e=h.nextElementSibling;(e.querySelector('input')||e).click();}""")
            await pg.wait_for_timeout(300)
        await pg.evaluate("i=>document.querySelectorAll('.sim-views button')[i].click()", {'k': 0, 't': 1, 'c': 2}[view]); await pg.wait_for_timeout(1300)
        pts = [1000] if NP == 1 else [round(1000 * (i + 0.5) / NP) for i in range(NP - 1)] + [1000]
        for n, v in enumerate(pts):
            await pg.evaluate("v=>{const t=document.querySelector('.sim-tl');t.value=v;t.dispatchEvent(new Event('input',{bubbles:true}))}", v)
            await pg.wait_for_timeout(1400 if view == 'k' else 700)
            box = pg.locator('.w.sim .w-viz') if tag == 'm' else pg.locator('.sim-stage')
            await pg.locator('.sim-stage').scroll_into_view_if_needed()
            await box.screenshot(path=f'{out}/sim{tag}_{tech}_{prof}{fault}{view}_{n:02d}.jpg', type='jpeg', quality=78)
async def hero(pg, tag):
    await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(1500)
    for i in range(4):
        await pg.evaluate("i=>document.querySelectorAll('#heroType button')[i].click()", i)
        for d in ([12, 3, 24] if i in (0, 1) else [12]):
            await pg.evaluate("d=>{const t=document.querySelector('#heroDepth');t.value=d;t.dispatchEvent(new Event('input',{bubbles:true}))}", d)
            await pg.wait_for_timeout(1600)
            await pg.locator('.hero-viz').screenshot(path=f'{out}/hero{tag}_{i}_{d}.jpg', type='jpeg', quality=80)
    await pg.evaluate("document.querySelectorAll('#heroType button')[1].click()")
    await pg.locator('section.hero').screenshot(path=f'{out}/hero{tag}_full.jpg', type='jpeg', quality=75)
async def misc(pg, tag):
    for i, sel in enumerate(['.vt-links', 'footer.foot', '.sim-tab', '.sim-check', '.w.sim .w-out, .w.sim', 'header.topbar']):
        try:
            loc = pg.locator(sel).first; await loc.scroll_into_view_if_needed(); await pg.wait_for_timeout(700)
            await loc.screenshot(path=f'{out}/misc{tag}_{i}.jpg', type='jpeg', quality=75)
        except Exception as e: print('FAIL', sel, str(e)[:100])
    print('NAV', await pg.evaluate("(()=>{const n=document.querySelector('#topnav');return [n.scrollWidth,n.clientWidth,innerWidth, document.documentElement.scrollWidth]})()"))
    print('TOUCH', await pg.evaluate("[...document.querySelectorAll('.sim-stage canvas,#hero3d canvas')].map(c=>getComputedStyle(c).touchAction)"))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        if any(x in parts for x in ('sim', 'hero', 'misc')):
            pg = await page(b, 1440)
            if 'hero' in parts: await hero(pg, '')
            if 'sim' in parts: await sim(pg, SIM, '')
            if 'misc' in parts: await misc(pg, '')
            await pg.close()
        if any(x in parts for x in ('simm', 'herom', 'miscm')):
            pg = await page(b, 390, 800)
            if 'herom' in parts: await hero(pg, 'm')
            if 'simm' in parts: await sim(pg, SIMM, 'm')
            if 'miscm' in parts: await misc(pg, 'm')
            await pg.close()
        print('\n'.join(sorted(set(errs))[:12])); await b.close()
asyncio.run(main())
