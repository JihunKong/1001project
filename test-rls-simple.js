const { PrismaClient } = require('@prisma/client');

async function testRLS() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://stories_user:stories_password_123@localhost:5432/stories_db'
      }
    }
  });

  try {
    console.log('🔧 Testing RLS with Prisma Client...');

    // Test 1: Set context as volunteer user_1
    console.log('\n📋 Test 1: Set context as user_1 (VOLUNTEER)');
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', 'user_1', true)`;
    await prisma.$executeRaw`SELECT set_config('app.current_user_role', 'VOLUNTEER', true)`;
    
    const profiles1 = await prisma.volunteerProfile.findMany({
      select: { userId: true, id: true }
    });
    console.log('User 1 can see profiles:', profiles1);

    // Test 2: Set context as volunteer user_2
    console.log('\n📋 Test 2: Set context as user_2 (VOLUNTEER)');
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', 'user_2', true)`;
    await prisma.$executeRaw`SELECT set_config('app.current_user_role', 'VOLUNTEER', true)`;
    
    const profiles2 = await prisma.volunteerProfile.findMany({
      select: { userId: true, id: true }
    });
    console.log('User 2 can see profiles:', profiles2);

    // Test 3: Set context as admin
    console.log('\n📋 Test 3: Set context as admin_1 (ADMIN)');
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', 'admin_1', true)`;
    await prisma.$executeRaw`SELECT set_config('app.current_user_role', 'ADMIN', true)`;
    
    const profilesAdmin = await prisma.volunteerProfile.findMany({
      select: { userId: true, id: true }
    });
    console.log('Admin can see profiles:', profilesAdmin);

    // Test 4: Check context functions
    console.log('\n📋 Test 4: Check context functions');
    const contextCheck = await prisma.$queryRaw`
      SELECT 
        current_setting('app.current_user_id', true) as user_id,
        current_setting('app.current_user_role', true) as user_role,
        current_user as db_user
    `;
    console.log('Current context:', contextCheck);

    console.log('\n✅ RLS test completed');

  } catch (error) {
    console.error('❌ RLS test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRLS();