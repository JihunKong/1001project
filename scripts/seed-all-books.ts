import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding all books from existing folders...');

  // All book folders that have main.pdf
  const allBooks = [
    { id: 'a-gril-come-to-stanford', title: 'A Girl Come to Stanford', language: 'English' },
    { id: 'angel-prayer', title: 'Angel Prayer', language: 'English' },
    { id: 'appreciation', title: 'Appreciation', language: 'English' },
    { id: 'check-point-eng', title: 'Check Point', language: 'English' },
    { id: 'fatuma', title: 'Fatuma', language: 'English' },
    { id: 'girl-with-a-hope-eng', title: 'Girl with a Hope', language: 'English' },
    { id: 'greedy-fisherman', title: 'The Greedy Fisherman', language: 'English' },
    { id: 'kakama-01', title: 'Kakama Part 1', language: 'English' },
    { id: 'kakama-02', title: 'Kakama Part 2', language: 'English' },
    { id: 'martha-01', title: 'Martha Part 1', language: 'English' },
    { id: 'mirror', title: 'Mirror', language: 'English' },
    { id: 'my-life-eng', title: 'My Life', language: 'English' },
    { id: 'my-life-p-urh-pecha', title: 'My Life (P\'urhépecha)', language: 'P\'urhépecha' },
    { id: 'my-life-span', title: 'Mi Vida', language: 'Spanish' },
    { id: 'neema-01', title: 'Neema Part 1', language: 'English' },
    { id: 'neema-02', title: 'Neema Part 2', language: 'English' },
    { id: 'neema-03', title: 'Neema Part 3', language: 'English' },
    { id: 'never-give-up', title: 'Never Give Up', language: 'English' },
    { id: 'second-chance', title: 'Second Chance', language: 'English' },
    { id: 'street-boy-part-01-span', title: 'Niño de la Calle Parte 1', language: 'Spanish' },
    { id: 'street-boy-part-01-eng', title: 'Street Boy Part 1', language: 'English' },
    { id: 'street-boy-part-02-span', title: 'Niño de la Calle Parte 2', language: 'Spanish' },
    { id: 'street-boy-part-02-eng', title: 'Street Boy Part 2', language: 'English' },
    { id: 'test4', title: 'Test Story 4', language: 'English' },
    { id: 'the-eyes-of-the-sun', title: 'The Eyes of the Sun', language: 'English' },
    { id: 'the-indian-boy-s', title: 'The Indian Boy', language: 'English' },
    { id: 'the-indian-girl-helping-father', title: 'The Indian Girl Helping Father', language: 'English' },
    { id: 'the-story-of-a-thief-eng', title: 'The Story of a Thief', language: 'English' },
    { id: 'the-three-boys-eng', title: 'The Three Boys', language: 'English' },
    { id: 'the-three-boys-span', title: 'Los Tres Niños', language: 'Spanish' },
    { id: 'who-is-real', title: 'Who Is Real', language: 'English' }
  ];

  // Add common fields to all books
  const booksWithFullData = allBooks.map((book, index) => ({
    ...book,
    authorName: book.language === 'Spanish' ? 'Autor Joven' : 
                book.language === 'P\'urhépecha' ? 'Joven Autor' : 'Young Author',
    category: determineCategory(book.title),
    tags: determineTags(book.title, book.language),
    summary: generateSummary(book.title),
    viewCount: Math.floor(Math.random() * 100),
    featured: index < 5, // Feature first 5 books
    isPublished: true, // Mark all books as published
    isPremium: false, // All books are free
    pdfKey: `/api/pdf/books/${book.id}/main.pdf`,
    pdfFrontCover: `/api/pdf/books/${book.id}/front.pdf`,
    pdfBackCover: `/api/pdf/books/${book.id}/back.pdf`
  }));

  // Clear existing books
  await prisma.book.deleteMany({});
  console.log('Cleared existing books');

  // Insert all books
  for (const book of booksWithFullData) {
    await prisma.book.create({
      data: book
    });
    console.log(`Created book: ${book.title}`);
  }

  console.log(`\nSeeded ${booksWithFullData.length} books successfully!`);
}

function determineCategory(title: string): string[] {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('part') || titleLower.includes('parte')) {
    return ['Series', 'Adventure'];
  }
  if (titleLower.includes('indian') || titleLower.includes('girl') || titleLower.includes('boy')) {
    return ['Youth', 'Life Stories'];
  }
  if (titleLower.includes('thief') || titleLower.includes('fisherman')) {
    return ['Fable', 'Moral Story'];
  }
  if (titleLower.includes('life') || titleLower.includes('vida')) {
    return ['Biography', 'Personal Story'];
  }
  if (titleLower.includes('prayer') || titleLower.includes('hope')) {
    return ['Spiritual', 'Inspirational'];
  }
  
  return ['Fiction', 'General'];
}

function determineTags(title: string, language: string): string[] {
  const tags = [language.toLowerCase()];
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('part') || titleLower.includes('parte')) {
    tags.push('series', 'adventure');
  }
  if (titleLower.includes('girl') || titleLower.includes('niña')) {
    tags.push('female-protagonist', 'youth');
  }
  if (titleLower.includes('boy') || titleLower.includes('niño')) {
    tags.push('male-protagonist', 'youth');
  }
  if (titleLower.includes('street') || titleLower.includes('calle')) {
    tags.push('urban', 'survival');
  }
  if (titleLower.includes('indian')) {
    tags.push('cultural', 'indigenous');
  }
  if (titleLower.includes('hope') || titleLower.includes('never give up')) {
    tags.push('inspirational', 'motivational');
  }
  
  tags.push('children', 'education');
  
  return tags;
}

function generateSummary(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('neema')) {
    return 'Follow Neema on an exciting journey of discovery and friendship.';
  }
  if (titleLower.includes('kakama')) {
    return 'The adventures of Kakama, a brave young hero.';
  }
  if (titleLower.includes('martha')) {
    return 'Martha\'s story of courage and determination.';
  }
  if (titleLower.includes('street boy') || titleLower.includes('niño de la calle')) {
    return 'A compelling story about survival and hope on the streets.';
  }
  if (titleLower.includes('indian')) {
    return 'A cultural story celebrating indigenous heritage and family values.';
  }
  if (titleLower.includes('my life') || titleLower.includes('mi vida')) {
    return 'A personal journey of growth, challenges, and triumph.';
  }
  if (titleLower.includes('fisherman')) {
    return 'A timeless tale about greed and its consequences.';
  }
  if (titleLower.includes('thief')) {
    return 'A story of redemption and the power of second chances.';
  }
  if (titleLower.includes('three boys') || titleLower.includes('tres niños')) {
    return 'Three friends embark on an unforgettable adventure together.';
  }
  if (titleLower.includes('stanford')) {
    return 'An inspiring story about education and achieving dreams.';
  }
  if (titleLower.includes('angel')) {
    return 'A spiritual journey of faith and divine intervention.';
  }
  if (titleLower.includes('hope')) {
    return 'A story of perseverance and maintaining hope against all odds.';
  }
  
  return 'An engaging story from young authors in underserved communities.';
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });