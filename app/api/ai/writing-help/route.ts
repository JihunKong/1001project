import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getWritingHelp } from '@/lib/ai/openai';
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

    const { content, question, submissionId } = await req.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: '궁금한 것을 질문해주세요' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const helpResponse = await getWritingHelp(content || '', question);

    const processingTime = Date.now() - startTime;

    if (submissionId) {
      await prisma.aIReview.create({
        data: {
          submissionId,
          reviewType: 'WRITING_HELP',
          feedback: { question, answer: helpResponse } as any,
          suggestions: [helpResponse],
          status: 'COMPLETED',
          modelUsed: 'gpt-4o-mini',
          processingTime,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        question,
        answer: helpResponse,
      },
      message: 'AI 도우미가 답변했습니다! 💡',
    });

  } catch (error) {
    console.error('Writing help error:', error);

    return NextResponse.json({
      success: false,
      error: 'AI 도우미에 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
      data: {
        question: '',
        answer: '죄송해요, 지금은 대답할 수 없어요. 나중에 다시 물어봐주세요! 🤗'
      }
    }, { status: 500 });
  }
}
