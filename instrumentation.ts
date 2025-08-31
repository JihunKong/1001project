/**
 * Next.js Instrumentation
 * This file runs when the Next.js server starts
 * Perfect place to initialize environment variables from SSM
 */

import { initializeEnvironment } from './lib/init-env';

export async function register() {
  // Initialize environment variables from SSM if in production
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await initializeEnvironment();
  }
}