import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BOOKS_DIR = path.join(process.cwd(), 'public', 'books');

function checkDependencies(): boolean {
  try {
    execSync('which convert', { stdio: 'pipe' });
    return true;
  } catch {
    console.log('⚠️  ImageMagick not installed.');
    console.log('   Install with: brew install imagemagick');
    console.log('   Or: apt-get install imagemagick');
    return false;
  }
}

function extractCoverFromPdf(pdfPath: string, outputPath: string): boolean {
  try {
    execSync(`convert -density 150 "${pdfPath}[0]" -quality 90 "${outputPath}"`, {
      stdio: 'pipe'
    });
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to extract from ${pdfPath}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting: Extract cover images from front.pdf files\n');

  if (!checkDependencies()) {
    process.exit(1);
  }

  if (!fs.existsSync(BOOKS_DIR)) {
    console.error(`❌ Books directory not found: ${BOOKS_DIR}`);
    process.exit(1);
  }

  const bookFolders = fs.readdirSync(BOOKS_DIR);
  let extractedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let noPdfCount = 0;

  console.log(`📂 Found ${bookFolders.length} folders in ${BOOKS_DIR}\n`);

  for (const folder of bookFolders) {
    const folderPath = path.join(BOOKS_DIR, folder);

    if (!fs.statSync(folderPath).isDirectory()) {
      continue;
    }

    const coverPath = path.join(folderPath, 'cover.png');
    const frontPdfPath = path.join(folderPath, 'front.pdf');

    if (fs.existsSync(coverPath)) {
      skippedCount++;
      continue;
    }

    if (!fs.existsSync(frontPdfPath)) {
      noPdfCount++;
      continue;
    }

    console.log(`📄 Processing: ${folder}/front.pdf`);

    const success = extractCoverFromPdf(frontPdfPath, coverPath);
    if (success) {
      console.log(`   ✅ Created: ${folder}/cover.png`);
      extractedCount++;
    } else {
      failedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`📂 Total folders: ${bookFolders.length}`);
  console.log(`✅ Extracted: ${extractedCount}`);
  console.log(`⏭️  Skipped (cover.png exists): ${skippedCount}`);
  console.log(`📚 No front.pdf: ${noPdfCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log('='.repeat(60) + '\n');

  if (extractedCount > 0) {
    console.log('💡 Next step: Run "npx tsx prisma/seed-cover-images.ts" to register covers in DB');
  }
}

main().catch((e) => {
  console.error('Script failed:', e);
  process.exit(1);
});
