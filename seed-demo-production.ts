import { PrismaClient, UserRole, StorySubmissionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDemoContent() {
  try {
    console.log('🌱 Seeding demo content for production...');

    // Create demo author user
    const demoAuthor = await prisma.user.upsert({
      where: { email: 'demo.author@1001stories.org' },
      update: {},
      create: {
        email: 'demo.author@1001stories.org',
        name: 'Demo Author',
        role: UserRole.LEARNER,
      }
    });

    // Create demo stories
    const demoStories = [
      {
        id: 'demo-story-1',
        title: 'The Little Seed\'s Journey',
        content: 'Once upon a time, there was a little seed that dreamed of becoming a beautiful flower...',
        summary: 'A heartwarming story about growth, patience, and believing in yourself.',
        language: 'en',
        category: ['Children'],
        isPublished: true,
        authorId: demoAuthor.id,
        authorName: 'Demo Author',
        tags: ['nature', 'growth', 'children'],
        viewCount: 125,
        rating: 4.8,
      },
      {
        id: 'demo-story-2', 
        title: 'The Magic Paintbrush',
        content: 'In a small village lived an artist named Maya who discovered a paintbrush with magical powers...',
        summary: 'A story about creativity, responsibility, and using your talents to help others.',
        language: 'en',
        category: ['Adventure'],
        isPublished: true,
        authorId: demoAuthor.id,
        authorName: 'Demo Author',
        tags: ['magic', 'art', 'adventure'],
        viewCount: 89,
        rating: 4.6,
      },
      {
        id: 'demo-story-3',
        title: '별을 찾는 아이 (The Child Who Searched for Stars)',
        content: '작은 마을에 살던 민수는 매일 밤 하늘을 바라보며 별을 세곤 했습니다...',
        summary: '꿈과 희망에 대한 아름다운 한국 이야기',
        language: 'ko',
        category: ['Fantasy'],
        isPublished: true,
        authorId: demoAuthor.id,
        authorName: 'Demo Author',
        tags: ['dreams', 'stars', 'korean'],
        viewCount: 67,
        rating: 4.9,
      }
    ];

    for (const story of demoStories) {
      await prisma.story.upsert({
        where: { id: story.id },
        update: {},
        create: story
      });
    }

    // Create demo admin user if not exists
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@1001stories.org' },
      update: {},
      create: {
        email: 'admin@1001stories.org',
        name: 'Admin User',
        role: UserRole.ADMIN,
      }
    });

    // Create demo volunteer user
    const volunteerUser = await prisma.user.upsert({
      where: { email: 'volunteer@1001stories.org' },
      update: {},
      create: {
        email: 'volunteer@1001stories.org',
        name: 'Demo Volunteer',
        role: UserRole.VOLUNTEER,
      }
    });

    // Create demo donations
    const demodonation = await prisma.donation.create({
      data: {
        donorEmail: 'donor@example.com',
        donorName: 'Anonymous Donor',
        amount: 50.00,
        currency: 'USD',
        status: 'COMPLETED',
        message: 'Keep up the great work!',
        donorId: demoAuthor.id,
      }
    });

    // Create demo orders  
    const demoOrder = await prisma.order.create({
      data: {
        orderNumber: 'DEMO-ORDER-001',
        email: demoAuthor.email,
        userId: demoAuthor.id,
        subtotal: 25.00,
        tax: 2.50,
        total: 27.50,
        currency: 'USD',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        fulfillmentStatus: 'FULFILLED',
      }
    });

    console.log('✅ Demo content seeded successfully!');
    console.log(`📚 Created ${demoStories.length} demo stories`);
    console.log(`👥 Created demo users: Author, Admin, Volunteer`);
    console.log(`💰 Created demo donation: $50`);
    console.log(`🛍️ Created demo order: $27.50`);
    
  } catch (error) {
    console.error('❌ Error seeding demo content:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoContent();