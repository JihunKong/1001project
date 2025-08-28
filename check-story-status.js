// Quick script to check story status in production
// Run this via: node check-story-status.js

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '1001stories.seedsofempowerment.org',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Story-Status-Checker'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function checkLibraryBooks() {
  console.log('\n🔍 Checking Library Books Status...\n');
  
  try {
    // Check public library API
    const response = await makeRequest('/api/library/books?limit=100');
    
    if (response.books) {
      console.log(`📚 Total Books in Library: ${response.pagination.totalCount}`);
      console.log(`📄 Books on Current Page: ${response.books.length}`);
      console.log(`📊 Pagination: Page ${response.pagination.currentPage} of ${response.pagination.totalPages}`);
      
      console.log('\n📋 Book Details:');
      response.books.forEach((book, index) => {
        console.log(`${index + 1}. "${book.title}" by ${book.author.name}`);
        console.log(`   - Language: ${book.language}`);
        console.log(`   - Premium: ${book.isPremium ? 'Yes' : 'No'}`);
        console.log(`   - Published: ${book.publishedDate ? new Date(book.publishedDate).toLocaleDateString() : 'No date'}`);
        console.log(`   - PDF Available: ${book.fullPdf ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      // Group by language
      const byLanguage = response.books.reduce((acc, book) => {
        acc[book.language] = (acc[book.language] || 0) + 1;
        return acc;
      }, {});
      
      console.log('🌍 Books by Language:');
      Object.entries(byLanguage).forEach(([lang, count]) => {
        console.log(`   ${lang}: ${count} books`);
      });
      
      // Count premium vs free
      const premiumCount = response.books.filter(book => book.isPremium).length;
      const freeCount = response.books.filter(book => !book.isPremium).length;
      
      console.log('\n💰 Content Distribution:');
      console.log(`   Free: ${freeCount} books`);
      console.log(`   Premium: ${premiumCount} books`);
      
    } else {
      console.log('❌ No books data received');
      console.log('Response:', response);
    }
    
  } catch (error) {
    console.error('❌ Error checking library books:', error.message);
  }
}

async function checkAdminBooks() {
  console.log('\n🔧 Note: Admin API requires authentication');
  console.log('To check admin books, you need to:');
  console.log('1. Access https://1001stories.seedsofempowerment.org/admin/stories');
  console.log('2. Check the admin interface for unpublished stories');
  console.log('3. Look for stories with isPublished=false or missing PDF files');
}

async function main() {
  console.log('🏗️  1001 Stories - Library Status Checker');
  console.log('=========================================');
  
  await checkLibraryBooks();
  await checkAdminBooks();
  
  console.log('\n✅ Status check complete!');
  console.log('\nIf you expected 33 books but see fewer, check:');
  console.log('• Stories with isPublished=false in admin');
  console.log('• Stories missing fullPdf files');
  console.log('• Stories in DRAFT or REJECTED status');
  
  rl.close();
}

main().catch(console.error);