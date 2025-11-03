import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeStructure } from '@/lib/ai/openai';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

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
        { error: '분석할 내용을 입력해주세요' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const structureResult = await analyzeStructure(content);

    const processingTime = Date.now() - startTime;

    if (submissionId) {
      await prisma.aIReview.create({
        data: {
          submissionId,
          reviewType: 'STRUCTURE',
          feedback: structureResult as any,
          score: structureResult.structureScore,
          suggestions: structureResult.suggestions,
          status: 'COMPLETED',
          modelUsed: 'gpt-4o-mini',
          processingTime,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: structureResult,
      message: '이야기 구조 분석이 완료되었습니다! 📖',
    });

  } catch (error) {
    logger.error('Structure analysis error', error);

    return NextResponse.json({
      success: false,
      error: 'AI 구조 분석에 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
      data: {
        structureScore: 0,
        hasIntro: false,
        hasBody: false,
        hasConclusion: false,
        suggestions: ['지금은 AI가 쉬고 있어요. 나중에 다시 확인해주세요! 📚']
      }
    }, { status: 500 });
  }
}
