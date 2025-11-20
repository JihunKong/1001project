import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('📚 Importing stories from JSON...\n');

  const jsonData = JSON.parse(
    fs.readFileSync('/tmp/stories_sample.json', 'utf-8')
  );

  console.log(`Found ${jsonData.length} stories in JSON file\n`);

  // Import first 3 TEXT stories for testing
  let imported = 0;
  for (const item of jsonData.slice(0, 3)) {
    try {
      const book = await prisma.book.create({
        data: {
          title: item.title,
          subtitle: `By ${item.writer}`,
          authorName: item.writer,
          authorAge: null,
          contentType: 'TEXT',
          content: item.story,
          summary: item.story.substring(0, 200) + '...',
          language: 'en',
          ageRange: item.difficulty_level === 'Elementary Level' ? '6-9' :
                    item.difficulty_level === 'Middle School Level' ? '10-13' : '14-17',
          category: item.educational_categories || ['FICTION'],
          tags: [item.country, item.difficulty_level],
          isPublished: true,
          coverImage: '/default-cover.jpg'
        }
      });

      console.log(`✅ Imported: ${book.title}`);
      imported++;
    } catch (error) {
      console.error(`❌ Failed to import: ${item.title}`);
      console.error(error);
    }
  }

  console.log(`\n✅ Successfully imported ${imported} stories`);

  // Create LEARNER user
  console.log('\n👤 Creating test LEARNER account...');

  const user = await prisma.user.upsert({
    where: { email: 'learner@test.com' },
    update: {},
    create: {
      email: 'learner@test.com',
      name: 'Test Learner',
      role: 'LEARNER',
      emailVerified: new Date(),
    }
  });

  console.log(`✅ Test learner created: ${user.email}`);
  console.log('\n📋 Login credentials:');
  console.log('   Email: learner@test.com');
  console.log('   (Use magic link authentication)');
  console.log('\n🌐 Local URL: http://localhost:8001/login');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
