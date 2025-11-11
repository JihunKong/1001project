import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating missing test accounts...\n');

  const testPassword = await bcrypt.hash('test1234', 12);
  console.log('✓ Password hash generated\n');

  // Create WRITER account
  try {
    const writer = await prisma.user.create({
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
          },
        },
      },
    });
    console.log(`✅ Created WRITER: ${writer.email}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`⚠️  WRITER account already exists`);
    } else {
      console.error(`❌ Error creating WRITER:`, error.message);
    }
  }

  // Create INSTITUTION account
  try {
    const institution = await prisma.user.create({
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
          },
        },
      },
    });
    console.log(`✅ Created INSTITUTION: ${institution.email}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`⚠️  INSTITUTION account already exists`);
    } else {
      console.error(`❌ Error creating INSTITUTION:`, error.message);
    }
  }

  console.log('\n🎉 Account creation completed!');
  console.log('\n📋 All Test Credentials:');
  console.log('   Password: test1234\n');
}

main()
  .catch((e) => {
    console.error('❌ Creation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
