#!/usr/bin/env node
/**
 * Генерирует src/game/audio/embedded/*.ts — звуки в base64, вшитые прямо в код игры.
 * Источник — РЕЗЕРВНЫЕ файлы public/sounds-backup/ (они считаются «эталоном»).
 *
 * Запуск (из корня проекта):   node scripts/build-audio-data.mjs
 * Нужно запускать только если вы заменили/добавили звуковой файл.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'public', 'sounds-backup');
const out = path.join(root, 'src', 'game', 'audio', 'embedded');

fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.ts')) fs.unlinkSync(path.join(out, f));

let n = 0, total = 0;
for (const folder of fs.readdirSync(src)) {
  const dir = path.join(src, folder);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir)) {
    const buf = fs.readFileSync(path.join(dir, file));
    const mime = file.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg';
    const name = `${folder}__${file.replace(/[^A-Za-z0-9]+/g, '_')}.ts`;
    const code =
      `// АВТОГЕНЕРАЦИЯ: node scripts/build-audio-data.mjs  (источник: public/sounds-backup/${folder}/${file})\n` +
      `// Звук вшит в код, чтобы не пропадать при обновлении игры. НЕ УДАЛЯТЬ.\n` +
      `export const folder = '${folder}';\nexport const file = '${file}';\nexport const mime = '${mime}';\n` +
      `export default '${buf.toString('base64')}';\n`;
    fs.writeFileSync(path.join(out, name), code);
    n++; total += buf.length;
  }
}
console.log(`Вшито звуков: ${n}, ${(total / 1024).toFixed(0)} КБ (base64 ≈ ${(total * 1.34 / 1024).toFixed(0)} КБ)`);
