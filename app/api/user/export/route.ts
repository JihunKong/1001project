import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DataExportService } from '@/lib/data-export';

const exportService = new DataExportService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestId = await exportService.createExportRequest(session.user.id);

    exportService.processExport(requestId).catch((error) => {
      console.error('Export processing error:', error);
    });

    return NextResponse.json({
      success: true,
      exportId: requestId,
      message: 'Export request created. Processing will begin shortly.',
      statusUrl: `/api/user/export/${requestId}`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'An export request is already in progress') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('Export request error:', error);
    return NextResponse.json({ error: 'Failed to create export request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const history = await exportService.getUserExportHistory(session.user.id);

    return NextResponse.json({
      success: true,
      exports: history,
    });
  } catch (error) {
    console.error('Export history error:', error);
    return NextResponse.json({ error: 'Failed to get export history' }, { status: 500 });
  }
}
