import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating/updating role-based test accounts...');

  // Hash password for all test accounts
  const testPassword = await bcrypt.hash('test1234', 12);

  console.log('👥 Upserting test accounts for each role...');

  const testAccounts = [
    {
      email: 'admin@test.1001stories.org',
      name: 'Admin Test User',
      role: UserRole.ADMIN,
      profile: { firstName: 'Admin', lastName: 'User', organization: '1001 Stories', bio: 'System administrator', location: 'Seoul, Korea', language: 'en', timezone: 'Asia/Seoul' },
    },
    {
      email: 'teacher@test.1001stories.org',
      name: 'Teacher Test User',
      role: UserRole.TEACHER,
      profile: { firstName: 'Sarah', lastName: 'Teacher', organization: 'Seoul International School', bio: 'Experienced teacher', location: 'Seoul, Korea', language: 'en', timezone: 'Asia/Seoul' },
    },
    {
      email: 'writer@test.1001stories.org',
      name: 'Writer Test User',
      role: UserRole.WRITER,
      profile: { firstName: 'Michael', lastName: 'Writer', bio: 'Passionate writer', location: 'San Francisco, USA', language: 'en', timezone: 'America/Los_Angeles' },
    },
    {
      email: 'institution@test.1001stories.org',
      name: 'Institution Test User',
      role: UserRole.INSTITUTION,
      profile: { firstName: 'Jane', lastName: 'Institution', organization: '1001 Stories Partner School', bio: 'Institution representative', location: 'New York, USA', language: 'en', timezone: 'America/New_York' },
    },
    {
      email: 'learner@test.1001stories.org',
      name: 'Learner Test User',
      role: UserRole.LEARNER,
      profile: { firstName: 'Emma', lastName: 'Student', dateOfBirth: new Date('2010-05-15'), bio: 'Curious student', location: 'Tokyo, Japan', language: 'en', timezone: 'Asia/Tokyo' },
    },
    {
      email: 'story-manager@test.1001stories.org',
      name: 'Story Manager Test User',
      role: UserRole.STORY_MANAGER,
      profile: { firstName: 'Alex', lastName: 'Manager', organization: '1001 Stories Editorial Team', bio: 'Story reviewer', location: 'London, UK', language: 'en', timezone: 'Europe/London' },
    },
    {
      email: 'book-manager@test.1001stories.org',
      name: 'Book Manager Test User',
      role: UserRole.BOOK_MANAGER,
      profile: { firstName: 'Jordan', lastName: 'Publisher', organization: '1001 Stories Publishing', bio: 'Publication strategist', location: 'Toronto, Canada', language: 'en', timezone: 'America/Toronto' },
    },
    {
      email: 'content-admin@test.1001stories.org',
      name: 'Content Admin Test User',
      role: UserRole.CONTENT_ADMIN,
      profile: { firstName: 'Morgan', lastName: 'Admin', organization: '1001 Stories Leadership', bio: 'Senior content administrator', location: 'Singapore', language: 'en', timezone: 'Asia/Singapore' },
    },
  ];

  const users = [];
  for (const account of testAccounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        password: testPassword,
        role: account.role,
        emailVerified: new Date(),
      },
      create: {
        email: account.email,
        name: account.name,
        password: testPassword,
        role: account.role,
        emailVerified: new Date(),
        profile: { create: account.profile },
      },
    });
    users.push(user);
    console.log(`  ✓ ${account.role}: ${account.email}`);
  }

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