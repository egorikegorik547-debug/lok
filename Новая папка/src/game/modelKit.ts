// @ts-nocheck
// Инструментарий для детализированных моделей: процедурные текстуры, шум, «сливание» геометрии по материалам.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const UP = new THREE.Vector3(0, 1, 0);

/* ---------- генератор случайных и шум ---------- */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hash3(x, y, z) { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), l(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
    l(l(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), l(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
}
// «Комковатая» сфера: смещает вершины по нормали шумом — органика вместо идеального шара
export function lump(g, amp, freq = 2, seed = 0) {
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const l = v.length(); if (!l) continue;
    const n = noise3(v.x / l * freq + seed, v.y / l * freq + seed * 1.7, v.z / l * freq - seed) * 2 - 1;
    v.multiplyScalar(1 + amp * n); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
}

/* ---------- процедурные текстуры ---------- */
const texCache = {};
function mkCanvas(s, paint) { const c = document.createElement('canvas'); c.width = c.height = s; paint(c.getContext('2d'), s); return c; }
function mkTex(c, srgb) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function blot(ctx, x, y, rad, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
}
function wander(ctx, r, x, y, ang, len, w, col, depth = 0) {
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y);
  const br = [];
  for (let i = 0; i < len; i++) {
    ang += (r() - 0.5) * 0.8; x += Math.cos(ang) * 4; y += Math.sin(ang) * 4; ctx.lineTo(x, y);
    if (depth < 2 && r() < 0.07) br.push([x, y, ang + (r() < 0.5 ? 1 : -1) * (0.6 + r() * 0.6), len * 0.5]);
  }
  ctx.stroke();
  for (const b of br) wander(ctx, r, b[0], b[1], b[2], b[3], w * 0.65, col, depth + 1);
}

const PAINT = {
  // кожа: пятна, сосуды, синяки, поры, кровавые разводы
  skin(ctx, s, r) {
    ctx.fillStyle = '#b0b0b0'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) { const v = 105 + r() * 95 | 0; blot(ctx, r() * s, r() * s, 10 + r() * 38, `${v},${v},${v}`, 0.22); }
    for (let i = 0; i < 5; i++) blot(ctx, r() * s, r() * s, 40 + r() * 60, '120,80,125', 0.22);
    for (let i = 0; i < 4; i++) blot(ctx, r() * s, r() * s, 25 + r() * 40, '150,175,120', 0.18);
    for (let i = 0; i < 16; i++) wander(ctx, r, r() * s, r() * s, r() * 6.28, 18 + r() * 20, 1 + r() * 1.6, 'rgba(110,100,150,0.38)');
    for (let i = 0; i < 6; i++) wander(ctx, r, r() * s, r() * s, r() * 6.28, 12 + r() * 14, 2.2, 'rgba(120,30,30,0.28)');
    for (let i = 0; i < 2200; i++) { ctx.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.08})`; ctx.fillRect(r() * s, r() * s, 1.3, 1.3); }
    for (let i = 0; i < 7; i++) blot(ctx, r() * s, r() * s, 14 + r() * 24, '105,18,18', 0.4);
  },
  skinBump(ctx, s, r) {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 160; i++) { const v = 80 + r() * 100 | 0; blot(ctx, r() * s, r() * s, 6 + r() * 20, `${v},${v},${v}`, 0.3); }
    for (let i = 0; i < 2600; i++) { ctx.fillStyle = `rgba(0,0,0,${0.12 + r() * 0.2})`; ctx.fillRect(r() * s, r() * s, 1.6, 1.6); }
    for (let i = 0; i < 14; i++) wander(ctx, r, r() * s, r() * s, r() * 6.28, 18 + r() * 14, 2.4, 'rgba(235,235,235,0.7)');
  },
  // ткань: плетение, грязь, пятна крови и масла
  cloth(ctx, s, r) {
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(0,0,0,0.09)'; ctx.lineWidth = 1;
    for (let i = 0; i < s; i += 3) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke(); }
    for (let i = 0; i < 70; i++) blot(ctx, r() * s, r() * s, 14 + r() * 40, '30,26,20', 0.28);
    for (let i = 0; i < 9; i++) blot(ctx, r() * s, r() * s, 12 + r() * 26, '95,14,14', 0.5);
    for (let i = 0; i < 5; i++) blot(ctx, r() * s, r() * s, 18 + r() * 24, '20,20,10', 0.45);
    for (let i = 0; i < 40; i++) { ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 1; const x = r() * s, y = r() * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 26, y + (r() - 0.5) * 26); ctx.stroke(); }
  },
  clothBump(ctx, s, r) {
    ctx.fillStyle = '#909090'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < s; i += 3) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke(); }
    for (let i = 0; i < 30; i++) blot(ctx, r() * s, r() * s, 10 + r() * 20, '60,60,60', 0.3);
  },
  // металл / кожа: ржавчина, царапины, вмятины
  metal(ctx, s, r) {
    ctx.fillStyle = '#e4e4e4'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) { const v = 170 + r() * 80 | 0; blot(ctx, r() * s, r() * s, 8 + r() * 30, `${v},${v},${v}`, 0.3); }
    for (let i = 0; i < 46; i++) blot(ctx, r() * s, r() * s, 6 + r() * 26, '150,78,30', 0.5);
    for (let i = 0; i < 24; i++) blot(ctx, r() * s, r() * s, 10 + r() * 20, '60,30,12', 0.4);
    for (let i = 0; i < 110; i++) { const x = r() * s, y = r() * s; ctx.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 50, y + (r() - 0.5) * 12); ctx.stroke(); }
  },
  metalBump(ctx, s, r) {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 100; i++) { const v = 60 + r() * 130 | 0; blot(ctx, r() * s, r() * s, 6 + r() * 26, `${v},${v},${v}`, 0.35); }
    for (let i = 0; i < 90; i++) { const x = r() * s, y = r() * s; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 8); ctx.stroke(); }
  },
  // мех: штрихи разной яркости
  fur(ctx, s, r) {
    ctx.fillStyle = '#b8b8b8'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) blot(ctx, r() * s, r() * s, 20 + r() * 40, r() < 0.5 ? '255,255,255' : '40,40,40', 0.25);
    for (let i = 0; i < 2600; i++) {
      const x = r() * s, y = r() * s, v = 60 + r() * 195 | 0;
      ctx.strokeStyle = `rgba(${v},${v},${v},0.55)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 5, y + 5 + r() * 9); ctx.stroke();
    }
    for (let i = 0; i < 5; i++) blot(ctx, r() * s, r() * s, 22 + r() * 22, '120,30,28', 0.35);
  },
  furBump(ctx, s, r) {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const x = r() * s, y = r() * s, v = 20 + r() * 215 | 0;
      ctx.strokeStyle = `rgba(${v},${v},${v},0.6)`; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 5, y + 5 + r() * 9); ctx.stroke();
    }
  },
  // хитин: чешуйчатый узор, глянцевые блики
  chitin(ctx, s, r) {
    ctx.fillStyle = '#d6d6d6'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 80; i++) { const v = 120 + r() * 135 | 0; blot(ctx, r() * s, r() * s, 12 + r() * 28, `${v},${v},${v}`, 0.3); }
    const k = 24;
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1.4;
    for (let y = -k; y < s + k; y += k * 0.8) for (let x = -k; x < s + k; x += k) {
      const ox = (Math.round(y / (k * 0.8)) % 2) * k / 2;
      ctx.beginPath(); ctx.arc(x + ox, y, k * 0.6, 0.15, Math.PI - 0.15); ctx.stroke();
    }
    for (let i = 0; i < 30; i++) blot(ctx, r() * s, r() * s, 6 + r() * 10, '255,255,255', 0.28);
  },
  chitinBump(ctx, s, r) {
    ctx.fillStyle = '#909090'; ctx.fillRect(0, 0, s, s);
    const k = 24;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2.4;
    for (let y = -k; y < s + k; y += k * 0.8) for (let x = -k; x < s + k; x += k) {
      const ox = (Math.round(y / (k * 0.8)) % 2) * k / 2;
      ctx.beginPath(); ctx.arc(x + ox, y, k * 0.6, 0.15, Math.PI - 0.15); ctx.stroke();
    }
  }
};
const SIZE = { skin: 512, cloth: 256, metal: 256, fur: 256, chitin: 256 };
export function getTex(kind) {
  if (texCache[kind]) return texCache[kind];
  const s = SIZE[kind], seed = kind.length * 7919 + kind.charCodeAt(0) * 131;
  const t = {
    map: mkTex(mkCanvas(s, (c, z) => PAINT[kind](c, z, rng(seed))), true),
    bump: mkTex(mkCanvas(s, (c, z) => PAINT[kind + 'Bump'](c, z, rng(seed + 5))), false)
  };
  return (texCache[kind] = t);
}

/* ---------- материалы ---------- */
export function std(color, o = {}) {
  const p = { color, roughness: o.rough ?? 0.7, metalness: o.metal ?? 0.05 };
  if (o.emissive !== undefined) { p.emissive = o.emissive; p.emissiveIntensity = o.ei ?? 1; }
  if (o.tex) { const t = getTex(o.tex); p.map = t.map; p.bumpMap = t.bump; p.bumpScale = o.bump ?? 1.2; }
  if (o.opacity !== undefined) { p.transparent = true; p.opacity = o.opacity; }
  if (o.side) p.side = o.side;
  return new THREE.MeshStandardMaterial(p);
}
export const dim = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();
export const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();

/* ---------- Part: накапливает геометрию и сливает её по материалам ---------- */
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
export class Part {
  constructor(parent) { this.parent = parent; this.map = new Map(); }
  push(geo, mat) { let a = this.map.get(mat); if (!a) { a = []; this.map.set(mat, a); } a.push(geo); return this; }
  place(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _v.set(x, y, z); _s.set(sx, sy, sz);
    geo.applyMatrix4(_m.compose(_v, _q, _s)); return this.push(geo, mat);
  }
  sphere(mat, r, x, y, z, sx = 1, sy = 1, sz = 1, o = {}) {
    const g = new THREE.SphereGeometry(r, o.w || 14, o.h || 10);
    if (o.lump) lump(g, o.lump, o.freq || 2.2, o.seed || 0);
    return this.place(g, mat, x, y, z, o.rx || 0, o.ry || 0, o.rz || 0, sx, sy, sz);
  }
  box(mat, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) { return this.place(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz); }
  limb(mat, a, b, r1, r2, seg = 8) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
    if (len < 1e-5) return this;
    const g = new THREE.CylinderGeometry(r2, r1, len, seg, 1);
    _q.setFromUnitVectors(UP, d.normalize()); _v.copy(A).add(B).multiplyScalar(0.5); _s.set(1, 1, 1);
    g.applyMatrix4(_m.compose(_v, _q, _s)); return this.push(g, mat);
  }
  // шип/коготь: основание в точке base, остриё в направлении dir
  cone(mat, r, h, base, dir, seg = 6) {
    const g = new THREE.ConeGeometry(r, h, seg, 1); g.translate(0, h / 2, 0);
    _q.setFromUnitVectors(UP, new THREE.Vector3(...dir).normalize()); _v.set(...base); _s.set(1, 1, 1);
    g.applyMatrix4(_m.compose(_v, _q, _s)); return this.push(g, mat);
  }
  // изогнутая труба с сужением (щупальца, вены, хвост, кабели)
  tube(mat, pts, r1, r2, seg = 12, rad = 6) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, seg, 1, rad, false), pos = g.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i <= seg; i++) {
      curve.getPointAt(i / seg, c); const rr = r1 + (r2 - r1) * (i / seg);
      for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(rr).add(c); pos.setXYZ(k, v.x, v.y, v.z); }
    }
    g.computeVertexNormals(); return this.push(g, mat);
  }
  // эллиптическое кольцо/пояс вокруг вертикальной оси
  band(mat, rx, rz, y, h, x = 0, z = 0, seg = 18) {
    const g = new THREE.CylinderGeometry(1, 1, h, seg, 1); return this.place(g, mat, x, y, z, 0, 0, 0, rx, 1, rz);
  }
  torus(mat, R, r, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    return this.place(new THREE.TorusGeometry(R, r, 7, 16), mat, x, y, z, rx, ry, rz, sx, sy, sz);
  }
  flush() {
    const out = [];
    for (const [mat, geos] of this.map) {
      const geo = geos.length > 1 ? mergeGeometries(geos, false) : geos[0];
      if (!geo) continue;
      if (geos.length > 1) for (const gg of geos) gg.dispose();
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; this.parent.add(m); out.push(m);
    }
    this.map.clear(); return out;
  }
}

// Отдельный (анимируемый) меш-эллипсоид
export function ball(par, mat, r, x, y, z, sx = 1, sy = 1, sz = 1, w = 12, h = 9) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; par.add(m); return m;
}
// Точка на поверхности эллипсоида e={c:[x,y,z], r:[rx,ry,rz]} в направлении (dx,dy,dz)
export function onEll(e, dx, dy, dz, grow = 1) {
  const l = Math.hypot(dx, dy, dz) || 1;
  return [e.c[0] + e.r[0] * dx / l * grow, e.c[1] + e.r[1] * dy / l * grow, e.c[2] + e.r[2] * dz / l * grow];
}
// Радиусы эллипса на высоте y для эллипсоида (для поясов/ремней)
export function ellAt(e, y, grow = 0) {
  const t = Math.min(0.999, Math.abs(y - e.c[1]) / e.r[1]), k = Math.sqrt(1 - t * t);
  return [e.r[0] * k + grow, e.r[2] * k + grow];
}
