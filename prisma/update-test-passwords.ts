import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Updating test account passwords...\n');

  const testPassword = await bcrypt.hash('test1234', 12);
  console.log('✓ Password hash generated\n');

  const testEmails = [
    'admin@test.1001stories.org',
    'teacher@test.1001stories.org',
    'writer@test.1001stories.org',
    'institution@test.1001stories.org',
    'learner@test.1001stories.org',
    'story-manager@test.1001stories.org',
    'book-manager@test.1001stories.org',
    'content-admin@test.1001stories.org',
  ];

  for (const email of testEmails) {
    try {
      await prisma.user.update({
        where: { email },
        data: { password: testPassword },
      });
      console.log(`✅ Updated password: ${email}`);
    } catch (error: any) {
      if (error.code === 'P2025') {
        console.log(`⚠️  Not found (will be created later): ${email}`);
      } else {
        console.error(`❌ Error updating ${email}:`, error.message);
      }
    }
  }

  console.log('\n🎉 Password update completed!');
  console.log('\n📋 Test Credentials:');
  console.log('   Email: [role]@test.1001stories.org');
  console.log('   Password: test1234\n');
}

main()
  .catch((e) => {
    console.error('❌ Update failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
