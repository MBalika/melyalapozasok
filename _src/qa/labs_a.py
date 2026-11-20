# C01–C04 laborjainak állapotbejárója: minden fül, a csúszkák két vége, lejátszott animációk; kép + kijelzett értékek (info.json)
import asyncio, sys, os, json
from playwright.async_api import async_playwright
from PIL import Image
# usage: labs.py url outdir width theme lang [only-prefix]
url, out, W, theme, lang = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], sys.argv[5]
only = sys.argv[6] if len(sys.argv) > 6 else ''
os.makedirs(out, exist_ok=True)
ARGS = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
HU = lang == 'hu'
def tr(hu, en): return hu if HU else en
# (név, widget, lépések) – lépés: ('btn', szöveg) | ('sl', index, érték) | ('wait', ms) | ('tog', index) | ('sel', index, value) | ('nth', n)  n-edik gomb
S = [
 ('tt_all', 'alap-tipusterkep', []),
 ('tt_colop', 'alap-tipusterkep', [('nth', 1)]), ('tt_resfal', 'alap-tipusterkep', [('nth', 2)]), ('tt_kut', 'alap-tipusterkep', [('nth', 3)]),
 ('tt_szekr', 'alap-tipusterkep', [('nth', 4)]), ('tt_atm', 'alap-tipusterkep', [('nth', 5)]),
 ('dontes_def', 'alap-dontes', []),
 ('dontes_max', 'alap-dontes', [('sl', 0, 24), ('sl', 1, 40), ('nth', 2), ('sl', 2, 0), ('tog', 0), ('tog', 1)]),
 ('dontes_min', 'alap-dontes', [('sl', 0, 0.5), ('sl', 1, 1), ('nth', 0), ('sl', 2, 12), ('tog', 0), ('tog', 1)]),
 ('dontes_tomb', 'alap-dontes', [('sl', 0, 5), ('sl', 1, 12), ('sl', 2, 8)]),
 ('torony_real', 'alap-tornyok', []), ('torony_zoom', 'alap-tornyok', [('nth', 1)]), ('torony_burj', 'alap-tornyok', [('nth', 7)]), ('torony_panel', 'alap-tornyok', [('nth', 2), ('nth', 0)]),
 ('kimos_arviz', 'alap-kimosas', [('sl', 0, 4), ('wait', 9000)]),
 ('kimos_colop', 'alap-kimosas', [('nth', 1), ('wait', 9000)]),
 ('reszek_tomb', 'alap-reszek', []), ('reszek_racs', 'alap-reszek', [('nth', 1)]), ('reszek_lemez', 'alap-reszek', [('nth', 2)]),
 ('teher_A', 'rsz-teher', []), ('teher_A_short', 'rsz-teher', [('sl', 1, 4), ('sl', 2, 1.5)]), ('teher_A_long', 'rsz-teher', [('sl', 1, 30), ('sl', 2, 0.3), ('sl', 0, 4)]),
 ('teher_C', 'rsz-teher', [('nth', 1), ('sl', 0, 10), ('sl', 1, 13), ('sl', 2, 0.6)]), ('teher_B', 'rsz-teher', [('nth', 2), ('sl', 1, 22)]),
 ('csop_szel', 'rsz-csoport', []), ('csop_epulet', 'rsz-csoport', [('nth', 0), ('wait', 1200)]), ('csop_felusz', 'rsz-csoport', [('nth', 2), ('wait', 1200)]), ('csop_fek', 'rsz-csoport', [('nth', 3), ('wait', 1200)]),
 ('csop_max', 'rsz-csoport', [('sl', 0, 6000), ('sl', 1, 1000), ('sl', 2, 30), ('wait', 1200)]),
 ('valog', 'rsz-valogato', [('btn', tr('Megoldás', 'Solution'))]),
 ('atm_10', 'rsz-atmero', [('sl', 0, 10)]), ('atm_200', 'rsz-atmero', [('sl', 0, 200)]),
 ('mod_veres', 'elo-modok', [('wait', 2500)]), ('mod_vibro', 'elo-modok', [('nth', 1), ('wait', 3000)]), ('mod_sajto', 'elo-modok', [('nth', 2), ('wait', 3000)]), ('mod_csavar', 'elo-modok', [('nth', 3), ('wait', 4000)]),
 ('veres_A', 'elo-veres', [('nth', 7), ('wait', 30000)]),
 ('veres_B', 'elo-veres', [('sel', 0, 'B'), ('nth', 7), ('wait', 9000)]),
 ('veres_C_H', 'elo-veres', [('sel', 0, 'C'), ('nth', 5), ('nth', 7), ('wait', 30000)]),
 ('veres_D', 'elo-veres', [('sel', 0, 'D'), ('nth', 3), ('sl', 0, 9), ('sl', 1, 1.5), ('nth', 7), ('wait', 9000)]),
 ('vibro_opt', 'elo-vibro', [('sl', 0, 23), ('wait', 600)]), ('vibro_agyag', 'elo-vibro', [('nth', 2), ('sl', 0, 14), ('tog', 0), ('wait', 600)]), ('vibro_45', 'elo-vibro', [('nth', 1), ('sl', 0, 45), ('wait', 600)]),
 ('rezg_def', 'elo-rezges', []), ('rezg_vibro', 'elo-rezges', [('sel', 0, 'vibro'), ('sl', 1, 2)]), ('rezg_cfa', 'elo-rezges', [('sel', 0, 'cfa'), ('nth', 2), ('sl', 1, 60)]),
 ('rezg_max', 'elo-rezges', [('sel', 0, 'vert'), ('sl', 0, 80), ('nth', 0), ('sl', 1, 2)]),
 ('resz_100', 'hsz-reszecske', []), ('resz_50', 'hsz-reszecske', [('sl', 0, 50)]),
] + [('franki_%d' % (i + 1), 'hsz-franki', [('nth', i), ('wait', 400)]) for i in range(7)] + [
 ('franki_n8', 'hsz-franki', [('nth', 6), ('sl', 0, 8)]), ('franki_n1', 'hsz-franki', [('nth', 6), ('sl', 0, 1)]),
 ('csav_done', 'hsz-csavart', [('wait', 16000)]),
 ('csav_stuck', 'hsz-csavart', [('sel', 0, 'tomor'), ('nth', 3), ('wait', 6000)]),
 ('csav_fdp600', 'hsz-csavart', [('sel', 0, 'kozep'), ('nth', 2), ('sl', 0, 600), ('sl', 1, 20), ('nth', 3), ('wait', 9000)]),
 ('csav_drill', 'hsz-csavart', [('sel', 0, 'agyag'), ('nth', 1), ('sl', 0, 300), ('sl', 1, 6), ('nth', 3), ('wait', 1500)]),
]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': W, 'height': 1000}, device_scale_factor=1)
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)[:300]))
        pg.on('console', lambda m: errs.append('CONSOLE ' + m.text[:300]) if m.type == 'error' else None)
        await pg.goto(url, wait_until='domcontentloaded'); await pg.wait_for_timeout(2500)
        if theme == 'dark': await pg.evaluate("document.getElementById('themeBtn').click()"); await pg.wait_for_timeout(400)
        info = {}
        for name, w, steps in S:
            if only and not name.startswith(only): continue
            root = pg.locator(f'[data-w="{w}"]').first
            try:
                await root.scroll_into_view_if_needed(timeout=5000); await pg.wait_for_timeout(500)
                for st in steps:
                    if st[0] == 'btn': await root.locator('button', has_text=st[1]).first.click()
                    elif st[0] == 'nth': await root.locator('button').nth(st[1]).click()
                    elif st[0] == 'sl': await root.locator('input[type=range]').nth(st[1]).evaluate("(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))}", st[2])
                    elif st[0] == 'tog': await root.locator('label.tog').nth(st[1]).click()
                    elif st[0] == 'sel': await root.locator('select').nth(st[1]).select_option(st[2])
                    elif st[0] == 'wait': await pg.wait_for_timeout(st[1])
                    await pg.wait_for_timeout(120)
                await pg.wait_for_timeout(500)
                await root.screenshot(path=f'{out}/{name}.png')
                info[name] = await root.evaluate("e=>[...e.querySelectorAll('.stat')].map(s=>s.innerText.replace(/\\n/g,' ')).join(' | ')+' || '+[...e.querySelectorAll('.verdict')].map(s=>s.innerText.replace(/\\n/g,' ')).join(' / ')")
            except Exception as e: print('FAIL', name, str(e)[:200])
        json.dump(info, open(f'{out}/info.json', 'w'), ensure_ascii=False, indent=1)
        print('\n'.join(errs[:10])); await b.close()
asyncio.run(main())
