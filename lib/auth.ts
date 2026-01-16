import { NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { executeWithAuthContext } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { isDemoEmail, getOrCreateDemoUser, isEmailServiceConfigured } from "@/lib/auth-demo"
import { createSecureAuthAdapter } from "@/lib/auth-adapter"
import { logger } from "@/lib/logger"
import { generateLinkToken } from "@/lib/auth-link-token"
import bcrypt from "bcryptjs"

// Password security constants
const SALT_ROUNDS = 12; // Industry standard for 2024

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Use secure cookies only when NEXTAUTH_URL uses HTTPS (runtime check)
// This works at runtime unlike NODE_ENV which is evaluated at build time
const getSecureCookieSettings = () => {
  const url = process.env.NEXTAUTH_URL || '';
  const isHttps = url.startsWith('https://');
  return {
    useSecureCookies: isHttps,
    cookiePrefix: isHttps ? '__Secure-' : '',
    hostCookiePrefix: isHttps ? '__Host-' : ''
  };
};

const { useSecureCookies, cookiePrefix, hostCookiePrefix } = getSecureCookieSettings();

export const authOptions: NextAuthOptions = {
  adapter: createSecureAuthAdapter(),

  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: useSecureCookies
      }
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: useSecureCookies
      }
    },
    csrfToken: {
      name: `${hostCookiePrefix}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: useSecureCookies
      }
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        maxAge: 900
      }
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        maxAge: 900
      }
    },
    nonce: {
      name: `${hostCookiePrefix}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies
      }
    }
  },

  providers: [
    // Admin/Staff Credentials Provider for password login
    CredentialsProvider({
      id: "credentials",
      name: "ID & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const { prisma } = await import("@/lib/prisma");
          
          // Find user with password
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          });
          
          // Prevent timing attacks - always check password even if user doesn't exist
          const dummyHash = '$2b$12$dummyhashtopreventtimingatks.abcdefghijklmnopqrstuvwxy';
          
          // Define proper type interface to avoid 'any'
          interface UserWithPassword {
            id: string;
            email: string;
            name: string | null;
            role: UserRole;
            emailVerified: Date | null;
            password?: string;
          }
          
          const userWithPassword = user as UserWithPassword;
          const userHash = userWithPassword?.password || dummyHash;
          const isValidPassword = await verifyPassword(credentials.password, userHash);
          
          // Only proceed if user exists, has password, and password is valid
          if (!user || !userWithPassword.password || !isValidPassword) {
            // Add consistent delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
            logger.security(`Failed login attempt`, { email: credentials.email });
            return null;
          }

          // Check if user has Google OAuth linked - if so, block password login
          const googleAccount = await prisma.account.findFirst({
            where: {
              userId: user.id,
              provider: 'google'
            }
          });

          if (googleAccount) {
            logger.security(`Password login blocked - Google OAuth linked`, { email: credentials.email });
            // Throw specific error that can be caught and handled
            throw new Error('GoogleLinkedAccount');
          }

          // Allow all roles to use password login
          logger.auth(`Successful password login`, { role: user.role, email: user.email });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          // Re-throw GoogleLinkedAccount error for special handling
          if (error instanceof Error && error.message === 'GoogleLinkedAccount') {
            throw error;
          }
          logger.error("Credentials authentication error", error);
          return null;
        }
      }
    }),

    // Demo Credentials Provider for demo accounts
    CredentialsProvider({
      id: "demo",
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // Check if demo mode is enabled
        if (process.env.DEMO_MODE_ENABLED !== 'true') return null;
        
        // Check if it's a demo email
        if (!isDemoEmail(credentials.email)) return null;
        
        // Get or create demo user
        const user = await getOrCreateDemoUser(credentials.email);
        
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
          };
        }
        
        return null;
      }
    }),
    
    // Email Provider with fallback handling
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || '587'),
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_SERVER_USER,
          pass: process.env.SMTP_PASSWORD || process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM || "noreply@1001stories.org",
      // Custom email verification with demo bypass
      sendVerificationRequest: async ({ identifier: email, url }) => {
        if (isDemoEmail(email)) {
          logger.info(`Demo account detected - bypassing email verification`, { email });
          return;
        }

        if (!isEmailServiceConfigured()) {
          logger.warn('Email service not configured', { email, magicLink: url });
          return;
        }
        
        // Send actual email
        const { sendVerificationEmail } = await import("@/lib/email")
        await sendVerificationEmail(email, url)
      },
    }),
    
    // OAuth providers (to be configured later)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        profile(profile) {
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            emailVerified: profile.email_verified ? new Date() : null,
            role: UserRole.WRITER,
          };
        }
      })
    ] : []),
  ],
  
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/auth/error",
    verifyRequest: "/verify-email",
    newUser: "/welcome"
  },
  
  callbacks: {
    async signIn({ user, account, email }) {
      // For demo accounts, create/update user if needed
      if (account?.provider === 'demo' || (email && typeof email === 'string' && isDemoEmail(email))) {
        const demoUser = await getOrCreateDemoUser(user.email!);
        if (demoUser) {
          user.id = demoUser.id;
          user.role = demoUser.role;
        }
      }

      // OAuth account linking security
      if (account?.provider === 'google' && user.email) {
        try {
          const { prisma } = await import("@/lib/prisma");

          // Check if user with this email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() }
          });

          // If user exists but has no linked account, prevent automatic linking
          // User must manually link accounts from their profile settings
          if (existingUser) {
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser.id,
                provider: account.provider
              }
            });

            if (!existingAccount) {
              logger.security(`OAuth account linking blocked - redirecting to link page`, { email: user.email });

              // Generate link token with OAuth credentials for secure account linking
              const linkToken = generateLinkToken({
                userId: existingUser.id,
                email: user.email,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                expiresAt: account.expires_at,
                tokenType: account.token_type,
                scope: account.scope,
                idToken: account.id_token,
              });

              const encodedEmail = encodeURIComponent(user.email);
              const encodedToken = encodeURIComponent(linkToken);
              return `/auth/link-account?email=${encodedEmail}&provider=${account.provider}&token=${encodedToken}`;
            }

            // Google OAuth 사용자의 emailVerified 업데이트 (Google은 이미 이메일 인증을 완료함)
            if (!existingUser.emailVerified) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { emailVerified: new Date() }
              });
              logger.auth('Updated emailVerified for Google OAuth user', { email: user.email });
            }
          }
        } catch (error) {
          logger.error('OAuth sign in verification error', error);
          return false;
        }
      }

      // Allow sign in
      return true
    },
    
    async session({ session, token }) {
      try {
        if (session?.user && token) {
          logger.debug('Creating session', { email: session.user.email, tokenId: token.id });
          session.user.id = token.id as string
          session.user.role = (token.role as UserRole) || UserRole.WRITER
          session.user.emailVerified = token.emailVerified as Date | null
          session.user.isMinor = token.isMinor as boolean | undefined
          session.user.parentalConsentStatus = token.parentalConsentStatus as string | undefined
          session.user.coppaCompliant = token.coppaCompliant as boolean | undefined
          logger.debug('Session created successfully', { email: session.user.email, role: session.user.role });
        }
        return session
      } catch (error) {
        logger.error('Session callback error', error);
        throw error;
      }
    },
    
    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          logger.debug('Creating JWT token', { email: user.email, role: (user as { role?: UserRole }).role });
          token.id = user.id
          token.role = (user as { role?: UserRole }).role || UserRole.WRITER
          token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified

          const { prisma } = await import("@/lib/prisma");
          const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
              isMinor: true,
              parentalConsentStatus: true,
              coppaCompliant: true,
            }
          });

          if (profile) {
            token.isMinor = profile.isMinor;
            token.parentalConsentStatus = profile.parentalConsentStatus;
            token.coppaCompliant = profile.coppaCompliant;
          }

          logger.debug('JWT token created successfully', { email: user.email });
        }

        if (trigger === 'update') {
          const { prisma } = await import("@/lib/prisma");
          const profile = await prisma.profile.findUnique({
            where: { userId: token.id as string },
            select: {
              isMinor: true,
              parentalConsentStatus: true,
              coppaCompliant: true,
            }
          });

          if (profile) {
            token.isMinor = profile.isMinor;
            token.parentalConsentStatus = profile.parentalConsentStatus;
            token.coppaCompliant = profile.coppaCompliant;
          }
        }

        return token
      } catch (error) {
        logger.error('JWT callback error', error);
        throw error;
      }
    },
    
    async redirect({ url, baseUrl }) {
      // Public routes that should NOT redirect to dashboard
      const publicRoutes = ['/library', '/shop', '/about', '/contact', '/mission', '/partners', '/programs', '/team', '/terms', '/privacy', '/donate'];
      
      // Check if the URL is a public route
      const isPublicRoute = publicRoutes.some(route => 
        url === route || url.startsWith(`${route}/`)
      );
      
      // For public routes, allow the user to stay on that route
      if (isPublicRoute) {
        return url.startsWith("/") ? `${baseUrl}${url}` : url;
      }
      
      // Redirect to dashboard based on user role after sign in
      if (url === "/login" || url === "/signup") {
        return `${baseUrl}/dashboard`
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  
  events: {
    async createUser({ user }) {
      // Create default profile and subscription using RLS bypass
      await executeWithAuthContext(async (client) => {
        await client.profile.create({
          data: {
            userId: user.id,
            language: "en",
          }
        })

        await client.subscription.create({
          data: {
            userId: user.id,
            plan: "FREE",
            status: "ACTIVE",
          }
        })

        // Create VolunteerProfile for WRITER role (OAuth users default to WRITER)
        if (user.role === 'WRITER') {
          await client.volunteerProfile.create({
            data: {
              userId: user.id,
              verificationStatus: 'PENDING',
              languageLevels: {},
              availableSlots: {},
            }
          });
        }
      })
    },

    async signIn({ user, account }) {
      logger.auth(`User signed in`, {
        email: user.email,
        provider: account?.provider || 'unknown'
      });
    },
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days for regular users
    updateAge: 2 * 60 * 60, // Refresh session every 2 hours
  },

  debug: process.env.NODE_ENV === "development",
}

// Type augmentation for TypeScript
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
      emailVerified: Date | null
      // COPPA Compliance fields
      isMinor?: boolean
      parentalConsentStatus?: string
      coppaCompliant?: boolean
    }
  }

  interface User {
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    emailVerified?: Date | null
    // COPPA Compliance fields
    isMinor?: boolean
    parentalConsentStatus?: string
    coppaCompliant?: boolean
  }
}