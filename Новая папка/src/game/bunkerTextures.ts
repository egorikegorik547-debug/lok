// @ts-nocheck
import * as THREE from 'three';
import { ZONES } from './data';

/* ============================================================
   Процедурные текстуры сети бункеров — в том же стиле, что и убежище:
   окрашенные панели, плинтусы, потёки, плитка, дерево, металл.
   ============================================================ */

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);

export function mkTex(w, h, draw, repeat = true, aniso = 8) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  else t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
export function speckle(x, w, h, n, a) {
  for (let i = 0; i < n; i++) {
    const v = Math.random() < 0.5 ? 0 : 255;
    x.fillStyle = `rgba(${v},${v},${v},${Math.random() * a})`;
    x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}
function planks(x, w, h, rows, base, jitter = 14, seams = true) {
  const rh = h / rows;
  for (let r = 0; r < rows; r++) {
    const j = (Math.random() - 0.5) * jitter * 2;
    x.fillStyle = `rgb(${base[0] + j | 0},${base[1] + j * 0.8 | 0},${base[2] + j * 0.6 | 0})`;
    x.fillRect(0, r * rh, w, rh);
    for (let i = 0; i < 9; i++) {
      x.strokeStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,230,200'},${0.05 + Math.random() * 0.08})`;
      x.lineWidth = 1;
      const yy = r * rh + Math.random() * rh;
      x.beginPath(); x.moveTo(0, yy); x.bezierCurveTo(w * 0.3, yy + rnd(-2, 2), w * 0.7, yy + rnd(-2, 2), w, yy + rnd(-1, 1)); x.stroke();
    }
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, r * rh, w, 2);
    if (seams) { const sx = Math.random() * w; x.fillRect(sx, r * rh, 2, rh); }
  }
}
function stains(x, w, h, n, rgb, aMax, rMin = 10, rMax = 40) {
  for (let i = 0; i < n; i++) {
    const px = Math.random() * w, py = Math.random() * h, r = rnd(rMin, rMax);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(${rgb},${rnd(aMax * 0.4, aMax)})`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, r * rnd(0.5, 1), rnd(0, 3), 0, TAU); x.fill();
  }
}

/* ---------- Основные поверхности ---------- */
export const wallTex = mkTex(512, 512, (x, w, h) => {
  // верх: бетон, крашенный в холодный серо-зелёный
  const g = x.createLinearGradient(0, 0, 0, h * 0.62);
  g.addColorStop(0, '#5d625d'); g.addColorStop(1, '#8a8d82');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  speckle(x, w, h, 9000, 0.1);
  stains(x, w, h * 0.62, 10, '30,26,20', 0.16, 20, 70);
  // потёки сверху
  for (let i = 0; i < 9; i++) {
    const px = Math.random() * w, ww = 10 + Math.random() * 38, hh = 80 + Math.random() * 220;
    const gg = x.createLinearGradient(0, 0, 0, hh); gg.addColorStop(0, 'rgba(34,24,14,.34)'); gg.addColorStop(1, 'rgba(34,24,14,0)');
    x.fillStyle = gg; x.fillRect(px, 0, ww, hh);
  }
  // ржавые подтёки
  for (let i = 0; i < 4; i++) {
    const px = Math.random() * w, hh = 60 + Math.random() * 120;
    const gg = x.createLinearGradient(0, h * 0.1, 0, h * 0.1 + hh); gg.addColorStop(0, 'rgba(120,60,22,.3)'); gg.addColorStop(1, 'rgba(120,60,22,0)');
    x.fillStyle = gg; x.fillRect(px, h * 0.1, 3 + Math.random() * 5, hh);
  }
  // стыки бетонных плит + болты (период 256 → стыкуется)
  x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, 0, 3, h * 0.62); x.fillRect(256, 0, 3, h * 0.62);
  x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(3, 0, 2, h * 0.62); x.fillRect(259, 0, 2, h * 0.62);
  x.fillStyle = 'rgba(0,0,0,.4)';
  for (let y = 30; y < h * 0.6; y += 54) for (const bx of [12, 268]) { x.beginPath(); x.arc(bx, y, 2.6, 0, TAU); x.fill(); }
  // трещина
  x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 1.5; x.beginPath();
  let cx = rnd(60, 200), cy = 20; x.moveTo(cx, cy);
  for (let i = 0; i < 12; i++) { cx += rnd(-12, 12); cy += rnd(10, 18); x.lineTo(cx, cy); }
  x.stroke();
  // копоть под потолком
  const gs = x.createLinearGradient(0, 0, 0, h * 0.22); gs.addColorStop(0, 'rgba(0,0,0,.42)'); gs.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gs; x.fillRect(0, 0, w, h * 0.22);
  // нижняя панель (цоколь)
  const py = h * 0.62;
  x.fillStyle = '#2b3f3c'; x.fillRect(0, py, w, h - py);
  for (let i = 0; i < w; i += 64) {
    x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(i, py, 3, h - py);
    x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(i + 3, py, 2, h - py);
  }
  speckle(x, w, h, 4500, 0.12);
  // царапины на панелях
  x.strokeStyle = 'rgba(200,210,190,.1)'; x.lineWidth = 1;
  for (let i = 0; i < 26; i++) { const sx = Math.random() * w, sy = py + 20 + Math.random() * (h - py - 50); x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + rnd(-26, 26), sy + rnd(-10, 10)); x.stroke(); }
  stains(x, w, h - py, 6, '0,0,0', 0.22, 10, 36);
  // тёплая «кремовая» линия и тень
  x.fillStyle = '#c9c19f'; x.fillRect(0, py - 8, w, 8);
  x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, py, w, 5);
  x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(0, py - 8, w, 2);
  // плинтус
  x.fillStyle = '#15120f'; x.fillRect(0, h - 24, w, 24);
  x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(0, h - 24, w, 2);
}, true, 8);

export const ceilTex = mkTex(256, 256, (x, w, h) => {
  x.fillStyle = '#23262a'; x.fillRect(0, 0, w, h); speckle(x, w, h, 5000, 0.1);
  stains(x, w, h, 4, '0,0,0', 0.4, 20, 60);
  x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 4;
  for (let i = 0; i <= w; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,.07)';
  for (const a of [10, 118, 138, 246]) for (const b of [10, 118, 138, 246]) { x.beginPath(); x.arc(a, b, 2, 0, TAU); x.fill(); }
});

export const bloodTex = mkTex(128, 128, (x) => {
  for (let i = 0; i < 14; i++) {
    const r = 6 + Math.random() * 26, px = 64 + (Math.random() - .5) * 60, py = 64 + (Math.random() - .5) * 60;
    const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(90,5,5,.9)'); g.addColorStop(1, 'rgba(60,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
}, false);

/* Табличка над шлюзом убежища (вид со стороны бункеров) */
export const signTex = mkTex(512, 128, (x, w, h) => {
  x.fillStyle = '#0c2216'; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#4ade80'; x.lineWidth = 5; x.strokeRect(6, 6, w - 12, h - 12);
  x.fillStyle = '#4ade80'; x.font = 'bold 50px sans-serif'; x.textAlign = 'center';
  x.fillText('УБЕЖИЩЕ №17', w / 2, 62);
  x.font = 'bold 24px sans-serif'; x.fillStyle = '#9bf0b9'; x.fillText('◄  ШЛЮЗ ВОЗВРАТА  ДОМОЙ', w / 2, 102);
  speckle(x, w, h, 800, 0.2);
}, false);

/* ============================================================
   Детализированные полы: цвет + карта рельефа (bump) + карта шероховатости.
   Все рисунки бесшовные (пятна и царапины «заворачиваются» через край).
   ============================================================ */
function mkMaps(w, h, draw, aniso = 8) {
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cc = mk(), hc = mk(), rc = mk();
  const cx = cc.getContext('2d'), hx = hc.getContext('2d'), rx = rc.getContext('2d');
  hx.fillStyle = '#808080'; hx.fillRect(0, 0, w, h);
  rx.fillStyle = '#d0d0d0'; rx.fillRect(0, 0, w, h);
  draw(cx, hx, rx, w, h);
  const t = (c, srgb) => {
    const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.anisotropy = aniso;
    if (srgb) tx.colorSpace = THREE.SRGBColorSpace; return tx;
  };
  return { map: t(cc, true), bump: t(hc, false), rough: t(rc, false) };
}
// выполнить рисование 9 раз со смещениями — чтобы элемент у края попадал и на противоположный
function wrap(w, h, fn) { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) fn(dx, dy); }
// пятно сразу на трёх картах: цвет, рельеф (hv: 0..255 затемнение/осветление), шероховатость (rv: 0..255 цель)
function blot(cx, hx, rx, w, h, px, py, r, rgb, a, o = {}) {
  const sq = o.sq || rnd(0.55, 1), rot = o.rot ?? rnd(0, 3);
  wrap(w, h, (dx, dy) => {
    if (px + dx < -r || px + dx > w + r || py + dy < -r || py + dy > h + r) return;
    const g = cx.createRadialGradient(px + dx, py + dy, 0, px + dx, py + dy, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.6, `rgba(${rgb},${a * 0.6})`); g.addColorStop(1, `rgba(${rgb},0)`);
    cx.fillStyle = g; cx.beginPath(); cx.ellipse(px + dx, py + dy, r, r * sq, rot, 0, TAU); cx.fill();
    if (o.rough !== undefined) {
      const g2 = rx.createRadialGradient(px + dx, py + dy, 0, px + dx, py + dy, r * 0.9);
      const v = o.rough | 0; g2.addColorStop(0, `rgba(${v},${v},${v},${o.rk ?? 0.95})`); g2.addColorStop(0.75, `rgba(${v},${v},${v},${(o.rk ?? 0.95) * 0.7})`); g2.addColorStop(1, `rgba(${v},${v},${v},0)`);
      rx.fillStyle = g2; rx.beginPath(); rx.ellipse(px + dx, py + dy, r * 0.9, r * 0.9 * sq, rot, 0, TAU); rx.fill();
    }
    if (o.low) {
      const g3 = hx.createRadialGradient(px + dx, py + dy, 0, px + dx, py + dy, r * 0.9);
      g3.addColorStop(0, `rgba(0,0,0,${o.low})`); g3.addColorStop(1, 'rgba(0,0,0,0)');
      hx.fillStyle = g3; hx.beginPath(); hx.ellipse(px + dx, py + dy, r * 0.9, r * 0.9 * sq, rot, 0, TAU); hx.fill();
    }
  });
}
function scratchLine(cx, hx, w, h, n, len, light = 0.07) {
  for (let i = 0; i < n; i++) {
    const sx = Math.random() * w, sy = Math.random() * h, ex = rnd(-len, len), ey = rnd(-len, len), lite = Math.random() < 0.6;
    wrap(w, h, (dx, dy) => {
      cx.strokeStyle = lite ? `rgba(255,255,255,${light * rnd(0.4, 1)})` : `rgba(0,0,0,${light * rnd(1, 2)})`; cx.lineWidth = rnd(0.6, 1.6);
      cx.beginPath(); cx.moveTo(sx + dx, sy + dy); cx.lineTo(sx + dx + ex, sy + dy + ey); cx.stroke();
      if (hx && !lite) { hx.strokeStyle = 'rgba(0,0,0,.35)'; hx.lineWidth = 1; hx.beginPath(); hx.moveTo(sx + dx, sy + dy); hx.lineTo(sx + dx + ex, sy + dy + ey); hx.stroke(); }
    });
  }
}
function rivet(cx, hx, px, py, r = 3.4) {
  cx.fillStyle = 'rgba(0,0,0,.55)'; cx.beginPath(); cx.arc(px + 0.8, py + 1, r + 0.8, 0, TAU); cx.fill();
  const g = cx.createRadialGradient(px - r * 0.3, py - r * 0.35, 0.3, px, py, r);
  g.addColorStop(0, '#d9dee0'); g.addColorStop(0.6, '#7a8388'); g.addColorStop(1, '#3a4146');
  cx.fillStyle = g; cx.beginPath(); cx.arc(px, py, r, 0, TAU); cx.fill();
  if (hx) { hx.fillStyle = '#e0e0e0'; hx.beginPath(); hx.arc(px, py, r, 0, TAU); hx.fill(); }
}
// шов между плитами: тёмный паз, светлая фаска, грязь в пазу
function groove(cx, hx, rx, x0, y0, x1, y1, th = 6) {
  const vert = x0 === x1, ox = vert ? 1 : 0, oy = vert ? 0 : 1;
  const L = (c, col, wd, off) => { c.strokeStyle = col; c.lineWidth = wd; c.beginPath(); c.moveTo(x0 + ox * off, y0 + oy * off); c.lineTo(x1 + ox * off, y1 + oy * off); c.stroke(); };
  L(cx, 'rgba(4,5,6,.92)', th, 0); L(cx, 'rgba(255,255,255,.12)', 1.5, th / 2 + 1); L(cx, 'rgba(0,0,0,.35)', 2, -th / 2 - 1);
  L(hx, '#101010', th, 0); L(hx, '#a0a0a0', 2, th / 2 + 1.5); L(hx, '#707070', 2, -th / 2 - 1.5);
  L(rx, '#f0f0f0', th + 4, 0);
}

/* ---------- Технический коридор: бетонные плиты, рифлёная сталь, решётки, швы, лужи ---------- */
function drawCorridorFloor(cx, hx, rx, w, h) {
  const T = 4, s = w / T;
  // раскладка плит 4×4: бетон / рифлёная сталь / решётка водостока
  const kinds = [];
  for (let j = 0; j < T; j++) { kinds.push([]); for (let i = 0; i < T; i++) kinds[j].push('conc'); }
  const place = (k, n) => { for (let t = 0; t < n; t++) { const i = (Math.random() * T) | 0, j = (Math.random() * T) | 0; if (kinds[j][i] === 'conc') kinds[j][i] = k; } };
  place('plate', 3); place('grate', 1);
  for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
    const x0 = i * s, y0 = j * s, k = kinds[j][i];
    if (k === 'conc') {
      const v = rnd(-6, 6);
      const g = cx.createLinearGradient(x0, y0, x0 + s, y0 + s);
      g.addColorStop(0, `rgb(${84 + v | 0},${89 + v | 0},${91 + v | 0})`); g.addColorStop(1, `rgb(${70 + v | 0},${75 + v | 0},${78 + v | 0})`);
      cx.fillStyle = g; cx.fillRect(x0, y0, s, s);
      // крупный заполнитель: светлые и тёмные «камешки»
      for (let n = 0; n < 900; n++) {
        const l = Math.random() < 0.5; cx.fillStyle = l ? `rgba(200,205,205,${rnd(0.05, 0.22)})` : `rgba(10,12,14,${rnd(0.08, 0.3)})`;
        const r = rnd(0.7, 2.6); cx.beginPath(); cx.arc(x0 + Math.random() * s, y0 + Math.random() * s, r, 0, TAU); cx.fill();
      }
      // затирка кругами (следы шпателя)
      for (let n = 0; n < 5; n++) { const gx = x0 + rnd(20, s - 20), gy = y0 + rnd(20, s - 20), gr = rnd(40, 90); const gg = cx.createRadialGradient(gx, gy, 0, gx, gy, gr); gg.addColorStop(0, 'rgba(255,255,255,.035)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); cx.fillStyle = gg; cx.fillRect(x0, y0, s, s); }
      // волосяные трещины
      if (Math.random() < 0.55) {
        let px = x0 + rnd(10, s - 10), py = y0 + rnd(10, s - 10);
        for (let b = 0; b < 2; b++) {
          cx.strokeStyle = 'rgba(8,8,10,.6)'; cx.lineWidth = 1.2; hx.strokeStyle = 'rgba(0,0,0,.5)'; hx.lineWidth = 1.5;
          cx.beginPath(); hx.beginPath(); cx.moveTo(px, py); hx.moveTo(px, py);
          let qx = px, qy = py, a = rnd(0, TAU);
          for (let n = 0; n < 14; n++) { a += rnd(-0.7, 0.7); qx += Math.cos(a) * rnd(6, 16); qy += Math.sin(a) * rnd(6, 16); qx = Math.max(x0 + 3, Math.min(x0 + s - 3, qx)); qy = Math.max(y0 + 3, Math.min(y0 + s - 3, qy)); cx.lineTo(qx, qy); hx.lineTo(qx, qy); }
          cx.stroke(); hx.stroke();
        }
      }
      // обитые углы
      for (const [ex, ey] of [[x0 + 6, y0 + 6], [x0 + s - 6, y0 + 6], [x0 + 6, y0 + s - 6], [x0 + s - 6, y0 + s - 6]]) if (Math.random() < 0.3) blot(cx, hx, rx, w, h, ex, ey, rnd(7, 16), '30,32,34', 0.7, { low: 0.5, sq: 1 });
      // шум рельефа и шероховатость (полированные «тропинки» блестят)
      for (let n = 0; n < 1400; n++) { const g = (Math.random() * 40 + 108) | 0; hx.fillStyle = `rgb(${g},${g},${g})`; hx.fillRect(x0 + Math.random() * s, y0 + Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2); }
      const rg = (Math.random() * 40 + 190) | 0; rx.fillStyle = `rgb(${rg},${rg},${rg})`; rx.fillRect(x0, y0, s, s);
      // жёлтая угловая маркировка на части плит
      if (Math.random() < 0.28) {
        cx.strokeStyle = 'rgba(225,180,40,.8)'; cx.lineWidth = 6; cx.lineCap = 'butt';
        const cs = 38, m = 14; cx.beginPath(); cx.moveTo(x0 + m, y0 + m + cs); cx.lineTo(x0 + m, y0 + m); cx.lineTo(x0 + m + cs, y0 + m); cx.stroke();
        cx.beginPath(); cx.moveTo(x0 + s - m, y0 + s - m - cs); cx.lineTo(x0 + s - m, y0 + s - m); cx.lineTo(x0 + s - m - cs, y0 + s - m); cx.stroke();
        for (let n = 0; n < 160; n++) { cx.fillStyle = `rgba(40,34,20,${rnd(0.2, 0.7)})`; cx.fillRect(x0 + Math.random() * s, y0 + Math.random() * s, 2, 2); }
      }
    } else if (k === 'plate') {
      // рифлёный лист
      cx.fillStyle = `rgb(${88 + rnd(-5, 5) | 0},${97 + rnd(-5, 5) | 0},${103 + rnd(-5, 5) | 0})`; cx.fillRect(x0, y0, s, s);
      const sp = 22;
      for (let r = 0, yy = y0 + 12; yy < y0 + s - 6; yy += sp / 1.2, r++) for (let xx = x0 + 12 + (r % 2) * sp / 2; xx < x0 + s - 6; xx += sp) {
        const ang = (Math.floor((xx - x0) / sp) + r) % 2 ? Math.PI / 4 : -Math.PI / 4;
        for (const [c, off, col, wd] of [[cx, 1.6, 'rgba(0,0,0,.45)', 1], [cx, 0, 'rgba(235,240,242,.5)', 0.8]]) {
          c.save(); c.translate(xx, yy + off); c.rotate(ang); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 9.5, 3.4 * wd + 0.6, 0, 0, TAU); c.fill(); c.restore();
        }
        hx.save(); hx.translate(xx, yy); hx.rotate(ang); hx.fillStyle = '#f2f2f2'; hx.beginPath(); hx.ellipse(0, 0, 9, 3, 0, 0, TAU); hx.fill(); hx.restore();
      }
      rx.fillStyle = '#6a6a6a'; rx.fillRect(x0, y0, s, s);
      // рамка листа и заклёпки
      cx.strokeStyle = 'rgba(25,30,34,.9)'; cx.lineWidth = 8; cx.strokeRect(x0 + 4, y0 + 4, s - 8, s - 8);
      hx.strokeStyle = '#e8e8e8'; hx.lineWidth = 6; hx.strokeRect(x0 + 7, y0 + 7, s - 14, s - 14);
      for (const f of [0.1, 0.5, 0.9]) for (const [rx0, ry0] of [[x0 + 12, y0 + f * s], [x0 + s - 12, y0 + f * s], [x0 + f * s, y0 + 12], [x0 + f * s, y0 + s - 12]]) rivet(cx, hx, rx0, ry0, 3.2);
      speckle(cx, w, h, 0, 0);
      blot(cx, hx, rx, w, h, x0 + rnd(30, s - 30), y0 + rnd(30, s - 30), rnd(24, 48), '140,70,26', 0.35, { rough: 235, rk: 0.8 });
    } else {
      // решётка водостока над тёмным лотком
      cx.fillStyle = '#07090a'; cx.fillRect(x0, y0, s, s);
      const gg = cx.createLinearGradient(x0, y0, x0, y0 + s); gg.addColorStop(0, 'rgba(30,50,56,.5)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = gg; cx.fillRect(x0, y0, s, s);
      hx.fillStyle = '#1c1c1c'; hx.fillRect(x0, y0, s, s);
      const m = 14;
      for (let yy = y0 + m + 4; yy < y0 + s - m - 6; yy += 17) {
        const bg = cx.createLinearGradient(0, yy, 0, yy + 9); bg.addColorStop(0, '#9aa3a8'); bg.addColorStop(0.45, '#586167'); bg.addColorStop(1, '#2a3035');
        cx.fillStyle = bg; cx.fillRect(x0 + m, yy, s - 2 * m, 9); hx.fillStyle = '#e6e6e6'; hx.fillRect(x0 + m, yy, s - 2 * m, 9);
      }
      for (let xx = x0 + m + 24; xx < x0 + s - m; xx += 66) { cx.fillStyle = '#3d454a'; cx.fillRect(xx, y0 + m, 6, s - 2 * m); hx.fillStyle = '#d0d0d0'; hx.fillRect(xx, y0 + m, 6, s - 2 * m); }
      cx.strokeStyle = '#6b757b'; cx.lineWidth = 9; cx.strokeRect(x0 + m - 3, y0 + m - 3, s - 2 * m + 6, s - 2 * m + 6);
      hx.strokeStyle = '#f4f4f4'; hx.lineWidth = 9; hx.strokeRect(x0 + m - 3, y0 + m - 3, s - 2 * m + 6, s - 2 * m + 6);
      for (const [rx0, ry0] of [[x0 + 12, y0 + 12], [x0 + s - 12, y0 + 12], [x0 + 12, y0 + s - 12], [x0 + s - 12, y0 + s - 12]]) rivet(cx, hx, rx0, ry0, 4);
      rx.fillStyle = '#707070'; rx.fillRect(x0, y0, s, s);
      blot(cx, hx, rx, w, h, x0 + s / 2, y0 + s - 24, 60, '90,56,24', 0.4, { sq: 0.4, rot: 0 });
    }
  }
  // швы между плитами (с заворотом через край текстуры)
  for (let i = 0; i <= T; i++) {
    const p = i * s;
    for (const o of (i === 0 ? [0, w] : i === T ? [] : [0])) {
      groove(cx, hx, rx, p + o, 0, p + o, h); groove(cx, hx, rx, 0, p + o, w, p + o);
    }
  }
  // стальная закладная полоса (температурный шов) через всю текстуру
  { const xs = 2 * s - 9, sw = 18;
    const bg = cx.createLinearGradient(xs, 0, xs + sw, 0); bg.addColorStop(0, '#2a3035'); bg.addColorStop(0.2, '#8a949a'); bg.addColorStop(0.5, '#5b656b'); bg.addColorStop(1, '#262b30');
    cx.fillStyle = bg; cx.fillRect(xs, 0, sw, h); hx.fillStyle = '#d8d8d8'; hx.fillRect(xs, 0, sw, h); rx.fillStyle = '#5a5a5a'; rx.fillRect(xs, 0, sw, h);
    for (let y = 16; y < h; y += 64) rivet(cx, hx, xs + sw / 2, y, 3); }
  // общий износ: грязь в швах, масло, ржавчина, лужи, царапины
  for (let n = 0; n < 7; n++) blot(cx, hx, rx, w, h, Math.random() * w, Math.random() * h, rnd(24, 80), '8,7,6', rnd(0.25, 0.5), { rough: 40, rk: 0.55, low: 0.12 });
  for (let n = 0; n < 5; n++) blot(cx, hx, rx, w, h, Math.random() * w, Math.random() * h, rnd(16, 46), '120,58,20', rnd(0.14, 0.26), { rough: 230, rk: 0.7 });
  for (let n = 0; n < 3; n++) { // лужи: тёмные, влажные, почти зеркальные
    const px = Math.random() * w, py = Math.random() * h, r = rnd(34, 76);
    blot(cx, hx, rx, w, h, px, py, r, '10,16,20', 0.55, { rough: 14, rk: 1, low: 0.18, sq: rnd(0.45, 0.85) });
  }
  scratchLine(cx, hx, w, h, 90, 70, 0.09);
  // следы колёс тележки
  for (let n = 0; n < 2; n++) { const y = Math.random() * h, x = Math.random() * w; wrap(w, h, (dx, dy) => { cx.strokeStyle = 'rgba(6,6,6,.16)'; cx.lineWidth = 7; cx.beginPath(); cx.moveTo(x + dx, y + dy); cx.bezierCurveTo(x + dx + 120, y + dy + 40, x + dx + 240, y + dy - 30, x + dx + 460, y + dy + 20); cx.stroke(); }); }
  speckle(cx, w, h, 14000, 0.06);
}

/* ---------- Генераторная: рифлёные листы, решётчатые настилы, окрашенная палуба, сварка, масло ---------- */
function drawGeneratorFloor(cx, hx, rx, w, h) {
  const P = w / 2, M = 12; // панель 1.5 × 1.5 м
  const kinds = [['diamond', 'grate'], ['deck', 'diamond']];
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const x0 = i * P, y0 = j * P, k = kinds[j][i];
    if (k === 'diamond') {
      const g = cx.createLinearGradient(x0, y0, x0 + P, y0 + P); g.addColorStop(0, '#6a727a'); g.addColorStop(1, '#4c545b'); cx.fillStyle = g; cx.fillRect(x0, y0, P, P);
      rx.fillStyle = '#5c5c5c'; rx.fillRect(x0, y0, P, P);
      const sp = 26;
      for (let r = 0, yy = y0 + 16; yy < y0 + P - 8; yy += sp * 0.62, r++) for (let xx = x0 + 18 + (r % 2) * sp / 2; xx < x0 + P - 8; xx += sp) {
        const ang = (Math.floor((xx - x0) / sp) + r) % 2 ? Math.PI / 4 : -Math.PI / 4;
        cx.save(); cx.translate(xx, yy + 1.8); cx.rotate(ang); cx.fillStyle = 'rgba(0,0,0,.5)'; cx.beginPath(); cx.ellipse(0, 0, 11, 3.6, 0, 0, TAU); cx.fill(); cx.restore();
        cx.save(); cx.translate(xx, yy); cx.rotate(ang); const lg = cx.createLinearGradient(-11, -4, 11, 4); lg.addColorStop(0, 'rgba(240,244,246,.7)'); lg.addColorStop(1, 'rgba(150,158,164,.5)'); cx.fillStyle = lg; cx.beginPath(); cx.ellipse(0, 0, 10.5, 3.4, 0, 0, TAU); cx.fill(); cx.restore();
        hx.save(); hx.translate(xx, yy); hx.rotate(ang); hx.fillStyle = '#fafafa'; hx.beginPath(); hx.ellipse(0, 0, 10, 3.2, 0, 0, TAU); hx.fill(); hx.restore();
      }
    } else if (k === 'grate') {
      cx.fillStyle = '#050607'; cx.fillRect(x0, y0, P, P);
      const gl = cx.createRadialGradient(x0 + P / 2, y0 + P / 2, 10, x0 + P / 2, y0 + P / 2, P * 0.7); gl.addColorStop(0, 'rgba(255,110,30,.28)'); gl.addColorStop(1, 'rgba(255,110,30,0)'); cx.fillStyle = gl; cx.fillRect(x0, y0, P, P);
      hx.fillStyle = '#141414'; hx.fillRect(x0, y0, P, P);
      for (let yy = y0 + M + 3; yy < y0 + P - M - 8; yy += 18) {
        const bg = cx.createLinearGradient(0, yy, 0, yy + 11); bg.addColorStop(0, '#a4adb2'); bg.addColorStop(0.4, '#5e676d'); bg.addColorStop(1, '#2b3136');
        cx.fillStyle = bg; cx.fillRect(x0 + M, yy, P - 2 * M, 11); hx.fillStyle = '#ececec'; hx.fillRect(x0 + M, yy, P - 2 * M, 11);
      }
      for (let xx = x0 + M + 20; xx < x0 + P - M; xx += 46) { cx.fillStyle = '#434b50'; cx.fillRect(xx, y0 + M, 5, P - 2 * M); hx.fillStyle = '#d8d8d8'; hx.fillRect(xx, y0 + M, 5, P - 2 * M); }
      cx.strokeStyle = '#2f373c'; cx.lineWidth = 14; cx.strokeRect(x0 + 4, y0 + 4, P - 8, P - 8); cx.strokeStyle = '#78828a'; cx.lineWidth = 2; cx.strokeRect(x0 + 10, y0 + 10, P - 20, P - 20);
      hx.strokeStyle = '#fafafa'; hx.lineWidth = 14; hx.strokeRect(x0 + 4, y0 + 4, P - 8, P - 8);
      rx.fillStyle = '#505050'; rx.fillRect(x0, y0, P, P);
    } else {
      // окрашенная палуба: тёмно-серая эмаль, потёртая до металла, трафарет
      const g = cx.createLinearGradient(x0, y0, x0, y0 + P); g.addColorStop(0, '#363a3e'); g.addColorStop(1, '#2b2f33'); cx.fillStyle = g; cx.fillRect(x0, y0, P, P);
      rx.fillStyle = '#9a9a9a'; rx.fillRect(x0, y0, P, P);
      for (let n = 0; n < 40; n++) { const px = x0 + rnd(20, P - 20), py = y0 + rnd(20, P - 20); blot(cx, hx, rx, w, h, px, py, rnd(6, 20), '148,152,150', rnd(0.2, 0.5), { rough: 90, rk: 0.8, sq: rnd(0.3, 0.8) }); }
      cx.save(); cx.translate(x0 + P / 2, y0 + P / 2); cx.fillStyle = 'rgba(230,185,45,.82)'; cx.font = 'bold 74px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('ГЕН-2', 0, -4);
      cx.fillRect(-100, 46, 200, 8); cx.restore();
      for (let n = 0; n < 900; n++) { cx.fillStyle = `rgba(20,20,20,${rnd(0.3, 0.8)})`; cx.fillRect(x0 + P / 2 - 140 + Math.random() * 280, y0 + P / 2 - 50 + Math.random() * 110, 1.6, 1.6); }
      for (const [rx0, ry0] of [[x0 + 24, y0 + 24], [x0 + P - 24, y0 + 24], [x0 + 24, y0 + P - 24], [x0 + P - 24, y0 + P - 24]]) rivet(cx, hx, rx0, ry0, 4.5);
    }
    // обрамляющий угловой профиль панели + заклёпки по периметру
    cx.strokeStyle = 'rgba(8,10,12,.95)'; cx.lineWidth = 8; cx.strokeRect(x0 + 1, y0 + 1, P - 2, P - 2);
    if (k !== 'grate') for (let t = 0.1; t < 0.95; t += 0.16) for (const [rx0, ry0] of [[x0 + t * P, y0 + 10], [x0 + t * P, y0 + P - 10], [x0 + 10, y0 + t * P], [x0 + P - 10, y0 + t * P]]) rivet(cx, hx, rx0, ry0, 3);
  }
  // швы панелей (с заворотом) и сварные валики
  for (const p of [0, P]) { groove(cx, hx, rx, p, 0, p, h, 8); groove(cx, hx, rx, 0, p, w, p, 8); }
  groove(cx, hx, rx, w, 0, w, h, 8); groove(cx, hx, rx, 0, h, w, h, 8);
  for (let n = 0; n < 6; n++) {
    const vx = Math.random() < 0.5, p = Math.random() * w, q = Math.random() * w;
    cx.strokeStyle = 'rgba(150,120,80,.35)'; cx.lineWidth = 3; cx.setLineDash([5, 3]);
    cx.beginPath(); if (vx) { cx.moveTo(p, q); cx.lineTo(p, q + rnd(40, 110)); } else { cx.moveTo(q, p); cx.lineTo(q + rnd(40, 110), p); } cx.stroke(); cx.setLineDash([]);
  }
  // масло, мазут, ржавчина, копоть, царапины
  for (let n = 0; n < 8; n++) blot(cx, hx, rx, w, h, Math.random() * w, Math.random() * h, rnd(26, 90), '6,5,4', rnd(0.35, 0.62), { rough: 18, rk: 0.95, low: 0.1, sq: rnd(0.4, 0.9) });
  for (let n = 0; n < 6; n++) blot(cx, hx, rx, w, h, Math.random() * w, Math.random() * h, rnd(18, 54), '128,60,20', rnd(0.2, 0.34), { rough: 235, rk: 0.8 });
  for (let n = 0; n < 4; n++) blot(cx, hx, rx, w, h, Math.random() * w, Math.random() * h, rnd(30, 70), '0,0,0', 0.4, {});
  scratchLine(cx, hx, w, h, 130, 90, 0.1);
  speckle(cx, w, h, 16000, 0.07);
}

let _corr = null, _gen = null;
const corridorMaps = () => _corr || (_corr = mkMaps(1024, 1024, drawCorridorFloor));
const generatorMaps = () => _gen || (_gen = mkMaps(1024, 1024, drawGeneratorFloor));
/** Материал общего пола технических коридоров; S — сторона уровня в метрах (плита 4×4 м). */
export function corridorFloorMat(S) {
  const m = corridorMaps(), cl = (t) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(S / 4, S / 4); return c; };
  return new THREE.MeshStandardMaterial({ map: cl(m.map), bumpMap: cl(m.bump), bumpScale: 2.2, roughnessMap: cl(m.rough), roughness: 1, metalness: 0.12 });
}

/* ---------- Мелкие детали на полу: лужи и решётки (текстуры-накладки) ---------- */
let _puddle = null, _drain = null;
export function puddleTex() {
  return _puddle || (_puddle = mkTex(128, 128, (x, w, h) => {
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 60); g.addColorStop(0, 'rgba(18,26,32,.95)'); g.addColorStop(0.7, 'rgba(18,24,28,.85)'); g.addColorStop(1, 'rgba(18,24,28,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(64, 64, 58, 46, 0.4, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(160,190,205,.2)'; x.lineWidth = 2; x.beginPath(); x.ellipse(60, 60, 40, 30, 0.4, 0.5, 2.4); x.stroke();
  }, false));
}
export function drainTex() {
  return _drain || (_drain = mkTex(128, 128, (x, w, h) => {
    x.fillStyle = '#080a0b'; x.fillRect(0, 0, w, h);
    for (let y = 14; y < h - 12; y += 10) { const bg = x.createLinearGradient(0, y, 0, y + 6); bg.addColorStop(0, '#9aa3a8'); bg.addColorStop(1, '#3a4146'); x.fillStyle = bg; x.fillRect(10, y, w - 20, 6); }
    x.fillStyle = '#3d454a'; for (const px of [34, 64, 94]) x.fillRect(px, 10, 4, h - 20);
    x.strokeStyle = '#59636a'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
    for (const [px, py] of [[12, 12], [w - 12, 12], [12, h - 12], [w - 12, h - 12]]) { x.fillStyle = '#c8cfd2'; x.beginPath(); x.arc(px, py, 3, 0, TAU); x.fill(); }
    speckle(x, w, h, 500, 0.2);
  }, false));
}

/* ---------- Таблички зон над проёмами ---------- */
const zoneSignMats = {};
export function zoneSignMat(type) {
  if (zoneSignMats[type]) return zoneSignMats[type];
  const z = ZONES[type];
  const t = mkTex(320, 80, (x, w, h) => {
    x.fillStyle = '#0b0f0e'; x.fillRect(0, 0, w, h);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(0,0,0,.2)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = z.color; x.fillRect(0, 0, 14, h);
    x.strokeStyle = z.color; x.lineWidth = 3; x.strokeRect(3, 3, w - 6, h - 6);
    x.globalAlpha = 0.35; x.lineWidth = 1; x.strokeRect(9, 9, w - 18, h - 18); x.globalAlpha = 1;
    let fs = 38; x.textAlign = 'center'; x.textBaseline = 'middle';
    do { x.font = `bold ${fs}px sans-serif`; fs -= 2; } while (x.measureText(z.name.toUpperCase()).width > w - 50 && fs > 14);
    x.fillStyle = z.color; x.fillText(z.name.toUpperCase(), w / 2 + 6, h / 2 + 2);
    x.fillStyle = 'rgba(255,255,255,.18)'; for (let y = 0; y < h; y += 3) x.fillRect(14, y, w - 14, 1);
    x.fillStyle = 'rgba(0,0,0,.6)'; for (const [bx, by] of [[24, 12], [w - 12, 12], [24, h - 12], [w - 12, h - 12]]) { x.beginPath(); x.arc(bx, by, 2.5, 0, TAU); x.fill(); }
  }, false);
  return (zoneSignMats[type] = new THREE.MeshBasicMaterial({ map: t }));
}

/* ---------- Полы зон: бесшовная основа (на 3 м) + маркировка (на клетку) ---------- */
const BASE = {
  airlock(x, w, h) {
    x.fillStyle = '#1f3d33'; x.fillRect(0, 0, w, h); speckle(x, w, h, 5000, 0.1);
    stains(x, w, h, 3, '0,0,0', 0.25, 20, 50);
    x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 3;
    for (let i = 0; i <= w; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    x.fillStyle = 'rgba(120,255,170,.06)'; x.fillRect(0, 0, w, h);
  },
  living(x, w, h) { planks(x, w, h, 14, [96, 70, 46], 16); speckle(x, w, h, 4000, 0.08); },
  medbay(x, w, h) {
    const s = w / 8;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const v = rnd(-8, 8); x.fillStyle = `rgb(${204 + v | 0},${220 + v | 0},${222 + v | 0})`; x.fillRect(i * s, j * s, s, s); }
    speckle(x, w, h, 3500, 0.07);
    x.strokeStyle = 'rgba(70,100,108,.7)'; x.lineWidth = 2;
    for (let i = 0; i <= w; i += s) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    stains(x, w, h, 3, '90,40,30', 0.14, 14, 30);
  },
  canteen(x, w, h) {
    const s = w / 8;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#dedbc6' : '#25282a'; x.fillRect(i * s, j * s, s, s); }
    speckle(x, w, h, 4000, 0.1); stains(x, w, h, 3, '40,25,10', 0.2, 14, 36);
    x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 1.5;
    for (let i = 0; i <= w; i += s) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  },
  warehouse(x, w, h) {
    x.fillStyle = '#4a4943'; x.fillRect(0, 0, w, h); speckle(x, w, h, 9000, 0.12);
    stains(x, w, h, 6, '10,8,6', 0.35, 16, 50); stains(x, w, h, 3, '120,70,20', 0.16, 12, 30);
    x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 2;
    for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(0, i * 85 + 20); x.lineTo(w, i * 85 + 20 + rnd(-6, 6)); x.stroke(); }
    x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 6;
    for (let i = 0; i < 4; i++) { const y = rnd(10, h - 10); x.beginPath(); x.moveTo(rnd(0, 60), y); x.bezierCurveTo(100, y + 20, 160, y - 20, w, y + 8); x.stroke(); }
  },
  server(x, w, h) {
    const s = w / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      x.fillStyle = '#1b2538'; x.fillRect(i * s, j * s, s, s);
      x.fillStyle = 'rgba(8,14,26,.8)';
      for (let a = 10; a < s - 6; a += 10) for (let b = 10; b < s - 6; b += 10) { x.beginPath(); x.arc(i * s + a, j * s + b, 2.1, 0, TAU); x.fill(); }
    }
    speckle(x, w, h, 3500, 0.08);
    x.strokeStyle = 'rgba(100,170,255,.35)'; x.lineWidth = 2;
    for (let i = 0; i <= w; i += s) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  },
  armory(x, w, h) {
    x.fillStyle = '#2a3322'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 3;
    for (let i = -h; i < w + h; i += 14) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.beginPath(); x.moveTo(i + h, 0); x.lineTo(i, h); x.stroke(); }
    speckle(x, w, h, 5000, 0.12);
    x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 3;
    for (let i = 0; i <= w; i += 128) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  },
  vault(x, w, h) {
    const s = w / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = rnd(-6, 6); x.fillStyle = `rgb(${40 + v | 0},${34 + v | 0},${26 + v | 0})`; x.fillRect(i * s, j * s, s, s); }
    speckle(x, w, h, 6000, 0.1);
    x.strokeStyle = 'rgba(220,170,60,.6)'; x.lineWidth = 3;
    for (let i = 0; i <= w; i += s) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    x.strokeStyle = 'rgba(220,170,60,.25)'; x.lineWidth = 1;
    for (let i = 8; i <= w; i += s) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  }
};
const SURF = { airlock: [0.45, 0.2], living: [0.8, 0.02], medbay: [0.35, 0.05], canteen: [0.45, 0.05], warehouse: [0.9, 0.1], server: [0.4, 0.3], generator: [1, 0.55], armory: [0.8, 0.1], vault: [0.3, 0.3] };
const zoneFloorMats = {};
export function zoneFloorMat(type) {
  if (zoneFloorMats[type]) return zoneFloorMats[type];
  if (type === 'generator') {
    const m = generatorMaps();
    return (zoneFloorMats[type] = new THREE.MeshStandardMaterial({ map: m.map, bumpMap: m.bump, bumpScale: 3, roughnessMap: m.rough, roughness: 1, metalness: 0.55, polygonOffset: true, polygonOffsetFactor: -1 }));
  }
  const t = mkTex(256, 256, BASE[type]);
  const [r, m] = SURF[type];
  return (zoneFloorMats[type] = new THREE.MeshStandardMaterial({ map: t, roughness: r, metalness: m, polygonOffset: true, polygonOffsetFactor: -1 }));
}
const MARK = {
  airlock(x, w, h) {
    x.strokeStyle = 'rgba(120,255,170,.75)'; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16);
    x.fillStyle = 'rgba(160,255,200,.6)'; x.beginPath(); x.moveTo(64, 28); x.lineTo(96, 70); x.lineTo(76, 70); x.lineTo(76, 100); x.lineTo(52, 100); x.lineTo(52, 70); x.lineTo(32, 70); x.fill();
  },
  living(x, w, h) {
    x.fillStyle = '#6a2a26'; x.fillRect(12, 20, w - 24, h - 40);
    x.strokeStyle = '#d9c79c'; x.lineWidth = 3; x.strokeRect(15, 23, w - 30, h - 46);
    x.strokeStyle = '#2b3a4a'; x.lineWidth = 5; x.strokeRect(24, 32, w - 48, h - 64);
    x.strokeStyle = '#c99a4a'; x.lineWidth = 1.5; x.strokeRect(34, 42, w - 68, h - 84);
    for (let i = 0; i < 3; i++) { const cx = w / 2 + (i - 1) * 22, cy = h / 2; x.fillStyle = i % 2 ? '#c99a4a' : '#d9c79c'; x.beginPath(); x.moveTo(cx, cy - 15); x.lineTo(cx + 10, cy); x.lineTo(cx, cy + 15); x.lineTo(cx - 10, cy); x.closePath(); x.fill(); }
    x.fillStyle = '#d9c79c'; for (let i = 12; i < w - 12; i += 4) { x.fillRect(i, 16, 1.5, 4); x.fillRect(i, h - 20, 1.5, 4); }
    speckle(x, w, h, 900, 0.14);
  },
  medbay(x, w, h) {
    x.fillStyle = 'rgba(200,40,40,.55)'; x.fillRect(54, 34, 20, 60); x.fillRect(34, 54, 60, 20);
  },
  warehouse(x, w, h) {
    x.strokeStyle = 'rgba(235,185,35,.9)'; x.lineWidth = 5; x.strokeRect(8, 8, w - 16, h - 16);
    x.setLineDash([14, 12]); x.strokeStyle = 'rgba(235,185,35,.55)'; x.lineWidth = 3; x.beginPath(); x.moveTo(64, 14); x.lineTo(64, 114); x.stroke(); x.setLineDash([]);
  },
  generator(x, w, h) {
    // потёртая жёлто-чёрная предупреждающая кайма по периметру клетки + угловые накладки
    const k = w / 128, e = 11 * k;
    x.save(); x.beginPath(); x.rect(0, 0, w, h); x.rect(e, e, w - 2 * e, h - 2 * e); x.clip('evenodd');
    x.fillStyle = 'rgba(232,184,34,.9)'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(18,18,18,.92)'; x.lineWidth = 8 * k;
    for (let i = -h; i < w + h; i += 20 * k) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); }
    // износ краски: стираем случайные пятна и царапины
    x.globalCompositeOperation = 'destination-out';
    for (let n = 0; n < 220; n++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.6})`; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 4 * k, 1 + Math.random() * 2 * k); }
    for (let n = 0; n < 14; n++) { x.strokeStyle = `rgba(0,0,0,${0.3 + Math.random() * 0.5})`; x.lineWidth = 1 + Math.random() * 2; const sx = Math.random() * w, sy = Math.random() * h; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + (Math.random() - 0.5) * 50 * k, sy + (Math.random() - 0.5) * 50 * k); x.stroke(); }
    x.restore();
    // тёмная кромка внутри каймы
    x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 2 * k; x.strokeRect(e, e, w - 2 * e, h - 2 * e);
    // болты в углах
    for (const [bx, by] of [[e / 2, e / 2], [w - e / 2, e / 2], [e / 2, h - e / 2], [w - e / 2, h - e / 2]]) { x.fillStyle = '#20252a'; x.beginPath(); x.arc(bx, by, 2.6 * k, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(bx - 0.6 * k, by - 0.6 * k, 1 * k, 0, 7); x.fill(); }
  },
  server(x, w, h) { x.strokeStyle = 'rgba(110,190,255,.6)'; x.lineWidth = 3; x.strokeRect(2, 2, w - 4, h - 4); },
  armory(x, w, h) { x.strokeStyle = 'rgba(190,210,110,.55)'; x.lineWidth = 4; x.strokeRect(6, 6, w - 12, h - 12); },
  vault(x, w, h) { for (const r of [56, 42, 28]) { x.strokeStyle = 'rgba(255,200,80,.7)'; x.lineWidth = 3; x.beginPath(); x.arc(64, 64, r, 0, 7); x.stroke(); } }
};
const zoneMarkMats = {};
export function zoneMarkMat(type) {
  if (!MARK[type]) return null;
  if (zoneMarkMats[type]) return zoneMarkMats[type];
  const sz = type === 'generator' ? 256 : 128, t = mkTex(sz, sz, MARK[type], false);
  return (zoneMarkMats[type] = new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, roughness: 0.7 }));
}

/* ---------- Текстуры реквизита ---------- */
export const TEX = {};
const L = (k, f) => Object.defineProperty(TEX, k, { get() { const v = f(); Object.defineProperty(TEX, k, { value: v }); return v; }, configurable: true });
L('wood', () => mkTex(256, 256, (x, w, h) => { planks(x, w, h, 5, [128, 92, 58], 12); speckle(x, w, h, 2500, 0.07); }));
L('darkWood', () => mkTex(256, 256, (x, w, h) => { planks(x, w, h, 4, [78, 56, 38], 10); speckle(x, w, h, 2500, 0.08); }));
L('crate', () => mkTex(256, 256, (x, w, h) => {
  planks(x, w, h, 6, [118, 90, 58], 14, false);
  x.fillStyle = 'rgba(40,28,16,.85)'; x.fillRect(0, 0, 22, h); x.fillRect(w - 22, 0, 22, h);
  x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 3; x.beginPath(); x.moveTo(22, 20); x.lineTo(w - 22, h - 20); x.stroke();
  x.fillStyle = 'rgba(0,0,0,.6)'; for (const y of [20, h - 20]) for (const xx of [11, w - 11]) { x.beginPath(); x.arc(xx, y, 3, 0, TAU); x.fill(); }
  speckle(x, w, h, 3000, 0.1);
}));
L('metal', () => mkTex(128, 128, (x, w, h) => {
  x.fillStyle = '#c4c8c8'; x.fillRect(0, 0, w, h); speckle(x, w, h, 2500, 0.12);
  x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 1; for (let i = 0; i < h; i += 3) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  x.strokeStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 12; i++) { const sx = Math.random() * w, sy = Math.random() * h; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + rnd(-30, 30), sy + rnd(-8, 8)); x.stroke(); }
  stains(x, w, h, 3, '90,50,20', 0.22, 8, 20);
}));
L('ammoCrate', () => mkTex(256, 128, (x, w, h) => {
  x.fillStyle = '#3f4a30'; x.fillRect(0, 0, w, h); speckle(x, w, h, 3500, 0.14);
  x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 3; x.strokeRect(4, 4, w - 8, h - 8);
  x.fillStyle = '#e8d77a'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.fillText('9 MM', w / 2, 56); x.font = 'bold 18px sans-serif'; x.fillText('БОЕПРИПАСЫ', w / 2, 88);
  x.fillRect(24, 100, w - 48, 4);
}));
L('blanket', () => mkTex(256, 256, (x, w, h) => {
  x.fillStyle = '#566240'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < h; i += 32) { x.fillStyle = i % 64 ? '#3f4a2e' : '#7c7a4c'; x.fillRect(0, i, w, 8); }
  speckle(x, w, h, 5000, 0.18);
}));
L('blanket2', () => mkTex(256, 256, (x, w, h) => {
  x.fillStyle = '#6b3a32'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < h; i += 32) { x.fillStyle = i % 64 ? '#4e2a24' : '#b9a27a'; x.fillRect(0, i, w, 6); }
  for (let i = 0; i < w; i += 32) { x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(i, 0, 6, h); }
  speckle(x, w, h, 5000, 0.18);
}));
L('sheet', () => mkTex(128, 128, (x, w, h) => {
  x.fillStyle = '#b8bcc0'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < w; i += 16) { x.fillStyle = 'rgba(70,90,120,.35)'; x.fillRect(i, 0, 5, h); }
  speckle(x, w, h, 2000, 0.12);
}));
L('paper', () => mkTex(512, 340, (x, w, h) => {
  x.fillStyle = '#d8ccaa'; x.fillRect(0, 0, w, h); speckle(x, w, h, 6000, 0.12);
  x.strokeStyle = 'rgba(60,50,30,.16)'; x.lineWidth = 1;
  for (let i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
  for (let i = 0; i < h; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  x.strokeStyle = '#2d2a22'; x.lineWidth = 4; x.lineCap = 'round';
  const nodes = [];
  for (let gx = 0; gx < 6; gx++) for (let gy = 0; gy < 4; gy++) nodes.push([70 + gx * 74 + rnd(-10, 10), 62 + gy * 72 + rnd(-8, 8)]);
  for (let i = 0; i < nodes.length; i++) {
    const gx = Math.floor(i / 4), gy = i % 4;
    if (gy < 3 && Math.random() < 0.8) { x.beginPath(); x.moveTo(...nodes[i]); x.lineTo(...nodes[i + 1]); x.stroke(); }
    if (gx < 5 && Math.random() < 0.7) { x.beginPath(); x.moveTo(...nodes[i]); x.lineTo(...nodes[i + 4]); x.stroke(); }
  }
  x.fillStyle = '#2d2a22'; for (const n of nodes) x.fillRect(n[0] - 6, n[1] - 6, 12, 12);
  x.strokeStyle = '#c0392b'; for (let i = 0; i < 7; i++) { const n = nodes[(Math.random() * nodes.length) | 0]; x.beginPath(); x.moveTo(n[0] - 12, n[1] - 12); x.lineTo(n[0] + 12, n[1] + 12); x.moveTo(n[0] + 12, n[1] - 12); x.lineTo(n[0] - 12, n[1] + 12); x.stroke(); }
  x.fillStyle = '#2f9e5d'; x.beginPath(); x.arc(nodes[0][0], nodes[0][1], 13, 0, TAU); x.fill();
  x.fillStyle = '#fff'; x.font = 'bold 14px sans-serif'; x.textAlign = 'center'; x.fillText('17', nodes[0][0], nodes[0][1] + 5);
  x.fillStyle = '#2d2a22'; x.font = 'bold 22px sans-serif'; x.textAlign = 'left'; x.fillText('СЕТЬ БУНКЕРОВ', 16, 30);
  x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 6; x.strokeRect(0, 0, w, h);
}, false));
L('kids', () => mkTex(256, 256, (x, w, h) => {
  x.fillStyle = '#efe6cf'; x.fillRect(0, 0, w, h); speckle(x, w, h, 2500, 0.1);
  x.lineCap = 'round'; x.lineJoin = 'round';
  x.strokeStyle = '#d4a017'; x.lineWidth = 10; x.beginPath(); x.arc(212, 40, 18, 0, TAU); x.stroke();
  x.strokeStyle = '#5b8f3a'; x.lineWidth = 8; x.beginPath(); x.moveTo(0, 214); x.lineTo(256, 208); x.stroke();
  x.strokeStyle = '#a63d2f'; x.lineWidth = 7; x.strokeRect(34, 120, 74, 80);
  x.beginPath(); x.moveTo(26, 124); x.lineTo(71, 80); x.lineTo(116, 124); x.stroke();
  x.strokeStyle = '#2f5fa8'; x.lineWidth = 6;
  [[150, 200], [176, 200], [202, 200]].forEach(([px, py], i) => {
    const s = i === 1 ? 0.7 : 1;
    x.beginPath(); x.arc(px, py - 62 * s, 11 * s, 0, TAU); x.moveTo(px, py - 51 * s); x.lineTo(px, py - 20 * s);
    x.moveTo(px - 16 * s, py - 42 * s); x.lineTo(px + 16 * s, py - 42 * s); x.moveTo(px, py - 20 * s); x.lineTo(px - 11 * s, py); x.moveTo(px, py - 20 * s); x.lineTo(px + 11 * s, py); x.stroke();
  });
  x.fillStyle = '#2d2a22'; x.font = 'bold 20px sans-serif'; x.fillText('МЫ ДОМА', 26, 36);
}, false));
L('hazard', () => mkTex(256, 64, (x, w, h) => {
  x.fillStyle = '#d9a920'; x.fillRect(0, 0, w, h); x.fillStyle = '#17140f';
  for (let i = -h; i < w + h; i += 40) { x.beginPath(); x.moveTo(i, h); x.lineTo(i + 20, h); x.lineTo(i + 20 + h, 0); x.lineTo(i + h, 0); x.closePath(); x.fill(); }
  speckle(x, w, h, 900, 0.2);
}));
L('crossMed', () => mkTex(64, 64, (x) => { x.fillStyle = '#e9ece8'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#c0392b'; x.fillRect(24, 10, 16, 44); x.fillRect(10, 24, 44, 16); }, false));
L('clock', () => mkTex(128, 128, (x) => {
  x.fillStyle = '#2a2a2a'; x.beginPath(); x.arc(64, 64, 62, 0, TAU); x.fill();
  x.fillStyle = '#ece6d2'; x.beginPath(); x.arc(64, 64, 56, 0, TAU); x.fill(); x.fillStyle = '#222';
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.fillRect(64 + Math.sin(a) * 46 - 2, 64 - Math.cos(a) * 46 - 2, 4, i % 3 ? 4 : 8); }
  x.strokeStyle = '#111'; x.lineWidth = 5; x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.sin(2.1) * 28, 64 - Math.cos(2.1) * 28); x.stroke();
  x.lineWidth = 3; x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.sin(5.3) * 42, 64 - Math.cos(5.3) * 42); x.stroke();
}, false));
L('warn', () => mkTex(128, 128, (x, w, h) => {
  x.fillStyle = '#1b1b16'; x.fillRect(0, 0, w, h); x.fillStyle = '#e6b422'; x.beginPath(); x.moveTo(64, 8); x.lineTo(122, 112); x.lineTo(6, 112); x.closePath(); x.fill();
  x.strokeStyle = '#17140f'; x.lineWidth = 8; x.lineJoin = 'round'; x.stroke();
  x.fillStyle = '#17140f'; x.fillRect(58, 42, 12, 38); x.beginPath(); x.arc(64, 92, 7, 0, TAU); x.fill();
}, false));
L('screen', () => mkTex(256, 160, (x, w, h) => {
  x.fillStyle = '#04140c'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#3dff8a'; x.font = 'bold 13px monospace';
  const lines = ['> СИСТЕМА ЖИЗНЕОБЕСПЕЧЕНИЯ', '> ШЛЮЗ 17: ЗАКРЫТ', '> СЕКТОР Б: НЕТ СВЯЗИ', '> ПИТАНИЕ: РЕЗЕРВ 41%', '> ЗАРАЖЕНИЕ: ВОДА ВТ.КОНТ.', '> ВЫЖИВШИХ: ???', '> ПОВТОРИТЬ ЗАПРОС? _'];
  lines.forEach((l, i) => x.fillText(l, 10, 22 + i * 19));
  x.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < h; y += 3) x.fillRect(0, y, w, 1);
}, false));
L('ecg', () => mkTex(128, 80, (x, w, h) => {
  x.fillStyle = '#031208'; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#4aff8a'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 44);
  for (let i = 0; i < 3; i++) { const o = i * 42; x.lineTo(o + 10, 44); x.lineTo(o + 14, 40); x.lineTo(o + 18, 44); x.lineTo(o + 22, 44); x.lineTo(o + 25, 14); x.lineTo(o + 29, 62); x.lineTo(o + 32, 44); x.lineTo(o + 42, 44); }
  x.stroke();
  x.fillStyle = '#4aff8a'; x.font = 'bold 12px monospace'; x.fillText('HR 71', 6, 14);
}, false));
L('menu', () => mkTex(256, 160, (x, w, h) => {
  x.fillStyle = '#233a2e'; x.fillRect(0, 0, w, h); speckle(x, w, h, 2500, 0.1);
  x.strokeStyle = '#7a5a34'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
  x.fillStyle = '#efe9d4'; x.textAlign = 'center'; x.font = 'bold 26px sans-serif'; x.fillText('МЕНЮ', w / 2, 40);
  x.font = '16px sans-serif'; x.textAlign = 'left';
  ['Гречка с тушёнкой', 'Сухари ....... 2', 'Компот ........ 1', 'Суп из банки'].forEach((l, i) => x.fillText(l, 22, 70 + i * 26));
}, false));
L('chart', () => mkTex(256, 160, (x, w, h) => {
  x.fillStyle = '#e9ecea'; x.fillRect(0, 0, w, h); speckle(x, w, h, 1500, 0.08);
  x.strokeStyle = '#2f6f78'; x.lineWidth = 2; x.strokeRect(6, 6, w - 12, h - 12);
  x.fillStyle = '#2f6f78'; x.font = 'bold 16px sans-serif'; x.fillText('ТЕМПЕРАТУРА / ДЕНЬ', 16, 28);
  x.beginPath(); x.moveTo(16, 120);
  for (let i = 0; i < 10; i++) x.lineTo(16 + i * 24, 110 - Math.pow(i, 1.4) * 4 + rnd(-8, 8));
  x.stroke();
  x.strokeStyle = '#c0392b'; x.beginPath(); x.moveTo(16, 60); x.lineTo(w - 16, 60); x.stroke();
}, false));
L('notice', () => mkTex(256, 160, (x, w, h) => {
  x.fillStyle = '#7a5a38'; x.fillRect(0, 0, w, h); speckle(x, w, h, 6000, 0.14);
  x.strokeStyle = '#3a2814'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
  for (let i = 0; i < 5; i++) {
    const px = 18 + i * 46 + rnd(-4, 4), py = 18 + rnd(0, 40), ww = 36, hh = 48 + rnd(0, 30);
    x.save(); x.translate(px + ww / 2, py + hh / 2); x.rotate(rnd(-0.1, 0.1));
    x.fillStyle = ['#efe6cf', '#e0d7a8', '#d6e0e0'][i % 3]; x.fillRect(-ww / 2, -hh / 2, ww, hh);
    x.fillStyle = 'rgba(40,30,20,.55)'; for (let l = 0; l < 5; l++) x.fillRect(-ww / 2 + 4, -hh / 2 + 10 + l * 7, ww - 8 - rnd(0, 10), 2);
    x.fillStyle = '#b02a2a'; x.beginPath(); x.arc(0, -hh / 2 + 4, 2.5, 0, TAU); x.fill(); x.restore();
  }
}, false));
L('peg', () => mkTex(512, 200, (x, w, h) => {
  x.fillStyle = '#5a4630'; x.fillRect(0, 0, w, h); speckle(x, w, h, 7000, 0.1);
  x.fillStyle = 'rgba(0,0,0,.55)';
  for (let i = 14; i < w; i += 28) for (let j = 14; j < h; j += 28) { x.beginPath(); x.arc(i, j, 2.4, 0, TAU); x.fill(); }
  x.strokeStyle = 'rgba(235,225,200,.8)'; x.lineWidth = 4; x.lineCap = 'round';
  x.beginPath(); x.moveTo(60, 30); x.lineTo(60, 150); x.stroke(); x.strokeRect(40, 22, 40, 18);
  for (let i = 0; i < 4; i++) { const px = 130 + i * 36; x.beginPath(); x.moveTo(px, 30); x.lineTo(px, 120 - i * 10); x.stroke(); x.beginPath(); x.arc(px, 134 - i * 10, 12 - i, 0, TAU); x.stroke(); }
  x.beginPath(); x.moveTo(300, 40); x.lineTo(400, 40); x.lineTo(400, 62); x.lineTo(300, 100); x.closePath(); x.stroke();
  x.beginPath(); x.arc(450, 70, 28, 0, TAU); x.stroke();
}, false));
