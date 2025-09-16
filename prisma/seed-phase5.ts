import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Phase 5 Publishing Workflow data...');

  // 1. Create Rejection Templates
  const templates = [
    {
      name: '부적절한 내용',
      category: 'CONTENT',
      message: '제출하신 콘텐츠에 교육 목적에 부적합한 내용이 포함되어 있습니다. 다음 사항을 수정해 주세요:\n- 연령에 적합하지 않은 내용 제거\n- 교육적 가치 강화\n- 긍정적인 메시지 포함',
      applicableRoles: ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN'],
      isActive: true,
      usageCount: 0
    },
    {
      name: '형식 미준수',
      category: 'FORMAT',
      message: '제출하신 파일이 요구 형식을 충족하지 않습니다:\n- PDF 파일 형식 확인\n- 최소 페이지 수 준수 (5페이지 이상)\n- 이미지 해상도 확인 (300dpi 이상)',
      applicableRoles: ['STORY_MANAGER', 'BOOK_MANAGER'],
      isActive: true,
      usageCount: 0
    },
    {
      name: '품질 개선 필요',
      category: 'QUALITY',
      message: '콘텐츠의 품질 개선이 필요합니다:\n- 문법 및 맞춤법 검토\n- 스토리 구성 개선\n- 삽화와 텍스트 균형 조정',
      applicableRoles: ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN'],
      isActive: true,
      usageCount: 0
    },
    {
      name: '저작권 문제',
      category: 'POLICY',
      message: '저작권 관련 문제가 발견되었습니다:\n- 원작자 확인 필요\n- 이미지 사용 권한 확인\n- 인용 출처 명시',
      applicableRoles: ['CONTENT_ADMIN', 'ADMIN'],
      isActive: true,
      usageCount: 0
    },
    {
      name: '언어 수정 필요',
      category: 'LANGUAGE',
      message: '언어 관련 수정이 필요합니다:\n- 대상 연령에 맞는 어휘 사용\n- 문장 구조 단순화\n- 교육적 표현 강화',
      applicableRoles: ['STORY_MANAGER', 'BOOK_MANAGER'],
      isActive: true,
      usageCount: 0
    }
  ];

  for (const template of templates) {
    await prisma.rejectionTemplate.upsert({
      where: { 
        name_category: {
          name: template.name,
          category: template.category as any
        }
      },
      update: template,
      create: {
        ...template,
        createdBy: 'system'
      }
    });
  }

  console.log('✅ Rejection templates created');

  // 2. Create Workflow Settings
  const workflowSettings = await prisma.workflowSettings.upsert({
    where: { id: 'default' },
    update: {
      defaultMode: 'STANDARD',
      allowModeOverride: false,
      reviewDeadlineHours: 48,
      revisionDeadlineDays: 7,
      reminderIntervalHours: 24,
      escalationRoles: ['CONTENT_ADMIN', 'ADMIN'],
      enableAutoEscalation: true,
      enableSLATracking: true,
      notificationChannels: ['EMAIL'],
      updatedAt: new Date()
    },
    create: {
      id: 'default',
      defaultMode: 'STANDARD',
      allowModeOverride: false,
      reviewDeadlineHours: 48,
      revisionDeadlineDays: 7,
      reminderIntervalHours: 24,
      escalationRoles: ['CONTENT_ADMIN', 'ADMIN'],
      enableAutoEscalation: true,
      enableSLATracking: true,
      notificationChannels: ['EMAIL'],
      createdBy: 'system'
    }
  });

  console.log('✅ Workflow settings configured');

  // 3. Ensure Admin account exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@1001stories.org';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      updatedAt: new Date()
    },
    create: {
      email: adminEmail,
      name: 'System Admin',
      role: 'ADMIN',
      emailVerified: new Date(),
      hashedPassword: null,
      tokenVersion: 0
    }
  });

  console.log('✅ Admin account verified');

  // 4. Create sample audit events for monitoring
  const auditEvents = [
    {
      eventType: 'SYSTEM_INITIALIZED',
      actorId: admin.id,
      action: 'INITIALIZE',
      metadata: {
        phase: 5,
        component: 'Publishing Workflow',
        timestamp: new Date().toISOString()
      }
    }
  ];

  for (const event of auditEvents) {
    await prisma.auditEvent.create({
      data: event
    });
  }

  console.log('✅ Audit events initialized');

  // 5. Update existing books with publishingMode if missing
  const booksWithoutMode = await prisma.book.findMany({
    where: {
      publishingMode: null
    }
  });

  if (booksWithoutMode.length > 0) {
    await prisma.book.updateMany({
      where: {
        publishingMode: null
      },
      data: {
        publishingMode: 'STANDARD'
      }
    });
    console.log(`✅ Updated ${booksWithoutMode.length} books with default publishing mode`);
  }

  console.log('🎉 Phase 5 seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });