import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubmissions() {
  try {
    const submissions = await prisma.textSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: { select: { name: true, email: true } }
      }
    });

    console.log('\n=== 최근 TextSubmission 상태 (Latest 20) ===\n');
    submissions.forEach((s, i) => {
      const authorName = s.author?.name || 'Unknown';
      const date = s.createdAt.toISOString().split('T')[0];
      console.log(`${i+1}. [${s.status}] "${s.title}" - ${authorName} (${date})`);
    });

    // 상태별 카운트
    const statusCounts = await prisma.textSubmission.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    console.log('\n=== 상태별 집계 ===');
    statusCounts.forEach(s => {
      console.log(`${s.status}: ${s._count.status}개`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubmissions();
