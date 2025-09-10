#!/usr/bin/env tsx

/**
 * Create production-ready user accounts for testing platform functionality
 * These are real user accounts, not test-specific accounts
 */

import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Production user accounts for platform testing
const PRODUCTION_ACCOUNTS = [
  // Admin account
  {
    email: 'admin@1001stories.org',
    name: 'Platform Administrator',
    role: UserRole.ADMIN,
    password: 'Admin2024!',
    bio: 'Platform administrator for 1001 Stories global education platform'
  },
  
  // Teacher accounts
  {
    email: 'teacher.kim@school.org',
    name: 'Teacher Kim Minji',
    role: UserRole.TEACHER,
    password: 'Teacher2024!',
    bio: 'English teacher at Seoul International School'
  },
  {
    email: 'teacher.lee@academy.org',
    name: 'Teacher Lee Jihoon',
    role: UserRole.TEACHER,
    password: 'Teacher2024!',
    bio: 'ESL instructor specializing in reading comprehension'
  },
  
  // Learner accounts
  {
    email: 'student.park@gmail.com',
    name: 'Park Soyoung',
    role: UserRole.LEARNER,
    password: 'Student2024!',
    bio: 'High school student learning English through stories'
  },
  {
    email: 'student.choi@student.org',
    name: 'Choi Minsu',
    role: UserRole.LEARNER,
    password: 'Student2024!',
    bio: 'University student interested in global literature'
  },
  {
    email: 'learner.jung@email.com',
    name: 'Jung Yuna',
    role: UserRole.LEARNER,
    password: 'Student2024!',
    bio: 'Adult learner improving English reading skills'
  },
  
  // Content management accounts
  {
    email: 'story.manager@1001stories.org',
    name: 'Story Manager Sarah',
    role: UserRole.STORY_MANAGER,
    password: 'Manager2024!',
    bio: 'Content reviewer and story quality manager'
  },
  {
    email: 'book.manager@1001stories.org',
    name: 'Book Manager David',
    role: UserRole.BOOK_MANAGER,
    password: 'Manager2024!',
    bio: 'Publication workflow and book format manager'
  },
  
  // Volunteer account
  {
    email: 'volunteer.maria@nonprofit.org',
    name: 'Volunteer Maria',
    role: UserRole.VOLUNTEER,
    password: 'Volunteer2024!',
    bio: 'Community volunteer contributing stories and content'
  }
]

async function createProductionAccounts() {
  console.log('🌟 Creating production user accounts for platform testing...\n')
  
  for (const account of PRODUCTION_ACCOUNTS) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email }
      })
      
      if (existingUser) {
        console.log(`✓ Account already exists: ${account.email} (${account.role})`)
        continue
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(account.password, 12)
      
      // Create user with profile
      const user = await prisma.user.create({
        data: {
          email: account.email,
          name: account.name,
          role: account.role,
          password: hashedPassword,
          emailVerified: new Date(),
          
          // Create associated profile
          profile: {
            create: {
              bio: account.bio,
              language: 'en'
            }
          },
          
          // Create subscription for all users
          subscriptions: {
            create: {
              plan: 'FREE',
              status: 'ACTIVE'
            }
          }
        },
        include: {
          profile: true,
          subscriptions: true
        }
      })
      
      console.log(`✅ Created account: ${account.email} (${account.role})`)
      
      // Create additional data for teachers
      if (account.role === UserRole.TEACHER) {
        // Create a class for teachers
        const classCode = `CLASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        
        await prisma.class.create({
          data: {
            name: `${account.name}'s English Class`,
            description: `English learning class managed by ${account.name}`,
            teacherId: user.id,
            code: classCode,
            grade: 'Mixed Level'
          }
        })
        
        console.log(`   📚 Created class with code: ${classCode}`)
      }
      
    } catch (error) {
      console.error(`❌ Error creating account ${account.email}:`, error)
    }
  }
  
  console.log('\n✨ Production accounts creation completed!')
  console.log('\n📋 Account Summary:')
  console.log('┌─────────────────────────────────────┬─────────────────┬─────────────────┐')
  console.log('│ Email                               │ Role            │ Password        │')
  console.log('├─────────────────────────────────────┼─────────────────┼─────────────────┤')
  
  for (const account of PRODUCTION_ACCOUNTS) {
    const email = account.email.padEnd(35)
    const role = account.role.padEnd(15)
    const password = account.password.padEnd(15)
    console.log(`│ ${email} │ ${role} │ ${password} │`)
  }
  
  console.log('└─────────────────────────────────────┴─────────────────┴─────────────────┘')
  console.log('\n🔐 Authentication Methods:')
  console.log('• ADMIN & VOLUNTEER roles: Can use password login at /login')
  console.log('• TEACHER & LEARNER roles: Use magic link via email at /login') 
  console.log('• All other roles: Magic link only')
  
  console.log('\n🌐 Access the platform at: http://localhost')
}

async function main() {
  try {
    await createProductionAccounts()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()