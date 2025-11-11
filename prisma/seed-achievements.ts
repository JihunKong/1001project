import { PrismaClient, AchievementCategory } from '@prisma/client';

const prisma = new PrismaClient();

const achievements = [
  {
    key: 'first_story',
    nameKey: 'profile.achievementDetails.firstStory.name',
    descKey: 'profile.achievementDetails.firstStory.desc',
    category: AchievementCategory.WRITING,
    criteria: {
      type: 'story_count',
      count: 1,
      status: 'SUBMITTED'
    },
    points: 10,
    sortOrder: 1
  },
  {
    key: 'ten_published',
    nameKey: 'profile.achievementDetails.tenPublished.name',
    descKey: 'profile.achievementDetails.tenPublished.desc',
    category: AchievementCategory.WRITING,
    criteria: {
      type: 'story_count',
      count: 10,
      status: 'PUBLISHED'
    },
    points: 100,
    sortOrder: 2
  },
  {
    key: 'first_book_read',
    nameKey: 'profile.achievementDetails.firstBookRead.name',
    descKey: 'profile.achievementDetails.firstBookRead.desc',
    category: AchievementCategory.READING,
    criteria: {
      type: 'books_read',
      count: 1
    },
    points: 10,
    sortOrder: 3
  },
  {
    key: 'ten_books_read',
    nameKey: 'profile.achievementDetails.tenBooksRead.name',
    descKey: 'profile.achievementDetails.tenBooksRead.desc',
    category: AchievementCategory.READING,
    criteria: {
      type: 'books_read',
      count: 10
    },
    points: 50,
    sortOrder: 4
  },
  {
    key: 'first_comment',
    nameKey: 'profile.achievementDetails.firstComment.name',
    descKey: 'profile.achievementDetails.firstComment.desc',
    category: AchievementCategory.COMMUNITY,
    criteria: {
      type: 'comments_posted',
      count: 1
    },
    points: 5,
    sortOrder: 5
  },
  {
    key: 'hundred_words',
    nameKey: 'profile.achievementDetails.hundredWords.name',
    descKey: 'profile.achievementDetails.hundredWords.desc',
    category: AchievementCategory.MILESTONE,
    criteria: {
      type: 'word_count',
      count: 100
    },
    points: 20,
    sortOrder: 6
  },
  {
    key: 'first_student',
    nameKey: 'First Student',
    descKey: 'Have your first student enroll in your class',
    category: AchievementCategory.TEACHING,
    criteria: {
      type: 'student_count',
      count: 1
    },
    points: 15,
    sortOrder: 7
  },
  {
    key: 'ten_students',
    nameKey: 'Popular Teacher',
    descKey: 'Reach 10 students in your classes',
    category: AchievementCategory.TEACHING,
    criteria: {
      type: 'student_count',
      count: 10
    },
    points: 50,
    sortOrder: 8
  },
  {
    key: 'assignment_master',
    nameKey: 'Assignment Master',
    descKey: 'Assign 20 books to students',
    category: AchievementCategory.TEACHING,
    criteria: {
      type: 'books_assigned',
      count: 20
    },
    points: 40,
    sortOrder: 9
  },
  {
    key: 'reading_streak_7',
    nameKey: '7-Day Reading Streak',
    descKey: 'Read for 7 consecutive days',
    category: AchievementCategory.LEARNING,
    criteria: {
      type: 'reading_streak',
      days: 7
    },
    points: 30,
    sortOrder: 10
  }
];

async function main() {
  console.log('🎯 Seeding achievements...');

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement
    });
    console.log(`  ✅ ${achievement.key}`);
  }

  console.log('🎉 Achievement seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding achievements:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
