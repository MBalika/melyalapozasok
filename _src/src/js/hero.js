// Hős: forgatható 3D metszet – egy épület négyféle alapozással a rétegzett talajon.
// A teherbíró réteg mélységével változik, melyik megoldás működik.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { $, h, fmt, clamp } from './core.js';

const TYPES = [
  { v: 'sik', t: 'Síkalap' },
  { v: 'colop', t: 'Cölöpalap' },
  { v: 'resfal', t: 'Résfal' },
  { v: 'kut', t: 'Kútalap' },
];
const W = 30, Z = 16, BOT = 27, ZC = -6.3; // talajtömb (m): szélesség, mélység (z), alja; metszősík z-je
const GW = 2.5;                  // talajvíz a terep alatt (m)

function mat(c, o = {}) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, metalness: 0.02, ...o }); }

export function initHero() {
  const box = $('#hero3d'); if (!box) return;
  const segBox = $('#heroType'), rng = $('#heroDepth'), out = $('#heroDepthVal'), ver = $('#heroVerdict');
  let type = 'colop', D = +rng.value;
  // ---- vezérlők
  const btns = TYPES.map((o) => { const b = h('button', { type: 'button', role: 'radio' }, o.t); b.addEventListener('click', () => { type = o.v; paintSeg(); rebuild(); }); segBox.append(b); return [o.v, b]; });
  const paintSeg = () => btns.forEach(([v, b]) => { b.classList.toggle('on', v === type); b.setAttribute('aria-checked', v === type); });
  paintSeg();
  const setP = () => rng.style.setProperty('--p', ((rng.value - rng.min) / (rng.max - rng.min)) * 100 + '%');
  rng.addEventListener('input', () => { D = +rng.value; out.textContent = fmt(D, 1) + ' m'; setP(); rebuild(); });
  out.textContent = fmt(D, 1) + ' m'; setP();

  // ---- jelenet
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
  catch (e) { box.append(h('div', { class: 'h3-lab', style: { left: '50%', top: '50%' } }, 'A 3D nézethez WebGL kell.')); return; }
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.setClearColor(0x1d2a37);
  renderer.localClippingEnabled = true;
  box.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1d2a37, 70, 140);
  const cam = new THREE.PerspectiveCamera(40, 1.6, 0.5, 400);
  cam.position.set(24, 2, 36);
  const ctl = new OrbitControls(cam, renderer.domElement);
  ctl.target.set(0, -7.5, -6); ctl.enableDamping = true; ctl.dampingFactor = 0.08;
  ctl.minDistance = 22; ctl.maxDistance = 90; ctl.maxPolarAngle = Math.PI * 0.62; ctl.enablePan = false;
  ctl.autoRotate = true; ctl.autoRotateSpeed = 0.55;
  ctl.addEventListener('start', () => { ctl.autoRotate = false; });
  scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x3a2c20, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(20, 40, 25); scene.add(sun);

  const world = new THREE.Group(); scene.add(world);
  let dyn = new THREE.Group(); world.add(dyn);
  const labels = [];
  const addLabel = (txt, p, cls = '') => { const el = h('div', { class: 'h3-lab ' + cls }, txt); box.append(el); labels.push({ el, p }); };
  const clearLabels = () => { labels.splice(0).forEach((l) => l.el.remove()); };

  // talajtömb: a homlokzat felé (z+) nyitott metszet → a rétegek dobozok
  function soil(xray = false) {
    const g = new THREE.Group();
    const layers = [
      { top: 0, bot: 1.2, c: 0x7b6a52 },                       // feltöltés
      { top: 1.2, bot: Math.max(1.6, D), c: 0x8d7f6f },          // puha agyag / iszap
      { top: Math.max(1.6, D), bot: BOT, c: 0xb39a6e },          // teherbíró kavics / tömör homok
    ];
    for (const L of layers) {
      const hh = L.bot - L.top; if (hh <= 0.01) continue;
      const dz = ZC + Z;
      const m = new THREE.Mesh(new THREE.BoxGeometry(W, hh, dz), xray ? mat(L.c, { transparent: true, opacity: 0.42, depthWrite: false }) : mat(L.c));
      m.position.set(0, -L.top - hh / 2, -Z + dz / 2); if (xray) m.renderOrder = 1;
      g.add(m);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x2b241c, transparent: true, opacity: 0.35 }));
      e.position.copy(m.position); g.add(e);
    }
    // teherbíró réteg teteje: kiemelő sáv a homlokzaton
    const band = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.14), new THREE.MeshBasicMaterial({ color: 0xf0864a }));
    band.position.set(0, -D, ZC + 0.02); g.add(band);
    // szellem-talaj a metszősík előtt (átlátszó)
    const gh = new THREE.Mesh(new THREE.BoxGeometry(W, BOT, -ZC), new THREE.MeshBasicMaterial({ color: 0xb39a6e, transparent: true, opacity: 0.06, depthWrite: false }));
    gh.position.set(0, -BOT / 2, ZC / 2); g.add(gh);
    const ge = new THREE.LineSegments(new THREE.EdgesGeometry(gh.geometry), new THREE.LineBasicMaterial({ color: 0xc9d3dc, transparent: true, opacity: 0.18 }));
    ge.position.copy(gh.position); g.add(ge);
    // talajvíz
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.08), new THREE.MeshBasicMaterial({ color: 0x4fbbea }));
    wl.position.set(0, -GW, ZC + 0.025); g.add(wl);
    const wv = new THREE.Mesh(new THREE.PlaneGeometry(W, -ZC), new THREE.MeshBasicMaterial({ color: 0x4fbbea, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
    wv.rotation.x = -Math.PI / 2; wv.position.set(0, -GW, ZC / 2); g.add(wv);
    // terepszint (vékony)
    const gr = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.25, ZC + Z + 0.2), mat(0x56653f));
    gr.position.set(0, 0.12, (-Z + ZC) / 2); g.add(gr);
    return g;
  }
  function building(dropY = 0, tilt = 0) {
    const g = new THREE.Group();
    const fl = 4, fh = 3.2, bw = 12, bd = 10;
    const conc = mat(0xd5d8db), glass = mat(0x6f8fae, { roughness: 0.3, metalness: 0.2 });
    for (let i = 0; i < fl; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.35, bd), conc); s.position.set(0, i * fh + 0.18, 0); g.add(s);
      const gl = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.6, fh - 0.4, bd - 0.6), glass); gl.position.set(0, i * fh + fh / 2 + 0.18, 0); g.add(gl);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.45, bd), conc); roof.position.set(0, fl * fh + 0.2, 0); g.add(roof);
    for (const [x, z] of [[-bw / 2 + 0.3, -bd / 2 + 0.3], [bw / 2 - 0.3, -bd / 2 + 0.3], [-bw / 2 + 0.3, bd / 2 - 0.3], [bw / 2 - 0.3, bd / 2 - 0.3]]) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, fl * fh, 0.5), conc); c.position.set(x, fl * fh / 2, z); g.add(c);
    }
    g.position.set(0, -dropY, -bd / 2 - 0.6);
    g.rotation.z = tilt;
    return g;
  }
  const concM = mat(0xb8b6b0), freshM = mat(0x9a978f), steelM = mat(0x6e8aa1, { metalness: 0.4, roughness: 0.5 });
  const arrows = (g, x, y0, y1, z, color, n = 4) => {
    for (let i = 0; i < n; i++) {
      const y = y0 + (y1 - y0) * (i + 0.5) / n;
      const a = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y - 0.7, z), 1.4, color, 0.5, 0.35); g.add(a);
    }
  };
  // ---- feszültséghagyma: rugalmas féltér, egyenletesen terhelt B×L lemez alatt (Boussinesq, Steinbrenner-féle sarokpont-képlet)
  const RB = 13.2, RL = 11.2, BASE = 1.5, QK = 60; // lemez mérete (x, z), alapsík a terep alatt, talpnyomás kPa – szemléltető
  const bz0 = -5.6;
  const Icorner = (a, b, z) => { const m = a / z, n = b / z, m2 = m * m, n2 = n * n, V = m2 + n2 + 1, V1 = m2 * n2, sv = Math.sqrt(V); return ((2 * m * n * sv / (V + V1)) * ((V + 1) / V) + Math.atan2(2 * m * n * sv, V - V1)) / (4 * Math.PI); };
  const g4 = (a, b, z) => Math.sign(a) * Math.sign(b) * Icorner(Math.abs(a), Math.abs(b), z);
  const Iz = (x, zz, d) => { if (d <= 1e-3) return 0; const x1 = -RB / 2 - x, x2 = RB / 2 - x, y1 = -RL / 2 - zz, y2 = RL / 2 - zz; return g4(x2, y2, d) - g4(x1, y2, d) - g4(x2, y1, d) + g4(x1, y1, d); };
  const sv0 = (t) => (t <= GW ? 18 * t : 18 * GW + 10 * (t - GW)); // hatékony önsúlyfeszültség (γ = 18, γ′ = 10 kN/m³)
  // határmélység: ahol Δσz = 0,2·σ′v0 (a lemez középvonalában)
  const HM = (() => { let lo = 0.5, hi = 60; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (QK * Iz(0, 0, m) > 0.2 * sv0(BASE + m)) lo = m; else hi = m; } return (lo + hi) / 2; })();
  let stressG = null;
  function stress() {
    if (stressG) return stressG;
    const G = new THREE.Group(); world.add(G); stressG = G;
    const clipBack = new THREE.Plane(new THREE.Vector3(0, 0, -1), ZC); // a metszősík mögötti fél: z ≤ ZC
    // 3D izobár-felületek (marching cubes)
    const N = 44, hx = 13, hy = 14, hz = 11, cx = 0, cy = -BASE - 12.6, cz = bz0, half = N / 2;
    const field = new Float32Array(N * N * N);
    for (let k = 0; k < N; k++) {
      const wz = cz + hz * (k - half) / half;
      for (let j = 0; j < N; j++) {
        const wy = cy + hy * (j - half) / half, d = -BASE - wy;
        for (let i = 0; i < N; i++) {
          const wx = cx + hx * (i - half) / half;
          field[k * N * N + j * N + i] = (i === 0 || j === 0 || k === 0 || i === N - 1 || j === N - 1 || k === N - 1 || d < 0.08 || wy < -BOT + 0.3) ? 0 : Iz(wx, wz - bz0, d);
        }
      }
    }
    [[0.1, 0xf6dc8b, 0.15], [0.2, 0xf2c14e, 0.22], [0.5, 0xf0864a, 0.32], [0.8, 0xd9481a, 0.45]].forEach(([iso, col, op], n) => {
      const m = new MarchingCubes(N, new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, roughness: 0.55, clippingPlanes: [clipBack] }), false, false, 60000);
      m.isolation = iso; m.field.set(field); m.update();
      m.position.set(cx, cy, cz); m.scale.set(hx, hy, hz); m.renderOrder = 3 + n; G.add(m);
    });
    // a metszősíkon: Δσz/q színezés + izobárvonalak + határmélység
    const cw = 480, top = -BASE, bot = -BOT + 0.6, ch = Math.round(cw * (top - bot) / W);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const c = cv.getContext('2d'), img = c.createImageData(cw, ch);
    const zz = ZC - bz0, val = new Float32Array(cw * ch);
    for (let py = 0; py < ch; py++) { const d = (py + 0.5) / ch * (top - bot); for (let px = 0; px < cw; px++) { const x = -W / 2 + (px + 0.5) / cw * W; val[py * cw + px] = Iz(x, zz, d); } }
    const LV = [0.8, 0.5, 0.2, 0.1];
    for (let py = 0; py < ch; py++) for (let px = 0; px < cw; px++) {
      const v = val[py * cw + px], o = (py * cw + px) * 4;
      const t = Math.min(1, v);
      img.data[o] = 240; img.data[o + 1] = Math.round(205 - 150 * t); img.data[o + 2] = Math.round(110 - 85 * t);
      img.data[o + 3] = v < 0.04 ? 0 : Math.round(40 + 110 * Math.min(1, v / 0.9));
      if (px < cw - 1 && py < ch - 1) for (const L of LV) {
        const a = v - L, b = val[py * cw + px + 1] - L, e = val[(py + 1) * cw + px] - L;
        if ((a > 0) !== (b > 0) || (a > 0) !== (e > 0)) { img.data[o] = 60; img.data[o + 1] = 28; img.data[o + 2] = 12; img.data[o + 3] = 235; }
      }
    }
    c.putImageData(img, 0, 0);
    // izobár-értékek a középvonal mellett
    c.font = '700 15px "JetBrains Mono", monospace'; c.fillStyle = '#3c1c0c'; c.textBaseline = 'middle';
    for (const L of LV) { let py = 0; while (py < ch - 1 && val[py * cw + Math.round(cw / 2)] > L) py++; c.fillText(String(L).replace('.', ',') + ' q', cw / 2 + 6, Math.min(ch - 10, py + 9)); }
    // határmélység: szaggatott vonal
    const hy0 = HM / (top - bot) * ch; c.strokeStyle = '#1a6fb0'; c.lineWidth = 3; c.setLineDash([12, 8]); c.beginPath(); c.moveTo(0, hy0); c.lineTo(cw, hy0); c.stroke();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(W, top - bot), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    face.position.set(0, (top + bot) / 2, ZC + 0.03); face.renderOrder = 8; G.add(face);
    return G;
  }
  function rebuild() {
    world.remove(dyn); dyn.traverse((o) => { o.geometry?.dispose?.(); }); dyn = new THREE.Group(); world.add(dyn);
    clearLabels();
    dyn.add(soil(type === 'sik'));
    if (stressG) stressG.visible = false;
    const bz = -5.6; // épület közepe z
    let msg = '';
    if (type === 'sik') {
      const soft = Math.max(0, D - 1.6);
      const s = clamp(soft * 0.045, 0, 0.9);            // egyenletes süllyedés, szemléltető (nagyítva)
      const raft = new THREE.Mesh(new THREE.BoxGeometry(RB, 0.9, RL), concM); raft.position.set(0, -1.05 - s, bz); dyn.add(raft);
      dyn.add(building(0.6 + s, 0));
      const st = stress(); st.visible = true; st.position.y = -s;
      addLabel('feszültséghagyma: Δσz/q izobárok', new THREE.Vector3(-RB / 2 - 1.5, -BASE - 7, ZC + 0.3));
      addLabel(`határmélység ≈ ${fmt(HM, 1)} m (Δσz = 0,2·σ′v0)`, new THREE.Vector3(-W / 2 + 6.5, -BASE - HM - s + 0.8, ZC + 0.3), 'blue');
      const reach = BASE + HM;
      if (D <= 3) { msg = `<b>Síkalap elég</b>A teherbíró réteg ${fmt(D, 1)} m-en kezdődik: a síkalap (vagy egy kissé mélyített síkalap) közvetlenül ráállhat.`; }
      else { msg = `<b>Itt a síkalap kevés</b>A lemez alatti feszültséghagyma (rugalmas féltér, Boussinesq–Steinbrenner) a terep alatt kb. ${fmt(reach, 1)} m-ig, a határmélységig hat${D >= reach ? ' – végig a puha rétegben' : `, és ebből ${fmt(soft, 1)} m a puha rétegbe esik`}. Nagy süllyedés várható (az ábrán nagyítva). A terhet le kell vinni a mélybe.`; }
    }
    if (type === 'colop') {
      const L = D + 2.2; // a teherbíró rétegbe 2,2 m befogás
      const cap = new THREE.Mesh(new THREE.BoxGeometry(13.2, 1.1, 11.2), concM); cap.position.set(0, -0.95, bz); dyn.add(cap);
      dyn.add(building(0.4, 0));
      const xs = [-4.8, 0, 4.8], zs = [-3.6, 0, 3.6];
      for (const x of xs) for (const z of zs) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, L, 18), freshM); p.position.set(x, -1.4 - L / 2, bz + z); dyn.add(p);
      }
      // köpeny (zöld) és talp (narancs) teheradás a homlokzati cölöpsoron
      arrows(dyn, -4.8 - 0.75, -1.6 - Math.min(L, D) + 0.2, -1.8, bz + 3.6 + 0.6, 0x4fca8f, 4);
      arrows(dyn, 4.8 + 0.75, -1.6 - Math.min(L, D) + 0.2, -1.8, bz + 3.6 + 0.6, 0x4fca8f, 4);
      for (const x of xs) { const a = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, -1.4 - L - 2.0, bz + 3.6), 1.7, 0xf0864a, 0.6, 0.45); dyn.add(a); }
      addLabel('köpenymenti ellenállás', new THREE.Vector3(-8.2, -1.6 - Math.min(L, D) / 2, bz + 3.6));
      addLabel('talpellenállás', new THREE.Vector3(0, -1.4 - L - 2.6, bz + 3.6));
      msg = `<b>Cölöpalap: 9 cölöp, L ≈ ${fmt(L, 1)} m</b>A cölöpök átjutnak a puha rétegen, és ${fmt(2.2, 1)} m-re beállnak a teherbíró rétegbe. A terhet a köpenyük mentén és a talpukon adják le – a fejüket összefogó lemez osztja szét rájuk az épület terhét.`;
    }
    if (type === 'resfal') {
      const Lw = Math.max(D + 1.5, 9);
      const base = 7.2; // két pinceszint
      const t = 0.8;
      const mk = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, Lw, d), concM); m.position.set(x, -Lw / 2, bz + z); dyn.add(m); };
      mk(13.4, t, 0, -5.6); mk(t, 11.2, -6.7, 0); mk(t, 11.2, 6.7, 0); mk(13.4, t, 0, 5.6);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(12.6, 1.0, 10.4), concM); slab.position.set(0, -base - 0.5, bz); dyn.add(slab);
      const hole = new THREE.Mesh(new THREE.BoxGeometry(12.5, base - 0.1, 10.3), new THREE.MeshStandardMaterial({ color: 0x1d2a37, roughness: 1 })); hole.position.set(0, -base / 2 + 0.05, bz); dyn.add(hole);
      for (let k = 1; k <= 2; k++) { const fl = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.3, 10.4), concM); fl.position.set(0, -base + k * 3.6 - 0.15, bz); dyn.add(fl); }
      dyn.add(building(0, 0));
      addLabel('résfal', new THREE.Vector3(-6.7, -Lw / 2, bz + 5.6));
      addLabel('két pinceszint', new THREE.Vector3(0, -3.6, bz + 5.6));
      msg = `<b>Résfal: határolás és alap egyben</b>A ${fmt(Lw, 1)} m mély résfal előbb a munkagödröt tartja meg a talajvíz alatt, aztán a pinceszintek végleges fala és az épület alapja lesz. Ott éri meg, ahol mély pince kell, közvetlenül a szomszéd mellett.`;
    }
    if (type === 'kut') {
      const L = D + 0.6;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(13.2, 1.0, 11.2), concM); cap.position.set(0, -0.9, bz); dyn.add(cap);
      dyn.add(building(0.4, 0));
      for (const [x, z] of [[-4.5, -3.2], [4.5, -3.2], [-4.5, 3.2], [4.5, 3.2]]) {
        const k = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, L, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xb8b6b0, roughness: 0.9, side: THREE.DoubleSide }));
        k.position.set(x, -1.2 - L / 2, bz + z); dyn.add(k);
        const fill = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, L - 0.1, 24), freshM); fill.position.copy(k.position); dyn.add(fill);
      }
      addLabel('kútalap Ø2,5 m', new THREE.Vector3(4.5, -1.2 - L / 2, bz + 3.2));
      if (D <= 8) msg = `<b>Kútalap: itt még versenyképes</b>A teherbíró réteg ${fmt(D, 1)} m-en van – a kutakat (átmérő 0,8–3,0 m, hossz 4–8 m) a saját súlyuk süllyeszti le, miközben belülről kiemelik a földet.`;
      else msg = `<b>Ilyen mélyre nem éri meg</b>${fmt(D, 1)} m mélyre a kútalap már nem gazdaságos: a kutak jellemzően 4–8 m hosszúak. Ennél mélyebb teherbíró rétegnél cölöpöt vagy résfalat választunk.`;
    }
    addLabel(`teherbíró réteg −${fmt(D, 1)} m`, new THREE.Vector3(W / 2 - 5, -D - 0.9, ZC + 0.3), 'acc');
    addLabel('talajvíz', new THREE.Vector3(-W / 2 + 2.5, -GW - 0.7, ZC + 0.3));
    ver.innerHTML = msg;
    dirty = true;
  }

  let dirty = true, vis = false, raf = 0;
  const v3 = new THREE.Vector3();
  const resize = () => {
    const w = box.clientWidth, hh = box.clientHeight;
    renderer.setSize(w, hh, false); cam.aspect = w / Math.max(1, hh); cam.updateProjectionMatrix(); dirty = true;
  };
  new ResizeObserver(resize).observe(box);
  const tick = () => {
    raf = 0; if (!vis) return;
    const moved = ctl.update();
    if (moved || dirty || ctl.autoRotate) {
      renderer.render(scene, cam); dirty = false;
      const w = box.clientWidth, hh = box.clientHeight;
      for (const l of labels) { v3.copy(l.p).project(cam); l.el.style.left = ((v3.x + 1) / 2 * w) + 'px'; l.el.style.top = ((1 - v3.y) / 2 * hh) + 'px'; l.el.style.opacity = v3.z < 1 ? 1 : 0; }
    }
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(tick); }).observe(box);
  resize(); rebuild();
}
