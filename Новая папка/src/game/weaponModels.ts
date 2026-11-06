// @ts-nocheck
// 3D-модели оружия: используются и в руках игрока, и в предпросмотре на верстаке.
// Ствол смотрит в −Z, верх — +Y, правая сторона — +X.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildAk74, buildMosin } from './weaponsNew';

export type MatFn = (color: number, o?: { metal?: number; rough?: number; emissive?: number }) => THREE.Material;

const box = (g, mat, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m;
};
// цилиндр вдоль оси Z: rFront — радиус у дула (−Z), rBack — у приклада (+Z)
const cylZ = (g, mat, rFront, rBack, len, x, y, z, seg = 14) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rBack, rFront, len, seg), mat);
  m.rotation.x = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m;
};
const ball = (g, mat, r, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m;
};

function buildRifle(M: MatFn) {
  const g = new THREE.Group();
  const wood = M(0x7a4a28, { rough: 0.55 }), woodD = M(0x4f2f18, { rough: 0.6 });
  const steel = M(0x2f353b, { metal: 0.85, rough: 0.35 }), steelL = M(0x59626b, { metal: 0.9, rough: 0.3 });
  const black = M(0x14171a, { metal: 0.5, rough: 0.5 }), lens = M(0x4aa8ff, { emissive: 0x2a78d0, rough: 0.1 });
  // приклад
  box(g, wood, 0.056, 0.115, 0.36, 0, -0.035, 0.31, -0.07);
  box(g, black, 0.062, 0.135, 0.028, 0, -0.04, 0.495, -0.07);
  box(g, woodD, 0.058, 0.02, 0.2, 0, 0.03, 0.34, -0.07);
  box(g, wood, 0.05, 0.11, 0.065, 0, -0.095, 0.13, 0.4);
  // ствольная коробка и ствол
  box(g, steel, 0.054, 0.078, 0.28, 0, 0.01, 0.0);
  box(g, black, 0.03, 0.012, 0.24, 0, 0.055, -0.01);
  cylZ(g, steelL, 0.012, 0.016, 0.74, 0, 0.022, -0.47);
  cylZ(g, black, 0.02, 0.02, 0.06, 0, 0.022, -0.83);
  cylZ(g, black, 0.016, 0.016, 0.02, 0, 0.022, -0.79);
  // цевьё
  box(g, wood, 0.052, 0.048, 0.38, 0, -0.022, -0.3);
  box(g, woodD, 0.056, 0.012, 0.04, 0, -0.022, -0.5);
  // прицел
  cylZ(g, black, 0.02, 0.02, 0.26, 0, 0.095, -0.03);
  cylZ(g, black, 0.03, 0.02, 0.07, 0, 0.095, -0.18);
  cylZ(g, black, 0.02, 0.03, 0.06, 0, 0.095, 0.115);
  cylZ(g, lens, 0.026, 0.026, 0.004, 0, 0.095, -0.217);
  box(g, steel, 0.018, 0.035, 0.022, 0, 0.066, -0.1);
  box(g, steel, 0.018, 0.035, 0.022, 0, 0.066, 0.045);
  box(g, steelL, 0.02, 0.02, 0.02, 0.02, 0.095, -0.03); // барабанчик
  // затвор
  const bg = new THREE.Group(); bg.position.set(0, 0.038, 0); g.add(bg); g.userData.bolt = bg;
  cylZ(bg, steelL, 0.011, 0.011, 0.08, 0.0, 0.0, 0.14);
  cylZ(bg, steelL, 0.0095, 0.0095, 0.1, 0.0, 0.0, 0.07);
  box(bg, steelL, 0.06, 0.012, 0.012, 0.04, -0.002, 0.082);
  ball(bg, black, 0.016, 0.073, -0.002, 0.082);
  // обойма с патронами (появляется только при перезарядке)
  const clip = new THREE.Group(); g.add(clip); g.userData.mag = clip; g.userData.magVis = false; clip.visible = false;
  const rb = M(0xd7a83e, { metal: 0.9, rough: 0.3 }), rt = M(0xb87333, { metal: 0.8, rough: 0.35 });
  for (let k = 0; k < 5; k++) {
    const z = -0.05 + k * 0.025;
    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0068, 0.06, 10), rb); c1.position.set(0, 0, z); clip.add(c1);
    const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.0062, 0.026, 10), rt); c2.position.set(0, -0.043, z); clip.add(c2);
  }
  box(clip, steel, 0.02, 0.008, 0.14, 0, 0.022, 0.0);
  box(clip, steel, 0.02, 0.005, 0.14, 0, -0.005, 0.0);
  // скоба, спуск, магазин
  box(g, black, 0.012, 0.012, 0.11, 0, -0.055, 0.1);
  box(g, black, 0.012, 0.045, 0.012, 0, -0.04, 0.17);
  box(g, black, 0.01, 0.03, 0.012, 0, -0.035, 0.1, 0.3);
  box(g, steel, 0.038, 0.075, 0.07, 0, -0.065, -0.02);
  g.userData.muzzle = new THREE.Vector3(0, 0.022, -0.86);
  return g;
}

function buildShotgun(M: MatFn) {
  const g = new THREE.Group();
  const wood = M(0x8a5530, { rough: 0.5 }), woodD = M(0x4f2f18, { rough: 0.6 });
  const steel = M(0x2b3035, { metal: 0.85, rough: 0.35 }), steelL = M(0x5a636c, { metal: 0.9, rough: 0.3 });
  const black = M(0x121416, { metal: 0.4, rough: 0.55 }), brass = M(0xd7a83e, { metal: 0.9, rough: 0.3 });
  const red = M(0xc0281e, { rough: 0.5 });
  // приклад
  box(g, wood, 0.06, 0.12, 0.36, 0, -0.035, 0.32, -0.08);
  box(g, black, 0.066, 0.14, 0.03, 0, -0.04, 0.505, -0.08);
  box(g, wood, 0.048, 0.1, 0.06, 0, -0.092, 0.13, 0.35);
  // патроны на прикладе
  for (let k = 0; k < 4; k++) {
    cylZ(g, red, 0.011, 0.011, 0.045, 0.034, -0.005, 0.22 + k * 0.034, 10);
    cylZ(g, brass, 0.0115, 0.0115, 0.012, 0.034, -0.005, 0.248 + k * 0.034, 10);
  }
  box(g, black, 0.004, 0.04, 0.16, 0.032, -0.005, 0.28);
  // ствольная коробка
  box(g, steel, 0.06, 0.092, 0.27, 0, 0.0, 0.0);
  box(g, black, 0.062, 0.026, 0.09, 0, 0.018, -0.02);
  box(g, steelL, 0.062, 0.01, 0.1, 0, 0.052, 0.0);
  // ствол + подствольная трубка
  cylZ(g, steelL, 0.02, 0.02, 0.74, 0, 0.026, -0.43);
  box(g, black, 0.009, 0.009, 0.7, 0, 0.05, -0.43);
  cylZ(g, steel, 0.0165, 0.0165, 0.52, 0, -0.018, -0.34);
  cylZ(g, black, 0.024, 0.024, 0.022, 0, 0.026, -0.8);
  cylZ(g, black, 0.02, 0.02, 0.02, 0, -0.018, -0.6);
  box(g, brass, 0.006, 0.016, 0.006, 0, 0.06, -0.78);
  // помпа
  const pg = new THREE.Group(); pg.position.set(0, -0.03, -0.3); g.add(pg); g.userData.pump = pg;
  box(pg, wood, 0.074, 0.056, 0.22, 0, 0, 0);
  for (let k = 0; k < 6; k++) box(pg, woodD, 0.078, 0.058, 0.008, 0, 0, -0.08 + k * 0.034);
  // патрон для перезарядки (появляется только в руке)
  const shell = new THREE.Group(); g.add(shell); g.userData.mag = shell; g.userData.magVis = false; shell.visible = false;
  cylZ(shell, red, 0.0105, 0.0105, 0.045, 0, 0, 0, 10); cylZ(shell, brass, 0.011, 0.011, 0.014, 0, 0, 0.0295, 10);
  // скоба и спуск
  box(g, black, 0.012, 0.012, 0.1, 0, -0.058, 0.1);
  box(g, black, 0.012, 0.04, 0.012, 0, -0.04, 0.17);
  g.userData.muzzle = new THREE.Vector3(0, 0.026, -0.84);
  return g;
}

function buildFlame(M: MatFn) {
  const g = new THREE.Group();
  const steel = M(0x3b424a, { metal: 0.85, rough: 0.35 }), steelL = M(0x6a737c, { metal: 0.9, rough: 0.3 });
  const black = M(0x1b1e22, { metal: 0.5, rough: 0.5 }), red = M(0xb3261c, { metal: 0.4, rough: 0.4 });
  const yellow = M(0xe6b422, { metal: 0.3, rough: 0.5 }), brass = M(0xc9992f, { metal: 0.9, rough: 0.3 });
  const glow = M(0xffa030, { emissive: 0xff7a10, rough: 0.4 }), green = M(0x55ff88, { emissive: 0x22cc55, rough: 0.4 });
  // труба и сопло
  cylZ(g, steelL, 0.022, 0.022, 0.62, 0, 0.03, -0.34);
  cylZ(g, black, 0.055, 0.03, 0.12, 0, 0.03, -0.69);
  cylZ(g, brass, 0.06, 0.06, 0.016, 0, 0.03, -0.755);
  cylZ(g, black, 0.04, 0.04, 0.005, 0, 0.03, -0.762, 14);
  for (let k = 0; k < 3; k++) cylZ(g, brass, 0.03, 0.03, 0.012, 0, 0.03, -0.48 - k * 0.07);
  // дежурная горелка
  cylZ(g, steel, 0.006, 0.006, 0.17, 0.052, 0.004, -0.66, 8);
  ball(g, glow, 0.011, 0.052, 0.004, -0.75, 1, 1, 1.6);
  g.userData.pilot = g.children[g.children.length - 1];
  // баллон (снимается при перезарядке)
  const tg = new THREE.Group(); tg.position.set(0, -0.092, -0.2); g.add(tg); g.userData.mag = tg; g.userData.magVis = true;
  cylZ(tg, red, 0.062, 0.062, 0.36, 0, 0, 0, 18);
  ball(tg, red, 0.062, 0, 0, -0.18, 1, 1, 0.55);
  ball(tg, red, 0.062, 0, 0, 0.18, 1, 1, 0.55);
  cylZ(tg, yellow, 0.065, 0.065, 0.035, 0, 0, 0.08, 18);
  cylZ(tg, yellow, 0.065, 0.065, 0.035, 0, 0, -0.08, 18);
  box(tg, black, 0.14, 0.012, 0.03, 0, 0, 0); // хомут
  box(tg, green, 0.006, 0.05, 0.012, 0.064, 0, 0);
  // вентиль
  box(tg, steelL, 0.016, 0.04, 0.016, 0, -0.048, 0.16);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.006, 6, 16), brass);
  wheel.position.set(0, -0.073, 0.16); wheel.rotation.x = Math.PI / 2; tg.add(wheel); g.userData.wheel = wheel;
  // шланг
  cylZ(g, black, 0.013, 0.013, 0.14, 0, -0.045, 0.02, 8);
  // корпус, рукоятки
  box(g, steel, 0.066, 0.094, 0.2, 0, 0.0, 0.12);
  box(g, black, 0.068, 0.03, 0.08, 0, 0.03, 0.12);
  box(g, black, 0.05, 0.13, 0.062, 0, -0.1, 0.17, 0.3);
  box(g, black, 0.046, 0.1, 0.05, 0, -0.14, -0.4, -0.15);
  box(g, steelL, 0.07, 0.014, 0.12, 0, 0.056, 0.12);
  box(g, red, 0.01, 0.02, 0.02, 0, 0.075, 0.12);
  g.userData.muzzle = new THREE.Vector3(0, 0.03, -0.78);
  return g;
}


/* ---------- Пистолет «Страж»: новая модель ---------- */
function buildPistol(M: MatFn) {
  const g = new THREE.Group();
  const slideM = M(0x3d444b, { metal: 0.9, rough: 0.28 }), slideL = M(0x8b959d, { metal: 0.95, rough: 0.2 });
  const poly = M(0x15171a, { metal: 0.2, rough: 0.6 }), black = M(0x0b0c0e, { metal: 0.4, rough: 0.5 });
  const wood = M(0x7a4524, { rough: 0.5 }), brass = M(0xd9ad45, { metal: 0.95, rough: 0.25 });
  const dot = M(0xe6ffd8, { emissive: 0xe6ffd8 }), lens = M(0x6cc8ff, { emissive: 0x6cc8ff });
  const red = M(0xff3030, { emissive: 0xff3030 });

  // ЗАТВОР-КОЖУХ (двигается при выстреле)
  const sg = new THREE.Group(); g.add(sg); g.userData.slide = sg;
  box(sg, slideM, 0.044, 0.046, 0.318, 0, 0.012, -0.141);
  box(sg, slideL, 0.028, 0.008, 0.31, 0, 0.0385, -0.141);              // верхняя планка
  box(sg, slideM, 0.012, 0.012, 0.312, 0.019, 0.034, -0.141, 0, 0, Math.PI / 4);   // фаски
  box(sg, slideM, 0.012, 0.012, 0.312, -0.019, 0.034, -0.141, 0, 0, Math.PI / 4);
  for (let k = 0; k < 6; k++) box(sg, black, 0.0465, 0.04, 0.0045, 0, 0.012, 0.004 - k * 0.0105);      // насечки сзади
  for (let k = 0; k < 3; k++) box(sg, black, 0.0465, 0.04, 0.0045, 0, 0.012, -0.235 - k * 0.0105);     // насечки спереди
  box(sg, brass, 0.0452, 0.003, 0.05, 0, 0.026, -0.19);                  // латунная вставка
  box(sg, brass, 0.0452, 0.003, 0.05, 0, 0.0, -0.19);
  box(sg, black, 0.0455, 0.02, 0.07, 0, 0.022, -0.085);                   // окно выброса
  box(sg, slideL, 0.0458, 0.004, 0.07, 0, 0.0325, -0.085);
  // мушка и целик с точками
  box(sg, black, 0.008, 0.012, 0.014, 0, 0.0475, -0.285);
  box(sg, dot, 0.0045, 0.0045, 0.002, 0, 0.0505, -0.2915);
  box(sg, black, 0.01, 0.014, 0.012, 0.0125, 0.0465, 0.006);
  box(sg, black, 0.01, 0.014, 0.012, -0.0125, 0.0465, 0.006);
  box(sg, dot, 0.0045, 0.0045, 0.002, 0.0125, 0.049, 0.0125);
  box(sg, dot, 0.0045, 0.0045, 0.002, -0.0125, 0.049, 0.0125);
  // дульная часть ствола
  cylZ(g, slideL, 0.011, 0.011, 0.024, 0, 0.012, -0.306, 14);
  cylZ(g, black, 0.0075, 0.0075, 0.026, 0, 0.012, -0.306, 10);
  cylZ(g, slideL, 0.0125, 0.0125, 0.006, 0, 0.012, -0.296, 14);

  // РАМКА
  box(g, poly, 0.04, 0.026, 0.27, 0, -0.026, -0.1);
  box(g, poly, 0.036, 0.016, 0.05, 0, -0.008, 0.04);                       // «бобровый хвост»
  for (let k = 0; k < 3; k++) box(g, black, 0.0425, 0.004, 0.007, 0, -0.04, -0.17 - k * 0.018); // планка
  // тактический фонарь
  box(g, black, 0.03, 0.026, 0.058, 0, -0.052, -0.215);
  cylZ(g, slideL, 0.013, 0.013, 0.012, 0, -0.052, -0.248, 14);
  cylZ(g, lens, 0.0095, 0.0095, 0.004, 0, -0.052, -0.2545, 14);
  box(g, red, 0.004, 0.004, 0.004, -0.0165, -0.046, -0.236);               // лазер-индикатор
  // спусковая скоба + спуск
  box(g, poly, 0.012, 0.012, 0.085, 0, -0.075, -0.088);
  box(g, poly, 0.012, 0.034, 0.012, 0, -0.058, -0.128);
  box(g, slideL, 0.007, 0.028, 0.009, 0, -0.054, -0.07, 0.35);
  // курок, фиксатор затвора, кнопка магазина
  box(g, black, 0.01, 0.015, 0.014, 0, 0.026, 0.03, 0.4);
  box(g, slideL, 0.006, 0.01, 0.034, -0.0235, -0.0125, -0.07);
  box(g, slideL, 0.006, 0.012, 0.012, -0.0235, -0.042, -0.01);

  // РУКОЯТЬ (наклонена назад)
  const gr = new THREE.Group(); gr.position.set(0, -0.105, 0.012); gr.rotation.x = -0.2; g.add(gr);
  box(gr, poly, 0.04, 0.15, 0.064, 0, 0, 0);
  box(gr, wood, 0.0468, 0.098, 0.05, 0, -0.008, 0.002);
  for (let k = 0; k < 7; k++) box(gr, black, 0.0485, 0.0035, 0.052, 0, -0.05 + k * 0.0135, 0.002);
  box(gr, brass, 0.0482, 0.009, 0.009, 0, 0.025, -0.012);                  // медальон
  box(gr, poly, 0.036, 0.02, 0.012, 0, -0.07, 0.036);                      // выступ тыльника
  // съёмный магазин (анимация перезарядки): тело внутри рукояти, пятка торчит снизу
  const mg = new THREE.Group(); gr.add(mg);
  box(mg, slideM, 0.034, 0.135, 0.05, 0, -0.012, 0);
  box(mg, black, 0.044, 0.014, 0.07, 0, -0.083, 0.0);                      // пятка магазина
  box(mg, slideL, 0.046, 0.003, 0.072, 0, -0.0905, 0.0);
  box(mg, brass, 0.012, 0.014, 0.034, 0, 0.058, -0.004);                   // верхний патрон
  box(mg, brass, 0.012, 0.014, 0.034, 0.003, 0.058, 0.002);
  g.userData.mag = mg; g.userData.magVis = true;
  g.userData.muzzle = new THREE.Vector3(0, 0.012, -0.322);
  return g;
}

/* ---------- АС «Вал»: бесшумный автомат ---------- */
function buildAsVal(M: MatFn) {
  const g = new THREE.Group();
  const oxide = M(0x252a2d, { metal: 0.8, rough: 0.4 }), oxideL = M(0x4a5258, { metal: 0.85, rough: 0.32 });
  const black = M(0x0f1113, { metal: 0.5, rough: 0.5 }), poly = M(0x1c1f21, { metal: 0.2, rough: 0.6 });
  const olive = M(0x39402e, { metal: 0.1, rough: 0.6 }), steelL = M(0x7a838a, { metal: 0.9, rough: 0.28 });
  const brass = M(0xd0a23c, { metal: 0.9, rough: 0.3 }), dot = M(0xe6ffd8, { emissive: 0xe6ffd8 });
  // ствольная коробка
  box(g, oxide, 0.05, 0.074, 0.3, 0, 0, 0);
  box(g, oxideL, 0.046, 0.012, 0.29, 0, 0.043, 0.0);
  box(g, oxideL, 0.0525, 0.026, 0.13, 0, 0.004, -0.02);                    // штамповка
  box(g, black, 0.0535, 0.016, 0.07, 0.0, 0.02, 0.07);
  box(g, black, 0.01, 0.06, 0.012, 0.0, 0.0, -0.152);
  // боковая планка (слева, под прицел)
  box(g, oxideL, 0.012, 0.03, 0.2, -0.031, 0.022, 0.015);
  for (let k = 0; k < 6; k++) box(g, black, 0.013, 0.032, 0.007, -0.031, 0.022, -0.065 + k * 0.032);
  // интегрированный глушитель
  cylZ(g, black, 0.036, 0.03, 0.46, 0, 0.012, -0.38, 20);
  cylZ(g, oxideL, 0.0375, 0.0375, 0.01, 0, 0.012, -0.15, 20);
  cylZ(g, brass, 0.0385, 0.0385, 0.007, 0, 0.012, -0.16, 20);
  for (let k = 0; k < 4; k++) cylZ(g, oxide, 0.0352 - k * 0.0006, 0.0352 - k * 0.0006, 0.012, 0, 0.012, -0.27 - k * 0.07, 20);
  for (let k = 0; k < 10; k++) {                                            // перфорация
    const x = (k % 2 ? 0.034 : -0.034);
    box(g, oxideL, 0.004, 0.004, 0.004, x, 0.012 + (k % 3 - 1) * 0.011, -0.19 - k * 0.025);
  }
  cylZ(g, steelL, 0.031, 0.031, 0.012, 0, 0.012, -0.616, 20);
  cylZ(g, black, 0.0105, 0.0105, 0.006, 0, 0.012, -0.623, 12);
  // газоотвод/цевьё
  box(g, olive, 0.046, 0.05, 0.19, 0, -0.04, -0.23);
  for (let k = 0; k < 5; k++) box(g, black, 0.048, 0.052, 0.005, 0, -0.04, -0.15 - k * 0.04);
  // мушка и целик
  box(g, black, 0.016, 0.01, 0.04, 0, 0.054, -0.5);
  box(g, black, 0.005, 0.03, 0.005, 0, 0.074, -0.505);
  box(g, dot, 0.003, 0.003, 0.0015, 0, 0.083, -0.5085);
  box(g, black, 0.034, 0.012, 0.044, 0, 0.05, 0.1);
  box(g, black, 0.008, 0.02, 0.012, 0.012, 0.062, 0.12);
  box(g, black, 0.008, 0.02, 0.012, -0.012, 0.062, 0.12);
  // скоба, спуск, рукоять
  box(g, poly, 0.012, 0.012, 0.09, 0, -0.082, 0.05);
  box(g, poly, 0.012, 0.04, 0.012, 0, -0.06, 0.005);
  box(g, steelL, 0.007, 0.03, 0.009, 0, -0.055, 0.05, 0.3);
  const gr = new THREE.Group(); gr.position.set(0, -0.12, 0.105); gr.rotation.x = -0.32; g.add(gr);
  box(gr, poly, 0.042, 0.14, 0.056, 0, 0, 0);
  for (let k = 0; k < 7; k++) box(gr, black, 0.0445, 0.004, 0.058, 0, -0.054 + k * 0.016, 0);
  box(gr, olive, 0.046, 0.05, 0.05, 0, 0.03, 0.0);
  box(gr, black, 0.046, 0.014, 0.062, 0, 0.074, 0.003);
  // магазин на 20 патронов (изогнутый): отдельная группа, ось — передний зацеп у горловины
  const mg = new THREE.Group(); mg.position.set(0, -0.05, -0.06); g.add(mg);
  box(mg, oxide, 0.034, 0.075, 0.056, 0, -0.032, 0.02, 0.08);
  box(mg, oxide, 0.034, 0.075, 0.056, 0, -0.098, 0.002, 0.2);
  for (let k = 0; k < 5; k++) box(mg, oxideL, 0.0355, 0.004, 0.058, 0, -0.008 - k * 0.026, 0.024 - k * 0.0095, 0.08 + k * 0.03);
  box(mg, black, 0.038, 0.012, 0.062, 0, -0.14, -0.007, 0.2);
  box(mg, brass, 0.012, 0.012, 0.03, 0, 0.0, 0.02);
  g.userData.mag = mg; g.userData.magVis = true;
  // затворная рукоятка (двигается при стрельбе)
  const hg = new THREE.Group(); hg.position.set(0.0, 0.0, 0.0); g.add(hg); g.userData.slide = hg;
  box(hg, steelL, 0.01, 0.014, 0.04, 0.034, 0.024, -0.02);
  box(hg, black, 0.016, 0.02, 0.012, 0.04, 0.024, 0.0);
  // переводчик огня
  box(g, steelL, 0.006, 0.05, 0.012, -0.0285, 0.0, 0.085, 0, 0, 0.0);
  box(g, brass, 0.007, 0.01, 0.016, -0.03, -0.02, 0.085);
  // складной скелетный приклад
  box(g, oxideL, 0.016, 0.02, 0.05, 0, 0.0, 0.17);
  box(g, black, 0.012, 0.012, 0.27, 0, 0.018, 0.3, -0.045);
  box(g, black, 0.012, 0.012, 0.27, 0, -0.05, 0.3, 0.12);
  box(g, black, 0.011, 0.075, 0.011, 0, -0.016, 0.36, -0.05);
  box(g, black, 0.011, 0.065, 0.011, 0, -0.012, 0.24, 0.02);
  box(g, poly, 0.036, 0.125, 0.028, 0, -0.03, 0.44, 0.08);
  box(g, black, 0.038, 0.115, 0.006, 0, -0.03, 0.456, 0.08);
  box(g, oxideL, 0.014, 0.02, 0.03, 0, -0.012, 0.42);
  g.userData.muzzle = new THREE.Vector3(0, 0.012, -0.64);
  return g;
}

/* ---------- Револьвер .357: откидной барабан, выбрасыватель, курок ---------- */
function buildRevolver(M: MatFn) {
  const g = new THREE.Group();
  const blue = M(0x2b3138, { metal: 0.9, rough: 0.3 }), blueL = M(0x7b858e, { metal: 0.95, rough: 0.22 });
  const black = M(0x0b0c0e, { metal: 0.4, rough: 0.5 }), wood = M(0x6e3b1c, { rough: 0.5 }), woodD = M(0x3f2210, { rough: 0.6 });
  const brass = M(0xd9ad45, { metal: 0.95, rough: 0.25 }), copper = M(0xb87333, { metal: 0.8, rough: 0.35 });
  const dot = M(0xe6ffd8, { emissive: 0xe6ffd8 }), red = M(0xff3030, { emissive: 0xff3030 });
  const CY = -0.003, CZ = -0.06, PI = Math.PI;
  const rad = 0.0145;   // радиус окружности каморов

  // рамка: тыльная часть, верхняя планка над барабаном, нижняя часть и носовая часть
  box(g, blue, 0.036, 0.07, 0.06, 0, 0.0, 0.02);
  box(g, blue, 0.03, 0.014, 0.19, 0, 0.032, -0.034);
  box(g, blue, 0.03, 0.016, 0.1, 0, -0.037, -0.047);
  box(g, blue, 0.034, 0.05, 0.042, 0, 0.006, -0.11);
  box(g, blueL, 0.026, 0.004, 0.19, 0, 0.0405, -0.034);                 // блик на планке
  for (let k = 0; k < 8; k++) box(g, black, 0.0305, 0.003, 0.004, 0, 0.0412, 0.03 - k * 0.006);   // насечки антибликовые
  box(g, blue, 0.038, 0.04, 0.05, 0, -0.045, 0.03);                      // тыльник рукояти
  // прицел: целик на планке и мушка с точкой
  box(g, black, 0.022, 0.01, 0.026, 0, 0.0455, 0.002);
  box(g, black, 0.007, 0.012, 0.024, 0.0095, 0.05, 0.002); box(g, black, 0.007, 0.012, 0.024, -0.0095, 0.05, 0.002);
  box(g, blue, 0.007, 0.014, 0.03, 0, 0.0295, -0.272);
  box(g, dot, 0.004, 0.004, 0.002, 0, 0.0385, -0.288);
  box(g, red, 0.0035, 0.0035, 0.002, 0, 0.0555, -0.0125);               // красная точка на целике (чтоб было видно в темноте)

  // ствол с вентилируемой планкой и подствольным кожухом
  cylZ(g, blue, 0.0105, 0.0105, 0.17, 0, 0.012, -0.215, 16);
  box(g, blueL, 0.008, 0.005, 0.17, 0, 0.0245, -0.215);
  cylZ(g, blue, 0.0085, 0.0085, 0.15, 0, -0.0045, -0.205, 12);
  cylZ(g, blueL, 0.0118, 0.0118, 0.008, 0, 0.012, -0.3, 16);
  cylZ(g, black, 0.0072, 0.0072, 0.01, 0, 0.012, -0.302, 10);
  // выбрасыватель: шток с головкой (двигается при выбрасывании гильз)
  const rod = new THREE.Group(); rod.position.set(0, -0.0045, -0.13); g.add(rod); g.userData.pump = rod;
  cylZ(rod, blueL, 0.0036, 0.0036, 0.1, 0, 0, -0.07, 8);
  cylZ(rod, black, 0.0078, 0.0078, 0.014, 0, 0, -0.1555, 12);
  cylZ(rod, blueL, 0.0066, 0.0066, 0.004, 0, 0, -0.1635, 12);

  // журавль + барабан (откидывается влево вокруг шарнира, параллельного стволу)
  const crane = new THREE.Group(); crane.position.set(-0.026, CY - 0.026, CZ); g.add(crane); g.userData.crane = crane;
  cylZ(crane, blueL, 0.0048, 0.0048, 0.05, 0, 0, -0.03, 8);
  box(crane, blue, 0.016, 0.02, 0.012, 0.012, 0.012, -0.036);
  const drum = new THREE.Group(); drum.position.set(0.026, 0.026, 0); crane.add(drum); g.userData.drum = drum;
  cylZ(drum, blue, 0.0245, 0.0245, 0.056, 0, 0, 0, 26);
  for (let k = 0; k < 6; k++) {
    const a = k * PI / 3 + PI / 6, ca = k * PI / 3;
    box(drum, black, 0.011, 0.007, 0.034, Math.sin(a) * 0.0245, Math.cos(a) * 0.0245, 0.0, 0, 0, -a);   // продольные проточки
    cylZ(drum, black, 0.0063, 0.0063, 0.003, Math.sin(ca) * rad, Math.cos(ca) * rad, -0.0285, 10);       // каморы спереди
  }
  cylZ(drum, blueL, 0.0075, 0.0075, 0.006, 0, 0, -0.0305, 12);
  const rims = new THREE.Group(); drum.add(rims); g.userData.rim = rims;                                  // донца патронов сзади
  for (let k = 0; k < 6; k++) {
    const ca = k * PI / 3, x = Math.sin(ca) * rad, y = Math.cos(ca) * rad;
    cylZ(rims, brass, 0.0068, 0.0068, 0.004, x, y, 0.0285, 12);
    cylZ(rims, copper, 0.0026, 0.0026, 0.005, x, y, 0.0292, 8);
  }
  cylZ(drum, blueL, 0.0085, 0.0085, 0.005, 0, 0, 0.0295, 12);                                            // храповик

  // курок
  const hm = new THREE.Group(); hm.position.set(0, 0.021, 0.058); g.add(hm); g.userData.hammer = hm;
  box(hm, black, 0.01, 0.036, 0.012, 0, 0.014, 0.01, 0.45);
  box(hm, black, 0.0115, 0.006, 0.02, 0, 0.03, 0.022);
  // спусковая скоба и спуск
  box(g, blue, 0.01, 0.01, 0.085, 0, -0.07, -0.026);
  box(g, blue, 0.01, 0.034, 0.01, 0, -0.054, -0.07);
  box(g, blueL, 0.006, 0.028, 0.008, 0, -0.049, -0.026, 0.35);
  // фиксатор барабана (левая сторона)
  box(g, blueL, 0.006, 0.014, 0.03, -0.0215, 0.002, 0.0);
  // рукоять (как у пистолета, чтобы совпала посадка рук): деревянные щёчки
  const gr = new THREE.Group(); gr.position.set(0, -0.105, 0.012); gr.rotation.x = -0.2; g.add(gr);
  box(gr, blue, 0.034, 0.15, 0.058, 0, 0, 0.002);
  box(gr, wood, 0.0475, 0.128, 0.064, 0, -0.01, 0.003);
  for (let k = 0; k < 8; k++) box(gr, woodD, 0.0485, 0.0035, 0.066, 0, -0.054 + k * 0.0145, 0.003);
  box(gr, brass, 0.0485, 0.012, 0.012, 0, 0.034, -0.002);
  box(gr, blueL, 0.036, 0.012, 0.07, 0, -0.078, 0.004);                    // пятка
  cylZ(gr, blueL, 0.006, 0.006, 0.01, 0, -0.07, 0.04, 8);                   // антабка
  // скорозарядное устройство (появляется только при перезарядке): 6 патронов на диске
  const mg = new THREE.Group(); g.add(mg); g.userData.mag = mg; g.userData.magVis = false; mg.visible = false;
  for (let k = 0; k < 6; k++) {
    const ca = k * PI / 3 - 1.3, x = Math.sin(ca) * rad, y = Math.cos(ca) * rad;   // каморы открытого барабана повёрнуты на −1.3 рад
    cylZ(mg, brass, 0.0062, 0.0068, 0.033, x, y, -0.0185, 12);
    cylZ(mg, copper, 0.0036, 0.0062, 0.02, x, y, -0.0525, 12);
  }
  cylZ(mg, black, 0.021, 0.021, 0.006, 0, 0, 0.003, 18);
  cylZ(mg, M(0x3a3f45, { metal: 0.6, rough: 0.5 }), 0.0095, 0.0095, 0.016, 0, 0, 0.014, 12);
  cylZ(mg, blueL, 0.011, 0.011, 0.004, 0, 0, 0.0185, 12);
  // положение «у открытого барабана»: центр барабана после поворота журавля на 1.3 рад
  mg.position.set(-0.0441, CY + 0.006, CZ + 0.0285 + 0.002);
  g.userData.muzzle = new THREE.Vector3(0, 0.012, -0.304);
  return g;
}

/* ---------- Ближний бой: труба, мачете, кукри (остриё — в −Z, рукоять у начала координат) ---------- */
function buildPipe(M: MatFn) {
  const g = new THREE.Group();
  const rust = M(0x6f685c, { metal: 0.7, rough: 0.55 }), rustD = M(0x4d3a2c, { metal: 0.6, rough: 0.7 });
  const tape = M(0x15181a, { rough: 0.9 }), steel = M(0x8c9298, { metal: 0.9, rough: 0.3 });
  cylZ(g, rust, 0.027, 0.027, 0.84, 0, 0, -0.26, 12);                 // труба
  cylZ(g, rustD, 0.031, 0.031, 0.05, 0, 0, -0.69, 12);                // муфта на конце
  cylZ(g, steel, 0.0335, 0.0335, 0.012, 0, 0, -0.665, 12);            // фланец
  cylZ(g, rustD, 0.0285, 0.0285, 0.03, 0, 0, -0.35, 12);              // ржавое кольцо
  cylZ(g, tape, 0.0305, 0.0305, 0.22, 0, 0, 0.07, 12);                // обмотка рукояти
  for (let k = 0; k < 5; k++) cylZ(g, M(0x2a2e31, { rough: 0.9 }), 0.032, 0.032, 0.012, 0, 0, -0.03 + k * 0.045, 12);
  cylZ(g, steel, 0.031, 0.031, 0.012, 0, 0, 0.19, 12);                // заглушка
  return g;
}

// плоский клинок по контуру: pts — [вперёд (к острию), вверх]; толщина вдоль X
const blade = (g, mat, pts: number[][], th: number, x = 0) => {
  const sh = new THREE.Shape(); pts.forEach(([u, v], i) => (i ? sh.lineTo(u, v) : sh.moveTo(u, v)));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false, curveSegments: 8 });
  geo.translate(0, 0, -th / 2); geo.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(geo, mat); m.position.x = x; g.add(m); return m;
};
// гладкая кривая по опорным точкам
const curve = (pts: number[][], n = 5) => {
  const c = new THREE.SplineCurve(pts.map(([u, v]) => new THREE.Vector2(u, v)));
  return c.getPoints(pts.length * n).map(q => [q.x, q.y]);
};

function buildMachete(M: MatFn) {
  const g = new THREE.Group();
  const steel = M(0x9aa3aa, { metal: 0.95, rough: 0.28 }), edge = M(0xe3e8eb, { metal: 1, rough: 0.16 }), spine = M(0x4c5258, { metal: 0.9, rough: 0.4 });
  const grip = M(0x1a1c1e, { rough: 0.85 }), rivet = M(0xc9a64a, { metal: 0.9, rough: 0.3 });
  const top = curve([[0.0, 0.028], [0.25, 0.028], [0.42, 0.027], [0.5, 0.02], [0.545, 0.004]], 6);
  const bot = curve([[0.54, -0.006], [0.5, -0.034], [0.4, -0.044], [0.25, -0.042], [0.1, -0.034], [0.0, -0.028]], 6);
  const outline = [...top, ...bot];
  blade(g, steel, outline, 0.006);
  blade(g, edge, [...curve([[0.54, -0.006], [0.5, -0.034], [0.4, -0.044], [0.25, -0.042], [0.1, -0.034], [0.0, -0.028]], 6), [0.0, -0.019], ...curve([[0.1, -0.025], [0.25, -0.033], [0.4, -0.035], [0.5, -0.025], [0.535, -0.004]], 6)], 0.0085);
  blade(g, spine, [[0, 0.03], [0.46, 0.03], [0.5, 0.022], [0.5, 0.017], [0.46, 0.022], [0, 0.021]], 0.012);   // обух
  blade(g, spine, [[-0.02, 0.03], [0.0, 0.034], [0.012, 0.03], [0.012, -0.034], [-0.02, -0.034]], 0.014);        // гарда
  // рукоять
  box(g, grip, 0.026, 0.05, 0.14, 0, -0.002, 0.075);
  box(g, grip, 0.03, 0.055, 0.02, 0, -0.002, 0.15);
  for (const z of [0.04, 0.085, 0.12]) cylZ(g, rivet, 0.005, 0.005, 0.03, 0, -0.002, z, 8);
  box(g, M(0x6a4a2c, { rough: 0.9 }), 0.006, 0.02, 0.03, 0, -0.04, 0.155);                                // темляк
  return g;
}

function buildKukri(M: MatFn) {
  const g = new THREE.Group();
  const steel = M(0xa5adb3, { metal: 0.95, rough: 0.26 }), edge = M(0xe6ecef, { metal: 1, rough: 0.16 }), spine = M(0x3e444a, { metal: 0.9, rough: 0.4 });
  const wood = M(0x5a3a22, { rough: 0.55 }), woodD = M(0x3a2414, { rough: 0.6 }), brass = M(0xd0a640, { metal: 0.95, rough: 0.28 });
  // контур: обух идёт вниз-вперёд, лезвие — вогнутое у рукояти и с выпуклым «брюшком»
  const top = curve([[0.0, 0.016], [0.1, 0.012], [0.2, 0.0], [0.29, -0.022], [0.345, -0.052]], 6);
  const bot = curve([[0.35, -0.06], [0.31, -0.1], [0.23, -0.115], [0.15, -0.092], [0.08, -0.052], [0.0, -0.034]], 6);
  blade(g, steel, [...top, ...bot], 0.006);
  blade(g, edge, [...curve([[0.35, -0.06], [0.31, -0.1], [0.23, -0.115], [0.15, -0.092], [0.08, -0.052], [0.0, -0.034]], 6), [0, -0.025], ...curve([[0.08, -0.044], [0.15, -0.083], [0.23, -0.105], [0.3, -0.092], [0.343, -0.058]], 6)], 0.0085);
  blade(g, spine, [[0, 0.018], [0.1, 0.014], [0.2, 0.002], [0.29, -0.02], [0.348, -0.05], [0.34, -0.056], [0.285, -0.03], [0.2, -0.01], [0.1, 0.0], [0, 0.004]], 0.012);   // толстый обух
  blade(g, steel, [[0.03, -0.03], [0.06, -0.026], [0.06, -0.05], [0.03, -0.044]], 0.0085);   // каули — выемка у пятки
  // латунная гарда и рукоять
  cylZ(g, brass, 0.024, 0.024, 0.016, 0, -0.01, -0.01, 12);
  cylZ(g, wood, 0.019, 0.016, 0.08, 0, -0.01, 0.045, 12);
  cylZ(g, woodD, 0.0185, 0.0185, 0.008, 0, -0.01, 0.022, 12);
  cylZ(g, woodD, 0.0175, 0.0175, 0.008, 0, -0.01, 0.062, 12);
  cylZ(g, wood, 0.016, 0.026, 0.04, 0, -0.01, 0.1, 12);
  cylZ(g, brass, 0.027, 0.027, 0.012, 0, -0.01, 0.125, 12);
  return g;
}

export const WEAPON_BUILDERS = { pistol: buildPistol, revolver: buildRevolver, ak74: buildAk74, mosin: buildMosin, rifle: buildRifle, shotgun: buildShotgun, flame: buildFlame, asval: buildAsVal, pipe: buildPipe, machete: buildMachete, kukri: buildKukri };

export function buildWeaponModel(id: string, M: MatFn) {
  const b = WEAPON_BUILDERS[id]; return b ? b(M) : null;
}
// Оружие в руках: matcap даёт объём без зависимости от света фонаря (чтобы не «выгорало»)
let _matcap: THREE.Texture | null = null;
export function matcap() {
  if (_matcap) return _matcap;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(46, 40, 4, 64, 64, 66);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#c4c4c4'); g.addColorStop(0.85, '#5c5c5c'); g.addColorStop(1, '#2c2c2c');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  _matcap = new THREE.CanvasTexture(c); _matcap.colorSpace = THREE.SRGBColorSpace;
  return _matcap;
}
export const flatMat: MatFn = (color, o = {}) => o.emissive
  ? new THREE.MeshBasicMaterial({ color: o.emissive, fog: false })
  : new THREE.MeshMatcapMaterial({ color, matcap: matcap(), fog: false });
export const litMat: MatFn = (color, o = {}) => new THREE.MeshStandardMaterial({
  color, metalness: o.metal ?? 0.1, roughness: o.rough ?? 0.6,
  emissive: o.emissive ?? 0x000000, emissiveIntensity: o.emissive ? 1.2 : 0
});

/* ================= ПРЕДПРОСМОТР (верстак) ================= */
// Один общий WebGL-рендерер рисует вращающиеся модели и копирует кадр в 2D-канвасы карточек.
const PW = 360, PH = 200;
export class WeaponPreviewer {
  renderer: THREE.WebGLRenderer; scene = new THREE.Scene(); camera: THREE.PerspectiveCamera;
  items: Record<string, { pivot: THREE.Group; r: number; yaw: number; hold: number }> = {};
  targets: { id: string; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }[] = [];
  raf = 0; last = 0; running = false;
  constructor(ids: string[]) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(1); this.renderer.setSize(PW, PH, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.1;
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.camera = new THREE.PerspectiveCamera(30, PW / PH, 0.05, 20);
    const key = new THREE.DirectionalLight(0xfff0dd, 2.2); key.position.set(2, 3, 3); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fb8ff, 1.6); rim.position.set(-3, 1.5, -2); this.scene.add(rim);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    for (const id of ids) {
      const model = buildWeaponModel(id, litMat); if (!model) continue;
      const bb = new THREE.Box3().setFromObject(model), c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
      model.position.sub(c);
      const pivot = new THREE.Group(); pivot.add(model); pivot.visible = false; this.scene.add(pivot);
      this.items[id] = { pivot, r: s.length() / 2, yaw: Math.random() * 6, hold: 0 };
    }
  }
  /** Привязать канвасы (после каждой перерисовки панели) */
  attach(canvases: HTMLCanvasElement[]) {
    this.targets = canvases.map(canvas => {
      canvas.width = PW; canvas.height = PH;
      const id = canvas.dataset.wpn;
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
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      this.draw(dt, now / 1000);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); this.targets = []; }
  draw(dt: number, t: number) {
    for (const tg of this.targets) {
      const it = this.items[tg.id]; if (!it || !tg.canvas.isConnected) continue;
      if (it.hold > 0) it.hold -= dt; else it.yaw += dt * 0.7;
      for (const k in this.items) this.items[k].pivot.visible = k === tg.id;
      it.pivot.rotation.y = it.yaw; it.pivot.position.y = Math.sin(t * 1.6 + it.r * 5) * 0.015;
      const d = it.r / Math.tan((this.camera.fov * Math.PI) / 360) * 0.66;
      this.camera.position.set(0, it.r * 0.32, d); this.camera.lookAt(0, -it.r * 0.04, 0);
      this.renderer.render(this.scene, this.camera);
      tg.ctx.clearRect(0, 0, PW, PH); tg.ctx.drawImage(this.renderer.domElement, 0, 0);
    }
  }
}
