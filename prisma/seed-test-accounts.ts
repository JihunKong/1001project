import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating test accounts for Phase 5 Publishing Workflow testing...\n');

  // Test accounts with simple memorable passwords
  const testAccounts = [
    {
      email: 'learner.test@1001stories.org',
      name: 'Test Learner',
      role: UserRole.LEARNER,
      password: 'learner123',
      description: 'Student account for testing book assignments and reading'
    },
    {
      email: 'teacher.test@1001stories.org',
      name: 'Test Teacher',
      role: UserRole.TEACHER,
      password: 'teacher123',
      description: 'Teacher account for managing classes and assigning books'
    },
    {
      email: 'volunteer.test@1001stories.org',
      name: 'Test Volunteer',
      role: UserRole.VOLUNTEER,
      password: 'volunteer123',
      description: 'Volunteer account for submitting stories'
    },
    {
      email: 'story.manager@1001stories.org',
      name: 'Story Manager Test',
      role: UserRole.STORY_MANAGER,
      password: 'storymanager123',
      description: 'Reviews and approves submitted stories'
    },
    {
      email: 'book.manager@1001stories.org',
      name: 'Book Manager Test',
      role: UserRole.BOOK_MANAGER,
      password: 'bookmanager123',
      description: 'Manages book format decisions and publication pipeline'
    },
    {
      email: 'content.admin@1001stories.org',
      name: 'Content Admin Test',
      role: UserRole.CONTENT_ADMIN,
      password: 'contentadmin123',
      description: 'Final approval and content policy management'
    },
    {
      email: 'admin.test@1001stories.org',
      name: 'System Admin Test',
      role: UserRole.ADMIN,
      password: 'admin123456',
      description: 'Full system administration access'
    }
  ];

  console.log('Creating/Updating test accounts:\n');
  console.log('=' .repeat(70));

  const createdUsers = [];
  
  for (const account of testAccounts) {
    try {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      const user = await prisma.user.upsert({
        where: { email: account.email },
        update: {
          name: account.name,
          role: account.role,
          password: hashedPassword,
          emailVerified: new Date(), // Mark as verified for immediate use
        },
        create: {
          email: account.email,
          name: account.name,
          role: account.role,
          password: hashedPassword,
          emailVerified: new Date(), // Mark as verified for immediate use
          isActive: true,
          profileImage: `/images/avatars/${account.role.toLowerCase()}.png`,
          settings: {
            emailNotifications: true,
            theme: 'light',
            language: 'en'
          }
        }
      });

      createdUsers.push(user);
      
      console.log(`✅ Account: ${account.email}`);
      console.log(`   Role: ${account.role}`);
      console.log(`   Password: ${account.password}`);
      console.log(`   Purpose: ${account.description}`);
      console.log('-'.repeat(70));
      
    } catch (error) {
      console.error(`❌ Failed to create ${account.email}:`, error);
    }
  }

  // Create a test class for the teacher
  const teacher = createdUsers.find(u => u.role === UserRole.TEACHER);
  const learner = createdUsers.find(u => u.role === UserRole.LEARNER);
  
  if (teacher && learner) {
    try {
      const testClass = await prisma.class.upsert({
        where: { 
          joinCode: 'TEST01'
        },
        update: {
          name: 'Phase 5 Test Class',
          description: 'Class for testing publishing workflow',
          teacherId: teacher.id,
        },
        create: {
          name: 'Phase 5 Test Class',
          description: 'Class for testing publishing workflow',
          teacherId: teacher.id,
          joinCode: 'TEST01',
          settings: {
            allowStudentSubmissions: true,
            requireApprovalForPublishing: true,
            maxStudents: 30
          }
        }
      });

      // Enroll the test learner
      await prisma.classEnrollment.upsert({
        where: {
          studentId_classId: {
            studentId: learner.id,
            classId: testClass.id
          }
        },
        update: {},
        create: {
          studentId: learner.id,
          classId: testClass.id,
          enrolledAt: new Date()
        }
      });

      console.log(`\n✅ Created test class:`);
      console.log(`   Class Name: ${testClass.name}`);
      console.log(`   Join Code: ${testClass.joinCode}`);
      console.log(`   Teacher: ${teacher.email}`);
      console.log(`   Enrolled Student: ${learner.email}`);
      
    } catch (error) {
      console.error('❌ Failed to create test class:', error);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📋 SUMMARY OF TEST ACCOUNTS:\n');
  
  console.log('Publishing Workflow Roles:');
  console.log('1. Learner: learner.test@1001stories.org / learner123');
  console.log('2. Teacher: teacher.test@1001stories.org / teacher123');
  console.log('3. Volunteer: volunteer.test@1001stories.org / volunteer123');
  console.log('4. Story Manager: story.manager@1001stories.org / storymanager123');
  console.log('5. Book Manager: book.manager@1001stories.org / bookmanager123');
  console.log('6. Content Admin: content.admin@1001stories.org / contentadmin123');
  console.log('7. Admin: admin.test@1001stories.org / admin123456');
  
  console.log('\n🎯 Publishing Workflow Testing Steps:');
  console.log('1. Login as Volunteer → Submit a story');
  console.log('2. Login as Story Manager → Review and approve story');
  console.log('3. Login as Book Manager → Decide format and approve');
  console.log('4. Login as Content Admin → Final approval and publish');
  console.log('5. Login as Teacher → Assign published book to class');
  console.log('6. Login as Learner → Read assigned book');
  
  console.log('\n✨ Test accounts created successfully!');
  console.log('🔗 Login at: https://1001stories.seedsofempowerment.org/login');
}

main()
  .catch((e) => {
    console.error('❌ Error creating test accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });