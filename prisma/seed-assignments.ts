/**
 * Seed script for BookAssignments and related educational tables
 * Creates test data for the teacher-student assignment system
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding BookAssignments and educational data...')

  // Ensure we have the required users
  let teacher = await prisma.user.findFirst({
    where: { email: 'teacher1@test.edu' }
  })

  if (!teacher) {
    console.log('Creating teacher user...')
    teacher = await prisma.user.create({
      data: {
        email: 'teacher1@test.edu',
        name: 'Ms. Rodriguez',
        role: 'TEACHER',
        password: await hash('password123', 12),
        emailVerified: new Date()
      }
    })
  }

  let student = await prisma.user.findFirst({
    where: { email: 'student1@test.edu' }
  })

  if (!student) {
    console.log('Creating student user...')
    student = await prisma.user.create({
      data: {
        email: 'student1@test.edu',
        name: 'Alex Student',
        role: 'LEARNER',
        password: await hash('password123', 12),
        emailVerified: new Date()
      }
    })
  }

  // Create a test class
  let testClass = await prisma.class.findFirst({
    where: { code: 'ENG101' }
  })

  if (!testClass) {
    console.log('Creating test class...')
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 4) // 4 months duration
    
    testClass = await prisma.class.create({
      data: {
        code: 'ENG101',
        name: 'English Literature 101',
        subject: 'English',
        gradeLevel: '9th Grade',
        teacherId: teacher.id,
        description: 'Introduction to English Literature',
        maxStudents: 25,
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '10:00 AM - 11:30 AM',
          timezone: 'UTC'
        },
        startDate,
        endDate,
        settings: {
          allowDiscussion: true,
          autoGrading: false,
          notificationsEnabled: true
        }
      }
    })
  }

  // Enroll student in class
  const existingEnrollment = await prisma.classEnrollment.findFirst({
    where: {
      studentId: student.id,
      classId: testClass.id
    }
  })

  if (!existingEnrollment) {
    console.log('Enrolling student in class...')
    await prisma.classEnrollment.create({
      data: {
        studentId: student.id,
        classId: testClass.id,
        status: 'ACTIVE',
        enrolledAt: new Date()
      }
    })
  }

  // Get some books to assign
  const books = await prisma.book.findMany({
    where: { isPublished: true },
    take: 3
  })

  if (books.length === 0) {
    console.log('No published books found. Creating sample books...')
    
    await prisma.book.createMany({
      data: [
        {
          id: 'test-book-1',
          title: 'The Little Prince',
          authorName: 'Antoine de Saint-Exupéry',
          summary: 'A beautiful story about friendship and imagination.',
          content: 'Once upon a time, there was a little prince who lived on a very small planet...',
          language: 'en',
          category: 'Fiction',
          readingLevel: 'Intermediate',
          pageCount: 96,
          isPublished: true,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test-book-2',
          title: 'Charlotte\'s Web',
          authorName: 'E.B. White',
          summary: 'The story of a pig named Wilbur and his spider friend Charlotte.',
          content: 'Where\'s Papa going with that ax?" said Fern to her mother...',
          language: 'en',
          category: 'Fiction',
          readingLevel: 'Beginner',
          pageCount: 184,
          isPublished: true,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test-book-3',
          title: 'The Giver',
          authorName: 'Lois Lowry',
          summary: 'A dystopian story about a boy who discovers the truth about his society.',
          content: 'It was almost December, and Jonas was beginning to be frightened...',
          language: 'en',
          category: 'Science Fiction',
          readingLevel: 'Advanced',
          pageCount: 208,
          isPublished: true,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      skipDuplicates: true
    })
  }

  // Get updated books list
  const availableBooks = await prisma.book.findMany({
    where: { isPublished: true },
    take: 3
  })

  // Create book assignments
  for (const book of availableBooks) {
    const existingAssignment = await prisma.bookAssignment.findFirst({
      where: {
        bookId: book.id,
        classId: testClass.id,
        teacherId: teacher.id
      }
    })

    if (!existingAssignment) {
      console.log(`Creating assignment for book: ${book.title}`)
      
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14) // 2 weeks from now

      await prisma.bookAssignment.create({
        data: {
          bookId: book.id,
          classId: testClass.id,
          teacherId: teacher.id,
          assignedAt: new Date(),
          dueDate,
          instructions: `Please read "${book.title}" and be prepared to discuss the main themes and characters.`,
          isRequired: true,
          allowDiscussion: true
        }
      })
    }
  }

  // Note: Skipping ReadingProgress creation due to foreign key mismatch
  // ReadingProgress references Story, not Book - this needs schema correction
  console.log('Skipping ReadingProgress creation (schema mismatch - references Story not Book)')

  console.log('✅ BookAssignment seeding completed!')
  
  // Print summary
  const assignmentCount = await prisma.bookAssignment.count()
  const enrollmentCount = await prisma.classEnrollment.count()
  const progressCount = await prisma.readingProgress.count()
  
  console.log(`📊 Summary:`)
  console.log(`   - Book Assignments: ${assignmentCount}`)
  console.log(`   - Class Enrollments: ${enrollmentCount}`)
  console.log(`   - Reading Progress: ${progressCount}`)
  console.log(`   - Test Class: ${testClass.code} (${testClass.name})`)
  console.log(`   - Teacher: ${teacher.email}`)
  console.log(`   - Student: ${student.email}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding assignments:', e)
    await prisma.$disconnect()
    process.exit(1)
  })