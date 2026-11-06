// @ts-nocheck
// Позы рук и покадровые анимации для каждого оружия.
// Все координаты — в локальном пространстве модели оружия (ствол в −Z, верх +Y, право +X).
// Поза: p — положение запястья, r — Эйлер (порядок YXZ: сначала крен Z, затем тангаж X, затем рыскание Y),
// c — сгиб пальцев 0..1, ci — указательный отдельно, th — большой палец, rel — часть оружия, к которой поза привязана.
// Правая рука: ладонь вниз, пальцы −Z, большой палец −X; крен −π/2 → «рукопожатие» (хват рукояти).
const PI = Math.PI, H = PI / 2;
const P = (p: number[], r: number[], o: any = {}) => ({ p, r, c: 0.8, th: 0.3, ta: 0, sp: 0.4, ...o });
const Z6 = [0, 0, 0, 0, 0, 0];

/* ---------- пистолет ---------- */
const pistolIdle = { R: P([0.046, -0.085, 0.075], [0, 0.12, -H], { c: 0.88, ci: 0.15, th: 0.1 }), L: P([-0.047, -0.145, 0.05], [0, -0.1, H], { c: 0.88, th: 0.3 }) };
const pistolMag = P([-0.047, -0.04, 0.062], [0, 0, H], { c: 0.9, th: 0.3, rel: 'mag' });
const pistolSlap = (y: number) => P([-0.01, y, 0.075], [0, 0, PI], { c: 0.15, th: 0.1 });
const pistolRack = P([-0.028, 0.052, 0.128], [0.12, 0, 0], { c: 0.62, th: 0.55, rel: 'slide' });
const pistolReload = [
  [0.06, { L: pistolMag, w: [0, 0.0, 0.0, 0.18, 0, -0.22] }],
  [0.10, { ev: 'magrel', mag: [0, -0.012, 0, 0, 0, 0], R: { ...pistolIdle.R, th: 0.7 } }],
  [0.22, { ev: 'magout', mag: [-0.004, -0.17, 0.01, 0, 0, 0], R: pistolIdle.R }],
  [0.32, { mag: [-0.12, -0.52, 0.12, 0.3, 0, 0.4] }],
  [0.38, { ev: 'pouch' }],
  [0.50, { mag: [-0.05, -0.3, 0.05, 0.2, 0, 0.2] }],
  [0.60, { mag: [0, -0.1, 0, 0, 0, 0] }],
  [0.65, { ev: 'magin', mag: Z6 }],
  [0.70, { L: pistolSlap(-0.245), mv: 1 }],
  [0.74, { ev: 'slap', L: pistolSlap(-0.213) }],
  [0.80, { L: pistolRack, w: [0, 0.0, 0.0, 0.1, 0, -0.1] }],
  [0.86, { ev: 'slidebk', slide: 0.05 }],
  [0.91, { ev: 'slidefw', slide: 0 }]
];

/* ---------- АС «Вал» ---------- */
const asvalIdle = { R: P([0.046, -0.115, 0.17], [0, 0.1, -H], { c: 0.9, ci: 0.15, th: 0.1 }), L: P([-0.05, -0.087, -0.2], [0, -H, PI], { c: 0.85, th: 0.6 }) };
const asvalMag = P([-0.047, -0.09, 0.07], [0, 0, H], { c: 0.9, th: 0.3, rel: 'mag' });
const asvalSlap = (y: number) => P([-0.02, y, 0.0], [0, 0, PI], { c: 0.15, th: 0.1 });
const asvalHandle = P([0.04, 0.06, 0.075], [0.0, 0, 0], { c: 0.7, th: 0.3, rel: 'slide' });
const asvalReload = [
  [0.06, { L: asvalMag, w: [0, 0, 0, 0.12, 0, -0.18] }],
  [0.12, { ev: 'magrel', mag: [0, 0, 0, 0.1, 0, 0] }],
  [0.20, { ev: 'magout', mag: [0, -0.04, -0.05, 0.55, 0, 0] }],
  [0.30, { mag: [-0.05, -0.3, -0.1, 0.8, 0, 0.2] }],
  [0.38, { mag: [-0.15, -0.55, 0.0, 0.7, 0, 0.4] }],
  [0.45, { ev: 'pouch' }],
  [0.56, { mag: [-0.02, -0.22, -0.08, 0.7, 0, 0.1] }],
  [0.66, { mag: [0, -0.03, -0.03, 0.5, 0, 0] }],
  [0.72, { ev: 'magin', mag: Z6 }],
  [0.77, { L: asvalSlap(-0.215) }],
  [0.80, { ev: 'slap', L: asvalSlap(-0.19) }],
  [0.85, { L: asvalHandle, w: [0, 0, 0, 0.06, 0, -0.1] }],
  [0.90, { ev: 'slidebk', slide: 0.075 }],
  [0.94, { ev: 'slidefw', slide: 0 }]
];

/* ---------- винтовка ---------- */
const rifleIdle = { R: P([0.046, -0.09, 0.19], [0, 0.1, -H], { c: 0.9, ci: 0.15, th: 0.1 }), L: P([-0.05, -0.066, -0.28], [0, -H, PI], { c: 0.85, th: 0.6 }) };
const rifleBolt = P([0.103, -0.002, 0.174], [0, 0, -H], { c: 0.8, th: 0.6, rel: 'bolt' });
const rifleClipHand = P([-0.047, 0.0, 0.07], [0, 0, H], { c: 0.8, th: 0.4, rel: 'mag' });
const rifleBoltSeq = (t0: number, step: number) => [
  [t0, { R: rifleBolt }],
  [t0 + step * 1.0, { ev: 'boltup', bolt: [1.15, 0] }],
  [t0 + step * 2.0, { ev: 'boltbk', bolt: [1.15, 0.11] }]
];
const rifleReload = [
  [0.06, { R: rifleBolt, L: { ...rifleIdle.L, c: 0.4 }, w: [0, 0, 0, 0.12, 0, 0.2] }],
  [0.12, { ev: 'boltup', bolt: [1.15, 0], L: P([-0.25, -0.35, -0.1], [0, -H, PI], { c: 0.4, th: 0.4 }) }],
  [0.20, { ev: 'boltbk', bolt: [1.15, 0.11], mv: 1, mag: [-0.3, -0.35, 0, 0, 0, 0.6] }],
  [0.24, { ev: 'pouch', L: rifleClipHand }],
  [0.38, { mag: [-0.03, 0.05, 0, 0, 0, 0.1] }],
  [0.43, { ev: 'clipin', mag: [0, 0.0, 0, 0, 0, 0] }],
  [0.48, { ev: 'rounds', mag: [0, -0.012, 0, 0, 0, 0] }],
  [0.58, { ev: 'clipout', mag: [-0.1, -0.1, 0, 0, 0, 0.5], mv: 0, L: P([-0.2, -0.2, -0.1], [0, -H, PI], { c: 0.3, th: 0.3 }) }],
  [0.68, { ev: 'boltfw', bolt: [1.15, 0], L: rifleIdle.L }],
  [0.76, { ev: 'boltdn', bolt: [0, 0] }]
];
const rifleCycle = [
  [0.10, { R: rifleBolt }],
  [0.22, { ev: 'boltup', bolt: [1.15, 0] }],
  [0.40, { ev: 'boltbk', bolt: [1.15, 0.11] }],
  [0.62, { ev: 'boltfw', bolt: [1.15, 0] }],
  [0.74, { ev: 'boltdn', bolt: [0, 0] }]
];

/* ---------- дробовик ---------- */
const shotIdle = { R: P([0.046, -0.09, 0.19], [0, 0.1, -H], { c: 0.9, ci: 0.15, th: 0.1 }), L: P([-0.062, -0.077, 0.0], [0, -H, PI], { c: 0.85, th: 0.6, rel: 'pump' }) };
const shotShellHand = P([-0.04, -0.03, 0.02], [0, -H, PI], { c: 0.7, th: 0.6, rel: 'mag' });
const shotLow = P([-0.22, -0.32, 0.02], [0, -H, PI], { c: 0.3, th: 0.4 });
function shotgunReload(n: number) {
  const T = 0.35 + n * 0.42 + 0.6, k: any[] = [];
  const at = (s: number, o: any) => k.push([s / T, o]);
  at(0.15, { L: shotLow, R: { ...shotIdle.R }, w: [0, 0, 0, 0.1, 0, 0.15] });
  let s = 0.35;
  for (let i = 0; i < n; i++) {
    at(s + 0.0, { L: shotLow, mv: 0 });
    at(s + 0.1, { ev: 'shellgrab', mv: 1, mag: [-0.22, -0.3, 0, 0, 0, 0], L: shotShellHand });
    at(s + 0.24, { mag: [0, -0.1, 0.03, 0, 0, 0] });
    at(s + 0.34, { ev: 'shellin', mag: [0, 0, 0, 0, 0, 0] });
    at(s + 0.37, { mv: 0 });
    s += 0.42;
  }
  at(s + 0.0, { L: shotIdle.L, mv: 0 });
  at(s + 0.18, { ev: 'pumpbk', pump: 0.1, w: [0, 0, 0, 0.04, 0, 0] });
  at(s + 0.4, { ev: 'pumpfw', pump: 0 });
  return k;
}
const shotCycle = [
  [0.14, { ev: 'pumpbk', pump: 0.1 }],
  [0.2, { ev: 'eject' }],
  [0.5, { ev: 'pumpfw', pump: 0 }]
];

/* ---------- огнемёт ---------- */
const flameIdle = { R: P([0.046, -0.1, 0.23], [0, 0.1, -H], { c: 0.9, th: 0.1 }), L: P([-0.046, -0.14, -0.33], [0, 0.1, H], { c: 0.9, th: 0.3 }) };
const flameTank = P([-0.05, -0.0825, 0.06], [0, -H, PI], { c: 0.75, th: 0.6, rel: 'mag' });
const flameValve = (rz: number) => P([-0.055, -0.073, 0.2], [0, 0, rz], { c: 0.6, th: 0.5, rel: 'mag' });
const flameReload = [
  [0.07, { L: flameTank, w: [0, 0, 0, 0.1, 0, -0.1] }],
  [0.13, { ev: 'tankrel', mag: [0, -0.012, 0, 0, 0, 0] }],
  [0.22, { ev: 'tankout', mag: [0, -0.22, -0.05, 0.4, 0, 0] }],
  [0.33, { mag: [-0.15, -0.6, 0.1, 0.4, 0, 0.5] }],
  [0.40, { ev: 'pouch' }],
  [0.50, { mag: [-0.03, -0.3, 0.0, 0.3, 0, 0.1] }],
  [0.58, { mag: [0, -0.1, 0, 0, 0, 0] }],
  [0.62, { ev: 'tankin', mag: Z6 }],
  [0.66, { ev: 'clamp' }],
  [0.72, { L: flameValve(H), w: [0, 0, 0, 0.06, 0, -0.06] }],
  [0.80, { ev: 'valve', L: flameValve(H + 1.0), wheel: 1.4 }],
  [0.88, { ev: 'ignite', L: flameValve(H), wheel: 0 }]
];


/* ---------- револьвер .357 ---------- */
// откинуть барабан влево, поднять ствол и выбить гильзы шомполом, вставить новые патроны, закрыть барабан
const revIdle = { R: P([0.046, -0.085, 0.075], [0, 0.12, -H], { c: 0.88, ci: 0.15, th: 0.1 }), L: P([-0.047, -0.145, 0.05], [0, -0.1, H], { c: 0.88, th: 0.3 }) };
const revPush = (c: number) => P([-0.06, -0.016, 0.0], [0, 0, H], { c, th: 0.3 });
const revRod = P([0.0, 0.012, -0.335], [-H * 0.9, 0, 0], { c: 0.2, th: 0.2 });
const revMagHand = P([-0.03, 0.0, 0.085], [0, 0, H], { c: 0.85, th: 0.4, rel: 'mag' });
const revClose = (y: number) => P([-0.06, y, 0.01], [0, 0, H], { c: 0.2, th: 0.1 });
const revReload = [
  [0.04, { L: revPush(0.6), w: [0, 0, 0, 0.04, 0, -0.1] }],
  [0.09, { ev: 'latch', R: { ...revIdle.R, th: 0.75 }, L: revPush(0.35) }],
  [0.17, { ev: 'open', crane: 1.3, R: revIdle.R, L: revPush(0.2) }],
  [0.27, { L: revIdle.L, w: [0, 0.01, 0.0, 0.6, 0, -0.1] }],
  [0.37, { L: revRod }],
  [0.45, { ev: 'eject', pump: 0.045, rim: 0 }],
  [0.52, { pump: 0 }],
  [0.58, { w: [0, 0, 0, 0.25, 0, -0.12], L: revMagHand, mv: 1, mag: [-0.13, -0.42, 0.2, 0, 0, 0] }],
  [0.62, { ev: 'pouch' }],
  [0.72, { mag: [-0.01, -0.04, 0.1, 0, 0, 0] }],
  [0.78, { ev: 'magin', mag: [0, 0, 0, 0, 0, 0] }],
  [0.82, { ev: 'rounds', rim: 1, mv: 0, L: revClose(-0.006) }],
  [0.90, { ev: 'close', crane: 0, drum: 1.0472, w: [0, 0, 0, 0.08, 0, -0.05], L: revClose(-0.016) }],
  [0.95, { w: Z6 }]
];

/* ---------- АК-74М ---------- */
// aux-части: safety (переводчик огня), magcatch (защёлка магазина), shell (гильза). Вектор: [x, y, z, rx, ry, rz, масштаб]
const AX = (mc = 0, sh: number[] | null = null, sf = 0) => ({ magcatch: [0, 0, 0, mc, 0, 0, 1], safety: [0, 0, 0, sf, 0, 0, 1], shell: sh || [0, 0, 0, 0, 0, 0, 0] });
const akIdle = { R: P([0.046, -0.115, 0.17], [0, 0.1, -H], { c: 0.9, ci: 0.15, th: 0.1 }), L: P([-0.05, -0.087, -0.2], [0, -H, PI], { c: 0.85, th: 0.6 }) };
const akMag = P([-0.047, -0.09, 0.07], [0, 0, H], { c: 0.9, th: 0.3, rel: 'mag' });
const akMagGrab = P([-0.047, -0.075, 0.07], [0, 0, H], { c: 0.6, th: 0.45, rel: 'mag' });
const akSlap = (y: number) => P([-0.02, y, 0.0], [0, 0, PI], { c: 0.15, th: 0.1 });
const akHandle = P([0.04, 0.06, 0.075], [0.0, 0, 0], { c: 0.7, th: 0.3, rel: 'slide' });
const akHandleHi = P([0.04, 0.075, 0.07], [0.05, 0, 0], { c: 0.78, th: 0.3, rel: 'slide' });
// классическая перезарядка АК: большим пальцем нажать защёлку, качнуть магазин вперёд, снять; новый — зацеп спереди, поворот назад до щелчка;
// затем левой рукой рвануть рукоятку затвора: гильза вылетает из окна. Времена событий не менять — под них подогнаны звуки.
const akReload = [
  [0.03, { L: akMagGrab, w: [0, 0, 0, 0.04, 0, -0.06], aux: AX(0) }],
  [0.05, { L: akMag, w: [0, 0, 0, 0.1, 0, -0.14] }],
  [0.11, { ev: 'magrel', mag: [0, 0, 0, 0.08, 0, 0], aux: AX(0.62) }],
  [0.16, { aux: AX(0.62) }],
  [0.20, { ev: 'magout', mag: [0, -0.03, -0.04, 0.62, 0, 0], aux: AX(0.1) }],
  [0.25, { aux: AX(0) }],
  [0.29, { mag: [-0.04, -0.28, -0.08, 0.85, 0, 0.2] }],
  [0.37, { mag: [-0.15, -0.55, 0.0, 0.7, 0, 0.4] }],
  [0.43, { ev: 'pouch' }],
  [0.54, { mag: [-0.02, -0.22, -0.08, 0.72, 0, 0.1] }],
  [0.63, { ev: 'hook', mag: [0, -0.03, -0.03, 0.6, 0, 0], aux: AX(0.25) }],
  [0.70, { ev: 'magin', mag: Z6, aux: AX(0) }],
  [0.74, { w: [0, 0.0, 0.004, 0.06, 0, -0.1], L: akMagGrab }],
  [0.76, { L: akSlap(-0.215) }],
  [0.79, { ev: 'slap', L: akSlap(-0.19) }],
  [0.84, { L: akHandle, w: [0, 0, 0, 0.06, 0, -0.1] }],
  [0.87, { L: akHandleHi, aux: AX(0, null, 0) }],
  [0.90, { ev: 'slidebk', slide: 0.08, L: akHandleHi, aux: AX(0, [0, 0, 0, 0, 0, 0, 1]) }],
  [0.925, { slide: 0.08, aux: AX(0, [0.05, 0.05, 0.02, 3, 1, 2, 1]) }],
  [0.95, { ev: 'slidefw', slide: 0, L: akHandle, aux: AX(0, [0.12, -0.02, 0.07, 8, 3, 5, 1]) }],
  [0.965, { aux: AX(0, [0.17, -0.1, 0.1, 10, 4, 6, 0]), L: akIdle.L }]
];

/* ---------- винтовка Мосина ---------- */
const mosinIdle = { R: P([0.046, -0.09, 0.19], [0, 0.1, -H], { c: 0.9, ci: 0.15, th: 0.1 }), L: P([-0.05, -0.066, -0.28], [0, -H, PI], { c: 0.85, th: 0.6 }) };
const mosinBolt = P([0.086, -0.043, 0.174], [0, 0, -H], { c: 0.8, th: 0.6, rel: 'bolt' });
const mosinClipHand = P([-0.047, 0.0, 0.07], [0, 0, H], { c: 0.8, th: 0.4, rel: 'mag' });
const mosinPush = P([-0.02, 0.05, 0.05], [0.0, 0, H], { c: 0.5, ci: 0.2, th: 0.1, rel: 'mag' });   // большой палец давит на патроны
const MB = 1.45;   // поворот рукоятки затвора вверх (почти 90°)
const MS = (sh: number[] | null = null) => ({ shell: sh || [0, 0, 0, 0, 0, 0, 0] });
const mosinReload = [
  [0.05, { R: mosinBolt, L: { ...mosinIdle.L, c: 0.4 }, w: [0, 0, 0, 0.12, 0, 0.2] }],
  [0.11, { ev: 'boltup', bolt: [MB, 0], L: P([-0.25, -0.35, -0.1], [0, -H, PI], { c: 0.4, th: 0.4 }) }],
  [0.17, { bolt: [MB, 0.06] }],
  [0.20, { ev: 'boltbk', bolt: [MB, 0.11], mv: 1, mag: [-0.3, -0.35, 0, 0, 0, 0.6], aux: MS([0, 0, 0, 0, 0, 0, 0]) }],
  [0.23, { ev: 'pouch', L: mosinClipHand }],
  [0.31, { mag: [-0.14, -0.14, 0, 0, 0, 0.35] }],
  [0.38, { mag: [-0.03, 0.05, 0, 0, 0, 0.1] }],
  [0.43, { ev: 'clipin', mag: [0, 0.0, 0, 0, 0, 0] }],
  [0.46, { L: mosinPush }],
  [0.50, { ev: 'rounds', mag: [0, -0.012, 0, 0, 0, 0] }],
  [0.55, { mag: [0, -0.03, 0, 0, 0, 0] }],
  [0.60, { ev: 'clipout', mag: [-0.1, -0.1, 0, 0, 0, 0.5], mv: 0, L: P([-0.2, -0.2, -0.1], [0, -H, PI], { c: 0.3, th: 0.3 }) }],
  [0.70, { ev: 'boltfw', bolt: [MB, 0], L: mosinIdle.L }],
  [0.78, { ev: 'boltdn', bolt: [0, 0] }]
];
const mosinCycle = [
  [0.10, { R: mosinBolt }],
  [0.22, { ev: 'boltup', bolt: [MB, 0] }],
  [0.40, { ev: 'boltbk', bolt: [MB, 0.11], aux: MS([0, 0, 0, 0, 0, 0, 0]) }],
  [0.43, { aux: MS([0, 0, 0, 0, 0, 0, 1]) }],
  [0.46, { ev: 'eject', aux: MS([0.045, 0.07, 0.03, 2, 1, 1.5, 1]) }],
  [0.54, { aux: MS([0.12, 0.1, 0.1, 6, 3, 4, 1]) }],
  [0.60, { aux: MS([0.2, -0.04, 0.17, 10, 4, 6, 0]) }],
  [0.62, { ev: 'boltfw', bolt: [MB, 0] }],
  [0.76, { ev: 'boltdn', bolt: [0, 0] }]
];

/* ---------- ближний бой ---------- */
const pipeIdle = { R: P([0.06, 0.045, 0.02], [0, H, 0], { c: 1.0, th: 0.9, ta: 0 }), L: null };
const macheteIdle = { R: P([0.05, 0.04, 0.08], [0, H, 0], { c: 1.0, th: 0.9 }), L: null };
const kukriIdle = { R: P([0.045, 0.03, 0.06], [0, H, 0], { c: 1.0, th: 0.9 }), L: null };

export const WCFG: Record<string, any> = {
  pistol: { hs: 0.94, trigger: true, idle: pistolIdle, reload: pistolReload, magVis: 1 },
  asval: { hs: 1, trigger: true, idle: asvalIdle, reload: asvalReload, magVis: 1 },
  revolver: { hs: 0.94, trigger: true, idle: revIdle, reload: revReload, magVis: 0 },
  ak74: { hs: 1, trigger: true, idle: akIdle, reload: akReload, magVis: 1, shellFx: true },
  mosin: { hs: 1, trigger: true, idle: mosinIdle, reload: mosinReload, cycle: mosinCycle, magVis: 0, magHome: { p: [0.05, 0.065, 0.02], r: [0, 0, -0.45] } },
  rifle: { hs: 1, trigger: true, idle: rifleIdle, reload: rifleReload, cycle: rifleCycle, magVis: 0, magHome: { p: [0.05, 0.065, 0.02], r: [0, 0, -0.45] } },
  shotgun: { hs: 1, trigger: true, idle: shotIdle, reload: shotgunReload, dynamic: true, cycle: shotCycle, magVis: 0, magHome: { p: [0, -0.07, 0.045], r: [0, 0, 0] } },
  flame: { hs: 1, idle: flameIdle, reload: flameReload, magVis: 1 },
  pipe: { hs: 1, idle: pipeIdle, anc: { R: [0.8, -0.5, 0.35] } },
  machete: { hs: 1, idle: macheteIdle, anc: { R: [0.8, -0.5, 0.35] } },
  kukri: { hs: 1, idle: kukriIdle, anc: { R: [0.8, -0.5, 0.35] } }
};

/** Развернуть краткую запись ключей в полные кадры (значения переносятся от кадра к кадру) */
export function makeAnim(id: string, kind: string, n: number) {
  const cfg = WCFG[id];
  let raw = kind === 'reload' ? (cfg.dynamic ? cfg.reload(n) : cfg.reload) : cfg.cycle;
  const def: any = { R: cfg.idle.R, L: cfg.idle.L, mag: Z6, mv: cfg.magVis ? 1 : 0, slide: 0, bolt: [0, 0], pump: 0, wheel: 0, w: Z6, crane: 0, drum: 0, hammer: 0, rim: 1 };
  const keys: any[] = []; let cur = { ...def };
  keys.push({ ...def, t: 0 });
  for (const [t, f] of raw) { cur = { ...cur, ...f, t }; const key: any = { ...cur }; if (!f.ev) delete key.ev; keys.push(key); delete cur.ev; }
  keys.push({ ...def, t: 1 });
  return { keys };
}

