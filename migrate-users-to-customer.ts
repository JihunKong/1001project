#!/usr/bin/env npx tsx

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUsersToCustomer() {
  console.log('🔄 Starting user role migration...\n');
  
  try {
    // Get current user role distribution
    const currentRoles = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: {
        deletedAt: null
      }
    });
    
    console.log('📊 Current role distribution:');
    currentRoles.forEach(role => {
      console.log(`   ${role.role}: ${role._count.role} users`);
    });
    console.log('');
    
    // Find LEARNER users to migrate
    const learnerUsers = await prisma.user.findMany({
      where: {
        role: UserRole.LEARNER,
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    if (learnerUsers.length === 0) {
      console.log('✅ No LEARNER users found to migrate.');
      return;
    }
    
    console.log(`🎯 Found ${learnerUsers.length} LEARNER users to migrate:`);
    learnerUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name || 'No name'})`);
    });
    console.log('');
    
    // Migrate LEARNER users to CUSTOMER
    const result = await prisma.user.updateMany({
      where: {
        role: UserRole.LEARNER,
        deletedAt: null
      },
      data: {
        role: UserRole.CUSTOMER
      }
    });
    
    console.log(`✅ Successfully migrated ${result.count} users from LEARNER to CUSTOMER`);
    
    // Verify the migration
    const newRoles = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: {
        deletedAt: null
      }
    });
    
    console.log('\n📊 Updated role distribution:');
    newRoles.forEach(role => {
      console.log(`   ${role.role}: ${role._count.role} users`);
    });
    
    const totalUsers = newRoles.reduce((sum, role) => sum + role._count.role, 0);
    console.log(`\n🎉 Migration complete! Total active users: ${totalUsers}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsersToCustomer();