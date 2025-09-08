import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: 'teacher@test.edu',
    password: 'Test123!',
    name: 'Test Teacher',
    role: UserRole.TEACHER
  },
  {
    email: 'student1@test.edu',
    password: 'Student123!',
    name: 'Test Student 1',
    role: UserRole.LEARNER
  },
  {
    email: 'student2@test.edu',
    password: 'Student123!',
    name: 'Test Student 2',
    role: UserRole.LEARNER
  }
];

async function createTestUsers() {
  console.log('🎓 Creating test users for English Education...');
  
  for (const userData of TEST_USERS) {
    try {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existing) {
        console.log(`✓ User already exists: ${userData.email}`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          password: hashedPassword,
          emailVerified: new Date()
        }
      });
      
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error);
    }
  }
  
  console.log('\n📋 Test Accounts:');
  console.log('  Teacher: teacher@test.edu / Test123!');
  console.log('  Student 1: student1@test.edu / Student123!');
  console.log('  Student 2: student2@test.edu / Student123!');
}

createTestUsers()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });