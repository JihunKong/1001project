import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

// Initialize OpenAI client for Upstage
const upstage = new OpenAI({
  apiKey: process.env.UPSTAGE_API_KEY || 'up_kcU1IMWm9wcC1rqplsIFMsEeqlUXN',
  baseURL: 'https://api.upstage.ai/v1',
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dashboardType = searchParams.get('type') || 'learner'; // learner, teacher, admin

    // Fetch user data and activity
    const userData = await fetchUserData(session.user.id, dashboardType);
    
    // Generate AI briefing
    const briefing = await generateAIBriefing(userData, dashboardType);

    return NextResponse.json({
      briefing,
      userData: {
        totalActivities: userData.totalActivities,
        completedBooks: userData.completedBooks,
        currentStreak: userData.currentStreak
      }
    });

  } catch (error) {
    console.error('AI Briefing API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing' }, 
      { status: 500 }
    );
  }
}

async function fetchUserData(userId: string, dashboardType: string) {
  try {
    // For now, simulate data fetching since we don't have all the database structure yet
    // In production, this would query the actual database
    
    const mockData = {
      totalActivities: Math.floor(Math.random() * 20) + 5,
      completedBooks: Math.floor(Math.random() * 10) + 2,
      currentStreak: Math.floor(Math.random() * 30) + 1,
      recentActivity: 'Completed vocabulary exercise for "The Little Explorer"',
      weeklyProgress: Math.floor(Math.random() * 80) + 20,
      strongestSkill: ['vocabulary', 'comprehension', 'discussion', 'writing'][Math.floor(Math.random() * 4)],
      areaForImprovement: ['pronunciation', 'grammar', 'listening', 'reading fluency'][Math.floor(Math.random() * 4)],
      role: dashboardType
    };

    // Try to get real user data if available
    try {
      // For now, we'll skip the database query and use mock data
      // This can be implemented later when the full database schema is ready
      console.log('Using mock data for user:', userId);
    } catch (dbError) {
      console.log('Database query failed, using mock data');
    }

    return mockData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      totalActivities: 0,
      completedBooks: 0,
      currentStreak: 0,
      recentActivity: 'No recent activity',
      weeklyProgress: 0,
      strongestSkill: 'reading',
      areaForImprovement: 'practice',
      role: dashboardType
    };
  }
}

async function generateAIBriefing(userData: any, dashboardType: string): Promise<string> {
  try {
    const systemPrompt = createBriefingPrompt(dashboardType);
    
    const userPrompt = `Generate a brief, encouraging 1-2 sentence status summary for this user:

User Data:
- Total activities completed: ${userData.totalActivities}
- Books finished: ${userData.completedBooks}
- Current learning streak: ${userData.currentStreak} days
- Recent activity: ${userData.recentActivity}
- Weekly progress: ${userData.weeklyProgress}%
- Strongest skill: ${userData.strongestSkill}
- Area for improvement: ${userData.areaForImprovement}
- Role: ${userData.role}

Make it personal, encouraging, and actionable. Keep it under 30 words.`;

    const completion = await upstage.chat.completions.create({
      model: 'solar-pro2',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
      stream: false,
    });

    const briefing = completion.choices[0]?.message?.content;
    
    if (!briefing) {
      throw new Error('No briefing generated');
    }

    return briefing.trim();

  } catch (error) {
    console.error('Error generating AI briefing:', error);
    
    // Fallback to template-based briefing
    return generateFallbackBriefing(userData, dashboardType);
  }
}

function createBriefingPrompt(dashboardType: string): string {
  const basePrompt = `You are an AI assistant providing personalized learning status updates. Create brief, encouraging summaries that motivate continued learning.`;

  switch (dashboardType) {
    case 'teacher':
      return `${basePrompt} Focus on teaching progress, student engagement, and classroom insights. Use encouraging teacher language.`;
    case 'admin':
      return `${basePrompt} Focus on overall platform usage, user engagement metrics, and system insights. Use professional administrative language.`;
    case 'learner':
    default:
      return `${basePrompt} Focus on learning progress, achievements, and next steps. Use encouraging, student-friendly language.`;
  }
}

function generateFallbackBriefing(userData: any, dashboardType: string): string {
  const templates = {
    learner: [
      `Great progress! You've completed ${userData.completedBooks} books and are on a ${userData.currentStreak}-day streak. Keep reading!`,
      `You're doing amazing with ${userData.totalActivities} activities completed! Your ${userData.strongestSkill} skills are really strong.`,
      `Fantastic ${userData.currentStreak}-day learning streak! Focus on ${userData.areaForImprovement} to boost your progress even more.`
    ],
    teacher: [
      `Your students are engaged with ${userData.totalActivities} activities completed. Great work fostering learning!`,
      `Strong teaching impact: ${userData.weeklyProgress}% weekly progress across your classes. Students love your ${userData.strongestSkill} activities.`,
      `Excellent dedication! Your consistent guidance is helping students achieve their reading goals.`
    ],
    admin: [
      `Platform engagement is strong with ${userData.totalActivities} total activities. User retention trending positively.`,
      `System performing well: ${userData.weeklyProgress}% user engagement this week. ${userData.strongestSkill} features most popular.`,
      `Great platform metrics! Users are completing books and staying engaged with learning activities.`
    ]
  };

  const templateArray = templates[dashboardType as keyof typeof templates] || templates.learner;
  return templateArray[Math.floor(Math.random() * templateArray.length)];
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}