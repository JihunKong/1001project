import crypto from 'crypto';

export function generateContentHash(content: string): string {
  const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function calculateWordSimilarity(oldContent: string, newContent: string): number {
  const oldWords = new Set(oldContent.toLowerCase().split(/\s+/).filter(w => w.length > 0));
  const newWords = new Set(newContent.toLowerCase().split(/\s+/).filter(w => w.length > 0));

  if (oldWords.size === 0 && newWords.size === 0) return 1;
  if (oldWords.size === 0 || newWords.size === 0) return 0;

  const intersection = new Set([...oldWords].filter(x => newWords.has(x)));
  const union = new Set([...oldWords, ...newWords]);

  return intersection.size / union.size;
}

export function hasContentChangedSignificantly(
  oldContent: string | null,
  newContent: string,
  threshold: number = 0.5
): boolean {
  if (!oldContent) return true;

  const similarity = calculateWordSimilarity(oldContent, newContent);
  return similarity < threshold;
}
