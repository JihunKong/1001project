import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test users...');

  const testUsers = [
    {
      email: 'teacher@test.edu',
      name: 'Test Teacher',
      password: 'Test123!',
      role: UserRole.TEACHER
    },
    {
      email: 'student1@test.edu',
      name: 'Student One',
      password: 'Student123!',
      role: UserRole.LEARNER
    },
    {
      email: 'student2@test.edu',
      name: 'Student Two',
      password: 'Student123!',
      role: UserRole.LEARNER
    },
    {
      email: 'admin@test.edu',
      name: 'Test Admin',
      password: 'Admin123!',
      role: UserRole.ADMIN
    }
  ];

  for (const userData of testUsers) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          emailVerified: new Date()
        },
        create: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          emailVerified: new Date()
        }
      });

      console.log(`✅ Created/Updated test user: ${userData.email} (${userData.role})`);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }

  console.log('✨ Test users seeded successfully!');
  console.log('\n📝 Test User Credentials:');
  console.log('  Teacher:  teacher@test.edu / Test123!');
  console.log('  Student1: student1@test.edu / Student123!');
  console.log('  Student2: student2@test.edu / Student123!');
  console.log('  Admin:    admin@test.edu / Admin123!');
}

main()
  .catch((e) => {
    console.error('Fatal error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });