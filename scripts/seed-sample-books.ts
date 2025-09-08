import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSampleBooks() {
  console.log('📚 Seeding sample books...');

  const sampleBooks = [
    {
      id: 'book-1',
      title: 'The Adventures of Little Bear',
      subtitle: 'A Journey Through the Forest',
      summary: 'Follow Little Bear as he explores the magical forest and makes new friends along the way.',
      authorName: 'Emily Chen',
      authorAge: 12,
      authorLocation: 'California, USA',
      language: 'en',
      ageRange: '5-8',
      readingLevel: 'Beginner',
      category: ['Adventure', 'Animals'],
      genres: ['Fiction', 'Children'],
      subjects: ['Friendship', 'Nature', 'Courage'],
      tags: ['bear', 'forest', 'adventure', 'friendship'],
      coverImage: '/books/sample-covers/little-bear.jpg',
      pageCount: 32,
      previewPages: 10,
      isPremium: false,
      price: 0,
      currency: 'USD',
      featured: true,
      viewCount: 150,
      downloadCount: 45,
      rating: 4.5,
      isPublished: true
    },
    {
      id: 'book-2',
      title: 'The Rainbow Fish',
      subtitle: 'Sharing Makes Friends',
      summary: 'A beautiful fish learns the importance of sharing and kindness in this heartwarming tale.',
      authorName: 'Marcus Johnson',
      authorAge: 14,
      authorLocation: 'New York, USA',
      language: 'en',
      ageRange: '4-7',
      readingLevel: 'Beginner',
      category: ['Life Lessons', 'Animals'],
      genres: ['Fiction', 'Children'],
      subjects: ['Sharing', 'Friendship', 'Kindness'],
      tags: ['fish', 'ocean', 'sharing', 'colors'],
      coverImage: '/books/sample-covers/rainbow-fish.jpg',
      pageCount: 28,
      previewPages: 8,
      isPremium: false,
      price: 0,
      currency: 'USD',
      featured: true,
      viewCount: 230,
      downloadCount: 78,
      rating: 4.8,
      isPublished: true
    },
    {
      id: 'book-3',
      title: 'Space Explorer Max',
      subtitle: 'Journey to the Stars',
      summary: 'Join Max on an exciting journey through space as he visits different planets and meets alien friends.',
      authorName: 'Sophie Williams',
      authorAge: 13,
      authorLocation: 'London, UK',
      language: 'en',
      ageRange: '7-10',
      readingLevel: 'Intermediate',
      category: ['Science Fiction', 'Adventure'],
      genres: ['Fiction', 'Children'],
      subjects: ['Space', 'Exploration', 'Science'],
      tags: ['space', 'planets', 'astronaut', 'adventure'],
      coverImage: '/books/sample-covers/space-explorer.jpg',
      pageCount: 48,
      previewPages: 12,
      isPremium: true,
      price: 4.99,
      currency: 'USD',
      featured: false,
      viewCount: 189,
      downloadCount: 52,
      rating: 4.6,
      isPublished: true
    },
    {
      id: 'book-4',
      title: 'The Magic Garden',
      subtitle: 'Where Dreams Grow',
      summary: 'Discover a secret garden where magical plants grant wishes and dreams come true.',
      authorName: 'Lily Park',
      authorAge: 11,
      authorLocation: 'Seoul, South Korea',
      language: 'en',
      ageRange: '6-9',
      readingLevel: 'Beginner',
      category: ['Fantasy', 'Nature'],
      genres: ['Fiction', 'Children'],
      subjects: ['Magic', 'Gardens', 'Dreams'],
      tags: ['magic', 'garden', 'flowers', 'wishes'],
      coverImage: '/books/sample-covers/magic-garden.jpg',
      pageCount: 36,
      previewPages: 10,
      isPremium: false,
      price: 0,
      currency: 'USD',
      featured: false,
      viewCount: 167,
      downloadCount: 41,
      rating: 4.7,
      isPublished: true
    },
    {
      id: 'book-5',
      title: 'The Brave Little Robot',
      subtitle: 'A Tale of Courage',
      summary: 'A small robot proves that size doesn\'t matter when it comes to being brave and helping others.',
      authorName: 'Alex Rivera',
      authorAge: 15,
      authorLocation: 'Mexico City, Mexico',
      language: 'en',
      ageRange: '8-12',
      readingLevel: 'Intermediate',
      category: ['Science Fiction', 'Adventure'],
      genres: ['Fiction', 'Children'],
      subjects: ['Robots', 'Technology', 'Courage'],
      tags: ['robot', 'technology', 'brave', 'future'],
      coverImage: '/books/sample-covers/brave-robot.jpg',
      pageCount: 52,
      previewPages: 15,
      isPremium: true,
      price: 5.99,
      currency: 'USD',
      featured: true,
      viewCount: 245,
      downloadCount: 89,
      rating: 4.9,
      isPublished: true
    },
    {
      id: 'book-6',
      title: 'The Singing Bird',
      subtitle: 'Music of the Forest',
      summary: 'A bird with a beautiful voice learns to share its gift with the world.',
      authorName: 'Maya Patel',
      authorAge: 10,
      authorLocation: 'Mumbai, India',
      language: 'en',
      ageRange: '5-8',
      readingLevel: 'Beginner',
      category: ['Music', 'Animals'],
      genres: ['Fiction', 'Children'],
      subjects: ['Music', 'Birds', 'Talent'],
      tags: ['bird', 'music', 'singing', 'forest'],
      coverImage: '/books/sample-covers/singing-bird.jpg',
      pageCount: 30,
      previewPages: 8,
      isPremium: false,
      price: 0,
      currency: 'USD',
      featured: false,
      viewCount: 134,
      downloadCount: 28,
      rating: 4.4,
      isPublished: true
    }
  ];

  // Delete existing books first
  await prisma.book.deleteMany();
  console.log('🗑️  Cleared existing books');

  // Insert sample books
  for (const book of sampleBooks) {
    await prisma.book.create({ data: book });
    console.log(`✅ Created book: ${book.title}`);
  }

  console.log(`\n📚 Successfully seeded ${sampleBooks.length} books!`);
}

seedSampleBooks()
  .catch((error) => {
    console.error('Error seeding books:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });