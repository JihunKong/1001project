import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.book.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating users...');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@1001stories.org',
      name: 'Admin User',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  // Create admin profile
  await prisma.profile.create({
    data: {
      userId: admin.id,
      firstName: 'Admin',
      lastName: 'User',
      language: 'en',
      timezone: 'UTC',
    },
  });

  // Create teacher user
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@1001stories.org',
      name: 'Teacher User',
      role: UserRole.TEACHER,
      emailVerified: new Date(),
    },
  });

  await prisma.profile.create({
    data: {
      userId: teacher.id,
      firstName: 'Teacher',
      lastName: 'User',
      language: 'en',
      timezone: 'UTC',
    },
  });

  // Create learner user
  const learner = await prisma.user.create({
    data: {
      email: 'learner@1001stories.org',
      name: 'Learner User',
      role: UserRole.LEARNER,
      emailVerified: new Date(),
    },
  });

  await prisma.profile.create({
    data: {
      userId: learner.id,
      firstName: 'Learner',
      lastName: 'User',
      language: 'en',
      timezone: 'UTC',
    },
  });

  // Create volunteer user
  const volunteer = await prisma.user.create({
    data: {
      email: 'volunteer@1001stories.org',
      name: 'Volunteer User',
      role: UserRole.WRITER,
      emailVerified: new Date(),
    },
  });

  await prisma.profile.create({
    data: {
      userId: volunteer.id,
      firstName: 'Volunteer',
      lastName: 'User',
      language: 'en',
      timezone: 'UTC',
    },
  });

  // Create volunteer profile
  await prisma.volunteerProfile.create({
    data: {
      userId: volunteer.id,
      verificationStatus: 'VERIFIED',
      languageLevels: {},
      availableSlots: {},
    },
  });

  console.log('📚 Creating sample books...');

  // Create sample books
  const book1 = await prisma.book.create({
    data: {
      title: 'The Magic Garden',
      authorName: 'Volunteer Writer',
      authorId: volunteer.id,
      content: 'Once upon a time, in a magical garden far away, there lived a little girl named Lucy who discovered that flowers could talk...',
      summary: 'A beautiful story about a magical garden where flowers come to life.',
      language: 'en',
      ageRange: '5-8',
      category: ['fairy-tale', 'nature'],
      genres: ['fantasy', 'children'],
      tags: ['magic', 'friendship', 'nature'],
      isPublished: true,
      publishedAt: new Date(),
      isPremium: false,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      title: 'The Brave Little Mouse',
      authorName: 'Teacher Writer',
      authorId: teacher.id,
      content: 'In a small village lived a tiny mouse named Pip who was afraid of everything until one day...',
      summary: 'A story about courage and overcoming fears.',
      language: 'en',
      ageRange: '6-10',
      category: ['adventure', 'moral'],
      genres: ['adventure', 'children'],
      tags: ['courage', 'friendship', 'animals'],
      isPublished: true,
      publishedAt: new Date(),
      isPremium: true,
      price: 2.99,
    },
  });

  console.log('🔐 Creating subscriptions...');

  // Create subscriptions
  await prisma.subscription.create({
    data: {
      userId: admin.id,
      plan: 'PREMIUM',
      status: 'ACTIVE',
      canAccessPremium: true,
      canDownloadPDF: true,
      canCreateClasses: true,
      unlimitedReading: true,
      maxStudents: 1000,
      maxDownloads: 1000,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: teacher.id,
      plan: 'BASIC',
      status: 'ACTIVE',
      canAccessPremium: true,
      canDownloadPDF: true,
      canCreateClasses: true,
      unlimitedReading: true,
      maxStudents: 50,
      maxDownloads: 100,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: learner.id,
      plan: 'FREE',
      status: 'ACTIVE',
      canAccessPremium: false,
      canDownloadPDF: false,
      canCreateClasses: false,
      unlimitedReading: false,
      maxStudents: 0,
      maxDownloads: 3,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: volunteer.id,
      plan: 'FREE',
      status: 'ACTIVE',
      canAccessPremium: false,
      canDownloadPDF: false,
      canCreateClasses: false,
      unlimitedReading: false,
      maxStudents: 0,
      maxDownloads: 3,
    },
  });

  console.log('👥 Creating publishing workflow roles...');

  // Create Story Manager user
  const storyManager = await prisma.user.create({
    data: {
      email: 'story-manager@1001stories.org',
      name: 'Story Manager',
      role: UserRole.STORY_MANAGER,
      emailVerified: new Date(),
    },
  });

  await prisma.profile.create({
    data: {
      userId: storyManager.id,
      firstName: 'Story',
      lastName: 'Manager',
      language: 'en',
      timezone: 'UTC',
    },
  });

  await prisma.subscription.create({
    data: {
      userId: storyManager.id,
      plan: 'PREMIUM',
      status: 'ACTIVE',
      canAccessPremium: true,
      canDownloadPDF: true,
      canCreateClasses: false,
      unlimitedReading: true,
      maxStudents: 0,
      maxDownloads: 500,
    },
  });

  // Create Book Manager user
  const bookManager = await prisma.user.create({
    data: {
      email: 'book-manager@1001stories.org',
      name: 'Book Manager',
      role: UserRole.BOOK_MANAGER,
      emailVerified: new Date(),
    },
  });

  await prisma.profile.create({
    data: {
      userId: bookManager.id,
      firstName: 'Book',
      lastName: 'Manager',
      language: 'en',
      timezone: 'UTC',
    },
  });

  await prisma.subscription.create({
    data: {
      userId: bookManager.id,
      plan: 'PREMIUM',
      status: 'ACTIVE',
      canAccessPremium: true,
      canDownloadPDF: true,
      canCreateClasses: false,
      unlimitedReading: true,
      maxStudents: 0,
      maxDownloads: 500,
    },
  });

  // Create Content Admin user
  const contentAdmin = await prisma.user.create({
    data: {
      email: 'content-admin@1001stories.org',
      name: 'Content Admin',
      role: UserRole.CONTENT_ADMIN,
      emailVerified: new Date(),
    },
  });

  await prisma.profile.create({
    data: {
      userId: contentAdmin.id,
      firstName: 'Content',
      lastName: 'Admin',
      language: 'en',
      timezone: 'UTC',
    },
  });

  await prisma.subscription.create({
    data: {
      userId: contentAdmin.id,
      plan: 'PREMIUM',
      status: 'ACTIVE',
      canAccessPremium: true,
      canDownloadPDF: true,
      canCreateClasses: false,
      unlimitedReading: true,
      maxStudents: 0,
      maxDownloads: 1000,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📧 Admin: admin@1001stories.org`);
  console.log(`📧 Teacher: teacher@1001stories.org`);
  console.log(`📧 Learner: learner@1001stories.org`);
  console.log(`📧 Volunteer: volunteer@1001stories.org`);
  console.log(`📧 Story Manager: story-manager@1001stories.org`);
  console.log(`📧 Book Manager: book-manager@1001stories.org`);
  console.log(`📧 Content Admin: content-admin@1001stories.org`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });