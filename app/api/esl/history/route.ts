import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// In-memory storage for demo purposes
// In production, this would use a database
const chatHistoryStore = new Map<string, any[]>();
const activityProgressStore = new Map<string, any[]>();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'chat' or 'activity'
    const bookId = searchParams.get('bookId');

    const userId = session.user.id;
    const key = bookId ? `${userId}-${bookId}` : userId;

    if (type === 'chat') {
      const chatHistory = chatHistoryStore.get(key) || [];
      return NextResponse.json({ history: chatHistory });
    }

    if (type === 'activity') {
      const activityProgress = activityProgressStore.get(key) || [];
      return NextResponse.json({ activities: activityProgress });
    }

    // Return both if no specific type requested
    return NextResponse.json({
      chatHistory: chatHistoryStore.get(key) || [],
      activityProgress: activityProgressStore.get(key) || []
    });

  } catch (error) {
    console.error('History API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, bookId, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' }, 
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const key = bookId ? `${userId}-${bookId}` : userId;

    if (type === 'chat') {
      // Save chat message
      const chatHistory = chatHistoryStore.get(key) || [];
      const newMessage = {
        id: `msg-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...data
      };
      chatHistory.push(newMessage);
      
      // Keep only last 50 messages
      if (chatHistory.length > 50) {
        chatHistory.splice(0, chatHistory.length - 50);
      }
      
      chatHistoryStore.set(key, chatHistory);
      
      return NextResponse.json({ 
        message: 'Chat message saved',
        messageId: newMessage.id
      });
    }

    if (type === 'activity') {
      // Save activity progress
      const activityProgress = activityProgressStore.get(key) || [];
      const newActivity = {
        id: `activity-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...data
      };
      
      // Update existing activity or add new one
      const existingIndex = activityProgress.findIndex(
        a => a.templateId === data.templateId && a.bookId === data.bookId
      );
      
      if (existingIndex !== -1) {
        activityProgress[existingIndex] = newActivity;
      } else {
        activityProgress.push(newActivity);
      }
      
      activityProgressStore.set(key, activityProgress);
      
      return NextResponse.json({ 
        message: 'Activity progress saved',
        activityId: newActivity.id
      });
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "chat" or "activity"' }, 
      { status: 400 }
    );

  } catch (error) {
    console.error('History Save API Error:', error);
    return NextResponse.json(
      { error: 'Failed to save data' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const bookId = searchParams.get('bookId');
    const itemId = searchParams.get('itemId');

    const userId = session.user.id;
    const key = bookId ? `${userId}-${bookId}` : userId;

    if (type === 'chat') {
      if (itemId) {
        // Delete specific message
        const chatHistory = chatHistoryStore.get(key) || [];
        const updatedHistory = chatHistory.filter(msg => msg.id !== itemId);
        chatHistoryStore.set(key, updatedHistory);
      } else {
        // Clear all chat history for this book/user
        chatHistoryStore.delete(key);
      }
      
      return NextResponse.json({ message: 'Chat history cleared' });
    }

    if (type === 'activity') {
      if (itemId) {
        // Delete specific activity
        const activityProgress = activityProgressStore.get(key) || [];
        const updatedProgress = activityProgress.filter(activity => activity.id !== itemId);
        activityProgressStore.set(key, updatedProgress);
      } else {
        // Clear all activity progress for this book/user
        activityProgressStore.delete(key);
      }
      
      return NextResponse.json({ message: 'Activity progress cleared' });
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "chat" or "activity"' }, 
      { status: 400 }
    );

  } catch (error) {
    console.error('History Delete API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' }, 
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}