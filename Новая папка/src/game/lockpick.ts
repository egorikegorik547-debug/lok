// @ts-nocheck
/* ============================================================
   Взлом отмычкой — в духе Mafia II.
   Отмычка вставлена в замок и поворачивается влево-вправо (мышь по полю замка или A / D / ← →).
   У каждого штифта есть скрытое «чувствительное» положение: рядом с ним отмычка дрожит и слышно частые щелчки.
   Найдите положение и УДЕРЖИВАЙТЕ Пробел / ЛКМ — штифт встанет на место. Нажим вне положения перегружает отмычку:
   шкала нагрузки растёт, и отмычка ломается (тратится 1 шт.). Все штифты на месте — замок открыт.
   ============================================================ */
const TAU = Math.PI * 2, MAXA = 80 * Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = id => document.getElementById(id);
const ACC = { safeS: '#aab4be', safeM: '#9aa3b4', safeG: '#ffd34a', armyLocker: '#a9c46a' };

let S = null, raf = 0, lastT = 0;

export const lockpickActive = () => !!S;

function newSweets() {
  S.sweet = []; let prev = 9;
  for (let i = 0; i < S.pins; i++) {
    let v, tries = 0;
    do { v = (Math.random() * 2 - 1) * 0.82; } while (Math.abs(v - prev) < 0.32 && ++tries < 30);
    S.sweet.push(v); prev = v;
  }
  S.idx = 0; S.prog = 0; S.strain = 0;
}

export function startLockpick(o) {
  // o: { kind, name, rarity, pins, tol, picks, hasKey, snd, onSuccess(), onKey(), onBreak(left), onClose() }
  if (S) return;
  const cv = $('pickCv'), dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = 560 * dpr; cv.height = 430 * dpr;
  S = { o, pins: o.pins, tol: o.tol, picks: o.picks, ang: 0, target: 0, hold: false, left: false, right: false, t: 0, shake: 0, snapT: 0, lastTick: 0, lastScrape: 0, okT: 0, cv, dpr, acc: ACC[o.kind] || '#aab4be', close: 0 };
  newSweets();
  $('pickTitle').textContent = o.name;
  $('pickTier').textContent = `${o.rarity} · штифтов: ${o.pins}`;
  $('pickTier').style.color = S.acc;
  $('pickKeyBtn').classList.toggle('off', !o.hasKey);
  info();
  $('scr-pick').classList.remove('off');
  lastT = performance.now(); raf = requestAnimationFrame(loop);
}
function info() {
  $('pickInfo').innerHTML = `Отмычек: <b style="color:${S.picks > 1 ? '#8dffb8' : '#ffb27a'}">${S.picks}</b>`;
}
export function closeLockpick(silent) {
  if (!S) return;
  cancelAnimationFrame(raf);
  const o = S.o; S = null;
  $('scr-pick').classList.add('off');
  if (!silent && o.onClose) o.onClose();
}

/* ---------- ввод ---------- */
export function lockpickKeyDown(e) {
  if (!S) return;
  e.preventDefault();
  if (e.code === 'Escape') { closeLockpick(); return; }
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') S.left = true;
  else if (e.code === 'KeyD' || e.code === 'ArrowRight') S.right = true;
  else if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') S.hold = true;
  else if (e.code === 'KeyK' && S.o.hasKey) useKey();
}
export function lockpickKeyUp(e) {
  if (!S) return;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') S.left = false;
  else if (e.code === 'KeyD' || e.code === 'ArrowRight') S.right = false;
  else if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') S.hold = false;
}
function useKey() { if (!S || !S.o.hasKey) return; const o = S.o; closeLockpick(true); o.onKey(); }
export function initLockpickUI() {
  const cv = $('pickCv'), ov = $('scr-pick');
  const move = e => { if (!S) return; const r = cv.getBoundingClientRect(); S.target = clamp((e.clientX - r.left - r.width / 2) / (r.width * 0.36), -1, 1); };
  ov.addEventListener('pointermove', move);
  cv.addEventListener('pointerdown', e => { if (!S || e.button !== 0) return; move(e); S.hold = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  const up = () => { if (S) S.hold = false; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); addEventListener('blur', up);
  $('pickCancel').onclick = () => closeLockpick();
  $('pickKeyBtn').onclick = useKey;
  ov.addEventListener('contextmenu', e => e.preventDefault());
}

/* ---------- логика ---------- */
function loop(now) {
  if (!S) return;
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; S.t += dt;
  const s = S, snd = s.o.snd;
  if (s.okT > 0) {   // замок открыт — короткая пауза со вспышкой
    s.okT -= dt; draw();
    if (s.okT <= 0) { const o = s.o; closeLockpick(true); o.onSuccess(); }
    return;
  }
  if (s.snapT > 0) {  // отмычка сломалась
    s.snapT -= dt; draw();
    if (s.snapT <= 0) {
      s.picks--; s.hold = false; s.o.onBreak(s.picks);
      if (s.picks <= 0) { const o = s.o; closeLockpick(true); o.onClose(true); return; }
      newSweets(); info();
    }
    return;
  }
  s.target = clamp(s.target + ((s.right ? 1 : 0) - (s.left ? 1 : 0)) * 1.35 * dt, -1, 1);
  s.ang += (s.target - s.ang) * Math.min(1, dt * 16);
  const d = Math.abs(s.ang - s.sweet[s.idx]);
  s.close = clamp(1 - d / 0.4, 0, 1);
  if (s.hold) {
    if (d < s.tol) {
      s.prog += dt / 0.55; s.strain = Math.max(0, s.strain - dt * 0.6);
      if (s.prog >= 1) {
        s.prog = 0; s.idx++; snd.set(s.idx, s.pins);
        if (s.idx >= s.pins) { s.okT = 0.55; snd.open(); }
      }
    } else {
      s.prog = Math.max(0, s.prog - dt * 3);
      s.strain += dt * (0.7 + 1.5 * Math.min(1, d * 1.2));
      if (s.t - s.lastScrape > 0.11) { s.lastScrape = s.t; snd.scrape(s.strain); }
      if (s.strain >= 1) { s.strain = 1; s.snapT = 0.55; snd.snap(); }
    }
  } else {
    s.prog = Math.max(0, s.prog - dt * 2); s.strain = Math.max(0, s.strain - dt * 1.3);
  }
  if (s.close > 0.12 && s.t - s.lastTick > 0.34 - 0.26 * s.close) { s.lastTick = s.t; snd.tick(s.close); }
  s.shake = s.close * 0.016 + s.strain * 0.05 + (s.hold && d < s.tol ? 0.012 : 0);
  draw();
}

/* ---------- отрисовка ---------- */
function draw() {
  const s = S, c = s.cv, x = c.getContext('2d'), W = 560, H = 430, cx = W / 2, cy = 232, R = 168;
  x.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); x.clearRect(0, 0, W, H);
  const jx = s.strain > 0.3 ? (Math.random() - 0.5) * s.strain * 4 : 0, jy = s.strain > 0.3 ? (Math.random() - 0.5) * s.strain * 4 : 0;
  x.save(); x.translate(jx, jy);
  // лампочки штифтов
  const gap = 38, x0 = cx - (s.pins - 1) * gap / 2;
  for (let i = 0; i < s.pins; i++) {
    const px = x0 + i * gap, py = 34, done = i < s.idx, cur = i === s.idx;
    x.beginPath(); x.arc(px, py, 11, 0, TAU);
    x.fillStyle = done ? '#3dff8a' : '#15191c'; x.shadowColor = done ? '#3dff8a' : 'transparent'; x.shadowBlur = done ? 14 : 0; x.fill(); x.shadowBlur = 0;
    x.lineWidth = 2; x.strokeStyle = cur ? s.acc : 'rgba(255,255,255,.22)'; if (cur) { x.globalAlpha = 0.6 + 0.4 * Math.sin(s.t * 6); } x.stroke(); x.globalAlpha = 1;
  }
  // корпус замка
  let g = x.createRadialGradient(cx - 40, cy - 50, 20, cx, cy, R + 12);
  g.addColorStop(0, '#4b535a'); g.addColorStop(0.7, '#2a3035'); g.addColorStop(1, '#14181b');
  x.beginPath(); x.arc(cx, cy, R + 10, 0, TAU); x.fillStyle = g; x.fill();
  x.lineWidth = 4; x.strokeStyle = s.acc; x.globalAlpha = 0.55; x.stroke(); x.globalAlpha = 1;
  x.beginPath(); x.arc(cx, cy, R - 6, 0, TAU); x.fillStyle = '#0d1012'; x.fill();
  x.lineWidth = 1.5; x.strokeStyle = 'rgba(255,255,255,.12)'; x.stroke();
  // шкала углов (положение скрыто)
  for (let a = -80; a <= 80; a += 10) {
    const r = a * Math.PI / 180, big = a % 40 === 0, r1 = R - 12, r2 = R - (big ? 32 : 24);
    x.beginPath(); x.moveTo(cx + Math.sin(r) * r1, cy - Math.cos(r) * r1); x.lineTo(cx + Math.sin(r) * r2, cy - Math.cos(r) * r2);
    x.lineWidth = big ? 3 : 1.5; x.strokeStyle = big ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.25)'; x.stroke();
  }
  // подсветка текущего положения отмычки на шкале
  const th = s.ang * MAXA;
  x.beginPath(); x.arc(cx, cy, R - 40, -Math.PI / 2 + th - 0.05, -Math.PI / 2 + th + 0.05);
  x.lineWidth = 6; x.strokeStyle = s.acc; x.globalAlpha = 0.35; x.stroke(); x.globalAlpha = 1;
  // прогресс текущего штифта
  if (s.prog > 0) {
    x.beginPath(); x.arc(cx, cy, 50, -Math.PI / 2, -Math.PI / 2 + TAU * s.prog);
    x.lineWidth = 7; x.lineCap = 'round'; x.strokeStyle = '#3dff8a'; x.shadowColor = '#3dff8a'; x.shadowBlur = 12; x.stroke(); x.shadowBlur = 0; x.lineCap = 'butt';
  }
  // сердцевина с замочной скважиной
  g = x.createRadialGradient(cx - 10, cy - 12, 4, cx, cy, 42);
  g.addColorStop(0, '#7b858d'); g.addColorStop(1, '#2b3136');
  x.beginPath(); x.arc(cx, cy, 40, 0, TAU); x.fillStyle = g; x.fill(); x.lineWidth = 2; x.strokeStyle = '#0a0c0d'; x.stroke();
  x.fillStyle = '#050708'; x.beginPath(); x.arc(cx, cy - 6, 9, 0, TAU); x.fill(); x.fillRect(cx - 4, cy - 4, 8, 24);
  // натяжной ключ (статичный)
  x.strokeStyle = '#8d97a0'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - 8, cy + 14); x.lineTo(cx - 62, cy + 14); x.lineTo(cx - 62, cy + 70); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx - 8, cy + 12); x.lineTo(cx - 62, cy + 12); x.stroke();
  // отмычка
  const rot = th + (Math.random() - 0.5) * 2 * s.shake;
  x.save(); x.translate(cx, cy); x.rotate(rot);
  if (s.snapT > 0) {
    const k = 1 - s.snapT / 0.55;
    x.strokeStyle = '#cfd6dc'; x.lineWidth = 5; x.beginPath(); x.moveTo(0, 60); x.lineTo(0, -62); x.stroke();
    x.save(); x.translate(18 * k, -62 - 40 * k + 160 * k * k); x.rotate(0.9 * k);
    x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -R + 60); x.lineTo(9, -R + 52); x.stroke(); x.restore();
  } else {
    const hot = s.strain;
    g = x.createLinearGradient(-3, 0, 3, 0); g.addColorStop(0, '#e9eef2'); g.addColorStop(1, hot > 0.5 ? '#e8a090' : '#8e98a1');
    x.strokeStyle = g; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, 20); x.lineTo(0, -R + 12); x.lineTo(10, -R + 3); x.stroke();
    x.strokeStyle = '#c99a3c'; x.lineWidth = 11; x.beginPath(); x.moveTo(0, 22); x.lineTo(0, 78); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-2, 26); x.lineTo(-2, 74); x.stroke();
  }
  x.restore();
  // шкала нагрузки отмычки
  const bw = 300, by = 412;
  x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(cx - bw / 2, by, bw, 10);
  x.fillStyle = s.strain > 0.7 ? '#ff4a3a' : s.strain > 0.4 ? '#ffb23a' : '#7be39a'; x.fillRect(cx - bw / 2, by, bw * s.strain, 10);
  x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = 1; x.strokeRect(cx - bw / 2, by, bw, 10);
  x.fillStyle = 'rgba(255,255,255,.55)'; x.font = '11px sans-serif'; x.textAlign = 'center'; x.fillText('НАГРУЗКА ОТМЫЧКИ', cx, by - 5);
  x.restore();
  // эффекты: слом и открытие
  if (s.snapT > 0) { x.fillStyle = `rgba(255,40,20,${0.25 * (s.snapT / 0.55)})`; x.fillRect(0, 0, W, H); x.fillStyle = '#ff9a8a'; x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; x.fillText('ОТМЫЧКА СЛОМАЛАСЬ', cx, cy - 4); }
  if (s.okT > 0) { x.fillStyle = `rgba(80,255,150,${0.35 * (s.okT / 0.55)})`; x.fillRect(0, 0, W, H); x.fillStyle = '#b8ffd2'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.fillText('ЗАМОК ОТКРЫТ', cx, cy + 6); }
}
export const __lockpickState = () => S;
