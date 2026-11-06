// @ts-nocheck
/* ============================================================
   «ПЕПЕЛ НАД УБЕЖИЩЕМ» — генеративный постапокалиптический саундтрек главного меню.
   Всё синтезируется в реальном времени через Web Audio (внешних файлов нет):
   • тёмные детюненные пады (ре минор) с медленно открывающимся фильтром;
   • глубокий дрон и саб-бас, ветер пустоши, потрескивание дозиметра;
   • музыкальная шкатулка/«электропиано» с пинг-понг-эхо;
   • одинокий смычковый лид с вибрато;
   • тяжёлые тайко-удары, металлический лязг труб, нарастающие свеллы;
   • большая алгоритмическая реверберация и мастер-компрессор.
   Композиция идёт циклом из 4 проходов с нарастающей и спадающей плотностью.
   ============================================================ */

const BPM = 58;
const BEAT = 60 / BPM;
const CHORD_BEATS = 8;
const LOOP_CHORDS = 4;

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a, b) => a + Math.random() * (b - a);
const pickOf = a => a[Math.floor(Math.random() * a.length)];

// Dm9 → Bbmaj7 → Gm(add9) → A7
const CHORDS = [
  { root: 38, notes: [50, 53, 57, 60, 64], mel: [74, 76, 77, 81, 72, 69], arp: [57, 60, 64, 65, 69, 72, 76] },
  { root: 34, notes: [53, 58, 62, 65, 69], mel: [74, 77, 81, 69, 72, 65], arp: [58, 62, 65, 69, 70, 74, 77] },
  { root: 31, notes: [55, 58, 62, 65, 69], mel: [74, 70, 79, 81, 77, 67], arp: [55, 58, 62, 67, 69, 74, 77] },
  { root: 33, notes: [52, 57, 61, 64, 67], mel: [73, 76, 79, 69, 81, 71], arp: [57, 61, 64, 67, 69, 73, 76] }
];
// плотность слоёв по проходам цикла
const LAYERS = [
  { arp: 0.0, drum: 0.0, mel: 0.5, pulse: 0.0 },
  { arp: 1.0, drum: 0.35, mel: 0.6, pulse: 1.0 },
  { arp: 1.0, drum: 1.0, mel: 0.9, pulse: 1.0 },
  { arp: 0.45, drum: 0.3, mel: 0.45, pulse: 0.5 }
];

let ctx = null, session = null, wantPlay = false, unlockBound = false;
let volume = 0.6, reverbBuf = null, noiseBuf = null, pinkBuf = null;

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
  // импульс большого холодного зала: тёмный хвост, 5.5 с
  const len = Math.floor(sr * 5.5), pre = Math.floor(sr * 0.028);
  reverbBuf = ac.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) {
    const d = reverbBuf.getChannelData(c); let y = 0;
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / (len - pre);
      const a = 0.88 - 0.8 * Math.pow(t, 0.35);                  // хвост темнеет
      y += ((Math.random() * 2 - 1) - y) * Math.max(0.06, a);
      d[i] = y * Math.pow(1 - t, 3.1) * (i - pre < 400 ? (i - pre) / 400 : 1) * 2.4;
    }
  }
  noiseBuf = ac.createBuffer(1, sr * 2, sr);
  const n = noiseBuf.getChannelData(0); for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  // розовый шум для ветра (4 с, зациклен без щелчка — плавные края)
  const pl = sr * 4; pinkBuf = ac.createBuffer(1, pl, sr);
  const p = pinkBuf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < pl; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
    p[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
  }
  const f = Math.floor(sr * 0.25);
  for (let i = 0; i < f; i++) { const k = i / f; p[i] *= k; p[pl - 1 - i] *= k; }
}

/* ------------------------------------------------------------
   Сессия: полный граф узлов. Каждый запуск — новый граф,
   поэтому остановка гарантированно обрывает «хвосты».
   ------------------------------------------------------------ */
function createSession(ac) {
  makeBuffers(ac);
  const S = { ac, alive: true, timer: 0, persistent: [], beat: 0, nextT: 0, melNext: 2, crackleT: 0 };

  const g = (v = 1) => { const n = ac.createGain(); n.gain.value = v; return n; };

  // --- мастер-цепь ---
  S.out = g(0);                                                   // fade
  S.vol = g(volume);
  const tone = ac.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 9500; tone.Q.value = 0.4;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 3.2; comp.attack.value = 0.02; comp.release.value = 0.35;
  const mix = g(1);
  mix.connect(tone); tone.connect(comp); comp.connect(S.out); S.out.connect(S.vol); S.vol.connect(ac.destination);

  // --- реверберация ---
  const conv = ac.createConvolver(); conv.buffer = reverbBuf;
  const rvIn = g(1), rvOut = g(0.85);
  const rvHP = ac.createBiquadFilter(); rvHP.type = 'highpass'; rvHP.frequency.value = 180;
  rvIn.connect(rvHP); rvHP.connect(conv); conv.connect(rvOut); rvOut.connect(mix);

  // --- пинг-понг эхо ---
  const dL = ac.createDelay(2), dR = ac.createDelay(2);
  dL.delayTime.value = BEAT * 0.75; dR.delayTime.value = BEAT;
  const fbL = g(0.4), fbR = g(0.4);
  const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1900;
  const fr = ac.createBiquadFilter(); fr.type = 'lowpass'; fr.frequency.value = 1500;
  const pL = ac.createStereoPanner(), pR = ac.createStereoPanner(); pL.pan.value = -0.65; pR.pan.value = 0.65;
  const dlIn = g(1);
  dlIn.connect(dL); dlIn.connect(dR);
  dL.connect(fl); fl.connect(fbL); fbL.connect(dL); fl.connect(pL); pL.connect(mix); fl.connect(rvIn);
  dR.connect(fr); fr.connect(fbR); fbR.connect(dR); fr.connect(pR); pR.connect(mix);

  // --- шины инструментов: [сухой, ревер, эхо] ---
  const bus = (dry, rev, dly) => {
    const b = g(1); const d = g(dry), r = g(rev), e = g(dly);
    b.connect(d); d.connect(mix); b.connect(r); r.connect(rvIn); b.connect(e); e.connect(dlIn);
    return b;
  };
  S.padBus = bus(0.55, 0.55, 0.0);
  S.droneBus = bus(0.9, 0.12, 0);
  S.pluckBus = bus(0.5, 0.55, 0.7);
  S.leadBus = bus(0.45, 0.8, 0.4);
  S.drumBus = bus(0.85, 0.35, 0);
  S.fxBus = bus(0.5, 0.8, 0.1);
  S.windBus = bus(0.7, 0.35, 0);
  S.tickBus = bus(0.5, 0.5, 0.15);

  // --- ветер пустоши (постоянный) ---
  const windSrc = (freq, q, gain, lfoF, lfoD, glfo, type = 'bandpass') => {
    const s = ac.createBufferSource(); s.buffer = pinkBuf; s.loop = true; s.playbackRate.value = rnd(0.85, 1.1);
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const o = ac.createOscillator(); o.frequency.value = lfoF; const od = g(lfoD); o.connect(od); od.connect(f.frequency);
    const v = g(gain); const o2 = ac.createOscillator(); o2.frequency.value = glfo; const o2d = g(gain * 0.7); o2.connect(o2d); o2d.connect(v.gain);
    const pn = ac.createStereoPanner(); pn.pan.value = rnd(-0.6, 0.6);
    const o3 = ac.createOscillator(); o3.frequency.value = rnd(0.03, 0.08); const o3d = g(0.7); o3.connect(o3d); o3d.connect(pn.pan);
    s.connect(f); f.connect(v); v.connect(pn); pn.connect(S.windBus);
    s.start(); o.start(); o2.start(); o3.start();
    S.persistent.push(s, o, o2, o3);
  };
  windSrc(420, 0.7, 0.08, 0.055, 220, 0.043);
  windSrc(900, 1.3, 0.04, 0.071, 400, 0.031);
  windSrc(2300, 5, 0.012, 0.047, 700, 0.057);                       // тонкий свист в щелях

  // --- вечный дрон (две расстроенные квинты, очень низко) ---
  const dr = (type, f, v) => {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = f;
    const l = ac.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = 160;
    const vg = g(v); o.connect(l); l.connect(vg); vg.connect(S.droneBus); o.start(); S.persistent.push(o); return o;
  };
  S.droneA = dr('sine', mtof(26), 0.30);
  S.droneB = dr('triangle', mtof(26) * 1.003, 0.10);
  S.droneC = dr('sawtooth', mtof(38), 0.025);

  // fade-in
  const t0 = ac.currentTime;
  S.out.gain.cancelScheduledValues(t0); S.out.gain.setValueAtTime(0, t0); S.out.gain.linearRampToValueAtTime(1, t0 + 5);
  S.nextT = t0 + 0.15;
  return S;
}

/* ------------------------------------------------------------
   Голоса
   ------------------------------------------------------------ */
function voicePad(S, freq, t, dur, vol) {
  const ac = S.ac, end = t + dur;
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.9;
  f.frequency.setValueAtTime(320, t);
  f.frequency.linearRampToValueAtTime(1500 + freq * 0.8, t + dur * 0.55);
  f.frequency.linearRampToValueAtTime(420, end + 2.5);
  const v = ac.createGain();
  v.gain.setValueAtTime(0.0001, t); v.gain.setTargetAtTime(vol, t, 1.1);
  v.gain.setTargetAtTime(0.0001, end, 1.3);
  const lfo = ac.createOscillator(); lfo.frequency.value = rnd(0.12, 0.3);
  const ld = ac.createGain(); ld.gain.value = 5; lfo.connect(ld);
  for (const det of [-11, -3, 4, 12]) {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = det;
    ld.connect(o.detune);
    const og = ac.createGain(); og.gain.value = 0.26; o.connect(og); og.connect(f);
    o.start(t); o.stop(end + 7);
  }
  const sub = ac.createOscillator(); sub.type = 'triangle'; sub.frequency.value = freq / 2;
  const sg = ac.createGain(); sg.gain.value = 0.4; sub.connect(sg); sg.connect(f); sub.start(t); sub.stop(end + 7);
  lfo.start(t); lfo.stop(end + 7);
  f.connect(v); v.connect(S.padBus);
}

function voiceBass(S, root, t, dur) {
  const ac = S.ac;
  const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(root - 12 + 12);
  const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = mtof(root);
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
  const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.setTargetAtTime(0.42, t, 0.7); v.gain.setTargetAtTime(0.0001, t + dur, 0.9);
  const v2 = ac.createGain(); v2.gain.value = 0.35; o2.connect(v2); v2.connect(f);
  o.connect(f); f.connect(v); v.connect(S.droneBus);
  o.start(t); o.stop(t + dur + 5); o2.start(t); o2.stop(t + dur + 5);
  // дрон следует за тональностью аккорда
  const k = mtof(root - 12);
  for (const [nd, mul] of [[S.droneA, 1], [S.droneB, 1.003]]) {
    nd.frequency.cancelScheduledValues(t); nd.frequency.setTargetAtTime(k * mul, t, 2.5);
  }
  S.droneC.frequency.cancelScheduledValues(t); S.droneC.frequency.setTargetAtTime(mtof(root), t, 2.5);
}

// музыкальная шкатулка / электропиано
function voicePluck(S, midi, t, vol, pan = 0) {
  const ac = S.ac, f0 = mtof(midi);
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.9); f.Q.value = 0.5;
  const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(vol, t + 0.006); v.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
  const pn = ac.createStereoPanner(); pn.pan.value = pan;
  const parts = [[1, 'triangle', 1], [2, 'sine', 0.38], [3.01, 'sine', 0.12], [4.2, 'sine', 0.05]];
  for (const [m, type, a] of parts) {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = f0 * m;
    const og = ac.createGain(); og.gain.setValueAtTime(a, t); if (m > 1.5) og.gain.exponentialRampToValueAtTime(a * 0.05, t + 0.6);
    o.connect(og); og.connect(f); o.start(t); o.stop(t + 2.6);
  }
  f.connect(v); v.connect(pn); pn.connect(S.pluckBus);
}

// одинокий смычок
function voiceLead(S, midi, t, dur, vol) {
  const ac = S.ac, f0 = mtof(midi), end = t + dur;
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1900, t + Math.min(0.9, dur * 0.5)); f.frequency.linearRampToValueAtTime(700, end + 0.8);
  const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(vol, t + 0.45); v.gain.setValueAtTime(vol, end - 0.1); v.gain.setTargetAtTime(0.0001, end, 0.5);
  const vib = ac.createOscillator(); vib.frequency.value = 5.1; const vd = ac.createGain();
  vd.gain.setValueAtTime(0, t); vd.gain.linearRampToValueAtTime(11, t + 1.2); vib.connect(vd);
  for (const det of [-7, 6]) {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f0; o.detune.value = det; vd.connect(o.detune);
    const og = ac.createGain(); og.gain.value = 0.5; o.connect(og); og.connect(f); o.start(t); o.stop(end + 3);
  }
  const o8 = ac.createOscillator(); o8.type = 'sine'; o8.frequency.value = f0 / 2; const g8 = ac.createGain(); g8.gain.value = 0.5; o8.connect(g8); g8.connect(f); o8.start(t); o8.stop(end + 3);
  vib.start(t); vib.stop(end + 3);
  // «шорох смычка»
  const n = ac.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
  const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = f0 * 2; nf.Q.value = 3;
  const ng = ac.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(0.06, t + 0.3); ng.gain.setTargetAtTime(0.0001, end, 0.3);
  n.connect(nf); nf.connect(ng); ng.connect(f); n.start(t); n.stop(end + 2);
  f.connect(v); v.connect(S.leadBus);
}

function voiceTaiko(S, t, vol, pitch = 1) {
  const ac = S.ac;
  const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(130 * pitch, t); o.frequency.exponentialRampToValueAtTime(38 * pitch, t + 0.28);
  const v = ac.createGain(); v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  o.connect(v); v.connect(S.drumBus); o.start(t); o.stop(t + 1.2);
  const n = ac.createBufferSource(); n.buffer = noiseBuf;
  const nf = ac.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 420 * pitch;
  const nv = ac.createGain(); nv.gain.setValueAtTime(vol * 0.55, t); nv.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  n.connect(nf); nf.connect(nv); nv.connect(S.drumBus); n.start(t, rnd(0, 1)); n.stop(t + 0.2);
}

// удар по ржавой трубе / листу металла
function voiceClank(S, t, vol) {
  const ac = S.ac, base = rnd(380, 620);
  const v = ac.createGain(); v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
  const pn = ac.createStereoPanner(); pn.pan.value = rnd(-0.5, 0.5);
  for (const [m, a, d] of [[1, 1, 2.0], [2.76, 0.7, 1.3], [5.4, 0.45, 0.8], [8.93, 0.25, 0.45]]) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = base * m;
    const og = ac.createGain(); og.gain.setValueAtTime(a, t); og.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(og); og.connect(v); o.start(t); o.stop(t + d + 0.1);
  }
  const n = ac.createBufferSource(); n.buffer = noiseBuf;
  const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = base * 3.2; nf.Q.value = 6;
  const ng = ac.createGain(); ng.gain.setValueAtTime(0.9, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  n.connect(nf); nf.connect(ng); ng.connect(v); n.start(t, rnd(0, 1)); n.stop(t + 0.12);
  v.connect(pn); pn.connect(S.fxBus);
}

// нарастающий свелл (шум + тон)
function voiceSwell(S, t, dur, vol) {
  const ac = S.ac;
  const n = ac.createBufferSource(); n.buffer = pinkBuf; n.loop = true;
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
  f.frequency.setValueAtTime(260, t); f.frequency.exponentialRampToValueAtTime(5200, t + dur);
  const v = ac.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vol, t + dur * 0.97); v.gain.linearRampToValueAtTime(0, t + dur + 0.05);
  n.connect(f); f.connect(v); v.connect(S.fxBus); n.start(t); n.stop(t + dur + 0.2);
}

// глухой «удар» на начало цикла
function voiceImpact(S, t, vol) {
  const ac = S.ac;
  const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(26, t + 2.4);
  const v = ac.createGain(); v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
  o.connect(v); v.connect(S.fxBus); o.start(t); o.stop(t + 3.3);
  const n = ac.createBufferSource(); n.buffer = noiseBuf;
  const nf = ac.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.setValueAtTime(900, t); nf.frequency.exponentialRampToValueAtTime(90, t + 1.4);
  const nv = ac.createGain(); nv.gain.setValueAtTime(vol * 0.6, t); nv.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  n.connect(nf); nf.connect(nv); nv.connect(S.fxBus); n.start(t, rnd(0, 1)); n.stop(t + 1.7);
}

// щелчок дозиметра
function voiceTick(S, t) {
  const ac = S.ac;
  const n = ac.createBufferSource(); n.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = rnd(2400, 4200);
  const v = ac.createGain(); const a = rnd(0.02, 0.07);
  v.gain.setValueAtTime(a, t); v.gain.exponentialRampToValueAtTime(0.0001, t + rnd(0.004, 0.012));
  const pn = ac.createStereoPanner(); pn.pan.value = rnd(-0.9, 0.9);
  n.connect(f); f.connect(v); v.connect(pn); pn.connect(S.tickBus); n.start(t, rnd(0, 1.5)); n.stop(t + 0.03);
}

/* ------------------------------------------------------------
   Секвенсор
   ------------------------------------------------------------ */
function scheduleBeat(S, beat, t) {
  const bi = beat % CHORD_BEATS;
  const chordIdx = Math.floor(beat / CHORD_BEATS) % LOOP_CHORDS;
  const loopIdx = Math.floor(beat / (CHORD_BEATS * LOOP_CHORDS)) % 4;
  const L = LAYERS[loopIdx], ch = CHORDS[chordIdx];
  const beatInLoop = beat % (CHORD_BEATS * LOOP_CHORDS);

  if (bi === 0) {
    const dur = CHORD_BEATS * BEAT;
    ch.notes.forEach((m, i) => voicePad(S, mtof(m), t + i * 0.09, dur + 0.4, 0.075 - i * 0.004));
    voiceBass(S, ch.root, t, dur);
    if (chordIdx === 0) voiceImpact(S, t, loopIdx % 2 === 0 ? 0.6 : 0.4);
  }

  // арпеджио 8-ми (музыкальная шкатулка)
  if (L.arp > 0) {
    const pat = [0, 2, 4, 2, 5, 3, 6, 4];                         // индексы в ch.arp
    for (let h = 0; h < 2; h++) {
      const step = (bi * 2 + h) % 8;
      if (Math.random() < L.arp * 0.82) {
        const m = ch.arp[pat[step] % ch.arp.length] + (step === 6 && Math.random() < 0.3 ? 12 : 0);
        voicePluck(S, m, t + h * BEAT / 2 + rnd(0, 0.012), (h ? 0.05 : 0.07) * (0.8 + L.arp * 0.3), (step % 4 - 1.5) * 0.28);
      }
    }
  }

  // ударные
  if (L.drum > 0) {
    if (bi % 4 === 0) voiceTaiko(S, t, 0.85 * L.drum, 1);
    if (bi % 4 === 2) voiceTaiko(S, t + 0.01, 0.5 * L.drum, 1.25);
    if (loopIdx === 2 && bi % 4 === 3) voiceTaiko(S, t + BEAT * 0.5, 0.32, 1.6);
    if (bi % 4 === 1 && Math.random() < 0.38 * L.drum) voiceClank(S, t + BEAT * 0.5, 0.14 * L.drum);
    // филл в конце цикла
    if (beatInLoop === 31 && L.drum > 0.6) for (let k = 0; k < 4; k++) voiceTaiko(S, t + k * BEAT / 4, 0.3 + k * 0.1, 1.9 - k * 0.15);
  } else if (bi === 4 && Math.random() < 0.3) voiceClank(S, t + rnd(0, BEAT), 0.08);

  // «пульс» — низкая сердечная пульсация
  if (L.pulse > 0 && bi % 2 === 0) {
    voiceTaiko(S, t + BEAT * 0.75, 0.22 * L.pulse, 0.75);
  }

  // свелл перед сменой цикла
  if (beatInLoop === 28) voiceSwell(S, t, BEAT * 4, 0.2);

  // мелодия: редкие длинные ноты
  if (beat >= S.melNext && L.mel > 0) {
    if (Math.random() < L.mel) {
      const pool = ch.mel;
      const last = S.lastMel || pickOf(pool);
      // «блуждание» — предпочитаем соседние ноты
      let m = pickOf(pool), best = 99;
      for (let k = 0; k < 3; k++) { const c = pickOf(pool), d = Math.abs(c - last); if (d < best && (d > 0 || k === 2)) { best = d; m = c; } }
      const beats = pickOf([3, 4, 2, 5, 3]);
      const room = CHORD_BEATS - bi;
      const dur = Math.min(beats, Math.max(2, room + 1)) * BEAT;
      voiceLead(S, m, t, dur, 0.052);
      S.lastMel = m; S.melNext = beat + Math.ceil(dur / BEAT) + pickOf([0, 1, 1, 2]);
      if (Math.random() < 0.3 && L.mel > 0.5) {                   // ответная нота терцией ниже (унисон/гармония)
        voiceLead(S, m - pickOf([3, 4, 5, 7]), t + 0.06, dur, 0.026);
      }
    } else S.melNext = beat + pickOf([1, 2, 3]);
  }
}

function tick() {
  const S = session; if (!S || !S.alive) return;
  const ac = S.ac;
  if (ac.state !== 'running') return;
  const ahead = ac.currentTime + 1.6;
  while (S.nextT < ahead) {
    if (S.nextT < ac.currentTime - 0.5) S.nextT = ac.currentTime + 0.05;   // догнали после паузы вкладки
    scheduleBeat(S, S.beat, S.nextT);
    S.beat++; S.nextT += BEAT;
  }
  // потрескивание дозиметра (случайное, независимо от долей)
  while (S.crackleT < ahead) {
    if (S.crackleT < ac.currentTime) S.crackleT = ac.currentTime;
    S.crackleT += rnd(0.25, 1.9);
    if (Math.random() < 0.8) voiceTick(S, S.crackleT);
    if (Math.random() < 0.18) { const b = S.crackleT; for (let k = 1; k < 4; k++) voiceTick(S, b + k * rnd(0.02, 0.09)); }
  }
}

/* ------------------------------------------------------------
   Публичный API
   ------------------------------------------------------------ */
function bindUnlock() {
  if (unlockBound) return; unlockBound = true;
  const h = () => {
    if (!wantPlay || !ctx) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend', 'mousedown']) addEventListener(ev, h, { capture: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) h(); });
}

export const menuMusic = {
  get playing() { return !!session && session.alive; },
  start() {
    wantPlay = true; bindUnlock();
    if (session && session.alive) {
      // отменяем затухание, если оно шло
      const t = ctx.currentTime; session.out.gain.cancelScheduledValues(t); session.out.gain.setValueAtTime(session.out.gain.value, t); session.out.gain.linearRampToValueAtTime(1, t + 1.5);
      if (session.stopTimer) { clearTimeout(session.stopTimer); session.stopTimer = 0; }
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      return;
    }
    const ac = ensureCtx(); if (!ac) return;
    try { session = createSession(ac); } catch (e) { console.warn('music init failed', e); session = null; return; }
    session.timer = setInterval(tick, 110);
    if (ac.state !== 'running') ac.resume().catch(() => {});
    tick();
  },
  stop(fade = 1.6) {
    wantPlay = false;
    const S = session; if (!S || !S.alive) return;
    const ac = S.ac, t = ac.currentTime;
    S.out.gain.cancelScheduledValues(t); S.out.gain.setValueAtTime(S.out.gain.value, t); S.out.gain.linearRampToValueAtTime(0, t + fade);
    clearInterval(S.timer);
    S.stopTimer = setTimeout(() => {
      S.alive = false;
      for (const n of S.persistent) { try { n.stop(); } catch (e) {} }
      try { S.vol.disconnect(); } catch (e) {}
      if (session === S) session = null;
    }, fade * 1000 + 150);
    // сессия считается завершённой сразу: новый start() построит свежий граф, а этот тихо догаснет
    S.alive = false;
  },
  setVolume(v) {
    volume = v;
    if (session && session.vol) session.vol.gain.setTargetAtTime(v, session.ac.currentTime, 0.05);
  }
};
