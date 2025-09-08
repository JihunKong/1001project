import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding real books from existing folders...');

  // Real book folders that exist in public/books/
  const realBooks = [
    {
      id: 'neema-01',
      title: 'Neema Part 1',
      authorName: 'Young Author',
      language: 'English',
      category: ['Adventure', 'Fiction'],
      tags: ['children', 'adventure', 'friendship'],
      summary: 'The first part of Neema\'s adventure story.',
      viewCount: 0,
      featured: true,
      pdfKey: '/api/pdf/books/neema-01/main.pdf'
    },
    {
      id: 'neema-02', 
      title: 'Neema Part 2',
      authorName: 'Young Author',
      language: 'English',
      category: ['Adventure', 'Fiction'],
      tags: ['children', 'adventure', 'friendship'],
      summary: 'The continuing adventures of Neema.',
      viewCount: 0,
      featured: false,
      pdfKey: '/api/pdf/books/neema-02/main.pdf'
    },
    {
      id: 'neema-03',
      title: 'Neema Part 3',
      authorName: 'Young Author', 
      language: 'English',
      category: ['Adventure', 'Fiction'],
      tags: ['children', 'adventure', 'friendship'],
      summary: 'The conclusion of Neema\'s journey.',
      viewCount: 0,
      featured: false,
      pdfKey: '/api/pdf/books/neema-03/main.pdf'
    },
    {
      id: 'angel-prayer',
      title: 'Angel Prayer',
      authorName: 'Student Writer',
      language: 'English',
      category: ['Spiritual', 'Fiction'],
      tags: ['angels', 'prayer', 'hope'],
      summary: 'A touching story about faith and hope.',
      viewCount: 0,
      featured: true,
      pdfKey: '/api/pdf/books/angel-prayer/main.pdf'
    },
    {
      id: 'second-chance',
      title: 'Second Chance',
      authorName: 'Youth Author',
      language: 'English',
      category: ['Drama', 'Life Lessons'],
      tags: ['redemption', 'second chances', 'growth'],
      summary: 'A story about redemption and new beginnings.',
      viewCount: 0,
      featured: false,
      pdfKey: '/api/pdf/books/second-chance/main.pdf'
    },
    {
      id: 'greedy-fisherman',
      title: 'The Greedy Fisherman',
      authorName: 'Community Writer',
      language: 'English',
      category: ['Fable', 'Moral Story'],
      tags: ['greed', 'lessons', 'fisherman'],
      summary: 'A cautionary tale about greed and its consequences.',
      viewCount: 0,
      featured: false,
      pdfKey: '/api/pdf/books/greedy-fisherman/main.pdf'
    }
  ];

  // Clear existing books
  await prisma.book.deleteMany({});
  console.log('Cleared existing books');

  // Insert real books
  for (const book of realBooks) {
    await prisma.book.create({
      data: book
    });
    console.log(`Created book: ${book.title}`);
  }

  console.log(`Seeded ${realBooks.length} real books successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });