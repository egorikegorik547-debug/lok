// @ts-nocheck
/* ============================================================
   «ГЛУБОКИЕ УРОВНИ» — генеративный dark-ambient для вылазок в сеть бункеров.
   Всё синтезируется в реальном времени через Web Audio, внешних файлов нет:
   • холодный хор из расстроенных пил (Dm7 → Bbmaj7 → Gm7 → Dm(b9) → Cm7),
     аккорды плавно перетекают друг в друга по 40+ секунд;
   • саб-дрон, гул трансформатора 50 Гц с биениями, далёкий вентилятор (вум-вум-вум);
   • ветер в шахтах (розовый шум с медленным дрейфом полосы);
   • редкие события со случайными интервалами: капли воды с эхом, далёкие удары
     по трубам (инхармонические партиалы), стон перенапряжённого металла,
     призрачный «смычковый» тон, глухой подземный удар;
   • слой напряжения: когда Бывшие гонятся за игроком — кластерная диссонансная
     пара и низкая пульсация, плавно нарастающие и затухающие;
   • большая тёмная реверберация, пинг-понг эхо и мастер-компрессор.
   Никакого ритма и мелодии «на переднем плане» — музыка не мешает слышать шаги и рычание.
   ============================================================ */

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a, b) => a + Math.random() * (b - a);
const pickOf = a => a[Math.floor(Math.random() * a.length)];

// аккорды (MIDI): низ — под дроном, середина — хор
const CHORDS = [
  [38, 45, 53, 60],        // Dm7
  [34, 41, 50, 57],        // Bbmaj7 (без терции)
  [31, 38, 46, 53],        // Gm7
  [38, 45, 51, 55],        // Dm(b9) — самый тёмный
  [36, 43, 51, 58],        // Cm7
  [33, 40, 48, 52]         // холодная пустая квинта с малой секстой
];
// ноты «призрачного тона»: D-минор / фригийский оттенок
const GHOST = [62, 65, 69, 72, 74, 77, 70, 63];

let ctx = null, session = null, wantPlay = false, unlockBound = false;
let volume = 0.5, reverbBuf = null, pinkBuf = null, noiseBuf = null, tension = 0;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch (e) { ctx = null; }
  return ctx;
}

function makeBuffers(ac) {
  if (reverbBuf) return;
  const sr = ac.sampleRate;
  // импульс огромного бетонного зала: 7.5 с, тёмный хвост, разные каналы
  const len = Math.floor(sr * 7.5), pre = Math.floor(sr * 0.035);
  reverbBuf = ac.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) {
    const d = reverbBuf.getChannelData(c); let y = 0;
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / (len - pre);
      const a = 0.9 - 0.84 * Math.pow(t, 0.3);
      y += ((Math.random() * 2 - 1) - y) * Math.max(0.045, a);
      d[i] = y * Math.pow(1 - t, 2.7) * (i - pre < 600 ? (i - pre) / 600 : 1) * 2.6;
    }
  }
  noiseBuf = ac.createBuffer(1, sr * 2, sr);
  const n = noiseBuf.getChannelData(0); for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  // розовый шум 6 с (края плавно сведены в ноль — петля без щелчка)
  const pl = sr * 6; pinkBuf = ac.createBuffer(1, pl, sr);
  const p = pinkBuf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < pl; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
    p[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
  }
  const f = Math.floor(sr * 0.4);
  for (let i = 0; i < f; i++) { const k = i / f; p[i] *= k; p[pl - 1 - i] *= k; }
}

/* ------------------------------------------------------------
   Сессия: полный граф узлов. Каждый запуск — новый граф,
   поэтому остановка гарантированно обрывает «хвосты».
   ------------------------------------------------------------ */
function createSession(ac) {
  makeBuffers(ac);
  const S = { ac, alive: true, timer: 0, stopTimer: 0, persistent: [], next: {} };
  const g = (v = 1) => { const n = ac.createGain(); n.gain.value = v; return n; };
  const t0 = ac.currentTime;

  // --- мастер-цепь ---
  S.out = g(0);
  S.vol = g(volume);
  const tone = ac.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 7200; tone.Q.value = 0.3;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -22; comp.knee.value = 16; comp.ratio.value = 3.4; comp.attack.value = 0.03; comp.release.value = 0.45;
  const mix = g(1);
  mix.connect(tone); tone.connect(comp); comp.connect(S.out); S.out.connect(S.vol); S.vol.connect(ac.destination);

  // --- реверберация ---
  const conv = ac.createConvolver(); conv.buffer = reverbBuf;
  const rvIn = g(1), rvOut = g(0.9);
  const rvHP = ac.createBiquadFilter(); rvHP.type = 'highpass'; rvHP.frequency.value = 140;
  const rvLP = ac.createBiquadFilter(); rvLP.type = 'lowpass'; rvLP.frequency.value = 4200;
  rvIn.connect(rvHP); rvHP.connect(rvLP); rvLP.connect(conv); conv.connect(rvOut); rvOut.connect(mix);

  // --- пинг-понг эхо ---
  const dL = ac.createDelay(4), dR = ac.createDelay(4);
  dL.delayTime.value = 1.07; dR.delayTime.value = 1.61;
  const fbL = g(0.42), fbR = g(0.42);
  const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1700;
  const fr = ac.createBiquadFilter(); fr.type = 'lowpass'; fr.frequency.value = 1300;
  const pL = ac.createStereoPanner(), pR = ac.createStereoPanner(); pL.pan.value = -0.7; pR.pan.value = 0.7;
  const dlIn = g(1);
  dlIn.connect(dL); dlIn.connect(dR);
  dL.connect(fl); fl.connect(fbL); fbL.connect(dL); fl.connect(pL); pL.connect(mix); fl.connect(rvIn);
  dR.connect(fr); fr.connect(fbR); fbR.connect(dR); fr.connect(pR); pR.connect(mix);

  // --- шины: [сухой, ревер, эхо] ---
  const bus = (dry, rev, dly) => {
    const b = g(1); const d = g(dry), r = g(rev);
    b.connect(d); d.connect(mix); b.connect(r); r.connect(rvIn);
    if (dly) { const e = g(dly); b.connect(e); e.connect(dlIn); }
    return b;
  };
  S.padBus = bus(0.7, 0.75, 0);
  S.droneBus = bus(1.0, 0.1, 0);
  S.airBus = bus(0.8, 0.4, 0);
  S.dripBus = bus(0.35, 0.95, 0.55);
  S.clankBus = bus(0.3, 1.0, 0.25);
  S.creakBus = bus(0.5, 0.9, 0.2);
  S.ghostBus = bus(0.25, 1.0, 0.7);
  S.boomBus = bus(0.7, 0.8, 0);
  S.tenseBus = bus(0.8, 0.45, 0);

  // --- дрон: корень D1 + квинта, чуть расстроенные, с медленным дрейфом высоты ---
  const drone = (type, midi, v, lp, detune = 0) => {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = mtof(midi); o.detune.value = detune;
    const lf = ac.createBiquadFilter(); lf.type = 'lowpass'; lf.frequency.value = lp;
    const vg = g(v); o.connect(lf); lf.connect(vg); vg.connect(S.droneBus); o.start(t0);
    const l = ac.createOscillator(); l.frequency.value = rnd(0.02, 0.05); const ld = g(5); l.connect(ld); ld.connect(o.detune); l.start(t0);
    S.persistent.push(o, l); return { o, vg };
  };
  drone('sine', 26, 0.22, 200);
  drone('sine', 26, 0.10, 200, 7);
  drone('sine', 33, 0.075, 220, -5);
  S.droneSaw = drone('sawtooth', 38, 0.022, 150);
  drone('triangle', 38, 0.07, 260, 3);       // слышен и на маленьких динамиках

  // --- гул трансформатора 50 Гц (с биениями), еле слышный ---
  const hum = g(1);
  [[50, 0.05], [50.37, 0.04], [100.2, 0.018], [150.4, 0.007], [200.9, 0.003]].forEach(([f, v]) => {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f; const vg = g(v); o.connect(vg); vg.connect(hum); o.start(t0); S.persistent.push(o);
  });
  const humLP = ac.createBiquadFilter(); humLP.type = 'lowpass'; humLP.frequency.value = 420;
  hum.connect(humLP); humLP.connect(S.airBus);
  S.hum = hum;

  // --- шум: рокот вентиляции, ветер в шахте, далёкий вентилятор ---
  const noiseSrc = (type, freq, q, gain, lfoF, lfoD, glfo, gDepth, pan) => {
    const s = ac.createBufferSource(); s.buffer = pinkBuf; s.loop = true; s.playbackRate.value = rnd(0.8, 1.1);
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const v = g(gain);
    if (lfoF) { const o = ac.createOscillator(); o.frequency.value = lfoF; const od = g(lfoD); o.connect(od); od.connect(f.frequency); o.start(t0); S.persistent.push(o); }
    if (glfo) { const o2 = ac.createOscillator(); o2.frequency.value = glfo; const o2d = g(gDepth); o2.connect(o2d); o2d.connect(v.gain); o2.start(t0); S.persistent.push(o2); }
    const pn = ac.createStereoPanner(); pn.pan.value = pan;
    if (!pan) { const o3 = ac.createOscillator(); o3.frequency.value = rnd(0.025, 0.06); const o3d = g(0.6); o3.connect(o3d); o3d.connect(pn.pan); o3.start(t0); S.persistent.push(o3); }
    s.connect(f); f.connect(v); v.connect(pn); pn.connect(S.airBus); s.start(t0, rnd(0, 3)); S.persistent.push(s);
  };
  noiseSrc('lowpass', 130, 0.7, 0.55, 0.031, 40, 0.047, 0.2, 0);         // низкий рокот
  noiseSrc('bandpass', 380, 0.9, 0.11, 0.043, 140, 0.037, 0.07, 0);      // ветер в шахте
  noiseSrc('bandpass', 1150, 2.6, 0.02, 0.061, 380, 0.029, 0.012, 0);    // свист в щелях
  noiseSrc('bandpass', 260, 1.4, 0.075, 0, 0, 0.62, 0.05, -0.55);        // вентилятор, лопасти ~ 0.6 Гц
  noiseSrc('bandpass', 310, 1.2, 0.05, 0, 0, 0.47, 0.035, 0.6);

  // --- слой напряжения (громкость управляется setTension) ---
  const tg = g(0);
  const tLP = ac.createBiquadFilter(); tLP.type = 'lowpass'; tLP.frequency.value = 520; tLP.Q.value = 1.2;
  [[37, 'sawtooth', 0.5, -6], [38, 'sawtooth', 0.5, 9], [44, 'triangle', 0.35, 0]].forEach(([m, ty, v, dt]) => {
    const o = ac.createOscillator(); o.type = ty; o.frequency.value = mtof(m); o.detune.value = dt; const vg = g(v); o.connect(vg); vg.connect(tLP); o.start(t0); S.persistent.push(o);
  });
  tLP.connect(tg); tg.connect(S.tenseBus);
  // пульсация — «сердце» бункера
  const pulse = ac.createOscillator(); pulse.type = 'sine'; pulse.frequency.value = mtof(33);
  const pg = g(0.5), pLfo = ac.createOscillator(), pLd = g(0.5);
  pLfo.type = 'sine'; pLfo.frequency.value = 1.25; pLfo.connect(pLd); pLd.connect(pg.gain);
  const pVol = g(0); pulse.connect(pg); pg.connect(pVol); pVol.connect(S.tenseBus);
  pulse.start(t0); pLfo.start(t0); S.persistent.push(pulse, pLfo);
  S.tenseGain = tg; S.pulseVol = pVol; S.tenseLP = tLP; S.pulseLfo = pLfo;

  // fade-in
  S.out.gain.setValueAtTime(0, t0); S.out.gain.linearRampToValueAtTime(1, t0 + 6);
  // расписание событий: первое событие каждого типа — через некоторое время
  S.next = { chord: t0 + 0.1, drip: t0 + rnd(3, 6), clank: t0 + rnd(10, 18), creak: t0 + rnd(16, 28), ghost: t0 + rnd(12, 22), boom: t0 + rnd(40, 70), flick: t0 + rnd(20, 40) };
  S.chordIdx = Math.floor(rnd(0, CHORDS.length));
  return S;
}

/* ------------------------------------------------------------
   Голоса
   ------------------------------------------------------------ */
function padVoice(S, midi, t, dur, vol, pan) {
  const ac = S.ac, f = mtof(midi);
  const out = ac.createGain();
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.9;
  const peak = rnd(620, 1050);
  lp.frequency.setValueAtTime(190, t); lp.frequency.linearRampToValueAtTime(peak, t + dur * 0.5); lp.frequency.linearRampToValueAtTime(230, t + dur);
  const pn = ac.createStereoPanner(); pn.pan.value = pan;
  const oscs = [];
  for (const s of [-1, 1]) {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = s * rnd(5, 12);
    const og = ac.createGain(); og.gain.value = 0.42; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.2); oscs.push(o);
  }
  const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2; o2.detune.value = rnd(-4, 4);
  const g2 = ac.createGain(); g2.gain.value = 0.2; o2.connect(g2); g2.connect(lp); o2.start(t); o2.stop(t + dur + 0.2);
  // медленное «дыхание» высоты
  const lf = ac.createOscillator(); lf.frequency.value = rnd(0.05, 0.12); const ld = ac.createGain(); ld.gain.value = 4;
  lf.connect(ld); oscs.forEach(o => ld.connect(o.detune)); lf.start(t); lf.stop(t + dur + 0.2);
  lp.connect(out); out.connect(pn); pn.connect(S.padBus);
  const a = Math.min(dur * 0.28, 11), r = Math.min(dur * 0.34, 14);
  out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(vol, t + a); out.gain.setValueAtTime(vol, t + dur - r); out.gain.linearRampToValueAtTime(0, t + dur);
}

function scheduleChord(S, t) {
  let i; do { i = Math.floor(rnd(0, CHORDS.length)); } while (i === S.chordIdx);
  S.chordIdx = i;
  const notes = CHORDS[i], dur = rnd(44, 56);
  notes.forEach((m, k) => padVoice(S, m, t + rnd(0, 2.5), dur, 0.075 - k * 0.006, rnd(-0.6, 0.6)));
  // иногда — дополнительный верхний голос на октаву выше, очень тихо
  if (Math.random() < 0.55) padVoice(S, pickOf(notes) + 12, t + rnd(3, 8), dur * 0.8, 0.022, rnd(-0.8, 0.8));
}

function drip(S, t, vol) {
  const ac = S.ac, o = ac.createOscillator(), g = ac.createGain(), pn = ac.createStereoPanner();
  const f = rnd(750, 1650);
  o.type = 'sine'; o.frequency.setValueAtTime(f * 0.62, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.055);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  pn.pan.value = rnd(-0.85, 0.85);
  o.connect(g); g.connect(pn); pn.connect(S.dripBus); o.start(t); o.stop(t + 0.25);
  // крошечный «плюх» шумом
  const s = ac.createBufferSource(); s.buffer = noiseBuf; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3;
  const sg = ac.createGain(); sg.gain.setValueAtTime(vol * 0.5, t); sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  s.connect(bp); bp.connect(sg); sg.connect(pn); s.start(t, rnd(0, 1), 0.04);
}

function clank(S, t, vol, base) {
  const ac = S.ac, pn = ac.createStereoPanner(); pn.pan.value = rnd(-0.8, 0.8);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = rnd(1400, 2800);
  const out = ac.createGain(); out.gain.value = vol; lp.connect(out); out.connect(pn); pn.connect(S.clankBus);
  const R = [1, 2.32, 3.87, 5.61, 7.9], D = [2.4, 1.6, 1.0, 0.55, 0.3], G = [1, 0.6, 0.42, 0.26, 0.15];
  R.forEach((r, i) => {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = base * r * rnd(0.995, 1.005);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(G[i], t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + D[i]);
    o.connect(g); g.connect(lp); o.start(t); o.stop(t + D[i] + 0.05);
  });
  const s = ac.createBufferSource(); s.buffer = noiseBuf; const hp = ac.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = base * 5; hp.Q.value = 1.2;
  const sg = ac.createGain(); sg.gain.setValueAtTime(0.9, t); sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  s.connect(hp); hp.connect(sg); sg.connect(lp); s.start(t, rnd(0, 1), 0.07);
}

function clankSeq(S, t) {
  const base = rnd(110, 330), n = pickOf([1, 1, 2, 3, 4]);
  let tt = t, v = rnd(0.07, 0.11);
  for (let i = 0; i < n; i++) { clank(S, tt, v, base * (i % 2 ? 1.06 : 1)); tt += rnd(0.45, 1.3); v *= 0.72; }
}

function creak(S, t, vol) {
  const ac = S.ac, dur = rnd(3.2, 6.5), f0 = rnd(62, 120), f1 = f0 * rnd(0.72, 1.4);
  const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur);
  const jit = ac.createOscillator(); jit.type = 'triangle'; jit.frequency.value = rnd(7, 15); const jd = ac.createGain(); jd.gain.value = f0 * 0.07; jit.connect(jd); jd.connect(o.frequency);
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 7; bp.frequency.setValueAtTime(f0 * 4.5, t); bp.frequency.linearRampToValueAtTime(f1 * rnd(3, 8), t + dur);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const pn = ac.createStereoPanner(); pn.pan.value = rnd(-0.8, 0.8);
  o.connect(bp); bp.connect(lp); lp.connect(g); g.connect(pn); pn.connect(S.creakBus);
  o.start(t); jit.start(t); o.stop(t + dur + 0.1); jit.stop(t + dur + 0.1);
}

function ghost(S, t, vol) {
  const ac = S.ac, midi = pickOf(GHOST), f = mtof(midi), dur = rnd(10, 15);
  const pn = ac.createStereoPanner(); pn.pan.value = rnd(-0.7, 0.7);
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 200;
  const vib = ac.createOscillator(); vib.frequency.value = rnd(4.2, 5.4);
  const vd = ac.createGain(); vd.gain.setValueAtTime(0, t); vd.gain.linearRampToValueAtTime(f * 0.006, t + dur * 0.5);
  vib.connect(vd);
  [['sine', 1, 1.0], ['triangle', 1.004, 0.4], ['sine', 2.003, 0.1]].forEach(([ty, m, v]) => {
    const o = ac.createOscillator(); o.type = ty;
    // «заход» на ноту снизу
    o.frequency.setValueAtTime(f * m * 0.97, t); o.frequency.exponentialRampToValueAtTime(f * m, t + 1.6);
    const og = ac.createGain(); og.gain.value = v; vd.connect(o.frequency);
    o.connect(og); og.connect(hp); o.start(t); o.stop(t + dur + 0.1);
  });
  hp.connect(g); g.connect(pn); pn.connect(S.ghostBus);
  vib.start(t); vib.stop(t + dur + 0.1);
}

function boom(S, t, vol) {
  const ac = S.ac;
  const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(66, t); o.frequency.exponentialRampToValueAtTime(27, t + 2.2);
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
  o.connect(g); g.connect(S.boomBus); o.start(t); o.stop(t + 3);
  const s = ac.createBufferSource(); s.buffer = pinkBuf; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(260, t); lp.frequency.exponentialRampToValueAtTime(55, t + 3.2);
  const sg = ac.createGain(); sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(vol * 2.6, t + 0.05); sg.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
  s.connect(lp); lp.connect(sg); sg.connect(S.boomBus); s.start(t, rnd(0, 2), 3.5);
  // следом — металлический отзвук далёкой гермодвери
  clank(S, t + 0.35, vol * 0.45, rnd(55, 85));
}

function tick() {
  const S = session; if (!S || !S.alive) return;
  const ac = S.ac;
  if (ac.state !== 'running') return;
  const now = ac.currentTime, ahead = now + 1.2, N = S.next, k = Math.max(0.4, 1 - tension * 0.6);   // под напряжением случайных звуков меньше
  for (const key of Object.keys(N)) if (N[key] < now - 2) N[key] = now + 0.2;                         // догнали после паузы вкладки
  while (N.chord < ahead) { scheduleChord(S, N.chord); N.chord += rnd(24, 32); }
  while (N.drip < ahead) {
    const t = N.drip; drip(S, t, rnd(0.03, 0.07));
    if (Math.random() < 0.3) drip(S, t + rnd(0.25, 0.7), rnd(0.02, 0.045));
    N.drip += rnd(3, 11) / k;
  }
  while (N.clank < ahead) { clankSeq(S, N.clank); N.clank += rnd(15, 40) / k; }
  while (N.creak < ahead) { creak(S, N.creak, rnd(0.04, 0.075)); N.creak += rnd(22, 55) / k; }
  while (N.ghost < ahead) { ghost(S, N.ghost, rnd(0.022, 0.04) * (1 - tension * 0.5)); N.ghost += rnd(18, 42); }
  while (N.boom < ahead) { boom(S, N.boom, rnd(0.13, 0.22)); N.boom += rnd(55, 120); }
  while (N.flick < ahead) {              // «моргнула» сеть: гул проседает на долю секунды
    const t = N.flick; S.hum.gain.setValueAtTime(1, t); S.hum.gain.linearRampToValueAtTime(0.15, t + 0.04); S.hum.gain.linearRampToValueAtTime(1, t + rnd(0.2, 0.7));
    N.flick += rnd(25, 70);
  }
}

/* ------------------------------------------------------------
   Публичный API
   ------------------------------------------------------------ */
function bindUnlock() {
  if (unlockBound) return; unlockBound = true;
  const h = () => { if (!wantPlay || !ctx) return; if (ctx.state !== 'running') ctx.resume().catch(() => {}); };
  for (const ev of ['pointerdown', 'keydown', 'touchend', 'mousedown']) addEventListener(ev, h, { capture: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) h(); });
}

function applyTension() {
  const S = session; if (!S || !S.alive) return;
  const t = S.ac.currentTime, v = tension;
  S.tenseGain.gain.setTargetAtTime(v * 0.1, t, 0.9);
  S.pulseVol.gain.setTargetAtTime(v * 0.34, t, 0.9);
  S.tenseLP.frequency.setTargetAtTime(380 + v * 700, t, 1.2);
  S.pulseLfo.frequency.setTargetAtTime(1.1 + v * 1.1, t, 1.5);
  S.droneSaw.vg.gain.setTargetAtTime(0.022 + v * 0.05, t, 1.5);
}

export const bunkerAmbient = {
  get playing() { return !!session && session.alive; },
  start() {
    wantPlay = true; bindUnlock();
    if (session && session.alive) {
      const t = ctx.currentTime; session.out.gain.cancelScheduledValues(t); session.out.gain.setValueAtTime(session.out.gain.value, t); session.out.gain.linearRampToValueAtTime(1, t + 2);
      if (session.stopTimer) { clearTimeout(session.stopTimer); session.stopTimer = 0; }
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      return;
    }
    const ac = ensureCtx(); if (!ac) return;
    try { session = createSession(ac); } catch (e) { console.warn('ambient init failed', e); session = null; return; }
    session.timer = setInterval(tick, 300);
    if (ac.state !== 'running') ac.resume().catch(() => {});
    applyTension(); tick();
  },
  stop(fade = 2.5) {
    wantPlay = false;
    const S = session; if (!S || !S.alive) return;
    const ac = S.ac, t = ac.currentTime;
    S.out.gain.cancelScheduledValues(t); S.out.gain.setValueAtTime(S.out.gain.value, t); S.out.gain.linearRampToValueAtTime(0, t + fade);
    clearInterval(S.timer);
    S.stopTimer = setTimeout(() => {
      for (const n of S.persistent) { try { n.stop(); } catch (e) {} }
      try { S.vol.disconnect(); } catch (e) {}
      if (session === S) session = null;
    }, fade * 1000 + 200);
    S.alive = false;
  },
  setVolume(v) {
    volume = v;
    if (session && session.vol) session.vol.gain.setTargetAtTime(v, session.ac.currentTime, 0.05);
  },
  /** 0…1 — насколько близка опасность (погоня Бывших) */
  setTension(v) {
    v = Math.max(0, Math.min(1, v));
    if (Math.abs(v - tension) < 0.02) return;
    tension = v; applyTension();
  }
};
