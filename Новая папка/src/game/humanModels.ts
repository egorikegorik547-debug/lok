// @ts-nocheck
// Детализированные модели людей-монстров: Бродяга, Бегун, Кислотник, Подрывник, Громила.
// «Лицо» смотрит в +Z. Интерфейс для game.ts: legL/legR/armL/armR/upper/head/eyeMat (+ belly/core/bellyMesh, sacs/sacMat/mouth, tick).
import * as THREE from 'three';
import { Part, std, dim, mix, ball, onEll, ellAt, rng, noise3 } from './modelKit';

const PARAMS = {
  walker:  { tw: 1.0,  td: 1.0,  lb: 1.0,  arm: 1.0,  sx: 0.37, lx: 0.15, hd: 1.0,  jw: 1.0 },
  runner:  { tw: 0.8,  td: 0.82, lb: 0.78, arm: 1.14, sx: 0.31, lx: 0.12, hd: 0.95, jw: 1.4 },
  spitter: { tw: 0.92, td: 0.95, lb: 0.9,  arm: 1.0,  sx: 0.35, lx: 0.14, hd: 1.0,  jw: 1.25 },
  bloater: { tw: 1.1,  td: 1.2,  lb: 1.15, arm: 0.9,  sx: 0.52, lx: 0.2,  hd: 0.84, jw: 1.1 },
  brute:   { tw: 1.42, td: 1.25, lb: 1.3,  arm: 1.02, sx: 0.5,  lx: 0.2,  hd: 0.86, jw: 1.3 }
};
const surfZ = (e, x, y) => e.c[2] + e.r[2] * Math.sqrt(Math.max(0.0001, 1 - ((x - e.c[0]) / e.r[0]) ** 2 - ((y - e.c[1]) / e.r[1]) ** 2));
const wound = (p, mat, x, y, rad, e, sz = 0.28, o = {}) => p.sphere(mat, rad, x, y, surfZ(e, x, y) - rad * sz * 0.35, 1, 1.1, sz, o);
const dome = (p, mat, r, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) =>
  p.place(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y, z, rx, ry, rz, sx, sy, sz);

function teethRow(p, mat, y, z0, spread, n, up, size = 1) {
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) - 0.5, x = t * spread * 2, z = z0 - t * t * 0.09;
    const s = (i % 3 === 1 ? 1.3 : 1) * size;
    p.cone(mat, 0.0085 * size, 0.026 * s, [x, y, z], [t * 0.4, up ? -1 : 1, 0.12], 4);
  }
}

export function buildHuman(type, cfg, clothColor) {
  const P = PARAMS[type], r = rng((Math.random() * 1e9) | 0);
  const g = new THREE.Group(); g.rotation.order = 'YXZ';
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd34d });
  const isRun = type === 'runner', isSpit = type === 'spitter', isBloat = type === 'bloater', isBrute = type === 'brute', isWalk = type === 'walker';

  /* ---------- материалы ---------- */
  const skin = std(cfg.skin, { tex: 'skin', rough: 0.76, bump: 0.9 });
  const skinD = std(dim(cfg.skin, 0.62), { tex: 'skin', rough: 0.8, bump: 0.9 });
  const skinL = std(mix(cfg.skin, 0xffffff, 0.2), { tex: 'skin', rough: 0.7, bump: 0.7 });
  const flesh = std(0x7c2428, { tex: 'skin', rough: 0.3, bump: 1.4 });
  const fleshD = std(0x3a0d10, { tex: 'skin', rough: 0.4, bump: 1.0 });
  const bone = std(0xdad2b2, { rough: 0.55 });
  const teethM = std(0xc9bd8a, { rough: 0.45 });
  const nailM = std(0x1b1713, { rough: 0.4 });
  const cloth = std(clothColor, { tex: 'cloth', rough: 0.95, bump: 0.9 });
  const clothD = std(dim(clothColor, 0.55), { tex: 'cloth', rough: 0.95, bump: 0.9 });
  const pants = std(0x2a2c31, { tex: 'cloth', rough: 0.95, bump: 0.9 });
  const leather = std(0x1d1813, { tex: 'metal', rough: 0.55, metal: 0.1, bump: 0.5 });
  const metal = std(0x7c8084, { tex: 'metal', rough: 0.45, metal: 0.75, bump: 0.8 });
  const rust = std(0x8a5230, { tex: 'metal', rough: 0.8, metal: 0.45, bump: 1.0 });
  const dark = std(0x060505, { rough: 1 });
  const hiviz = std(0xd6d99a, { rough: 0.5, emissive: 0x555a22, ei: 0.5 });

  /* ---------- анатомия торса ---------- */
  const tw = P.tw, td = P.td, lb = P.lb, A = P.arm;
  const ch = { c: [0, 0.5, 0], r: [0.28 * tw, 0.33, 0.21 * td] };
  const ab = { c: [0, 0.2, 0], r: [0.23 * tw, 0.2, 0.17 * td] };
  const pv = { c: [0, 0.02, 0], r: [0.25 * tw, 0.13, 0.17 * td] };

  /* ---------- ноги ---------- */
  const mkLeg = s => {
    const l = new THREE.Group(); l.position.set(s * P.lx, 0.85, 0); g.add(l);
    const p = new Part(l);
    const lm = isRun ? skinD : pants;
    p.limb(lm, [0, -0.02, 0], [0, -0.44, 0.03], 0.115 * lb, 0.082 * lb, 10);
    p.sphere(lm, 0.088 * lb, 0, -0.45, 0.05, 1, 1, 0.9, { lump: 0.05 });
    p.limb(lm, [0, -0.45, 0.04], [0, -0.62, 0.02], 0.078 * lb, 0.066 * lb, 10);
    if (isRun) {
      // мышцы и сухожилия
      p.sphere(skinD, 0.06 * lb, s * 0.01, -0.22, 0.07, 1, 1.6, 0.8, { lump: 0.15 });
      p.tube(flesh, [[0, -0.55, -0.045], [0, -0.7, -0.05], [0, -0.78, -0.03]], 0.014, 0.01, 6, 5);
    } else {
      for (let k = 0; k < 8; k++) {            // рваные края штанин
        const a = k / 8 * 6.283, len = 0.05 + r() * 0.07;
        p.cone(lm, 0.022, len, [Math.sin(a) * 0.068 * lb, -0.58, Math.cos(a) * 0.068 * lb + 0.02], [Math.sin(a) * 0.25, -1, Math.cos(a) * 0.25], 4);
      }
      p.box(clothD, 0.15 * lb, 0.06, 0.15 * lb, 0, -0.5 - r() * 0.04, 0.045, 0.1, 0, 0);               // повязка / заплатка
    }
    p.limb(skin, [0, -0.6, 0.02], [0, -0.78, 0], 0.056 * lb, 0.048 * lb, 8);
    if (isRun || isSpit) {
      // босая, когтистая ступня
      p.box(skinD, 0.1 * lb, 0.06, 0.2, 0, -0.82, 0.08);
      p.sphere(skinD, 0.052 * lb, 0, -0.82, 0.17, 1, 0.6, 1.1);
      for (let k = -1; k <= 1; k++) p.cone(nailM, 0.013, 0.06, [k * 0.032, -0.83, 0.2], [k * 0.15, -0.15, 1], 4);
      p.cone(nailM, 0.016, 0.07, [-0.01, -0.77, -0.04], [0, -0.7, -1], 4);
    } else {
      p.limb(leather, [0, -0.7, 0], [0, -0.8, 0], 0.074 * lb, 0.082 * lb, 10);
      p.box(leather, 0.14 * lb, 0.08, 0.26, 0, -0.81, 0.07);
      p.sphere(leather, 0.07 * lb, 0, -0.81, 0.19, 1, 0.75, 1.1);
      p.box(dark, 0.15 * lb, 0.028, 0.32, 0, -0.84, 0.08);
      p.box(metal, 0.1 * lb, 0.012, 0.02, 0, -0.76, 0.06);                // пряжка
      for (let k = 0; k < 3; k++) p.box(std(0xb0a890, { rough: 0.8 }), 0.09 * lb, 0.008, 0.012, 0, -0.74 - k * 0.025, 0.07 + 0.012);
    }
    p.flush(); return l;
  };
  const legL = mkLeg(-1), legR = mkLeg(1);

  /* ---------- верхняя часть ---------- */
  const upper = new THREE.Group(); upper.position.set(0, 0.85, 0); g.add(upper);
  const T = new Part(upper);
  const dangles = [];
  const bodyM = (isRun ? skinD : (isSpit ? std(0x5a6e3c, { tex: 'cloth', rough: 0.45, metal: 0.05, bump: 0.5 }) : cloth));
  const U = bodyM;
  // таз и пояс
  T.sphere(pants, 1, ...pv.c, ...pv.r, { lump: 0.03, w: 16, h: 10 });
  { const [rx, rz] = ellAt(pv, 0.07, 0.012); T.band(leather, rx, rz, 0.07, 0.06, 0, 0, 20); T.box(metal, 0.07, 0.05, 0.02, 0, 0.07, rz + 0.004); }
  // живот / грудь
  T.sphere(isBloat ? clothD : U, 1, ...ab.c, ...ab.r, { lump: 0.03, w: 18, h: 12 });
  T.sphere(U, 1, ...ch.c, ...ch.r, { lump: isRun ? 0.02 : 0.03, w: 20, h: 14 });
  // плечи и шея
  for (const s of [-1, 1]) T.sphere(isRun ? skinD : U, (isBrute ? 0.13 : 0.11) * lb, s * (P.sx - 0.04), 0.7, 0, 1, 0.95, 1, { lump: 0.08 });
  T.limb(skin, [0, 0.74, 0.0], [0, 0.88, 0.04], 0.075 * P.hd, 0.062 * P.hd, 8);
  for (const s of [-1, 1]) T.limb(skinD, [s * 0.05, 0.78, 0.03], [s * 0.12, 0.7, -0.02], 0.02, 0.026, 6); // трапеции

  /* --- Бродяга: спецовка с светоотражающими полосами, пропуск, карманы --- */
  if (isWalk) {
    { const [rx, rz] = ellAt(ch, 0.42, 0.012); T.band(hiviz, rx, rz, 0.42, 0.05, 0, 0, 22); }
    { const [rx, rz] = ellAt(ab, 0.16, 0.01); T.band(hiviz, rx, rz, 0.16, 0.04, 0, 0, 22); }
    for (const s of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 5; i++) { const y = 0.36 + i * 0.085, x = s * (0.11 - i * 0.012); pts.push([x, y, surfZ(ch, x, y) + 0.008]); }
      for (let i = 0; i < 5; i++) T.limb(hiviz, pts[i], pts[i + 1], 0.02, 0.02, 5);
    }
    T.torus(std(0x1a1a1a, { rough: 0.8 }), 0.1, 0.006, 0, 0.8, 0.045, Math.PI / 2 - 0.5, 0, 0, 1, 1.2, 1);   // шнурок
    { const lg = new THREE.Group(); lg.position.set(0, 0.74, 0.19); upper.add(lg); const lp = new Part(lg);
      lp.box(std(0xe8e8e0, { rough: 0.5 }), 0.07, 0.1, 0.006, 0, -0.07, 0.01); lp.box(std(0xb02020, { rough: 0.5 }), 0.07, 0.02, 0.008, 0, -0.03, 0.01);
      lp.box(dark, 0.03, 0.03, 0.008, 0, -0.08, 0.012); lp.flush(); dangles.push({ g: lg, k: 0.8, ph: 0.3 }); }
    T.box(clothD, 0.12, 0.1, 0.03, -0.12, 0.52, ch.r[2] * 0.93, 0.15);             // нагрудный карман
    T.box(clothD, 0.13, 0.11, 0.035, 0.14, 0.12, ab.r[2] * 0.97, 0.1);              // боковой карман
    T.box(metal, 0.012, 0.012, 0.006, -0.12, 0.56, ch.r[2] * 0.93 + 0.02);          // кнопка
    // порванный участок с раной
    wound(T, flesh, 0.07, 0.4, 0.085, ch, 0.18, { lump: 0.1 });
    wound(T, fleshD, 0.07, 0.4, 0.05, ch, 0.18, { lump: 0.2 });
    for (let k = 0; k < 4; k++) { const y = 0.34 + k * 0.045; T.tube(bone, [[0.03, y, surfZ(ch, 0.03, y) + 0.004], [0.1, y + 0.01, surfZ(ch, 0.1, y) + 0.012], [0.17, y, surfZ(ch, 0.17, y) + 0.004]], 0.008, 0.008, 6, 5); }
    for (let k = 0; k < 7; k++) {                                                    // лохмотья ткани
      const a = -0.7 + k * 0.22; T.cone(cloth, 0.03, 0.09 + r() * 0.08, [Math.sin(a) * ab.r[0] * 0.95, 0.04, Math.cos(a) * ab.r[2] * 0.95], [Math.sin(a) * 0.2, -1, Math.cos(a) * 0.2], 4);
    }
  }
  /* --- Бегун: рёбра, позвоночник, рваная толстовка --- */
  if (isRun) {
    for (let k = 0; k < 7; k++) { const y = 0.3 + k * 0.075; const [rx, rz] = ellAt(ch, y, -0.004); T.band(skinL, rx, rz, y, 0.022, 0, 0, 22); }
    for (let k = 0; k < 9; k++) { const y = 0.1 + k * 0.08, e = k < 4 ? ab : ch; T.sphere(bone, 0.022, 0, y, -e.r[2] * 0.97, 1, 1, 1, { w: 6, h: 5 }); }
    wound(T, flesh, -0.06, 0.38, 0.07, ch, 0.18, { lump: 0.18 });
    for (let k = 0; k < 3; k++) { const y = 0.34 + k * 0.045; T.tube(bone, [[-0.15, y, surfZ(ch, -0.15, y) + 0.004], [-0.08, y + 0.01, surfZ(ch, -0.08, y) + 0.012], [-0.01, y, surfZ(ch, -0.01, y) + 0.004]], 0.007, 0.007, 6, 5); }
    for (const s of [-1, 1]) {                                                       // ключицы
      T.limb(bone, [s * 0.03, 0.73, 0.085], [s * 0.19, 0.72, 0.04], 0.012, 0.012, 5);
    }
    // обрывок толстовки на спине
    dome(T, cloth, 0.3, 0, 0.38, -0.06, 0.95, 0.9, 0.7, -2.5, 0, 0);
    T.sphere(clothD, 0.1, 0, 0.78, -0.12, 1.5, 0.6, 0.8, { lump: 0.2 });                       // смятый капюшон
    // тонкие сухожилия на шее
    for (const s of [-1, 1]) T.limb(skinL, [s * 0.04, 0.78, 0.06], [s * 0.08, 0.7, 0.1], 0.012, 0.016, 5);
    for (let k = 0; k < 3; k++) {
      const hang = new THREE.Group(); hang.position.set((k - 1) * 0.14, 0.01, -0.12 + Math.abs(k - 1) * 0.07); upper.add(hang);
      const hp = new Part(hang); hp.box(cloth, 0.06, 0.2 + k % 2 * 0.06, 0.012, 0, -0.11, 0, 0, 0, (k - 1) * 0.1); hp.cone(cloth, 0.03, 0.06, [0, -0.2 - k % 2 * 0.06, 0], [0, -1, 0], 4); hp.flush();
      dangles.push({ g: hang, k: 0.9, ph: k * 1.7 });
    }
  }
  /* --- Кислотник: резиновый защитный костюм, сломанный респиратор --- */
  if (isSpit) {
    for (let k = 0; k < 3; k++) { const y = 0.32 + k * 0.14; const [rx, rz] = ellAt(ch, y, 0.01); T.band(std(0x232a1b, { rough: 0.5 }), rx, rz, y, 0.02, 0, 0, 20); }
    wound(T, skin, 0.12, 0.5, 0.1, ch, 0.35, { lump: 0.12 });                       // прореха в костюме, проступившая кожа
    for (const [x, y, rr] of [[0.14, 0.52, 0.04], [0.09, 0.46, 0.03], [-0.15, 0.3, 0.035], [-0.08, 0.2, 0.03]]) {
      T.sphere(std(0x9cff55, { rough: 0.25, emissive: 0x3fb010, ei: 0.8 }), rr, x, y, surfZ(ch, x, y) + 0.005, 1, 1, 0.7, { w: 8, h: 6 });
    }
    // респиратор на шее
    T.torus(leather, 0.09, 0.02, 0, 0.78, 0.04, Math.PI / 2, 0, 0, 1, 1, 1);
    T.limb(metal, [0, 0.62, 0.2], [0, 0.62, 0.26], 0.05, 0.05, 10);
    T.limb(leather, [0, 0.62, 0.26], [0, 0.62, 0.275], 0.055, 0.055, 10);
    T.tube(leather, [[0, 0.64, 0.2], [0.09, 0.72, 0.14], [0.06, 0.78, 0.1]], 0.016, 0.016, 8, 6);
    T.box(rust, 0.12, 0.14, 0.02, 0, 0.5, ch.r[2] * 0.96 + 0.003, 0.1);
    // капюшон костюма за спиной
    dome(T, cloth, 0.17, 0, 0.77, -0.1, 1.2, 1, 1, -1.8, 0, 0);
    // потёки кислоты по костюму
    for (let k = 0; k < 5; k++) T.limb(std(0x7dff3a, { emissive: 0x3fb010, ei: 0.6, rough: 0.3 }), [-0.2 + k * 0.1, 0.55 - (k % 2) * 0.1, surfZ(ch, -0.2 + k * 0.1, 0.55) + 0.004], [-0.2 + k * 0.1, 0.3, surfZ(ab, -0.2 + k * 0.1, 0.3) + 0.004], 0.008, 0.004, 4);
  }
  /* --- Громила: броня из листов металла, шипы-наросты, цепи --- */
  if (isBrute) {
    const plateM = std(0x8a5a38, { tex: 'metal', rough: 0.7, metal: 0.55, bump: 1.0, side: THREE.DoubleSide });
    const plateN = std(0x80858a, { tex: 'metal', rough: 0.45, metal: 0.75, bump: 0.8, side: THREE.DoubleSide });
    for (let k = 0; k < 4; k++) {                                                      // изогнутые пластины бронежилета
      const y = 0.3 + k * 0.13, [rx, rz] = ellAt(ch, y, 0.03);
      T.place(new THREE.CylinderGeometry(1, 1, 0.11, 14, 1, true, -1.0, 2.0), k % 2 ? plateM : plateN, 0, y, 0, 0, 0, 0, rx, 1, rz);
      for (const s of [-1, 1]) T.sphere(metal, 0.014, Math.sin(s * 1.0) * rx, y, Math.cos(1.0) * rz, 1, 1, 1, { w: 6, h: 5 });
    }
    for (const s of [-1, 1]) {                                                         // наплечники
      dome(T, s < 0 ? plateM : plateN, 0.19, s * 0.5, 0.8, 0, 1.0, 0.8, 1.0, 0, 0, -s * 0.6);
      for (let k = 0; k < 3; k++) T.cone(rust, 0.03, 0.13, [s * (0.42 + k * 0.06), 0.92 - k * 0.035, 0.02 * (k - 1)], [s * 0.4, 1, 0.1 * (k - 1)], 5);
    }
    // наросты и костные шипы на спине
    for (let k = 0; k < 7; k++) {
      const y = 0.18 + k * 0.1, x = Math.sin(k * 2.1) * 0.12, z = -(k < 3 ? ab : ch).r[2] * 0.92;
      T.cone(bone, 0.04 - k * 0.002, 0.13 + (k % 3) * 0.04, [x, y, z], [x * 2, 0.5, -1], 5);
    }
    T.sphere(flesh, 0.14, 0.15, 0.62, -0.18, 1.1, 1, 0.8, { lump: 0.25 });
    T.sphere(fleshD, 0.08, 0.19, 0.65, -0.26, 1, 1, 0.8, { lump: 0.3 });
    T.sphere(skinD, 0.12, -0.16, 0.45, -0.2, 1, 1.2, 0.8, { lump: 0.3 });
    // широкий пояс с пряжкой
    T.box(rust, 0.14, 0.12, 0.03, 0, 0.07, ellAt(pv, 0.07, 0.02)[1]);
    // цепь, свисающая с пояса
    const cg = new THREE.Group(); cg.position.set(0.3 * tw, 0.02, 0.1); upper.add(cg);
    const cp = new Part(cg); for (let k = 0; k < 6; k++) cp.torus(metal, 0.032, 0.009, 0, -0.04 - k * 0.055, 0, k % 2 ? 0 : Math.PI / 2, k % 2 ? Math.PI / 2 : 0, 0, 1, 1.3, 1);
    cp.flush(); dangles.push({ g: cg, k: 1.2, ph: 0.4 });
  }
  /* --- Подрывник: стянутая ремнями рубаха --- */
  if (isBloat) {
    T.sphere(clothD, 0.14 * tw, 0, 0.74, -0.02, 1.3, 0.45, 1, { lump: 0.1 });                // воротник
    T.torus(rust, 1, 0.02, 0, 0.02, 0, Math.PI / 2, 0, 0, 0.27 * tw, 0.2 * td, 1);        // нижний ремень
    const [rx, rz] = ellAt(ch, 0.64, 0.01); T.band(std(0x1d1d1d, { rough: 0.5 }), rx, rz, 0.64, 0.05, 0, 0, 22);
    for (let k = 0; k < 6; k++) {                                                          // лохмотья рубахи по краю живота
      const a = -1.2 + k * 0.48; T.cone(cloth, 0.04, 0.1 + r() * 0.1, [Math.sin(a) * 0.34, 0.2, Math.cos(a) * 0.34 + 0.1], [Math.sin(a) * 0.3, -1, Math.cos(a) * 0.3], 4);
    }
    // ржавый знак опасности на груди
    T.box(rust, 0.12, 0.12, 0.012, -0.14, 0.58, surfZ(ch, -0.14, 0.58) + 0.002, 0, 0, Math.PI / 4);
    T.box(std(0xe0b020, { rough: 0.5, emissive: 0x4a3000, ei: 0.5 }), 0.08, 0.08, 0.008, -0.14, 0.58, surfZ(ch, -0.14, 0.58) + 0.009, 0, 0, Math.PI / 4);
  }
  // спинные позвонки (кроме тех, кто в броне)
  if (isWalk || isSpit) for (let k = 0; k < 5; k++) T.sphere(skinD, 0.024, 0, 0.3 + k * 0.1, -ch.r[2] * 0.96, 1, 1, 1, { w: 6, h: 5 });
  T.flush();

  /* ---------- голова ---------- */
  const head = new THREE.Group(); head.position.set(0, 0.85, 0.06); upper.add(head);
  const H = new Part(head), hd = P.hd;
  const he = { c: [0, 0.17, -0.005], r: [0.125 * hd, 0.14 * hd, 0.135 * hd] };
  H.sphere(isBloat ? skinL : skin, 1, ...he.c, ...he.r, { lump: 0.05, w: 20, h: 14, freq: 3 });
  H.sphere(skin, 1, 0, 0.075, 0.035, 0.1 * hd, 0.085 * hd, 0.095 * hd, { lump: 0.04, w: 14, h: 10 });  // нижняя часть лица
  H.sphere(skinD, 0.045, 0.092 * hd, 0.115, 0.075, 1, 0.8, 1, { w: 8, h: 6 });                          // скулы
  H.sphere(skinD, 0.045, -0.092 * hd, 0.115, 0.075, 1, 0.8, 1, { w: 8, h: 6 });
  for (const s of [-1, 1]) H.box(skinD, 0.07 * hd, 0.02, 0.04, s * 0.062 * hd, 0.2 * hd, 0.105 * hd, -0.2, s * 0.4, s * -0.2); // надбровье
  const eyeP = onEll(he, 0.46, 0.05, 0.89, 0.985);
  for (const s of [-1, 1]) {
    H.sphere(dark, 0.036 * hd, s * eyeP[0], eyeP[1], eyeP[2] - 0.012, 1.1, 0.85, 0.4, { w: 10, h: 8 });  // глазницы
    H.sphere(fleshD, 0.05 * hd, s * eyeP[0], eyeP[1] - 0.045, eyeP[2] - 0.012, 1, 0.45, 0.4, { w: 8, h: 6 }); // мешки под глазами
    ball(head, eyeMat, 0.027 * hd * (isRun ? 1.15 : 1), s * eyeP[0], eyeP[1], eyeP[2] + 0.004, 1.1, 0.8, 0.6, 10, 8);
    // уши
    H.sphere(skinD, 0.05, s * 0.126 * hd, 0.15, -0.005, 0.28, 1, 0.75, { w: 8, h: 6 });
    if (r() < 0.5) H.sphere(fleshD, 0.02, s * 0.13 * hd, 0.16, 0.015, 0.5, 1, 1, { w: 6, h: 5 });
  }
  // нос: обломок с ноздрями
  H.limb(skinD, [0, 0.16, 0.125 * hd], [0, 0.098, 0.15 * hd], 0.02, 0.014, 6);
  H.sphere(skinD, 0.016, 0, 0.092, 0.152 * hd, 1.3, 0.8, 1, { w: 6, h: 5 });
  for (const s of [-1, 1]) H.sphere(dark, 0.006, s * 0.011, 0.088, 0.162 * hd, 1, 1.2, 0.6, { w: 5, h: 4 });
  // пасть: тёмная полость, дёсны, верхние зубы
  H.sphere(dark, 1, 0, 0.044, 0.07 * hd, 0.075 * hd, 0.03, 0.055, { w: 10, h: 6 });
  H.box(flesh, 0.115 * hd, 0.016, 0.035, 0, 0.066, 0.1 * hd);
  teethRow(H, teethM, 0.058, 0.108 * hd, 0.052 * hd, isRun ? 8 : 7, true, isRun ? 1.3 : isBrute ? 1.2 : 1);
  // шрамы и швы
  H.box(fleshD, 0.012, 0.1, 0.004, 0.07 * hd, 0.12, 0.112 * hd, 0, 0, 0.5);
  for (let k = 0; k < 4; k++) H.box(bone, 0.025, 0.004, 0.004, 0.07 * hd + (k - 1.5) * 0.007, 0.095 + k * 0.02, 0.116 * hd, 0, 0, 0.5);
  // вены на висках и лбу
  for (const s of [-1, 1]) H.tube(std(mix(cfg.skin, 0x4a3a7a, 0.5), { rough: 0.6 }), [onEll(he, s * 0.9, 0.1, 0.3, 1.005), onEll(he, s * 0.7, 0.5, 0.5, 1.005), onEll(he, s * 0.4, 0.85, 0.3, 1.005), onEll(he, s * 0.15, 0.97, 0.1, 1.005)], 0.006, 0.003, 8, 4);

  // челюсть (анимируется)
  const jaw = new THREE.Group(); jaw.position.set(0, 0.07, -0.005); head.add(jaw);
  const J = new Part(jaw), jw = P.jw;
  for (const s of [-1, 1]) J.limb(skin, [s * 0.09 * hd, 0.0, 0.0], [s * 0.05 * hd, -0.055, 0.085 * hd * jw], 0.026, 0.022, 7);
  J.sphere(skin, 0.05 * hd, 0, -0.06, 0.08 * hd * jw, 1.35, 0.75, 1.0, { lump: 0.08 });
  J.box(flesh, 0.1 * hd, 0.014, 0.04, 0, -0.012, 0.1 * hd * jw);
  teethRow(J, teethM, -0.014, 0.103 * hd * jw, 0.048 * hd, isRun ? 7 : 6, false, isRun ? 1.4 : isBrute ? 1.3 : 1);
  J.limb(flesh, [0, -0.025, 0.01], [0, -0.012, 0.085 * hd], 0.022, 0.016, 6);                              // язык
  if (isRun) J.cone(teethM, 0.012, 0.05, [0.03, -0.014, 0.115], [0.2, 1, 0.3], 4);
  J.flush();

  let mouth = null, sacs = null, sacMat = null;
  /* --- детали голов --- */
  if (isWalk) {
    if (Math.random() < 0.4) {
      const hat = std(0xc9a227, { rough: 0.32, metal: 0.25, tex: 'metal', bump: 0.3 });
      dome(H, hat, 0.155, 0, 0.22, 0, 1.0, 0.95, 1.12);
      H.band(hat, 0.158, 0.17, 0.222, 0.016, 0, 0.01, 20);
      H.box(hat, 0.2, 0.012, 0.08, 0, 0.226, 0.17, 0.15);
      H.limb(hat, [0, 0.36, -0.12], [0, 0.37, 0.12], 0.016, 0.016, 5);
      H.box(dark, 0.07, 0.06, 0.04, 0, 0.3, 0.16);
      ball(head, new THREE.MeshBasicMaterial({ color: 0xffeaa0 }), 0.023, 0, 0.3, 0.182, 1, 1, 0.5, 8, 6);
    } else {
      const hair = std(0x24201c, { rough: 1 });
      for (let k = 0; k < 24; k++) {
        const a = r() * 6.283, el = 0.2 + r() * 0.8;
        const d = [Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)];
        if (d[2] > 0.5 && d[1] < 0.8) continue;
        H.cone(hair, 0.014, 0.04 + r() * 0.04, onEll(he, d[0], d[1], d[2], 0.97), [d[0], d[1] + 0.5, d[2]], 4);
      }
    }
  }
  if (isRun) {
    H.sphere(flesh, 0.05, 0.08, 0.26, 0.04, 1, 0.5, 1, { lump: 0.3 });                     // облезшая кожа на голове
    H.sphere(bone, 0.03, 0.08, 0.27, 0.045, 1, 0.4, 1, { lump: 0.2 });
    // торчащие жилы шеи
    H.tube(skinL, [[-0.05, -0.04, 0.0], [-0.07, 0.0, 0.06], [-0.04, 0.05, 0.1]], 0.012, 0.007, 6, 4);
    H.tube(skinL, [[0.05, -0.04, 0.0], [0.07, 0.0, 0.06], [0.04, 0.05, 0.1]], 0.012, 0.007, 6, 4);
  }
  if (isSpit) {
    sacMat = std(0x5fc02a, { rough: 0.25, emissive: 0x3aa812, ei: 0.9, opacity: 0.92 });
    mouth = ball(head, new THREE.MeshBasicMaterial({ color: 0xaaff55 }), 0.055, 0, 0.045, 0.1, 1.3, 0.45, 0.55, 10, 8);
    const throat = ball(head, sacMat, 0.1, 0, -0.05, 0.06, 1, 1.1, 1.0, 14, 10);
    sacs = [throat];
    // потёки кислоты из пасти
    const acid = std(0x9dff55, { emissive: 0x58d020, ei: 1.0, rough: 0.2 });
    for (const x of [-0.03, 0.0, 0.035]) H.limb(acid, [x, 0.06, 0.125], [x, -0.1, 0.12 + Math.abs(x)], 0.008, 0.004, 4), H.sphere(acid, 0.011, x, -0.105, 0.12 + Math.abs(x), 1, 1.4, 1, { w: 6, h: 5 });
    // разъеденная кожа вокруг рта
    H.sphere(dark, 0.025, -0.07, 0.07, 0.1, 1, 1, 0.5, { w: 8, h: 6 });
    H.sphere(std(0xb8ff60, { emissive: 0x58d020, ei: 0.8 }), 0.018, 0.075, 0.09, 0.1, 1, 1, 0.6, { w: 6, h: 5 });
    // обрывок маски
    H.torus(leather, 0.125, 0.008, 0, 0.13, 0.0, 0, 0, 0, 1, 1.0, 1);
  }
  if (isBloat) {
    for (const s of [-1, 1]) H.sphere(skinL, 0.07, s * 0.075, 0.07, 0.07, 1, 0.9, 1, { lump: 0.1 });    // раздутые щёки
    H.sphere(skinL, 0.1, 0, -0.02, 0.0, 1.2, 0.6, 1, { lump: 0.1 });                                     // двойной подбородок
    // гнойные волдыри на голове
    for (let k = 0; k < 5; k++) { const d = onEll(he, Math.sin(k * 2.2), 0.4 + k * 0.1, Math.cos(k * 2.2) * 0.9, 1.0); H.sphere(std(0xd9b36a, { emissive: 0xff7a20, ei: 0.6, rough: 0.3 }), 0.02 + (k % 2) * 0.01, d[0], d[1], d[2], 1, 1, 1, { w: 8, h: 6 }); }
    H.sphere(fleshD, 0.025, 0, 0.0, 0.1, 1.6, 1, 0.7, { w: 8, h: 6 });                                   // рвота у рта
  }
  if (isBrute) {
    for (const s of [-1, 1]) H.box(skinD, 0.09 * hd, 0.035, 0.06, s * 0.062 * hd, 0.21 * hd, 0.105 * hd, -0.3, s * 0.4, s * -0.2); // тяжёлая надбровная дуга
    // клыки (бивни) из нижней челюсти
    const J2 = new Part(jaw);
    for (const s of [-1, 1]) { J2.cone(bone, 0.022, 0.12, [s * 0.04, -0.05, 0.1], [s * 0.1, 1, 0.3], 6); J2.cone(bone, 0.012, 0.06, [s * 0.065, -0.05, 0.095], [s * 0.2, 1, 0.2], 5); }
    J2.flush();
    // металлическая пластина, вживлённая в череп
    H.box(rust, 0.09, 0.1, 0.02, 0.1 * hd, 0.25, -0.03, 0.2, 0.2, -0.5);
    for (const [x, y] of [[0.08, 0.28], [0.13, 0.22]]) H.sphere(metal, 0.01, x * hd + 0.015, y, -0.015, 1, 1, 1, { w: 5, h: 4 });
    // шея с ошейником
    H.torus(rust, 0.085, 0.022, 0, -0.02, 0.0, Math.PI / 2, 0, 0, 1, 1, 1);
    H.box(metal, 0.04, 0.04, 0.02, 0, -0.02, 0.09);
    H.torus(metal, 0.02, 0.006, 0.12 * hd, 0.12, 0.0, 0, Math.PI / 2, 0);                                  // серьга
    // редкая щетина / шрамы
    for (let k = 0; k < 3; k++) H.box(fleshD, 0.01, 0.07, 0.004, -0.05 - k * 0.012, 0.13, 0.12 * hd, 0, 0, 0.3);
  }
  H.flush();

  /* ---------- руки ---------- */
  const mkArm = s => {
    const a = new THREE.Group(); a.position.set(s * P.sx, 0.68, 0); upper.add(a);
    const p = new Part(a);
    const sleeve = isRun ? skinD : (isSpit ? std(0x5a6e3c, { tex: 'cloth', rough: 0.45, metal: 0.05, bump: 0.5 }) : (isBrute ? skinD : cloth));
    const L1 = 0.36 * A, L2 = 0.4 * A;
    p.limb(sleeve, [0, 0.02, 0], [0, -L1, 0], 0.092 * lb, 0.07 * lb, 10);
    p.sphere(sleeve, 0.065 * lb, 0, -L1, 0, 1, 1, 1, { lump: 0.05 });
    if (isBrute) {
      p.sphere(skinD, 0.13 * lb / 1.4, s * 0.02, -0.12, 0.03, 1, 1.5, 1.1, { lump: 0.12 });                    // бицепс
      p.sphere(flesh, 0.05, s * 0.07, -0.2, 0.05, 1, 1.3, 0.4, { lump: 0.2 });
      for (let k = 0; k < 2; k++) p.cone(bone, 0.025, 0.09, [s * 0.06, -0.08 - k * 0.1, -0.04], [s * 0.8, 0.2, -0.5], 5);
    } else if (isRun) {
      p.tube(skinL, [[0.0, -0.02, 0.06], [0.01, -0.15, 0.065], [0.0, -0.3, 0.06]], 0.012, 0.01, 8, 4);          // жилы
      p.sphere(flesh, 0.03, 0, -0.12, 0.055, 1, 1.4, 0.4, { lump: 0.2 });
    } else {
      for (let k = 0; k < 6; k++) {                                                                              // рваный рукав
        const an = k / 6 * 6.283; p.cone(sleeve, 0.03, 0.06 + r() * 0.08, [Math.sin(an) * 0.075 * lb, -L1 * 0.8, Math.cos(an) * 0.075 * lb], [Math.sin(an) * 0.3, -1, Math.cos(an) * 0.3], 4);
      }
      if (isWalk) p.band(hiviz, 0.078 * lb, 0.078 * lb, -0.14 * A, 0.04, 0, 0, 12);
      if (isSpit) p.sphere(std(0x9cff55, { rough: 0.25, emissive: 0x3fb010, ei: 0.7 }), 0.025, s * 0.04, -0.15, 0.06, 1, 1, 0.8, { w: 8, h: 6 });
    }
    p.flush();
    // предплечье (локоть сгибается)
    const f = new THREE.Group(); f.position.set(0, -L1, 0); a.add(f);
    const q = new Part(f);
    const fm = isSpit ? std(0x5a6e3c, { tex: 'cloth', rough: 0.45, metal: 0.05, bump: 0.5 }) : skin;
    q.limb(isBrute ? skinD : skin, [0, 0, 0], [0, -L2, 0.012], 0.062 * lb, 0.044 * lb, 9);
    q.sphere(skin, 0.045 * lb, 0, -L2, 0.012, 1, 0.8, 1, { w: 8, h: 6 });
    if (isRun) {
      q.tube(skinL, [[0.0, -0.02, 0.05], [0.01, -0.2, 0.04], [0.0, -0.38, 0.035]], 0.01, 0.007, 8, 4);
      // бинты
      for (let k = 0; k < 4; k++) q.band(clothD, 0.05 * lb + k * 0.001, 0.05 * lb, -0.14 - k * 0.035, 0.022, 0, 0, 10);
    } else if (isSpit) {
      q.limb(fm, [0, 0, 0], [0, -L2 * 0.6, 0.006], 0.068 * lb, 0.058 * lb, 9);
      q.torus(std(0x232a1b, { rough: 0.5 }), 0.06 * lb, 0.009, 0, -L2 * 0.6, 0.006, Math.PI / 2, 0, 0);
    } else if (isBrute) {
      // шипованный наруч из металла
      q.limb(rust, [0, -0.12, 0], [0, -L2 * 0.85, 0.01], 0.086 * lb, 0.065 * lb, 10);
      q.torus(metal, 0.08 * lb, 0.012, 0, -0.14, 0, Math.PI / 2, 0, 0); q.torus(metal, 0.066 * lb, 0.012, 0, -L2 * 0.82, 0.01, Math.PI / 2, 0, 0);
      for (let k = 0; k < 5; k++) { const an = k / 5 * 6.283 + 0.4; q.cone(metal, 0.014, 0.07, [Math.sin(an) * 0.082 * lb, -0.2 - (k % 2) * 0.07, Math.cos(an) * 0.082 * lb], [Math.sin(an), 0.1, Math.cos(an)], 5); }
    } else if (isWalk) {
      q.box(std(0x222222, { rough: 0.4, metal: 0.4 }), 0.05, 0.035, 0.05, 0, -0.3 * A, 0.01); q.box(dark, 0.035, 0.002, 0.035, s * 0.0, -0.3 * A, 0.036);
    } else if (isBloat) {
      q.sphere(flesh, 0.03, 0, -0.15, 0.06, 1, 1.2, 0.4, { lump: 0.2 });
    }
    // кисть
    const hY = -L2 - 0.005, hx = lb;
    q.box(isBrute ? skinD : (isRun ? skinD : skin), 0.088 * hx, 0.1, 0.038 * hx, 0, hY - 0.05, 0.012);
    for (let i = 0; i < 4; i++) {
      const x = (-0.033 + i * 0.022) * hx, len = 1 - Math.abs(i - 1.5) * 0.12;
      const cl = isRun ? 1 : isBrute ? 0.8 : 0.5;
      q.limb(skin, [x, hY - 0.095, 0.012], [x, hY - 0.095 - 0.055 * len, 0.03], 0.0125 * hx, 0.011 * hx, 5);
      q.limb(skin, [x, hY - 0.095 - 0.055 * len, 0.03], [x, hY - 0.095 - 0.095 * len, 0.06], 0.011 * hx, 0.009 * hx, 5);
      q.cone(isRun ? bone : nailM, 0.009 * hx, (isRun ? 0.075 : 0.026) * cl * hx + (isBrute ? 0.02 : 0), [x, hY - 0.095 - 0.095 * len, 0.06], [0, -0.45, 0.9], 4);
    }
    q.limb(skin, [-s * 0.04 * hx, hY - 0.03, 0.02], [-s * 0.065 * hx, hY - 0.085, 0.045], 0.014 * hx, 0.011 * hx, 5);
    q.cone(nailM, 0.009 * hx, 0.025, [-s * 0.065 * hx, hY - 0.085, 0.045], [-s * 0.3, -0.5, 0.7], 4);
    if (isRun) { q.band(clothD, 0.048, 0.022, hY - 0.04, 0.02, 0, 0.012, 10); q.band(clothD, 0.048, 0.022, hY - 0.065, 0.02, 0, 0.012, 10); }
    if (isSpit) q.sphere(std(0x9cff55, { emissive: 0x3fb010, ei: 0.8, rough: 0.25 }), 0.016, s * 0.02, hY - 0.03, 0.04, 1, 1, 0.6, { w: 6, h: 5 });
    q.flush();
    return { a, f };
  };
  const AL = mkArm(-1), AR = mkArm(1);
  const armL = AL.a, armR = AR.a;
  upper.children.forEach(o => { o.castShadow = true; });

  g.scale.setScalar(cfg.scale);
  const ud = { legL, legR, armL, armR, upper, head, eyeMat, jaw, foreL: AL.f, foreR: AR.f, dangles };
  g.userData = ud;
  if (sacs) { ud.mouth = mouth; ud.sacMat = sacMat; ud.sacs = sacs; }
  ud.tick = function (m, amp, chase, time) {
    const spit = (m.spitT || 0) > 0, hit = (m.swing || 0) > 0;
    const open = (spit ? 0.75 : hit ? 0.6 : chase ? 0.26 + 0.1 * Math.sin(time * 9 + m.off) : 0.07 + 0.05 * Math.sin(time * 1.6 + m.off)) * (isRun ? 1.3 : 1);
    jaw.rotation.x += (open - jaw.rotation.x) * 0.3;
    const bend = (hit ? 0.2 : spit ? 0.25 : chase ? (isRun ? 0.7 : 0.45) : 0.28);
    ud.foreL.rotation.x = -(bend + Math.sin(m.phase + 1) * 0.18 * amp);
    ud.foreR.rotation.x = -(bend - Math.sin(m.phase + 1) * 0.18 * amp);
    for (const d of dangles) d.g.rotation.x = Math.sin(time * 1.7 + d.ph) * 0.05 * d.k + Math.sin(m.phase * 2 + d.ph) * 0.35 * amp * d.k;
  };
  return g;
}

/* ---------- Подрывник: раздувшееся светящееся брюхо ---------- */
export function decorateBloater(upper, head, ud) {
  const R = 0.44;
  const belly = std(0xb87a3c, { tex: 'skin', rough: 0.4, bump: 1.4, emissive: 0xff4a10, ei: 0.6, opacity: 0.8 });
  const geo = new THREE.SphereGeometry(R, 26, 18); lumpGeo(geo);
  const b = new THREE.Mesh(geo, belly); b.position.set(0, 0.3, 0.13); b.scale.set(1.15, 1, 1.05); b.castShadow = true; upper.add(b);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffa040 });
  const c = ball(upper, coreMat, 0.26, 0, 0.3, 0.2, 1.1, 1, 1, 14, 10);
  // всё, что на брюхе, — дочерние объекты (пульсируют вместе с ним)
  const k = new Part(b);
  const glow = new THREE.MeshBasicMaterial({ color: 0xffd070 });
  const rustM = std(0x6a4026, { tex: 'metal', rough: 0.7, metal: 0.5, bump: 0.8 });
  const boil = std(0xe0b86a, { rough: 0.25, emissive: 0xff7a20, ei: 0.9 });
  const rnd = rng(1234 + ((Math.random() * 1e6) | 0));
  // светящиеся трещины
  for (let n = 0; n < 9; n++) {
    const pts = []; let th = rnd() * 6.283, ph = 0.9 + rnd() * 1.3;
    for (let i = 0; i < 6; i++) { th += (rnd() - 0.5) * 0.7; ph += (rnd() - 0.5) * 0.5; pts.push([Math.sin(ph) * Math.sin(th) * R * 1.012, Math.cos(ph) * R * 1.012, Math.sin(ph) * Math.cos(th) * R * 1.012]); }
    k.tube(glow, pts, 0.006, 0.003, 8, 4);
  }
  // гнойники
  for (let n = 0; n < 9; n++) {
    const th = rnd() * 6.283, ph = 0.7 + rnd() * 1.6, rr = 0.03 + rnd() * 0.045;
    k.sphere(boil, rr, Math.sin(ph) * Math.sin(th) * R * 1.0, Math.cos(ph) * R * 1.0, Math.sin(ph) * Math.cos(th) * R * 1.0, 1, 1, 0.8, { w: 8, h: 6 });
  }
  // стягивающие ремни с пряжками
  for (const y of [-0.12, 0.1]) {
    const rr = Math.sqrt(R * R - y * y) + 0.012;
    k.torus(rustM, rr, 0.017, 0, y, 0, Math.PI / 2, 0, 0, 1, 1, 1);
    k.box(rustM, 0.07, 0.06, 0.03, 0, y, rr + 0.01);
    k.sphere(std(0x9a9a9a, { metal: 0.8, rough: 0.35 }), 0.01, 0.025, y, rr + 0.028, 1, 1, 1, { w: 5, h: 4 });
    k.sphere(std(0x9a9a9a, { metal: 0.8, rough: 0.35 }), 0.01, -0.025, y, rr + 0.028, 1, 1, 1, { w: 5, h: 4 });
  }
  // пупок
  k.sphere(std(0x5a2420, { rough: 0.4 }), 0.04, 0, 0.0, R * 0.98, 1, 1, 0.5, { w: 8, h: 6 });
  k.flush();
  // лёгкие «маячки» — взрывчатка за поясом
  const stick = std(0xb02a20, { rough: 0.6 }), cap = std(0x222222, { rough: 0.4, metal: 0.5 });
  const sp = new Part(upper);
  for (let n = 0; n < 3; n++) {
    const x = -0.28 + n * 0.055, y = 0.0 + (n % 2) * 0.02;
    sp.limb(stick, [x, y - 0.1, 0.34], [x + 0.01, y + 0.06, 0.35], 0.022, 0.022, 8);
    sp.limb(cap, [x + 0.01, y + 0.06, 0.35], [x + 0.012, y + 0.075, 0.352], 0.012, 0.012, 6);
    sp.tube(std(0xd8c070, { rough: 0.9 }), [[x + 0.012, y + 0.075, 0.352], [x + 0.03, y + 0.11, 0.35], [x + 0.04, y + 0.15, 0.33]], 0.004, 0.003, 6, 4);
  }
  sp.flush();
  ud.belly = belly; ud.core = c; ud.bellyMesh = b;
}
function lumpGeo(geo) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const l = v.length();
    v.multiplyScalar(1 + 0.03 * (noise3(v.x / l * 4, v.y / l * 4, v.z / l * 4) * 2 - 1)); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
}

/* ---------- Кислотник: светящиеся мешки, трубки, шипы ---------- */
export function decorateSpitter(upper, head, ud) {
  const sac = ud.sacMat;
  const inner = new THREE.MeshBasicMaterial({ color: 0xc8ff80, transparent: true, opacity: 0.55 });
  const vein = std(0x2c6a10, { rough: 0.5 });
  const mkSac = (rr, x, y, z) => {
    const m = ball(upper, sac, rr, x, y, z, 1, 1.2, 1, 16, 12);
    ball(m, inner, rr * 0.55, 0, 0.05 * rr, 0.1 * rr, 1, 1, 1, 10, 8);
    const kp = new Part(m);
    for (let n = 0; n < 5; n++) { const a = n * 1.26; kp.tube(vein, [[Math.sin(a) * rr * 0.4, rr * 1.1, Math.cos(a) * rr * 0.4], [Math.sin(a + 0.4) * rr * 0.95, rr * 0.3, Math.cos(a + 0.4) * rr * 0.95], [Math.sin(a + 0.6) * rr * 0.9, -rr * 0.7, Math.cos(a + 0.6) * rr * 0.9]], rr * 0.03, rr * 0.015, 6, 4); }
    for (let n = 0; n < 4; n++) kp.sphere(inner, rr * 0.12, Math.sin(n * 1.9) * rr * 0.4, (n - 1.5) * rr * 0.3, Math.cos(n * 1.9) * rr * 0.4, 1, 1, 1, { w: 6, h: 5 });
    kp.flush(); return m;
  };
  const s1 = mkSac(0.17, -0.3, 0.62, -0.14), s2 = mkSac(0.14, 0.3, 0.56, -0.15), s3 = mkSac(0.1, -0.12, 0.3, -0.24);
  // трубки от мешков к горлу
  const tb = new Part(upper), glowT = std(0x3a8a1a, { rough: 0.4, emissive: 0x2a9a10, ei: 0.5 });
  tb.tube(glowT, [[-0.3, 0.72, -0.12], [-0.22, 0.86, -0.04], [-0.07, 0.84, 0.05], [-0.04, 0.9, 0.09]], 0.022, 0.014, 10, 6);
  tb.tube(glowT, [[0.3, 0.64, -0.13], [0.22, 0.84, -0.05], [0.07, 0.84, 0.05], [0.04, 0.9, 0.09]], 0.02, 0.014, 10, 6);
  // шипы-наросты на спине
  const bone = std(0xcfd8b0, { rough: 0.5 });
  for (let k = 0; k < 6; k++) tb.cone(bone, 0.022, 0.1, [Math.sin(k * 2.3) * 0.12, 0.28 + k * 0.08, -0.17], [Math.sin(k * 2.3) * 0.5, 0.3, -1], 5);
  tb.flush();
  ud.sacs = [s1, s2, s3, ...ud.sacs];
}
