import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@1001stories.org';
  const password = 'Admin@1001!'; // Change this!
  
  try {
    // Check if admin exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existing) {
      console.log('Admin user already exists');
      
      // Update password if user exists
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          role: UserRole.ADMIN
        }
      });
      
      console.log('Admin password updated');
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const admin = await prisma.user.create({
        data: {
          email,
          name: 'Admin',
          password: hashedPassword,
          role: UserRole.ADMIN,
          emailVerified: new Date(),
          profile: {
            create: {
              bio: 'System Administrator',
              language: 'en'
            }
          },
          subscription: {
            create: {
              plan: 'PREMIUM',
              status: 'ACTIVE',
              canAccessPremium: true,
              canDownloadPDF: true,
              canCreateClasses: true,
              maxStudents: 1000,
              maxDownloads: 1000
            }
          }
        }
      });
      
      console.log('Admin user created:', admin.email);
    }
    
    console.log('\n========================================');
    console.log('Admin Login Credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('========================================\n');
    console.log('You can now login using password at /login');
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();