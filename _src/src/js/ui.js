// Oldalkeret: téma, navigáció (cölöpsor), fejezetfejek, saját videók, BME YouTube-kártyák,
// galéria, fülek, kvíz, igaz/hamis, megjelenés görgetéskor, formázás-őr
import { $, $$, h, fireTheme, GUARD } from './core.js';
import { CHAPTERS, VIDEOS, YT, YT_GROUPS } from './data.js';

/* ---------------------------------------------------------------- téma */
function initTheme() {
  const root = document.documentElement;
  try { const t = localStorage.getItem('mz-theme'); if (t === 'dark' || t === 'light') root.dataset.theme = t; } catch (e) {}
  const btn = $('#themeBtn');
  if (!btn) return;
  const isD = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const paint = () => {
    btn.innerHTML = isD()
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>';
    btn.setAttribute('aria-label', isD() ? 'Világos téma' : 'Sötét téma');
  };
  btn.addEventListener('click', () => {
    root.dataset.theme = isD() ? 'light' : 'dark';
    try { localStorage.setItem('mz-theme', root.dataset.theme); } catch (e) {}
    paint(); fireTheme();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', paint);
  paint();
}

/* ---------------------------------------------------------------- cölöp-ikon */
export function pileSVG(label, grp, size = 40) {
  const c = `var(--g${grp})`;
  return `<svg class="pile" viewBox="0 0 40 40" width="${size}" height="${size}" style="--grpc:${c}" aria-hidden="true">
    <circle class="ring" cx="20" cy="20" r="18"/><circle class="core" cx="20" cy="20" r="13.5"/>
    <path class="cross" d="M20 1v8M20 31v8M1 20h8M31 20h8"/>
    <text x="20" y="24" text-anchor="middle">${label.replace(/^C/, '')}</text></svg>`;
}
function bigPile(label, grp) {
  return `<svg viewBox="0 0 120 120" aria-hidden="true">
    <circle class="o2" cx="60" cy="60" r="57"/><circle class="in" cx="60" cy="60" r="44"/><circle class="o" cx="60" cy="60" r="44"/>
    <path class="x" d="M60 0v20M60 100v20M0 60h20M100 60h20"/>
    <text x="60" y="66" text-anchor="middle">${label}</text>
    <text class="s" x="60" y="84" text-anchor="middle">CÖLÖP</text></svg>`;
}
function initChapterPiles() {
  $$('section.ch[data-pile]').forEach((s) => {
    const c = CHAPTERS.find((x) => x.id === s.id);
    const box = $('.ch-pile', s);
    if (box && c) box.innerHTML = bigPile(c.pile, c.grp);
  });
}

/* ---------------------------------------------------------------- navigáció */
function initNav() {
  const chs = CHAPTERS.map((c) => ({ ...c, el: document.getElementById(c.id) })).filter((c) => c.el);
  const topnav = $('#topnav'), plan = $('#navplan'), rail = $('#pilerail');
  for (const c of chs) {
    topnav?.append(h('a', { href: '#' + c.id, 'data-ch': c.id }, c.nav));
    plan?.append(h('a', { href: '#' + c.id, 'data-ch': c.id, html: pileSVG(c.pile, c.grp, 40) + `<span>${c.t}</span>` }));
    rail?.append(h('a', { href: '#' + c.id, 'data-ch': c.id, 'aria-label': `${c.pile} – ${c.t}`, html: pileSVG(c.pile, c.grp, 30) + `<span>${c.pile} · ${c.t}</span>` }));
  }
  const sheet = $('#navsheet');
  $('#menuBtn')?.addEventListener('click', () => { sheet.hidden = false; });
  sheet?.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('a') || e.target.closest('.x')) sheet.hidden = true; });
  const ro = $('#rigPile'), roT = $('#rigName');
  let cur = null;
  const upd = () => {
    const y = scrollY + innerHeight * 0.3;
    let i = -1;
    for (let k = 0; k < chs.length; k++) if (chs[k].el.offsetTop <= y) i = k;
    const id = i >= 0 ? chs[i].id : null;
    rail?.classList.toggle('show', scrollY > (document.getElementById('bevezeto')?.offsetHeight || 400) - 200);
    if (cur === id) return;
    cur = id;
    $$('[data-ch]').forEach((el) => {
      const k = chs.findIndex((c) => c.id === el.dataset.ch);
      el.classList.toggle('on', el.dataset.ch === cur);
      const p = $('.pile', el);
      if (p) { p.classList.toggle('cur', k === i); p.classList.toggle('done', k < i); }
    });
    const c = chs[i];
    if (ro) ro.textContent = c ? c.pile : 'C00';
    if (roT) roT.textContent = c ? c.t : 'Kitűzés';
    document.documentElement.style.setProperty('--grp-cur', c ? `var(--g${c.grp})` : 'var(--accent)');
    const dot = $('.rigro i'); if (dot) dot.style.background = c ? `var(--g${c.grp})` : '';
  };
  addEventListener('scroll', upd, { passive: true });
  addEventListener('resize', upd);
  upd();
}

/* ---------------------------------------------------------------- saját videók */
const VMAP = Object.fromEntries(VIDEOS.map((v) => [v.n, v]));
const thumb = (n) => h('div', { class: 'vthumb' }, h('img', { src: `img/thumb/${n}.jpg`, alt: '', loading: 'lazy', decoding: 'async', onerror: (e) => { e.target.style.visibility = 'hidden'; } }), h('span', { class: 'vplay' }), h('span', { class: 'vdur' }, VMAP[n]?.d || ''));
const order = VIDEOS.map((v) => v.n); let curIdx = 0;
function openVideo(n) {
  const v = VMAP[n]; if (!v) return;
  curIdx = order.indexOf(n);
  const m = $('#vmodal');
  $('#vmTitle', m).textContent = `${v.t}`;
  $('#vmFrame', m).src = `video/${n}.html#autoplay`;
  $('#vmInfo', m).textContent = `${curIdx + 1} / ${order.length} · ${v.d} · zene: ${v.g}`;
  m.hidden = false; document.body.style.overflow = 'hidden';
  setTimeout(() => $('#vmFrame', m).focus(), 300);
}
function closeVideo() {
  const m = $('#vmodal'); if (!m || m.hidden) return;
  $('#vmFrame', m).src = 'about:blank'; m.hidden = true; document.body.style.overflow = '';
}
function initVideos() {
  $$('.vcard[data-video]').forEach((b) => {
    const v = VMAP[b.dataset.video]; if (!v) return;
    b.classList.add('grp' + v.grp);
    b.append(thumb(v.n), h('div', { class: 'vmeta' }, h('div', { class: 'vk' }, `Magyarázó animáció · ${order.indexOf(v.n) + 1} / ${order.length}`), h('b', {}, v.t), h('span', {}, v.s)));
    b.addEventListener('click', () => openVideo(v.n));
    b.setAttribute('aria-label', `Videó lejátszása: ${v.t}`);
  });
  const lib = $('#vlib');
  if (lib) {
    const grid = h('div', { class: 'vgrid' });
    for (const v of VIDEOS) grid.append(h('button', { class: 'vtile grp' + v.grp, type: 'button', onclick: () => openVideo(v.n), 'aria-label': 'Videó: ' + v.t }, thumb(v.n), h('span', { class: 'vk' }, `${order.indexOf(v.n) + 1} · ${v.g}`), h('b', {}, v.t), h('span', { class: 'small muted', style: { padding: '0 4px' } }, v.s)));
    lib.append(grid);
  }
  const m = $('#vmodal');
  m?.addEventListener('click', (e) => { if (e.target === m) closeVideo(); });
  $('#vmClose')?.addEventListener('click', closeVideo);
  $('#vmPrev')?.addEventListener('click', () => openVideo(order[(curIdx - 1 + order.length) % order.length]));
  $('#vmNext')?.addEventListener('click', () => openVideo(order[(curIdx + 1) % order.length]));
  addEventListener('message', (e) => { if (e.data && e.data.type === 'mt-video-close') closeVideo(); });
}

/* ---------------------------------------------------------------- BME YouTube-kártyák */
const ytImg = (id, f) => `img/yt/${id}/${f}`;
function openYT(id) {
  const y = YT[id]; if (!y) return;
  const m = $('#ytmodal');
  $('#ytTitle', m).textContent = y.title;
  $('#ytFrame', m).src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  const a = $('#ytOpen', m); a.href = `https://www.youtube.com/watch?v=${id}` + (y.list ? `&list=${y.list}` : '');
  $('#ytInfo', m).textContent = `BME Építőmérnöki Kar · ${y.dur}` + (y.playlist ? ` · ${y.playlist} lejátszási lista` : '');
  m.hidden = false; document.body.style.overflow = 'hidden';
}
function closeYT() { const m = $('#ytmodal'); if (!m || m.hidden) return; $('#ytFrame', m).src = 'about:blank'; m.hidden = true; document.body.style.overflow = ''; }
/** Nagy kártya: <div data-ytc="ID"></div> (opcionális data-kick, data-caps="a|b|c|d") */
export function ytCard(el, id) {
  const y = YT[id]; if (!y) { console.warn('Nincs ilyen YouTube-videó:', id); return; }
  const caps = el.dataset.caps ? el.dataset.caps.split('|') : y.caps;
  el.classList.add('ytc'); el.innerHTML = '';
  const go = () => openYT(id);
  const board = h('div', { class: 'ytc-board' },
    ...[1, 2, 3, 4].map((k) => h('figure', { class: 'ytc-pol p' + k, onclick: go }, h('img', { src: ytImg(id, `p${k}.jpg`), alt: caps[k - 1] || '', loading: 'lazy', decoding: 'async' }), h('figcaption', {}, caps[k - 1] || ''))),
    h('button', { class: 'ytc-main', type: 'button', onclick: go, 'aria-label': 'Videó lejátszása: ' + y.title }, h('img', { src: ytImg(id, 't.jpg'), alt: '', loading: 'lazy', decoding: 'async' }), h('span', { class: 'ytc-yt' })));
  const url = `https://youtu.be/${id}`;
  el.append(
    h('div', { class: 'ytc-head' }, h('div', { class: 'ytc-kick' }, el.dataset.kick || y.kick), h('div', { class: 'ytc-title' }, 'Nézd meg élőben is!')),
    h('div', { class: 'ytc-qr' }, h('img', { src: ytImg(id, 'qr.png'), alt: 'QR-kód: ' + url, loading: 'lazy' })),
    board,
    h('div', { class: 'ytc-bar' }, h('span', { class: 'ytc-logo', 'aria-hidden': 'true' }),
      h('div', {}, h('b', {}, y.title), h('small', {}, 'BME Építőmérnöki Kar · YouTube' + (y.playlist ? ` · ${y.playlist} lejátszási lista` : '') + ` · ${y.dur}`)),
      h('a', { class: 'ytc-link', href: `https://www.youtube.com/watch?v=${id}` + (y.list ? `&list=${y.list}` : ''), target: '_blank', rel: 'noopener' }, h('span', { class: 'u' }, `youtu.be/${id}`), h('span', { class: 'h' }, '▶ kattints a képre, vagy nyisd meg a YouTube-on ↗'))));
}
/** Kis kártya: <button data-ytm="ID"></button> */
export function ytMini(el, id) {
  const y = YT[id]; if (!y) return;
  el.classList.add('ytm'); el.innerHTML = ''; el.type = 'button';
  el.append(h('div', { class: 'th' }, h('img', { src: ytImg(id, 't.jpg'), alt: '', loading: 'lazy' }), h('span', { class: 'ytc-yt' }), h('span', { class: 'd' }, y.dur)),
    h('div', { class: 'strip' }, ...[1, 2, 3, 4].map((k) => h('img', { src: ytImg(id, `p${k}.jpg`), alt: '', loading: 'lazy' }))),
    h('div', { class: 'm' }, h('small', {}, 'BME Építőmérnöki Kar · YouTube'), h('b', {}, y.tech)));
  el.addEventListener('click', () => openYT(id));
  el.setAttribute('aria-label', 'YouTube-videó: ' + y.title);
}
function initYT() {
  $$('[data-ytc]').forEach((el) => ytCard(el, el.dataset.ytc));
  $$('[data-ytm]').forEach((el) => ytMini(el, el.dataset.ytm));
  const lib = $('#ytlib');
  if (lib) for (const g of YT_GROUPS) {
    lib.append(h('div', { class: 'vgroup grp' + g.grp }, g.t));
    const grid = h('div', { class: 'ytgrid' });
    for (const id of g.ids) { const b = h('button', {}); ytMini(b, id); grid.append(b); }
    lib.append(grid);
  }
  const m = $('#ytmodal');
  m?.addEventListener('click', (e) => { if (e.target === m) closeYT(); });
  $('#ytClose')?.addEventListener('click', closeYT);
}

/* ---------------------------------------------------------------- galéria + nagyítás */
function closeLightbox() { const lb = $('#lightbox'); if (lb && !lb.hidden) { lb.hidden = true; document.body.style.overflow = ''; } }
function initGallery() {
  const lb = $('#lightbox');
  document.addEventListener('click', (e) => {
    const f = e.target.closest('.gal figure, figure.zoom, figure.fig-ppt');
    if (!f) return;
    const img = $('img', f); if (!img) return;
    $('img', lb).src = img.currentSrc || img.src; $('img', lb).alt = img.alt;
    $('p', lb).textContent = $('figcaption', f)?.textContent || img.alt || '';
    lb.hidden = false; document.body.style.overflow = 'hidden';
  });
  lb?.addEventListener('click', closeLightbox);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeVideo(); closeYT(); closeLightbox(); } });
}

/* ---------------------------------------------------------------- fülek */
function initTabs() {
  $$('[data-tabs]').forEach((box) => {
    const btns = $$(':scope > .tabs-b button', box);
    const panels = $$(':scope > [data-panel]', box);
    const show = (k) => { btns.forEach((b) => b.classList.toggle('on', b.dataset.tab === k)); panels.forEach((p) => { p.hidden = p.dataset.panel !== k; }); window.dispatchEvent(new Event('resize')); };
    btns.forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));
    show(btns[0]?.dataset.tab);
  });
}

/* ---------------------------------------------------------------- kvíz */
const QUIZ = new Map();
/**
 * defineQuiz('furt', 'Kvíz – fúrt cölöpök', [{q:'Kérdés?', a:['Helyes','Rossz','Rossz'], c:0, e:'Magyarázat'}])
 * A HTML-ben: <div class="quiz" data-quiz="furt"></div>
 * A helyes válasz helyét determinisztikusan keverjük: kérdésről kérdésre változik, kétszer egymás után nem ugyanaz.
 */
export function defineQuiz(key, title, qs) { QUIZ.set(key, { title, qs }); }
function hashStr(s) { let x = 2166136261; for (const ch of s) { x ^= ch.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; }
function balance(key, qs) {
  let seed = hashStr(key), prev = -1;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  return qs.map((q) => {
    if (q.fixed) { prev = q.c; return { ...q }; }
    const n = q.a.length; let pos;
    do { pos = Math.floor(rnd() * n); } while (pos === prev && n > 1);
    prev = pos;
    const others = q.a.filter((_, i) => i !== q.c);
    for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
    const a = [...others]; a.splice(pos, 0, q.a[q.c]);
    return { ...q, a, c: pos };
  });
}
function initQuiz() {
  $$('.quiz[data-quiz]').forEach((box) => {
    const def = QUIZ.get(box.dataset.quiz); if (!def) { console.warn('Nincs kvíz:', box.dataset.quiz); return; }
    let qs, i, res;
    const head = h('div', { class: 'quiz-head' }, h('b', {}, def.title), h('span', {}));
    const body = h('div', { class: 'quiz-body' });
    box.append(head, body);
    const start = () => { qs = balance(box.dataset.quiz, def.qs); i = 0; res = qs.map(() => null); render(); };
    const render = () => {
      body.innerHTML = '';
      $('span', head).textContent = `${res.filter((r) => r === true).length} / ${qs.length}`;
      if (i >= qs.length) {
        const ok = res.filter(Boolean).length;
        const msg = ok === qs.length ? 'Hibátlan! Ez a cölöp a teherbíró rétegig ér.' : ok >= qs.length * 0.7 ? 'Szép eredmény – a hibásakat érdemes még egyszer átnézni.' : 'Érdemes a fejezetet (és a videókat) még egyszer átnézni.';
        body.append(h('div', { class: 'q-res' }, h('b', {}, `${ok} / ${qs.length}`), h('p', { class: 'center' }, msg), h('button', { class: 'btn btn-line', type: 'button', onclick: start }, 'Újra')));
        return;
      }
      const q = qs[i];
      const exp = h('div', { class: 'q-exp', hidden: true });
      const next = h('button', { class: 'btn btn-line btn-sm', type: 'button', disabled: true, onclick: () => { i++; render(); } }, i === qs.length - 1 ? 'Eredmény' : 'Következő →');
      const opts = h('div', { class: 'q-opts' });
      q.a.forEach((t, k) => {
        const b = h('button', { type: 'button' }, h('i', {}, 'ABCDE'[k]), h('span', { html: t }));
        b.addEventListener('click', () => {
          if (res[i] !== null) return;
          res[i] = k === q.c;
          $$('button', opts).forEach((x, kk) => { x.disabled = true; if (kk === q.c) x.classList.add('right'); });
          if (k !== q.c) b.classList.add('wrong');
          exp.hidden = false; exp.innerHTML = (res[i] ? '<b>Helyes.</b> ' : '<b>Nem egészen.</b> ') + (q.e || '');
          next.disabled = false;
          $('span', head).textContent = `${res.filter((r) => r === true).length} / ${qs.length}`;
          dots();
        });
        opts.append(b);
      });
      const dotBox = h('div', { class: 'q-dots' });
      const dots = () => { dotBox.innerHTML = ''; res.forEach((r, k) => dotBox.append(h('i', { class: (r === true ? 'ok' : r === false ? 'bad' : '') + (k === i ? ' cur' : '') }))); };
      dots();
      body.append(h('div', { class: 'q-n' }, `${i + 1}. kérdés / ${qs.length}`), h('div', { class: 'q-t', html: q.q }), opts, exp, h('div', { class: 'q-nav' }, dotBox, next));
    };
    start();
  });
}

/* ---------------------------------------------------------------- igaz/hamis */
let TF = [];
/** defineTF([{s:'Állítás', v:true, e:'Magyarázat'}]) – a HTML-ben: <div id="tf"></div> */
export function defineTF(list) { TF = list; }
function initTF() {
  const box = $('#tf'); if (!box || !TF.length) return;
  const items = h('div', { class: 'tf' });
  const score = h('div', { class: 'tf-score' });
  let ans = TF.map(() => null);
  const upd = () => {
    const done = ans.filter((a) => a !== null).length, ok = ans.filter((a) => a === true).length;
    score.innerHTML = `<span>Megválaszolva: <b>${done}/${TF.length}</b></span><span>Helyes: <b>${ok}</b></span>` + (done === TF.length ? `<span>${ok >= TF.length * 0.9 ? 'Kiváló!' : ok >= TF.length * 0.7 ? 'Jó eredmény!' : 'Érdemes ismételni.'}</span>` : '');
    score.append(h('button', { type: 'button', onclick: reset }, 'Újrakezdés'));
  };
  const reset = () => { ans = TF.map(() => null); build(); upd(); };
  const build = () => {
    items.innerHTML = '';
    TF.forEach((it, k) => {
      const e = h('div', { class: 'e', hidden: true });
      const row = h('div', { class: 'tf-item' });
      const bt = h('button', { type: 'button' }, 'Igaz'), bf = h('button', { type: 'button' }, 'Hamis');
      const pick = (val, b) => {
        if (ans[k] !== null) return;
        ans[k] = val === it.v;
        b.classList.add('sel', ans[k] ? 'right' : 'wrong');
        bt.disabled = bf.disabled = true;
        row.classList.add(ans[k] ? 'ok' : 'bad');
        e.hidden = false; e.innerHTML = `<b>${it.v ? 'Igaz.' : 'Hamis.'}</b> ` + (it.e || '');
        upd();
      };
      bt.addEventListener('click', () => pick(true, bt)); bf.addEventListener('click', () => pick(false, bf));
      row.append(h('span', { class: 'n' }, String(k + 1).padStart(2, '0')), h('span', { class: 's', html: it.s }), h('span', { class: 'tf-btns' }, bt, bf), e);
      items.append(row);
    });
  };
  build(); upd();
  box.append(items, score);
}

/* ---------------------------------------------------------------- megjelenés görgetéskor */
function initReveal() {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));
}

export function initUI() {
  initTheme(); initChapterPiles(); initNav(); initVideos(); initYT(); initGallery(); initTabs(); initQuiz(); initTF(); initReveal();
}
export function startGuard() { try { GUARD.start(); } catch (e) { console.error('Formázás-őr hiba', e); } }
