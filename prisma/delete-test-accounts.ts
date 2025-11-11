import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Starting test accounts cleanup...\n');

  const testEmails = [
    'learner@test.1001stories.org',
    'teacher@test.1001stories.org',
    'writer@test.1001stories.org',
    'story-manager@test.1001stories.org',
    'book-manager@test.1001stories.org',
    'content-admin@test.1001stories.org',
  ];

  console.log(`Deleting ${testEmails.length} test accounts...\n`);

  for (const email of testEmails) {
    try {
      const deleted = await prisma.user.delete({
        where: { email },
      });
      console.log(`✅ Deleted: ${email}`);
    } catch (error: any) {
      if (error.code === 'P2025') {
        console.log(`⚠️  Not found: ${email}`);
      } else {
        console.error(`❌ Error deleting ${email}:`, error.message);
      }
    }
  }

  console.log('\n🎉 Test accounts cleanup completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
