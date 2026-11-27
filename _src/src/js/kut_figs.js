// C08 – saját, statikus SVG-ábrák (a régi szkennelt PPT-rajzok helyett)
// Használat a HTML-ben: <div class="kf-svg" data-kfig="kotro"></div> – betöltéskor rajzolódik.
import { svg, pathD, EN } from './core.js';

import { artKotro, artSema, artEro, artValt, artEdge, artNyitott, artGenf, artKeszon } from './kut_art.js';
const NS = (p, tag, a = {}) => svg(tag, a, p);
const mk = (el, w, hh, label) => { const s = svg('svg', { viewBox: `0 0 ${w} ${hh}`, class: 'kf', role: 'img', 'aria-label': label || '' }); el.appendChild(s); return s; };
const G = (p, a = {}) => NS(p, 'g', a);
const R = (p, x, y, w, hh, cls = '', a = {}) => NS(p, 'rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), class: cls, ...a });
const P = (p, d, cls = '', a = {}) => NS(p, 'path', { d, class: cls, ...a });
const C = (p, cx, cy, r, cls = '', a = {}) => NS(p, 'circle', { cx, cy, r, class: cls, ...a });
const L = (p, x1, y1, x2, y2, cls = 'kf-ln', a = {}) => NS(p, 'line', { x1, y1, x2, y2, class: cls, ...a });
const poly = (pts, close = true) => pathD(pts, close);
/** felirat; s-ben _x vagy _{xy} alsó index */
function T(p, x, y, s, cls = 'kf-t', a = {}) {
  const t = NS(p, 'text', { x, y, class: cls, ...a });
  const re = /_\{([^}]*)\}|_(\S)/g; let i = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > i) t.appendChild(document.createTextNode(s.slice(i, m.index)));
    // alsó index dy-nal (a baseline-shift nem minden böngészőben működik); a nulla szélességű tspan visszaemeli az alapvonalat
    NS(t, 'tspan', { dy: '0.3em', 'font-size': '72%', text: m[1] ?? m[2] });
    NS(t, 'tspan', { dy: '-0.3em', 'font-size': '72%', text: '\u200b' });
    i = m.index + m[0].length;
  }
  if (i < s.length) t.appendChild(document.createTextNode(s.slice(i)));
  return t;
}
function arw(p, x1, y1, x2, y2, cls = 'kf-ar', hd = 8) {
  const g = G(p, { class: cls });
  const a = Math.atan2(y2 - y1, x2 - x1);
  NS(g, 'line', { x1, y1, x2: x2 - Math.cos(a) * hd * 0.7, y2: y2 - Math.sin(a) * hd * 0.7 });
  NS(g, 'path', { d: poly([[x2, y2], [x2 - Math.cos(a - 0.42) * hd, y2 - Math.sin(a - 0.42) * hd], [x2 - Math.cos(a + 0.42) * hd, y2 - Math.sin(a + 0.42) * hd]]) });
  return g;
}
/** vezetővonal + felirat: a pontból (x1,y1) a felirathoz (x2,y2) */
function lead(p, x1, y1, x2, y2, s, anchor = 'start', cls = 'kf-t') {
  L(p, x1, y1, x2, y2, 'kf-lead');
  C(p, x1, y1, 2.4, 'kf-dot');
  const dx = anchor === 'end' ? -4 : anchor === 'middle' ? 0 : 4;
  return T(p, x2 + dx, y2 + 5, s, cls + ' halo', { 'text-anchor': anchor });
}
function dimV(p, x, y1, y2, s, side = 1, cls = 'kf-n', rot = false) {
  L(p, x, y1, x, y2, 'kf-dim');
  L(p, x - 5, y1, x + 5, y1, 'kf-dim'); L(p, x - 5, y2, x + 5, y2, 'kf-dim');
  const my = (y1 + y2) / 2;
  if (rot) { const tx = x + side * 12; return T(p, tx, my, s, cls + ' halo', { 'text-anchor': 'middle', transform: `rotate(-90 ${tx} ${my})`, dy: side > 0 ? '0.35em' : '0.35em' }); }
  return T(p, x + side * 7, my + 5, s, cls + ' halo', { 'text-anchor': side > 0 ? 'start' : 'end' });
}
function dimH(p, x1, x2, y, s, cls = 'kf-n') {
  L(p, x1, y, x2, y, 'kf-dim');
  L(p, x1, y - 5, x1, y + 5, 'kf-dim'); L(p, x2, y - 5, x2, y + 5, 'kf-dim');
  return T(p, (x1 + x2) / 2, y - 7, s, cls + ' halo', { 'text-anchor': 'middle' });
}
/** szint-jel (háromszög + érték) */
function lvl(p, x, y, s, anchor = 'start') {
  P(p, poly([[x, y], [x - 6, y - 9], [x + 6, y - 9]]), 'kf-lvl');
  L(p, x - 14, y, x + 14, y, 'kf-ln');
  T(p, x + (anchor === 'end' ? -10 : 9), y - 4, s, 'kf-n halo', { 'text-anchor': anchor });
}
function soil(p, x, y, w, hh, cls = 'f-soilA', pat = 'pat-sand', op = 0.8) {
  R(p, x, y, w, hh, cls);
  if (pat) R(p, x, y, w, hh, '', { fill: `url(#${pat})`, opacity: op });
}
/** vasbeton (vagy beton) kitöltés + körvonal */
function conc(p, d, cls = 'f-conc') {
  P(p, d, cls);
  P(p, d, '', { fill: 'url(#pat-conc)', opacity: 0.9 });
  return P(p, d, 'kf-out');
}
function water(p, x, y, w, hh, op = 1) { R(p, x, y, w, hh, 'f-water', { opacity: op }); R(p, x, y, w, hh, '', { fill: 'url(#pat-water)', opacity: 0.8 * op }); L(p, x, y, x + w, y, 'kf-wl'); }
function grab(p, cx, yb, w = 26, open = 0.5) {
  const g = G(p);
  const o = open * 6;
  R(g, cx - 5, yb - 30, 10, 12, 'f-steel2', { rx: 2 });
  P(g, `M${cx - 3} ${yb - 18} L${cx - w / 2 - o} ${yb - 4} Q${cx - w / 2 - o + 2} ${yb + 3} ${cx - 4} ${yb} Z`, 'f-steel');
  P(g, `M${cx + 3} ${yb - 18} L${cx + w / 2 + o} ${yb - 4} Q${cx + w / 2 + o - 2} ${yb + 3} ${cx + 4} ${yb} Z`, 'f-steel');
  P(g, `M${cx - 3} ${yb - 18} L${cx - w / 2 - o} ${yb - 4} Q${cx - w / 2 - o + 2} ${yb + 3} ${cx - 4} ${yb} Z M${cx + 3} ${yb - 18} L${cx + w / 2 + o} ${yb - 4} Q${cx + w / 2 + o - 2} ${yb + 3} ${cx + 4} ${yb} Z`, 'kf-out');
  C(g, cx, yb - 18, 3, 'f-surface', { class: 'kf-edge f-surface' });
  return g;
}
function person(p, x, y, s = 1) {
  const g = G(p, { transform: `translate(${x} ${y}) scale(${s})`, class: 'kf-man' });
  C(g, 0, -19, 4);
  NS(g, 'path', { d: 'M0 -15 V-5 M0 -5 L-4 3 M0 -5 L4 3 M0 -12 L6 -7 L10 -3 M0 -12 L-5 -8', class: 'kf-manl' });
  P(g, 'M-5 -21 q5 -6 10 0 z', 'f-warn');
  return g;
}

/** több részábra cellákban, cellánként felirattal (data-caps="a|b|c") */
function panels(el, keys, W, H, draw) {
  const caps = (el.dataset.caps || '').split('|');
  keys.forEach((k, i) => {
    const c = document.createElement('div'); c.className = 'kf-cell'; el.appendChild(c);
    const s = mk(c, W, H, (caps[i] || k).replace(/<[^>]+>/g, ''));
    draw[k](s);
    if (caps[i]) { const t = document.createElement('p'); t.className = 'kf-cap'; t.innerHTML = caps[i]; c.appendChild(t); }
  });
}

/* az ábrák rajzolói: kut_art.js (a folyamatábrák elemtárából) */
const figValt = (el) => panels(el, (el.dataset.v || 'gyuru,hengeres,hvall,kupos,kvall,surl').split(','), 200, 300, artValt);
const figEdge = (el) => panels(el, (el.dataset.v || 'vb,szog,elo,geo').split(','), 220, 300, artEdge);
const figGenf = (el) => panels(el, (el.dataset.v || 'u1,u2,u3,u4').split(','), 640, 472, artGenf);

const FIGS = { kotro: artKotro, sema: artSema, ero: artEro, valt: figValt, edge: figEdge, nyitott: artNyitott, genf: figGenf, keszon: artKeszon };
function initKutFigs() {
  document.querySelectorAll('[data-kfig]').forEach((el) => {
    if (el.dataset.kready) return; el.dataset.kready = '1';
    const f = FIGS[el.dataset.kfig];
    if (f) try { f(el); } catch (e) { console.error('kút-ábra hiba', el.dataset.kfig, e); }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initKutFigs); else initKutFigs();
