// Belépési pont
import { bootWidgets, bootAll } from './core.js';
import { initUI, startGuard } from './ui.js';
import { initHero } from './hero.js';
import './ch_alapok.js';
import './ch_rendszer.js';
import './ch_elore.js';
import './ch_helyszini.js';
import './ch_furt.js';
import './ch_egyeb.js';
import './ch_resfal.js';
import './ch_kut.js';
import './sim3d.js';
import './ch_dontes.js';
import './tf.js';

initUI();
try { initHero(); } catch (e) { console.error('Hős hiba', e); }
if (/[?&]all\b/.test(location.search)) bootAll(); else bootWidgets();
startGuard();
