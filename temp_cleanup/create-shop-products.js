const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🛍️ Creating shop products for uploaded books...');
  
  // Books with uploaded PDFs
  const booksWithPDFs = [
    'angel-prayer', 'appreciation', 'fatuma', 'greedy-fisherman', 'martha-01',
    'neema-01', 'neema-02', 'neema-03', 'never-give-up', 'second-chance',
    'test4', 'who-is-real'
  ];
  
  // Get these specific books from the database
  const books = await prisma.story.findMany({
    where: {
      id: { in: booksWithPDFs },
      fullPdf: { not: null }
    },
    select: {
      id: true,
      title: true,
      summary: true,
      authorName: true,
      authorAge: true,
      authorLocation: true,
      isPremium: true,
      category: true,
      tags: true,
      coverImage: true
    }
  });
  
  console.log(`Found ${books.length} books with PDFs in database`);
  console.log('Book IDs:', books.map(b => b.id));
  
  // Delete existing shop products first
  await prisma.shopProduct.deleteMany({
    where: { type: 'DIGITAL_BOOK' }
  });
  
  // Create shop products
  let created = 0;
  for (let index = 0; index < books.length; index++) {
    const book = books[index];
    try {
      await prisma.shopProduct.create({
        data: {
          sku: `BOOK-${String(index + 1).padStart(3, '0')}`,
          type: 'DIGITAL_BOOK',
          title: book.title,
          description: book.summary || book.title,
          shortDescription: `Digital version of "${book.title}" by ${book.authorName}`,
          price: book.isPremium ? 4.99 : 2.99,
          compareAtPrice: book.isPremium ? 7.99 : 4.99,
          currency: 'USD',
          // bookId: book.id, // Temporarily remove to test
          downloadLimit: 5,
          accessDuration: book.isPremium ? null : 365,
          category: book.category || ['Stories'],
          tags: book.tags || [],
          featured: !book.isPremium,
          thumbnailUrl: book.coverImage,
          images: [book.coverImage || '/images/placeholder-book.jpg'],
          creatorName: book.authorName,
          creatorAge: book.authorAge,
          creatorLocation: book.authorLocation,
          impactMetric: "Children reached",
          impactValue: book.isPremium ? "15+" : "8+",
          status: 'ACTIVE',
        }
      });
      created++;
      console.log(`✅ Created shop product for: ${book.title} (${book.id})`);
    } catch (error) {
      console.error(`❌ Failed to create shop product for ${book.id}:`, error.message);
    }
  }
  
  console.log(`🎉 Successfully created ${created} shop products`);
}

main()
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });