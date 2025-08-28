/**
 * PUBLICATION VERIFICATION SCRIPT
 * 
 * This script verifies the results of bulk story publication and
 * provides comprehensive reporting on library completeness.
 * 
 * Run with: node verify-publication-results.js
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// Production API endpoint for verification
const PRODUCTION_API = '1001stories.seedsofempowerment.org';

async function checkLocalDatabase() {
  console.log('🔍 CHECKING LOCAL DATABASE');
  console.log('==========================');
  
  try {
    const total = await prisma.story.count();
    const published = await prisma.story.count({ where: { isPublished: true } });
    const unpublished = await prisma.story.count({ where: { isPublished: false } });
    
    const withPdf = await prisma.story.count({ where: { fullPdf: { not: null } } });
    const withoutPdf = await prisma.story.count({ where: { fullPdf: null } });
    
    const premium = await prisma.story.count({ where: { isPremium: true } });
    const free = await prisma.story.count({ where: { isPremium: false } });
    
    console.log(`Total Stories: ${total}`);
    console.log(`Published: ${published} (${((published/total)*100).toFixed(1)}%)`);
    console.log(`Unpublished: ${unpublished} (${((unpublished/total)*100).toFixed(1)}%)`);
    console.log(`With PDF: ${withPdf}`);
    console.log(`Without PDF: ${withoutPdf}`);
    console.log(`Premium: ${premium}`);
    console.log(`Free: ${free}`);
    
    // Get recently published stories
    const recentlyPublished = await prisma.story.findMany({
      where: {
        isPublished: true,
        publishedDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        publishedDate: true
      },
      orderBy: { publishedDate: 'desc' }
    });
    
    if (recentlyPublished.length > 0) {
      console.log('\\n📅 Recently Published (Last 24h):');
      recentlyPublished.forEach((story, index) => {
        console.log(`  ${index + 1}. "${story.title}" by ${story.authorName}`);
        console.log(`     Published: ${story.publishedDate?.toISOString()}`);
      });
    }
    
    return {
      total,
      published,
      unpublished,
      withPdf,
      withoutPdf,
      premium,
      free,
      recentlyPublished: recentlyPublished.length
    };
    
  } catch (error) {
    console.error('❌ Local database check failed:', error.message);
    return null;
  }
}

async function checkProductionAPI() {
  console.log('\\n🌐 CHECKING PRODUCTION API');
  console.log('==========================');
  
  return new Promise((resolve) => {
    const options = {
      hostname: PRODUCTION_API,
      port: 443,
      path: '/api/library/books?limit=100',
      method: 'GET',
      headers: {
        'User-Agent': 'Publication-Verifier'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.books) {
            console.log(`📚 Production Library Books: ${response.pagination.totalCount}`);
            console.log(`📄 Current Page: ${response.books.length} books`);
            console.log(`📊 Pagination: Page ${response.pagination.currentPage} of ${response.pagination.totalPages}`);
            
            // Analyze distribution
            const premium = response.books.filter(b => b.isPremium).length;
            const free = response.books.filter(b => !b.isPremium).length;
            const withPdf = response.books.filter(b => b.fullPdf).length;
            
            console.log(`\\n📈 Distribution:`);
            console.log(`  Premium: ${premium}`);
            console.log(`  Free: ${free}`);
            console.log(`  With PDF: ${withPdf}`);
            
            resolve({
              success: true,
              totalBooks: response.pagination.totalCount,
              booksOnPage: response.books.length,
              premium,
              free,
              withPdf
            });
          } else {
            console.log('❌ No books data received from production');
            resolve({ success: false, error: 'No books data' });
          }
          
        } catch (e) {
          console.log('❌ Failed to parse production response');
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Production API request failed:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.end();
  });
}

async function analyzeContentGap(localStats, productionStats) {
  console.log('\\n📊 CONTENT GAP ANALYSIS');
  console.log('========================');
  
  if (!localStats || !productionStats?.success) {
    console.log('❌ Cannot perform gap analysis - missing data');
    return;
  }
  
  const expectedBooks = 33; // From books-data.ts
  const localPublished = localStats.published;
  const productionVisible = productionStats.totalBooks;
  
  console.log(`Expected Total Books: ${expectedBooks}`);
  console.log(`Local Database Published: ${localPublished}`);
  console.log(`Production Library Visible: ${productionVisible}`);
  
  const localGap = expectedBooks - localPublished;
  const productionGap = expectedBooks - productionVisible;
  
  if (localGap === 0) {
    console.log('✅ Local Database: All expected books are published');
  } else {
    console.log(`⚠️  Local Database: ${localGap} books missing from published status`);
  }
  
  if (productionGap === 0) {
    console.log('✅ Production Library: All expected books are visible');
  } else {
    console.log(`⚠️  Production Library: ${productionGap} books missing from library`);
  }
  
  // Success criteria
  const isLocalComplete = localGap === 0;
  const isProductionComplete = productionGap === 0;
  
  console.log('\\n🎯 SUCCESS CRITERIA:');
  console.log(`Local Publication Complete: ${isLocalComplete ? '✅ YES' : '❌ NO'}`);
  console.log(`Production Library Complete: ${isProductionComplete ? '✅ YES' : '❌ NO'}`);
  
  if (isLocalComplete && isProductionComplete) {
    console.log('\\n🎉 SUCCESS: Content gap resolved! All 33 books are now published and visible.');
  } else {
    console.log('\\n🔧 ACTION NEEDED:');
    if (!isLocalComplete) {
      console.log(`• Publish ${localGap} remaining stories in local database`);
    }
    if (!isProductionComplete) {
      console.log(`• Deploy changes to production or check production database sync`);
    }
  }
  
  return {
    isComplete: isLocalComplete && isProductionComplete,
    localGap,
    productionGap
  };
}

async function generateReport(localStats, productionStats, gapAnalysis) {
  console.log('\\n📄 GENERATING VERIFICATION REPORT');
  console.log('==================================');
  
  const report = {
    timestamp: new Date().toISOString(),
    verification: {
      local: localStats,
      production: productionStats,
      gapAnalysis
    },
    summary: {
      expectedBooks: 33,
      localPublished: localStats?.published || 0,
      productionVisible: productionStats?.totalBooks || 0,
      isComplete: gapAnalysis?.isComplete || false
    },
    recommendations: []
  };
  
  // Generate recommendations
  if (localStats?.unpublished > 0) {
    report.recommendations.push(
      `Publish ${localStats.unpublished} remaining unpublished stories using the bulk publishing script`
    );
  }
  
  if (localStats?.withoutPdf > 0) {
    report.recommendations.push(
      `${localStats.withoutPdf} stories are missing PDF files - upload PDFs to public/books/ directory`
    );
  }
  
  if (!productionStats?.success) {
    report.recommendations.push(
      'Production API check failed - verify production deployment and database connection'
    );
  }
  
  if (gapAnalysis?.productionGap > 0) {
    report.recommendations.push(
      'Production library is missing books - deploy latest changes and verify database sync'
    );
  }
  
  if (report.summary.isComplete) {
    report.recommendations.push(
      'All books are published and visible - monitor user engagement and library performance'
    );
  }
  
  // Save report to file
  const fs = require('fs').promises;
  const reportFileName = `publication-verification-${Date.now()}.json`;
  
  try {
    await fs.writeFile(reportFileName, JSON.stringify(report, null, 2));
    console.log(`\\n📄 Report saved: ${reportFileName}`);
  } catch (error) {
    console.warn(`⚠️  Could not save report: ${error.message}`);
  }
  
  return report;
}

async function main() {
  console.log('🔍 1001 STORIES - PUBLICATION VERIFICATION');
  console.log('==========================================');
  console.log('Verifying the success of bulk publication operations\\n');
  
  try {
    // Step 1: Check local database
    const localStats = await checkLocalDatabase();
    
    // Step 2: Check production API
    const productionStats = await checkProductionAPI();
    
    // Step 3: Analyze content gap
    const gapAnalysis = await analyzeContentGap(localStats, productionStats);
    
    // Step 4: Generate comprehensive report
    const report = await generateReport(localStats, productionStats, gapAnalysis);
    
    console.log('\\n📋 VERIFICATION SUMMARY');
    console.log('=======================');
    console.log(`Status: ${report.summary.isComplete ? '🎉 COMPLETE' : '⚠️  INCOMPLETE'}`);
    console.log(`Expected Books: ${report.summary.expectedBooks}`);
    console.log(`Local Published: ${report.summary.localPublished}`);
    console.log(`Production Visible: ${report.summary.productionVisible}`);
    
    if (report.recommendations.length > 0) {
      console.log('\\n🔧 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    console.log('\\n✅ Verification complete!');
    
  } catch (error) {
    console.error('\\n💥 Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);