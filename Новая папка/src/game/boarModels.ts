// @ts-nocheck
// Пещерный свин: две процедурные модели.
//  • молодой («Подсвинок») — полосатая шёрстка, большая голова, крупные уши, клыки-зачатки, завитой хвост;
//  • матёрый («Секач») — тёмная щетинистая грива, каменная корка на плечах, длинные изогнутые клыки,
//    шрамы и светящиеся пещерные грибы на спине.
// «Лицо» смотрит в +Z; eyeMat нужен игре для затухания глаз после смерти.
import * as THREE from 'three';
import { Part, std, dim, ball, onEll, rng } from './modelKit';

export function buildBoar(cfg, variant = 'young') {
  const mature = variant === 'mature';
  const g = new THREE.Group(); g.rotation.order = 'YXZ';
  const r = rng((Math.random() * 1e9) | 0);
  const sc = mature ? 1 : 0.7, H0 = 0.5, H = H0 * sc;
  const rig = new THREE.Group(); rig.position.y = H; rig.scale.setScalar(sc); g.add(rig);

  /* ---------- палитра ---------- */
  const tone = mature ? [0x3d342e, 0x4b3a2e, 0x302d2d][(r() * 3) | 0] : [0xbb9166, 0xc49a6c, 0xae8660][(r() * 3) | 0];
  const fur = std(tone, { tex: 'fur', rough: 0.95, bump: 1.3 });
  const furD = std(dim(tone, mature ? 0.55 : 0.5), { tex: 'fur', rough: 0.95, bump: 1.2 });
  const tuft = std(dim(tone, mature ? 0.42 : 0.62), { rough: 1 });
  const belly = std(mature ? 0x8c7b69 : 0xeed9b4, { tex: 'fur', rough: 1, bump: 0.8 });
  const skin = std(mature ? 0xa98782 : 0xe3aaa3, { tex: 'skin', rough: 0.55, bump: 0.9 });
  const skinD = std(mature ? 0x6c4f4d : 0xb97b78, { tex: 'skin', rough: 0.6, bump: 0.9 });
  const ivory = std(mature ? 0xe3d7a8 : 0xf0e8cc, { rough: 0.35, metal: 0.05 });
  const ivoryD = std(0x9c8a58, { rough: 0.5 });
  const hoof = std(0x1b1512, { rough: 0.4, metal: 0.2 });
  const dark = std(0x060404, { rough: 1 });
  const flesh = std(0x7c2626, { tex: 'skin', rough: 0.3, emissive: 0x2c0606, ei: 0.8 });
  const rock = std(0x6a645b, { rough: 1, metal: 0.05 });
  const rockD = std(0x45413b, { rough: 1 });
  const glow = std(0x6bfff0, { emissive: 0x18c8b0, ei: 1.5, rough: 0.25 });
  const glowB = std(0x4aa8ff, { emissive: 0x1a60d0, ei: 1.3, rough: 0.3 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: mature ? 0xff6a2a : 0xffc24a });

  /* ---------- туловище ---------- */
  const B = new Part(rig);
  const bodyE = mature ? { c: [0, 0, 0], r: [0.31, 0.29, 0.52] } : { c: [0, 0, 0], r: [0.27, 0.26, 0.4] };
  const bz = bodyE.r[2];
  B.sphere(fur, 1, 0, 0, 0, ...bodyE.r, { lump: 0.04, w: 24, h: 16 });
  B.sphere(fur, 1, 0, 0.02, bz * 0.58, bodyE.r[0] * 0.98, bodyE.r[1] * 1.02, bz * 0.5, { lump: 0.06, w: 18, h: 12 });    // плечи
  B.sphere(fur, 1, 0, 0.0, -bz * 0.72, bodyE.r[0] * 0.92, bodyE.r[1] * 0.95, bz * 0.5, { lump: 0.05, w: 18, h: 12 });    // круп
  B.sphere(belly, 1, 0, -bodyE.r[1] * 0.38, 0, bodyE.r[0] * 0.84, bodyE.r[1] * 0.72, bz * 0.92, { lump: 0.03, w: 16, h: 10 });
  if (mature) {
    B.sphere(fur, 1, 0, 0.16, 0.26, 0.26, 0.2, 0.27, { lump: 0.1, w: 16, h: 12 });                                 // горб
    // каменная корка на плечах и спине (пещерная «броня»)
    for (const [x, y, z, rx, ry, rz, ang] of [[0.16, 0.26, 0.3, 0.12, 0.05, 0.14, 0.4], [-0.15, 0.27, 0.22, 0.13, 0.05, 0.13, -0.35], [0.05, 0.31, 0.02, 0.14, 0.05, 0.12, 0.1], [-0.12, 0.27, -0.22, 0.12, 0.045, 0.12, -0.2], [0.14, 0.24, -0.3, 0.1, 0.04, 0.1, 0.3], [0.22, 0.13, 0.42, 0.07, 0.07, 0.06, 0.5]]) {
      B.sphere(rock, 1, x, y, z, rx, ry, rz, { lump: 0.3, freq: 3, w: 10, h: 8, rz: ang });
      B.sphere(rockD, 1, x * 0.9, y - 0.015, z + 0.01, rx * 0.8, ry * 0.8, rz * 0.85, { lump: 0.25, w: 8, h: 6, rz: ang });
    }
    // шрамы
    B.sphere(flesh, 0.04, 0.27, 0.04, 0.1, 0.18, 0.6, 2.6, { lump: 0.2, w: 8, h: 6 });
    B.sphere(flesh, 0.035, -0.27, 0.0, -0.18, 0.18, 0.6, 2.2, { lump: 0.2, w: 8, h: 6 });
    // светящиеся грибы
    for (const [x, y, z, rr, gm] of [[0.1, 0.3, -0.08, 0.04, glow], [0.14, 0.28, -0.14, 0.028, glow], [-0.12, 0.29, -0.3, 0.036, glowB], [0.02, 0.33, -0.42, 0.03, glow], [-0.08, 0.34, 0.1, 0.026, glowB], [-0.2, 0.2, -0.05, 0.03, glow]]) {
      B.cone(skinD, rr * 0.5, rr * 1.6, [x, y - 0.02, z], [x * 0.3, 1, 0.1], 6);
      B.sphere(gm, rr, x * 1.02, y + rr * 1.1, z, 1.3, 0.55, 1.3, { w: 10, h: 6 });
    }
    // грива вдоль хребта
    for (let k = 0; k < 24; k++) {
      const z = 0.62 - k * 0.046, t = Math.max(0.05, 1 - Math.pow(z / 0.58, 2)), top = 0.3 * Math.sqrt(t) + (z > 0.05 && z < 0.5 ? 0.1 : 0.02);
      for (const dx of [-0.03, 0, 0.03]) B.cone(tuft, 0.016, 0.11 + (z > 0.1 ? 0.08 : 0) + r() * 0.04, [dx + (r() - 0.5) * 0.02, top - 0.03, z], [dx * 4, 1, -0.55 - r() * 0.2], 4);
    }
  } else {
    // полосы подсвинка: тёмные продольные пятна по бокам
    for (const [a, w, len, zc] of [[-1.35, 0.05, 0.55, 0.0], [-0.95, 0.045, 0.6, -0.02], [-0.55, 0.04, 0.5, -0.04], [-0.2, 0.034, 0.4, -0.04], [0.2, 0.034, 0.4, -0.04], [0.55, 0.04, 0.5, -0.04], [0.95, 0.045, 0.6, -0.02], [1.35, 0.05, 0.55, 0.0]]) {
      const sgn = Math.sign(a) || 1, aa = Math.abs(a);
      B.sphere(furD, 1, sgn * Math.sin(aa) * bodyE.r[0] * 0.93, Math.cos(aa) * bodyE.r[1] * 0.93, zc, 0.05, w, len * 0.36, { w: 8, h: 6, rz: sgn > 0 ? Math.PI / 2 - aa : Math.PI / 2 + aa });
    }
    // «спинной ремень»
    B.sphere(furD, 1, 0, bodyE.r[1] * 0.9, 0, 0.035, 0.05, 0.3, { w: 8, h: 6 });
  }
  // клочья шерсти по бокам
  for (let k = 0; k < (mature ? 120 : 90); k++) {
    const d = [r() * 2 - 1, r() * 1.6 - 0.6, r() * 2 - 1];
    B.cone(tuft, mature ? 0.012 : 0.009, (mature ? 0.05 : 0.04) + r() * 0.04, onEll(bodyE, d[0], d[1], d[2], 0.97), [d[0], d[1] + 0.3, d[2] - 0.8], 3);
  }
  B.flush();

  /* ---------- голова ---------- */
  const head = new THREE.Group(); head.position.set(0, mature ? 0.06 : 0.04, bz * 0.92); rig.add(head);
  const hs = mature ? 1 : 1.25; head.scale.setScalar(hs);
  const Hd = new Part(head);
  const sn = mature ? 1 : 0.74;                                                                   // длина рыла
  Hd.sphere(fur, 0.21, 0, 0.0, 0.17, 1.0, 0.96, 1.08, { lump: 0.04, w: 20, h: 14 });             // череп
  Hd.sphere(furD, 0.1, 0, 0.12, 0.12, 1.3, 0.55, 1.2, { lump: 0.08, w: 12, h: 8 });               // лоб
  Hd.sphere(fur, 0.15, 0, -0.04, 0.3, 1.0, 0.85, 1.1, { lump: 0.03, w: 14, h: 10 });             // скулы
  Hd.limb(mature ? fur : skin, [0, -0.01, 0.3], [0, -0.075, 0.3 + 0.24 * sn], 0.125, 0.092, 14);   // рыло
  Hd.sphere(skin, 0.092, 0, -0.082, 0.3 + 0.255 * sn, 1.18, 0.95, 0.55, { lump: 0.05, w: 14, h: 10 });  // пятачок
  for (const s of [-1, 1]) {
    Hd.sphere(dark, 0.02, s * 0.034, -0.078, 0.3 + 0.285 * sn, 0.9, 1.3, 0.5, { w: 8, h: 6 });    // ноздри
    Hd.sphere(skinD, 0.05, s * 0.07, -0.135, 0.34 + 0.1 * sn, 0.9, 0.6, 1.5, { w: 8, h: 6 });     // верхние губы
    // уши
    if (mature) {
      Hd.sphere(skinD, 1, s * 0.15, 0.17, 0.1, 0.03, 0.1, 0.075, { w: 10, h: 8, rz: s * 0.6, ry: s * 0.3 });
      Hd.cone(furD, 0.06, 0.16, [s * 0.12, 0.15, 0.12], [s * 0.55, 1, -0.25], 5);
      Hd.sphere(dark, 0.014, s * 0.19, 0.2, 0.1, 1, 1, 1, { w: 6, h: 5 });
    } else {
      Hd.sphere(skin, 1, s * 0.17, 0.12, 0.1, 0.022, 0.13, 0.1, { w: 12, h: 8, rz: s * 0.9, ry: s * 0.35 });                // большие уши
      Hd.sphere(skinD, 1, s * 0.178, 0.12, 0.1, 0.012, 0.1, 0.075, { w: 10, h: 8, rz: s * 0.9, ry: s * 0.35 });
    }
    // глаза: глазница + светящийся глаз
    Hd.sphere(dark, mature ? 0.04 : 0.045, s * 0.145, 0.05, 0.27, 0.7, 1, 0.9, { w: 10, h: 8 });
    ball(head, eyeMat, mature ? 0.024 : 0.032, s * 0.158, 0.052, 0.282, 0.75, 1, 0.9, 10, 8);
    Hd.sphere(furD, 0.04, s * 0.14, 0.098, 0.27, 1, 0.5, 1.2, { w: 8, h: 6 });                      // бровь
    // клыки
    if (mature) {
      Hd.tube(ivory, [[s * 0.07, -0.13, 0.46], [s * 0.115, -0.15, 0.57], [s * 0.15, -0.09, 0.65], [s * 0.14, 0.03, 0.68], [s * 0.115, 0.1, 0.665]], 0.026, 0.005, 14, 8);
      Hd.tube(ivoryD, [[s * 0.075, -0.1, 0.5], [s * 0.1, -0.06, 0.58], [s * 0.1, 0.0, 0.62]], 0.014, 0.004, 8, 6);
      Hd.cone(ivory, 0.01, 0.05, [s * 0.14, 0.06, 0.675], [-s * 0.4, 1, 0.1], 5);
    } else {
      Hd.tube(ivory, [[s * 0.06, -0.12, 0.38], [s * 0.08, -0.13, 0.43], [s * 0.085, -0.09, 0.46]], 0.014, 0.004, 8, 6);
    }
    for (let k = 0; k < 4; k++) Hd.limb(tuft, [s * 0.1, -0.05 - k * 0.012, 0.36 + k * 0.012], [s * (0.2 + k * 0.01), -0.1 - k * 0.02, 0.34 + k * 0.012], 0.004, 0.0015, 3);   // усы
  }
  // нижняя челюсть, пасть, зубы
  Hd.sphere(skinD, 0.1, 0, -0.14, 0.34 + 0.05 * sn, 0.8, 0.5, 1.3 * sn + 0.3, { lump: 0.04, w: 12, h: 8 });
  Hd.sphere(dark, 0.07, 0, -0.112, 0.4 + 0.05 * sn, 1.1, 0.14, 1.5 * sn + 0.3, { w: 10, h: 6 });
  for (let k = 0; k < 5; k++) for (const s of [-1, 1]) Hd.cone(ivory, 0.007, 0.022, [s * 0.04, -0.107, 0.36 + k * 0.025 * sn], [0, -1, 0.1], 4);
  // щетина на лбу и загривке
  for (let k = 0; k < (mature ? 36 : 22); k++) {
    const a = r() * 6.28, rr = 0.1 + r() * 0.08;
    Hd.cone(tuft, 0.01, 0.05 + r() * 0.04, [Math.cos(a) * rr, 0.1 + r() * 0.1, 0.05 + r() * 0.2], [Math.cos(a) * 0.4, 1, -0.5], 3);
  }
  if (mature) {
    Hd.sphere(flesh, 0.03, -0.1, 0.07, 0.34, 0.5, 1, 1.4, { lump: 0.25, w: 8, h: 6, rz: -0.4 });      // шрам на морде
    for (let k = 0; k < 6; k++) Hd.cone(tuft, 0.009, 0.06, [(k - 2.5) * 0.026, -0.17, 0.42], [(k - 2.5) * 0.15, -1, 0.2], 3);
  }
  Hd.flush();

  /* ---------- ноги ---------- */
  const legs = [];
  const lx = mature ? 0.19 : 0.15;
  for (const [sx, z] of [[-1, bz * 0.58], [1, bz * 0.58], [-1, -bz * 0.62], [1, -bz * 0.62]]) {
    const lg = new THREE.Group(); lg.position.set(sx * lx, -0.14, z); rig.add(lg);
    const p = new Part(lg), rear = z < 0, th = (rear ? 0.125 : 0.105) * (mature ? 1 : 0.9);
    const knee = [0, -0.19, rear ? -0.05 : 0.02], foot = [0, -(H0 - 0.14) + 0.05, rear ? -0.005 : 0.02];
    p.sphere(fur, th, 0, -0.01, 0, 1, 1.3, 1.1, { lump: 0.05, w: 12, h: 8 });
    p.limb(fur, [0, 0, 0], knee, th * 0.7, th * 0.42, 9);
    p.sphere(furD, th * 0.45, knee[0], knee[1], knee[2], 1, 1, 1, { w: 8, h: 6 });
    p.limb(skinD, knee, foot, 0.04, 0.03, 8);
    p.sphere(hoof, 0.033, foot[0], foot[1] - 0.002, foot[2] + 0.008, 1.1, 0.8, 1.3, { w: 8, h: 6 });
    for (const s of [-1, 1]) p.cone(hoof, 0.022, 0.05, [foot[0] + s * 0.018, foot[1] + 0.02, foot[2] + 0.02], [s * 0.05, -1, 0.35], 5);
    p.flush(); legs.push({ g: lg, ph: (sx * z > 0 ? 0 : Math.PI) });
  }

  /* ---------- хвост ---------- */
  const tails = []; let par = rig;
  let px = 0, py = 0.04, pz = -bz * 1.02;
  for (let i = 0; i < 3; i++) {
    const tg = new THREE.Group(); tg.position.set(px, py, pz); par.add(tg);
    const L = mature ? 0.085 : 0.065, tp = new Part(tg);
    tp.limb(skin, [0, 0, 0], [0, mature ? -0.02 : 0.03, -L], 0.022 - i * 0.005, 0.018 - i * 0.005, 6);
    if (i === 2) { tp.cone(mature ? tuft : skin, 0.014, 0.07, [0, mature ? -0.02 : 0.03, -L], [0, mature ? -0.4 : 1, -1], 5); for (let k = 0; k < 5; k++) tp.cone(tuft, 0.006, 0.05, [0, 0, -L], [(k - 2) * 0.3, mature ? -0.4 : 0.8, -1], 3); }
    tp.flush(); tails.push(tg); par = tg; px = 0; py = mature ? -0.02 : 0.03; pz = -L;
  }

  g.scale.setScalar(cfg.scale || 1);
  const swingDur = cfg.swing || 0.3;
  g.userData = {
    eyeMat, rig, legs, head, kind: 'boar',
    anim(m, amp, chase, time) {
      const ph = m.phase * 2.2, run = chase ? 1.25 : 1, sw = m.swing || 0;
      for (const l of legs) l.g.rotation.x = Math.sin(ph * run + l.ph) * 0.85 * amp * (chase ? 1.15 : 1);
      rig.position.y = H + (Math.abs(Math.sin(ph * run)) * 0.035 * amp + Math.sin(time * 2.4 + m.off) * 0.004) * sc;
      rig.rotation.x = Math.sin(ph * run * 2) * 0.035 * amp + (chase ? 0.04 : 0);
      rig.rotation.z = chase ? Math.sin(time * 11 + m.off) * 0.018 * amp : Math.sin(time * 1.1 + m.off) * 0.01;
      rig.scale.set(sc, sc * (1 + Math.sin(time * 2.6 + m.off) * 0.012), sc);
      // голова: принюхивается, в погоне опущена (бодает), при ударе — резкий вскид клыками
      let pitch = chase ? 0.28 : 0.1 + Math.sin(time * 1.7 + m.off) * 0.14 + Math.max(0, Math.sin(time * 0.45 + m.off * 2)) * 0.18;
      if (sw > 0) { const t = 1 - sw / swingDur; pitch = 0.5 - Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.6) * 1.5; }
      head.rotation.x = pitch + Math.sin(ph * run * 2) * 0.04 * amp;
      head.rotation.y = chase ? Math.sin(time * 9 + m.off) * 0.06 : Math.sin(time * 0.6 + m.off) * 0.38;
      head.rotation.z = chase ? 0 : Math.sin(time * 1.2 + m.off) * 0.05;
      for (let i = 0; i < tails.length; i++) tails[i].rotation.y = Math.sin(time * (chase ? 12 : 3) + m.off - i * 0.8) * (0.25 + i * 0.12);
    },
    die(f) {
      rig.rotation.z = f * 1.5; rig.rotation.x = 0; rig.position.y = H - f * (H - 0.29 * sc);
      for (const l of legs) { l.g.rotation.x = f * 0.5 * (l.ph ? -1 : 1); l.g.rotation.z = f * 0.2; }
      head.rotation.x = 0.3 * f; head.rotation.z = 0.2 * f;
    }
  };
  return g;
}
