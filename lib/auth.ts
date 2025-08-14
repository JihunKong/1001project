import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { isDemoEmail, getOrCreateDemoUser, isEmailServiceConfigured } from "@/lib/auth-demo"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
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
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM || "noreply@1001stories.org",
      // Custom email verification with demo bypass
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
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
    async signIn({ user, account, profile, email, credentials }) {
      // For demo accounts, create/update user if needed
      if (account?.provider === 'demo' || (email && isDemoEmail(email.verificationRequest ? email.verificationRequest : ''))) {
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
        session.user.role = (token.role as UserRole) || UserRole.LEARNER
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
    
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: UserRole }).role || UserRole.LEARNER
        token.emailVerified = user.emailVerified
      }
      return token
    },
    
    async redirect({ url, baseUrl }) {
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
      // Create default profile for new user
      await prisma.profile.create({
        data: {
          userId: user.id,
          language: "en",
        }
      })
      
      // Create default free subscription
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: "FREE",
          status: "ACTIVE",
        }
      })
    },
    
    async signIn({ user, account, profile, isNewUser }) {
      // Log sign in event (for analytics)
      console.log(`User ${user.email} signed in`)
    },
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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