import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating/updating role-based test accounts...');

  // Hash password for all test accounts
  const testPassword = await bcrypt.hash('test1234', 12);

  console.log('👥 Upserting test accounts for each role...');

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

    // 3. WRITER - Content Contributor
    prisma.user.create({
      data: {
        email: 'writer@test.1001stories.org',
        name: 'Writer Test User',
        password: testPassword,
        role: UserRole.WRITER,
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: 'Michael',
            lastName: 'Writer',
            bio: 'Passionate writer creating educational stories for global impact',
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

    // 6. STORY_MANAGER - Content Reviewer
    prisma.user.create({
      data: {
        email: 'story-manager@test.1001stories.org',
        name: 'Story Manager Test User',
        password: testPassword,
        role: UserRole.STORY_MANAGER,
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: 'Alex',
            lastName: 'Manager',
            organization: '1001 Stories Editorial Team',
            bio: 'Experienced story reviewer ensuring quality content for global readers',
            location: 'London, UK',
            language: 'en',
            timezone: 'Europe/London',
            skills: ['Content Review', 'Editorial Feedback', 'Quality Assurance'],
            experience: '5 years in children\'s literature editing',
          },
        },
      },
    }),

    // 7. BOOK_MANAGER - Publication Format Specialist
    prisma.user.create({
      data: {
        email: 'book-manager@test.1001stories.org',
        name: 'Book Manager Test User',
        password: testPassword,
        role: UserRole.BOOK_MANAGER,
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: 'Jordan',
            lastName: 'Publisher',
            organization: '1001 Stories Publishing',
            bio: 'Publication format strategist deciding optimal presentation for stories',
            location: 'Toronto, Canada',
            language: 'en',
            timezone: 'America/Toronto',
            skills: ['Publication Planning', 'Format Design', 'Content Strategy'],
            experience: '7 years in educational publishing',
          },
        },
      },
    }),

    // 8. CONTENT_ADMIN - Final Approval Authority
    prisma.user.create({
      data: {
        email: 'content-admin@test.1001stories.org',
        name: 'Content Admin Test User',
        password: testPassword,
        role: UserRole.CONTENT_ADMIN,
        emailVerified: new Date(),
        profile: {
          create: {
            firstName: 'Morgan',
            lastName: 'Admin',
            organization: '1001 Stories Leadership',
            bio: 'Senior content administrator with final publication authority',
            location: 'Singapore',
            language: 'en',
            timezone: 'Asia/Singapore',
            skills: ['Content Governance', 'Publication Standards', 'Quality Control'],
            experience: '10 years in educational content management',
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} test accounts successfully!`);
  console.log('\n📋 Test Account Credentials:');
  console.log('┌──────────────────────────────────────────────────────────────────┐');
  console.log('│ Role             │ Email                              │ Password │');
  console.log('├──────────────────────────────────────────────────────────────────┤');
  console.log('│ ADMIN            │ admin@test.1001stories.org         │ test1234 │');
  console.log('│ TEACHER          │ teacher@test.1001stories.org       │ test1234 │');
  console.log('│ WRITER           │ writer@test.1001stories.org        │ test1234 │');
  console.log('│ INSTITUTION      │ institution@test.1001stories.org   │ test1234 │');
  console.log('│ LEARNER          │ learner@test.1001stories.org       │ test1234 │');
  console.log('│ STORY_MANAGER    │ story-manager@test.1001stories.org │ test1234 │');
  console.log('│ BOOK_MANAGER     │ book-manager@test.1001stories.org  │ test1234 │');
  console.log('│ CONTENT_ADMIN    │ content-admin@test.1001stories.org │ test1234 │');
  console.log('└──────────────────────────────────────────────────────────────────┘');
  console.log('\n🌐 Test at: http://localhost:8001');
  console.log('🔗 Each role has specific dashboard access and permissions');
  console.log('📝 Publishing Workflow: WRITER → STORY_MANAGER → BOOK_MANAGER → CONTENT_ADMIN → PUBLISHED');
}

main()
  .catch((e) => {
    console.error('❌ Error creating test accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });