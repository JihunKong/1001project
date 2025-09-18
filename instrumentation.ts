/**
 * Next.js Instrumentation
 * This file runs when the Next.js server starts
 */

export async function register() {
  // Environment variables are now loaded directly from .env files
  // AWS SSM integration has been removed for simplicity
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[ENV] Using environment variables from .env files');
  }
}