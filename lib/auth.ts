import { NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { executeWithAuthContext } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { isDemoEmail, getOrCreateDemoUser, isEmailServiceConfigured } from "@/lib/auth-demo"
import { createSecureAuthAdapter } from "@/lib/auth-adapter"
import { logger } from "@/lib/logger"
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

export const authOptions: NextAuthOptions = {
  adapter: createSecureAuthAdapter(),

  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    pkceCodeVerifier: {
      name: `__Secure-next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        maxAge: 900
      }
    },
    state: {
      name: `__Secure-next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        maxAge: 900
      }
    },
    nonce: {
      name: `__Host-next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
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
              logger.security(`OAuth account linking blocked - manual linking required`, { email: user.email });
              return '/auth/error?error=AccountLinkingRequired';
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
          session.user.role = (token.role as UserRole) || UserRole.LEARNER
          session.user.emailVerified = token.emailVerified as Date | null
          logger.debug('Session created successfully', { email: session.user.email, role: session.user.role });
        }
        return session
      } catch (error) {
        logger.error('Session callback error', error);
        throw error;
      }
    },
    
    async jwt({ token, user }) {
      try {
        if (user) {
          logger.debug('Creating JWT token', { email: user.email, role: (user as { role?: UserRole }).role });
          token.id = user.id
          token.role = (user as { role?: UserRole }).role || UserRole.LEARNER
          token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified
          logger.debug('JWT token created successfully', { email: user.email });
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
    }
  }
  
  interface User {
    role: UserRole
  }
}