/**
 * ============================================================
 *  МАНИФЕСТ ЗВУКОВ ИГРЫ  (единственный список всех аудиофайлов)
 * ============================================================
 *  ⚠ НЕ УДАЛЯТЬ и НЕ ПЕРЕИМЕНОВЫВАТЬ при обновлении игры.
 *  Папка src/game/audio/, public/sounds/ и public/sounds-backup/ — часть игры.
 *
 *  Каждый звук грузится по цепочке (первый сработавший побеждает):
 *    1. embedded — base64, вшит прямо в код (src/game/audio/embedded/*.ts)
 *    2. file     — обычный файл  public/sounds/<папка>/<файл>
 *    3. backup   — резервный файл public/sounds-backup/<папка>/<файл>
 *    4. remote   — исходная запись из GitHub (jsDelivr / raw), с нарезкой на лету
 *    5. synth    — если вообще ничего не загрузилось, играет синтезированный звук
 */

export type Folder = 'shots' | 'reload';

export interface RemoteSrc {
  repo: 'gg4' | 'sound';
  file: string;       // имя файла в репозитории
  start?: number;     // начало нарезки, сек (по умолчанию весь файл)
  dur?: number;       // длительность нарезки, сек
}

export interface SoundDef {
  key: string;        // ключ, по которому звук берёт weaponAudio.ts
  folder: Folder;
  file: string;       // имя файла в public/sounds/<folder>/ и public/sounds-backup/<folder>/
  remote: RemoteSrc;  // откуда можно скачать оригинал, если локальные копии пропали
}

const G = (file: string, start?: number, dur?: number): RemoteSrc => ({ repo: 'gg4', file, start, dur });
const S = (file: string, start?: number, dur?: number): RemoteSrc => ({ repo: 'sound', file, start, dur });

const RIFLE = 'sounds-of-shots-from-a-rifle-in-the-open-air-gun.mp3';

export const SOUND_DEFS: SoundDef[] = [
  /* ---------- звуки перезарядки / механики (репозиторий sound) ---------- */
  { key: 'mag',  folder: 'reload', file: '84374.mp3',                       remote: S('84374.mp3') },
  { key: 'soft', folder: 'reload', file: '84979.mp3',                       remote: S('84979.mp3') },
  { key: 'bank', folder: 'reload', file: 'Sound_06078.mp3',                 remote: S('Sound_06078.mp3') },
  { key: 'load', folder: 'reload', file: 'load-shotgun_zjrbqfeu.mp3',       remote: S('load-shotgun_zjrbqfeu.mp3') },
  { key: 'pist', folder: 'reload', file: 'pistol-loaded-to-fire.mp3',       remote: S('pistol-loaded-to-fire.mp3') },
  { key: 'pump', folder: 'reload', file: 'shotgun-movements_zkpxbcv_.mp3',  remote: S('shotgun-movements_zkpxbcv_.mp3') },

  /* ---------- выстрелы (репозиторий gg4, нарезаны на отдельные выстрелы) ---------- */
  { key: 'pistol1',   folder: 'shots', file: 'pistol1.mp3',   remote: G('01664.mp3', 0.06, 0.58) },
  { key: 'pistol2',   folder: 'shots', file: 'pistol2.mp3',   remote: G('01664.mp3', 6.64, 0.60) },
  { key: 'revolver1', folder: 'shots', file: 'revolver1.mp3', remote: G('revolver-strelyaet-3.mp3', 0.38, 0.36) },
  { key: 'revolver2', folder: 'shots', file: 'revolver2.mp3', remote: G('revolver-strelyaet-3.mp3', 0.73, 0.62) },
  { key: 'ak1',       folder: 'shots', file: 'ak1.mp3',       remote: G('machine-gun-shots-and-reloading.mp3', 0.191, 0.105) },
  { key: 'ak2',       folder: 'shots', file: 'ak2.mp3',       remote: G('machine-gun-shots-and-reloading.mp3', 0.597, 0.105) },
  { key: 'rifle1',    folder: 'shots', file: 'rifle1.mp3',    remote: G(RIFLE, 1.07, 2.4) },
  { key: 'rifle2',    folder: 'shots', file: 'rifle2.mp3',    remote: G(RIFLE, 10.57, 2.4) },
  { key: 'rifle3',    folder: 'shots', file: 'rifle3.mp3',    remote: G(RIFLE, 15.34, 2.4) },
  { key: 'rifle4',    folder: 'shots', file: 'rifle4.mp3',    remote: G(RIFLE, 18.88, 2.4) },
  { key: 'mosin1',    folder: 'shots', file: 'mosin1.mp3',    remote: G('single-shot-with-long-audible-echo.mp3') },
  { key: 'shotgun1',  folder: 'shots', file: 'shotgun1.mp3',  remote: S('drobo_ik-vystrel.mp3', 0.04, 1.3) },
  { key: 'asval0',    folder: 'shots', file: 'asval0.mp3',    remote: G('tm_val_shot_0.ogg') },
  { key: 'asval1',    folder: 'shots', file: 'asval1.mp3',    remote: G('tm_val_shot_1.ogg') },
  { key: 'asval2',    folder: 'shots', file: 'asval2.mp3',    remote: G('tm_val_shot_2.ogg') },
  { key: 'asval3',    folder: 'shots', file: 'asval3.mp3',    remote: G('tm_val_shot_3.ogg') },
  { key: 'flame',     folder: 'shots', file: 'flame.mp3',     remote: G('flamethrower.mp3') }
];

export const GH_USER = 'egorikegorik547-debug';
