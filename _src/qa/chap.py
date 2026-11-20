# Egy-egy fejezet (szakasz-azonosító) teljes képe csempékre vágva; több csempe egymás mellett (mobilnézethez)
import asyncio, sys, os
from playwright.async_api import async_playwright
from PIL import Image
# usage: chap.py url outprefix width theme cols tileH id1 id2 ...
url, out, W, theme, cols, TH = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], int(sys.argv[5]), int(sys.argv[6])
ids = sys.argv[7:]
ARGS = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': W, 'height': 1000})
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)[:300]))
        pg.on('console', lambda m: errs.append('CONSOLE ' + m.text[:300]) if m.type == 'error' else None)
        await pg.goto(url, wait_until='networkidle'); await pg.wait_for_timeout(1500)
        if theme == 'dark': await pg.evaluate("document.getElementById('themeBtn').click()"); await pg.wait_for_timeout(400)
        for i in ids:
            box = await pg.evaluate(f"(()=>{{const r=document.getElementById('{i}').getBoundingClientRect();return [r.top+scrollY,r.height]}})()")
            y = box[0]
            while y < box[0] + box[1]:
                await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(350); y += 800
            box = await pg.evaluate(f"(()=>{{const r=document.getElementById('{i}').getBoundingClientRect();return [r.top+scrollY,r.height]}})()")
            await pg.wait_for_timeout(600)
            f = f'{out}_{i}_full.png'
            await pg.locator('#' + i).screenshot(path=f)
            im = Image.open(f).convert('RGB'); w, hh = im.size
            tiles = [im.crop((0, t, w, min(hh, t + TH))) for t in range(0, hh, TH)]
            n = 0
            for k in range(0, len(tiles), cols):
                grp = tiles[k:k + cols]
                sheet = Image.new('RGB', (w * len(grp) + 8 * (len(grp) - 1), TH), 'white')
                for j, t in enumerate(grp): sheet.paste(t, (j * (w + 8), 0))
                sheet.save(f'{out}_{i}_{n:02d}.jpg', quality=80); n += 1
            os.remove(f)
            print(i, hh, 'sheets', n)
        print('\n'.join(errs[:20])); await b.close()
asyncio.run(main())
