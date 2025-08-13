import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
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
      // Custom email verification
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
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
    async signIn({ user, account, profile }) {
      // Allow sign in
      return true
    },
    
    async session({ session, token, user }) {
      if (session?.user) {
        // Add user ID and role to session
        session.user.id = user.id
        session.user.role = (user as any).role || UserRole.LEARNER
        session.user.emailVerified = user.emailVerified
      }
      return session
    },
    
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || UserRole.LEARNER
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