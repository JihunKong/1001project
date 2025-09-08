import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { testAuthOptions, isTestMode } from "@/lib/auth-test"

// Use test auth options if in test mode, otherwise use regular auth options
const selectedAuthOptions = isTestMode() ? testAuthOptions : authOptions

// Log which mode is active (only in development)
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  console.log(`🔐 Auth Mode: ${isTestMode() ? 'TEST MODE (Password login enabled)' : 'Production Mode'}`)
}

const handler = NextAuth(selectedAuthOptions)

export { handler as GET, handler as POST }