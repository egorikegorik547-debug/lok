#!/usr/bin/env node
/**
 * Проверка целостности звуков игры.
 *   node scripts/check-sounds.mjs          — только проверить
 *   node scripts/check-sounds.mjs --fix    — починить: восстановить недостающее из резерва
 *
 * Что проверяется для каждого звука из src/game/audio/manifest.ts:
 *   • public/sounds/<папка>/<файл>          (рабочая копия)
 *   • public/sounds-backup/<папка>/<файл>   (резерв)
 *   • src/game/audio/embedded/*.ts          (вшито в код)
 * Починка: резерв → рабочая копия, рабочая копия → резерв (если резерв пропал), затем пересборка вшитых данных.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fix = process.argv.includes('--fix');
const manifest = fs.readFileSync(path.join(root, 'src/game/audio/manifest.ts'), 'utf8');
const defs = [...manifest.matchAll(/folder:\s*'(\w+)',\s*file:\s*'([^']+)'/g)].map(m => ({ folder: m[1], file: m[2] }));
if (!defs.length) { console.error('✗ manifest.ts не найден или пуст — восстановите src/game/audio/manifest.ts'); process.exit(2); }

const ok = p => fs.existsSync(p) && fs.statSync(p).size > 200;
const P = (dir, d) => path.join(root, dir, d.folder, d.file);
const E = d => path.join(root, 'src/game/audio/embedded', `${d.folder}__${d.file.replace(/[^A-Za-z0-9]+/g, '_')}.ts`);

let bad = 0, fixed = 0, needEmbed = false;
for (const d of defs) {
  const w = P('public/sounds', d), b = P('public/sounds-backup', d), e = E(d);
  const miss = [];
  if (!ok(w)) miss.push('sounds');
  if (!ok(b)) miss.push('backup');
  if (!ok(e)) miss.push('embedded');
  if (!miss.length) continue;
  bad++;
  console.log(`✗ ${d.folder}/${d.file}: нет в [${miss.join(', ')}]`);
  if (!fix) continue;
  const src = ok(b) ? b : ok(w) ? w : null;
  if (src) {
    for (const t of [w, b]) if (!ok(t)) { fs.mkdirSync(path.dirname(t), { recursive: true }); fs.copyFileSync(src, t); fixed++; }
    if (!ok(e)) needEmbed = true;
  } else if (ok(e)) {
    // восстановить файл из вшитого base64
    const m = fs.readFileSync(e, 'utf8').match(/export default '([^']+)'/);
    if (m) for (const t of [w, b]) { fs.mkdirSync(path.dirname(t), { recursive: true }); fs.writeFileSync(t, Buffer.from(m[1], 'base64')); fixed++; }
  } else console.log('   ✗✗ нигде нет копии — скачайте из репозиториев gg4 / sound (см. SOUNDS_README.md)');
}
if (fix && needEmbed) spawnSync('node', [path.join(root, 'scripts/build-audio-data.mjs')], { stdio: 'inherit' });
console.log(bad ? (fix ? `Исправлено копий: ${fixed}` : `Проблем: ${bad}. Запустите с --fix`) : `✓ Все ${defs.length} звуков на месте (рабочие + резерв + вшитые в код)`);
process.exit(bad && !fix ? 1 : 0);
