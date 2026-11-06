// @ts-nocheck
// Руки игрока от первого лица: перчатки с пальцами (3 фаланги + большой палец), рукава куртки, манжеты.
// Руки «приклеены» к модели оружия (в её локальных координатах) и двигаются по покадровым анимациям:
// смена магазина, передёргивание затвора/помпы, досылание патронов по одному, замена баллона и т. д.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { matcap } from './weaponModels';
import { WCFG, makeAnim } from './handAnims';

/* ---------------- материалы ---------------- */
const texCache = new Map<string, THREE.CanvasTexture>();
function fabricTex(kind: string) {
  if (texCache.has(kind)) return texCache.get(kind)!;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d')!;
  x.fillStyle = '#e8e8e8'; x.fillRect(0, 0, 64, 64);
  const img = x.getImageData(0, 0, 64, 64);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * (kind === 'glove' ? 38 : 30);
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
  x.strokeStyle = 'rgba(0,0,0,.14)'; x.lineWidth = 1;
  const st = kind === 'glove' ? 4 : 3;
  for (let i = 0; i < 64; i += st) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + (kind === 'glove' ? 0 : 3), 64); x.stroke(); }
  if (kind !== 'glove') for (let i = 0; i < 64; i += st) { x.beginPath(); x.moveTo(0, i); x.lineTo(64, i); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(kind, t); return t;
}
const mm = (color: number, map: THREE.Texture | null = null) =>
  new THREE.MeshMatcapMaterial({ color, matcap: matcap(), map, fog: false });
let MAT: any = null;
function mats() {
  if (MAT) return MAT;
  MAT = {
    glove: mm(0x2c3034, fabricTex('glove')), gloveL: mm(0x3b4147, fabricTex('glove')), skin: mm(0xe0ae88),
    plate: mm(0x1a1e21), pad: mm(0x4a5056), strap: mm(0x16181a), buckle: mm(0x9aa2a8),
    sleeve: mm(0x7c8c64, fabricTex('sleeve')), sleeveD: mm(0x55633f, fabricTex('sleeve')), band: mm(0x1a1c1e)
  };
  return MAT;
}

/* ---------------- модель кисти ---------------- */
// Локальные оси кисти: запястье в (0,0,0), пальцы вытянуты в −Z, ладонь смотрит в −Y, большой палец — в −X (правая рука).
// Левая рука — зеркало (scale.x = −1).
const FING = [
  { x: -0.0315, L: [0.043, 0.027, 0.022], r: [0.0102, 0.0094, 0.0086] },   // указательный
  { x: -0.0105, L: [0.047, 0.03, 0.023], r: [0.0106, 0.0098, 0.009] },     // средний
  { x: 0.0105, L: [0.043, 0.027, 0.022], r: [0.0101, 0.0093, 0.0085] },    // безымянный
  { x: 0.0315, L: [0.034, 0.021, 0.019], r: [0.0092, 0.0085, 0.0078] }     // мизинец
];
function capsuleZ(r: number, l: number, mat: THREE.Material) {
  const g = new THREE.CapsuleGeometry(r, l, 3, 9); g.rotateX(Math.PI / 2); g.translate(0, 0, -l / 2);
  return new THREE.Mesh(g, mat);
}
const rbox = (p: THREE.Object3D, mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, r = 0.008) => {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.1, h / 2.1, d / 2.1)), mat);
  m.position.set(x, y, z); p.add(m); return m;
};
export interface Hand {
  root: THREE.Group; side: number; fingers: any[]; thumb: any;
  sleeve: THREE.Group; sleeveMesh: THREE.Mesh; cuff: THREE.Mesh; rings: THREE.Mesh[];
}
function buildHand(side: number): Hand {
  const M = mats(), root = new THREE.Group(); root.scale.x = side;
  const gm = side < 0 ? M.gloveL : M.glove;
  // ладонь, накладки
  rbox(root, gm, 0.088, 0.03, 0.096, 0, 0, -0.046, 0.012);
  rbox(root, M.pad, 0.062, 0.006, 0.05, -0.002, -0.0165, -0.05, 0.003);       // ладонная накладка
  rbox(root, M.plate, 0.074, 0.01, 0.052, 0, 0.0185, -0.062, 0.004);          // защитная вставка на тыльной стороне
  rbox(root, M.pad, 0.082, 0.007, 0.012, 0, 0.0155, -0.095, 0.003);           // край у костяшек
  // запястье с манжетой
  const wr = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.06, 16), gm);
  wr.rotation.x = Math.PI / 2; wr.scale.set(1.18, 1, 0.82); wr.position.z = 0.03; root.add(wr);
  const cf = new THREE.Mesh(new THREE.CylinderGeometry(0.0395, 0.0395, 0.022, 16), M.strap);
  cf.rotation.x = Math.PI / 2; cf.scale.set(1.2, 1, 0.84); cf.position.z = 0.032; root.add(cf);
  rbox(root, M.buckle, 0.018, 0.006, 0.014, 0.0, 0.0345, 0.032, 0.002);       // пряжка липучки
  // пальцы
  const fingers = FING.map((f, i) => {
    const base = new THREE.Group(); base.position.set(f.x, 0.001, -0.092); root.add(base);
    const s0 = capsuleZ(f.r[0], f.L[0], gm); base.add(s0);
    const j1 = new THREE.Group(); j1.position.z = -f.L[0]; base.add(j1);
    const s1 = capsuleZ(f.r[1], f.L[1], gm); j1.add(s1);
    const j2 = new THREE.Group(); j2.position.z = -f.L[1]; j1.add(j2);
    const s2 = capsuleZ(f.r[2], f.L[2], M.skin); j2.add(s2);                   // открытый кончик пальца
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(f.r[2] * 1.12, f.r[2] * 1.12, 0.005, 10), M.strap);
    ring.rotation.x = Math.PI / 2; ring.position.z = -0.003; j2.add(ring);
    rbox(base, M.plate, 0.014, 0.006, 0.026, 0, f.r[0] * 0.95, -0.02, 0.002);  // пластинка на тыле пальца
    rbox(j2, M.skin, 0.009, 0.002, 0.009, 0, f.r[2] * 0.92, -f.L[2] * 0.72, 0.001); // ноготь
    return { base, j1, j2, i };
  });
  // большой палец
  const tb = new THREE.Group(); tb.position.set(-0.04, -0.004, -0.018); root.add(tb);
  const t0 = capsuleZ(0.0138, 0.04, gm); tb.add(t0);
  const tj1 = new THREE.Group(); tj1.position.z = -0.04; tb.add(tj1);
  tj1.add(capsuleZ(0.0122, 0.033, gm));
  const tj2 = new THREE.Group(); tj2.position.z = -0.033; tj1.add(tj2);
  tj2.add(capsuleZ(0.0108, 0.026, M.skin));
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.0122, 0.0122, 0.005, 10), M.strap);
  tr.rotation.x = Math.PI / 2; tr.position.z = -0.003; tj2.add(tr);
  const thumb = { tb, tj1, tj2 };

  // рукав куртки (в пространстве вьюмодели; ориентируется от запястья к плечу)
  const sleeve = new THREE.Group();
  const sg = new THREE.CylinderGeometry(0.06, 0.047, 1, 22, 1);
  const sleeveMesh = new THREE.Mesh(sg, M.sleeve); sleeve.add(sleeveMesh);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.0535, 0.0505, 0.05, 22), M.sleeveD); sleeve.add(cuff);
  const rings: THREE.Mesh[] = [];
  for (let k = 0; k < 4; k++) {
    const tg = new THREE.TorusGeometry(1, 0.1, 6, 24); tg.rotateX(Math.PI / 2);
    const r = new THREE.Mesh(tg, k % 2 ? M.sleeveD : M.sleeve); sleeve.add(r); rings.push(r);
  }
  const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.0525, 0.0525, 0.016, 22), M.band); sleeve.add(strap); (sleeve as any).userData.strap = strap;
  return { root, side, fingers, thumb, sleeve, sleeveMesh, cuff, rings };
}

/** Сгиб пальцев и большого пальца */
function setFingers(h: Hand, c: number, ci: number, th: number, ta: number, sp: number) {
  const k = [1.35, 1.7, 1.1];
  h.fingers.forEach((f, i) => {
    const cc = i === 0 && ci >= 0 ? ci : c * (1 + i * 0.03);
    f.base.rotation.x = -cc * k[0]; f.j1.rotation.x = -cc * k[1]; f.j2.rotation.x = -cc * k[2];
    f.base.rotation.y = -(i - 1.5) * 0.09 * sp;
  });
  const t = h.thumb;
  t.tb.rotation.set(-th * 0.42, 0.62 * (1 - th * 0.8) + ta * 0.45, -0.25 * (1 - th) + 0.3 * th, 'YXZ');
  t.tj1.rotation.x = -th * 0.65 - 0.08; t.tj2.rotation.x = -th * 0.85 - 0.05;
}

/* ---------------- система рук ---------------- */
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _e = new THREE.Euler(), _q = new THREE.Quaternion();
const _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _w = new THREE.Vector3();
const sm = (x: number) => x * x * (3 - 2 * x);
const AUX0 = [0, 0, 0, 0, 0, 0, 1];
// полёт гильзы из окна выброса (локальные смещения относительно «дома»)
function shellFlight(t: number) {
  const x = 0.52 * t, y = 0.5 * t - 1.9 * t * t, z = 0.34 * t;
  return [x, y, z, t * 22, t * 9, t * 14, t < 0.34 ? 1 : 0];
}
const _anc = new THREE.Vector3();
const ANCH = { R: new THREE.Vector3(0.33, -0.78, 0.6), L: new THREE.Vector3(-0.42, -0.78, 0.6) };

interface Reg { id: string; holder: THREE.Group; rig: THREE.Group; w: THREE.Group; sw: number; parts: any; homes: any; drumA?: number; drumT?: number; lastKick?: number; empty?: boolean; }
export class ViewHands {
  vm: THREE.Group; R: Hand; L: Hand; regs: Record<string, Reg> = {}; cur: Reg | null = null;
  mode = ''; last = -1; animCache: Record<string, any> = {};
  constructor(vm: THREE.Group) {
    this.vm = vm; this.R = buildHand(1); this.L = buildHand(-1);
    for (const h of [this.R, this.L]) { vm.add(h.sleeve); h.sleeve.visible = false; h.root.visible = false; }
  }
  register(id: string, holder: THREE.Group, w: THREE.Group) {
    const rig = new THREE.Group(); holder.remove(w); rig.add(w); holder.add(rig);
    const u = w.userData, parts = { mag: u.mag, slide: u.slide, bolt: u.bolt, pump: u.pump, wheel: u.wheel, crane: u.crane, drum: u.drum, rim: u.rim, hammer: u.hammer };
    const homes: any = {};
    for (const k in parts) if (parts[k]) homes[k] = { p: parts[k].position.clone(), r: parts[k].rotation.clone() };
    // дополнительные подвижные части (переводчик огня, защёлка магазина, гильза…)
    const aux = u.aux || null, auxHome: any = {};
    if (aux) for (const k in aux) auxHome[k] = { p: aux[k].position.clone(), r: aux[k].rotation.clone() };
    const cfg = WCFG[id];
    if (parts.mag && cfg && cfg.magHome) { homes.mag.p.set(...cfg.magHome.p); homes.mag.r.set(...cfg.magHome.r); }
    this.regs[id] = { id, holder, rig, w, sw: holder.scale.x || 1, parts, homes, aux, auxHome, auxDef: u.auxDef || {}, shellT: 9 } as any;
  }
  private partMat(reg: Reg, part: any, out: THREE.Matrix4) {
    out.identity(); let o = part;
    while (o && o !== reg.w) { o.updateMatrix(); out.premultiply(o.matrix); o = o.parent; }
    return out;
  }
  private setCur(id: string) {
    if (this.cur) this.applyParts(this.cur, null, 0, false);
    this.cur = this.regs[id] || null; this.mode = ''; this.last = -1;
    if (!this.cur) { for (const h of [this.R, this.L]) { h.sleeve.visible = false; h.root.visible = false; } return; }
    this.cur.rig.add(this.R.root); this.cur.rig.add(this.L.root);
  }
  /** Установить подвижные части оружия (магазин, затвор, помпа…) */
  private applyParts(reg: Reg, f: any, slideBase: number, vis = true) {
    const P = reg.parts, H = reg.homes, d = f || {};
    if (P.mag) {
      const o = d.mag || [0, 0, 0, 0, 0, 0];
      P.mag.position.set(H.mag.p.x + o[0], H.mag.p.y + o[1], H.mag.p.z + o[2]);
      P.mag.rotation.set(H.mag.r.x + o[3], H.mag.r.y + o[4], H.mag.r.z + o[5]);
      P.mag.visible = f ? !!d.mv : !!reg.w.userData.magVis;
    }
    if (P.slide) P.slide.position.z = slideBase + (d.slide || 0);
    if (P.bolt) { const b = d.bolt || [0, 0]; P.bolt.rotation.z = b[0]; P.bolt.position.z = b[1]; }
    if (P.pump) P.pump.position.z = H.pump.p.z + (d.pump || 0);
    if (P.wheel) P.wheel.rotation.y = d.wheel || 0;
    // револьвер: журавль с барабаном откидывается влево, барабан проворачивается, курок взводится при отдаче
    if (P.crane) P.crane.rotation.z = d.crane || 0;
    if (P.drum) P.drum.rotation.z = (reg.drumA || 0) + (d.drum || 0);
    if (P.rim) P.rim.visible = f ? d.rim !== 0 : !reg.empty;
    if (P.hammer) P.hammer.rotation.x = slideBase * 12 + (d.hammer || 0);
    const ra: any = reg;
    if (ra.aux) for (const k in ra.aux) {
      let v = d.aux && d.aux[k] ? d.aux[k] : (ra.auxDef[k] || AUX0);
      if (k === 'shell' && !f && ra.shellT < 0.4) v = shellFlight(ra.shellT);   // гильза при выстреле
      const o = ra.aux[k], h = ra.auxHome[k];
      o.position.set(h.p.x + v[0], h.p.y + v[1], h.p.z + v[2]);
      o.rotation.set(h.r.x + v[3], h.r.y + v[4], h.r.z + v[5]);
      o.scale.setScalar(Math.max(0.001, v[6]));
    }
    const w = d.w || [0, 0, 0, 0, 0, 0];
    reg.rig.position.set(w[0], w[1], w[2]); reg.rig.rotation.set(w[3], w[4], w[5]);
  }
  /** Решить позу руки в пространстве оружия */
  private solve(reg: Reg, pose: any, pos: THREE.Vector3, quat: THREE.Quaternion) {
    pos.set(pose.p[0], pose.p[1], pose.p[2]); _e.set(pose.r[0], pose.r[1], pose.r[2], 'YXZ'); quat.setFromEuler(_e);
    if (pose.rel && reg.parts[pose.rel]) {
      this.partMat(reg, reg.parts[pose.rel], _m);
      _m2.compose(pos, quat, _s); _m.multiply(_m2); _m.decompose(pos, quat, _v);
    }
  }
  update(dt: number, S: any) {
    if (!this.cur || this.cur.id !== S.weapon) this.setCur(S.weapon);
    const reg = this.cur; if (!reg) return;
    const cfg = WCFG[reg.id]; if (!cfg) return;
    let mode = 'idle', p = 0, anim: any = null;
    if (S.reloadP >= 0 && cfg.reload) { mode = 'reload'; p = S.reloadP; const n = S.n || 0, key = reg.id + ':r' + (cfg.dynamic ? n : ''); anim = this.animCache[key] || (this.animCache[key] = makeAnim(reg.id, 'reload', n)); }
    else if (S.cycleP >= 0 && cfg.cycle) { mode = 'cycle'; p = S.cycleP; const key = reg.id + ':c'; anim = this.animCache[key] || (this.animCache[key] = makeAnim(reg.id, 'cycle', 0)); }
    if (mode !== this.mode) { this.mode = mode; this.last = -1; }
    // барабан револьвера делает шаг на каждый выстрел
    reg.empty = !!S.empty;
    // гильза вылетает на каждый выстрел (у оружия с cfg.shellFx)
    (reg as any).shellT += dt;
    if (cfg.shellFx) { const kk2 = S.kick || 0; if (kk2 > ((reg as any).lastK || 0) + 0.3) (reg as any).shellT = 0; (reg as any).lastK = kk2; }
    if (reg.parts.drum) {
      const kk = S.kick || 0;
      if (kk > (reg.lastKick || 0) + 0.3) reg.drumT = (reg.drumT || 0) + Math.PI / 3;
      reg.lastKick = kk; reg.drumA = (reg.drumA || 0) + ((reg.drumT || 0) - (reg.drumA || 0)) * Math.min(1, dt * 16);
    }
    // скольжение затвора при выстреле / фиксация открытого затвора на пустом магазине
    const slideBase = reg.id === 'pistol' && S.empty && mode === 'idle' ? 0.034 : Math.min(1, S.kick || 0) * 0.032;
    let f: any = null;
    if (anim) {
      f = this.sample(anim, p);
      if (S.onEvent) for (const k of anim.keys) if (k.ev && k.t > this.last && k.t <= p) S.onEvent(reg.id, k.ev);
      this.last = p;
    }
    this.applyParts(reg, f, slideBase);
    reg.rig.updateMatrix();

    // позы рук
    if (!f) for (const hk of ['R', 'L']) { const ps = cfg.idle[hk]; if (!ps) continue; if (!ps._p) { ps._p = new THREE.Vector3(); ps._q = new THREE.Quaternion(); } this.solve(reg, ps, ps._p, ps._q); }
    const pr = f ? f.R : cfg.idle.R, pl = f ? f.L : cfg.idle.L;
    const trig = Math.min(1, (S.kick || 0) * 1.2);
    for (const [h, pose, key] of [[this.R, pr, 'R'], [this.L, pl, 'L']] as any) {
      const show = !!pose && reg.holder.visible !== false;
      h.root.visible = show; h.sleeve.visible = show; if (!show) continue;
      const hs = (cfg.hs || 1) / reg.sw;
      h.root.scale.set(h.side * hs, hs, hs);
      h.root.position.copy(pose._p); h.root.quaternion.copy(pose._q);
      let ci = pose.ci ?? -1;
      if (key === 'R' && cfg.trigger && mode === 'idle') ci = (ci < 0 ? pose.c : ci) + trig * 0.5;
      setFingers(h, pose.c ?? 0.2, ci, pose.th ?? 0.2, pose.ta ?? 0, pose.sp ?? 0.4);
      h.root.updateMatrix();
    }
    // рукава: от запястья к плечу (в пространстве вьюмодели)
    reg.holder.updateMatrix();
    for (const h of [this.R, this.L]) {
      if (!h.sleeve.visible) continue;
      _m.copy(reg.holder.matrix).multiply(reg.rig.matrix).multiply(h.root.matrix);
      _w.setFromMatrixPosition(_m);
      // чуть сдвигаем точку входа рукава назад от запястья вдоль оси кисти (+Z локально)
      _d.set(0, 0, 1).transformDirection(_m);
      _v.copy(_w).addScaledVector(_d, 0.012);
      const ca = WCFG[reg.id]?.anc, anc = ca && ca[h.side > 0 ? 'R' : 'L'] ? _anc.set(...ca[h.side > 0 ? 'R' : 'L']) : (h.side > 0 ? ANCH.R : ANCH.L);
      _d.copy(anc).sub(_v); const L = _d.length(); _d.normalize();
      this.placeSleeve(h, _v, _d, L);
    }
  }
  private placeSleeve(h: Hand, wrist: THREE.Vector3, dir: THREE.Vector3, L: number) {
    const s = h.sleeve; s.position.copy(wrist); s.quaternion.setFromUnitVectors(_up, dir);
    h.sleeveMesh.scale.set(1, L, 1); h.sleeveMesh.position.y = L / 2 + 0.02;
    h.cuff.position.y = 0.03;
    (s.userData.strap as THREE.Mesh).position.y = 0.012;
    h.rings.forEach((r, k) => { const d = 0.09 + k * 0.085, rr = 0.047 + 0.013 * (d / 0.4); r.position.y = d; r.scale.set(rr + 0.003, 1, rr + 0.003); r.visible = d < L; });
  }
  /** Интерполяция ключей */
  private sample(anim: any, p: number) {
    const ks = anim.keys; let i = 0;
    while (i < ks.length - 2 && p > ks[i + 1].t) i++;
    const a = ks[i], b = ks[i + 1], span = Math.max(1e-4, b.t - a.t), u = b.ease === 'lin' ? Math.min(1, Math.max(0, (p - a.t) / span)) : sm(Math.min(1, Math.max(0, (p - a.t) / span)));
    const reg = this.cur!;
    const lerpA = (x: number[], y: number[]) => x.map((v, k) => v + (y[k] - v) * u);
    const out: any = {
      mag: lerpA(a.mag, b.mag), mv: (u >= 1 || p >= b.t) ? b.mv : a.mv, slide: a.slide + (b.slide - a.slide) * u,
      bolt: lerpA(a.bolt, b.bolt), pump: a.pump + (b.pump - a.pump) * u, wheel: a.wheel + (b.wheel - a.wheel) * u, w: lerpA(a.w, b.w),
      crane: a.crane + (b.crane - a.crane) * u, drum: a.drum + (b.drum - a.drum) * u, hammer: a.hammer + (b.hammer - a.hammer) * u, rim: (u >= 1 || p >= b.t) ? b.rim : a.rim
    };
    const ra: any = reg;
    if (ra.aux) {
      out.aux = {};
      for (const k in ra.aux) {
        const df = ra.auxDef[k] || AUX0, va = (a.aux && a.aux[k]) || df, vb = (b.aux && b.aux[k]) || df;
        out.aux[k] = va.map((v: number, i: number) => v + (vb[i] - v) * u);
      }
    }
    this.applyParts(reg, out, 0);   // части нужны для относительных поз
    for (const hk of ['R', 'L']) {
      const pa = a[hk], pb = b[hk];
      const pa_p = new THREE.Vector3(), pa_q = new THREE.Quaternion(), pb_p = new THREE.Vector3(), pb_q = new THREE.Quaternion();
      if (!pa && !pb) { out[hk] = null; continue; }
      if (!pa || !pb) { const one = pa || pb; out[hk] = one; this.solve(reg, one, pa_p, pa_q); one._p = pa_p; one._q = pa_q; continue; }
      this.solve(reg, pa, pa_p, pa_q); this.solve(reg, pb, pb_p, pb_q);
      const r = out[hk] = this.blendPose(pa, pb, u);
      r._p = pa_p.lerp(pb_p, u); r._q = pa_q.slerp(pb_q, u);
    }
    return out;
  }
  private blendPose(a: any, b: any, u: number) {
    const L = (x: number | undefined, y: number | undefined, d: number) => { const p = x ?? d, q = y ?? d; return p + (q - p) * u; };
    const ci = (a.ci ?? -1) < 0 && (b.ci ?? -1) < 0 ? -1 : L(a.ci ?? a.c, b.ci ?? b.c, 0.2);
    return { c: L(a.c, b.c, 0.2), ci, th: L(a.th, b.th, 0.2), ta: L(a.ta, b.ta, 0), sp: L(a.sp, b.sp, 0.4) };
  }
}
