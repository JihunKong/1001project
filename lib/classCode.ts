import { randomInt } from 'crypto';
import { prisma } from './prisma';

// Use characters that are easy to distinguish
// Exclude confusing characters like 0/O, 1/I, L/1
const SAFE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generate a unique 6-character alphanumeric class code
 * Uses characters that are easy to distinguish and avoids confusing combinations
 */
export function generateClassCode(): string {
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = randomInt(0, SAFE_CHARS.length);
    code += SAFE_CHARS[randomIndex];
  }
  
  return code;
}

/**
 * Generate a unique class code that doesn't exist in the database
 */
export async function generateUniqueClassCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateClassCode();
    
    // Check if code already exists
    const existing = await prisma.class.findUnique({
      where: { code },
      select: { id: true }
    });
    
    if (!existing) {
      return code;
    }
    
    attempts++;
  }
  
  // If we couldn't generate a unique code after max attempts,
  // add a timestamp component to ensure uniqueness
  const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
  return generateClassCode().slice(0, 3) + timestamp;
}

/**
 * Validate a class code format
 */
export function isValidClassCode(code: string): boolean {
  // Must be exactly 6 characters
  if (code.length !== 6) return false;
  
  // Must contain only allowed characters (same as SAFE_CHARS)
  const validPattern = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;
  return validPattern.test(code);
}

/**
 * Format a class code for display (add dash for readability)
 */
export function formatClassCode(code: string): string {
  if (code.length !== 6) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Parse a formatted class code (remove dash and convert to uppercase)
 */
export function parseClassCode(formattedCode: string): string {
  return formattedCode.replace(/-/g, '').toUpperCase();
}

/**
 * Check if a class code exists in the database
 */
export async function classCodeExists(code: string): Promise<boolean> {
  const existing = await prisma.class.findUnique({
    where: { code },
    select: { id: true }
  });
  
  return !!existing;
}

/**
 * Find a class by its code
 */
export async function findClassByCode(code: string) {
  const parsedCode = parseClassCode(code);
  
  if (!isValidClassCode(parsedCode)) {
    return null;
  }
  
  return await prisma.class.findUnique({
    where: { code: parsedCode },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        }
      },
      _count: {
        select: {
          enrollments: true,
        }
      }
    }
  });
}

/**
 * Get class statistics by code
 */
export async function getClassStats(code: string) {
  const classRecord = await findClassByCode(code);
  
  if (!classRecord) {
    return null;
  }
  
  const activeEnrollments = await prisma.classEnrollment.count({
    where: {
      classId: classRecord.id,
      status: 'ACTIVE',
    }
  });
  
  return {
    ...classRecord,
    formattedCode: formatClassCode(classRecord.code),
    activeEnrollments,
    hasAvailableSpots: activeEnrollments < classRecord.maxStudents,
    isActive: classRecord.isActive && new Date() < classRecord.endDate,
    daysRemaining: Math.max(0, Math.ceil((classRecord.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
  };
}