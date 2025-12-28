import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';

export interface LinkTokenPayload {
  userId: string;
  email: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  idToken?: string;
  action: 'account-link';
}

export function generateLinkToken(payload: Omit<LinkTokenPayload, 'action'>): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured');
  }

  const tokenPayload: LinkTokenPayload = {
    ...payload,
    action: 'account-link',
  };

  logger.debug('Generating link token', { email: payload.email, provider: payload.provider });

  return jwt.sign(tokenPayload, secret, { expiresIn: '15m' });
}

export function verifyLinkToken(token: string): LinkTokenPayload | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    logger.error('NEXTAUTH_SECRET is not configured');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as LinkTokenPayload;

    if (decoded.action !== 'account-link') {
      logger.security('Invalid link token action', { action: decoded.action });
      return null;
    }

    logger.debug('Link token verified', { email: decoded.email, provider: decoded.provider });
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Link token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.security('Invalid link token', { error: (error as Error).message });
    } else {
      logger.error('Link token verification error', error);
    }
    return null;
  }
}
