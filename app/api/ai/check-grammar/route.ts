import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkGrammar } from '@/lib/ai/openai';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'WRITER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '글쓰기 권한이 필요합니다' },
        { status: 403 }
      );
    }

    const { content, submissionId } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '검사할 내용을 입력해주세요' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const grammarResult = await checkGrammar(content);

    const processingTime = Date.now() - startTime;

    if (submissionId) {
      await prisma.aIReview.create({
        data: {
          submissionId,
          reviewType: 'GRAMMAR',
          feedback: grammarResult as any,
          score: grammarResult.grammarScore,
          suggestions: grammarResult.suggestions,
          status: 'COMPLETED',
          modelUsed: 'gpt-5-mini',
          processingTime,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: grammarResult,
      message: '문법 검사가 완료되었습니다! 😊',
    });

  } catch (error) {
    console.error('Grammar check error:', error);

    return NextResponse.json({
      success: false,
      error: 'AI 문법 검사에 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
      data: {
        grammarIssues: [],
        grammarScore: 0,
        suggestions: ['지금은 AI가 쉬고 있어요. 나중에 다시 확인해주세요! 😊']
      }
    }, { status: 500 });
  }
}
