import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTeacherAccount() {
  try {
    console.log('Creating teacher account...');
    
    // Hash password for teacher
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    
    // Create teacher user
    const teacher = await prisma.user.upsert({
      where: { email: 'teacher@test.com' },
      update: {
        name: 'Test Teacher',
        role: 'TEACHER',
        password: hashedPassword,
        emailVerified: new Date()
      },
      create: {
        email: 'teacher@test.com',
        name: 'Test Teacher',
        role: 'TEACHER',
        password: hashedPassword,
        emailVerified: new Date()
      }
    });
    
    console.log('✅ Teacher account created:');
    console.log('   Email: teacher@test.com');
    console.log('   Password: teacher123');
    console.log('   Role: TEACHER');
    console.log('   ID:', teacher.id);
    
    // Also ensure we have a student account
    const studentPassword = await bcrypt.hash('student123', 10);
    const student = await prisma.user.upsert({
      where: { email: 'student@test.com' },
      update: {
        name: 'Test Student',
        role: 'LEARNER',
        password: studentPassword,
        emailVerified: new Date()
      },
      create: {
        email: 'student@test.com',
        name: 'Test Student',
        role: 'LEARNER',
        password: studentPassword,
        emailVerified: new Date()
      }
    });
    
    console.log('\n✅ Student account created:');
    console.log('   Email: student@test.com');
    console.log('   Password: student123');
    console.log('   Role: LEARNER');
    console.log('   ID:', student.id);
    
  } catch (error) {
    console.error('Error creating teacher account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTeacherAccount();