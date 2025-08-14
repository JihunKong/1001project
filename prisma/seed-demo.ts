import { PrismaClient, UserRole, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Demo account configurations
const DEMO_ACCOUNTS = [
  {
    email: 'learner@demo.1001stories.org',
    name: 'Demo Learner',
    role: UserRole.LEARNER,
    description: 'Demo account for learner role',
  },
  {
    email: 'teacher@demo.1001stories.org', 
    name: 'Demo Teacher',
    role: UserRole.TEACHER,
    description: 'Demo account for teacher role',
  },
  {
    email: 'volunteer@demo.1001stories.org',
    name: 'Demo Volunteer',
    role: UserRole.VOLUNTEER,
    description: 'Demo account for volunteer role',
  },
  {
    email: 'institution@demo.1001stories.org',
    name: 'Demo Institution',
    role: UserRole.INSTITUTION,
    description: 'Demo account for institution role',
  },
];

async function seedDemoAccounts() {
  console.log('🌱 Seeding demo accounts...');

  for (const account of DEMO_ACCOUNTS) {
    try {
      // Check if account already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email },
      });

      if (existingUser) {
        console.log(`✓ Demo account already exists: ${account.email}`);
        continue;
      }

      // Create demo user with complete profile
      const user = await prisma.user.create({
        data: {
          email: account.email,
          name: account.name,
          role: account.role,
          emailVerified: new Date(), // Mark as verified
          
          // Create profile
          profile: {
            create: {
              bio: account.description,
              language: 'en',
              organization: account.role === UserRole.INSTITUTION ? 'Demo School' : undefined,
            },
          },
          
          // Create subscription based on role
          subscription: {
            create: {
              plan: account.role === UserRole.TEACHER || account.role === UserRole.INSTITUTION 
                ? SubscriptionPlan.PREMIUM 
                : SubscriptionPlan.FREE,
              status: SubscriptionStatus.ACTIVE,
              maxStudents: account.role === UserRole.TEACHER ? 100 : 30,
              maxDownloads: account.role === UserRole.TEACHER ? 999 : 10,
              canAccessPremium: account.role !== UserRole.LEARNER,
              canDownloadPDF: account.role !== UserRole.LEARNER,
              canCreateClasses: account.role === UserRole.TEACHER || account.role === UserRole.INSTITUTION,
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            },
          },
        },
        include: {
          profile: true,
          subscription: true,
        },
      });

      console.log(`✅ Created demo account: ${account.email} (${account.role})`);

      // Create sample data based on role
      if (account.role === UserRole.TEACHER) {
        // Create a sample classroom
        await prisma.classroom.create({
          data: {
            name: 'Demo Classroom',
            description: 'A sample classroom for demonstration',
            teacherId: user.id,
            gradeLevel: '5th Grade',
            subject: 'English Literature',
            accessCode: 'DEMO123',
            isActive: true,
          },
        });
        console.log(`  📚 Created demo classroom for teacher`);
      }

      if (account.role === UserRole.VOLUNTEER) {
        // Create volunteer profile
        await prisma.volunteerProfile.create({
          data: {
            userId: user.id,
            skills: ['Translation', 'Illustration', 'Teaching'],
            languages: ['English', 'Korean', 'Spanish'],
            availability: 'Weekends',
            experience: '3 years of teaching experience',
            motivation: 'Passionate about education and helping children',
            hoursPerWeek: 10,
            isActive: true,
          },
        });
        console.log(`  💝 Created volunteer profile`);
      }

    } catch (error) {
      console.error(`❌ Error creating demo account ${account.email}:`, error);
    }
  }

  console.log('\n📊 Demo Account Summary:');
  console.log('------------------------');
  for (const account of DEMO_ACCOUNTS) {
    console.log(`${account.role.padEnd(12)} : ${account.email}`);
  }
  console.log('------------------------');
  console.log('\n✨ Demo accounts seeding completed!');
}

// Execute seed
seedDemoAccounts()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });