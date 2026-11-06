// @ts-nocheck
// Модели монстров: паук-мутант и крыса-мутант (люди-монстры — в humanModels.ts).
// «Лицо» у всех смотрит в +Z, eyeMat нужен для затухания глаз после смерти.
import * as THREE from 'three';
import { Part, std, dim, ball, onEll, rng } from './modelKit';

export { buildHuman, decorateBloater, decorateSpitter } from './humanModels';

/* ---------------- ПАУК-МУТАНТ ---------------- */
export function buildSpider(cfg) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ';
  const r = rng((Math.random() * 1e9) | 0);
  const H = 0.55;
  const rig = new THREE.Group(); rig.position.y = H; g.add(rig);
  const chitin = std(0x2a2334, { tex: 'chitin', rough: 0.32, metal: 0.3, bump: 1.0 });
  const plate = std(0x4a3a5c, { tex: 'chitin', rough: 0.36, metal: 0.25, bump: 1.0 });
  const legM = std(0x38303f, { tex: 'chitin', rough: 0.45, metal: 0.2, bump: 0.9 });
  const bristle = std(0x5a4632, { rough: 1 });
  const bone = std(0xe0d8bc, { rough: 0.4 });
  const flesh = std(0x8a1c1c, { tex: 'skin', rough: 0.3, emissive: 0x500808, ei: 0.8 });
  const blood = std(0xc41414, { emissive: 0xc01010, ei: 1.0, rough: 0.3 });
  const venom = std(0xc8ff50, { emissive: 0x70c010, ei: 1.2, rough: 0.2 });
  const dark = std(0x050405, { rough: 1 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3030 });

  const B = new Part(rig);
  // головогрудь с панцирем и гребнем
  B.sphere(chitin, 0.3, 0, 0, 0.1, 1, 0.8, 1.1, { lump: 0.04, w: 18, h: 12 });
  B.sphere(plate, 0.25, 0, 0.11, 0.1, 0.92, 0.5, 1.05, { lump: 0.05, w: 16, h: 10 });
  for (let k = 0; k < 6; k++) B.cone(bone, 0.025 - k * 0.002, 0.1 - k * 0.008, [0, 0.2 - k * 0.015, 0.3 - k * 0.1], [0, 1, -0.3], 5);
  // голова
  B.sphere(plate, 0.2, 0, -0.02, 0.42, 1, 0.85, 1, { lump: 0.05, w: 16, h: 12 });
  B.sphere(chitin, 0.12, 0, -0.1, 0.5, 1.2, 0.7, 1);                       // лицевая пластина
  // глаза: 2 больших + 6 малых
  const eyes = [[-0.07, 0.07, 0.6, 0.05], [0.07, 0.07, 0.6, 0.05], [-0.12, 0.13, 0.55, 0.028], [0.12, 0.13, 0.55, 0.028], [-0.15, 0.06, 0.52, 0.022], [0.15, 0.06, 0.52, 0.022], [-0.04, 0.16, 0.55, 0.026], [0.04, 0.16, 0.55, 0.026]];
  for (const [x, y, z, rr] of eyes) { B.sphere(dark, rr * 1.35, x, y, z - 0.012, 1, 1, 0.8, { w: 8, h: 6 }); ball(rig, eyeMat, rr, x, y, z + 0.004, 1, 1, 0.9, 10, 8); }
  for (const s of [-1, 1]) {
    // хелицеры, клыки, капли яда
    B.limb(plate, [s * 0.07, -0.03, 0.54], [s * 0.075, -0.13, 0.64], 0.055, 0.042, 8);
    B.sphere(plate, 0.05, s * 0.075, -0.14, 0.64, 1, 1.2, 1, { w: 8, h: 6 });
    B.limb(bone, [s * 0.07, -0.17, 0.65], [s * 0.04, -0.3, 0.7], 0.034, 0.008, 6);
    B.sphere(venom, 0.014, s * 0.04, -0.33, 0.7, 1, 1.5, 1, { w: 6, h: 5 });
    B.limb(bone, [s * 0.085, -0.15, 0.66], [s * 0.12, -0.24, 0.7], 0.02, 0.006, 5);
    // педипальпы
    B.limb(legM, [s * 0.12, -0.04, 0.5], [s * 0.19, -0.04, 0.68], 0.028, 0.024, 6);
    B.limb(legM, [s * 0.19, -0.04, 0.68], [s * 0.15, -0.14, 0.82], 0.024, 0.014, 6);
    B.sphere(plate, 0.03, s * 0.15, -0.14, 0.82, 1, 1, 1.3, { w: 7, h: 5 });
    for (let k = 0; k < 5; k++) B.cone(bristle, 0.006, 0.05, [s * (0.15 + k * 0.008), -0.04 - k * 0.02, 0.7 + k * 0.025], [s, 0.2, 0.3], 3);
    // нарост-шип у основания ног
    B.cone(bone, 0.022, 0.1, [s * 0.18, 0.12, 0.25], [s * 0.6, 1, 0], 5);
  }
  // щетина на головогруди
  for (let k = 0; k < 50; k++) {
    const d = [r() * 2 - 1, 0.1 + r() * 0.9, r() * 2 - 1]; const p = onEll({ c: [0, 0, 0.1], r: [0.3, 0.24, 0.33] }, d[0], d[1], d[2], 0.97);
    B.cone(bristle, 0.008, 0.06 + r() * 0.04, p, [d[0], d[1] + 0.2, d[2] - 0.2], 3);
  }
  B.flush();

  // брюшко (отдельная группа — «дышит»)
  const abd = new THREE.Group(); abd.position.set(0, 0.1, -0.56); rig.add(abd);
  const Ab = new Part(abd);
  const abE = { c: [0, 0, 0], r: [0.44, 0.39, 0.58] };
  Ab.sphere(chitin, 1, 0, 0, 0, ...abE.r, { lump: 0.06, w: 24, h: 16, freq: 2.5 });
  // «песочные часы» на спине (кровавые) + узор из бугров
  Ab.sphere(blood, 0.1, 0, 0.382, 0.2, 0.9, 0.22, 1.3, { w: 10, h: 6 });
  Ab.sphere(blood, 0.08, 0, 0.385, -0.14, 0.9, 0.22, 1.1, { w: 10, h: 6 });
  Ab.sphere(blood, 0.04, 0, 0.395, 0.03, 0.9, 0.2, 1.8, { w: 8, h: 5 });
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2;
    Ab.sphere(plate, 0.07, Math.cos(a) * 0.37, 0.02 + Math.sin(a) * 0.28, -0.05 + (k % 2) * 0.16, 1, 1, 1, { w: 8, h: 6 });
  }
  for (let k = 0; k < 4; k++) Ab.cone(bone, 0.025, 0.09, [Math.sin(k * 1.9) * 0.28, 0.3 + (k % 2) * 0.03, -0.25 - k * 0.07], [0, 1, -0.3], 5); // шипы
  // открытая рана с мясом и светящиеся гнойники
  Ab.sphere(flesh, 0.1, 0.36, 0.1, 0.05, 0.35, 1, 1.4, { lump: 0.25 });
  Ab.sphere(dark, 0.05, 0.38, 0.1, 0.08, 0.25, 1, 1.2, { lump: 0.3 });
  for (const [x, y, z] of [[-0.35, 0.12, 0.2], [-0.3, 0.2, -0.3], [0.2, 0.3, -0.35]]) Ab.sphere(venom, 0.04, x, y, z, 1, 1, 1, { w: 8, h: 6 });
  // жёсткая щетина
  for (let k = 0; k < 90; k++) {
    const d = [r() * 2 - 1, r() * 1.4 - 0.4, r() * 2 - 1];
    Ab.cone(bristle, 0.009, 0.07 + r() * 0.05, onEll(abE, d[0], d[1], d[2], 0.98), [d[0], d[1] + 0.1, d[2] - 0.3], 3);
  }
  // прядильные бородавки и паутина
  for (const s of [-1, 1]) { Ab.limb(plate, [s * 0.06, -0.08, -0.54], [s * 0.05, -0.12, -0.7], 0.05, 0.03, 7); Ab.sphere(chitin, 0.03, s * 0.05, -0.12, -0.7, 1, 1, 1.3, { w: 6, h: 5 }); }
  Ab.tube(std(0xcfd0d0, { rough: 0.9 }), [[0, -0.12, -0.7], [0.03, -0.3, -0.76], [-0.02, -0.5, -0.74]], 0.006, 0.002, 8, 4);
  Ab.flush();

  // 8 ног: бедро → колено → голень → лапка с когтями
  const legs = [], ang = [-0.78, -0.28, 0.24, 0.72];
  for (const s of [1, -1]) for (let i = 0; i < 4; i++) {
    const lg = new THREE.Group(); lg.position.set(0, 0, 0.3 - i * 0.2); lg.scale.x = s;
    const rc = i === 1 || i === 2 ? 1 : 0.9, Pn = new Part(lg);
    const knee = [0.5 * rc, 0.4, 0], mid = [0.82 * rc, 0.12, 0], tip = [1.02 * rc, -H + 0.02, 0];
    Pn.sphere(plate, 0.085, 0.07, 0, 0, 1, 0.9, 1, { w: 10, h: 8 });                   // кокса
    Pn.limb(legM, [0.1, 0, 0], knee, 0.062, 0.05, 9);
    Pn.sphere(plate, 0.062, knee[0], knee[1], 0, 1, 1, 1, { lump: 0.05, w: 10, h: 8 });
    Pn.cone(bone, 0.018, 0.08, [knee[0], knee[1] + 0.04, 0], [0.1, 1, 0], 5);          // шип на колене
    Pn.limb(legM, knee, mid, 0.05, 0.04, 8);
    Pn.sphere(plate, 0.045, mid[0], mid[1], 0, 1, 1, 1, { w: 8, h: 6 });
    Pn.limb(legM, mid, tip, 0.04, 0.011, 7);
    Pn.cone(std(0x120f14, { rough: 0.3, metal: 0.4 }), 0.012, 0.055, tip, [0.35, -1, 0], 4);
    Pn.cone(std(0x120f14, { rough: 0.3, metal: 0.4 }), 0.009, 0.04, tip, [-0.2, -1, 0.3], 4);
    for (let k = 0; k < 18; k++) {                                                    // щетинки вдоль сегментов
      const seg = k < 6 ? [[0.1, 0, 0], knee] : k < 12 ? [knee, mid] : [mid, tip];
      const t = r(), p = seg[0].map((v, n) => v + (seg[1][n] - v) * t), an = r() * 6.283;
      Pn.cone(bristle, 0.007, 0.055 + r() * 0.04, p, [Math.cos(an) * 0.6, 0.5 + (r() - 0.5), Math.sin(an) * 0.9], 3);
    }
    Pn.flush(); rig.add(lg);
    legs.push({ g: lg, ang: ang[i], ph: ((i % 2) * Math.PI) + (s > 0 ? 0 : Math.PI), i });
    lg.rotation.y = ang[i];
  }
  g.scale.setScalar(cfg.scale);
  g.userData = {
    eyeMat, rig, legs, abd, kind: 'spider',
    anim(m, amp, chase, time) {
      const sp = chase ? 1.7 : 1;
      for (const l of legs) {
        const ph = m.phase * 1.7 * sp + l.ph;
        l.g.rotation.y = l.ang + Math.sin(ph) * 0.34 * amp;
        l.g.rotation.z = Math.max(0, Math.cos(ph)) * 0.5 * amp + Math.sin(time * 2.2 + l.i + l.ph) * 0.025 + (chase ? 0.06 : 0);
      }
      rig.position.y = H + Math.sin(time * (chase ? 12 : 2.5) + m.off) * 0.012 * (1 + amp);
      rig.rotation.x = m.leap > 0 ? -0.55 : (chase ? 0.05 : 0);
      abd.scale.set(1, 1 + Math.sin(time * 3 + m.off) * 0.035, 1 + Math.sin(time * 3 + m.off + 1) * 0.02);
    },
    die(f) {
      rig.rotation.z = f * Math.PI; rig.position.y = H - f * 0.14;
      for (const l of legs) { l.g.rotation.z = -f * 0.7; l.g.rotation.y = l.ang * (1 - f * 0.5); }
    }
  };
  return g;
}

/* ---------------- КРЫСА-МУТАНТ ---------------- */
export function buildRat(cfg) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ';
  const r = rng((Math.random() * 1e9) | 0);
  const H = 0.17;
  const rig = new THREE.Group(); rig.position.y = H; g.add(rig);
  const tone = [0x6a574a, 0x544338, 0x77685a][(r() * 3) | 0];
  const fur = std(tone, { tex: 'fur', rough: 0.95, bump: 1.2 });
  const fur2 = std(dim(tone, 0.68), { tex: 'fur', rough: 0.95, bump: 1.2 });
  const tuft = std(dim(tone, 0.8), { rough: 1 });
  const pink = std(0xc98a8a, { tex: 'skin', rough: 0.6, bump: 1.0 });
  const bone = std(0xe8e2cc, { rough: 0.5 });
  const teeth = std(0xd8c780, { rough: 0.4 });
  const claw = std(0x1d1814, { rough: 0.4 });
  const flesh = std(0x7a1f22, { tex: 'skin', rough: 0.3, emissive: 0x300606, ei: 0.8 });
  const pus = std(0x9aff4a, { rough: 0.2, emissive: 0x58c010, ei: 1.1 });
  const dark = std(0x050404, { rough: 1 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3a2a });

  const B = new Part(rig);
  const bodyE = { c: [0, 0, 0.02], r: [0.126, 0.115, 0.24] }, rumpE = { c: [0, 0.015, -0.17], r: [0.124, 0.116, 0.143] };
  B.sphere(fur, 1, ...bodyE.c, ...bodyE.r, { lump: 0.05, w: 18, h: 12 });
  B.sphere(fur2, 1, ...rumpE.c, ...rumpE.r, { lump: 0.06, w: 16, h: 10 });
  B.sphere(fur, 0.1, 0, 0.04, 0.14, 1, 0.9, 1, { lump: 0.1 });                         // горб на плечах
  // голова: морда, нос, уши, глаза, усы, резцы
  B.sphere(fur, 0.095, 0, -0.01, 0.3, 0.9, 0.85, 1.3, { lump: 0.04, w: 16, h: 12 });
  B.cone(fur, 0.062, 0.17, [0, -0.025, 0.34], [0, -0.06, 1], 10);
  B.sphere(pink, 0.024, 0, -0.03, 0.51, 1, 0.9, 1, { w: 10, h: 8 });
  for (const s of [-1, 1]) {
    B.sphere(pink, 0.052, s * 0.067, 0.078, 0.24, 1, 1, 0.22, { w: 10, h: 8, ry: s * 0.4 });     // уши
    B.sphere(fur2, 0.05, s * 0.067, 0.078, 0.232, 1.05, 1.05, 0.2, { w: 10, h: 8, ry: s * 0.4 });
    B.sphere(dark, 0.028, s * 0.048, 0.03, 0.355, 1, 1, 0.7, { w: 8, h: 6 });
    ball(rig, eyeMat, 0.021, s * 0.05, 0.031, 0.363, 1, 1, 0.8, 9, 7);
    B.cone(teeth, 0.009, 0.05, [s * 0.014, -0.045, 0.47], [0, -1, 0.15], 5);                 // верхние резцы
    B.cone(teeth, 0.007, 0.032, [s * 0.012, -0.075, 0.44], [0, 1, 0.1], 4);                  // нижние
    B.cone(teeth, 0.006, 0.026, [s * 0.04, -0.045, 0.4], [0, -1, 0.1], 4);                   // клык
    for (let k = 0; k < 4; k++) B.limb(bone, [s * 0.03, -0.035 - k * 0.006, 0.45], [s * (0.12 + k * 0.01), -0.02 + (k - 1.5) * 0.03, 0.42 - k * 0.03], 0.002, 0.0008, 3); // усы
  }
  // рваное ухо
  B.sphere(dark, 0.012, 0.075, 0.1, 0.236, 1, 1, 1, { w: 6, h: 5 });
  // позвоночник выпирает, плешь, раны
  for (let k = 0; k < 7; k++) { const z = 0.2 - k * 0.07; B.cone(bone, 0.013, 0.03 + (k % 2) * 0.01, [0, 0.1 + (k < 3 ? 0.03 : 0), z], [0, 1, -0.4], 4); }
  B.sphere(pink, 0.06, -0.08, 0.04, -0.12, 0.5, 1, 1.3, { lump: 0.2 });
  B.sphere(pink, 0.05, 0.08, 0.0, 0.05, 0.5, 1, 1.2, { lump: 0.2 });
  B.sphere(flesh, 0.035, 0.1, 0.06, -0.2, 0.45, 1, 1.1, { lump: 0.25 });
  // светящийся мутантный нарост
  B.sphere(pus, 0.05, 0.03, 0.115, -0.06, 1, 0.9, 1, { w: 10, h: 8 });
  B.sphere(pus, 0.03, -0.04, 0.11, -0.01, 1, 1, 1, { w: 8, h: 6 });
  B.tube(std(0x3a6a18, { rough: 0.5 }), [[0.0, 0.1, -0.1], [0.02, 0.13, -0.06], [0.03, 0.15, -0.03]], 0.008, 0.004, 6, 4);
  // клочья шерсти
  for (let k = 0; k < 130; k++) {
    const e = k % 3 === 0 ? rumpE : bodyE, d = [r() * 2 - 1, r() * 1.6 - 0.5, r() * 2 - 1];
    B.cone(tuft, 0.01, 0.045 + r() * 0.04, onEll(e, d[0], d[1], d[2], 0.97), [d[0], d[1] + 0.25, d[2] - 0.7], 3);
  }
  B.flush();

  // хвост из звеньев — гнётся волной
  const tails = [];
  let par = rig, px = 0, py = -0.02, pz = -0.28;
  for (let i = 0; i < 4; i++) {
    const tg = new THREE.Group(); tg.position.set(px, py, pz); par.add(tg);
    const L = 0.12, r1 = 0.026 - i * 0.005, r2 = 0.021 - i * 0.005, tp = new Part(tg);
    tp.limb(pink, [0, 0, 0], [0, 0, -L], r1, r2, 7);
    tp.sphere(pink, r2 * 1.05, 0, 0, -L, 1, 1, 1, { w: 7, h: 5 });
    for (let k = 0; k < 4; k++) tp.torus(pink, r1 * 0.95 + (r2 - r1) * (k / 4), 0.0035, 0, 0, -L * (0.12 + k * 0.24), 0, 0, 0);
    if (i === 3) tp.cone(pink, 0.014, 0.1, [0, 0, -L], [0, 0, -1], 6);
    tp.flush();
    tails.push(tg); par = tg; px = 0; py = 0; pz = -L;
  }
  // лапы: бедро → голень → стопа с пальцами и когтями
  const legs = [];
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const lg = new THREE.Group(); lg.position.set(x * 0.09, -0.05, z * 0.15 + 0.05); rig.add(lg);
    const p = new Part(lg), rear = z < 0;
    p.sphere(fur2, rear ? 0.062 : 0.05, x * 0.012, -0.005, rear ? -0.015 : 0, 1, 1.2, 1.2, { w: 8, h: 6 });
    p.limb(fur2, [0, 0, 0], [0, -0.07, rear ? -0.025 : 0.0], 0.034, 0.024, 6);
    p.limb(pink, [0, -0.07, rear ? -0.025 : 0], [0, -0.125, rear ? 0.0 : 0.01], 0.022, 0.017, 6);
    p.box(pink, 0.04, 0.018, 0.07, 0, -0.128, 0.03);
    for (let k = -1; k <= 1; k++) { p.limb(pink, [k * 0.014, -0.128, 0.05], [k * 0.016, -0.13, 0.085], 0.008, 0.006, 4); p.cone(claw, 0.005, 0.02, [k * 0.016, -0.13, 0.085], [k * 0.1, -0.2, 1], 3); }
    p.flush(); legs.push({ g: lg, ph: (x * z > 0 ? 0 : Math.PI) });
  }
  g.scale.setScalar(cfg.scale);
  g.userData = {
    eyeMat, rig, legs, kind: 'rat',
    anim(m, amp, chase, time) {
      for (const l of legs) l.g.rotation.x = Math.sin(m.phase * 2.4 + l.ph) * 1.0 * amp;
      rig.position.y = H + Math.abs(Math.sin(m.phase * 2.4)) * 0.035 * amp;
      rig.rotation.x = Math.sin(m.phase * 2.4 * 2) * 0.06 * amp;
      rig.rotation.z = chase ? Math.sin(time * 14 + m.off) * 0.03 : 0;
      for (let i = 0; i < tails.length; i++) tails[i].rotation.y = Math.sin(time * 6 + m.off - i * 0.9) * (0.16 + i * 0.05);
    },
    die(f) { rig.rotation.z = f * Math.PI; rig.position.y = H - f * 0.04; for (const l of legs) l.g.rotation.x = f * 0.5; }
  };
  return g;
}
