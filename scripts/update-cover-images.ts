import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function updateCoverImages() {
  try {
    console.log('🔍 Checking books with PDF cover images...');

    // PDF 확장자를 가진 coverImage를 가진 모든 책 조회
    const booksWithPdfCovers = await prisma.book.findMany({
      where: {
        coverImage: {
          endsWith: '.pdf'
        }
      },
      select: {
        id: true,
        title: true,
        coverImage: true
      }
    });

    console.log(`📚 Found ${booksWithPdfCovers.length} books with PDF cover images\n`);

    if (booksWithPdfCovers.length === 0) {
      console.log('✅ No books need updating!');
      return;
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const book of booksWithPdfCovers) {
      if (!book.coverImage) continue;

      // PDF 경로를 JPG로 변경
      const jpgPath = book.coverImage.replace('.pdf', '.jpg');

      // 로컬 파일 시스템에서 JPG 파일 존재 확인 (선택사항)
      const localFilePath = path.join(process.cwd(), 'public', jpgPath.replace('/covers/', 'covers/'));

      try {
        // 파일이 존재하는지 확인하지 않고 바로 업데이트
        // (서버에서 실행될 때는 Docker 컨테이너 내부이므로 파일 확인 불가)
        await prisma.book.update({
          where: { id: book.id },
          data: { coverImage: jpgPath }
        });

        console.log(`✅ Updated: ${book.title}`);
        console.log(`   ${book.coverImage} → ${jpgPath}`);
        updated++;
      } catch (error) {
        console.error(`❌ Failed to update ${book.title}:`, error);
        errors++;
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Update Summary`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📚 Total books processed: ${booksWithPdfCovers.length}`);
    console.log('');

    if (errors > 0) {
      console.log('⚠️  Some updates failed. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('🎉 All cover images updated successfully!');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
updateCoverImages()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
