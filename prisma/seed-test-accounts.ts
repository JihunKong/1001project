import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating role-based test accounts...');

  // Hash password for all test accounts
  const testPassword = await bcrypt.hash('test123', 12);

  // Delete existing test accounts if they exist
  console.log('🧹 Cleaning existing test accounts...');
  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: '@test.1001stories.org'
      }
    }
  });

  // Create role-based test accounts
  console.log('👥 Creating test accounts for each role...');

  const users = await Promise.all([
    // 1. ADMIN - System Administrator
    prisma.user.create({
      data: {
        email: 'admin@test.1001stories.org',
        name: 'Admin Test User',
        password: testPassword,
        role: UserRole.ADMIN,
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
            organization: '1001 Stories',
            bio: 'System administrator with full access to all features',
            location: 'Seoul, Korea',
            language: 'en',
            timezone: 'Asia/Seoul',
          },
        },
      },
    }),

    // 2. TEACHER - Educator
    prisma.user.create({
      data: {
        email: 'teacher@test.1001stories.org',
        name: 'Teacher Test User',
        password: testPassword,
        role: UserRole.TEACHER,
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: 'Sarah',
            lastName: 'Teacher',
            organization: 'Seoul International School',
            bio: 'Experienced teacher managing classes and student assignments',
            location: 'Seoul, Korea',
            language: 'en',
            timezone: 'Asia/Seoul',
            teachingLevel: 'Middle School',
            subjects: ['English', 'Literature'],
            studentCount: 25,
          },
        },
      },
    }),

    // 3. VOLUNTEER - Content Contributor
    prisma.user.create({
      data: {
        email: 'volunteer@test.1001stories.org',
        name: 'Volunteer Test User',
        password: testPassword,
        role: UserRole.WRITER,
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: 'Michael',
            lastName: 'Volunteer',
            bio: 'Passionate volunteer creating educational stories for global impact',
            location: 'San Francisco, USA',
            language: 'en',
            timezone: 'America/Los_Angeles',
            skills: ['Writing', 'Translation', 'Content Creation'],
            availability: 'Weekends, 5-10 hours per week',
            experience: 'Creative writing and educational content development',
          },
        },
      },
    }),

    // 4. INSTITUTION - Educational Institution Representative
    prisma.user.create({
      data: {
        email: 'institution@test.1001stories.org',
        name: 'Institution Test User',
        password: testPassword,
        role: UserRole.INSTITUTION,
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: 'Jane',
            lastName: 'Institution',
            organization: '1001 Stories Partner School',
            bio: 'Educational institution representative managing institutional access',
            location: 'New York, USA',
            language: 'en',
            timezone: 'America/New_York',
            skills: ['Institution Management', 'Educational Planning', 'Student Administration'],
            experience: '8 years in educational institution management',
          },
        },
      },
    }),

    // 5. LEARNER - Student
    prisma.user.create({
      data: {
        email: 'learner@test.1001stories.org',
        name: 'Learner Test User',
        password: testPassword,
        role: UserRole.LEARNER,
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: 'Emma',
            lastName: 'Student',
            dateOfBirth: new Date('2010-05-15'),
            bio: 'Curious student eager to learn through engaging stories',
            location: 'Tokyo, Japan',
            language: 'en',
            timezone: 'Asia/Tokyo',
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} test accounts successfully!`);
  console.log('\n📋 Test Account Credentials:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ Role             │ Email                              │ Password │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ ADMIN            │ admin@test.1001stories.org        │ test123  │');
  console.log('│ TEACHER          │ teacher@test.1001stories.org      │ test123  │');
  console.log('│ VOLUNTEER        │ volunteer@test.1001stories.org    │ test123  │');
  console.log('│ INSTITUTION      │ institution@test.1001stories.org  │ test123  │');
  console.log('│ LEARNER          │ learner@test.1001stories.org      │ test123  │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('\n🌐 Test at: http://localhost:8001');
  console.log('🔗 Each role has specific dashboard access and permissions');
}

main()
  .catch((e) => {
    console.error('❌ Error creating test accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });