// 3D-модель игрока для вкладки «Внешний вид» в инвентаре.
// Модель собирается из примитивов и отражает реальное состояние: оружие в руках, пластины на жилете,
// размер рюкзака и его содержимое, фонарь, ботинки, ранения.
// Персонаж смотрит в +Z, его правая рука — в −X.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { buildWeaponModel, litMat } from './weaponModels';

export interface PlayerLook {
  weapon: string;
  weaponName: string;
  primary?: string | null;   // оружие в слоте «основное»
  sidearm?: string;         // оружие в слоте «пистолет»
  melee?: string;            // оружие в слоте «ближний бой»
  hp: number;
  maxHp: number;
  flash: boolean;
  batt: number;
  bagCap: number;
  bagUsed: number;
  up: { light: number; hp: number; stam: number; boots: number; bag: number };
  has: { food: number; meds: number; band: number; batt: number; key: number; bpVal: number };
}

type V3 = [number, number, number];

/* ---------------- материалы и вспомогательные функции ---------------- */
const fabricCache = new Map<string, THREE.CanvasTexture>();
function fabric(base: number, amp = 26, rep = 3): THREE.CanvasTexture {
  const key = base + ':' + rep;
  const hit = fabricCache.get(key); if (hit) return hit;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.fillStyle = '#' + new THREE.Color(base).getHexString(); x.fillRect(0, 0, 128, 128);
  const img = x.getImageData(0, 0, 128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amp;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  x.putImageData(img, 0, 0);
  x.strokeStyle = 'rgba(0,0,0,.09)'; x.lineWidth = 1;
  for (let i = 0; i < 128; i += 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  fabricCache.set(key, t); return t;
}
interface MO { rough?: number; metal?: number; emissive?: number; ei?: number; map?: THREE.Texture | null }
const std = (color: number, o: MO = {}) => new THREE.MeshStandardMaterial({
  color, roughness: o.rough ?? 0.8, metalness: o.metal ?? 0.04, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1, map: o.map ?? null
});
const cloth = (color: number, rep = 3) => std(0xffffff, { rough: 0.92, map: fabric(color, 26, rep) });

function put<T extends THREE.Object3D>(parent: THREE.Object3D, o: T, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): T {
  o.position.set(x, y, z); o.rotation.set(rx, ry, rz); parent.add(o); return o;
}
function mesh(geo: THREE.BufferGeometry, mat: THREE.Material) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
const rbox = (p: THREE.Object3D, mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, r = 0.02, rx = 0, ry = 0, rz = 0) =>
  put(p, mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), mat), x, y, z, rx, ry, rz);
const ball = (p: THREE.Object3D, mat: THREE.Material, r: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, seg = 16) => {
  const m = put(p, mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg - 4)), mat), x, y, z); m.scale.set(sx, sy, sz); return m;
};
const cyl = (p: THREE.Object3D, mat: THREE.Material, r: number, h: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, seg = 14) =>
  put(p, mesh(new THREE.CylinderGeometry(r, r, h, seg), mat), x, y, z, rx, ry, rz);
const UP = new THREE.Vector3(0, 1, 0);
function limb(p: THREE.Object3D, a: V3, b: V3, r1: number, r2: number, mat: THREE.Material, seg = 14) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const m = mesh(new THREE.CylinderGeometry(r2, r1, len, seg), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); p.add(m); return m;
}
/** Двухзвенная кинематика руки: возвращает локоть и (подрезанную) кисть */
function ik(S: THREE.Vector3, H: THREE.Vector3, l1: number, l2: number, pole: THREE.Vector3) {
  const d = H.clone().sub(S), full = (l1 + l2) * 0.995, dist = Math.min(d.length(), full), dir = d.normalize();
  const hand = S.clone().add(dir.clone().multiplyScalar(dist));
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const pp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  return { elbow: S.clone().add(dir.clone().multiplyScalar(a)).add(pp.multiplyScalar(h)), hand };
}
const tv = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];

/* ---------------- сборка персонажа ---------------- */
interface Built { group: THREE.Group; upper: THREE.Group; head: THREE.Group }

// положение оружия в руках (низкая стойка) и точки хвата в локальных координатах оружия
const GRIPS: Record<string, { pos: V3; phi: number; pitch: number; R: V3; L: V3 }> = {
  pistol: { pos: [-0.04, 1.27, 0.4], phi: 0.1, pitch: -0.07, R: [0, -0.1, 0.03], L: [0.0, -0.14, 0.05] },
  rifle: { pos: [0.0, 1.18, 0.3], phi: 0.6, pitch: -0.12, R: [0, -0.09, 0.13], L: [0, -0.03, -0.2] },
  shotgun: { pos: [0.0, 1.18, 0.3], phi: 0.6, pitch: -0.12, R: [0, -0.1, 0.17], L: [0, -0.03, -0.28] },
  flame: { pos: [0.0, 1.17, 0.3], phi: 0.55, pitch: -0.1, R: [0, -0.12, 0.05], L: [0, -0.06, -0.28] },
  asval: { pos: [0.0, 1.18, 0.3], phi: 0.6, pitch: -0.12, R: [0, -0.11, 0.13], L: [0, -0.05, -0.24] },
  revolver: { pos: [-0.04, 1.27, 0.4], phi: 0.1, pitch: -0.07, R: [0, -0.1, 0.03], L: [0.0, -0.14, 0.05] },
  ak74: { pos: [0.0, 1.18, 0.3], phi: 0.6, pitch: -0.12, R: [0, -0.115, 0.17], L: [0, -0.04, -0.2] },
  mosin: { pos: [0.0, 1.18, 0.3], phi: 0.6, pitch: -0.12, R: [0, -0.09, 0.19], L: [0, -0.03, -0.3] },
  // ближний бой: клинок вперёд-вверх, вторая рука придерживает рукоять
  pipe: { pos: [0.0, 1.2, 0.36], phi: 0.45, pitch: 0.55, R: [0, 0, 0.12], L: [0, 0, -0.1] },
  machete: { pos: [0.0, 1.2, 0.36], phi: 0.3, pitch: 0.7, R: [0, 0, 0.07], L: [0, 0, 0.13] },
  kukri: { pos: [0.0, 1.2, 0.36], phi: 0.3, pitch: 0.6, R: [0, 0, 0.05], L: [0, 0, 0.1] }
};
const MELEE_IDS = ['pipe', 'machete', 'kukri'];

function buildPlayer(look: PlayerLook): Built {
  const g = new THREE.Group();
  const { up, has } = look;
  const hpRatio = look.maxHp > 0 ? look.hp / look.maxHp : 1;
  const fill = Math.min(1, look.bagUsed / Math.max(1, look.bagCap));

  // палитра
  const skin = std(0xd6a47f, { rough: 0.62 });
  const jacket = cloth(0x4c5a3e), jacketD = cloth(0x3d4932);
  const pants = cloth(0x3f4137, 4);
  const vest = cloth(0x2d3631, 4), pouch = cloth(0x333c36, 5);
  const plate = std(0x1c2220, { rough: 0.5, metal: 0.45 });
  const plateEdge = std(0x4a5650, { rough: 0.4, metal: 0.6 });
  const leather = std(0x241b14, { rough: 0.75 });
  const boots = std(0x2b2119, { rough: 0.7 });
  const sole = std(up.boots > 0 ? 0x8a8f90 : 0x0e0e0e, { rough: 0.95 });
  const glove = std(0x16181b, { rough: 0.7 });
  const steel = std(0x8a9399, { rough: 0.35, metal: 0.85 });
  const dark = std(0x17191c, { rough: 0.6, metal: 0.3 });
  const bag = cloth(0x6a5a3a, 4), bagD = cloth(0x4d4128, 4);
  const strap = std(0x232428, { rough: 0.9 });
  const orange = cloth(0xb4561d, 4);

  /* ---- ноги ---- */
  for (const s of [-1, 1]) {
    const ax = s * 0.125, kx = s * 0.125, hx = s * 0.1;
    limb(g, [ax, 0.2, 0.0], [ax, 0.3, 0.0], 0.066, 0.07, boots);
    rbox(g, boots, 0.118, 0.1, 0.3, ax, 0.055, 0.06, 0.035, 0, s * 0.12, 0);
    const so = rbox(g, sole, 0.124, 0.035, 0.315, ax, 0.02, 0.06, 0.016, 0, s * 0.12, 0);
    if (up.boots > 0) so.scale.y = 1.35;
    limb(g, [ax, 0.26, 0.0], [kx, 0.52, 0.012], 0.074, 0.084, pants);
    ball(g, pants, 0.086, kx, 0.52, 0.012);
    limb(g, [kx, 0.52, 0.012], [hx, 0.96, 0.0], 0.088, 0.104, pants);
    rbox(g, pants, 0.04, 0.14, 0.11, s * 0.205, 0.72, 0.0, 0.015);          // карман карго
    rbox(g, jacketD, 0.045, 0.03, 0.115, s * 0.208, 0.78, 0.0, 0.01);        // клапан
    if (up.stam >= 1) {                                                       // наколенники
      rbox(g, plate, 0.115, 0.125, 0.05, kx, 0.52, 0.1, 0.03);
      rbox(g, strap, 0.13, 0.03, 0.14, kx, 0.46, 0.025, 0.012);
    }
    if (up.stam >= 3) rbox(g, plateEdge, 0.095, 0.2, 0.04, kx, 0.35, 0.085, 0.02, -0.12, 0, 0); // щитки на голени
  }
  rbox(g, pants, 0.37, 0.22, 0.23, 0, 0.98, 0, 0.07);
  rbox(g, leather, 0.38, 0.055, 0.24, 0, 1.03, 0, 0.02);                      // ремень
  rbox(g, steel, 0.045, 0.04, 0.012, 0, 1.03, 0.122, 0.006);                  // пряжка

  /* ---- кобура (пистолет виден, если в руках другое оружие) ---- */
  rbox(g, leather, 0.05, 0.2, 0.11, -0.225, 0.86, 0.02, 0.02);
  rbox(g, strap, 0.052, 0.025, 0.115, -0.225, 0.78, 0.02, 0.01);
  const side = look.sidearm || 'pistol';
  if (look.weapon !== side) {
    const pm = buildWeaponModel(side, litMat);
    if (pm) {
      const pg = new THREE.Group(); pg.add(pm); pg.rotation.order = 'YXZ'; pg.rotation.set(-Math.PI / 2, Math.PI, 0);
      pg.position.set(-0.225, 0.99, 0.02); pg.traverse(o => { (o as THREE.Mesh).castShadow = true; }); g.add(pg);
    }
  }
  // оружие ближнего боя на поясе (если не в руках)
  if (look.melee && look.melee !== look.weapon) {
    const mm = buildWeaponModel(look.melee, litMat);
    if (mm) {
      const mg = new THREE.Group(); mg.add(mm); mg.rotation.order = 'ZXY';
      mg.rotation.set(-1.32, 0, -0.08); mg.scale.setScalar(look.melee === 'pipe' ? 0.62 : 0.9); mg.position.set(0.17, 1.03, -0.13);
      mg.traverse(o => { (o as THREE.Mesh).castShadow = true; }); g.add(mg);
    }
  }
  // основное оружие за спиной (если не в руках)
  if (look.primary && look.primary !== look.weapon) {
    const rm = buildWeaponModel(look.primary, litMat);
    if (rm) {
      const rg = new THREE.Group(); rg.add(rm); rg.rotation.order = 'ZXY';
      rg.rotation.set(Math.PI / 2, 0, 0.42); rg.scale.setScalar(0.82); rg.position.set(0.03, 1.18, -0.2);
      rg.traverse(o => { (o as THREE.Mesh).castShadow = true; }); g.add(rg);
    }
  }
  if (has.meds > 0) {                                                         // аптечка на поясе
    rbox(g, std(0xb3291f, { rough: 0.6 }), 0.065, 0.14, 0.12, 0.235, 0.95, 0.0, 0.02);
    const wm = std(0xf2f2f2, { rough: 0.5 });
    rbox(g, wm, 0.006, 0.07, 0.02, 0.27, 0.95, 0.0, 0.002); rbox(g, wm, 0.006, 0.02, 0.07, 0.27, 0.95, 0.0, 0.002);
  } else rbox(g, leather, 0.06, 0.1, 0.1, 0.235, 0.96, 0.0, 0.02);           // пустой подсумок
  for (let i = 0; i < Math.min(3, has.band); i++) cyl(g, std(0xe9e6da, { rough: 0.9 }), 0.03, 0.045, 0.06 + i * 0.065, 0.99, 0.15, Math.PI / 2, 0, 0, 16);
  for (let i = 0; i < Math.min(2, has.batt); i++) cyl(g, std(0x2f8f4f, { rough: 0.4, metal: 0.3 }), 0.014, 0.055, 0.17 + i * 0.035, 0.98, 0.135);

  /* ---- верх тела (дыхание) ---- */
  const upper = new THREE.Group(); g.add(upper);
  rbox(upper, jacket, 0.4, 0.4, 0.25, 0, 1.27, 0, 0.08);
  rbox(upper, jacket, 0.416, 0.09, 0.266, 0, 1.1, 0, 0.04);
  rbox(upper, jacket, 0.3, 0.09, 0.2, 0, 1.46, 0, 0.04);
  rbox(upper, steel, 0.012, 0.36, 0.006, 0, 1.28, 0.126, 0.002);
  // жилет-разгрузка
  rbox(upper, vest, 0.388, 0.34, 0.272, 0, 1.27, 0, 0.05);
  for (const x of [-0.1, 0, 0.1]) {
    rbox(upper, pouch, 0.082, 0.1, 0.05, x, 1.115, 0.155, 0.015);
    rbox(upper, strap, 0.084, 0.018, 0.054, x, 1.145, 0.156, 0.008);
  }
  // пластины (улучшение «Пластины на жилет»)
  if (up.hp >= 1) { rbox(upper, plate, 0.27, 0.26, 0.05, 0, 1.3, 0.15, 0.03); rbox(upper, plateEdge, 0.27, 0.012, 0.052, 0, 1.425, 0.15, 0.004); }
  if (up.hp >= 2) rbox(upper, plate, 0.27, 0.26, 0.05, 0, 1.3, -0.15, 0.03);
  if (up.hp >= 3) for (const s of [-1, 1]) {
    rbox(upper, plate, 0.14, 0.04, 0.17, s * 0.235, 1.49, 0, 0.02, 0, 0, -s * 0.28);
    rbox(upper, plateEdge, 0.14, 0.01, 0.172, s * 0.235, 1.512, 0, 0.004, 0, 0, -s * 0.28);
  }
  if (up.hp >= 4) {
    for (const s of [-1, 1]) rbox(upper, plate, 0.04, 0.2, 0.11, s * 0.212, 1.25, 0.0, 0.02);
    rbox(upper, plate, 0.15, 0.13, 0.035, 0, 1.0, 0.135, 0.02, 0.25, 0, 0);
  }
  // респиратор на груди
  rbox(upper, dark, 0.12, 0.09, 0.06, 0, 1.4, 0.19, 0.03);
  for (const s of [-1, 1]) cyl(upper, steel, 0.027, 0.05, s * 0.045, 1.4, 0.23, Math.PI / 2, 0, 0, 16);
  rbox(upper, std(0x2a2f33, { rough: 0.3 }), 0.07, 0.025, 0.012, 0, 1.4, 0.222, 0.008);
  // карта доступа на шнурке
  if (has.key > 0) {
    limb(upper, [0.045, 1.47, 0.1], [0.095, 1.3, 0.18], 0.006, 0.006, std(0xff8a1f, { rough: 0.7 }), 6);
    rbox(upper, std(0xf0f0ea, { rough: 0.5 }), 0.058, 0.08, 0.008, 0.095, 1.265, 0.19, 0.004);
    rbox(upper, std(0x2fbf6a, { rough: 0.5 }), 0.058, 0.016, 0.01, 0.095, 1.285, 0.19, 0.002);
  }
  // плечи, шея, шарф
  for (const s of [-1, 1]) ball(upper, jacket, 0.087, s * 0.225, 1.39, 0, 1, 1, 1.05, 18);
  limb(upper, [0, 1.46, 0], [0, 1.55, 0], 0.055, 0.052, skin);
  const scarf = put(upper, mesh(new THREE.TorusGeometry(0.083, 0.03, 12, 28), orange), 0, 1.5, 0.0, Math.PI / 2, 0, 0); scarf.scale.set(1, 1.1, 1);
  rbox(upper, orange, 0.07, 0.17, 0.035, 0.04, 1.4, 0.082, 0.015, 0.0, 0, 0.25);

  // рюкзак: размер зависит от улучшения, толщина — от заполненности
  const bw = 0.34 + 0.01 * up.bag, bh = 0.46 + 0.012 * (look.bagCap - 8), bd = 0.2 + 0.1 * fill, bz = -0.135 - bd / 2, by = 1.42 - bh / 2;
  const back = bz - bd / 2;
  rbox(upper, bag, bw, bh, bd, 0, by, bz, 0.05);
  rbox(upper, bagD, bw + 0.012, bh * 0.36, bd + 0.025, 0, 1.42 - bh * 0.18, bz - 0.004, 0.045);
  for (const s of [-1, 1]) {                                                    // лямки
    rbox(upper, strap, 0.052, 0.022, 0.32, s * 0.125, 1.52, -0.005, 0.01);
    rbox(upper, strap, 0.052, 0.34, 0.016, s * 0.125, 1.33, 0.187, 0.008, -0.04, 0, 0);
  }
  rbox(upper, strap, 0.25, 0.02, 0.012, 0, 1.36, 0.19, 0.006);
  rbox(upper, steel, 0.03, 0.026, 0.016, 0, 1.36, 0.196, 0.004);
  if (up.bag >= 1) rbox(upper, bagD, 0.075, 0.22, 0.17, -(bw / 2 + 0.035), by - 0.07, bz + 0.01, 0.025);
  if (up.bag >= 2) rbox(upper, bagD, 0.075, 0.22, 0.17, bw / 2 + 0.035, by - 0.07, bz + 0.01, 0.025);
  if (up.bag >= 3) {
    cyl(upper, std(0x8f8a78, { rough: 0.9 }), 0.075, bw + 0.04, 0, 1.5, bz - 0.01, 0, 0, Math.PI / 2, 20);
    for (const x of [-0.1, 0.1]) cyl(upper, strap, 0.077, 0.03, x, 1.5, bz - 0.01, 0, 0, Math.PI / 2, 20);
  }
  if (up.bag >= 4) rbox(upper, bagD, 0.2, 0.2, 0.09, -0.05, by + 0.04, back - 0.045, 0.03);
  const rear = back - (up.bag >= 4 ? 0.09 : 0);
  for (let i = 0; i < Math.min(3, has.food); i++) cyl(upper, std(0xb9bec2, { rough: 0.35, metal: 0.8 }), 0.032, 0.085, -0.12 + i * 0.075, by - bh / 2 + 0.05, back - 0.03);
  if (has.bpVal > 0) {
    cyl(upper, std(0xc9b88a, { rough: 0.7 }), 0.028, 0.42, 0.13, by, rear - 0.035);
    cyl(upper, dark, 0.03, 0.025, 0.13, by + 0.2, rear - 0.035); cyl(upper, dark, 0.03, 0.025, 0.13, by - 0.2, rear - 0.035);
  }
  // стальная труба на рюкзаке
  const pipe = std(0x6f7479, { rough: 0.45, metal: 0.8 });
  const p0: V3 = [0.13, by - bh / 2 + 0.08, back - 0.045], p1: V3 = [-0.1, 1.66, back - 0.045];
  limb(upper, p0, p1, 0.019, 0.019, pipe, 10);
  for (const t of [0.12, 0.22, 0.3]) cyl(upper, dark, 0.024, 0.04, p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, back - 0.045, 0, 0, -0.32, 10);

  /* ---- голова ---- */
  const head = new THREE.Group(); put(upper, head, 0, 1.5, 0);
  ball(head, skin, 1, 0, 0.15, 0, 0.095, 0.115, 0.105, 28);
  ball(head, std(0x6a5042, { rough: 0.8 }), 1, 0, 0.082, 0.012, 0.085, 0.068, 0.088, 22);   // щетина
  for (const s of [-1, 1]) {
    ball(head, skin, 0.022, s * 0.097, 0.15, -0.002, 0.6, 1.2, 1);
    ball(head, std(0xf2eee6, { rough: 0.3 }), 0.014, s * 0.037, 0.168, 0.093, 1, 0.85, 0.7, 12);
    ball(head, std(0x1b120c, { rough: 0.2 }), 0.0085, s * 0.037, 0.168, 0.103, 1, 1, 0.6, 10);
    rbox(head, std(0x2a1d16, { rough: 0.9 }), 0.042, 0.009, 0.012, s * 0.04, 0.192, 0.094, 0.004, 0, 0, s * 0.12);
  }
  ball(head, skin, 0.022, 0, 0.135, 0.108, 0.8, 1.15, 1.2, 14);
  rbox(head, std(0x7d3a30, { rough: 0.6 }), 0.04, 0.007, 0.008, 0, 0.088, 0.099, 0.003);
  ball(head, std(0x2a1d16, { rough: 0.9 }), 1, 0, 0.145, -0.04, 0.099, 0.095, 0.082, 18);   // волосы на затылке
  // шапка
  const cap = put(head, mesh(new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, 1.14), cloth(0x2f3943, 6)), 0, 0.165, 0); cap.scale.set(0.104, 0.12, 0.113);
  const cuff = put(head, mesh(new THREE.TorusGeometry(0.1, 0.024, 12, 36), cloth(0x2a323a, 8)), 0, 0.215, -0.003, Math.PI / 2, 0, 0);
  cuff.scale.set(1.0, 1.08, 1);
  // налобный фонарь (светится, когда фонарь включён)
  rbox(head, dark, 0.058, 0.04, 0.04, 0, 0.215, 0.118, 0.012);
  const on = look.flash && look.batt > 0;
  cyl(head, on ? std(0xfff4cf, { emissive: 0xffe9a8, ei: 2.4, rough: 0.2 }) : std(0x3b4a52, { rough: 0.15, metal: 0.4 }), 0.017, 0.012, 0, 0.215, 0.141, Math.PI / 2, 0, 0, 18);
  if (on) {
    const bg = new THREE.ConeGeometry(0.75, 2.6, 28, 1, true); bg.rotateX(-Math.PI / 2); bg.translate(0, 0, 1.3);
    const bm = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    bm.position.set(0, 0.215, 0.145); bm.rotation.x = 0.18; head.add(bm);
  }

  /* ---- оружие и руки ---- */
  const wid = look.weapon in GRIPS ? look.weapon : 'pistol', cfg = GRIPS[wid];
  const wm = buildWeaponModel(wid, litMat)!;
  const wg = new THREE.Group(); wg.add(wm); wg.rotation.order = 'YXZ';
  wg.rotation.set(cfg.pitch, Math.PI + cfg.phi, 0); wg.position.set(...cfg.pos);
  wg.traverse(o => { (o as THREE.Mesh).castShadow = true; });
  g.add(wg); g.updateMatrixWorld(true);
  const gripR = wg.localToWorld(new THREE.Vector3(...cfg.R)), gripL = wg.localToWorld(new THREE.Vector3(...cfg.L));

  for (const s of [-1, 1]) {
    const S = new THREE.Vector3(s * 0.235, 1.39, 0), tgt = s < 0 ? gripR : gripL;
    const { elbow, hand } = ik(S, tgt, 0.31, 0.29, new THREE.Vector3(s * 0.7, -0.9, -0.4));
    limb(g, tv(S), tv(elbow), 0.062, 0.053, jacket);
    ball(g, jacket, 0.055, elbow.x, elbow.y, elbow.z);
    limb(g, tv(elbow), tv(hand), 0.053, 0.044, jacket);
    const dir = hand.clone().sub(elbow).normalize();
    const cu = hand.clone().sub(dir.clone().multiplyScalar(0.03));
    limb(g, tv(cu.clone().sub(dir.clone().multiplyScalar(0.025))), tv(cu.clone().add(dir.clone().multiplyScalar(0.02))), 0.048, 0.048, strap);
    const gl = ball(g, glove, 0.05, hand.x, hand.y, hand.z, 0.9, 0.78, 1.25, 14);
    gl.lookAt(hand.clone().add(dir));
    ball(g, glove, 0.02, hand.x + s * 0.03, hand.y + 0.03, hand.z + 0.02, 1, 1, 1.5, 10);
    if (hpRatio < 0.5 && s > 0) {                                                // бинт на предплечье
      const mid = elbow.clone().lerp(hand, 0.55);
      limb(g, tv(mid.clone().sub(dir.clone().multiplyScalar(0.04))), tv(mid.clone().add(dir.clone().multiplyScalar(0.04))), 0.057, 0.055, std(0xe8e4d6, { rough: 0.95 }));
      ball(g, std(0x8c1212, { rough: 0.5 }), 0.022, mid.x, mid.y + 0.04, mid.z + 0.03, 1, 0.6, 0.4, 10);
    }
  }
  // следы крови при ранениях
  const blood = std(0x6e0d0d, { rough: 0.35, metal: 0.1 });
  const spots: [V3, number][] = [];
  if (hpRatio < 0.66) spots.push([[-0.07, 1.24, 0.177], 0.05], [[0.1, 1.12, 0.178], 0.04]);
  if (hpRatio < 0.33) spots.push([[0.0, 1.34, 0.178], 0.045], [[-0.105, 0.72, 0.092], 0.045], [[0.12, 0.52, 0.105], 0.04], [[-0.2, 1.3, 0.05], 0.04]);
  for (const [p, r] of spots) ball(g, blood, r, p[0], p[1], p[2], 1.2, 1, 0.22, 12);

  return { group: g, upper, head };
}

function disposeTree(o: THREE.Object3D) {
  o.traverse(c => {
    const m = c as THREE.Mesh; if (!m.isMesh) return;
    m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mt of mats) mt.dispose();
  });
}

/* ---------------- просмотрщик ---------------- */
export class PlayerViewer {
  root: HTMLDivElement;
  private stage: HTMLDivElement;
  private tags: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
  private model: Built | null = null;
  private sig = '';
  private running = false; private raf = 0; private last = 0;
  private yaw = 0.45; private pitch = 0.12; private dist = 3.9; private goalYaw: number | null = null;
  private idle = 0; private auto = true; private drag = false; private px = 0; private py = 0;
  private w = 0; private h = 0; private autoBtn: HTMLButtonElement;

  constructor() {
    this.root = document.createElement('div'); this.root.className = 'plv';
    this.stage = document.createElement('div'); this.stage.className = 'plv-stage'; this.root.appendChild(this.stage);
    this.tags = document.createElement('div'); this.tags.className = 'plv-tags'; this.root.appendChild(this.tags);
    const views = document.createElement('div'); views.className = 'plv-views';
    views.innerHTML = '<button data-v="0">Спереди</button><button data-v="90">Сбоку</button><button data-v="180">Сзади</button><button data-v="auto" class="on">⟳ Авто</button>';
    this.root.appendChild(views);
    this.autoBtn = views.querySelector('[data-v="auto"]') as HTMLButtonElement;
    const hint = document.createElement('div'); hint.className = 'plv-hint'; hint.textContent = 'Тяните мышью — вращать · колесо — приближение';
    this.root.appendChild(hint);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.stage.appendChild(this.renderer.domElement);

    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; this.scene.environmentIntensity = 0.55;
    const key = new THREE.DirectionalLight(0xfff0dd, 2.4); key.position.set(2.2, 4, 3.2); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera; sc.left = -1.6; sc.right = 1.6; sc.top = 2.4; sc.bottom = -0.4; sc.near = 0.5; sc.far = 12;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fb8ff, 1.8); rim.position.set(-3, 2, -2.5); this.scene.add(rim);
    const warm = new THREE.DirectionalLight(0xffa860, 0.7); warm.position.set(-2.5, 1, 2.5); this.scene.add(warm);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // платформа
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.15, 56), new THREE.MeshStandardMaterial({ color: 0x151c19, roughness: 0.85, metalness: 0.25 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.scene.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.15, 64), new THREE.MeshBasicMaterial({ color: 0x4bd18a, transparent: true, opacity: 0.8 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; this.scene.add(ring);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.635, 64), new THREE.MeshBasicMaterial({ color: 0x4bd18a, transparent: true, opacity: 0.25 }));
    ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.002; this.scene.add(ring2);

    // управление
    this.stage.addEventListener('pointerdown', e => {
      this.drag = true; this.px = e.clientX; this.py = e.clientY; this.goalYaw = null; this.idle = 0;
      this.stage.setPointerCapture(e.pointerId); this.stage.classList.add('grab');
    });
    this.stage.addEventListener('pointermove', e => {
      if (!this.drag) return;
      this.yaw -= (e.clientX - this.px) * 0.011; this.pitch = Math.max(-0.2, Math.min(0.75, this.pitch + (e.clientY - this.py) * 0.006));
      this.px = e.clientX; this.py = e.clientY; this.idle = 0;
    });
    const end = () => { this.drag = false; this.stage.classList.remove('grab'); };
    this.stage.addEventListener('pointerup', end); this.stage.addEventListener('pointercancel', end);
    this.stage.addEventListener('wheel', e => { e.preventDefault(); this.dist = Math.max(2.0, Math.min(6.0, this.dist + e.deltaY * 0.004)); }, { passive: false });
    views.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b) return;
      e.stopPropagation();
      const v = b.dataset.v;
      if (v === 'auto') { this.auto = !this.auto; this.autoBtn.classList.toggle('on', this.auto); this.idle = 99; this.goalYaw = null; }
      else { this.goalYaw = (+v!) * Math.PI / 180; this.pitch = 0.1; this.auto = false; this.autoBtn.classList.remove('on'); }
    });
  }

  setLook(look: PlayerLook) {
    const r = look.maxHp > 0 ? look.hp / look.maxHp : 1;
    const sig = JSON.stringify([look.weapon, look.primary, look.melee, look.up, look.has, look.flash && look.batt > 0, look.bagCap,
      Math.round(look.bagUsed / Math.max(1, look.bagCap) * 5), r < 0.33 ? 2 : r < 0.66 ? 1 : 0, r < 0.5]);
    this.updateTags(look);
    if (sig === this.sig && this.model) return;
    this.sig = sig;
    if (this.model) { this.scene.remove(this.model.group); disposeTree(this.model.group); }
    this.model = buildPlayer(look); this.scene.add(this.model.group);
  }

  private updateTags(look: PlayerLook) {
    const pct = Math.round(look.hp / look.maxHp * 100);
    const state = pct >= 85 ? 'здоров' : pct >= 60 ? 'потрёпан' : pct >= 33 ? 'ранен' : 'при смерти';
    const tag = (t: string, cls = '') => `<span class="${cls}">${t}</span>`;
    const t = [
      tag(`❤ ${Math.ceil(look.hp)}/${look.maxHp} · ${state}`, pct < 33 ? 'bad' : pct < 60 ? 'warn' : 'ok'),
      tag(`${MELEE_IDS.includes(look.weapon) ? '🗡' : '🔫'} ${look.weaponName}`),
      tag(`🦺 Пластины ${look.up.hp}/4`),
      tag(`🎒 Рюкзак ${look.bagUsed}/${look.bagCap}`),
      tag(`🔦 Фонарь ${look.flash ? 'вкл' : 'выкл'} · ${Math.round(look.batt)}%`, look.flash ? 'ok' : '')
    ];
    if (look.up.stam > 0) t.push(tag(`🥾 Экипировка ${look.up.stam}/4`));
    if (look.has.key > 0) t.push(tag('💳 Карта доступа'));
    if (look.has.bpVal > 0) t.push(tag('📐 Чертёж'));
    this.tags.innerHTML = t.join('');
  }

  /** Вызывать после вставки root в DOM (цикл сам останавливается, когда инвентарь скрыт) */
  start() {
    this.resize(); this.frame(0, 0);
    if (this.running) return;
    this.running = true; this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      if (!this.root.isConnected || this.root.offsetParent === null) { this.running = false; return; }
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      this.frame(dt, now / 1000);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  private resize() {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h || (w === this.w && h === this.h)) return;
    this.w = w; this.h = h; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  private frame(dt: number, t: number) {
    this.resize(); if (!this.w) return;
    if (this.goalYaw !== null) {
      let d = this.goalYaw - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * Math.min(1, dt * 7); if (Math.abs(d) < 0.003) { this.yaw = this.goalYaw; this.goalYaw = null; }
    } else if (!this.drag) {
      this.idle += dt; if (this.auto && this.idle > 1.2) this.yaw += dt * 0.5;
    }
    const m = this.model;
    if (m) {
      const br = Math.sin(t * 1.9) * 0.5 + 0.5;
      m.upper.scale.set(1 + br * 0.007, 1 + br * 0.009, 1 + br * 0.007); m.upper.position.y = 1.0 * (1 - m.upper.scale.y);
      m.head.rotation.y = Math.sin(t * 0.6) * 0.07; m.head.rotation.x = Math.sin(t * 0.8) * 0.02;
    }
    const cp = Math.cos(this.pitch);
    this.camera.position.set(Math.sin(this.yaw) * cp * this.dist, 0.9 + Math.sin(this.pitch) * this.dist, Math.cos(this.yaw) * cp * this.dist);
    this.camera.lookAt(0, 0.88, 0);
    this.renderer.render(this.scene, this.camera);
  }
}
