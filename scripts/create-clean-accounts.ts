import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createCleanAccounts() {
  try {
    console.log('Creating clean teacher and student accounts...\n');

    // Create clean teacher account
    const hashedTeacherPassword = await bcrypt.hash('cleanteacher123', 10);
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher.clean@test.com',
        name: 'Clean Teacher',
        password: hashedTeacherPassword,
        role: 'TEACHER',
        emailVerified: new Date(),
      },
    });

    console.log('✅ Clean Teacher account created:');
    console.log('   Email: teacher.clean@test.com');
    console.log('   Password: cleanteacher123');
    console.log('   Role: TEACHER');
    console.log('   ID:', teacher.id);
    console.log('   Status: No dummy data\n');

    // Create clean student account  
    const hashedStudentPassword = await bcrypt.hash('cleanstudent123', 10);
    const student = await prisma.user.create({
      data: {
        email: 'student.clean@test.com',
        name: 'Clean Student',
        password: hashedStudentPassword,
        role: 'LEARNER',
        emailVerified: new Date(),
      },
    });

    console.log('✅ Clean Student account created:');
    console.log('   Email: student.clean@test.com');
    console.log('   Password: cleanstudent123');
    console.log('   Role: LEARNER');
    console.log('   ID:', student.id);
    console.log('   Status: No dummy data\n');

    // Create additional clean accounts for testing
    const additionalAccounts = [
      {
        email: 'teacher2.clean@test.com',
        name: 'Second Teacher',
        password: 'teacher2pass',
        role: 'TEACHER',
        level: 'TEACHER',
      },
      {
        email: 'student2.clean@test.com',
        name: 'Second Student',
        password: 'student2pass',
        role: 'LEARNER',
        level: 'A2',
      },
      {
        email: 'student3.clean@test.com',
        name: 'Third Student',
        password: 'student3pass',
        role: 'LEARNER',
        level: 'B2',
      },
    ];

    console.log('Creating additional clean accounts...\n');

    for (const account of additionalAccounts) {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      const user = await prisma.user.create({
        data: {
          email: account.email,
          name: account.name,
          password: hashedPassword,
          role: account.role,
          emailVerified: new Date(),
        },
      });

      console.log(`✅ ${account.name} created:`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Password: ${account.password}`);
      console.log(`   Role: ${account.role}`);
      console.log(`   Level: ${account.level}`);
      console.log(`   ID: ${user.id}\n`);
    }

    console.log('========================================');
    console.log('All clean accounts created successfully!');
    console.log('========================================\n');
    console.log('Main accounts for testing:');
    console.log('1. Teacher: teacher.clean@test.com / cleanteacher123');
    console.log('2. Student: student.clean@test.com / cleanstudent123\n');
    console.log('These accounts have NO dummy data attached.');

  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ Error: One or more email addresses already exist.');
      console.log('   Tip: These accounts may have been created previously.');
      
      // Try to list existing clean accounts
      console.log('\nChecking existing clean accounts...');
      const existingAccounts = await prisma.user.findMany({
        where: {
          email: {
            contains: '.clean@test.com'
          }
        },
        select: {
          email: true,
          name: true,
          role: true,
          createdAt: true,
        }
      });

      if (existingAccounts.length > 0) {
        console.log('\nExisting clean accounts found:');
        existingAccounts.forEach(account => {
          console.log(`- ${account.email} (${account.role}) - Created: ${account.createdAt.toLocaleDateString()}`);
        });
      }
    } else {
      console.error('❌ Error creating accounts:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createCleanAccounts();