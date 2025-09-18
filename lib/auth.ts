import { NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { executeWithRLSBypass } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { isDemoEmail, getOrCreateDemoUser, isEmailServiceConfigured } from "@/lib/auth-demo"
import { createRLSBypassAdapter } from "@/lib/auth-adapter"
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

// Create adapter instance
const adapter = createRLSBypassAdapter();
console.log('[NextAuth Debug] Adapter created:', adapter ? 'Yes' : 'No');
console.log('[NextAuth Debug] Adapter type:', typeof adapter);
console.log('[NextAuth Debug] Adapter methods:', adapter ? Object.keys(adapter) : 'N/A');

// Enhanced secret validation
function getSecureSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET is required in production');
    }
    // Only allow fallback in development
    console.warn('[AUTH] Using fallback secret in development. Set NEXTAUTH_SECRET for production.');
    return 'dev-fallback-secret-change-in-production';
  }
  
  // Validate secret strength
  if (secret.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
  }
  
  return secret;
}

export const authOptions: NextAuthOptions = {
  adapter,
  secret: getSecureSecret(),
  
  // Simplified JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days for regular users
  },
  
  // Disable CSRF check for testing if environment variable is set
  ...(process.env.DISABLE_CSRF_CHECK === 'true' && {
    csrfCheck: false,
  }),
  
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
            // Log failed attempt for security monitoring
            console.warn(`Failed login attempt for email: ${credentials.email}`);
            return null;
          }
          
          // Allow all roles to use password login for testing
          console.log(`Password login successful for ${user.role}: ${user.email}`);
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          console.error("Credentials authentication error:", error);
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
        // Check if it's a demo email
        if (isDemoEmail(email)) {
          console.log(`Demo account detected: ${email} - bypassing email verification`);
          return; // Skip email sending for demo accounts
        }
        
        // Check if email service is configured
        if (!isEmailServiceConfigured()) {
          console.warn('Email service not configured. Cannot send verification email.');
          console.log(`Magic link for ${email}: ${url}`);
          return; // Skip email sending but log the link
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
        allowDangerousEmailAccountLinking: true,
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
      
      // Allow sign in
      return true
    },
    
    async session({ session, token }) {
      if (session?.user && token) {
        // Add user ID and role to session from token
        session.user.id = token.id as string
        session.user.role = (token.role as UserRole) || UserRole.CUSTOMER
        session.user.emailVerified = token.emailVerified as Date | null
        session.user.tokenVersion = token.tokenVersion as number
      }
      return session
    },
    
    async jwt({ token, user, trigger, session }) {
      // Enhanced JWT processing with better error handling and security
      const now = Math.floor(Date.now() / 1000);
      
      try {
        if (user) {
          // Initial token creation
          token.id = user.id
          token.role = (user as { role?: UserRole }).role || UserRole.CUSTOMER
          token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified
          token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion || 1
          token.createdAt = now
          token.lastActivity = now
          
          // Set shorter expiry for admin/volunteer accounts (8 hours instead of 30 days)
          const userRole = (user as { role?: UserRole }).role;
          if (userRole === UserRole.ADMIN || userRole === UserRole.VOLUNTEER) {
            token.exp = now + (8 * 60 * 60); // 8 hours
            token.privileged = true;
          } else {
            token.exp = now + (30 * 24 * 60 * 60); // 30 days
            token.privileged = false;
          }
          
          console.log(`[AUTH] JWT token created for ${userRole}: ${user.id}`);
        }
        
        // Enhanced token validation and refresh logic
        if (!user && token.id) {
          // Update last activity for session tracking
          token.lastActivity = now;
          
          // Check if token is expired
          if (token.exp && now >= (token.exp as number)) {
            console.log(`[AUTH] Token expired for user ${token.id}`);
            return {}; // Force logout
          }
          
          // Check if privileged account needs refresh (every 2 hours)
          const shouldRefresh = trigger === 'update' || 
            (token.privileged && (now - (token.lastRefresh as number || 0)) > 2 * 60 * 60);
          
          if (shouldRefresh) {
            try {
              const { prisma } = await import("@/lib/prisma");
              const dbUser = await prisma.user.findUnique({
                where: { id: token.id as string },
                select: { 
                  role: true, 
                  tokenVersion: true,
                  deletedAt: true,
                  // Check if account is still active
                  createdAt: true
                }
              });
              
              if (!dbUser || dbUser.deletedAt) {
                console.log(`[AUTH] User not found or deleted: ${token.id}`);
                return {}; // Force logout
              }
              
              // If tokenVersion has changed, invalidate this token
              if (dbUser.tokenVersion > (token.tokenVersion as number)) {
                console.log(`[AUTH] Token version mismatch for user ${token.id}: ${token.tokenVersion} vs ${dbUser.tokenVersion}`);
                return {}; // Return empty token to force logout
              }
              
              // Update token with fresh data
              token.role = dbUser.role;
              token.tokenVersion = dbUser.tokenVersion;
              token.lastRefresh = now;
              
              // Update expiry for role changes
              const userRole = dbUser.role;
              if (userRole === UserRole.ADMIN || userRole === UserRole.VOLUNTEER) {
                if (!token.privileged) {
                  // User was promoted, set shorter expiry
                  token.exp = now + (8 * 60 * 60); // 8 hours
                  token.privileged = true;
                  console.log(`[AUTH] User promoted to privileged role: ${token.id}`);
                }
              } else {
                if (token.privileged) {
                  // User was demoted, extend expiry
                  token.exp = now + (30 * 24 * 60 * 60); // 30 days
                  token.privileged = false;
                  console.log(`[AUTH] User demoted from privileged role: ${token.id}`);
                }
              }
              
            } catch (error) {
              console.error('[AUTH] Error refreshing user data in JWT callback:', error);
              // On database error, don't invalidate token unless it's a connection issue
              if (error instanceof Error && error.message.includes('connection')) {
                console.warn('[AUTH] Database connection issue, keeping existing token');
              }
            }
          }
        }
        
        return token;
        
      } catch (error) {
        console.error('[AUTH] JWT callback error:', error);
        // On unexpected errors, return empty token to force re-authentication
        return {};
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
        return "/dashboard"
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
      await executeWithRLSBypass(async (client) => {
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
      })
    },
    
    async signIn({ user }) {
      // Log sign in event (for analytics)
      console.log(`User ${user.email} signed in`)
    },
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days for regular users (overridden in JWT for privileged users)
    updateAge: 60 * 60, // Refresh session every hour for better security
    // Custom session handling
    generateSessionToken: () => {
      // Generate cryptographically secure session tokens
      const crypto = require('crypto');
      return crypto.randomBytes(32).toString('hex');
    }
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
      tokenVersion: number
    }
  }
  
  interface User {
    role: UserRole
    tokenVersion?: number
  }
}