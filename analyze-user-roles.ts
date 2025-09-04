#!/usr/bin/env npx tsx

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

interface UserRoleAnalysis {
  totalUsers: number;
  roleDistribution: Array<{
    role: UserRole;
    count: number;
    percentage: number;
    avgDaysSinceSignup: number;
    activeInLast30Days: number;
  }>;
  signupPatterns: Array<{
    month: string;
    role: UserRole;
    count: number;
  }>;
  geographicDistribution: Array<{
    role: UserRole;
    location: string | null;
    count: number;
  }>;
  behaviorAnalysis: {
    storyReadingByRole: Array<{
      role: UserRole;
      avgStoriesRead: number;
      totalReadingTime: number;
    }>;
    featureUsageByRole: Array<{
      role: UserRole;
      hasCompletedProfile: number;
      hasReadStories: number;
      hasCreatedContent: number;
    }>;
  };
  transitionPatterns: Array<{
    originalRole: UserRole;
    currentRole: UserRole;
    count: number;
  }>;
}

async function analyzeUserRoles(): Promise<UserRoleAnalysis> {
  console.log('🔍 Analyzing user roles and behavior patterns...\n');

  // 1. Basic role distribution
  console.log('📊 Fetching user role distribution...');
  const roleDistribution = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
    where: {
      deletedAt: null // Exclude soft-deleted users
    }
  });

  const totalUsers = roleDistribution.reduce((sum, role) => sum + role._count.id, 0);

  // 2. Activity analysis (users with activity in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeUsersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
    where: {
      deletedAt: null,
      OR: [
        { updatedAt: { gte: thirtyDaysAgo } },
        { sessions: { some: { expires: { gte: thirtyDaysAgo } } } },
        { readingProgress: { some: { lastReadAt: { gte: thirtyDaysAgo } } } },
        { activityLogs: { some: { createdAt: { gte: thirtyDaysAgo } } } }
      ]
    }
  });

  // 3. Average days since signup by role
  console.log('📅 Calculating signup patterns...');
  const userAgesByRole = await prisma.user.findMany({
    select: { role: true, createdAt: true },
    where: { deletedAt: null }
  });

  const roleAverages = userAgesByRole.reduce((acc, user) => {
    const daysSinceSignup = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (!acc[user.role]) {
      acc[user.role] = { total: 0, count: 0 };
    }
    acc[user.role].total += daysSinceSignup;
    acc[user.role].count += 1;
    return acc;
  }, {} as Record<UserRole, { total: number; count: number }>);

  // 4. Signup patterns by month
  const signupPatterns = await prisma.$queryRaw<Array<{
    month: string;
    role: UserRole;
    count: bigint;
  }>>`
    SELECT 
      TO_CHAR("createdAt", 'YYYY-MM') as month,
      role,
      COUNT(*) as count
    FROM users 
    WHERE "deletedAt" IS NULL 
      AND "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR("createdAt", 'YYYY-MM'), role
    ORDER BY month DESC, role
  `;

  // 5. Geographic distribution
  console.log('🌍 Analyzing geographic distribution...');
  const geographicData = await prisma.user.findMany({
    select: {
      role: true,
      profile: {
        select: { location: true }
      }
    },
    where: { deletedAt: null }
  });

  const geoDistribution = geographicData.reduce((acc, user) => {
    const location = user.profile?.location || 'Unknown';
    const key = `${user.role}-${location}`;
    if (!acc[key]) {
      acc[key] = { role: user.role, location, count: 0 };
    }
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { role: UserRole; location: string; count: number }>);

  // 6. Story reading behavior by role
  console.log('📚 Analyzing reading behavior...');
  const readingBehavior = await prisma.user.findMany({
    select: {
      role: true,
      readingProgress: {
        select: {
          totalReadingTime: true,
          isCompleted: true
        }
      }
    },
    where: { deletedAt: null }
  });

  const storyReadingByRole = readingBehavior.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = { totalReadingTime: 0, completedStories: 0, userCount: 0 };
    }
    acc[user.role].userCount += 1;
    acc[user.role].totalReadingTime += user.readingProgress.reduce((sum, progress) => sum + progress.totalReadingTime, 0);
    acc[user.role].completedStories += user.readingProgress.filter(p => p.isCompleted).length;
    return acc;
  }, {} as Record<UserRole, { totalReadingTime: number; completedStories: number; userCount: number }>);

  // 7. Feature usage patterns
  console.log('🎯 Analyzing feature usage patterns...');
  const featureUsage = await prisma.user.findMany({
    select: {
      role: true,
      profile: { select: { bio: true, organization: true } },
      readingProgress: { select: { id: true } },
      stories: { select: { id: true } },
      storySubmissions: { select: { id: true } }
    },
    where: { deletedAt: null }
  });

  const featureUsageByRole = featureUsage.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = {
        total: 0,
        hasCompletedProfile: 0,
        hasReadStories: 0,
        hasCreatedContent: 0
      };
    }
    acc[user.role].total += 1;
    
    // Note: Subscription tracking disabled - all users have free access
    
    if (user.profile && (user.profile.bio || user.profile.organization)) {
      acc[user.role].hasCompletedProfile += 1;
    }
    
    if (user.readingProgress && user.readingProgress.length > 0) {
      acc[user.role].hasReadStories += 1;
    }
    
    if ((user.stories && user.stories.length > 0) || 
        (user.storySubmissions && user.storySubmissions.length > 0)) {
      acc[user.role].hasCreatedContent += 1;
    }
    
    return acc;
  }, {} as Record<UserRole, {
    total: number;
    hasCompletedProfile: number;
    hasReadStories: number;
    hasCreatedContent: number;
  }>);

  // 8. Compile results
  const enrichedRoleDistribution = roleDistribution.map(role => {
    const activeCount = activeUsersByRole.find(a => a.role === role.role)?._count.id || 0;
    const avgDays = roleAverages[role.role] 
      ? Math.round(roleAverages[role.role].total / roleAverages[role.role].count)
      : 0;

    return {
      role: role.role,
      count: role._count.id,
      percentage: Math.round((role._count.id / totalUsers) * 100 * 100) / 100,
      avgDaysSinceSignup: avgDays,
      activeInLast30Days: activeCount
    };
  });

  return {
    totalUsers,
    roleDistribution: enrichedRoleDistribution,
    signupPatterns: signupPatterns.map(sp => ({
      month: sp.month,
      role: sp.role,
      count: Number(sp.count)
    })),
    geographicDistribution: Object.values(geoDistribution),
    behaviorAnalysis: {
      storyReadingByRole: Object.entries(storyReadingByRole).map(([role, data]) => ({
        role: role as UserRole,
        avgStoriesRead: Math.round((data.completedStories / Math.max(data.userCount, 1)) * 100) / 100,
        totalReadingTime: data.totalReadingTime
      })),
      featureUsageByRole: Object.entries(featureUsageByRole).map(([role, data]) => ({
        role: role as UserRole,
        hasCompletedProfile: data.hasCompletedProfile,
        hasReadStories: data.hasReadStories,
        hasCreatedContent: data.hasCreatedContent
      }))
    },
    transitionPatterns: [] // Would need historical role tracking to implement
  };
}

async function generateReport(analysis: UserRoleAnalysis) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 1001 STORIES - USER ROLE ANALYSIS REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📊 OVERALL PLATFORM STATISTICS`);
  console.log(`Total Users: ${analysis.totalUsers.toLocaleString()}`);
  console.log(`Report Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);

  console.log(`\n👥 CURRENT ROLE DISTRIBUTION`);
  console.log('----------------------------------------');
  analysis.roleDistribution
    .sort((a, b) => b.count - a.count)
    .forEach(role => {
      const activityRate = role.count > 0 ? Math.round((role.activeInLast30Days / role.count) * 100) : 0;
      console.log(`${role.role.padEnd(12)} | ${String(role.count).padStart(6)} users (${String(role.percentage).padStart(5)}%) | ${String(role.avgDaysSinceSignup).padStart(3)} avg days old | ${activityRate}% active`);
    });

  console.log(`\n📈 SIGNUP PATTERNS (Last 12 Months)`);
  console.log('----------------------------------------');
  const monthlyTotals = analysis.signupPatterns.reduce((acc, pattern) => {
    if (!acc[pattern.month]) acc[pattern.month] = 0;
    acc[pattern.month] += pattern.count;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(monthlyTotals)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .forEach(([month, total]) => {
      console.log(`${month}: ${total} new users`);
      const monthPatterns = analysis.signupPatterns.filter(p => p.month === month);
      monthPatterns.forEach(pattern => {
        console.log(`  └─ ${pattern.role}: ${pattern.count}`);
      });
    });

  console.log(`\n🌍 GEOGRAPHIC DISTRIBUTION (Top Locations by Role)`);
  console.log('----------------------------------------');
  Object.values(UserRole).forEach(role => {
    const roleLocations = analysis.geographicDistribution
      .filter(geo => geo.role === role)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    if (roleLocations.length > 0) {
      console.log(`${role}:`);
      roleLocations.forEach(loc => {
        console.log(`  └─ ${loc.location}: ${loc.count} users`);
      });
    }
  });

  console.log(`\n📚 READING BEHAVIOR BY ROLE`);
  console.log('----------------------------------------');
  analysis.behaviorAnalysis.storyReadingByRole.forEach(reading => {
    console.log(`${reading.role.padEnd(12)} | Avg stories read: ${reading.avgStoriesRead} | Total reading time: ${Math.round(reading.totalReadingTime/60)}h`);
  });

  console.log(`\n🎯 FEATURE USAGE ANALYSIS`);
  console.log('----------------------------------------');
  analysis.behaviorAnalysis.featureUsageByRole.forEach(usage => {
    const roleTotal = analysis.roleDistribution.find(r => r.role === usage.role)?.count || 1;
    console.log(`${usage.role}:`);
    console.log(`  └─ Completed profile: ${usage.hasCompletedProfile}/${roleTotal} (${Math.round((usage.hasCompletedProfile/roleTotal)*100)}%)`);
    console.log(`  └─ Has read stories: ${usage.hasReadStories}/${roleTotal} (${Math.round((usage.hasReadStories/roleTotal)*100)}%)`);
    console.log(`  └─ Created content: ${usage.hasCreatedContent}/${roleTotal} (${Math.round((usage.hasCreatedContent/roleTotal)*100)}%)`);
  });

  console.log(`\n💡 ROLE REDESIGN INSIGHTS & RECOMMENDATIONS`);
  console.log('----------------------------------------');
  
  // Calculate insights
  const learners = analysis.roleDistribution.find(r => r.role === 'LEARNER');
  const teachers = analysis.roleDistribution.find(r => r.role === 'TEACHER'); 
  const volunteers = analysis.roleDistribution.find(r => r.role === 'VOLUNTEER');
  const institutions = analysis.roleDistribution.find(r => r.role === 'INSTITUTION');
  const admins = analysis.roleDistribution.find(r => r.role === 'ADMIN');

  console.log(`\n🔄 CURRENT → NEW ROLE MAPPING RECOMMENDATIONS:`);
  if (learners) {
    console.log(`LEARNER (${learners.count} users) → "Customer/Student"`);
    console.log(`  • ${Math.round((learners.activeInLast30Days / learners.count) * 100)}% activity rate suggests good engagement`);
  }
  
  if (teachers) {
    console.log(`TEACHER (${teachers.count} users) → "Teacher" (admin-assigned)`);
    console.log(`  • High-value users requiring careful migration handling`);
  }
  
  if (volunteers) {
    console.log(`VOLUNTEER (${volunteers.count} users) → "Volunteer" (admin-assigned)`);
    console.log(`  • Content creators requiring special attention`);
  }
  
  if (institutions) {
    console.log(`INSTITUTION (${institutions.count} users) → "Organization" (admin-assigned)`);
    console.log(`  • Institutional accounts with premium features`);
  }

  console.log(`\n⚠️  MIGRATION RISK ASSESSMENT:`);
  const totalHighValue = (teachers?.count || 0) + (volunteers?.count || 0) + (institutions?.count || 0);
  console.log(`• High-value users at risk: ${totalHighValue}/${analysis.totalUsers} (${Math.round((totalHighValue/analysis.totalUsers)*100)}%)`);
  console.log(`• User communication required before migration`);
  console.log(`• Recommend role assignment workflow for admins`);

  console.log('\n' + '='.repeat(80));
}

// Execute analysis
async function main() {
  try {
    const analysis = await analyzeUserRoles();
    await generateReport(analysis);
    
    // Also save as JSON for further analysis
    const fs = require('fs');
    fs.writeFileSync(
      'user-role-analysis-report.json', 
      JSON.stringify(analysis, null, 2)
    );
    console.log('\n💾 Detailed analysis saved to: user-role-analysis-report.json');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();