import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

interface TranslationRow {
  key: string;
  context: string;
  [lang: string]: string;
}

export type Translations = Record<string, any>;

const SUPPORTED_LANGUAGES = ['en', 'ko', 'es', 'ar', 'hi', 'fr', 'de', 'ja', 'pt', 'ru', 'it', 'zh'];

function setNestedValue(obj: any, path: string, value: string): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;

  let current = obj;
  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
}

export function loadTranslationsFromCSV(csvPath?: string): Record<string, Translations> {
  const filePath = csvPath || path.join(process.cwd(), 'locales', 'translations.csv');

  const csvContent = fs.readFileSync(filePath, 'utf-8');

  const parseResult = Papa.parse<TranslationRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${JSON.stringify(parseResult.errors)}`);
  }

  const translations: Record<string, Translations> = {};

  SUPPORTED_LANGUAGES.forEach(lang => {
    translations[lang] = {};
  });

  parseResult.data.forEach(row => {
    const key = row.key?.trim();
    if (!key) return;

    SUPPORTED_LANGUAGES.forEach(lang => {
      const value = row[lang]?.trim() || row['en']?.trim() || key;
      setNestedValue(translations[lang], key, value);
    });
  });

  return translations;
}

export function generateTranslationFiles(outputDir?: string): void {
  const translations = loadTranslationsFromCSV();
  const dir = outputDir || path.join(process.cwd(), 'locales', 'generated');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  Object.entries(translations).forEach(([lang, data]) => {
    const filePath = path.join(dir, `${lang}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  });
}

if (require.main === module) {
  generateTranslationFiles();
}
