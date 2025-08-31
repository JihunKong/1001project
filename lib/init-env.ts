/**
 * Environment initialization module
 * This module should be imported at the very beginning of the application
 * to ensure environment variables are loaded from SSM if available
 */

import { initializeSSM } from './aws-ssm';

let initialized = false;

/**
 * Initialize environment variables
 * This function loads environment variables from AWS SSM in production
 * and falls back to .env files in development
 */
export async function initializeEnvironment(): Promise<void> {
  if (initialized) {
    return;
  }
  
  try {
    // Load from SSM in production
    if (process.env.NODE_ENV === 'production' && process.env.USE_SSM !== 'false') {
      console.log('[ENV] Initializing environment from AWS SSM...');
      await initializeSSM();
    } else {
      console.log('[ENV] Using environment variables from .env files');
    }
    
    // Validate critical environment variables
    validateEnvironment();
    
    initialized = true;
    console.log('[ENV] Environment initialization completed');
    
  } catch (error) {
    console.error('[ENV] Failed to initialize environment:', error);
    // Don't throw - allow application to continue with existing env vars
  }
}

/**
 * Validate that critical environment variables are present
 */
function validateEnvironment(): void {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('[ENV] Missing critical environment variables:', missing);
    
    // In production, this is more serious
    if (process.env.NODE_ENV === 'production') {
      console.error('[ENV] Critical environment variables are missing in production!');
      // Still don't throw - let the application handle missing vars gracefully
    }
  }
}

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key: string, fallback?: string): string | undefined {
  return process.env[key] || fallback;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if SSM is enabled
 */
export function isSSMEnabled(): boolean {
  return isProduction() && process.env.USE_SSM !== 'false';
}