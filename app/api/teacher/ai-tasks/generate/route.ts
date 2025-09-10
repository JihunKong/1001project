import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { upstageService } from '@/lib/upstage-service';

interface GenerateTaskRequest {
  bookId: string;
  taskType: 'comprehension' | 'vocabulary' | 'creative' | 'discussion' | 'analysis';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  prompt: string;
  targetStudents?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Teacher access required' },
        { status: 403 }
      );
    }

    const body: GenerateTaskRequest = await request.json();
    const { bookId, taskType, difficulty, prompt, targetStudents } = body;

    if (!bookId || !taskType || !prompt) {
      return NextResponse.json(
        { error: 'Book ID, task type, and prompt are required' },
        { status: 400 }
      );
    }

    // Get book information
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        content: true,
        difficulty: true
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Get target student information if provided
    let studentProfiles = [];
    if (targetStudents && targetStudents.length > 0) {
      const students = await prisma.user.findMany({
        where: {
          id: { in: targetStudents },
          role: 'LEARNER'
        },
        select: {
          id: true,
          name: true,
          readingLevel: true
        }
      });
      
      studentProfiles = students.map(s => ({
        id: s.id,
        name: s.name,
        readingLevel: s.readingLevel || 'BEGINNER'
      }));
    }

    // Prepare content for AI generation
    const bookContent = book.content ? book.content.substring(0, 3000) : book.description || '';
    
    // Create comprehensive prompt for task generation
    const systemPrompt = generateSystemPrompt(taskType, difficulty, book, studentProfiles);
    const userPrompt = `${prompt}\n\nBook Content Preview:\n${bookContent}`;

    // Generate tasks using Upstage AI
    const aiResponse = await upstageService.generateEducationalTasks({
      bookContext: {
        id: book.id,
        title: book.title,
        content: bookContent,
      },
      taskType,
      difficulty,
      customPrompt: userPrompt,
      systemPrompt,
      studentProfiles: studentProfiles.map(s => ({
        readingLevel: s.readingLevel as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        name: s.name
      }))
    });

    if (!aiResponse.success) {
      throw new Error(aiResponse.error || 'Failed to generate tasks');
    }

    // Parse and structure the AI response
    const generatedContent = aiResponse.content;
    const tasks = parseAITaskResponse(generatedContent, taskType, difficulty);

    // Save generated task to database
    const savedTask = await prisma.aIGeneratedTask.create({
      data: {
        teacherId: session.user.id,
        bookId: book.id,
        type: taskType,
        title: tasks.title,
        description: tasks.description,
        difficulty: difficulty,
        estimatedTime: tasks.estimatedTime,
        questions: JSON.stringify(tasks.questions),
        metadata: JSON.stringify({
          originalPrompt: prompt,
          targetStudents: targetStudents || [],
          generatedAt: new Date().toISOString(),
          bookTitle: book.title,
          bookAuthor: book.author
        }),
        isPublished: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        taskId: savedTask.id,
        task: {
          id: savedTask.id,
          type: taskType,
          title: tasks.title,
          description: tasks.description,
          questions: tasks.questions,
          estimatedTime: tasks.estimatedTime,
          difficulty: difficulty,
          bookId: book.id,
          targetStudents: targetStudents || [],
          createdAt: savedTask.createdAt.toISOString(),
          isPublished: false
        }
      }
    });

  } catch (error) {
    console.error('Error generating AI tasks:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate AI tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateSystemPrompt(
  taskType: string, 
  difficulty: string, 
  book: any, 
  studentProfiles: any[]
): string {
  const basePrompt = `You are an expert educational content creator specializing in reading comprehension and literacy development. Your task is to create high-quality educational tasks based on the provided book content.

Book Information:
- Title: ${book.title}
- Author: ${book.author}
- Difficulty Level: ${book.difficulty}
- Description: ${book.description || 'Not provided'}

Task Requirements:
- Task Type: ${taskType}
- Difficulty Level: ${difficulty}
- Target Students: ${studentProfiles.length > 0 ? studentProfiles.map(s => `${s.name} (${s.readingLevel})`).join(', ') : 'General audience'}

Instructions:
1. Create a clear, engaging task title
2. Write a comprehensive task description explaining what students will do
3. Generate 5-8 relevant questions of varying types (multiple choice, short answer, essay, true/false)
4. Ensure questions are appropriate for the ${difficulty} level
5. Provide correct answers for objective questions
6. Assign point values to each question (1-5 points based on complexity)
7. Estimate completion time in minutes

Response Format:
Return a JSON object with this exact structure:
{
  "title": "Task title here",
  "description": "Detailed task description",
  "estimatedTime": 30,
  "questions": [
    {
      "question": "Question text here",
      "type": "multiple_choice|short_answer|essay|true_false",
      "options": ["Option A", "Option B", "Option C", "Option D"] (for multiple choice only),
      "correctAnswer": "Correct answer here" (for objective questions),
      "points": 3
    }
  ]
}`;

  // Add task-specific guidance
  switch (taskType) {
    case 'comprehension':
      return basePrompt + `\n\nFocus on testing understanding of main ideas, supporting details, character development, plot progression, and theme comprehension.`;
    
    case 'vocabulary':
      return basePrompt + `\n\nFocus on challenging vocabulary from the text, context clues, word meanings, synonyms, antonyms, and usage in sentences.`;
    
    case 'creative':
      return basePrompt + `\n\nFocus on creative writing prompts, alternative endings, character perspectives, story extensions, and imaginative responses.`;
    
    case 'discussion':
      return basePrompt + `\n\nFocus on open-ended questions that promote critical thinking, ethical discussions, real-world connections, and collaborative learning.`;
    
    case 'analysis':
      return basePrompt + `\n\nFocus on literary analysis, author's techniques, symbolism, themes, historical context, and comparative analysis.`;
    
    default:
      return basePrompt;
  }
}

function parseAITaskResponse(content: string, taskType: string, difficulty: string): any {
  try {
    // Try to parse as JSON first
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    
    // Fallback: Create a basic task structure if JSON parsing fails
    const lines = content.split('\n').filter(line => line.trim());
    
    return {
      title: `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} Task`,
      description: lines[0] || `A ${difficulty.toLowerCase()} level ${taskType} task based on the selected book.`,
      estimatedTime: getEstimatedTime(taskType, difficulty),
      questions: [
        {
          question: lines[1] || "What is the main theme of this story?",
          type: "short_answer",
          points: 3
        }
      ]
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Create default task structure
    return {
      title: `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} Task`,
      description: `A ${difficulty.toLowerCase()} level ${taskType} task based on the selected book.`,
      estimatedTime: getEstimatedTime(taskType, difficulty),
      questions: [
        {
          question: "Describe your understanding of the main themes in this text.",
          type: "essay",
          points: 5
        }
      ]
    };
  }
}

function getEstimatedTime(taskType: string, difficulty: string): number {
  const baseTime = {
    'comprehension': 20,
    'vocabulary': 15,
    'creative': 30,
    'discussion': 25,
    'analysis': 35
  };
  
  const difficultyMultiplier = {
    'BEGINNER': 0.8,
    'INTERMEDIATE': 1.0,
    'ADVANCED': 1.3
  };
  
  return Math.round((baseTime[taskType as keyof typeof baseTime] || 20) * 
                   (difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1.0));
}