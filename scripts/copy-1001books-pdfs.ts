import * as fs from 'fs';
import * as path from 'path';

const SOURCE_BASE = '/Users/jihunkong/1001project/1001books';
const TARGET_BASE = path.join(process.cwd(), 'public', 'books');

interface BookMapping {
  folder: string;
  slug: string;
  title: string;
  language: string;
  ageRange: string;
}

const BOOK_MAPPINGS: BookMapping[] = [
  { folder: '01_ Neema_01', slug: 'neema-01', title: 'Neema Part One', language: 'en', ageRange: '9-12' },
  { folder: '02_ Neema_02', slug: 'neema-02', title: 'Neema Part Two', language: 'en', ageRange: '9-12' },
  { folder: '03_ Neema_03', slug: 'neema-03', title: 'Neema Part Three', language: 'en', ageRange: '9-12' },
  { folder: '04_ Second chance', slug: 'second-chance', title: 'The Second Chance', language: 'en', ageRange: '9-12' },
  { folder: '05_ Angel prayer', slug: 'angel-prayer', title: "Angel's Prayer", language: 'en', ageRange: '9-12' },
  { folder: '06_ Martha_01', slug: 'martha-01', title: 'Martha Story Part One', language: 'en', ageRange: '9-12' },
  { folder: '07_ Martha_02', slug: 'martha-02', title: 'Martha Story Part Two', language: 'en', ageRange: '9-12' },
  { folder: '08_ Martha_03', slug: 'martha-03', title: 'Martha Story Part Three', language: 'en', ageRange: '9-12' },
  { folder: '09_ Never give up', slug: 'never-give-up', title: 'Never Give Up', language: 'en', ageRange: '9-12' },
  { folder: '10_ Appreciation', slug: 'appreciation', title: 'Appreciation', language: 'en', ageRange: '9-12' },
  { folder: '11_ The eyes of the sun', slug: 'eyes-of-the-sun', title: 'The Eyes of the Sun', language: 'en', ageRange: '9-12' },
  { folder: '12_ Who is real', slug: 'who-is-real', title: 'Who is Real Hero', language: 'en', ageRange: '9-12' },
  { folder: '13 _ Kakama _01', slug: 'kakama-01', title: 'Kakama and Rebels Part One', language: 'en', ageRange: '9-12' },
  { folder: '14 _ Kakama_02', slug: 'kakama-02', title: 'Kakama and Rebels Part Two', language: 'en', ageRange: '9-12' },
  { folder: '15_ My life _Span', slug: 'my-life-span', title: 'Mi Vida (My Life)', language: 'es', ageRange: '9-12' },
  { folder: "16_ My Life_ P'urhépecha", slug: 'my-life-purhepecha', title: "Mi Vida (P'urhépecha)", language: 'es', ageRange: '9-12' },
  { folder: '17_ My life_Eng', slug: 'my-life-eng', title: 'My Life', language: 'en', ageRange: '9-12' },
  { folder: '18_ Check point_ Span', slug: 'checkpoint-span', title: 'Punto de Control (Checkpoint)', language: 'es', ageRange: '9-12' },
  { folder: '19_ Check point_ Eng', slug: 'checkpoint-eng', title: 'Checkpoint', language: 'en', ageRange: '9-12' },
  { folder: '20_ Steet boy_part01_Span', slug: 'street-boy-01-span', title: 'El Chico de la Calle Parte 1', language: 'es', ageRange: '9-12' },
  { folder: '21. Street boy_part 02_Span Folder', slug: 'street-boy-02-span', title: 'El Chico de la Calle Parte 2', language: 'es', ageRange: '9-12' },
  { folder: '22_ Street boy_part02_Eng', slug: 'street-boy-02-eng', title: 'The Street Boy Part Two', language: 'en', ageRange: '9-12' },
  { folder: '23_ The three boys_ Eng', slug: 'three-boys-eng', title: 'The Three Boys', language: 'en', ageRange: '9-12' },
  { folder: '24_ The story of a thief_ Eng', slug: 'story-of-thief', title: 'The Story of a Thief', language: 'en', ageRange: '9-12' },
  { folder: '25_ The Three Boys_ Span', slug: 'three-boys-span', title: 'Los Tres Chicos', language: 'es', ageRange: '9-12' },
  { folder: "26_ The indian boy's", slug: 'indian-boys-petition', title: "The Indian Boy's Last Petition", language: 'en', ageRange: '9-12' },
  { folder: '27_ Fatuma', slug: 'fatuma', title: 'Fatuma Story', language: 'en', ageRange: '9-12' },
  { folder: '28_ Greedy Fisherman', slug: 'greedy-fisherman', title: 'The Greedy Fisherman', language: 'en', ageRange: '9-12' },
  { folder: '29. Street boy_part 01_ENG Folder', slug: 'street-boy-01-eng', title: 'The Street Boy Part One', language: 'en', ageRange: '9-12' },
  { folder: '29_ Girl with a hope_ Eng', slug: 'girl-with-hope', title: 'Girl with a Hope', language: 'en', ageRange: '9-12' },
  { folder: '30_ Mirror', slug: 'mirror', title: 'The Mirror Story', language: 'en', ageRange: '9-12' },
  { folder: '31. A gril come to stanford', slug: 'girl-to-stanford', title: 'A Girl Goes to Stanford', language: 'en', ageRange: '9-12' },
  { folder: '32_The indian girl helping father', slug: 'indian-girl-helping-father', title: 'The Indian Girl Helping Father', language: 'en', ageRange: '9-12' },
];

type PdfType = 'main' | 'front' | 'back';

function identifyPdfType(filename: string): PdfType | null {
  const lower = filename.toLowerCase();

  if (lower.includes('inside') || lower.includes('insdie') || lower.includes('edit') || lower.includes('_eng.pdf') || lower.includes('_span.pdf') || lower.includes('_pur.pdf')) {
    return 'main';
  }

  if (lower.includes('front')) {
    return 'front';
  }

  if (lower.includes('back') || lower.includes('black')) {
    return 'back';
  }

  return null;
}

function copyFile(src: string, dest: string): boolean {
  try {
    fs.copyFileSync(src, dest);
    return true;
  } catch (error) {
    console.error(`  Error copying ${src}: ${error}`);
    return false;
  }
}

function processBookFolder(mapping: BookMapping): { success: boolean; files: Record<PdfType, string | null> } {
  const sourceDir = path.join(SOURCE_BASE, mapping.folder);
  const targetDir = path.join(TARGET_BASE, mapping.slug);

  const result: Record<PdfType, string | null> = {
    main: null,
    front: null,
    back: null,
  };

  if (!fs.existsSync(sourceDir)) {
    console.log(`  Source folder not found: ${sourceDir}`);
    return { success: false, files: result };
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(sourceDir).filter(f => f.toLowerCase().endsWith('.pdf'));

  for (const file of files) {
    const pdfType = identifyPdfType(file);
    if (!pdfType) {
      console.log(`  Unknown PDF type: ${file}`);
      continue;
    }

    if (result[pdfType]) {
      console.log(`  Duplicate ${pdfType} PDF found: ${file} (already have one)`);
      continue;
    }

    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, `${pdfType}.pdf`);

    if (copyFile(sourcePath, targetPath)) {
      result[pdfType] = `/books/${mapping.slug}/${pdfType}.pdf`;
      console.log(`  Copied ${pdfType}.pdf from ${file}`);
    }
  }

  return { success: result.main !== null, files: result };
}

function main() {
  console.log('=== 1001books PDF Copy Script ===\n');
  console.log(`Source: ${SOURCE_BASE}`);
  console.log(`Target: ${TARGET_BASE}\n`);

  if (!fs.existsSync(TARGET_BASE)) {
    fs.mkdirSync(TARGET_BASE, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;
  const bookData: Array<BookMapping & { pdfPaths: Record<PdfType, string | null> }> = [];

  for (const mapping of BOOK_MAPPINGS) {
    console.log(`\nProcessing: ${mapping.title} (${mapping.slug})`);
    const result = processBookFolder(mapping);

    if (result.success) {
      successCount++;
      bookData.push({ ...mapping, pdfPaths: result.files });
    } else {
      failCount++;
      console.log(`  FAILED: No main PDF found`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total: ${BOOK_MAPPINGS.length}`);

  const outputPath = path.join(process.cwd(), 'scripts', 'book-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(bookData, null, 2));
  console.log(`\nBook data saved to: ${outputPath}`);
}

main();
