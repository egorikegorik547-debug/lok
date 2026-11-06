// @ts-nocheck
/**
 * ============================================================
 *  ХРАНИЛИЩЕ ЗВУКОВ С РЕЗЕРВНЫМИ ИСТОЧНИКАМИ
 * ============================================================
 *  ⚠ НЕ УДАЛЯТЬ при обновлении игры (см. SOUNDS_README.md).
 *
 *  Для каждого звука пробуем источники по очереди:
 *    1) embedded — base64 внутри кода (src/game/audio/embedded)   ← основной, не требует файлов и сети
 *    2) file     — public/sounds/<папка>/<файл>
 *    3) backup   — public/sounds-backup/<папка>/<файл>
 *    4) remote   — оригинал из GitHub (jsDelivr, затем raw.githubusercontent) + нарезка
 *  Если не сработало ничего — getBuffer() вернёт undefined, и weaponAudio сыграет синтезированный звук.
 *  Ни одна ошибка не «глотается» молча: всё видно в консоли ([звуки]) и в window.__soundReport().
 */
import { SOUND_DEFS, GH_USER } from './manifest';
import type { SoundDef } from './manifest';

type Via = 'embedded' | 'file' | 'backup' | 'remote';
interface Status { ok: boolean; via?: Via; errors: string[]; last: number; busy: boolean }

// Все вшитые звуки. glob не падает, если папки нет — тогда просто переходим к файлам/резерву.
const EMB_MODULES = import.meta.glob('./embedded/*.ts', { eager: true }) as Record<string, any>;
const EMBEDDED: Record<string, { b64: string; mime: string }> = {};
for (const m of Object.values(EMB_MODULES)) {
  if (m && m.default && m.folder && m.file) EMBEDDED[`${m.folder}/${m.file}`] = { b64: m.default, mime: m.mime };
}

const BASE: string = (import.meta as any).env?.BASE_URL || '/';
const BUFS: Record<string, AudioBuffer> = {};
const STATUS: Record<string, Status> = {};
let CTX: AudioContext | null = null;
let settledLogged = false;

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64), n = bin.length, u = new Uint8Array(n);
  for (let i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}

function decode(ac: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise<AudioBuffer>((res, rej) => {
    try { const p = ac.decodeAudioData(data, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); }
  });
}

async function fetchBuf(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url, { cache: 'force-cache' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const ct = r.headers.get('content-type') || '';
  if (/text\/html/i.test(ct)) throw new Error('получен HTML вместо аудио (файла нет на сервере)');
  const b = await r.arrayBuffer();
  if (b.byteLength < 200) throw new Error('файл пустой');
  return b;
}

/** вырезать кусок [start, start+dur) из декодированного буфера */
function slice(ac: AudioContext, buf: AudioBuffer, start = 0, dur = 0): AudioBuffer {
  if (!start && (!dur || dur >= buf.duration)) return buf;
  const sr = buf.sampleRate, s0 = Math.floor(start * sr), len = Math.min(buf.length - s0, Math.floor((dur || buf.duration) * sr));
  const out = ac.createBuffer(buf.numberOfChannels, Math.max(1, len), sr);
  for (let c = 0; c < buf.numberOfChannels; c++) out.copyToChannel(buf.getChannelData(c).subarray(s0, s0 + len), c);
  // мягкий вход/выход, чтобы не щёлкало
  const f = Math.min(Math.floor(sr * 0.04), len >> 1);
  for (let c = 0; c < out.numberOfChannels; c++) { const d = out.getChannelData(c); for (let i = 0; i < f; i++) d[len - 1 - i] *= i / f; }
  return out;
}

function remoteUrls(d: SoundDef): string[] {
  const f = encodeURIComponent(d.remote.file), repo = d.remote.repo;
  return [
    `https://cdn.jsdelivr.net/gh/${GH_USER}/${repo}@main/${f}`,
    `https://raw.githubusercontent.com/${GH_USER}/${repo}/main/${f}`
  ];
}

async function tryLoad(ac: AudioContext, d: SoundDef): Promise<{ buf: AudioBuffer; via: Via }> {
  const st = STATUS[d.key], rel = `${d.folder}/${d.file}`;
  const steps: Array<[Via, () => Promise<AudioBuffer>]> = [
    ['embedded', async () => {
      const e = EMBEDDED[rel]; if (!e) throw new Error('не вшит в код (нет src/game/audio/embedded/)');
      return decode(ac, b64ToBuf(e.b64));
    }],
    ['file', async () => decode(ac, await fetchBuf(`${BASE}sounds/${rel}`))],
    ['backup', async () => decode(ac, await fetchBuf(`${BASE}sounds-backup/${rel}`))],
    ['remote', async () => {
      let err: any;
      for (const u of remoteUrls(d)) {
        try { return slice(ac, await decode(ac, await fetchBuf(u)), d.remote.start, d.remote.dur); } catch (e) { err = e; }
      }
      throw err || new Error('нет сети');
    }]
  ];
  for (const [via, run] of steps) {
    try { const buf = await run(); return { buf, via }; }
    catch (e: any) { st.errors.push(`${via}: ${e && e.message ? e.message : e}`); }
  }
  throw new Error('все источники недоступны');
}

function loadKey(ac: AudioContext, d: SoundDef): Promise<void> {
  const st = STATUS[d.key];
  if (st.busy) return Promise.resolve();
  st.busy = true; st.last = Date.now(); st.errors = [];
  return tryLoad(ac, d)
    .then(({ buf, via }) => { BUFS[d.key] = buf; st.ok = true; st.via = via; })
    .catch(() => { st.ok = false; })
    .then(() => { st.busy = false; });
}

function report() {
  const all = SOUND_DEFS.map(d => ({ key: d.key, ...STATUS[d.key] }));
  const ok = all.filter(s => s.ok), bad = all.filter(s => !s.ok);
  const by: Record<string, number> = {};
  ok.forEach(s => { by[s.via!] = (by[s.via!] || 0) + 1; });
  return { total: all.length, loaded: ok.length, missing: bad.map(s => s.key), by, details: all };
}

/** Запустить загрузку всех звуков (вызывается один раз при создании AudioContext) */
export function loadAllSounds(ac: AudioContext): Promise<void> {
  CTX = ac;
  for (const d of SOUND_DEFS) if (!STATUS[d.key]) STATUS[d.key] = { ok: false, errors: [], last: 0, busy: false };
  try { (window as any).__soundReport = report; } catch (e) { /* не браузер */ }
  return Promise.all(SOUND_DEFS.map(d => loadKey(ac, d))).then(() => {
    const r = report();
    if (settledLogged) return; settledLogged = true;
    if (r.missing.length === 0) {
      const non = Object.keys(r.by).filter(k => k !== 'embedded');
      console.info(`[звуки] загружено ${r.loaded}/${r.total}`, r.by, non.length ? '⚠ часть звуков взята из запасного источника' : '');
    } else {
      console.warn(`[звуки] ⚠ НЕ загружены (${r.missing.length}/${r.total}): ${r.missing.join(', ')} — играет синтезированный звук`);
      for (const k of r.missing) console.warn(`[звуки] ${k}:`, STATUS[k].errors.join(' | '));
    }
  });
}

const RETRY_MS = 8000;
/** Получить декодированный звук. Если его нет — раз в несколько секунд пробуем загрузить заново. */
export function getBuffer(key: string): AudioBuffer | undefined {
  const b = BUFS[key];
  if (b) return b;
  const st = STATUS[key];
  if (CTX && st && !st.busy && Date.now() - st.last > RETRY_MS) {
    const d = SOUND_DEFS.find(x => x.key === key); if (d) loadKey(CTX, d);
  }
  return undefined;
}

export const hasBuffer = (key: string) => !!BUFS[key];
export const soundReport = report;
