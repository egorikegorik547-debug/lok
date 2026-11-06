// @ts-nocheck
// Звуки оружия: ТОЛЬКО записанные файлы (+ синтез как аварийный запасной вариант).
//  • перезарядка/механика — репозиторий sound;
//  • выстрелы — репозиторий gg4, нарезаны на отдельные выстрелы.
// Файлы берутся через src/game/audio/soundBank.ts — там цепочка источников:
//   вшито в код (base64) → public/sounds → public/sounds-backup → GitHub.
// Если не загрузился НИ ОДИН источник — играет синтез (см. synthShot / synthEvent), тишины не будет.
// ⚠ При обновлении игры НЕ удалять src/game/audio/, public/sounds/, public/sounds-backup/ (см. SOUNDS_README.md).
import { loadAllSounds, getBuffer } from './audio/soundBank';

let AC: AudioContext | null = null;
let nb: AudioBuffer | null = null;
let bus: GainNode, revIn: GainNode;
const R = (a: number, b: number) => a + Math.random() * (b - a);

/** Импульсный отклик бетонного бункера: ранние отражения + тёмный затухающий хвост */
function makeIR(ac: AudioContext) {
  const sr = ac.sampleRate, len = Math.floor(sr * 2.4), buf = ac.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch); let y = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr, env = Math.exp(-t * 2.9), k = 0.55 * Math.exp(-t * 2.2) + 0.06;
      y += ((Math.random() * 2 - 1) * env - y) * k; d[i] = y * 1.6;
    }
    for (const [ms, a] of [[9, 0.6], [17, 0.45], [29, 0.4], [44, 0.3], [63, 0.25], [90, 0.18]]) {
      const i = Math.floor((ms + ch * 3.7) / 1000 * sr); d[i] += a * (ch ? -1 : 1);
    }
  }
  return buf;
}

export function initWeaponAudio(ac: AudioContext, master: GainNode, noiseBuf: AudioBuffer) {
  if (AC === ac) return;
  AC = ac; nb = noiseBuf;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.2;
  comp.connect(master);
  bus = ac.createGain(); bus.gain.value = 0.9; bus.connect(comp);
  const conv = ac.createConvolver(); conv.buffer = makeIR(ac);
  const rg = ac.createGain(); rg.gain.value = 0.55;
  revIn = ac.createGain(); revIn.connect(conv); conv.connect(rg); rg.connect(comp);
  loadAllSounds(ac);
}

interface NO { ft?: BiquadFilterType; f?: number; f2?: number; q?: number; v?: number; a?: number; pan?: number; rev?: number }
/** Всплеск шума с фильтром, у которого частота плавно «скользит» f → f2 */
function nz(d: number, dur: number, o: NO = {}) {
  if (!AC) return;
  const t = AC.currentTime + d, s = AC.createBufferSource(); s.buffer = nb; s.loop = true;
  const f = AC.createBiquadFilter(); f.type = o.ft || 'lowpass'; f.Q.value = o.q ?? 0.7;
  f.frequency.setValueAtTime(o.f ?? 2000, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, o.f2 ?? o.f ?? 2000), t + dur);
  const g = AC.createGain(), a = o.a ?? 0.001, v = o.v ?? 0.5;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g);
  let out: AudioNode = g;
  if (o.pan && AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = o.pan; out.connect(p); out = p; }
  out.connect(bus);
  if (o.rev) { const sg = AC.createGain(); sg.gain.value = o.rev; out.connect(sg); sg.connect(revIn); }
  s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05);
}
interface PO { type?: OscillatorType; v?: number; a?: number; rev?: number; pan?: number }
/** Тон со скольжением высоты f1 → f2 */
function ps(d: number, f1: number, f2: number, dur: number, o: PO = {}) {
  if (!AC) return;
  const t = AC.currentTime + d, os = AC.createOscillator(), g = AC.createGain();
  os.type = o.type || 'sine'; os.frequency.setValueAtTime(f1, t); os.frequency.exponentialRampToValueAtTime(Math.max(18, f2), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.v ?? 0.3, t + (o.a ?? 0.001)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  os.connect(g);
  let out: AudioNode = g;
  if (o.pan && AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = o.pan; out.connect(p); out = p; }
  out.connect(bus);
  if (o.rev) { const sg = AC.createGain(); sg.gain.value = o.rev; out.connect(sg); sg.connect(revIn); }
  os.start(t); os.stop(t + dur + 0.03);
}
/** Звон металла: несколько неупорядоченных обертонов, быстро затухающих */
function ring(d: number, f: number, v: number, dec: number, rev = 0.15, parts = [1, 2.76, 5.4, 8.93]) {
  parts.forEach((m, i) => ps(d, f * m * R(0.99, 1.01), f * m * 0.985, dec / (1 + i * 0.7), { v: v / (1 + i * 0.9), a: 0.0006, rev: i ? 0 : rev }));
}
/** Металлический стук */
function clack(d: number, v: number, f = 1100, len = 0.05, rev = 0.2) {
  nz(d, len, { ft: 'bandpass', f: f * 1.4, f2: f, q: 2.6, v: v * 1.1, a: 0.0006, rev });
  nz(d, 0.006, { ft: 'highpass', f: 2500, v: v * 0.6, a: 0.0004 });
  ring(d, f * 1.15, v * 0.5, len * 5, rev * 0.8);
}
const thud = (d: number, v: number, f = 120, len = 0.09) => {
  ps(d, f * 1.5, f * 0.45, len, { v, a: 0.002 });
  nz(d, len * 0.7, { ft: 'lowpass', f: 700, f2: 150, v: v * 0.6, a: 0.001 });
};
/** Скрип/трение металла о металл */
const scrape = (d: number, dur: number, v: number, f0: number, f1: number, q = 1.4) => {
  nz(d, dur, { ft: 'bandpass', f: f0, f2: f1, q, v, a: dur * 0.2 });
  nz(d + dur * 0.1, dur * 0.8, { ft: 'highpass', f: 3500, f2: 5200, v: v * 0.18, a: dur * 0.3 });
};
/** Шорох ткани / подсумка */
const rustle = (d: number, dur: number, v: number) => {
  const n = Math.max(3, Math.round(dur * 22));
  for (let i = 0; i < n; i++) nz(d + (i / n) * dur + R(0, 0.012), R(0.015, 0.05), { ft: 'bandpass', f: R(1200, 3600), f2: R(700, 2200), q: 0.9, v: v * R(0.25, 1), a: 0.005 });
};


/* ================= ЗАПИСАННЫЕ ЗВУКИ (mp3 из репозитория sound) ================= */
/** Клипы: [файл, начало (с), длительность (с), громкость]. Sound_06078.mp3 — «банк» отдельных звуков, нарезан по моментам тишины. */
type Clip = [string, number, number, number];
const CLIPS: Record<string, Clip> = {
  magSwap: ['mag', 0, 1.71, 0.95],        // смена магазина целиком
  magSoft: ['soft', 0, 0.7, 0.9],         // щелчок защёлки магазина
  pistRack: ['pist', 0, 0.6, 0.95],       // досыл патрона в пистолете
  pump: ['pump', 0, 0.55, 1.0],           // движение цевья дробовика
  shell1: ['load', 0.05, 0.55, 1.0],      // патрон в дробовик (три варианта)
  shell2: ['load', 2.84, 0.5, 1.2],
  shell3: ['load', 4.36, 0.4, 1.4],
  rack: ['load', 7.82, 1.0, 0.95],        // финальный досыл цевьём после зарядки
  bA: ['bank', 0.42, 0.16, 1.0], bB: ['bank', 0.70, 0.70, 0.9], bC: ['bank', 1.72, 0.30, 0.9],
  bD: ['bank', 5.00, 0.34, 1.1], bE: ['bank', 5.55, 0.78, 0.9], bF: ['bank', 9.55, 0.95, 1.0],
  bG: ['bank', 10.70, 0.40, 0.95], bH: ['bank', 14.11, 0.36, 1.1], bI: ['bank', 14.84, 0.45, 1.0],
  bJ: ['bank', 18.27, 0.65, 0.95], bK: ['bank', 22.20, 0.40, 1.5], bL: ['bank', 22.75, 0.43, 1.5],
  bM: ['bank', 23.45, 0.32, 1.3], bN: ['bank', 23.95, 0.25, 1.1]
};
const reloadVoices = new Set<{ src: AudioBufferSourceNode; g: GainNode }>();
/** Проиграть клип. Возвращает false, если файлы ещё не загружены (тогда играет синтез). */
function playClip(name: string, d = 0, vol = 1, rate = 1, isReload = true): boolean {
  const c = CLIPS[name]; if (!AC || !c) return false;
  const buf = getBuffer(c[0]); if (!buf) return false;
  const t = AC.currentTime + d, dur = c[2] / rate, src = AC.createBufferSource(), g = AC.createGain();
  src.buffer = buf; src.playbackRate.value = rate;
  const v = c[3] * vol;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.004);
  g.gain.setValueAtTime(v, t + Math.max(0.005, dur - 0.04)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  src.connect(g); g.connect(bus);
  const sg = AC.createGain(); sg.gain.value = 0.12; g.connect(sg); sg.connect(revIn);
  src.start(t, c[1], c[2]); src.stop(t + dur + 0.05);
  if (isReload) { const vo = { src, g }; reloadVoices.add(vo); src.onended = () => reloadVoices.delete(vo); }
  return true;
}
/* ================= ЗАПИСАННЫЕ ВЫСТРЕЛЫ (репозиторий gg4) ================= */
// оружие → варианты файлов и громкость; вариант выбирается случайно (но не повторяется подряд)
const SHOT_FILES: Record<string, { keys: string[]; vol: number; rate: [number, number] }> = {
  pistol:   { keys: ['pistol1', 'pistol2'], vol: 0.95, rate: [0.97, 1.03] },
  revolver: { keys: ['revolver1', 'revolver2'], vol: 1.0, rate: [0.97, 1.03] },
  ak74:     { keys: ['ak1', 'ak2'], vol: 0.85, rate: [0.97, 1.04] },
  asval:    { keys: ['asval0', 'asval1', 'asval2', 'asval3'], vol: 0.9, rate: [0.98, 1.02] },
  rifle:    { keys: ['rifle1', 'rifle2', 'rifle3', 'rifle4'], vol: 1.0, rate: [0.97, 1.03] },
  mosin:    { keys: ['mosin1'], vol: 1.0, rate: [0.96, 1.02] },
  shotgun:  { keys: ['shotgun1'], vol: 1.0, rate: [0.97, 1.03] }
};
const lastPick: Record<string, number> = {};
function playShot(id: string): boolean {
  const cfg = SHOT_FILES[id]; if (!AC || !cfg) return false;
  const ready = cfg.keys.map((k, i) => i).filter(i => getBuffer(cfg.keys[i]));
  if (!ready.length) return false;
  let i = ready[Math.floor(Math.random() * ready.length)];
  if (ready.length > 1 && i === lastPick[id]) i = ready[(ready.indexOf(i) + 1) % ready.length];
  lastPick[id] = i;
  const buf = getBuffer(cfg.keys[i]), t = AC.currentTime, src = AC.createBufferSource(), g = AC.createGain();
  src.buffer = buf; src.playbackRate.value = R(cfg.rate[0], cfg.rate[1]);
  g.gain.value = cfg.vol * R(0.94, 1.0);
  src.connect(g); g.connect(bus);
  const sg = AC.createGain(); sg.gain.value = id === 'asval' ? 0.12 : 0.18; g.connect(sg); sg.connect(revIn);
  src.start(t);
  return true;
}
/** Огнемёт: пока идут «тики» огня — играет зацикленная запись; при паузе плавно затихает */
let flameSrc: AudioBufferSourceNode | null = null, flameG: GainNode | null = null, flameTimer: any = 0;
function flameShot(): boolean {
  const flameBuf = getBuffer('flame');
  if (!AC || !flameBuf) return false;
  const t = AC.currentTime;
  if (!flameSrc || !flameG) {
    const src = AC.createBufferSource(), g = AC.createGain();
    src.buffer = flameBuf; src.loop = true; src.loopStart = 2.6; src.loopEnd = Math.min(8.6, flameBuf.duration - 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9, t + 0.05);
    src.connect(g); g.connect(bus);
    const sg = AC.createGain(); sg.gain.value = 0.15; g.connect(sg); sg.connect(revIn);
    src.start(t); flameSrc = src; flameG = g;
  } else {
    flameG.gain.cancelScheduledValues(t); flameG.gain.setValueAtTime(Math.max(0.0001, flameG.gain.value), t); flameG.gain.linearRampToValueAtTime(0.9, t + 0.04);
  }
  clearTimeout(flameTimer);
  flameTimer = setTimeout(() => {                                                  // тиков нет — гасим
    if (!AC || !flameSrc || !flameG) return;
    const n = AC.currentTime, src = flameSrc, g = flameG; flameSrc = null; flameG = null;
    g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), n); g.gain.linearRampToValueAtTime(0.0001, n + 0.25);
    try { src.stop(n + 0.3); } catch (e) { /* уже остановлен */ }
  }, 260);
  return true;
}

/** Оборвать звуки перезарядки (смена оружия / прерывание зарядки выстрелом) */
function stopReloadSounds() {
  if (!AC) return;
  const t = AC.currentTime;
  reloadVoices.forEach(v => { try { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0.0001, t + 0.05); v.src.stop(t + 0.07); } catch (e) { /* уже остановлен */ } });
  reloadVoices.clear();
}

/** Звуки перезарядки оружия: событие анимации → клип. null = тишина (звук уже входит в соседний клип). */
type Cue = string | string[] | null | ((reloading: boolean) => string | null);
const SAMPLE_CUES: Record<string, Record<string, Cue>> = {
  pistol:  { magrel: 'magSoft', magout: 'magSwap', pouch: null, magin: null, slap: null, slidebk: 'pistRack', slidefw: null },
  asval:   { magrel: 'magSoft', magout: 'magSwap', pouch: null, magin: null, slap: null, slidebk: 'bH', slidefw: 'bI' },
  ak74:    { magrel: 'magSoft', magout: 'magSwap', pouch: null, hook: null, magin: null, slap: null, slidebk: 'bH', slidefw: 'bI' },
  revolver:{ latch: 'bA', open: 'bB', eject: 'bD', pouch: null, magin: 'bF', rounds: null, close: 'bG' },
  rifle:   { boltup: 'bK', boltbk: 'bL', pouch: null, clipin: 'bJ', rounds: 'bF', clipout: 'bD', boltfw: 'bM', boltdn: 'bN' },
  mosin:   { boltup: 'bK', boltbk: 'bL', pouch: null, clipin: 'bJ', rounds: 'bF', clipout: 'bD', boltfw: 'bM', boltdn: 'bN' },
  shotgun: { shellgrab: null, shellin: ['shell1', 'shell2', 'shell3'], pumpbk: r => r ? 'rack' : 'pump', pumpfw: null },
  flame:   { tankrel: 'bA', tankout: 'bH', pouch: null, tankin: 'bG', clamp: 'bC', valve: 'bF' }
};


/* ================= АВАРИЙНЫЙ СИНТЕЗ =================
   Играет ТОЛЬКО если записанный звук не загрузился ни из одного источника
   (вшитый код → public/sounds → public/sounds-backup → GitHub). */
const SYNTH_SHOT: Record<string, () => void> = {
  pistol:   () => { nz(0, 0.16, { ft: 'lowpass', f: 5200, f2: 600, v: 0.7, rev: 0.25 }); ps(0, 220, 70, 0.1, { v: 0.45 }); },
  revolver: () => { nz(0, 0.3, { ft: 'lowpass', f: 4200, f2: 300, v: 0.85, rev: 0.35 }); ps(0, 160, 48, 0.18, { v: 0.55 }); },
  ak74:     () => { nz(0, 0.2, { ft: 'lowpass', f: 5000, f2: 500, v: 0.75, rev: 0.25 }); ps(0, 190, 55, 0.12, { v: 0.5 }); },
  asval:    () => { nz(0, 0.12, { ft: 'bandpass', f: 2600, f2: 900, q: 0.8, v: 0.4, rev: 0.1 }); thud(0, 0.25, 130, 0.07); },
  rifle:    () => { nz(0, 0.5, { ft: 'lowpass', f: 3800, f2: 220, v: 0.9, rev: 0.5 }); ps(0, 140, 40, 0.3, { v: 0.6 }); },
  mosin:    () => { nz(0, 0.6, { ft: 'lowpass', f: 3500, f2: 200, v: 0.95, rev: 0.55 }); ps(0, 120, 38, 0.35, { v: 0.65 }); },
  shotgun:  () => { nz(0, 0.45, { ft: 'lowpass', f: 3000, f2: 180, v: 1.0, rev: 0.4 }); ps(0, 110, 36, 0.3, { v: 0.7 }); },
  flame:    () => { nz(0, 0.3, { ft: 'bandpass', f: 700, f2: 450, q: 0.6, v: 0.35, a: 0.05 }); }
};
function synthShot(id: string) { (SYNTH_SHOT[id] || SYNTH_SHOT.pistol)(); }
/** Запасной звук перезарядки: простой металлический щелчок. Не зависит от файлов. */
function synthEvent(name: string) {
  if (/^(pouch|slap|rounds|grab|shellgrab)/.test(name)) { rustle(0, 0.08, 0.12); return; }
  if (/(in|dn|fw|close|slidefw)$/.test(name)) { clack(0, 0.4, 1500, 0.04, 0.12); thud(0.004, 0.15, 150, 0.04); }
  else clack(0, 0.35, 1900, 0.03, 0.1);
}

export const WA = {
  ready: () => !!AC,
  shot(id: string) {
    if (!AC) return;
    if (id === 'flame') { if (flameShot()) return; }                       // записанный огнемёт
    else if (playShot(id)) return;                                         // записанные выстрелы (gg4)
    synthShot(id);                                                         // запись недоступна → аварийный синтез
  },
  stopReload() { stopReloadSounds(); },
  dry(id: string) {
    if (!AC) return;
    const heavy = id === 'rifle' || id === 'shotgun' || id === 'mosin' || id === 'revolver';
    clack(0, heavy ? 0.5 : 0.38, heavy ? 1500 : 2300, 0.02, 0.1); thud(0.004, heavy ? 0.22 : 0.12, 200, 0.03);
  },
  event(id: string, name: string, reloading = true) {
    if (!AC) return;
    const cues = SAMPLE_CUES[id];
    if (name === 'eject' && (id === 'mosin' || id === 'rifle')) { ring(0.28, 4300, 0.05, 0.22, 0.2, [1, 2.4]); ring(0.4, 3700, 0.025, 0.16, 0.2, [1, 2.2]); }   // звон гильзы об пол
    if (cues && name in cues) {
      let c: any = cues[name];
      if (typeof c === 'function') c = c(reloading);
      if (c !== null) {                                                            // null = тишина: звук уже в соседнем клипе
        const pick = Array.isArray(c) ? c[Math.floor(Math.random() * c.length)] : c;
        if (!playClip(pick, 0, R(0.92, 1.0), R(0.97, 1.03))) synthEvent(name);   // файла нет → запасной щелчок
      }
    }
  },
  /** достать оружие */
  draw(id: string) {
    if (!AC) return;
    stopReloadSounds();
    rustle(0, 0.12, 0.2);
    if (id === 'pipe') { thud(0.05, 0.15, 160, 0.05); ring(0.05, 800, 0.08, 0.3, 0.1, [1, 2.3]); }
    else if (id === 'machete' || id === 'kukri') { scrape(0.02, 0.1, 0.2, 3000, 6000, 3); ring(0.1, id === 'kukri' ? 3100 : 2400, 0.1, 0.5, 0.2, [1, 2.9, 5.1]); }
    else if (id === 'flame') { thud(0.06, 0.25, 110, 0.08); ring(0.06, 260, 0.1, 0.3, 0.2, [1, 1.9]); }
    else if (id === 'revolver') { clack(0.05, 0.3, 1900, 0.03, 0.1); clack(0.12, 0.2, 2400, 0.02, 0.08); thud(0.08, 0.2, 140, 0.06); }
    else { clack(0.06, 0.3, id === 'pistol' ? 2000 : 1100, 0.03, 0.1); thud(0.08, 0.2, 140, 0.06); }
  },
  swing(id: string) {
    if (!AC) return;
    if (id === 'kukri') {            // лёгкий клинок: высокий короткий свист
      nz(0, 0.16, { ft: 'bandpass', f: 2600, f2: 5200, q: 2.2, v: 0.2, a: 0.05 });
      nz(0.02, 0.1, { ft: 'highpass', f: 5000, v: 0.08, a: 0.04 });
    } else if (id === 'machete') {   // длиннее и ниже, с «звоном» полотна
      nz(0, 0.26, { ft: 'bandpass', f: 900, f2: 3000, q: 1.4, v: 0.3, a: 0.09 });
      nz(0.04, 0.2, { ft: 'highpass', f: 3500, f2: 5500, v: 0.08, a: 0.07 });
      ring(0.1, 1900, 0.04, 0.35, 0.2, [1, 2.2]);
    } else {                         // труба: низкий глухой «вууух»
      nz(0, 0.3, { ft: 'bandpass', f: 280, f2: 800, q: 0.9, v: 0.34, a: 0.12 });
      ps(0, 130, 75, 0.25, { v: 0.1, a: 0.08 });
      rustle(0, 0.1, 0.06);
    }
  },
  /** попадание в тело: kind — pipe | machete | kukri | bullet | big */
  flesh(kind = 'bullet', vol = 1) {
    if (!AC) return;
    nz(0, 0.1, { ft: 'lowpass', f: 1400, f2: 200, v: 0.55 * vol, a: 0.001, rev: 0.15 });
    ps(0, 160, 55, 0.1, { v: 0.4 * vol, a: 0.001 });
    nz(0.012, 0.07, { ft: 'bandpass', f: 600, f2: 300, q: 1.2, v: 0.25 * vol, a: 0.004 });     // «мокрый» хруст
    if (kind === 'pipe') { clack(0, 0.45 * vol, 780, 0.1, 0.25); ring(0.01, 520, 0.2 * vol, 0.5, 0.25, [1, 2.4, 4.3]); thud(0, 0.4 * vol, 90, 0.1); }
    else if (kind === 'machete' || kind === 'kukri') {
      nz(0, 0.12, { ft: 'bandpass', f: 2800, f2: 1200, q: 1.5, v: 0.32 * vol, a: 0.002 });
      ring(0.005, kind === 'kukri' ? 3000 : 2300, 0.08 * vol, 0.3, 0.15, [1, 2.9]);
    } else if (kind === 'big') thud(0, 0.5 * vol, 70, 0.14);
  },
  /** пуля в стену: «тюк» и короткий рикошет */
  wall(vol = 1) {
    if (!AC) return;
    nz(0.03, 0.04, { ft: 'bandpass', f: 2400, f2: 1500, q: 1.6, v: 0.16 * vol, a: 0.001, rev: 0.3 });
    nz(0.05, 0.1, { ft: 'lowpass', f: 1800, f2: 300, v: 0.1 * vol, a: 0.002 });
    if (Math.random() < 0.35) ps(0.04, 3400, 1500, 0.22, { v: 0.05 * vol, a: 0.002, rev: 0.3, pan: R(-0.5, 0.5) });
  }
};
