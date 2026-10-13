import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

// Zoberie všetky súbory pretiahnuté myšou na .bat ikonu
const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Žiadne súbory na konverziu.');
  process.exit(0);
}

console.log(`\n🚀 Konvertujem ${files.length} súborov na 2000px WebP (85% kvalita)...\n`);

let successCount = 0;

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.tiff', '.bmp'].includes(ext)) {
    continue;
  }

  // Vytvorí priečinok "web_optimized" priamo v zložke pôvodného súboru
  const fileDir = path.dirname(file);
  const outDir = path.join(fileDir, 'web_optimized');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Bezpečný webový názov: malé písmená, pomlčky namiesto medzier, bez diakritiky
  const rawName = path.basename(file, ext);
  const cleanName = rawName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const dest = path.join(outDir, `${cleanName}.webp`);

  try {
    await sharp(file)
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toFile(dest);

    console.log(`✓ [web_optimized] ${cleanName}.webp`);
    successCount++;
  } catch (err) {
    console.error(`✗ Chyba pri ${file}:`, err.message);
  }
}

console.log(`\n🎉 Hotovo! ${successCount} optimalizovaných súborov je v priečinku: web_optimized\n`);