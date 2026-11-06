// @ts-nocheck
/* ============================================================
   Мебель убежища: 3D-модели (радио, свеча, картина, стул) и предпросмотр на верстаке.
   Модели строятся «лицом» в +Z, основание — в y = 0 (картина — по центру рамки).
   Одни и те же модели ставятся в комнату убежища и показываются на верстаке.
   ============================================================ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildWeaponModel, litMat } from './weaponModels';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- Текстуры ---------- */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
let woodTex = null, paintTex = null, grilleTex = null, dialTex = null;
function getWood() {
  return woodTex || (woodTex = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#8a6240'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) {
      x.strokeStyle = `rgba(${Math.random() < 0.5 ? '40,24,10' : '210,170,120'},${0.05 + Math.random() * 0.12})`;
      x.lineWidth = 1 + Math.random() * 1.5;
      const y = Math.random() * h; x.beginPath(); x.moveTo(0, y);
      x.bezierCurveTo(w * 0.3, y + rnd(-4, 4), w * 0.7, y + rnd(-4, 4), w, y + rnd(-2, 2)); x.stroke();
    }
  }));
}
function getPainting() {
  return paintTex || (paintTex = canvasTex(512, 352, (x, w, h) => {
    // небо на закате
    const sky = x.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, '#2c3e63'); sky.addColorStop(0.45, '#c8685a'); sky.addColorStop(0.8, '#f2b560'); sky.addColorStop(1, '#ffe0a0');
    x.fillStyle = sky; x.fillRect(0, 0, w, h);
    // солнце
    const sun = x.createRadialGradient(340, 210, 4, 340, 210, 90);
    sun.addColorStop(0, '#fff6cf'); sun.addColorStop(0.25, 'rgba(255,225,140,.9)'); sun.addColorStop(1, 'rgba(255,200,120,0)');
    x.fillStyle = sun; x.fillRect(0, 60, w, 240);
    // облака
    x.fillStyle = 'rgba(255,200,170,.35)';
    for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(rnd(40, 470), rnd(30, 120), rnd(50, 110), rnd(5, 11), 0, 0, TAU); x.fill(); }
    // дальние холмы
    x.fillStyle = '#6d5a6a'; x.beginPath(); x.moveTo(0, 230);
    for (let i = 0; i <= 8; i++) x.lineTo(i * 64, 200 + Math.sin(i * 1.3) * 22 + rnd(-6, 6));
    x.lineTo(w, h); x.lineTo(0, h); x.fill();
    // ближние холмы
    x.fillStyle = '#3d4a3a'; x.beginPath(); x.moveTo(0, 270);
    x.bezierCurveTo(120, 220, 250, 290, 380, 245); x.bezierCurveTo(440, 228, 480, 250, w, 240);
    x.lineTo(w, h); x.lineTo(0, h); x.fill();
    x.fillStyle = '#242c26'; x.beginPath(); x.moveTo(0, 310);
    x.bezierCurveTo(140, 285, 260, 330, w, 295); x.lineTo(w, h); x.lineTo(0, h); x.fill();
    // одинокое дерево
    x.strokeStyle = '#1a1612'; x.lineCap = 'round'; x.lineWidth = 9;
    x.beginPath(); x.moveTo(110, 300); x.lineTo(114, 205); x.stroke();
    x.lineWidth = 5; x.beginPath(); x.moveTo(113, 235); x.lineTo(80, 205); x.moveTo(114, 220); x.lineTo(148, 190); x.stroke();
    x.fillStyle = '#2a3b26';
    for (const [cx, cy, r] of [[114, 185, 38], [84, 205, 24], [146, 192, 26], [112, 160, 22]]) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
    // хвойный лес на дальнем плане
    x.fillStyle = '#1d2a22';
    for (let i = 0; i < 26; i++) {
      const px = 200 + i * 12 + rnd(-4, 4), ph = rnd(26, 52), py = 290 + Math.sin(i) * 4;
      x.beginPath(); x.moveTo(px, py - ph); x.lineTo(px + 9, py); x.lineTo(px - 9, py); x.fill();
    }
    // подпись
    x.fillStyle = 'rgba(255,240,210,.7)'; x.font = 'italic 16px serif'; x.textAlign = 'right';
    x.fillText('«Свет над пустошью»', w - 18, h - 12);
    // состаренный слой
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.07})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }));
}
function getGrille() {
  return grilleTex || (grilleTex = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#b79b62'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < h; i += 6) { x.fillStyle = 'rgba(40,25,10,.55)'; x.fillRect(0, i, w, 2); x.fillStyle = 'rgba(255,235,180,.18)'; x.fillRect(0, i + 2, w, 1); }
    for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`; x.fillRect(Math.random() * w, Math.random() * h, 1, 2); }
  }));
}
function getDial() {
  return dialTex || (dialTex = canvasTex(256, 64, (x, w, h) => {
    x.fillStyle = '#e9d9a6'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#3a2a14'; x.lineWidth = 1.5; x.fillStyle = '#3a2a14'; x.font = 'bold 10px sans-serif'; x.textAlign = 'center';
    for (let i = 0; i <= 24; i++) { const px = 12 + i * 10; x.beginPath(); x.moveTo(px, 8); x.lineTo(px, i % 4 === 0 ? 24 : 17); x.stroke(); if (i % 4 === 0) x.fillText(String(54 + i * 2), px, 38); }
    x.fillStyle = '#7a2a1a'; x.font = 'bold 11px sans-serif'; x.fillText('УКВ · СВ · ДВ', w / 2, 56);
  }));
}

/* ---------- Материалы ---------- */
const cache = {};
const M = (color, rough = 0.8, metal = 0.05) => {
  const key = `${color}_${rough}_${metal}`;
  return cache[key] || (cache[key] = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }));
};
const woodMat = (tint = 0xffffff, rough = 0.8) => new THREE.MeshStandardMaterial({ map: getWood(), color: tint, roughness: rough, metalness: 0.02 });

const box = (g, mat, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m;
};
const cyl = (g, mat, rt, rb, h, x, y, z, seg = 16) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); g.add(m); return m;
};

/* ---------- Модели ---------- */
function buildChair() {
  const g = new THREE.Group();
  const w = woodMat(0xe0c8a8), dk = woodMat(0x8a6a50, 0.85);
  // ножки
  for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) box(g, dk, 0.045, 0.44, 0.045, x, 0.22, z);
  // перекладины между ножками
  box(g, dk, 0.4, 0.025, 0.025, 0, 0.14, 0.2); box(g, dk, 0.4, 0.025, 0.025, 0, 0.14, -0.2);
  box(g, dk, 0.025, 0.025, 0.4, -0.2, 0.2, 0); box(g, dk, 0.025, 0.025, 0.4, 0.2, 0.2, 0);
  // сиденье + мягкая подушка
  box(g, w, 0.48, 0.045, 0.48, 0, 0.465, 0);
  box(g, M(0x7a2e2a, 0.95, 0), 0.42, 0.05, 0.42, 0, 0.515, 0.01);
  // задние стойки и спинка
  box(g, dk, 0.045, 0.5, 0.045, -0.2, 0.72, -0.2); box(g, dk, 0.045, 0.5, 0.045, 0.2, 0.72, -0.2);
  box(g, w, 0.46, 0.06, 0.035, 0, 0.93, -0.2);
  for (let i = 0; i < 4; i++) box(g, w, 0.04, 0.34, 0.025, -0.13 + i * 0.087, 0.72, -0.2);
  box(g, w, 0.4, 0.05, 0.03, 0, 0.58, -0.2);
  return g;
}

function buildCandle() {
  const g = new THREE.Group();
  const brass = M(0xb08a3c, 0.35, 0.85), wax = M(0xf1e6c8, 0.7, 0);
  // блюдце-подсвечник
  cyl(g, brass, 0.075, 0.06, 0.012, 0, 0.006, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.073, 0.007, 6, 20), brass); rim.rotation.x = Math.PI / 2; rim.position.y = 0.014; g.add(rim);
  cyl(g, brass, 0.022, 0.03, 0.03, 0, 0.027, 0);
  // ручка подсвечника
  const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 14), brass); hdl.position.set(0.085, 0.02, 0); g.add(hdl);
  // свеча
  cyl(g, wax, 0.026, 0.028, 0.15, 0, 0.115, 0, 18);
  // подтёки воска
  for (let i = 0; i < 3; i++) cyl(g, wax, 0.007, 0.006, 0.05 + i * 0.015, Math.cos(i * 2.2) * 0.026, 0.165 - i * 0.012, Math.sin(i * 2.2) * 0.026, 6);
  cyl(g, M(0xe6d9b4, 0.8, 0), 0.027, 0.027, 0.006, 0, 0.19, 0);
  // фитиль
  cyl(g, M(0x111111, 1, 0), 0.0025, 0.0025, 0.025, 0, 0.205, 0, 5);
  // пламя
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.95, fog: false });
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), flameMat);
  flame.scale.set(0.8, 2.1, 0.8); flame.position.y = 0.232; g.add(flame);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff4c8, fog: false }));
  core.scale.set(0.8, 2, 0.8); core.position.y = 0.226; g.add(core);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff9a3a, transparent: true, opacity: 0.12, depthWrite: false, fog: false }));
  halo.position.y = 0.232; g.add(halo);
  g.userData.flame = [flame, core, halo];
  g.userData.flameY = 0.235;
  return g;
}

function buildPainting() {
  const g = new THREE.Group();
  const W = 1.1, H = 0.75, fr = 0.07;
  const frame = woodMat(0x5a3a22, 0.6), gold = M(0xb88a34, 0.4, 0.7);
  box(g, frame, W + fr * 2, fr, 0.06, 0, H / 2 + fr / 2, 0); box(g, frame, W + fr * 2, fr, 0.06, 0, -H / 2 - fr / 2, 0);
  box(g, frame, fr, H, 0.06, -W / 2 - fr / 2, 0, 0); box(g, frame, fr, H, 0.06, W / 2 + fr / 2, 0, 0);
  // золотой внутренний кант
  box(g, gold, W + 0.02, 0.014, 0.05, 0, H / 2 + 0.005, 0.005); box(g, gold, W + 0.02, 0.014, 0.05, 0, -H / 2 - 0.005, 0.005);
  box(g, gold, 0.014, H, 0.05, -W / 2 - 0.005, 0, 0.005); box(g, gold, 0.014, H, 0.05, W / 2 + 0.005, 0, 0.005);
  // холст
  box(g, M(0x2a2018, 1, 0), W, H, 0.02, 0, 0, -0.01);
  const canvas = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: getPainting(), roughness: 0.75, metalness: 0, emissive: 0xffffff, emissiveMap: getPainting(), emissiveIntensity: 0.14 }));
  canvas.position.z = 0.002; g.add(canvas);
  return g;
}

function buildRadio() {
  const g = new THREE.Group();
  const body = woodMat(0xb88a60, 0.55), trim = M(0x2a2218, 0.5, 0.2), brass = M(0xc9a24a, 0.35, 0.8), dark = M(0x15110c, 0.6, 0.2);
  const W = 0.46, H = 0.27, D = 0.17, fz = D / 2;
  box(g, body, W, H, D, 0, H / 2 + 0.02, 0);
  // ножки
  for (const x of [-0.18, 0.18]) box(g, dark, 0.05, 0.02, 0.1, x, 0.01, 0);
  // окантовка
  box(g, trim, W + 0.01, 0.012, D + 0.01, 0, H + 0.02, 0); box(g, trim, W + 0.01, 0.012, D + 0.01, 0, 0.026, 0);
  // динамик (ткань) в латунной рамке
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshStandardMaterial({ map: getGrille(), roughness: 1 }));
  grille.position.set(-0.11, 0.155, fz + 0.002); g.add(grille);
  box(g, brass, 0.212, 0.008, 0.006, -0.11, 0.258, fz + 0.003); box(g, brass, 0.212, 0.008, 0.006, -0.11, 0.052, fz + 0.003);
  box(g, brass, 0.008, 0.214, 0.006, -0.214, 0.155, fz + 0.003); box(g, brass, 0.008, 0.214, 0.006, -0.006, 0.155, fz + 0.003);
  // шкала настройки
  box(g, trim, 0.18, 0.055, 0.004, 0.115, 0.225, fz + 0.001);
  const dialMat = new THREE.MeshStandardMaterial({ map: getDial(), roughness: 0.4, emissive: 0xffc060, emissiveMap: getDial(), emissiveIntensity: 0 });
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.045), dialMat);
  dial.position.set(0.115, 0.225, fz + 0.004); g.add(dial);
  const needle = box(g, M(0xd02a1a, 0.5, 0), 0.003, 0.04, 0.004, 0.08, 0.225, fz + 0.006);
  // ручки
  for (const x of [0.075, 0.155]) {
    const k = cyl(g, brass, 0.027, 0.03, 0.025, x, 0.12, fz + 0.012, 18); k.rotation.x = Math.PI / 2;
    box(g, dark, 0.004, 0.02, 0.004, x, 0.128, fz + 0.026);
  }
  // индикатор питания
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3a1410, fog: false }));
  led.position.set(0.115, 0.07, fz + 0.006); g.add(led);
  // выдвижная антенна
  const ant = cyl(g, M(0xaaaaaa, 0.3, 0.9), 0.003, 0.004, 0.4, 0.2, 0.47, -0.04, 6); ant.rotation.z = -0.3;
  ant.position.x = 0.2 + Math.sin(0.3) * 0.2; ant.position.y = 0.29 + Math.cos(0.3) * 0.2;
  cyl(g, brass, 0.008, 0.008, 0.02, 0.2, 0.3, -0.04, 8);
  g.userData.radio = { dialMat, led, needle, needleX: 0.08 };
  return g;
}

/* ---------- Ящики для хранения (малый и большой) ---------- */
const labelTexCache = {};
function labelTex(text) {
  return labelTexCache[text] || (labelTexCache[text] = canvasTex(128, 56, (x, w, h) => {
    x.fillStyle = '#d9cfae'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(60,40,10,${Math.random() * 0.1})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    x.strokeStyle = '#3a2a14'; x.lineWidth = 3; x.strokeRect(3, 3, w - 6, h - 6);
    x.fillStyle = '#2a2014'; x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, w / 2, h / 2 + 1);
  }));
}
function buildCrate(big) {
  const g = new THREE.Group();
  const W = big ? 1.1 : 0.64, H = big ? 0.78 : 0.44, D = big ? 0.7 : 0.44;
  const wood = woodMat(big ? 0xc4a276 : 0xe3cba6, 0.85), dark = woodMat(0x6b4c32, 0.9), metal = M(0x3b434a, 0.45, 0.75), black = M(0x14110d, 0.9, 0);
  const bh = H - 0.12;
  box(g, dark, W, 0.05, D, 0, 0.025, 0);                          // поддон
  box(g, wood, W - 0.05, bh, D - 0.05, 0, 0.05 + bh / 2, 0);      // корпус
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(g, dark, 0.055, H - 0.06, 0.055, sx * (W / 2 - 0.0275), (H - 0.06) / 2 + 0.03, sz * (D / 2 - 0.0275));   // стойки
  // горизонтальные рейки на четырёх сторонах
  const rails = big ? [0.24, 0.48] : [0.2];
  for (const y of rails) {
    for (const sz of [-1, 1]) box(g, dark, W - 0.1, 0.045, 0.012, 0, y, sz * (D / 2 - 0.018));
    for (const sx of [-1, 1]) box(g, dark, 0.012, 0.045, D - 0.1, sx * (W / 2 - 0.018), y, 0);
  }
  // крышка с досками
  box(g, wood, W + 0.02, 0.05, D + 0.02, 0, H - 0.025, 0);
  const n = big ? 4 : 3;
  for (let i = 1; i < n; i++) box(g, black, W, 0.006, 0.006, 0, H + 0.001, -D / 2 + (D / n) * i);
  box(g, dark, 0.06, 0.03, D + 0.025, -W / 2 + 0.1, H + 0.004, 0); box(g, dark, 0.06, 0.03, D + 0.025, W / 2 - 0.1, H + 0.004, 0);
  // металлические уголки (большой ящик)
  if (big) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    box(g, metal, 0.09, 0.09, 0.09, sx * (W / 2 - 0.02), H - 0.045, sz * (D / 2 - 0.02));
    box(g, metal, 0.09, 0.09, 0.09, sx * (W / 2 - 0.02), 0.095, sz * (D / 2 - 0.02));
  }
  // защёлка и петли на лицевой стороне (+Z)
  const fz = D / 2 + 0.012;
  box(g, metal, 0.075, 0.1, 0.02, 0, H - 0.1, fz); box(g, M(0xb0b8bf, 0.3, 0.9), 0.03, 0.03, 0.025, 0, H - 0.135, fz + 0.005);
  for (const sx of [-1, 1]) box(g, metal, 0.1, 0.04, 0.012, sx * W * 0.32, H - 0.07, -fz + 0.0);
  // ручки-прорези на торцах
  for (const sx of [-1, 1]) box(g, black, 0.012, 0.05, big ? 0.22 : 0.15, sx * (W / 2 + 0.003), H - 0.2, 0);
  // табличка
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(big ? 0.3 : 0.2, big ? 0.13 : 0.09), new THREE.MeshStandardMaterial({ map: labelTex(big ? 'ЗАПАСЫ' : 'МЕЛОЧИ'), roughness: 0.9 }));
  lab.position.set(0, H * 0.42, fz + 0.002); g.add(lab);
  g.userData.dims = { w: W, h: H, d: D };
  return g;
}


/* ---------- Стойка для оружия ---------- */
const RACK_TIERS = [0.24, 0.52, 0.8, 1.08, 1.36];
const RACK_COLS = [-0.43, 0.43];
function buildRack() {
  const g = new THREE.Group();
  const wood = woodMat(0xb08658, 0.85), dark = woodMat(0x6b4c32, 0.9), metal = M(0x3b434a, 0.45, 0.75);
  const W = 1.76, H = 1.7, D = 0.34;
  // стойки и основание
  for (const sx of [-1, 1]) {
    box(g, dark, 0.07, H, 0.07, sx * (W / 2 - 0.035), H / 2, -D / 2 + 0.05);
    box(g, dark, 0.07, 0.07, D, sx * (W / 2 - 0.035), 0.035, 0);
    box(g, metal, 0.09, 0.05, 0.09, sx * (W / 2 - 0.035), H - 0.01, -D / 2 + 0.05);
  }
  box(g, dark, W, 0.08, 0.08, 0, H - 0.04, -D / 2 + 0.05);
  box(g, dark, W, 0.07, 0.06, 0, 0.1, -D / 2 + 0.05);
  // задняя панель
  box(g, wood, W - 0.12, H - 0.2, 0.025, 0, 0.1 + (H - 0.2) / 2, -D / 2 + 0.03);
  for (let i = 1; i < 6; i++) box(g, dark, 0.006, H - 0.2, 0.004, -W / 2 + 0.06 + ((W - 0.12) / 6) * i, 0.1 + (H - 0.2) / 2, -D / 2 + 0.044);
  // полки с бортиком
  for (const y of RACK_TIERS) {
    box(g, dark, W - 0.1, 0.035, D - 0.1, 0, y - 0.02, 0.0);
    box(g, wood, W - 0.1, 0.05, 0.025, 0, y + 0.012, D / 2 - 0.06);
    box(g, metal, 0.03, 0.05, 0.03, -W / 2 + 0.12, y - 0.04, 0.02); box(g, metal, 0.03, 0.05, 0.03, W / 2 - 0.12, y - 0.04, 0.02);
  }
  // табличка
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), new THREE.MeshStandardMaterial({ map: labelTex('ОРУЖИЕ'), roughness: 0.9 }));
  lab.position.set(0, H - 0.14, -D / 2 + 0.05); g.add(lab);
  const wg = new THREE.Group(); wg.name = 'rackWeapons'; g.add(wg);
  g.userData.rack = { group: wg, sig: '' };
  g.userData.dims = { w: W, h: H, d: D };
  return g;
}
// разложить оружие по полкам: ids — массив id оружия (rifle, shotgun, …)
export function setRackWeapons(model, ids) {
  const r = model.userData.rack; if (!r) return;
  const sig = ids.join(',');
  if (r.sig === sig) return; r.sig = sig;
  for (const c of [...r.group.children]) {
    r.group.remove(c);
    c.traverse(o => { if (o.isMesh) { o.geometry.dispose(); const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => m.dispose()); } });
  }
  ids.slice(0, RACK_TIERS.length * RACK_COLS.length).forEach((id, i) => {
    const m = buildWeaponModel(id, litMat); if (!m) return;
    const holder = new THREE.Group(); holder.add(m);
    let bb = new THREE.Box3().setFromObject(holder), sz = bb.getSize(new THREE.Vector3());
    if (sz.z > sz.x) { holder.rotation.y = Math.PI / 2; holder.updateMatrixWorld(true); bb = new THREE.Box3().setFromObject(holder); sz = bb.getSize(new THREE.Vector3()); }
    const k = Math.min(0.74 / sz.x, 0.23 / Math.max(sz.y, 0.001), 1.5);
    const wrap = new THREE.Group(); wrap.add(holder); wrap.scale.setScalar(k);
    wrap.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(wrap), c = b2.getCenter(new THREE.Vector3());
    const tier = Math.floor(i / RACK_COLS.length), col = i % RACK_COLS.length;
    wrap.position.set(RACK_COLS[col] - c.x, RACK_TIERS[tier] + 0.005 - b2.min.y, 0.02 - c.z);
    wrap.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    r.group.add(wrap);
  });
}

const BUILDERS = { rack: buildRack, chair: buildChair, candle: buildCandle, painting: buildPainting, radio: buildRadio, crateS: () => buildCrate(false), crateL: () => buildCrate(true) };
// как мебель размещается: floor — только на пол, surface — на любую горизонтальную поверхность, wall — на стену
export const PLACE_KIND = { rack: 'floor', chair: 'floor', crateS: 'surface', crateL: 'surface', candle: 'surface', radio: 'surface', painting: 'wall' };
// сплошная ли мебель (блокирует проход, когда стоит на полу)
export const SOLID_FURN = { rack: true, chair: true, crateS: true, crateL: true };
const dimsCache = {};
export function furnDims(id) {
  if (dimsCache[id]) return dimsCache[id];
  const m = BUILDERS[id](); const bb = new THREE.Box3().setFromObject(m), sz = bb.getSize(new THREE.Vector3());
  return dimsCache[id] = { w: sz.x, h: sz.y, d: sz.z, cy: (bb.min.y + bb.max.y) / 2, r: Math.max(sz.x, sz.y, sz.z) / 2 };
}
export function buildFurniture(id) {
  const b = BUILDERS[id]; if (!b) return null;
  const g = b();
  g.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

/* ---------- Предпросмотр на верстаке ---------- */
const PW = 360, PH = 200;
export class FurniturePreviewer {
  renderer; scene = new THREE.Scene(); camera;
  items = {}; targets = []; raf = 0; last = 0; running = false;
  constructor(ids) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(1); this.renderer.setSize(PW, PH, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.1;
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.camera = new THREE.PerspectiveCamera(30, PW / PH, 0.02, 20);
    const key = new THREE.DirectionalLight(0xfff0dd, 2.2); key.position.set(2, 3, 3); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fb8ff, 1.2); rim.position.set(-3, 1.5, -2); this.scene.add(rim);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    for (const id of ids) {
      const model = buildFurniture(id); if (!model) continue;
      const bb = new THREE.Box3().setFromObject(model), c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
      model.position.sub(c);
      const pivot = new THREE.Group(); pivot.add(model); pivot.visible = false; this.scene.add(pivot);
      // в предпросмотре радио показывается «включённым»
      const ud = model.userData;
      if (ud.radio) { ud.radio.dialMat.emissiveIntensity = 0.7; ud.radio.led.material.color.set(0x4aff7a); }
      this.items[id] = { pivot, model, r: s.length() / 2, yaw: Math.random() * 6, hold: 0 };
    }
  }
  attach(canvases) {
    this.targets = canvases.map(canvas => {
      canvas.width = PW; canvas.height = PH;
      const id = canvas.dataset.furn;
      let drag = false, px = 0;
      canvas.addEventListener('pointerdown', e => { drag = true; px = e.clientX; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', e => {
        if (!drag || !this.items[id]) return;
        this.items[id].yaw += (e.clientX - px) * 0.012; px = e.clientX; this.items[id].hold = 2.5;
      });
      const up = () => { drag = false; };
      canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
      return { id, canvas, ctx: canvas.getContext('2d') };
    });
  }
  start() {
    if (this.running) return; this.running = true; this.last = performance.now();
    const loop = now => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      this.draw(dt, now / 1000);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); this.targets = []; }
  draw(dt, t) {
    for (const tg of this.targets) {
      const it = this.items[tg.id]; if (!it || !tg.canvas.isConnected) continue;
      if (it.hold > 0) it.hold -= dt; else it.yaw += dt * 0.7;
      for (const k in this.items) this.items[k].pivot.visible = k === tg.id;
      const fl = it.model.userData.flame;
      if (fl) { const f = 1 + Math.sin(t * 17) * 0.06 + Math.sin(t * 29) * 0.05; fl[0].scale.set(0.8 * f, 2.1 * f, 0.8 * f); fl[2].material.opacity = 0.13 + Math.sin(t * 11) * 0.03; }
      it.pivot.rotation.y = it.yaw; it.pivot.position.y = Math.sin(t * 1.6 + it.r * 5) * 0.01;
      const d = it.r / Math.tan((this.camera.fov * Math.PI) / 360) * (tg.id === 'painting' ? 1.15 : 1.0);
      this.camera.position.set(0, it.r * 0.3, d); this.camera.lookAt(0, -it.r * 0.03, 0);
      this.renderer.render(this.scene, this.camera);
      tg.ctx.clearRect(0, 0, PW, PH); tg.ctx.drawImage(this.renderer.domElement, 0, 0);
    }
  }
}
