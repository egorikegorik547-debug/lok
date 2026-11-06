// Ближний бой от первого лица: поза в руке (покой) и траектория взмаха.
// Модель: рукоять у начала координат, клинок/труба — в −Z. Хват — обычный («молоток»): кулак у рукояти, клинок/труба торчат вверх-вперёд, предплечье идёт справа-снизу.
export const MVM: Record<string, { s: number; p: number[]; r: number[] }> = {
  pipe: { s: 0.8, p: [0.0, 0.0, -0.22], r: [1.0, 0.22, -0.7] },
  machete: { s: 0.85, p: [0.0, -0.02, -0.2], r: [1.0, 0.22, -0.7] },
  kukri: { s: 1.05, p: [0.0, -0.02, -0.22], r: [1.0, 0.22, -0.7] }
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Положение/поворот оружия ближнего боя: swinging=false → поза покоя; swingP 0..1 — прогресс взмаха */
export function meleePose(k: string, swinging: boolean, swingP: number) {
  const cf = MVM[k];
  const A = { p: [cf.p[0] + 0.1, cf.p[1] + 0.09, cf.p[2] + 0.04], r: [cf.r[0] + 0.95, cf.r[1] - 0.5, cf.r[2] - 0.75] };
  const B = { p: [cf.p[0] - 0.42, cf.p[1] - 0.07, cf.p[2] - 0.1], r: [cf.r[0] - 0.8, cf.r[1] + 0.95, cf.r[2] + 0.55] };
  let from: any = cf, to: any = A, t = 0;
  if (swinging) {
    if (swingP < 0.22) { from = cf; to = A; t = swingP / 0.22; t = t * t * (3 - 2 * t); }
    else { from = A; to = B; t = (swingP - 0.22) / 0.78; t = 1 - Math.pow(1 - t, 3); }
  }
  return {
    p: [0, 1, 2].map(i => lerp(from.p[i], to.p[i], t)),
    r: [0, 1, 2].map(i => lerp(from.r[i], to.r[i], t))
  };
}

