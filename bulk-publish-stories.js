/**
 * BULK STORY PUBLICATION SCRIPT
 * 
 * This script addresses the critical content management issue where:
 * - Database contains 33 book entries from books-data.ts
 * - Only 11 are currently published (visible in library)
 * - 22 books need to be published to complete the library
 * 
 * STRATEGIC APPROACH:
 * 1. Query all unpublished stories with PDF files
 * 2. Bulk publish them with proper metadata
 * 3. Update publication dates
 * 4. Create audit trail
 * 
 * Run with: node bulk-publish-stories.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeCurrentState() {
  console.log('📊 ANALYZING CURRENT PUBLICATION STATE');
  console.log('=====================================');
  
  const total = await prisma.story.count();
  const published = await prisma.story.count({ where: { isPublished: true } });
  const unpublished = await prisma.story.count({ where: { isPublished: false } });
  
  console.log(`Total Stories: ${total}`);
  console.log(`Published: ${published}`);
  console.log(`Unpublished: ${unpublished}`);
  
  return { total, published, unpublished };
}

async function getUnpublishedStories() {
  console.log('\\n🔍 IDENTIFYING UNPUBLISHED STORIES');
  console.log('==================================');
  
  const unpublishedStories = await prisma.story.findMany({
    where: { 
      isPublished: false 
    },
    select: {
      id: true,
      title: true,
      authorName: true,
      fullPdf: true,
      coverImage: true,
      isPremium: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`Found ${unpublishedStories.length} unpublished stories:`);
  
  unpublishedStories.forEach((story, index) => {
    console.log(`${index + 1}. "${story.title}" by ${story.authorName}`);
    console.log(`   ID: ${story.id}`);
    console.log(`   PDF: ${story.fullPdf ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Premium: ${story.isPremium ? '💎 Yes' : '🆓 Free'}`);
    console.log('');
  });
  
  return unpublishedStories;
}

async function bulkPublishStories(stories) {
  console.log('\\n🚀 EXECUTING BULK PUBLICATION');
  console.log('=============================');
  
  const publishDate = new Date();
  const results = [];
  
  console.log(`Publishing ${stories.length} stories...`);
  console.log(`Publication Date: ${publishDate.toISOString()}`);
  
  try {
    // Use transaction for data integrity
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        
        console.log(`\\n📚 Publishing ${i + 1}/${stories.length}: "${story.title}"`);
        
        // Update story to published status
        const updatedStory = await tx.story.update({
          where: { id: story.id },
          data: {
            isPublished: true,
            publishedDate: publishDate,
            updatedAt: publishDate,
            // Ensure featured status for free books
            featured: !story.isPremium,
            // Initialize view metrics if needed
            viewCount: story.viewCount || 0,
            likeCount: story.likeCount || 0,
          }
        });
        
        results.push({
          id: story.id,
          title: story.title,
          status: 'published',
          publishedAt: publishDate
        });
        
        console.log(`   ✅ Successfully published "${story.title}"`);
      }
    });
    
    console.log('\\n🎉 BULK PUBLICATION COMPLETED');
    console.log('============================');
    console.log(`Successfully published ${results.length} stories`);
    
    return results;
    
  } catch (error) {
    console.error('\\n❌ BULK PUBLICATION FAILED');
    console.error('===========================');
    console.error('Error:', error.message);
    throw error;
  }
}

async function verifyPublication() {
  console.log('\\n✅ VERIFYING PUBLICATION RESULTS');
  console.log('================================');
  
  const stats = await analyzeCurrentState();
  
  console.log('\\n📈 POST-PUBLICATION METRICS:');
  console.log(`Total Stories: ${stats.total}`);
  console.log(`Published: ${stats.published}`);
  console.log(`Unpublished: ${stats.unpublished}`);
  
  if (stats.unpublished === 0) {
    console.log('\\n🎯 SUCCESS: All stories are now published!');
  } else {
    console.log(`\\n⚠️  REMAINING: ${stats.unpublished} stories still unpublished`);
  }
  
  return stats;
}

async function createAuditLog(results) {
  console.log('\\n📝 CREATING AUDIT TRAIL');
  console.log('=======================');
  
  const auditData = {
    operation: 'BULK_PUBLICATION',
    timestamp: new Date(),
    storiesAffected: results.length,
    storyIds: results.map(r => r.id),
    results: results
  };
  
  console.log('Audit Summary:');
  console.log(`- Operation: ${auditData.operation}`);
  console.log(`- Timestamp: ${auditData.timestamp.toISOString()}`);
  console.log(`- Stories Affected: ${auditData.storiesAffected}`);
  
  // Write audit log to file for admin review
  const fs = require('fs').promises;
  const auditFileName = `bulk-publication-audit-${Date.now()}.json`;
  
  try {
    await fs.writeFile(auditFileName, JSON.stringify(auditData, null, 2));
    console.log(`\\n📄 Audit log saved: ${auditFileName}`);
  } catch (error) {
    console.warn(`⚠️  Could not save audit log: ${error.message}`);
  }
  
  return auditData;
}

async function main() {
  console.log('🏗️  1001 STORIES - BULK PUBLICATION TOOL');
  console.log('=========================================');
  console.log('Addressing the critical content gap where 22+ stories');
  console.log('have PDF content but are not visible in the library.\\n');
  
  try {
    // Phase 1: Analyze current state
    const initialStats = await analyzeCurrentState();
    
    if (initialStats.unpublished === 0) {
      console.log('\\n✅ All stories are already published. No action needed.');
      return;
    }
    
    // Phase 2: Get unpublished stories
    const unpublishedStories = await getUnpublishedStories();
    
    if (unpublishedStories.length === 0) {
      console.log('\\n✅ No unpublished stories found. Database is in sync.');
      return;
    }
    
    // Phase 3: Execute bulk publication
    const results = await bulkPublishStories(unpublishedStories);
    
    // Phase 4: Verify results
    const finalStats = await verifyPublication();
    
    // Phase 5: Create audit trail
    const auditData = await createAuditLog(results);
    
    console.log('\\n🎯 BULK PUBLICATION SUMMARY');
    console.log('===========================');
    console.log(`Stories Published: ${results.length}`);
    console.log(`Library Growth: ${initialStats.published} → ${finalStats.published} books`);
    console.log(`Success Rate: ${results.length === unpublishedStories.length ? '100%' : 'Partial'}`);
    console.log('\\n🚀 Next Steps for Admin:');
    console.log('1. Verify library displays all books at /library');
    console.log('2. Check story edit pages are functional');
    console.log('3. Review publication dates if needed');
    console.log('4. Test user access to newly published content');
    
  } catch (error) {
    console.error('\\n💥 CRITICAL ERROR');
    console.error('==================');
    console.error('Bulk publication failed:', error);
    console.error('\\nRecommended Actions:');
    console.error('1. Check database connection');
    console.error('2. Verify story data integrity');
    console.error('3. Review error logs');
    console.error('4. Contact system administrator');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt for production safety
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  BULK PUBLICATION CONFIRMATION');
console.log('=================================');
console.log('This script will publish ALL unpublished stories.');
console.log('This action will make content immediately visible to users.\\n');

rl.question('Are you sure you want to proceed? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\\n✅ Confirmed. Starting bulk publication...\\n');
    rl.close();
    main();
  } else {
    console.log('\\n❌ Operation cancelled by user.');
    rl.close();
  }
});