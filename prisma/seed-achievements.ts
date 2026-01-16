import { PrismaClient, AchievementCategory } from '@prisma/client';

const prisma = new PrismaClient();

const achievements = [
  // Writing achievements
  {
    key: 'first_story',
    nameKey: 'profile.achievementDetails.firstStory.name',
    descKey: 'profile.achievementDetails.firstStory.desc',
    category: AchievementCategory.WRITING,
    criteria: { type: 'story_count', count: 1, status: 'SUBMITTED' },
    points: 10,
    sortOrder: 1
  },
  {
    key: 'ten_published',
    nameKey: 'profile.achievementDetails.tenPublished.name',
    descKey: 'profile.achievementDetails.tenPublished.desc',
    category: AchievementCategory.WRITING,
    criteria: { type: 'story_count', count: 10, status: 'PUBLISHED' },
    points: 100,
    sortOrder: 2
  },

  // Reading achievements
  {
    key: 'first_book',
    nameKey: 'First Steps',
    descKey: 'Complete your first book',
    category: AchievementCategory.READING,
    criteria: { type: 'first_book' },
    points: 10,
    sortOrder: 1
  },
  {
    key: 'bookworm_5',
    nameKey: 'Bookworm',
    descKey: 'Read 5 books',
    category: AchievementCategory.READING,
    criteria: { type: 'books_read', count: 5 },
    points: 25,
    sortOrder: 2
  },
  {
    key: 'avid_reader_10',
    nameKey: 'Avid Reader',
    descKey: 'Read 10 books',
    category: AchievementCategory.READING,
    criteria: { type: 'books_read', count: 10 },
    points: 50,
    sortOrder: 3
  },
  {
    key: 'bibliophile_25',
    nameKey: 'Bibliophile',
    descKey: 'Read 25 books',
    category: AchievementCategory.READING,
    criteria: { type: 'books_read', count: 25 },
    points: 100,
    sortOrder: 4
  },
  {
    key: 'master_reader_50',
    nameKey: 'Master Reader',
    descKey: 'Read 50 books',
    category: AchievementCategory.READING,
    criteria: { type: 'books_read', count: 50 },
    points: 200,
    sortOrder: 5
  },

  // Streak achievements
  {
    key: 'streak_3',
    nameKey: 'Getting Started',
    descKey: 'Maintain a 3-day reading streak',
    category: AchievementCategory.MILESTONE,
    criteria: { type: 'reading_streak', streakDays: 3 },
    points: 15,
    sortOrder: 1
  },
  {
    key: 'streak_7',
    nameKey: 'Week Warrior',
    descKey: 'Maintain a 7-day reading streak',
    category: AchievementCategory.MILESTONE,
    criteria: { type: 'reading_streak', streakDays: 7 },
    points: 30,
    sortOrder: 2
  },
  {
    key: 'streak_14',
    nameKey: 'Dedicated Reader',
    descKey: 'Maintain a 14-day reading streak',
    category: AchievementCategory.MILESTONE,
    criteria: { type: 'reading_streak', streakDays: 14 },
    points: 60,
    sortOrder: 3
  },
  {
    key: 'streak_30',
    nameKey: 'Reading Champion',
    descKey: 'Maintain a 30-day reading streak',
    category: AchievementCategory.MILESTONE,
    criteria: { type: 'reading_streak', streakDays: 30 },
    points: 150,
    sortOrder: 4
  },
  {
    key: 'streak_100',
    nameKey: 'Reading Legend',
    descKey: 'Maintain a 100-day reading streak',
    category: AchievementCategory.MILESTONE,
    criteria: { type: 'reading_streak', streakDays: 100 },
    points: 500,
    sortOrder: 5
  },

  // Vocabulary achievements
  {
    key: 'first_word',
    nameKey: 'Word Collector',
    descKey: 'Save your first vocabulary word',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'first_vocabulary' },
    points: 5,
    sortOrder: 1
  },
  {
    key: 'vocab_10',
    nameKey: 'Vocabulary Builder',
    descKey: 'Save 10 vocabulary words',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'vocabulary_count', count: 10 },
    points: 20,
    sortOrder: 2
  },
  {
    key: 'vocab_50',
    nameKey: 'Word Expert',
    descKey: 'Save 50 vocabulary words',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'vocabulary_count', count: 50 },
    points: 75,
    sortOrder: 3
  },
  {
    key: 'vocab_100',
    nameKey: 'Lexicon Master',
    descKey: 'Save 100 vocabulary words',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'vocabulary_count', count: 100 },
    points: 150,
    sortOrder: 4
  },
  {
    key: 'mastery_5',
    nameKey: 'Quick Learner',
    descKey: 'Master 5 vocabulary words',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'vocabulary_mastery', count: 5, masteryLevel: 4 },
    points: 30,
    sortOrder: 5
  },
  {
    key: 'mastery_25',
    nameKey: 'Word Wizard',
    descKey: 'Master 25 vocabulary words',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'vocabulary_mastery', count: 25, masteryLevel: 4 },
    points: 100,
    sortOrder: 6
  },

  // Quiz achievements
  {
    key: 'first_quiz',
    nameKey: 'Quiz Starter',
    descKey: 'Pass your first quiz',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'first_quiz' },
    points: 10,
    sortOrder: 7
  },
  {
    key: 'quiz_5',
    nameKey: 'Quiz Enthusiast',
    descKey: 'Pass 5 quizzes',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'quiz_passed', count: 5 },
    points: 40,
    sortOrder: 8
  },
  {
    key: 'quiz_10',
    nameKey: 'Quiz Master',
    descKey: 'Pass 10 quizzes',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'quiz_passed', count: 10 },
    points: 80,
    sortOrder: 9
  },
  {
    key: 'perfect_quiz',
    nameKey: 'Perfect Score',
    descKey: 'Get a perfect score on a quiz',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'quiz_perfect', count: 1 },
    points: 25,
    sortOrder: 10
  },
  {
    key: 'perfect_5',
    nameKey: 'Perfectionist',
    descKey: 'Get 5 perfect quiz scores',
    category: AchievementCategory.LEARNING,
    criteria: { type: 'quiz_perfect', count: 5 },
    points: 100,
    sortOrder: 11
  },

  // Community achievements
  {
    key: 'first_comment',
    nameKey: 'First Comment',
    descKey: 'Post your first comment',
    category: AchievementCategory.COMMUNITY,
    criteria: { type: 'comments_posted', count: 1 },
    points: 5,
    sortOrder: 1
  },

  // Teaching achievements
  {
    key: 'first_student',
    nameKey: 'First Student',
    descKey: 'Have your first student enroll in your class',
    category: AchievementCategory.TEACHING,
    criteria: { type: 'student_count', count: 1 },
    points: 15,
    sortOrder: 1
  },
  {
    key: 'ten_students',
    nameKey: 'Popular Teacher',
    descKey: 'Reach 10 students in your classes',
    category: AchievementCategory.TEACHING,
    criteria: { type: 'student_count', count: 10 },
    points: 50,
    sortOrder: 2
  },
  {
    key: 'assignment_master',
    nameKey: 'Assignment Master',
    descKey: 'Assign 20 books to students',
    category: AchievementCategory.TEACHING,
    criteria: { type: 'books_assigned', count: 20 },
    points: 40,
    sortOrder: 3
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
