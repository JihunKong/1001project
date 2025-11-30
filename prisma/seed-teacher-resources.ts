import { PrismaClient, TeacherResourceType } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_RESOURCES = [
  {
    title: '국어 1학년 읽기 교과서',
    description: '초등학교 1학년 국어 읽기 기초 교육 자료입니다.',
    type: TeacherResourceType.TEXTBOOK,
    subject: 'korean',
    grade: 'grade1',
    fileUrl: '/resources/korean-grade1-reading.pdf',
    fileSize: 5242880,
    thumbnailUrl: '/resources/thumbnails/korean-grade1.jpg',
    rating: 4.5,
    ratingCount: 23,
    downloadCount: 156,
    viewCount: 420,
  },
  {
    title: '수학 2학년 연산 워크시트',
    description: '덧셈과 뺄셈 연습을 위한 워크시트 모음입니다.',
    type: TeacherResourceType.WORKSHEET,
    subject: 'math',
    grade: 'grade2',
    fileUrl: '/resources/math-grade2-worksheet.pdf',
    fileSize: 1048576,
    thumbnailUrl: '/resources/thumbnails/math-grade2.jpg',
    rating: 4.8,
    ratingCount: 45,
    downloadCount: 289,
    viewCount: 534,
  },
  {
    title: '과학 3학년 실험 동영상 - 물의 상태 변화',
    description: '물의 세 가지 상태와 상태 변화를 설명하는 실험 동영상입니다.',
    type: TeacherResourceType.VIDEO,
    subject: 'science',
    grade: 'grade3',
    fileUrl: '/resources/science-grade3-water.mp4',
    fileSize: 52428800,
    duration: 480,
    thumbnailUrl: '/resources/thumbnails/science-grade3.jpg',
    rating: 4.7,
    ratingCount: 67,
    downloadCount: 198,
    viewCount: 892,
  },
  {
    title: '사회 4학년 지역사회 이미지 자료',
    description: '지역사회 학습을 위한 사진 및 지도 이미지 모음입니다.',
    type: TeacherResourceType.IMAGE,
    subject: 'social',
    grade: 'grade4',
    fileUrl: '/resources/social-grade4-community.zip',
    fileSize: 15728640,
    thumbnailUrl: '/resources/thumbnails/social-grade4.jpg',
    rating: 4.3,
    ratingCount: 12,
    downloadCount: 89,
    viewCount: 234,
  },
  {
    title: '영어 1학년 알파벳 노래',
    description: 'ABC 알파벳을 재미있게 배울 수 있는 노래 오디오 파일입니다.',
    type: TeacherResourceType.AUDIO,
    subject: 'english',
    grade: 'grade1',
    fileUrl: '/resources/english-grade1-alphabet.mp3',
    fileSize: 3145728,
    duration: 180,
    thumbnailUrl: '/resources/thumbnails/english-grade1.jpg',
    rating: 4.9,
    ratingCount: 89,
    downloadCount: 456,
    viewCount: 1203,
  },
  {
    title: '국어 2학년 받아쓰기 자료',
    description: '받아쓰기 연습을 위한 단어 및 문장 모음입니다.',
    type: TeacherResourceType.DOCUMENT,
    subject: 'korean',
    grade: 'grade2',
    fileUrl: '/resources/korean-grade2-dictation.docx',
    fileSize: 524288,
    thumbnailUrl: '/resources/thumbnails/korean-grade2.jpg',
    rating: 4.4,
    ratingCount: 34,
    downloadCount: 167,
    viewCount: 312,
  },
  {
    title: '수학 3학년 구구단 학습 동영상',
    description: '구구단을 쉽게 외울 수 있는 학습 동영상입니다.',
    type: TeacherResourceType.VIDEO,
    subject: 'math',
    grade: 'grade3',
    fileUrl: '/resources/math-grade3-multiplication.mp4',
    fileSize: 41943040,
    duration: 600,
    thumbnailUrl: '/resources/thumbnails/math-grade3.jpg',
    rating: 4.6,
    ratingCount: 78,
    downloadCount: 345,
    viewCount: 1567,
  },
  {
    title: '과학 4학년 생태계 학습 자료',
    description: '생태계의 구성 요소와 먹이사슬을 설명하는 교육 자료입니다.',
    type: TeacherResourceType.TEXTBOOK,
    subject: 'science',
    grade: 'grade4',
    fileUrl: '/resources/science-grade4-ecosystem.pdf',
    fileSize: 8388608,
    thumbnailUrl: '/resources/thumbnails/science-grade4.jpg',
    rating: 4.2,
    ratingCount: 19,
    downloadCount: 123,
    viewCount: 289,
  },
  {
    title: '사회 1학년 가족 관계 워크시트',
    description: '가족 구성원과 관계를 이해하기 위한 워크시트입니다.',
    type: TeacherResourceType.WORKSHEET,
    subject: 'social',
    grade: 'grade1',
    fileUrl: '/resources/social-grade1-family.pdf',
    fileSize: 786432,
    thumbnailUrl: '/resources/thumbnails/social-grade1.jpg',
    rating: 4.5,
    ratingCount: 28,
    downloadCount: 201,
    viewCount: 478,
  },
  {
    title: '영어 2학년 파닉스 오디오 자료',
    description: '파닉스 학습을 위한 발음 오디오 파일 모음입니다.',
    type: TeacherResourceType.AUDIO,
    subject: 'english',
    grade: 'grade2',
    fileUrl: '/resources/english-grade2-phonics.zip',
    fileSize: 10485760,
    duration: 1200,
    thumbnailUrl: '/resources/thumbnails/english-grade2.jpg',
    rating: 4.7,
    ratingCount: 56,
    downloadCount: 312,
    viewCount: 723,
  },
  {
    title: '국어 3학년 글쓰기 교육 자료',
    description: '일기, 편지, 설명문 쓰기를 위한 교육 자료입니다.',
    type: TeacherResourceType.DOCUMENT,
    subject: 'korean',
    grade: 'grade3',
    fileUrl: '/resources/korean-grade3-writing.pdf',
    fileSize: 2097152,
    thumbnailUrl: '/resources/thumbnails/korean-grade3.jpg',
    rating: 4.3,
    ratingCount: 41,
    downloadCount: 234,
    viewCount: 567,
  },
  {
    title: '수학 4학년 도형 학습 이미지',
    description: '다양한 도형과 도형의 성질을 설명하는 이미지 자료입니다.',
    type: TeacherResourceType.IMAGE,
    subject: 'math',
    grade: 'grade4',
    fileUrl: '/resources/math-grade4-shapes.zip',
    fileSize: 6291456,
    thumbnailUrl: '/resources/thumbnails/math-grade4.jpg',
    rating: 4.1,
    ratingCount: 15,
    downloadCount: 98,
    viewCount: 234,
  },
];

async function main() {
  console.log('Starting teacher resources seed...');

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.log('No admin user found. Creating a demo admin user...');
    const createdAdmin = await prisma.user.upsert({
      where: { email: 'admin@1001stories.org' },
      update: {},
      create: {
        email: 'admin@1001stories.org',
        name: 'Admin User',
        role: 'ADMIN',
      },
    });
    console.log(`Created admin user: ${createdAdmin.email}`);
  }

  const author = adminUser || await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (!author) {
    throw new Error('Could not find or create an admin user');
  }

  console.log(`Using author: ${author.email}`);

  for (const resource of SAMPLE_RESOURCES) {
    const existingResource = await prisma.teacherResource.findFirst({
      where: { title: resource.title },
    });

    if (existingResource) {
      console.log(`Skipping existing resource: ${resource.title}`);
      continue;
    }

    await prisma.teacherResource.create({
      data: {
        ...resource,
        authorId: author.id,
        isPublished: true,
      },
    });
    console.log(`Created resource: ${resource.title}`);
  }

  console.log('Teacher resources seed completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding teacher resources:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
