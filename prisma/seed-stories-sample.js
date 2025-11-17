const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting sample stories import...');

  const jsonPath = __dirname + '/stories_sample.json';
  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  const stories = JSON.parse(jsonData);

  console.log(`📚 Found ${stories.length} stories to import`);

  let successCount = 0;
  let errorCount = 0;

  for (const story of stories) {
    try {
      const readingTime = Math.ceil(story.word_count / 200);

      let readingLevel = 'BEGINNER';
      if (story.difficulty_level.includes('Middle School')) {
        readingLevel = 'INTERMEDIATE';
      } else if (story.difficulty_level.includes('High School')) {
        readingLevel = 'ADVANCED';
      }

      let ageRange = '5-8';
      if (story.difficulty_level.includes('Middle School')) {
        ageRange = '9-12';
      } else if (story.difficulty_level.includes('High School')) {
        ageRange = '13-18';
      }

      const book = await prisma.book.create({
        data: {
          title: story.title,
          authorName: story.written_by || story.writer,
          illustratorName: story.illustrated_by,
          editorName: story.edited_by,
          country: story.country,
          content: story.story,
          summary: story.preface || `A story from ${story.country} about ${story.title}`,
          contentType: 'TEXT',
          language: 'en',
          readingLevel,
          readingTime,
          ageRange,
          educationalCategories: story.educational_categories,
          category: story.educational_categories,
          difficultyScore: story.difficulty_score,
          vocabularyDistribution: story.vocabulary_distribution,
          isPublished: true,
          visibility: 'PUBLIC',
          featured: false,
          viewCount: 0,
          likeCount: 0,
          downloadCount: 0,
        },
      });

      console.log(`✅ Imported: "${book.title}" from ${story.country}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error importing "${story.title}":`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📚 Total: ${stories.length}`);
}

main()
  .catch((e) => {
    console.error('Fatal error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
