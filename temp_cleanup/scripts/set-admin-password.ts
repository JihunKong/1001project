#!/usr/bin/env tsx

/**
 * Script to set admin password for production use
 * Usage: npx tsx scripts/set-admin-password.ts <email> <password>
 */

import { PrismaClient, UserRole } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function setAdminPassword(email: string, password: string) {
  try {
    console.log('🔧 Setting admin password...')
    
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required')
    }
    
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
    
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    if (!adminUser) {
      throw new Error(`User with email ${email} not found`)
    }
    
    if (adminUser.role !== UserRole.ADMIN) {
      throw new Error(`User ${email} is not an admin (role: ${adminUser.role})`)
    }
    
    // Hash password
    console.log('🔐 Hashing password...')
    const hashedPassword = await hashPassword(password)
    
    // Update user with password
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword }
    })
    
    console.log('✅ Admin password set successfully!')
    console.log(`📧 Admin user: ${email}`)
    console.log('🔑 Password login is now enabled for this admin')
    
  } catch (error) {
    console.error('❌ Error setting admin password:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: npx tsx scripts/set-admin-password.ts <email> <password>')
  console.error('Example: npx tsx scripts/set-admin-password.ts admin@example.com mySecurePassword123')
  process.exit(1)
}

const [email, password] = args

// Run the script
setAdminPassword(email, password)
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })